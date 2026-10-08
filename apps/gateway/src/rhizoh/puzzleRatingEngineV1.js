/**
 * Rhizoh Server-Authoritative Puzzle Rating Engine (Phase 4 - P4-B)
 * 
 * Architectural Standard:
 * - "Ledger is truth. Rating engine computes. Leaderboard/profile only reads."
 * - Client cannot declare rating or score delta.
 * - Puzzle Rating is strictly independent from Player Chess Ratings (Blitz/Rapid/Classical).
 * - Dual-Calibration: Player rating reflects tactical strength, Puzzle rating reflects empirical difficulty.
 * - ZERO HOLDOUT LEAKAGE: Quarantined & test puzzles produce ZERO production rating or ledger mutations.
 * - Fully deterministic & reproducible from Event Ledger.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  loadStore as loadPlayerStore,
  saveStore as savePlayerStore,
  getPlayerById,
  getAllPlayers,
  getPlayerByToken,
  verifyPlayerOwnership
} from "./playerIdentityStoreV1.js";
import {
  loadPuzzlesStore,
  savePuzzlesStore,
  getPuzzleById
} from "./puzzleAuthorityV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PUZZLE_RATING_ALGORITHM = "rhizoh_puzzle_elo_v1.0";
export const DEFAULT_PLAYER_PUZZLE_ANCHOR = 1500;
export const DEFAULT_PUZZLE_DIFFICULTY_ANCHOR = 1400;
export const PROVISIONAL_THRESHOLD = 20; // 20 attempts for established puzzle rating

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

// In-memory set of processed attempt IDs for idempotency
const processedAttemptIds = new Set();

/**
 * Gate P4-B5 & P4-B6:
 * Mathematical Elo computation for Puzzle vs Player.
 */
export function calculatePuzzleEloDelta({
  playerRating = DEFAULT_PLAYER_PUZZLE_ANCHOR,
  puzzleRating = DEFAULT_PUZZLE_DIFFICULTY_ANCHOR,
  solved = false,
  isProvisional = true
}) {
  const pr = Math.max(100, Number(playerRating) || DEFAULT_PLAYER_PUZZLE_ANCHOR);
  const zr = Math.max(100, Number(puzzleRating) || DEFAULT_PUZZLE_DIFFICULTY_ANCHOR);

  // Expected player score: 1 / (1 + 10 ^ ((puzzleRating - playerRating) / 400))
  const exponent = (zr - pr) / 400.0;
  const expectedPlayerScore = 1.0 / (1.0 + Math.pow(10, exponent));

  // Player K-factor: 40 if provisional, 20 if established
  const kPlayer = isProvisional ? 40 : 20;
  const actualScore = solved ? 1.0 : 0.0;

  const rawPlayerDelta = kPlayer * (actualScore - expectedPlayerScore);
  const playerDelta = Math.round(rawPlayerDelta);
  const newPlayerRating = Math.max(100, pr + playerDelta);

  // Community Puzzle Calibration K-factor: 10 (gradual calibration)
  const kPuzzle = 10;
  // If player solved (S=1), puzzle proved easier than expected, rating drops.
  // If player failed (S=0), puzzle proved harder than expected, rating rises.
  const rawPuzzleDelta = kPuzzle * (expectedPlayerScore - actualScore);
  const puzzleDelta = Math.round(rawPuzzleDelta);
  const newPuzzleRating = Math.max(100, zr + puzzleDelta);

  return {
    playerDelta,
    newPlayerRating,
    puzzleDelta,
    newPuzzleRating,
    expectedPlayerScore: Number(expectedPlayerScore.toFixed(4)),
    kPlayer,
    kPuzzle
  };
}

/**
 * Gate P4-B1, P4-B2, P4-B3, P4-B4, P4-B7, P4-B8, P4-B9, P4-B10, P4-B11:
 * Server-Authoritative Puzzle Rating Outcome Applicator.
 */
