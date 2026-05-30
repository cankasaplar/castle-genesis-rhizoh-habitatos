/**
 * PR-4-A0 — Spatial anchor runtime (room digital map, **sensorless**).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Deterministic, replayable, canonical, privacy-safe registry of **room** anchors.
 * Distinct from `spatialAnchorResolverV0.js` (geo lon/lat weights) and `geographicAnchorsV0.js`.
 *
 * Next: PR-4-A1 sensor path produces **hypotheses** only (`spatialObservationHypothesisV0.js`).
 * PR-4-B: anchor-conditioned projection / field / audio runtimes (`spatialProjectionRuntimeV0.js`, etc.).
 */

export const SPATIAL_ANCHOR_REGISTRY_SCHEMA_V0 = "spatialRoomAnchors.v0";

/**
 * @typedef {{ id: string, type: string, spatialRole: string }} RoomAnchorV0
 */

/** Canonical room anchors (no device telemetry). */
export const ROOM_ANCHORS_V0 = Object.freeze({
  DESK: Object.freeze({
    id: "desk-anchor",
    type: "WORK_SURFACE",
    spatialRole: "STUDIO"
  }),
  WINDOW: Object.freeze({
    id: "window-anchor",
    type: "LIGHT_PORTAL",
    spatialRole: "ATMOSPHERIC_REFERENCE"
  }),
  NORTH_WALL: Object.freeze({
    id: "north-wall",
    type: "PROJECTION_SURFACE",
    spatialRole: "GREENROOM_LAYER"
  })
});

/**
 * @returns {readonly RoomAnchorV0[]}
 */
export function listRoomAnchorsV0() {
  return Object.freeze(Object.values(ROOM_ANCHORS_V0));
}

/**
 * @param {string} anchorId
 * @returns {RoomAnchorV0 | null}
 */
export function getRoomAnchorByIdV0(anchorId) {
  const id = String(anchorId || "");
  for (const k of Object.keys(ROOM_ANCHORS_V0)) {
    const a = /** @type {RoomAnchorV0} */ (ROOM_ANCHORS_V0[/** @type {keyof typeof ROOM_ANCHORS_V0} */ (k)]);
    if (a.id === id) return a;
  }
  return null;
}

/**
 * @param {string} key — `DESK` | `WINDOW` | `NORTH_WALL`
 * @returns {RoomAnchorV0 | null}
 */
export function getRoomAnchorByRegistryKeyV0(key) {
  const k = String(key || "").toUpperCase();
  if (k in ROOM_ANCHORS_V0) {
    return /** @type {RoomAnchorV0} */ (ROOM_ANCHORS_V0[/** @type {keyof typeof ROOM_ANCHORS_V0} */ (k)]);
  }
  return null;
}
