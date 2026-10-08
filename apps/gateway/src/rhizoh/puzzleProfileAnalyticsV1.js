/**
 * Rhizoh Server-Authoritative Personal Puzzle Profile & Analytics (Phase 4 - P4-C)
 * 
 * Architectural Standard:
 * - "P4-B measured. P4-C explains."
 * - "Observation != Execution." (Analytics only, no mutation to NNUE or engine evaluation).
 * - "Data absent = UNKNOWN." (If category samples < 3, accuracy is null / unknown, never hallucinated).
 * - Server-Authoritative Clock: solve_time is measured exclusively via server timestamps.
 *   Client-reported solve_time is strictly ignored.
 * - First-Move Accuracy: distinguishes between "solved on first sight" vs "solved on retry".
 * - Strict Privacy & Ownership Boundary: only authenticated player can inspect private profile.
 * - Fully reproducible: analytics can be replayed deterministically from Event Ledger.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  loadStore as loadPlayerStore,
  saveStore as savePlayerStore,
  getPlayerById,
  getPlayerByToken,
  verifyPlayerOwnership
} from "./playerIdentityStoreV1.js";
import {
  loadPuzzlesStore,
  getPuzzleById
} from "./puzzleAuthorityV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MIN_CATEGORY_SAMPLES_FOR_ACCURACY = 3;
export const STANDARD_CATEGORIES = Object.freeze([
  "Fork",
  "Pin",
  "Skewer",
  "Discovered Attack",
  "Deflection",
  "Back Rank",
  "Mate",
  "Defensive Resource",
  "Endgame",
  "Tactical Capture",
  "TACTICAL"
]);

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

/**
 * Server-authoritative in-memory tracking of active puzzle sessions.
 * Key: `${playerId}:${puzzleId}`
 */
const activePuzzleSessions = new Map();

/**
 * Registers when a puzzle is served to a player with a server timestamp (P4-C6).
 */
export function registerPuzzleServed(playerId, puzzleId) {
  if (!playerId || !puzzleId) return null;
  const key = `${playerId}:${puzzleId}`;
  const session = {
    started_at: Date.now(),
    first_move_evaluated: false,
    first_move_correct: false,
    first_move_at: null,
    attempts_count: 0
  };
  activePuzzleSessions.set(key, session);
  return session;
}

/**
 * Evaluates timing and first-move correctness on server side (P4-C5 & P4-C6 & Attack B).
 */
export function recordPuzzleAttemptMetric({
  playerId,
  puzzleId,
  attemptId = null,
  solved = false,
  isMatch = false,
  isCompleted = false,
  isTest = false
}) {
  if (!playerId || !puzzleId) {
    return {
      first_move_correct: isMatch,
      solve_time_seconds: null
    };
  }

  const key = `${playerId}:${puzzleId}`;
  let session = activePuzzleSessions.get(key);

  // If no session registered on fetch, anchor start to now minus nominal reaction latency (800ms)
  if (!session) {
    session = {
      started_at: Date.now() - 800,
      first_move_evaluated: false,
      first_move_correct: false,
      first_move_at: null,
      attempts_count: 0
    };
    activePuzzleSessions.set(key, session);
  }

  session.attempts_count++;

  // First-move accuracy rule: record the result of the VERY FIRST move attempted on this puzzle
  if (!session.first_move_evaluated) {
    session.first_move_evaluated = true;
    session.first_move_correct = Boolean(isMatch);
    session.first_move_at = Date.now();
  }

  let solveTimeSeconds = null;
  if (solved) {
    const completedAt = Date.now();
    const durationMs = completedAt - session.started_at;
    solveTimeSeconds = Math.max(0.1, Number((durationMs / 1000).toFixed(2)));
    activePuzzleSessions.delete(key);
  }

  return {
    first_move_correct: session.first_move_correct,
    solve_time_seconds: solveTimeSeconds,
    attempts_count: session.attempts_count
  };
}

/**
 * Deterministic median calculator helper.
 */
export function calculateMedian(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(1));
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2.0).toFixed(1));
}

/**
 * Gate P4-C1, P4-C2, P4-C3, P4-C4, P4-C5, P4-C6, P4-C7, P4-C8, P4-C11:
 * Retrieves Personal Puzzle Profile with Analytics & Strict Ownership.
 */
