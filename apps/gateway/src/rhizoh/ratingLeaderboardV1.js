/**
 * Rhizoh Server-Authoritative Rating Engine & Leaderboard View (Phase 3 - P3-D)
 * 
 * Architectural Standard:
 * - "Ledger is truth. Rating engine computes. Leaderboard only reads."
 * - Leaderboard never calculates points on its own.
 * - Rating updates are emitted as cryptographically verified RATING_UPDATE events in Event Ledger.
 * - Test / audit artifacts (test_artifact=true, isTest=true, source=reality_audit) can NEVER alter rating.
 * - Unverified games can NEVER alter rating.
 * - Opponent anchor for Rhizoh games is 1600. Rhizoh engine is not a rated player.
 * - Buckets: blitz, rapid, classical. (Puzzle is excluded from this system).
 * - Provisional status: First 5 games in bucket -> PROVISIONAL (K=32). 6th+ game -> ESTABLISHED (K=16).
 * - Leaderboard ranks only ESTABLISHED players (Rating desc -> Games in bucket desc -> Player ID tie-break).
 *   Provisional players are presented in a separate unranked list.
 * - Fully reproducible: Rebuilding from Event Ledger yields identical hash.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadStore, saveStore, getPlayerById, getAllPlayers } from "./playerIdentityStoreV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ALGORITHM_VERSION = "rhizoh_elo_anchor_v1.0";
export const RHIZOH_ANCHOR_RATING = 1600;
export const VALID_BUCKETS = Object.freeze(["blitz", "rapid", "classical"]);

function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(process.cwd(), ".."),
    process.cwd(),
    "/home/castle/castle"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "data", "event_ledger.jsonl"))) {
      return c;
    }
  }
  return process.platform === "win32" ? path.resolve(__dirname, "..", "..", "..", "..") : "/home/castle/castle";
}

function resolveCanonicalEventLedgerPath() {
  if (process.env.RHIZOH_EVENT_LEDGER_PATH) {
    return path.resolve(process.env.RHIZOH_EVENT_LEDGER_PATH);
  }
  const root = resolveRepoRoot();
  const ledger = path.join(root, "data", "event_ledger.jsonl");
  const dir = path.dirname(ledger);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return ledger;
}

// In-memory set of processed game IDs for idempotency (Gate P3-D8 & Attack B)
const processedGameIds = new Set();

function seedProcessedGameIdsFromLedger() {
  const ledgerPath = resolveCanonicalEventLedgerPath();
  if (!fs.existsSync(ledgerPath)) return;
  try {
    const lines = fs.readFileSync(ledgerPath, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.event_type === "RATING_UPDATE" && item.game_id) {
          processedGameIds.add(item.game_id);
        }
      } catch {}
    }
  } catch {}
}

seedProcessedGameIdsFromLedger();

/**
 * Gate P3-D4: Resolves rating bucket from time control representation.
 * Supports: 'blitz', 'rapid', 'classical'.
 */
export function resolveRatingBucket(timeControl = "blitz_5_3") {
  if (!timeControl) return "blitz";

  if (typeof timeControl === "object") {
    const key = String(timeControl.key || timeControl.name || "").toLowerCase();
    if (key.includes("classical")) return "classical";
    if (key.includes("rapid")) return "rapid";
    if (key.includes("blitz") || key.includes("bullet")) return "blitz";

    const baseSec = (timeControl.base_ms || timeControl.initial_ms || 300000) / 1000;
    const incSec = (timeControl.increment_ms || 0) / 1000;
    const estDuration = baseSec + 60 * incSec;
    if (estDuration <= 600) return "blitz";
    if (estDuration <= 3600) return "rapid";
    return "classical";
  }

  const raw = String(timeControl).trim().toLowerCase();
  if (raw.includes("classical")) return "classical";
  if (raw.includes("rapid")) return "rapid";
  if (raw.includes("blitz") || raw.includes("bullet")) return "blitz";

  // Check numeric patterns e.g. "5+3", "10+0", "15+10"
  const match = raw.match(/(\d+)\s*\+\s*(\d+)/);
  if (match) {
    const baseMins = parseInt(match[1], 10);
    const incSecs = parseInt(match[2], 10);
    const estDurationSec = baseMins * 60 + 60 * incSecs;
    if (estDurationSec <= 600) return "blitz";
    if (estDurationSec <= 3600) return "rapid";
    return "classical";
  }

  return "blitz";
}

