/**
 * Persisted chess lifetime ledger — survives reloads; backfills from legacy stores.
 * RESEARCH-ONLY — observation only; no execution authority.
 */

import { listChessArenaArchiveV0 } from "./chessArenaMatchArchiveV0.js";
import { readChessCivilizationV0 } from "./chessCivilizationV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { readCastleIdentityV0 } from "./castleIdentityV0.js";
import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";

export const CHESS_LIFETIME_STATS_SCHEMA_V0 = "castle.rhizoh.chess_lifetime_stats.v0";
export const CHESS_LIFETIME_STATS_LS_KEY_V0 = "rhizoh.chess.lifetime_stats.v0";

const MAX_FEN_HINTS_V0 = 512;
const MAX_MATCH_HINTS_V0 = 512;

/** @type {object | null} */
let cachedStatsV0 = null;

function emptyStatsV0() {
  return {
    schema: CHESS_LIFETIME_STATS_SCHEMA_V0,
    gamesObserved: 0,
    gamesCompleted: 0,
    movesSeen: 0,
    driftEvents: 0,
    uniqueFenHints: [],
    matchIdHints: [],
    firstSeenAt: null,
    lastSeenAt: null,
    backfilledAt: null,
    updatedAt: null
  };
}

function readRawStatsV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHESS_LIFETIME_STATS_LS_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStatsV0(stats) {
  if (typeof localStorage === "undefined") return stats;
  const next = Object.freeze({
    ...stats,
    schema: CHESS_LIFETIME_STATS_SCHEMA_V0,
    updatedAt: new Date().toISOString()
  });
  try {
    localStorage.setItem(CHESS_LIFETIME_STATS_LS_KEY_V0, JSON.stringify(next));
  } catch {
    /* noop */
  }
  cachedStatsV0 = next;
  return next;
}

function touchTimestampV0(stats, atMs = Date.now()) {
  const iso = new Date(atMs).toISOString();
  if (!stats.firstSeenAt) stats.firstSeenAt = iso;
  stats.lastSeenAt = iso;
}

function addFenHintsV0(stats, fens = []) {
  const set = new Set(stats.uniqueFenHints || []);
  for (const fen of fens) {
    const key = String(fen || "").trim();
    if (key) set.add(key.slice(0, 80));
  }
  stats.uniqueFenHints = [...set].slice(-MAX_FEN_HINTS_V0);
}

function addMatchHintV0(stats, matchId) {
  const id = String(matchId || "").trim();
  if (!id) return;
  const set = new Set(stats.matchIdHints || []);
  set.add(id);
  stats.matchIdHints = [...set].slice(-MAX_MATCH_HINTS_V0);
}

function maxStatV0(current, incoming) {
  return Math.max(Number(current) || 0, Number(incoming) || 0);
}

/**
 * One-time merge from civilization, arena archive, weights, castle identity.
 * Never decreases existing ledger counters.
 */
export function backfillChessLifetimeStatsFromStoresV0() {
  const stats = { ...emptyStatsV0(), ...(readRawStatsV0() || cachedStatsV0 || {}) };
  const civilization = readChessCivilizationV0();
  const archive = listChessArenaArchiveV0(48);
  const weights = readChessLearningWeightsV0();
  const identity = readCastleIdentityV0();
  const openings = listRhizohOpeningBookV0();

  const civMatches = civilization.matches?.length || 0;
  const archiveGames = archive.length;
  const archiveMoves = archive.reduce((sum, row) => sum + (row.moves?.length || 0), 0);
  const bookGames = openings.reduce((sum, row) => sum + (Number(row.games) || 0), 0);

  stats.gamesCompleted = maxStatV0(
    stats.gamesCompleted,
    Math.max(civMatches, archiveGames, weights.matchesLearned, identity?.matchesPlayed || 0)
  );
  stats.gamesObserved = maxStatV0(
    stats.gamesObserved,
    Math.max(stats.gamesCompleted, civMatches, archiveGames, bookGames)
  );
  stats.movesSeen = maxStatV0(stats.movesSeen, archiveMoves);

  for (const row of archive) {
    if (row.fen) addFenHintsV0(stats, [row.fen]);
    if (row.id) addMatchHintV0(stats, row.id);
    if (row.endedAt) touchTimestampV0(stats, row.endedAt);
  }
  for (const row of civilization.matches || []) {
    if (row.gameId) addMatchHintV0(stats, row.gameId);
    if (row.at) touchTimestampV0(stats, Date.parse(row.at) || Date.now());
  }
  if (civilization.updatedAt) touchTimestampV0(stats, Date.parse(civilization.updatedAt) || Date.now());

  stats.backfilledAt = stats.backfilledAt || new Date().toISOString();
  return writeStatsV0(stats);
}