export function getPersonalPuzzleProfile(playerId, callerToken = null) {
  if (!callerToken) {
    return {
      ok: false,
      status: 401,
      error: "AUTHENTICATION_REQUIRED",
      message: "Player token is required to inspect personal puzzle profile."
    };
  }

  loadPlayerStore(true);
  const player = getPlayerById(playerId);
  if (!player) {
    return {
      ok: false,
      status: 404,
      error: "PLAYER_NOT_FOUND",
      message: "Player " + playerId + " not found."
    };
  }

  // Gate P4-C1 & P4-C11 & Attack A: Strict ownership enforcement
  const isOwner = verifyPlayerOwnership(callerToken, playerId);
  if (!isOwner) {
    return {
      ok: false,
      status: 403,
      error: "PLAYER_OWNERSHIP_VIOLATION",
      message: "Token does not own the requested player profile."
    };
  }

  const pStats = player.puzzle_stats || {};
  const totalAttempts = pStats.attempts || 0;
  const totalSolved = pStats.solved || 0;
  const totalFailed = pStats.failed || 0;
  const solveRatePct = totalAttempts > 0 ? Number(((totalSolved / totalAttempts) * 100).toFixed(1)) : 0;

  // First-move metrics
  const fmAttempts = pStats.first_move?.attempts || totalAttempts;
  const fmCorrect = pStats.first_move?.correct || 0;
  const fmAccuracyPct = fmAttempts > 0 ? Number(((fmCorrect / fmAttempts) * 100).toFixed(1)) : null;

  // Solve-time metrics (server-authoritative)
  const times = Array.isArray(pStats.solve_time?.times) ? pStats.solve_time.times : [];
  const avgSolveTime = times.length > 0 ? Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)) : null;
  const medianSolveTime = calculateMedian(times);
  const fastestSolveTime = times.length > 0 ? Math.min(...times) : null;

  // Tactical anatomy / categories (Gate P4-C7 & P4-C8: Data absent = UNKNOWN)
  const rawCategories = pStats.categories || {};
  const tacticalProfile = {};

  for (const cat of STANDARD_CATEGORIES) {
    const data = rawCategories[cat] || { attempts: 0, solved: 0 };
    const att = data.attempts || 0;
    const sol = data.solved || 0;

    if (att < MIN_CATEGORY_SAMPLES_FOR_ACCURACY) {
      tacticalProfile[cat] = {
        attempts: att,
        solved: sol,
        accuracy_pct: null,
        display: "—",
        status: "UNKNOWN"
      };
    } else {
      const acc = Number(((sol / att) * 100).toFixed(1));
      tacticalProfile[cat] = {
        attempts: att,
        solved: sol,
        accuracy_pct: acc,
        display: acc + "%",
        status: "ESTABLISHED"
      };
    }
  }

  // Also include any custom motifs present in rawCategories
  for (const [key, data] of Object.entries(rawCategories)) {
    if (!tacticalProfile[key]) {
      const att = data.attempts || 0;
      const sol = data.solved || 0;
      if (att < MIN_CATEGORY_SAMPLES_FOR_ACCURACY) {
        tacticalProfile[key] = {
          attempts: att,
          solved: sol,
          accuracy_pct: null,
          display: "—",
          status: "UNKNOWN"
        };
      } else {
        const acc = Number(((sol / att) * 100).toFixed(1));
        tacticalProfile[key] = {
          attempts: att,
          solved: sol,
          accuracy_pct: acc,
          display: acc + "%",
          status: "ESTABLISHED"
        };
      }
    }
  }

  const isProv = Boolean(player.ratings_provisional?.puzzle ?? true);
  const rating = player.ratings?.puzzle ?? 1500;

  return {
    ok: true,
    player_id: player.player_id,
    handle: player.handle,
    display_name: player.display_name,
    puzzle_rating: rating,
    status: isProv ? "PROVISIONAL" : "ESTABLISHED",
    provisional: isProv,
    attempts_needed: Math.max(0, 20 - totalAttempts),
    overview: {
      attempts: totalAttempts,
      solved: totalSolved,
      failed: totalFailed,
      solve_rate_pct: solveRatePct,
      first_move: {
        attempts: fmAttempts,
        correct: fmCorrect,
        accuracy_pct: fmAccuracyPct
      },
      solve_time: {
        samples: times.length,
        average_seconds: avgSolveTime,
        median_seconds: medianSolveTime,
        fastest_seconds: fastestSolveTime
      }
    },
    tactical_profile: tacticalProfile,
    recent_attempts: Array.isArray(pStats.recent_attempts) ? pStats.recent_attempts.slice(0, 10) : []
  };
}

