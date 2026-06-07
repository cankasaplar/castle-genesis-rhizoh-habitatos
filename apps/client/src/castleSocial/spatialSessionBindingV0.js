/**
 * SpatialSessionBindingV0 — placeholder lens ids only. Does not bind Cesium or Octo runtime.
 * @see docs/SESSION_GRAPH_V1.md
 */

import {
  isSpatialBindingAllowedV0,
  CASTLE_SESSION_LIFECYCLE_SCHEMA_V0
} from "./castleSessionLifecycleV0.js";

export const SPATIAL_SESSION_BINDING_SCHEMA_V0 = "castle.spatial_session_binding.v0";

/**
 * @param {{
 *   sessionId: string,
 *   lifecycle: string,
 *   cesiumSessionId?: string | null,
 *   octoSessionId?: string | null,
 *   presentationLensId?: string | null
 * }} input
 */
export function buildSpatialSessionBindingV0(input) {
  const sessionId = String(input?.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({
      schema: SPATIAL_SESSION_BINDING_SCHEMA_V0,
      ok: false,
      reason: "missing_session_id"
    });
  }

  const lifecycle = String(input?.lifecycle || "").toUpperCase();
  const bindingAllowed = isSpatialBindingAllowedV0(lifecycle);

  return Object.freeze({
    schema: SPATIAL_SESSION_BINDING_SCHEMA_V0,
    lifecycleSchema: CASTLE_SESSION_LIFECYCLE_SCHEMA_V0,
    ok: true,
    sessionId,
    lifecycle,
    bindingAllowed,
    cesiumSessionId: bindingAllowed && input?.cesiumSessionId ? String(input.cesiumSessionId) : null,
    octoSessionId: bindingAllowed && input?.octoSessionId ? String(input.octoSessionId) : null,
    presentationLensId:
      bindingAllowed && input?.presentationLensId ? String(input.presentationLensId) : null,
    active: false,
    readOnly: true
  });
}