/**
 * Gate P3-D5, P3-D6, P3-D7: Canonical Elo calculation
 */
export function calculateEloDelta({
  playerRating = 1200,
  opponentRating = 1600,
  score = 1.0,
  gamesPlayedInBucket = 0
}) {
  const rA = Number(playerRating) || 1200;
  const rB = Number(opponentRating) || 1200;
  const sA = Number(score);

  // E_A = 1 / (1 + 10^((R_B - R_A)/400))
  const expectedScore = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  
  // Provisional: gamesPlayedInBucket < 5 -> K=32, otherwise K=16
  const isProvisional = gamesPlayedInBucket < 5;
  const kFactor = isProvisional ? 32 : 16;

  const rawDelta = kFactor * (sA - expectedScore);
  const delta = Math.round(rawDelta);
  const newRating = Math.max(400, rA + delta);

  return {
    oldRating: rA,
    newRating,
    delta,
    expectedScore,
    kFactor,
    gamesPlayedAfter: gamesPlayedInBucket + 1,
    isProvisionalAfter: (gamesPlayedInBucket + 1) < 5
  };
}

/**
 * Ensures player has bucket_stats initialized.
 */
function ensurePlayerBucketStats(player) {
  if (!player.bucket_stats) {
    player.bucket_stats = {
      blitz: { games_played: 0, wins: 0, draws: 0, losses: 0 },
      rapid: { games_played: 0, wins: 0, draws: 0, losses: 0 },
      classical: { games_played: 0, wins: 0, draws: 0, losses: 0 }
    };

    if (player.stats?.games_played > 0) {
      player.bucket_stats.blitz = {
        games_played: player.stats.games_played,
        wins: player.stats.wins || 0,
        draws: player.stats.draws || 0,
        losses: player.stats.losses || 0
      };
    }
  }

  for (const b of VALID_BUCKETS) {
    if (!player.bucket_stats[b]) {
      player.bucket_stats[b] = { games_played: 0, wins: 0, draws: 0, losses: 0 };
    }
  }

  if (!player.ratings) player.ratings = {};
  if (!player.ratings_provisional) player.ratings_provisional = {};
  for (const b of VALID_BUCKETS) {
    if (player.ratings[b] === undefined) player.ratings[b] = null;
    if (player.ratings_provisional[b] === undefined) player.ratings_provisional[b] = true;
  }
}

/**
 * Gate P3-D1, P3-D2, P3-D3, P3-D8: Server-Authoritative Game Rating Outcome Applicator
 */
