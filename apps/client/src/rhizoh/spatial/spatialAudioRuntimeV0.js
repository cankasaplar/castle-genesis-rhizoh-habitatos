/**
 * PR-4-B — Spatial audio runtime (directional zones — no cognition layer).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Anchor-based routing hints only (pan / spread). Not voice-of-assistant, not dialog state,
 * not user intent classification.
 */

import { getRoomAnchorByIdV0 } from "./spatialAnchorRegistryV0.js";

const SCHEMA = "spatialAudioRuntime.v0";

function clampPan(x) {
  const n = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return Math.min(1, Math.max(-1, n));
}

/**
 * @param {string | null | undefined} anchorId
 * @returns {Readonly<{ schema: string, zoneId: string, pan01: number, spread01: number }>}
 */
export function routeDirectionalAudioForAnchorV0(anchorId) {
  const a = anchorId != null ? getRoomAnchorByIdV0(String(anchorId)) : null;
  if (!a) {
    return Object.freeze({
      schema: SCHEMA,
      zoneId: "ambient_room",
      pan01: 0,
      spread01: 1
    });
  }
  if (a.id === "desk-anchor") {
    return Object.freeze({
      schema: SCHEMA,
      zoneId: "desk_near_field",
      pan01: clampPan(-0.18),
      spread01: 0.44
    });
  }
  if (a.id === "window-anchor") {
    return Object.freeze({
      schema: SCHEMA,
      zoneId: "light_portal_wide",
      pan01: clampPan(0.32),
      spread01: 0.62
    });
  }
  if (a.id === "north-wall") {
    return Object.freeze({
      schema: SCHEMA,
      zoneId: "wall_projection_slot",
      pan01: 0,
      spread01: 0.52
    });
  }
  return Object.freeze({ schema: SCHEMA, zoneId: "ambient_room", pan01: 0, spread01: 1 });
}