export function applyPuzzleRatingOutcome({
  playerId,
  puzzleId,
  solved = false,
  isTest = false,
  attemptId = null,
  token = null,
  source = "production_client",
  firstMoveCorrect = false,
  solveTimeSeconds = null,
  category = null,
  motifs = []
}) {
  if (!playerId) {
    return { ok: false, status: 400, error: "PLAYER_ID_REQUIRED", message: "playerId is required." };
  }
  if (!puzzleId) {
    return { ok: false, status: 400, error: "PUZZLE_ID_REQUIRED", message: "puzzleId is required." };
  }

  // Gate P4-B9: Player token verification if provided
  if (token) {
    const isOwner = verifyPlayerOwnership(token, playerId);
    if (!isOwner) {
      return { ok: false, status: 403, error: "PLAYER_OWNERSHIP_VIOLATION", message: "Token does not own playerId." };
    }
  }

  loadPlayerStore(true);
  const player = getPlayerById(playerId);
  if (!player) {
    return { ok: false, status: 404, error: "PLAYER_NOT_FOUND", message: "Player " + playerId + " not found." };
  }

  loadPuzzlesStore(true);
  const puzzle = getPuzzleById(puzzleId);
  if (!puzzle) {
    return { ok: false, status: 404, error: "PUZZLE_NOT_FOUND", message: "Puzzle " + puzzleId + " not found." };
  }

  // Gate P4-B3: Quarantine veto
  if (puzzle.status === "QUARANTINED") {
    return {
      ok: false,
      status: 403,
      error: "PUZZLE_QUARANTINED",
      message: "Quarantined holdout puzzles cannot alter ratings."
    };
  }

  // Ensure deterministic attempt ID
  const effectiveAttemptId = attemptId || ("att_" + crypto.createHash("sha256").update(playerId + ":" + puzzleId + ":" + Date.now()).digest("hex").slice(0, 16));

  // Gate P4-B8: Duplicate check
  if (processedAttemptIds.has(effectiveAttemptId)) {
    return {
      ok: false,
      status: 409,
      error: "ATTEMPT_ALREADY_RATED",
      message: "Attempt " + effectiveAttemptId + " has already been rated."
    };
  }

  // Gate P4-B4: Test artifact / test puzzle isolation
  const isTestAttempt = Boolean(isTest || puzzle.is_test || source === "reality_audit" || effectiveAttemptId.startsWith("test_"));

  // Ensure player puzzle schema fields exist
  if (!player.ratings) player.ratings = {};
  if (player.ratings.puzzle === null || player.ratings.puzzle === undefined) {
    player.ratings.puzzle = DEFAULT_PLAYER_PUZZLE_ANCHOR;
  }
  if (!player.ratings_provisional) player.ratings_provisional = {};
  if (player.ratings_provisional.puzzle === undefined) {
    player.ratings_provisional.puzzle = true;
  }
  if (!player.puzzle_stats) {
    player.puzzle_stats = {
      attempts: 0,
      solved: 0,
      failed: 0,
      solve_rate_pct: 0,
      last_attempt_at: null
    };
  }

  const currentPlayRating = player.ratings.puzzle;
  const currentPuzRating = Number(puzzle.puzzle_rating || puzzle.difficulty_features?.rating_estimate || DEFAULT_PUZZLE_DIFFICULTY_ANCHOR);
  const isProvBefore = Boolean(player.ratings_provisional.puzzle);

  const eloResult = calculatePuzzleEloDelta({
    playerRating: currentPlayRating,
    puzzleRating: currentPuzRating,
    solved,
    isProvisional: isProvBefore
  });

  const now = new Date().toISOString();

  // If test attempt, return simulated rating outcome with ZERO persistence and ZERO ledger update
  if (isTestAttempt) {
    return {
      ok: true,
      applied: false,
      isTest: true,
      message: "Test attempt isolated: 0 production rating delta, 0 ledger mutation.",
      player_update: {
        player_id: playerId,
        old_rating: currentPlayRating,
        new_rating: eloResult.newPlayerRating,
        delta: eloResult.playerDelta,
        provisional: isProvBefore
      },
      puzzle_update: {
        puzzle_id: puzzleId,
        old_rating: currentPuzRating,
        new_rating: eloResult.newPuzzleRating,
        delta: eloResult.puzzleDelta
      }
    };
  }

  // Gate P4-B1: Modify ONLY puzzle rating, preserving chess ratings intact!
  player.ratings.puzzle = eloResult.newPlayerRating;
  player.puzzle_stats.attempts++;
  if (solved) player.puzzle_stats.solved++;
  else player.puzzle_stats.failed++;

  const attemptsAfter = player.puzzle_stats.attempts;
  const isProvAfter = attemptsAfter < PROVISIONAL_THRESHOLD;
  player.ratings_provisional.puzzle = isProvAfter;
  player.puzzle_stats.solve_rate_pct = Number(((player.puzzle_stats.solved / attemptsAfter) * 100).toFixed(1));
  player.puzzle_stats.last_attempt_at = now;
  player.updated_at = now;

  // P4-C Analytics: First-move metrics
  if (!player.puzzle_stats.first_move) {
    player.puzzle_stats.first_move = { attempts: 0, correct: 0, accuracy_pct: null };
  }
  player.puzzle_stats.first_move.attempts++;
  if (firstMoveCorrect) player.puzzle_stats.first_move.correct++;
  player.puzzle_stats.first_move.accuracy_pct = Number(((player.puzzle_stats.first_move.correct / player.puzzle_stats.first_move.attempts) * 100).toFixed(1));

  // P4-C Analytics: Server-authoritative solve-time metrics
  if (!player.puzzle_stats.solve_time) {
    player.puzzle_stats.solve_time = { samples: 0, times: [] };
  }
  if (solved && typeof solveTimeSeconds === "number" && solveTimeSeconds > 0) {
    player.puzzle_stats.solve_time.times.push(solveTimeSeconds);
    player.puzzle_stats.solve_time.samples = player.puzzle_stats.solve_time.times.length;
  }

  // P4-C Analytics: Tactical categories
  if (!player.puzzle_stats.categories) {
    player.puzzle_stats.categories = {};
  }
  const allCats = [];
  if (category) allCats.push(category);
  if (Array.isArray(motifs)) {
    for (const m of motifs) allCats.push(m);
  }
  for (const c of allCats) {
    if (!player.puzzle_stats.categories[c]) {
      player.puzzle_stats.categories[c] = { attempts: 0, solved: 0, accuracy_pct: null };
    }
    player.puzzle_stats.categories[c].attempts++;
    if (solved) player.puzzle_stats.categories[c].solved++;
    const catAtt = player.puzzle_stats.categories[c].attempts;
    const catSol = player.puzzle_stats.categories[c].solved;
    player.puzzle_stats.categories[c].accuracy_pct = catAtt >= 3 ? Number(((catSol / catAtt) * 100).toFixed(1)) : null;
  }

  // P4-C Analytics: Recent attempts log
  if (!Array.isArray(player.puzzle_stats.recent_attempts)) {
    player.puzzle_stats.recent_attempts = [];
  }
  player.puzzle_stats.recent_attempts.unshift({
    attempt_id: effectiveAttemptId,
    puzzle_id: puzzleId,
    timestamp: now,
    solved: Boolean(solved),
    first_move_correct: Boolean(firstMoveCorrect),
    solve_time_seconds: solveTimeSeconds,
    delta: eloResult.playerDelta,
    category: category || puzzle.category || "TACTICAL"
  });
  if (player.puzzle_stats.recent_attempts.length > 20) {
    player.puzzle_stats.recent_attempts.pop();
  }

  // Gate P4-B7: Update puzzle difficulty rating
  puzzle.puzzle_rating = eloResult.newPuzzleRating;
  if (!puzzle.difficulty_features) puzzle.difficulty_features = {};
  puzzle.difficulty_features.rating_estimate = eloResult.newPuzzleRating;
  puzzle.attempts = (puzzle.attempts || 0) + 1;
  puzzle.last_attempt_at = now;

  savePlayerStore();
  savePuzzlesStore();

  // Gate P4-B11: Canonical PUZZLE_RATING_UPDATE event written to Event Ledger
  const ratingEvent = {
    event_type: "PUZZLE_RATING_UPDATE",
    timestamp_utc: now,
    attempt_id: effectiveAttemptId,
    player_id: playerId,
    puzzle_id: puzzleId,
    solved: Boolean(solved),
    first_move_correct: Boolean(firstMoveCorrect),
    solve_time_seconds: solveTimeSeconds,
    category: category || puzzle.category || "TACTICAL",
    motifs: motifs && motifs.length > 0 ? motifs : (puzzle.difficulty_features?.motifs || []),
    old_player_rating: currentPlayRating,
    new_player_rating: eloResult.newPlayerRating,
    player_delta: eloResult.playerDelta,
    player_attempts: attemptsAfter,
    player_provisional: isProvAfter,
    old_puzzle_rating: currentPuzRating,
    new_puzzle_rating: eloResult.newPuzzleRating,
    puzzle_delta: eloResult.puzzleDelta,
    algorithm_version: PUZZLE_RATING_ALGORITHM
  };

  const ledgerPath = resolveCanonicalEventLedgerPath();
  try {
    fs.appendFileSync(ledgerPath, JSON.stringify(ratingEvent) + "\n", "utf8");
  } catch (err) {
    console.error("[PUZZLE_LEDGER_ERROR] Failed to append rating event to ledger:", err);
  }

  processedAttemptIds.add(effectiveAttemptId);

  return {
    ok: true,
    applied: true,
    event: ratingEvent,
    player_update: {
      player_id: playerId,
      old_rating: currentPlayRating,
      new_rating: eloResult.newPlayerRating,
      delta: eloResult.playerDelta,
      provisional: isProvAfter,
      attempts: attemptsAfter
    },
    puzzle_update: {
      puzzle_id: puzzleId,
      old_rating: currentPuzRating,
      new_rating: eloResult.newPuzzleRating,
      delta: eloResult.puzzleDelta
    }
  };
}

