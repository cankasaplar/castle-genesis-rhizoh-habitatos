import { normalizeChessMovesToSanV0 } from "./chessMoveSanV0.js";

/**
 * Local chess match archive — completed games (PGN + metadata).
 */
export const CHESS_ARENA_ARCHIVE_SCHEMA_V0 = "rhizoh.chess_arena_archive.v0";
const LS_KEY_V0 = "rhizoh.chess_arena_archive.v0";
const MAX_ENTRIES_V0 = 48;

/**
 * @param {{
 *   matchId: string,
 *   mode: string,
 *   outcome: string,
 *   moves: string[],
 *   fen: string,
 *   white: string,
 *   black: string,
 *   engine?: string,
 *   policyMode?: string,
 *   regret?: object,
 *   evalTrace?: object[],
 *   mindId?: string,
 *   learning?: object,
 *   endedAt?: number
 * }} row
 */
export function archiveChessArenaMatchV0(row) {
  if (typeof window === "undefined") return null;
  const entry = Object.freeze({
    id: String(row.matchId || `chess_${Date.now()}`),
    mode: String(row.mode || "unknown"),
    outcome: String(row.outcome || "unknown"),
    moves: normalizeChessMovesToSanV0(row.moves || []),
    fen: String(row.fen || ""),
    white: String(row.white || "White"),
    black: String(row.black || "Black"),
    engine: String(row.engine || "unknown"),
    policyMode: row.policyMode ? String(row.policyMode) : null,
    regret: row.regret ? Object.freeze({ ...row.regret }) : null,
    evalTrace: Array.isArray(row.evalTrace) ? Object.freeze(row.evalTrace.slice()) : null,
    mindId: row.mindId ? String(row.mindId) : null,
    learning: row.learning ? Object.freeze({ ...row.learning }) : null,
    endedAt: Number(row.endedAt) || Date.now()
  });
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    const prev = raw ? JSON.parse(raw) : { schema: CHESS_ARENA_ARCHIVE_SCHEMA_V0, entries: [] };
    const entries = Array.isArray(prev.entries) ? prev.entries : [];
    entries.unshift(entry);
    const next = Object.freeze({
      schema: CHESS_ARENA_ARCHIVE_SCHEMA_V0,
      entries: Object.freeze(entries.slice(0, MAX_ENTRIES_V0))
    });
    window.localStorage.setItem(LS_KEY_V0, JSON.stringify(next));
    try {
      window.dispatchEvent(new CustomEvent("rhizoh:chess-arena-archive-v0", { detail: entry }));
    } catch {
      /* noop */
    }
    return entry;
  } catch {
    return null;
  }
}

/**
 * Patch an existing archive row (e.g. post-match regret analysis).
 * @param {string} id
 * @param {object} patch
 */
export function enrichChessArenaArchiveEntryV0(id, patch = {}) {
  if (typeof window === "undefined" || !id) return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    const prev = raw ? JSON.parse(raw) : { schema: CHESS_ARENA_ARCHIVE_SCHEMA_V0, entries: [] };
    const entries = Array.isArray(prev.entries) ? [...prev.entries] : [];
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const merged = Object.freeze({
      ...entries[idx],
      ...patch,
      regret: patch.regret ? Object.freeze({ ...patch.regret }) : entries[idx].regret,
      evalTrace: Array.isArray(patch.evalTrace)
        ? Object.freeze(patch.evalTrace.slice())
        : entries[idx].evalTrace
    });
    entries[idx] = merged;
    const next = Object.freeze({
      schema: CHESS_ARENA_ARCHIVE_SCHEMA_V0,
      entries: Object.freeze(entries.slice(0, MAX_ENTRIES_V0))
    });
    window.localStorage.setItem(LS_KEY_V0, JSON.stringify(next));
    try {
      window.dispatchEvent(new CustomEvent("rhizoh:chess-arena-archive-v0", { detail: merged }));
    } catch {
      /* noop */
    }
    return merged;
  } catch {
    return null;
  }
}

export function listChessArenaArchiveV0(limit = 12) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    return entries.slice(0, Math.max(1, limit));
  } catch {
    return [];
  }
}
