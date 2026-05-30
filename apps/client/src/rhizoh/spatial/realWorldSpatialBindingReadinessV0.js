/**
 * SPECFLOW: RESEARCH-ONLY — **Real-world spatial binding readiness** (sembolik yaw → dünya uzayı).
 * Gerçek geometri / nav yok; hangi girdilerin eksik olduğunu deterministik listeler.
 */

export const REAL_WORLD_SPATIAL_BINDING_READINESS_SCHEMA_V0 = "castle.rhizoh.real_world_spatial_binding_readiness.v0";

/**
 * @param {{
 *   avatarTransformsByUid?: Record<string, { x?: number, y?: number, z?: number, rotY?: number }>|null,
 *   roomBounds?: { minX?: number, maxX?: number, minZ?: number, maxZ?: number }|null,
 *   obstacles?: unknown[]|null,
 *   symbolicEmbodimentActive?: boolean|null
 * }|null|undefined} ctx
 */
export function resolveRealWorldSpatialBindingReadinessV0(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const transforms = c.avatarTransformsByUid && typeof c.avatarTransformsByUid === "object" ? c.avatarTransformsByUid : null;
  const nAv = transforms ? Object.keys(transforms).filter((k) => transforms[k] && typeof transforms[k] === "object").length : 0;
  const rb = c.roomBounds && typeof c.roomBounds === "object" ? c.roomBounds : null;
  const hasBounds =
    rb != null &&
    [rb.minX, rb.maxX, rb.minZ, rb.maxZ].every((v) => typeof v === "number" && Number.isFinite(v));
  const obs = Array.isArray(c.obstacles) ? c.obstacles : null;
  const hasObstacleChannel = obs != null;
  const symbolic = !!c.symbolicEmbodimentActive;

  /** @type {string[]} */
  const missing = [];
  if (nAv < 1) missing.push("avatar_world_transforms");
  if (!hasBounds) missing.push("room_geometry_bounds");
  if (!hasObstacleChannel) missing.push("obstacle_representation_channel");
  missing.push("world_space_nav_mesh");
  missing.push("look_at_solver_world");
  missing.push("collision_resolve_tick");

  let readiness01 = 0;
  if (nAv >= 1) readiness01 += 0.18;
  if (nAv >= 2) readiness01 += 0.12;
  if (hasBounds) readiness01 += 0.22;
  if (hasObstacleChannel) readiness01 += 0.12;
  if (symbolic) readiness01 += 0.08;
  readiness01 = Math.round(Math.min(1, Math.max(0, readiness01)) * 1000) / 1000;

  return {
    schema: REAL_WORLD_SPATIAL_BINDING_READINESS_SCHEMA_V0,
    ts: Date.now(),
    readiness01,
    avatarTransformCount: nAv,
    hasRoomBounds: hasBounds,
    hasObstacleChannel,
    symbolicEmbodimentActive: symbolic,
    missing,
    note: "Symbolic yaw/orbit can run in parallel; promotion to world look-at requires the missing channels."
  };
}