/**
 * Gate P4-B12 & P4-B14:
 * Rebuilds all player puzzle ratings and puzzle difficulties from canonical Event Ledger.
 */
export function rebuildPuzzleRatingsFromLedger() {
  const ledgerPath = resolveCanonicalEventLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { ok: false, error: "LEDGER_NOT_FOUND" };
  }

  const lines = fs.readFileSync(ledgerPath, "utf8").split("\n").filter(Boolean);
  const puzzleRatingEvents = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (
        entry.event_type === "PUZZLE_RATING_UPDATE" &&
        !entry.test_artifact &&
        entry.source !== "reality_audit"
      ) {
        puzzleRatingEvents.push(entry);
      }
    } catch {}
  }

  // Baseline published puzzles
  const store = loadPuzzlesStore(true);
  const replayPuzzles = {};
  for (const [zid, pz] of store.entries()) {
    if (pz.status === "PUBLISHED" && !pz.is_test) {
      replayPuzzles[zid] = {
        puzzle_id: zid,
        rating: DEFAULT_PUZZLE_DIFFICULTY_ANCHOR,
        attempts: 0
      };
    }
  }

  // Replay memory state from initial baseline
  const replayPlayers = {};

  for (const ev of puzzleRatingEvents) {
    const pid = ev.player_id;
    const zid = ev.puzzle_id;

    if (!replayPlayers[pid]) {
      replayPlayers[pid] = {
        player_id: pid,
        rating: DEFAULT_PLAYER_PUZZLE_ANCHOR,
        attempts: 0,
        provisional: true
      };
    }

    // Apply exact event in sequence
    replayPlayers[pid].rating = ev.new_player_rating;
    replayPlayers[pid].attempts = ev.player_attempts;
    replayPlayers[pid].provisional = ev.player_provisional;

    if (replayPuzzles[zid]) {
      replayPuzzles[zid].rating = ev.new_puzzle_rating;
      replayPuzzles[zid].attempts++;
    }
  }

  const stateHash = computePuzzleRatingStateHash(replayPlayers, replayPuzzles);

  return {
    ok: true,
    total_events: puzzleRatingEvents.length,
    replayed_players_count: Object.keys(replayPlayers).length,
    replayed_puzzles_count: Object.keys(replayPuzzles).length,
    players: replayPlayers,
    puzzles: replayPuzzles,
    state_hash: stateHash
  };
}

