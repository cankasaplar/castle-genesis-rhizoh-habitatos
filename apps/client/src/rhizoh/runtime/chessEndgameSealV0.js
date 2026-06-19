/**
 * Endgame analysis seal — persist conversion lines for Rhizoh replay learning.
 */

export const CHESS_ENDGAME_SEAL_SCHEMA_V0 = "rhizoh.chess_endgame_seal.v0";
const LS_KEY_V0 = "rhizoh.chess_endgame_seal.v0";
const MAX_SEALS_V0 = 64;

/**
 * @param {{
 *   matchId: string,
 *   outcome: string,
 *   moves: string[],
 *   regret?: object,
 *   phase?: string,
 *   evalTrace?: object[]
 * }} row
 */
export function sealChessEndgameAnalysisV0(row) {
  if (typeof window === "undefined") return null;
  const seal = Object.freeze({
    id: `seal_${row.matchId || Date.now()}`,
    matchId: row.matchId || null,
    outcome: String(row.outcome || "unknown"),
    moves: Array.isArray(row.moves) ? row.moves.slice() : [],
    phase: row.phase || "endgame",
    regret: row.regret ? Object.freeze({ ...row.regret }) : null,
    evalTrace: Array.isArray(row.evalTrace) ? Object.freeze(row.evalTrace.slice()) : null,
    sealedAt: new Date().toISOString()
  });
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    const prev = raw ? JSON.parse(raw) : { schema: CHESS_ENDGAME_SEAL_SCHEMA_V0, seals: [] };
    const seals = Array.isArray(prev.seals) ? [seal, ...prev.seals] : [seal];
    window.localStorage.setItem(
      LS_KEY_V0,
      JSON.stringify({ schema: CHESS_ENDGAME_SEAL_SCHEMA_V0, seals: seals.slice(0, MAX_SEALS_V0) })
    );
    return seal;
  } catch {
    return null;
  }
}

export function listChessEndgameSealsV0(limit = 12) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed?.seals) ? parsed.seals : []).slice(0, limit);
  } catch {
    return [];
  }
}
