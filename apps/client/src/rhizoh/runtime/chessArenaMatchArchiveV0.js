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
 *   endedAt?: number
 * }} row
 */
export function archiveChessArenaMatchV0(row) {
  if (typeof window === "undefined") return null;
  const entry = Object.freeze({
    id: String(row.matchId || `chess_${Date.now()}`),
    mode: String(row.mode || "unknown"),
    outcome: String(row.outcome || "unknown"),
    moves: Array.isArray(row.moves) ? row.moves.slice() : [],
    fen: String(row.fen || ""),
    white: String(row.white || "White"),
    black: String(row.black || "Black"),
    engine: String(row.engine || "unknown"),
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
