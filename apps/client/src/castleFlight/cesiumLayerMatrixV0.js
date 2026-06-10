/**
 * Cesium layer logical matrix — map tool × hardware → imagery / terrain / OSM buildings.
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

import {
  normalizeRhizohWorldMapToolIdV0,
  readRhizohWorldMapToolV0
} from "../rhizoh/runtime/rhizohWorldMapToolV0.js";
import { resolveCesiumImageryProfileForMapToolV0 } from "../rhizoh/runtime/rhizohCesiumImageryProfileV0.js";
import { detectCesiumLowHardwareV0 } from "./cesiumMapHardwareProfileV0.js";

/**
 * @typedef {'streets'|'satellite'|'city_3d'|'terrain'|'dark'} CesiumImageryProfileV0
 */

/**
 * @param {{
 *   mapTool?: string,
 *   lowHardware?: boolean,
 *   cfg?: { cesiumWorldTerrain?: boolean, cesiumOsmBuildings?: boolean }
 * }} [opts]
 */
export function resolveCesiumLayerMatrixV0(opts = {}) {
  const tool = normalizeRhizohWorldMapToolIdV0(opts.mapTool ?? readRhizohWorldMapToolV0());
  const lowHardware = opts.lowHardware ?? detectCesiumLowHardwareV0();
  const cfg = opts.cfg || {};

  if (lowHardware) {
    const imageryProfile =
      tool === "satellite" || tool === "globe"
        ? /** @type {CesiumImageryProfileV0} */ ("satellite")
        : "dark";
    return Object.freeze({
      mapTool: tool,
      lowHardware: true,
      sceneMode: "2d",
      imageryProfile,
      terrainEnabled: false,
      osmBuildingsVisible: false,
      osmBuildingsNeonStyle: false,
      imageryQuality: "compressed"
    });
  }

  const imageryProfile = /** @type {CesiumImageryProfileV0} */ (
    resolveCesiumImageryProfileForMapToolV0(tool)
  );
  const terrainEnabled =
    !!cfg.cesiumWorldTerrain &&
    (tool === "terrain" || tool === "city_map" || tool === "anchor_map");
  const osmBuildingsVisible =
    !!cfg.cesiumOsmBuildings &&
    (tool === "city_map" || tool === "streets" || tool === "anchor_map");

  return Object.freeze({
    mapTool: tool,
    lowHardware: false,
    sceneMode: "3d",
    imageryProfile,
    terrainEnabled,
    osmBuildingsVisible,
    osmBuildingsNeonStyle: osmBuildingsVisible && (tool === "city_map" || tool === "streets"),
    imageryQuality: tool === "satellite" || tool === "city_map" ? "high" : "standard"
  });
}
