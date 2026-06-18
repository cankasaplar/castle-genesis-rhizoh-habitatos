/**
 * Broadcast engine policy — one Stockfish pipeline for featured slot; heuristic for grid B-roll.
 * RESEARCH-ONLY — avoids 8× WASM (browser memory) while keeping slot 0 broadcast quality.
 */

import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import { isChessClusterArenaOpenV0 } from "./chessEngineContentionGateV0.js";

export const CHESS_CLUSTER_BROADCAST_ENGINE_POLICY_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_broadcast_engine_policy.v0";

/** Featured slot uses WASM; background grid slots use fast heuristic during 8-camera UI. */
export function isChessClusterBroadcastModeV0() {
  return isChessClusterArenaOpenV0();
}

/**
 * @param {number} slotId
 */
export function shouldUseStockfishForClusterSlotV0(slotId) {
  if (!isChessClusterBroadcastModeV0()) return true;
  return Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0;
}

export function getChessClusterBroadcastEnginePolicySnapshotV0() {
  return Object.freeze({
    schema: CHESS_CLUSTER_BROADCAST_ENGINE_POLICY_SCHEMA_V0,
    broadcastMode: isChessClusterBroadcastModeV0(),
    featuredSlotId: CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    featuredUsesStockfish: true,
    gridUsesHeuristic: isChessClusterBroadcastModeV0(),
    atMs: Date.now()
  });
}
