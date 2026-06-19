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
import { resolveUserCastleGeoForMapViewV0 } from "./worldMapBootstrapGeoV0.js";

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
 * @param {{ userCastle?: object | null, liveMatchPins?: object[] }} [opts]
 */
export function readWorldSpaceSessionMapPinRowsV0(opts = {}) {
  const userCastle = opts.userCastle ?? resolveUserCastleGeoForMapViewV0();
  const sovereign = listSovereignWorldMapNodesForViewV0({ userCastle });
  const liveMatch = opts.liveMatchPins ?? getLiveMatchMapPinsV0();
  return Object.freeze([...sovereign, ...liveMatch]);
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