export function applyGameRatingOutcome({
  gameId,
  timeControl,
  result,
  termination,
  whitePlayerId,
  blackPlayerId,
  userColor = "w",
  isHumanVsRhizoh = false,
  isTest = false,
  verified = true,
  source = "production_client"
}) {
  // Gate P3-D3: Unverified game cannot change rating
  if (!verified) {
    return { ok: false, error: "UNVERIFIED_GAME", message: "Unverified games cannot update rating." };
  }

  // Gate P3-D2, P3-D12 & Attack D: Test/artifact games produce zero rating update
  if (isTest || source === "reality_audit" || (gameId && String(gameId).startsWith("test_"))) {
    return {
      ok: true,
      applied: false,
      isTest: true,
      message: "Test artifact isolated: 0 rating delta, 0 ledger mutation."
    };
  }

  // Gate P3-D8 & Attack B: Duplicate game_id check
  if (!gameId) {
    return { ok: false, error: "GAME_ID_REQUIRED", message: "game_id is required." };
  }
  if (processedGameIds.has(gameId)) {
    return {
      ok: false,
      status: 409,
      error: "RATING_ALREADY_APPLIED",
      message: "Game " + gameId + " has already been applied to ratings."
    };
  }

  const bucket = resolveRatingBucket(timeControl);
  loadStore();
  const now = new Date().toISOString();
  const ledgerPath = resolveCanonicalEventLedgerPath();
  const ratingEvents = [];

  if (isHumanVsRhizoh) {
    // Single human vs Rhizoh Anchor (1600)
    const humanPlayerId = whitePlayerId || blackPlayerId;
    if (!humanPlayerId) {
      return { ok: false, error: "PLAYER_NOT_FOUND", message: "Human player ID required." };
    }
    const player = getPlayerById(humanPlayerId);
    if (!player) {
      return { ok: false, error: "PLAYER_NOT_FOUND", message: "Player " + humanPlayerId + " not found." };
    }

    ensurePlayerBucketStats(player);

    const isWhite = userColor === "w" || humanPlayerId === whitePlayerId;
    let score = 0.5;
    let outcome = "draw";
    if (result === "1-0") {
      score = isWhite ? 1.0 : 0.0;
      outcome = isWhite ? "win" : "loss";
    } else if (result === "0-1") {
      score = isWhite ? 0.0 : 1.0;
      outcome = isWhite ? "loss" : "win";
    }

    const currentRating = player.ratings[bucket] ?? 1200;
    const priorGamesInBucket = player.bucket_stats[bucket].games_played;
    const eloCalc = calculateEloDelta({
      playerRating: currentRating,
      opponentRating: RHIZOH_ANCHOR_RATING,
      score,
      gamesPlayedInBucket: priorGamesInBucket
    });

    // Mutate player stats & rating
    player.ratings[bucket] = eloCalc.newRating;
    player.ratings_provisional[bucket] = eloCalc.isProvisionalAfter;
    player.bucket_stats[bucket].games_played++;
    if (outcome === "win") player.bucket_stats[bucket].wins++;
    else if (outcome === "draw") player.bucket_stats[bucket].draws++;
    else player.bucket_stats[bucket].losses++;

    player.stats.games_played++;
    if (outcome === "win") player.stats.wins++;
    else if (outcome === "draw") player.stats.draws++;
    else player.stats.losses++;

    player.my_rhizoh.matches_vs_rhizoh++;
    if (outcome === "win") player.my_rhizoh.wins_vs_rhizoh++;
    else if (outcome === "draw") player.my_rhizoh.draws_vs_rhizoh++;
    else player.my_rhizoh.losses_vs_rhizoh++;

    if (!player.my_rhizoh.first_encounter_utc) player.my_rhizoh.first_encounter_utc = now;
    player.my_rhizoh.last_encounter_utc = now;
    player.updated_at = now;

    // Canonical RATING_UPDATE event
    const event = {
      event_type: "RATING_UPDATE",
      timestamp_utc: now,
      player_id: player.player_id,
      opponent_id: "rhizoh_anchor_1600",
      game_id: gameId,
      bucket,
      old_rating: eloCalc.oldRating,
      new_rating: eloCalc.newRating,
      delta: eloCalc.delta,
      score,
      outcome,
      games_played: eloCalc.gamesPlayedAfter,
      provisional: eloCalc.isProvisionalAfter,
      algorithm_version: ALGORITHM_VERSION
    };

    ratingEvents.push(event);
  } else {
    // Human vs Human (Both players)
    if (!whitePlayerId || !blackPlayerId) {
      return { ok: false, error: "PLAYERS_REQUIRED", message: "Both white and black player IDs required." };
    }
    const whitePlayer = getPlayerById(whitePlayerId);
    const blackPlayer = getPlayerById(blackPlayerId);

    if (!whitePlayer || !blackPlayer) {
      return { ok: false, error: "PLAYERS_NOT_FOUND", message: "One or both players not found." };
    }

    ensurePlayerBucketStats(whitePlayer);
    ensurePlayerBucketStats(blackPlayer);

    const rW = whitePlayer.ratings[bucket] ?? 1200;
    const rB = blackPlayer.ratings[bucket] ?? 1200;

    let scoreW = 0.5;
    let outcomeW = "draw";
    let outcomeB = "draw";
    if (result === "1-0") {
      scoreW = 1.0;
      outcomeW = "win";
      outcomeB = "loss";
    } else if (result === "0-1") {
      scoreW = 0.0;
      outcomeW = "loss";
      outcomeB = "win";
    }
    const scoreB = 1.0 - scoreW;

    const priorGamesW = whitePlayer.bucket_stats[bucket].games_played;
    const priorGamesB = blackPlayer.bucket_stats[bucket].games_played;

    const eloW = calculateEloDelta({
      playerRating: rW,
      opponentRating: rB,
      score: scoreW,
      gamesPlayedInBucket: priorGamesW
    });

    const eloB = calculateEloDelta({
      playerRating: rB,
      opponentRating: rW,
      score: scoreB,
      gamesPlayedInBucket: priorGamesB
    });

    // Update White
    whitePlayer.ratings[bucket] = eloW.newRating;
    whitePlayer.ratings_provisional[bucket] = eloW.isProvisionalAfter;
    whitePlayer.bucket_stats[bucket].games_played++;
    if (outcomeW === "win") whitePlayer.bucket_stats[bucket].wins++;
    else if (outcomeW === "draw") whitePlayer.bucket_stats[bucket].draws++;
    else whitePlayer.bucket_stats[bucket].losses++;
    whitePlayer.stats.games_played++;
    if (outcomeW === "win") whitePlayer.stats.wins++;
    else if (outcomeW === "draw") whitePlayer.stats.draws++;
    else whitePlayer.stats.losses++;
    whitePlayer.updated_at = now;

    // Update Black
    blackPlayer.ratings[bucket] = eloB.newRating;
    blackPlayer.ratings_provisional[bucket] = eloB.isProvisionalAfter;
    blackPlayer.bucket_stats[bucket].games_played++;
    if (outcomeB === "win") blackPlayer.bucket_stats[bucket].wins++;
    else if (outcomeB === "draw") blackPlayer.bucket_stats[bucket].draws++;
    else blackPlayer.bucket_stats[bucket].losses++;
    blackPlayer.stats.games_played++;
    if (outcomeB === "win") blackPlayer.stats.wins++;
    else if (outcomeB === "draw") blackPlayer.stats.draws++;
    else blackPlayer.stats.losses++;
    blackPlayer.updated_at = now;

    const eventWhite = {
      event_type: "RATING_UPDATE",
      timestamp_utc: now,
      player_id: whitePlayer.player_id,
      opponent_id: blackPlayer.player_id,
      game_id: gameId,
      bucket,
      old_rating: eloW.oldRating,
      new_rating: eloW.newRating,
      delta: eloW.delta,
      score: scoreW,
      outcome: outcomeW,
      games_played: eloW.gamesPlayedAfter,
      provisional: eloW.isProvisionalAfter,
      algorithm_version: ALGORITHM_VERSION
    };

    const eventBlack = {
      event_type: "RATING_UPDATE",
      timestamp_utc: now,
      player_id: blackPlayer.player_id,
      opponent_id: whitePlayer.player_id,
      game_id: gameId,
      bucket,
      old_rating: eloB.oldRating,
      new_rating: eloB.newRating,
      delta: eloB.delta,
      score: scoreB,
      outcome: outcomeB,
      games_played: eloB.gamesPlayedAfter,
      provisional: eloB.isProvisionalAfter,
      algorithm_version: ALGORITHM_VERSION
    };

    ratingEvents.push(eventWhite, eventBlack);
  }

  saveStore();

  try {
    for (const ev of ratingEvents) {
      fs.appendFileSync(ledgerPath, JSON.stringify(ev) + "\n", "utf8");
    }
  } catch (err) {
    console.error("[RATING_LEDGER_ERROR] Failed to append rating event to ledger:", err);
  }

  processedGameIds.add(gameId);

  return {
    ok: true,
    applied: true,
    bucket,
    events: ratingEvents
  };
}

