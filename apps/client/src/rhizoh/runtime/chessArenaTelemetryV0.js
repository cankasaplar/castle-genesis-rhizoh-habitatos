/**
 * Chess Arena console telemetry — moves, engine, learning seals (observable in DevTools).
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { formatChessMoveSanV0 } from "./chessMoveSanV0.js";

export const CHESS_ARENA_TELEMETRY_SCHEMA_V0 = "rhizoh.chess_arena_telemetry.v0";

/**
 * @param {string} kind
 * @param {Record<string, unknown>} detail
 */
export function logChessArenaTelemetryV0(kind, detail = {}) {
  const payload = Object.freeze({
    schema: CHESS_ARENA_TELEMETRY_SCHEMA_V0,
    kind: String(kind || "event"),
    atMs: Date.now(),
    ...detail
  });
  logCastleLifecycleV0(`chess_${kind}`, payload);
  return payload;
}

/**
 * @param {{ san: string, color?: string, engine?: string, fen?: string, policyMode?: string }} row
 */
export function logChessMovePlayedV0(row) {
  return logChessArenaTelemetryV0("move_played", {
    san: formatChessMoveSanV0(row.san),
    color: row.color || null,
    engine: row.engine || null,
    fen: row.fen || null,
    policyMode: row.policyMode || null
  });
}

/**
 * @param {object} regret
 */
export function logChessRegretSealedV0(regret) {
  return logChessArenaTelemetryV0("regret_sealed", {
    forcedWinIgnored: regret?.forcedWinIgnored === true,
    regretCount: regret?.regretCount || 0,
    topRegret: regret?.topRegret || null,
    anomalyFlags: regret?.anomalyFlags || []
  });
}
