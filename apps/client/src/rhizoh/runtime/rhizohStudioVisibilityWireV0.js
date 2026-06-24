/**
 * Studio V1 visibility wire — DevTools + boot hook.
 * RESEARCH-ONLY — read-only product bridge.
 */

import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";

export const RHIZOH_STUDIO_VISIBILITY_WIRE_SCHEMA_V0 = "castle.rhizoh.studio_visibility_wire.v0";

export function ensureRhizohStudioVisibilityDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.studioVisibility = () => buildRhizohStudioVisibilitySnapshotV0();
  return window.__rhizoh.studioVisibility;
}

/** @internal vitest */
export function resetRhizohStudioVisibilityWireForTestV0() {
  /* stateless — noop */
}
