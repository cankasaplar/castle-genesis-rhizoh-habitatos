/**
 * Adaptive engine time slicing — depth/movetime scale with queue contention.
 * RESEARCH-ONLY
 */

import { CHESS_ENGINE_TASK_KIND_V0 } from "./chessEngineTaskQueueV0.js";
import { getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";
import { getChessEngineContentionSnapshotV0 } from "./chessEngineContentionGateV0.js";

export const CHESS_ENGINE_ADAPTIVE_SLICE_SCHEMA_V0 = "castle.rhizoh.chess_engine_adaptive_slice.v0";

const CLUSTER_DEPTH_MIN_V0 = 8;
const CLUSTER_DEPTH_MAX_V0 = 16;
const CLUSTER_MOVETIME_FLOOR_MS_V0 = 320;
const CLUSTER_MOVETIME_CEIL_MS_V0 = 1200;

/**
 * @param {{ depth?: number, movetimeMs?: number, queueKind?: string, slotId?: number }} baseOpts
 */
export function resolveAdaptiveClusterEngineOptsV0(baseOpts = {}) {
  const queue = getChessEngineQueueSnapshotV0();
  const contention = getChessEngineContentionSnapshotV0();
  const pending = Number(queue.pendingCount) || 0;
  const activePlay =
    queue.active?.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE ||
    queue.active?.kind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE;

  let load = Math.min(1, pending / 4);
  if (contention.chessLock) load = Math.min(1, load + 0.2);
  if (contention.contended) load = Math.min(1, load + 0.15);
  if (activePlay) load = Math.min(1, load + 0.1);

  const baseDepth = Number(baseOpts.depth) || 12;
  const baseMovetime = Number(baseOpts.movetimeMs) || 700;

  const depth = Math.round(
    CLUSTER_DEPTH_MAX_V0 - load * (CLUSTER_DEPTH_MAX_V0 - CLUSTER_DEPTH_MIN_V0)
  );
  const movetimeMs = Math.max(
    CLUSTER_MOVETIME_FLOOR_MS_V0,
    Math.min(
      CLUSTER_MOVETIME_CEIL_MS_V0,
      Math.round(baseMovetime * (1 - load * 0.5))
    )
  );

  const timeoutScale = 1 - load * 0.25;

  return Object.freeze({
    schema: CHESS_ENGINE_ADAPTIVE_SLICE_SCHEMA_V0,
    ...baseOpts,
    depth: Math.max(CLUSTER_DEPTH_MIN_V0, Math.min(CLUSTER_DEPTH_MAX_V0, depth)),
    movetimeMs,
    timeoutBufferMs: Math.round((Number(baseOpts.timeoutBufferMs) || 0) * timeoutScale),
    adaptiveLoad: Number(load.toFixed(3)),
    adaptiveNote: "cluster depth 8–16 + movetime scales with queue contention"
  });
}

/**
 * @param {object} opts
 */
export function shouldPreferClusterHeuristicUnderContentionV0(opts = {}) {
  if (Number(opts.slotId) === 0) return false;
  const queue = getChessEngineQueueSnapshotV0();
  const pending = Number(queue.pendingCount) || 0;
  const contention = getChessEngineContentionSnapshotV0();
  return pending >= 2 || contention.contended || contention.chessLock;
}