/**
 * Gate P4-C13:
 * Deterministic Ledger Replay of Player Puzzle Profile Analytics.
 */
export function rebuildPlayerPuzzleAnalyticsFromLedger(playerId) {
  if (!playerId) return { ok: false, error: "PLAYER_ID_REQUIRED" };

  const ledgerPath = resolveCanonicalEventLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { ok: false, error: "LEDGER_NOT_FOUND" };
  }

  const lines = fs.readFileSync(ledgerPath, "utf8").split("\n").filter(Boolean);
  const playerEvents = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (
        entry.event_type === "PUZZLE_RATING_UPDATE" &&
        entry.player_id === playerId &&
        !entry.test_artifact &&
        entry.source !== "reality_audit"
      ) {
        playerEvents.push(entry);
      }
    } catch {}
  }

  let totalAttempts = 0;
  let totalSolved = 0;
  let totalFailed = 0;
  let fmAttempts = 0;
  let fmCorrect = 0;
  const solveTimes = [];
  const categoryStats = {};

  for (const ev of playerEvents) {
    totalAttempts++;
    if (ev.solved) totalSolved++;
    else totalFailed++;

    fmAttempts++;
    if (ev.first_move_correct) fmCorrect++;

    if (ev.solved && typeof ev.solve_time_seconds === "number" && ev.solve_time_seconds > 0) {
      solveTimes.push(ev.solve_time_seconds);
    }

    // Category / motif tracking
    const catsToTrack = [];
    if (ev.category) catsToTrack.push(ev.category);
    if (Array.isArray(ev.motifs)) {
      for (const m of ev.motifs) catsToTrack.push(m);
    }

    for (const c of catsToTrack) {
      if (!categoryStats[c]) categoryStats[c] = { attempts: 0, solved: 0 };
      categoryStats[c].attempts++;
      if (ev.solved) categoryStats[c].solved++;
    }
  }

  const tacticalProfile = {};
  for (const cat of STANDARD_CATEGORIES) {
    const data = categoryStats[cat] || { attempts: 0, solved: 0 };
    const att = data.attempts || 0;
    const sol = data.solved || 0;

    if (att < MIN_CATEGORY_SAMPLES_FOR_ACCURACY) {
      tacticalProfile[cat] = {
        attempts: att,
        solved: sol,
        accuracy_pct: null,
        display: "—",
        status: "UNKNOWN"
      };
    } else {
      const acc = Number(((sol / att) * 100).toFixed(1));
      tacticalProfile[cat] = {
        attempts: att,
        solved: sol,
        accuracy_pct: acc,
        display: acc + "%",
        status: "ESTABLISHED"
      };
    }
  }

  for (const [key, data] of Object.entries(categoryStats)) {
    if (!tacticalProfile[key]) {
      const att = data.attempts || 0;
      const sol = data.solved || 0;
      if (att < MIN_CATEGORY_SAMPLES_FOR_ACCURACY) {
        tacticalProfile[key] = {
          attempts: att,
          solved: sol,
          accuracy_pct: null,
          display: "—",
          status: "UNKNOWN"
        };
      } else {
        const acc = Number(((sol / att) * 100).toFixed(1));
        tacticalProfile[key] = {
          attempts: att,
          solved: sol,
          accuracy_pct: acc,
          display: acc + "%",
          status: "ESTABLISHED"
        };
      }
    }
  }

  const solveRatePct = totalAttempts > 0 ? Number(((totalSolved / totalAttempts) * 100).toFixed(1)) : 0;
  const fmAccuracyPct = fmAttempts > 0 ? Number(((fmCorrect / fmAttempts) * 100).toFixed(1)) : null;
  const avgSolveTime = solveTimes.length > 0 ? Number((solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length).toFixed(1)) : null;
  const medianSolveTime = calculateMedian(solveTimes);

  return {
    ok: true,
    player_id: playerId,
    events_replayed: playerEvents.length,
    overview: {
      attempts: totalAttempts,
      solved: totalSolved,
      failed: totalFailed,
      solve_rate_pct: solveRatePct,
      first_move: {
        attempts: fmAttempts,
        correct: fmCorrect,
        accuracy_pct: fmAccuracyPct
      },
      solve_time: {
        samples: solveTimes.length,
        average_seconds: avgSolveTime,
        median_seconds: medianSolveTime,
        fastest_seconds: solveTimes.length > 0 ? Math.min(...solveTimes) : null
      }
    },
    tactical_profile: tacticalProfile
  };
}