/**
 * Gate P4-B14: Computes deterministic state hash of all puzzle ratings
 */
export function computePuzzleRatingStateHash(playersMap = null, puzzlesMap = null) {
  let playersData = playersMap;
  if (!playersData) {
    loadPlayerStore(true);
    const list = getAllPlayers ? getAllPlayers() : [];
    const rawList = Array.isArray(list) ? list : Object.values(list);
    playersData = {};
    for (const p of rawList) {
      if (p && p.player_id && p.puzzle_stats && p.puzzle_stats.attempts > 0) {
        playersData[p.player_id] = {
          player_id: p.player_id,
          rating: p.ratings?.puzzle ?? DEFAULT_PLAYER_PUZZLE_ANCHOR,
          attempts: p.puzzle_stats?.attempts || 0,
          provisional: Boolean(p.ratings_provisional?.puzzle)
        };
      }
    }
  }

  let puzzlesData = puzzlesMap;
  if (!puzzlesData) {
    const store = loadPuzzlesStore(true);
    puzzlesData = {};
    for (const [zid, pz] of store.entries()) {
      if (pz.status === "PUBLISHED" && !pz.is_test) {
        puzzlesData[zid] = {
          puzzle_id: zid,
          rating: pz.puzzle_rating || pz.difficulty_features?.rating_estimate || DEFAULT_PUZZLE_DIFFICULTY_ANCHOR,
          attempts: pz.attempts || 0
        };
      }
    }
  }

  const sortedPlayers = Object.values(playersData).map(p => ({
    player_id: p.player_id,
    rating: p.rating,
    attempts: p.attempts,
    provisional: Boolean(p.provisional)
  })).sort((a, b) => a.player_id.localeCompare(b.player_id));

  const sortedPuzzles = Object.values(puzzlesData).map(z => ({
    puzzle_id: z.puzzle_id,
    rating: z.rating,
    attempts: z.attempts
  })).sort((a, b) => a.puzzle_id.localeCompare(b.puzzle_id));

  const canonicalObj = {
    algorithm: PUZZLE_RATING_ALGORITHM,
    players: sortedPlayers,
    puzzles: sortedPuzzles
  };

  return crypto.createHash("sha256").update(JSON.stringify(canonicalObj), "utf8").digest("hex");
}