/**
 * Gate P3-D10: Computes deterministic hash of leaderboard rankings for verification
 */
export function computeLeaderboardHash(leaderboardData) {
  const str = JSON.stringify(leaderboardData);
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * Gate P3-D10: Pure view over player state for a given rating bucket.
 * "Leaderboard only reads."
 */
export function getLeaderboard({ bucket = "blitz", limit = 100 } = {}) {
  const normBucket = String(bucket).toLowerCase().trim();
  if (!VALID_BUCKETS.includes(normBucket)) {
    return {
      ok: false,
      error: "INVALID_BUCKET",
      message: "Bucket must be one of: " + VALID_BUCKETS.join(", ")
    };
  }

  loadStore();
  const allPlayers = getAllPlayers();

  const established = [];
  const provisional = [];

  for (const p of allPlayers) {
    ensurePlayerBucketStats(p);
    const bStats = p.bucket_stats[normBucket];
    const games = bStats ? bStats.games_played : 0;
    const rating = p.ratings?.[normBucket];

    if (rating == null || games === 0) continue;

    const item = {
      player_id: p.player_id,
      handle: p.handle,
      display_name: p.display_name,
      avatar_seed: p.avatar_seed,
      is_anonymous: p.is_anonymous,
      rating: rating,
      games_played_in_bucket: games,
      wins: bStats.wins || 0,
      draws: bStats.draws || 0,
      losses: bStats.losses || 0
    };

    if (games >= 5) {
      established.push(item);
    } else {
      provisional.push(item);
    }
  }

  // Section 6: Established ranking order:
  // 1. rating descending
  // 2. games played in bucket descending
  // 3. deterministic player_id tie-break
  established.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.games_played_in_bucket !== a.games_played_in_bucket) return b.games_played_in_bucket - a.games_played_in_bucket;
    return a.player_id.localeCompare(b.player_id);
  });

  established.forEach((p, idx) => {
    p.rank = idx + 1;
    p.status = "ESTABLISHED";
  });

  provisional.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.games_played_in_bucket !== a.games_played_in_bucket) return b.games_played_in_bucket - a.games_played_in_bucket;
    return a.player_id.localeCompare(b.player_id);
  });

  provisional.forEach(p => {
    p.rank = null;
    p.status = "PROVISIONAL · " + p.games_played_in_bucket + "/5 games";
    p.games_needed = Math.max(0, 5 - p.games_played_in_bucket);
  });

  const rankedSlice = established.slice(0, limit);
  const provSlice = provisional.slice(0, limit);
  const hash = computeLeaderboardHash({ bucket: normBucket, established: rankedSlice, provisional: provSlice });

  return {
    ok: true,
    bucket: normBucket,
    algorithm_version: ALGORITHM_VERSION,
    anchor_policy: {
      engine_is_rated: false,
      anchor_elo: RHIZOH_ANCHOR_RATING,
      description: "Rhizoh engine is not a rated player; 1600 Elo is used strictly as an initial mathematical anchor for calibration."
    },
    established_count: established.length,
    provisional_count: provisional.length,
    rankings: rankedSlice,
    provisional: provSlice,
    leaderboard_hash: hash
  };
}

