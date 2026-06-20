/**
 * World-space map pin owner — session pin SSOT + substrate routing.
 * Cesium session pins: cesiumMapAnchorMarkersV0 only (billboards/entities).
 * Leaflet fallback: V11 marker layer via readWorldSpaceSessionMapPinRowsV0.
 * RESEARCH-ONLY
 */

import { resolveRhizohWorldSpaceCesiumActiveV0 } from "./rhizohLayerContextV0.js";
import { isRhizohWorldSpaceMapStageV0 } from "./rhizohWorldSurfacePolicyV0.js";
import { listSovereignWorldMapNodesForViewV0 } from "./sovereignWorldMapNodesV0.js";
import { getLiveMatchMapPinsV0 } from "./worldMapLiveMatchPinsV0.js";
import { getPrismCubeMapPinRowsV0 } from "./cesiumWorldCommitV0.js";
import { resolveUserCastleGeoForMapViewV0 } from "./worldMapBootstrapGeoV0.js";
import { getArenaPopulationPinsV0 } from "./arenaPopulationLayerV0.js";
import {
  readSpiralMapLayerFilterStateV0
} from "./spiralMapLayerFilterStateV0.js";
import { resolveSpiralMapLayerV0 } from "./spatialDistributionLayerV0.js";
import {
  buildOriginHomeSerencebeyPinV0,
  isOriginHomeSerencebeyPinV0
} from "./worldMapOriginHomePinV0.js";

/**
 * Pins that stay visible in explorer-only SpiralMMO filter (spec + product).
 * @param {object} pin
 * @returns {boolean}
 */
export function isExplorerOnlyAlwaysVisiblePinV0(pin) {
  if (!pin || typeof pin !== "object") return false;
  const id = String(pin.id || "");
  const type = String(pin.type || "");
  if (id === "my_castle" || type === "my_castle") return true;
  if (isOriginHomeSerencebeyPinV0(pin)) return true;
  if (type === "broadcast" || id.startsWith("live_match:")) return true;
  return false;
}

/**
 * @param {object} pin
 * @returns {string | null}
 */
export function resolvePinSpiralLayerV0(pin) {
  if (!pin || typeof pin !== "object") return null;
  if (pin.spiralLayer) return String(pin.spiralLayer);
  if (pin.towerClass) return resolveSpiralMapLayerV0(pin.towerClass);
  return null;
}

/**
 * V11 Explorer first-live: hide legacy sovereign mesh when only explorer layer is active.
 * @param {object} filterState
 */
export function isExplorerOnlySpiralFilterV0(filterState) {
  const filter = filterState || readSpiralMapLayerFilterStateV0();
  return (
    filter.explorer === true &&
    filter.castle !== true &&
    filter.economy !== true &&
    filter.seasonal !== true
  );
}

/**
 * @param {readonly object[]} sovereign
 * @param {object} filterState
 */
export function filterSovereignPinsForSpiralMapViewV0(sovereign, filterState) {
  if (!isExplorerOnlySpiralFilterV0(filterState)) {
    return sovereign;
  }
  return Object.freeze(
    sovereign.filter(
      (pin) =>
        pin.id === "my_castle" ||
        pin.type === "my_castle" ||
        isOriginHomeSerencebeyPinV0(pin)
    )
  );
}

/**
 * @param {readonly object[]} pins
 * @param {object} [filterState]
 */
export function filterPinsBySpiralMapLayerV0(pins, filterState) {
  const filter = filterState || readSpiralMapLayerFilterStateV0();
  return Object.freeze(
    pins.filter((pin) => {
      const layer = resolvePinSpiralLayerV0(pin);
      if (!layer) {
        if (isExplorerOnlySpiralFilterV0(filter)) {
          return isExplorerOnlyAlwaysVisiblePinV0(pin);
        }
        return true;
      }
      if (filter[layer] !== true) return false;
      if (pin.populationStatus === "dormant" && filter.includeDormant !== true) {
        return false;
      }
      return true;
    })
  );
}

/**
 * @param {readonly object[]} pins
 * @param {object} [filterState]
 */
export function listArenaPopulationMapPinsV0(pins, filterState) {
  const filter = filterState || readSpiralMapLayerFilterStateV0();
  return Object.freeze(
    pins.filter((pin) => {
      const layer = resolvePinSpiralLayerV0(pin);
      if (!layer) return false;
      if (filter[layer] !== true) return false;
      if (pin.populationStatus === "dormant" && filter.includeDormant !== true) return false;
      return true;
    })
  );
}

