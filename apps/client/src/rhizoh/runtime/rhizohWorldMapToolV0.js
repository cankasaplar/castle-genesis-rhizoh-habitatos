/**
 * World map tools — GLOBE home + explicit REAL_MAP sub-layers (continuity + LAA).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

import { getOriginSeedAnchorV0, resolveDisplayAnchorV0 } from "./memoryAnchorSystemV0.js";
import { ISTANBUL_POI } from "../../castleFlight/geo.js";
import {
  readCastleNexusGeoV0,
  resolveWorldMapBootstrapGeoV0
} from "./worldMapBootstrapGeoV0.js";
import { resolveWorldMapCameraTargetV0 } from "./worldMapCameraGeoV0.js";
import { applyCesiumImageryForMapToolV0 } from "./rhizohCesiumImageryProfileV0.js";
import { routeCesiumCommandV0 } from "../../castleFlight/cesiumCommandRouterV0.js";

export const RHIZOH_WORLD_MAP_TOOL_CONTRACT_V0 = "rhizoh-world-map-tool-v0";
export const RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0 = "rhizoh:world-map-tool-change";

/** @typedef {'globe' | 'city_map' | 'satellite' | 'streets' | 'terrain' | 'anchor_map'} RhizohWorldMapToolIdV0 */

export const RHIZOH_WORLD_MAP_TOOL_IDS_V0 = Object.freeze([
  "globe",
  "city_map",
  "satellite",
  "streets",
  "terrain",
  "anchor_map"
]);

const STORAGE_KEY_V0 = "rhizoh.world.map_tool.v0";

/**
 * @param {string} toolId
 * @returns {RhizohWorldMapToolIdV0}
 */
export function normalizeRhizohWorldMapToolIdV0(toolId) {
  const id = String(toolId || "globe");
  return RHIZOH_WORLD_MAP_TOOL_IDS_V0.includes(/** @type {RhizohWorldMapToolIdV0} */ (id))
    ? /** @type {RhizohWorldMapToolIdV0} */ (id)
    : "globe";
}

/**
 * @returns {RhizohWorldMapToolIdV0}
 */
export function readRhizohWorldMapToolV0() {
  if (typeof localStorage === "undefined") return "globe";
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    return normalizeRhizohWorldMapToolIdV0(raw || "globe");
  } catch {
    return "globe";
  }
}

/**
 * @param {RhizohWorldMapToolIdV0 | string} toolId
 */
export function writeRhizohWorldMapToolV0(toolId) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, id);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0, {
        detail: Object.freeze({ tool: id })
      })
    );
  }
  return id;
}

/**
 * @param {RhizohWorldMapToolIdV0 | string} [from]
 * @returns {RhizohWorldMapToolIdV0}
 */
export function cycleRhizohWorldMapToolV0(from) {
  const current = normalizeRhizohWorldMapToolIdV0(from ?? readRhizohWorldMapToolV0());
  const idx = RHIZOH_WORLD_MAP_TOOL_IDS_V0.indexOf(current);
  return RHIZOH_WORLD_MAP_TOOL_IDS_V0[(idx + 1) % RHIZOH_WORLD_MAP_TOOL_IDS_V0.length];
}

/**
 * @param {RhizohWorldMapToolIdV0 | string} toolId
 * @param {boolean} [tr]
 */
export function resolveRhizohWorldMapToolLabelTrV0(toolId, tr = true) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (!tr) {
    if (id === "globe") return "Globe";
    if (id === "city_map") return "City 3D";
    if (id === "satellite") return "Satellite";
    if (id === "streets") return "Streets";
    if (id === "terrain") return "Terrain";
    return "Anchor";
  }
  if (id === "globe") return "Küre";
  if (id === "city_map") return "3D şehir";
  if (id === "satellite") return "Uydu";
  if (id === "streets") return "Sokak";
  if (id === "terrain") return "Arazi";
  return "Bağlantı";
}

/**
 * @param {RhizohWorldMapToolIdV0 | string} toolId
 * @param {{ nexusGeo?: { lat?: number, lon?: number } | null, castles?: Array<{ lat?: number, lon?: number, label?: string }> }} [ctx]
 * @returns {{ lat: number, lon: number, alt?: number, label?: string } | null}
 */