export function readChessLifetimeStatsV0() {
  if (cachedStatsV0) return cachedStatsV0;
  const raw = readRawStatsV0();
  if (!raw) {
    cachedStatsV0 = backfillChessLifetimeStatsFromStoresV0();
    return cachedStatsV0;
  }
  if (!raw.backfilledAt) {
    cachedStatsV0 = backfillChessLifetimeStatsFromStoresV0();
    return cachedStatsV0;
  }
  cachedStatsV0 = Object.freeze({ ...emptyStatsV0(), ...raw });
  return cachedStatsV0;
}

function mutateStatsV0(mutator) {
  const stats = { ...emptyStatsV0(), ...readChessLifetimeStatsV0() };
  mutator(stats);
  touchTimestampV0(stats);
  return writeStatsV0(stats);
}

/**
 * @param {{ matchId?: string, fenBefore?: string, fenAfter?: string, atMs?: number }} row
 */
export function recordChessLifetimeMoveV0(row = {}) {
  return mutateStatsV0((stats) => {
    stats.movesSeen = maxStatV0(stats.movesSeen, (Number(stats.movesSeen) || 0) + 1);
    if (row.matchId) {
      const prevSize = new Set(stats.matchIdHints || []).size;
      addMatchHintV0(stats, row.matchId);
      const nextSize = new Set(stats.matchIdHints || []).size;
      if (nextSize > prevSize) {
        stats.gamesObserved = maxStatV0(stats.gamesObserved, nextSize);
      }
    }
    addFenHintsV0(stats, [row.fenBefore, row.fenAfter]);
    if (row.atMs) touchTimestampV0(stats, row.atMs);
  });
}

export function recordChessLifetimeGameCompletedV0(meta = {}) {
  return mutateStatsV0((stats) => {
    stats.gamesCompleted = maxStatV0(stats.gamesCompleted, (Number(stats.gamesCompleted) || 0) + 1);
    if (meta.matchId) addMatchHintV0(stats, meta.matchId);
    if (meta.atMs) touchTimestampV0(stats, meta.atMs);
  });
}

export function recordChessLifetimeDriftEventV0() {
  return mutateStatsV0((stats) => {
    stats.driftEvents = maxStatV0(stats.driftEvents, (Number(stats.driftEvents) || 0) + 1);
  });
}

/**
 * @param {{ gameId?: string, moves?: string[], observedAt?: string }} observation
 */
export function recordChessLifetimeMatchAnalyzedV0(observation = {}) {
  return mutateStatsV0((stats) => {
    stats.gamesCompleted = maxStatV0(stats.gamesCompleted, (Number(stats.gamesCompleted) || 0) + 1);
    if (observation.gameId) addMatchHintV0(stats, observation.gameId);
    const moveCount = Array.isArray(observation.moves) ? observation.moves.length : 0;
    if (moveCount > 0) {
      stats.movesSeen = maxStatV0(stats.movesSeen, (Number(stats.movesSeen) || 0) + moveCount);
    }
    if (observation.observedAt) {
      touchTimestampV0(stats, Date.parse(observation.observedAt) || Date.now());
    }
  });
}

/** @internal checkpoint resume */
export function invalidateChessLifetimeStatsCacheV0() {
  cachedStatsV0 = null;
}

/** @internal vitest */
export function __resetChessLifetimeStatsForTestV0() {
  cachedStatsV0 = null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CHESS_LIFETIME_STATS_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