/**
 * Returns Puzzle Leaderboard view (ranking established vs provisional)
 */
export function getPuzzleLeaderboard({ limit = 50, includeProvisional = false } = {}) {
  loadPlayerStore();
  const allPlayers = getAllPlayers ? Object.values(getAllPlayers()) : [];

  const candidates = allPlayers.filter(p => p.ratings?.puzzle !== null && p.ratings?.puzzle !== undefined);

  const established = [];
  const provisional = [];

  for (const p of candidates) {
    const rating = p.ratings.puzzle;
    const attempts = p.puzzle_stats?.attempts || 0;
    const isProv = Boolean(p.ratings_provisional?.puzzle);

    const item = {
      player_id: p.player_id,
      handle: p.handle,
      display_name: p.display_name,
      rating,
      attempts,
      solved: p.puzzle_stats?.solved || 0,
      solve_rate_pct: p.puzzle_stats?.solve_rate_pct || 0,
      is_anonymous: Boolean(p.is_anonymous)
    };

    if (isProv) provisional.push(item);
    else established.push(item);
  }

  // Established sort: rating desc, attempts desc, player_id asc
  established.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    return a.player_id.localeCompare(b.player_id);
  });
  established.forEach((item, idx) => { item.rank = idx + 1; item.status = "ESTABLISHED"; });

  // Provisional sort
  provisional.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    return a.player_id.localeCompare(b.player_id);
  });
  provisional.forEach(item => {
    item.rank = null;
    item.status = "PROVISIONAL · " + item.attempts + "/" + PROVISIONAL_THRESHOLD + " attempts";
    item.attempts_needed = Math.max(0, PROVISIONAL_THRESHOLD - item.attempts);
  });

  const rankedSlice = established.slice(0, limit);
  const provSlice = provisional.slice(0, limit);

  return {
    ok: true,
    algorithm_version: PUZZLE_RATING_ALGORITHM,
    established_count: established.length,
    provisional_count: provisional.length,
    rankings: rankedSlice,
    provisional: includeProvisional ? provSlice : undefined,
    leaderboard_hash: crypto.createHash("sha256").update(JSON.stringify(rankedSlice), "utf8").digest("hex")
  };
}
