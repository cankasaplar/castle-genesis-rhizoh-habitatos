/**
 * Chess Arena console telemetry — moves, engine, learning seals (observable in DevTools).
 */

import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { formatChessMoveSanV0 } from "./chessMoveSanV0.js";
import {
  resolveChessTelemetrySlotIdV0,
  shouldLogChessMovePlayedV0
} from "./chessTelemetryLogV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import { appendShadowTraceFromChessMoveAnchorV0 } from "./rhizohShadowTraceLedgerV0.js";

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
  if (kind === "move_played") {
    const slotId = resolveChessTelemetrySlotIdV0(detail);
    const shouldLog = shouldLogChessMovePlayedV0({
      slotId,
      matchId: detail.matchId,
      moveNumber: detail.moveNumber
    });
    if (slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) {
      appendShadowTraceFromChessMoveAnchorV0({
        san: detail.san,
        slotId,
        matchId: detail.matchId,
        moveNumber: detail.moveNumber,
        color: detail.color
      });
    }
    if (!shouldLog) {
      return payload;
    }
  }
  logCastleLifecycleV0(`chess_${kind}`, payload);
  return payload;
}

/**
 * @param {{ san: string, color?: string, engine?: string, fen?: string, policyMode?: string, slotId?: number, matchId?: string, moveNumber?: number }} row
 */
export function logChessMovePlayedV0(row) {
  const san = formatChessMoveSanV0(row.san);
  const payload = logChessArenaTelemetryV0("move_played", {
    san,
    color: row.color || null,
    engine: row.engine || null,
    fen: row.fen || null,
    fenBefore: row.fenBefore || null,
    policyMode: row.policyMode || null,
    slotId: row.slotId ?? null,
    matchId: row.matchId || null,
    moveNumber: row.moveNumber ?? null
  });
  emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE, {
    san,
    rhizohMove: san,
    color: row.color || null,
    engine: row.engine || null,
    fen: row.fen || null,
    fenBefore: row.fenBefore || null,
    matchId: row.matchId || null,
    moveNumber: row.moveNumber || null,
    policyMode: row.policyMode || null
  });
  return payload;
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
