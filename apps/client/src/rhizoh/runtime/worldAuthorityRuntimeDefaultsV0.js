/** Default `worldAuthorityRuntime` slice — avoids studio store import cycles in WAL modules. */

/**
 * @returns {import("../../studio/types/rskOntology.js").WorldAuthorityRuntimeStateV0}
 */
export function defaultWorldAuthorityRuntimeV0() {
  return {
    sceneGraphByRoomUid: {},
    pendingObstaclesByRoomUid: {},
    sealedObstacleByRoomUid: {}
  };
}
