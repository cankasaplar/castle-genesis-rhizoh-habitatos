/**
 * World map initial camera — no geo → global orbit; with geo → local cinematic view.
 */

import { readCastleNexusGeoV0, readUserCastleAnchorGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { resolveCesiumMapCameraAnchorV0 } from "./rhizohCesiumImageryProfileV0.js";
import { readLocalGhostCastleAnchorsV0 } from "./localGhostCastleAnchorV0.js";
import { normalizeRhizohWorldMapToolIdV0 } from "./rhizohWorldMapToolV0.js";

export const WORLD_GLOBAL_ORBIT_CAMERA_V0 = Object.freeze({
  lon: 28.9,
  lat: 41.0,
  height: 18_500_000,
  headingDeg: 0,
  pitchDeg: -58
});

/**
 * User has device geo, session castle pick, or persisted ghost anchor.
 * @returns {boolean}
 */
export function hasUserLocalWorldGeoV0() {
  if (readCastleNexusGeoV0()) return true;
  if (readUserCastleAnchorGeoV0()) return true;
  return readLocalGhostCastleAnchorsV0().length > 0;
}

/**
 * @param {string} [mapTool]
 */
export function resolveWorldMapInitialCameraV0(mapTool) {
  const tool = normalizeRhizohWorldMapToolIdV0(mapTool);
  if (!hasUserLocalWorldGeoV0()) {
    return WORLD_GLOBAL_ORBIT_CAMERA_V0;
  }
  if (tool === "globe") {
    return WORLD_GLOBAL_ORBIT_CAMERA_V0;
  }
  return resolveCesiumMapCameraAnchorV0(tool);
}