/**
 * Merge dormant arena population pins when castle/economy layers are enabled.
 * @param {readonly object[]} prismPins
 * @param {object} filterState
 */
function mergeArenaPopulationPinRowsV0(prismPins, filterState) {
  const populationPins = getArenaPopulationPinsV0();
  if (!populationPins.length) return prismPins;

  const showDormant =
    filterState.includeDormant === true ||
    filterState.castle === true ||
    filterState.economy === true;

  if (!showDormant) return prismPins;

  const existingIds = new Set(prismPins.map((p) => p.id));
  const dormant = populationPins.filter(
    (p) => p.populationStatus === "dormant" && !existingIds.has(p.id)
  );
  return [...prismPins, ...dormant];
}

export const RHIZOH_MAP_PIN_OWNER_SCHEMA_V0 = "castle.rhizoh.map_pin_owner.v0";

/** Single Cesium writer for session pins (entities + anchor sync). */
export const RHIZOH_CESIUM_SESSION_PIN_OWNER_V0 = "cesiumMapAnchorMarkersV0";

/** Leaflet marker path on World · Space when Cesium env/tool gate is off. */
export const RHIZOH_LEAFLET_PIN_RENDERER_V0 = "v11LeafletMarkers";

/**
 * Active pin substrate for World · Space.
 * @param {{ pathname?: string, worldDomain?: string, mapTool?: string, mapSurfaceActive?: boolean }} [ctx]
 * @returns {"cesium" | "leaflet"}
 */
export function resolveRhizohMapPinSubstrateV0(ctx = {}) {
  const pathname =
    String(ctx.pathname || (typeof window !== "undefined" ? window.location.pathname : "") || "");
  if (!isRhizohWorldSpaceMapStageV0({ pathname, worldDomain: ctx.worldDomain })) {
    return "leaflet";
  }
  return resolveRhizohWorldSpaceCesiumActiveV0({
    pathname,
    worldDomain: ctx.worldDomain,
    mapTool: ctx.mapTool,
    mapSurfaceActive: ctx.mapSurfaceActive
  })
    ? "cesium"
    : "leaflet";
}

/**
 * Unified session pin rows for Leaflet rendering (Cesium reads same sources via anchor sync).
 * @param {{
 *   userCastle?: object | null,
 *   liveMatchPins?: object[],
 *   prismCubePins?: object[],
 *   spiralLayerFilter?: object,
 *   applySpiralFilter?: boolean
 * }} [opts]
 */
export function readWorldSpaceSessionMapPinRowsV0(opts = {}) {
  const userCastle = opts.userCastle ?? resolveUserCastleGeoForMapViewV0();
  const filterState = opts.spiralLayerFilter ?? readSpiralMapLayerFilterStateV0();
  const originHome = buildOriginHomeSerencebeyPinV0();
  const sovereign = filterSovereignPinsForSpiralMapViewV0(
    [originHome, ...listSovereignWorldMapNodesForViewV0({ userCastle })],
    filterState
  );
  const liveMatch = opts.liveMatchPins ?? getLiveMatchMapPinsV0();
  let prismCubes = opts.prismCubePins ?? getPrismCubeMapPinRowsV0();
  prismCubes = mergeArenaPopulationPinRowsV0(prismCubes, filterState);
  const rows = Object.freeze([...sovereign, ...liveMatch, ...prismCubes]);
  if (opts.applySpiralFilter === false) return rows;
  return filterPinsBySpiralMapLayerV0(rows, filterState);
}

export function getRhizohMapPinOwnerSnapshotV0(ctx = {}) {
  const substrate = resolveRhizohMapPinSubstrateV0(ctx);
  const rows = readWorldSpaceSessionMapPinRowsV0();
  return Object.freeze({
    schema: RHIZOH_MAP_PIN_OWNER_SCHEMA_V0,
    cesiumSessionOwner: RHIZOH_CESIUM_SESSION_PIN_OWNER_V0,
    leafletRenderer: RHIZOH_LEAFLET_PIN_RENDERER_V0,
    substrate,
    sessionPinCount: rows.length,
    atMs: Date.now()
  });
}

export function publishRhizohMapPinOwnerRegistryV0(ctx = {}) {
  if (typeof window === "undefined") return getRhizohMapPinOwnerSnapshotV0(ctx);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mapPinOwner = getRhizohMapPinOwnerSnapshotV0(ctx);
  return window.__rhizoh.mapPinOwner;
}
