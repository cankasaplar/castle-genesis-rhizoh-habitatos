/**
 * Broadcast engine policy — one Stockfish pipeline for featured slot; heuristic for grid B-roll.
 * RESEARCH-ONLY — avoids 8× WASM (browser memory) while keeping slot 0 broadcast quality.
 */

import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import { isChessClusterBroadcastActiveV0 } from "./chessEngineContentionGateV0.js";

export const CHESS_CLUSTER_BROADCAST_ENGINE_POLICY_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_broadcast_engine_policy.v0";

/** Min ply before a broadcast grid slot may reset on non-decisive game end. */
export const CHESS_CLUSTER_BROADCAST_MIN_GRID_PLY_V0 = 8;
/** Min ply before featured LIVE slot may reset on non-decisive game end. */
export const CHESS_CLUSTER_BROADCAST_MIN_FEATURED_PLY_V0 = 16;
/** Faster cluster tick floor while 8-camera UI is open. */
export const CHESS_CLUSTER_BROADCAST_TICK_MIN_MS_V0 = 550;
/** Extra move budget per tick during broadcast (featured + grid B-roll). */
export const CHESS_CLUSTER_BROADCAST_MOVES_PER_TICK_V0 = 2;

/** Featured slot uses WASM; background grid slots use fast heuristic during 8-camera UI. */
export function isChessClusterBroadcastModeV0() {
  return isChessClusterBroadcastActiveV0();
}

/**
 * @param {number} slotId
 */
export function shouldUseStockfishForClusterSlotV0(slotId) {
  if (!isChessClusterBroadcastModeV0()) return true;
  return Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0;
}

/**
 * B-roll grid slots are untimed during broadcast — only featured LIVE uses the clock.
 * @param {object} slot
 */
export function shouldTickChessClusterSlotClockV0(slot) {
  if (!isChessClusterBroadcastModeV0()) return true;
  return Number(slot?.slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0;
}

/**
 * Hold premature game ends while broadcast UI is open (keeps boards visually alive).
 * @param {object} slot
 * @param {string|null} _outcome
 * @param {string} endReason
 */
export function shouldFinalizeClusterBroadcastEndV0(slot, _outcome, endReason) {
  if (!isChessClusterBroadcastModeV0()) return true;
  if (endReason === "checkmate_or_draw") return true;
  // Learning throughput: ply cap always finalizes — terminal reward must fire.
  if (endReason === "max_ply_cap") return true;
  const slotId = Number(slot?.slotId);
  // LIVE featured: play to decisive end — no flag on zero clock during broadcast.
  if (slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 && endReason === "timeout") {
    return false;
  }
  const ply = Number(slot?.ply) || 0;
  const minPly =
    slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0
      ? CHESS_CLUSTER_BROADCAST_MIN_FEATURED_PLY_V0
      : CHESS_CLUSTER_BROADCAST_MIN_GRID_PLY_V0;
  if (endReason === "timeout") {
    return ply >= minPly;
  }
  return true;
}

export function resolveChessClusterBroadcastMovesPerTickV0() {
  return isChessClusterBroadcastModeV0() ? CHESS_CLUSTER_BROADCAST_MOVES_PER_TICK_V0 : 1;
}

/**
 * Broadcast tick plan — featured slot + one rotating B-roll slot per tick (slots 2–7 were starved).
 * @param {number} roundRobinIndex
 */
export function resolveChessClusterBroadcastTickPlanV0(roundRobinIndex) {
  if (!isChessClusterBroadcastModeV0()) return null;
  const brollSlot = 1 + (Math.max(0, Number(roundRobinIndex) || 0) % 7);
  return Object.freeze([CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0, brollSlot]);
}

/**
 * @param {number} roundRobinIndex
 * @param {number} slotCount
 */
export function resolveChessClusterTickSlotOrderV0(
  roundRobinIndex,
  slotCount = 8
) {
  const count = Math.max(1, Number(slotCount) || 8);
  if (!isChessClusterBroadcastModeV0()) {
    const start = Number(roundRobinIndex) % count;
    return Array.from({ length: count }, (_, i) => (start + i) % count);
  }
  return Array.from({ length: count }, (_, i) => i);
}

export function getChessClusterBroadcastEnginePolicySnapshotV0() {
  return Object.freeze({
    schema: CHESS_CLUSTER_BROADCAST_ENGINE_POLICY_SCHEMA_V0,
    broadcastMode: isChessClusterBroadcastModeV0(),
    featuredSlotId: CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    featuredUsesStockfish: true,
    gridUsesHeuristic: isChessClusterBroadcastModeV0(),
    minFeaturedPly: CHESS_CLUSTER_BROADCAST_MIN_FEATURED_PLY_V0,
    minGridPly: CHESS_CLUSTER_BROADCAST_MIN_GRID_PLY_V0,
    tickMinMs: CHESS_CLUSTER_BROADCAST_TICK_MIN_MS_V0,
    movesPerTick: resolveChessClusterBroadcastMovesPerTickV0(),
    atMs: Date.now()
  });
}
