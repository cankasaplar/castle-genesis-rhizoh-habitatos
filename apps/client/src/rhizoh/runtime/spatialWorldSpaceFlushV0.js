/**
 * Spatial → World Space flush v0
 * Forces buffered spatial events to commit when world is anchored but Cesium gate pending.
 */

import { getSpatialReadyGateSnapshotV0, drainPreReadySpatialQueueV0 } from "./rhizohSpatialReadyGateV0.js";
import { emitSpatialEventImmediateV0 } from "./rhizohSpatialEventEmitterV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";

export const SPATIAL_WORLD_SPACE_FLUSH_SCHEMA_V0 = "castle.rhizoh.spatial_world_space_flush.v0";

/**
 * @param {{ force?: boolean, emitImmediate?: (domain: string, event: object) => unknown }} [opts]
 */
export function flushSpatialBufferToWorldSpaceV0(opts = {}) {
  const gate = getSpatialReadyGateSnapshotV0();
  const grounding = getGroundingLayerSnapshotV1();
  const emit = opts.emitImmediate || emitSpatialEventImmediateV0;
  const force = opts.force === true || grounding.worldAnchored === true;

  let drained = 0;
  if (gate.buffered > 0 && (gate.open || force)) {
    drained = drainPreReadySpatialQueueV0(emit, { force: force && !gate.open });
  }

  const snap = Object.freeze({
    schema: SPATIAL_WORLD_SPACE_FLUSH_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    force,
    bufferedBefore: gate.buffered,
    drained,
    spatialNodeCount: listSpatialNodesV0().length,
    cesiumReady: gate.cesiumReady,
    worldAnchored: grounding.worldAnchored === true
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.spatialWorldSpaceFlush = snap;
  }

  return snap;
}