export function resolveRhizohWorldMapFlyTargetV0(toolId, ctx = {}) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (id === "globe") return null;

  const bootstrap = resolveWorldMapBootstrapGeoV0();
  const nexus = ctx.nexusGeo && Number.isFinite(ctx.nexusGeo.lat) ? ctx.nexusGeo : readCastleNexusGeoV0();

  if (id === "city_map") {
    const rawLat = Number.isFinite(nexus?.lat) ? Number(nexus.lat) : bootstrap.lat;
    const rawLon = Number.isFinite(nexus?.lon) ? Number(nexus.lon) : bootstrap.lon;
    const cam = resolveWorldMapCameraTargetV0({ lat: rawLat, lon: rawLon });
    return Object.freeze({
      lat: cam.lat,
      lon: cam.lon,
      alt: 780,
      label: String(bootstrap.label || "Serencebey")
    });
  }

  if (id === "terrain") {
    const rawLat = Number.isFinite(nexus?.lat) ? Number(nexus.lat) : bootstrap.lat;
    const rawLon = Number.isFinite(nexus?.lon) ? Number(nexus.lon) : bootstrap.lon;
    const cam = resolveWorldMapCameraTargetV0({ lat: rawLat, lon: rawLon });
    return Object.freeze({ lat: cam.lat, lon: cam.lon, alt: 4200, label: "Terrain" });
  }

  if (id === "satellite" || id === "streets") {
    const rawLat = Number.isFinite(nexus?.lat) ? Number(nexus.lat) : bootstrap.lat;
    const rawLon = Number.isFinite(nexus?.lon) ? Number(nexus.lon) : bootstrap.lon;
    const cam = resolveWorldMapCameraTargetV0({ lat: rawLat, lon: rawLon });
    return Object.freeze({
      lat: cam.lat,
      lon: cam.lon,
      alt: id === "satellite" ? 2800 : 1200,
      label: id === "satellite" ? "Satellite" : "Streets"
    });
  }

  const castles = Array.isArray(ctx.castles) ? ctx.castles : [];
  for (const c of castles) {
    if (Number.isFinite(c?.lat) && Number.isFinite(c?.lon)) {
      return Object.freeze({
        lat: Number(c.lat),
        lon: Number(c.lon),
        alt: 1180,
        label: String(c.label || "Kale")
      });
    }
  }

  const geo = ctx.nexusGeo;
  if (Number.isFinite(geo?.lat) && Number.isFinite(geo?.lon)) {
    return Object.freeze({
      lat: Number(geo.lat),
      lon: Number(geo.lon),
      alt: 1180,
      label: "Konumun"
    });
  }

  const display = resolveDisplayAnchorV0();
  const seed = getOriginSeedAnchorV0();
  if (seed?.location?.lat != null && seed?.location?.lon != null) {
    return Object.freeze({
      lat: Number(seed.location.lat),
      lon: Number(seed.location.lon),
      alt: 1180,
      label: String(display?.primary_label || seed.label || "Bağlantı")
    });
  }

  return null;
}

/**
 * @param {RhizohWorldMapToolIdV0 | string} toolId
 * @param {{ lat: number, lon: number, alt?: number } | null} target
 * @param {string} source
 */
function routeWorldMapFlyV0(toolId, target, source) {
  if (typeof window === "undefined") return;
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  const meta = Object.freeze({
    ingress: "applyRhizohWorldMapToolV0",
    mapTool: id,
    toolSource: source
  });

  if (id === "globe") {
    routeCesiumCommandV0({
      op: "topology_globe",
      source: "world_map_tool",
      meta
    });
    return;
  }

  if (id === "city_map" || id === "streets" || id === "anchor_map") {
    routeCesiumCommandV0({
      op: "bootstrap_viewport",
      source: "world_map_tool",
      meta
    });
    return;
  }

  if (target && Number.isFinite(target.lat) && Number.isFinite(target.lon)) {
    routeCesiumCommandV0({
      op: "fly_to",
      source: "world_map_tool",
      geo: Object.freeze({
        lat: target.lat,
        lon: target.lon,
        alt: target.alt ?? 1180
      }),
      meta
    });
  }
}

/**
 * Apply map tool inside WORLD (map is sub-layer; GLOBE = home).
 * @param {RhizohWorldMapToolIdV0 | string} toolId
 * @param {{
 *   setRealityMode?: (mode: string, opts?: object) => Promise<unknown>,
 *   flyContext?: { nexusGeo?: object, castles?: object[] },
 *   source?: string
 * }} [opts]
 */
export async function applyRhizohWorldMapToolV0(toolId, opts = {}) {
  const tool = writeRhizohWorldMapToolV0(toolId);
  const setMode =
    opts.setRealityMode ??
    (await import("../../reality/realityDirector.js")).setRealityMode;
  const source = String(opts.source || "WORLD_MAP_TOOL");

  if (tool === "globe") {
    await setMode("REAL_MAP", {
      source: `${source}_GLOBE_ORBIT`,
      productSurface: "world"
    });
    applyCesiumImageryForMapToolV0("globe");
    window.setTimeout(() => routeWorldMapFlyV0(tool, null, source), 140);
    return Object.freeze({ tool, realityMode: "REAL_MAP", fly: null });
  }

  await setMode("REAL_MAP", {
    source: "MAP_TOOL_EXPLICIT",
    productSurface: "world"
  });

  const fly = resolveRhizohWorldMapFlyTargetV0(tool, opts.flyContext || {});
  window.setTimeout(() => routeWorldMapFlyV0(tool, fly, source), 140);
  applyCesiumImageryForMapToolV0(tool);
  return Object.freeze({ tool, realityMode: "REAL_MAP", fly });
}

/** @returns {RhizohWorldMapToolIdV0} */
export function getRhizohWorldMapToolSnapshotV0() {
  return readRhizohWorldMapToolV0();
}

/** @param {() => void} onChange */
export function subscribeRhizohWorldMapToolV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  };
  window.addEventListener(RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
