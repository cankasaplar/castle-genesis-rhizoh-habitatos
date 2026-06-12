/**
 * Spatial boot gate — separates time heartbeat from spatial rendering.
 *
 * Tick/heartbeat may run, but Cesium can mount only after feature flag, world
 * snapshot, identity anchor, and node safety checks pass.
 */

export const RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0 = "rhizoh.spatial_boot_gate.v0";

export const RHIZOH_SPATIAL_RENDER_MODE_V0 = Object.freeze({
  FALLBACK_V11: "fallback_v11",
  EMPTY_CANVAS: "empty_canvas",
  SAFE_WORLD_SHELL: "safe_world_shell",
  CESIUM_READY: "cesium_ready"
});

/**
 * @param {{
 *   spatialEnabled?: boolean,
 *   worldStateReady?: boolean,
 *   identityReady?: boolean,
 *   nodes?: unknown[]
 * }} input
 */
export function evaluateSpatialBootGateV0(input = {}) {
  const spatialEnabled = input.spatialEnabled === true;
  const worldStateReady = input.worldStateReady === true;
  const identityReady = input.identityReady === true;
  const nodes = Array.isArray(input.nodes) ? input.nodes.filter(Boolean) : [];

  if (!spatialEnabled) {
    return Object.freeze({
      schema: RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0,
      allowed: false,
      renderMode: RHIZOH_SPATIAL_RENDER_MODE_V0.FALLBACK_V11,
      reason: "spatial_feature_disabled",
      nodeCount: nodes.length
    });
  }

  if (!worldStateReady) {
    return Object.freeze({
      schema: RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0,
      allowed: false,
      renderMode: RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS,
      reason: "world_snapshot_missing",
      nodeCount: nodes.length
    });
  }

  if (!identityReady) {
    return Object.freeze({
      schema: RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0,
      allowed: false,
      renderMode: RHIZOH_SPATIAL_RENDER_MODE_V0.FALLBACK_V11,
      reason: "identity_anchor_missing",
      nodeCount: nodes.length
    });
  }

  if (!nodes.length) {
    return Object.freeze({
      schema: RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0,
      allowed: false,
      renderMode: RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL,
      reason: "spatial_nodes_empty",
      nodeCount: 0
    });
  }

  return Object.freeze({
    schema: RHIZOH_SPATIAL_BOOT_GATE_SCHEMA_V0,
    allowed: true,
    renderMode: RHIZOH_SPATIAL_RENDER_MODE_V0.CESIUM_READY,
    reason: "ready",
    nodeCount: nodes.length
  });
}