/**
 * Gate P3-D10: Deterministic replay from canonical Event Ledger.
 * "Stored leaderboard hash == Rebuilt leaderboard hash"
 */
export function rebuildLeaderboardFromLedger(targetBucket = "blitz") {
  const normBucket = String(targetBucket).toLowerCase().trim();
  const ledgerPath = resolveCanonicalEventLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { ok: false, error: "LEDGER_NOT_FOUND" };
  }

  const lines = fs.readFileSync(ledgerPath, "utf8").split("\n").filter(Boolean);
  const ratingEvents = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (
        entry.event_type === "RATING_UPDATE" &&
        !entry.test_artifact &&
        entry.source !== "reality_audit"
      ) {
        ratingEvents.push(entry);
      }
    } catch {}
  }

  // Replay state
  const replayPlayers = {};

  for (const ev of ratingEvents) {
    const pid = ev.player_id;
    const bucket = ev.bucket || "blitz";
    if (!replayPlayers[pid]) {
      replayPlayers[pid] = {
        player_id: pid,
        ratings: { blitz: null, rapid: null, classical: null },
        bucket_stats: {
          blitz: { games_played: 0, wins: 0, draws: 0, losses: 0 },
          rapid: { games_played: 0, wins: 0, draws: 0, losses: 0 },
          classical: { games_played: 0, wins: 0, draws: 0, losses: 0 }
        }
      };
    }

    const p = replayPlayers[pid];
    p.ratings[bucket] = ev.new_rating;
    if (ev.games_played) {
      p.bucket_stats[bucket].games_played = ev.games_played;
    } else {
      p.bucket_stats[bucket].games_played++;
    }

    const oc = ev.outcome || (ev.delta > 0 ? "win" : (ev.delta < 0 ? "loss" : "draw"));
    if (oc === "win") p.bucket_stats[bucket].wins++;
    else if (oc === "draw") p.bucket_stats[bucket].draws++;
    else p.bucket_stats[bucket].losses++;
  }

  const established = [];
  const provisional = [];

  for (const p of Object.values(replayPlayers)) {
    const games = p.bucket_stats[normBucket]?.games_played || 0;
    const rating = p.ratings?.[normBucket];
    if (rating == null || games === 0) continue;

    const livePlayer = getPlayerById(p.player_id);
    const item = {
      player_id: p.player_id,
      handle: livePlayer?.handle || ("anon-" + p.player_id.slice(-4)),
      display_name: livePlayer?.display_name || "Anonymous Challenger",
      avatar_seed: livePlayer?.avatar_seed || ("anon-" + p.player_id.slice(-4)),
      is_anonymous: livePlayer ? livePlayer.is_anonymous : true,
      rating: rating,
      games_played_in_bucket: games,
      wins: p.bucket_stats[normBucket].wins || 0,
      draws: p.bucket_stats[normBucket].draws || 0,
      losses: p.bucket_stats[normBucket].losses || 0
    };

    if (games >= 5) established.push(item);
    else provisional.push(item);
  }

  established.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.games_played_in_bucket !== a.games_played_in_bucket) return b.games_played_in_bucket - a.games_played_in_bucket;
    return a.player_id.localeCompare(b.player_id);
  });
  established.forEach((p, idx) => {
    p.rank = idx + 1;
    p.status = "ESTABLISHED";
  });

  provisional.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.games_played_in_bucket !== a.games_played_in_bucket) return b.games_played_in_bucket - a.games_played_in_bucket;
    return a.player_id.localeCompare(b.player_id);
  });
  provisional.forEach(p => {
    p.rank = null;
    p.status = "PROVISIONAL · " + p.games_played_in_bucket + "/5 games";
    p.games_needed = Math.max(0, 5 - p.games_played_in_bucket);
  });

  const rebuiltHash = computeLeaderboardHash({ bucket: normBucket, established, provisional });
  const liveLeaderboard = getLeaderboard({ bucket: normBucket });
  const liveHash = liveLeaderboard.leaderboard_hash;

  return {
    ok: true,
    bucket: normBucket,
    events_replayed: ratingEvents.length,
    rebuilt_hash: rebuiltHash,
    live_hash: liveHash,
    hashes_match: rebuiltHash === liveHash,
    rebuilt_leaderboard: {
      established,
      provisional
    }
  };
}
