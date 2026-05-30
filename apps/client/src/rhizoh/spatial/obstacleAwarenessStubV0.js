/**
 * SPECFLOW: RESEARCH-ONLY — **Obstacle / nav / occlusion** — readiness ile hizalı yer tutucu.
 * Gerçek nav mesh, collision resolve ve occlusion graph beslenmediği sürece `active` false kalır.
 */

export const OBSTACLE_AWARENESS_STUB_SCHEMA_V0 = "castle.rhizoh.obstacle_awareness.stub.v0";

/**
 * @param {string[]|null|undefined} readinessMissing — `resolveRealWorldSpatialBindingReadinessV0().missing`
 */
export function summarizeObstacleAwarenessGapsV0(readinessMissing) {
  const m = Array.isArray(readinessMissing) ? readinessMissing : [];
  return {
    schema: OBSTACLE_AWARENESS_STUB_SCHEMA_V0,
    navMeshLinked: !m.includes("world_space_nav_mesh"),
    collisionChannelLinked: !m.includes("collision_resolve_tick"),
    obstacleChannelLinked: !m.includes("obstacle_representation_channel"),
    occlusionGraph: false,
    active: false,
    note: "Readiness lists channels; feed obstacle segments / nav mesh when studio world binding lands."
  };
}
