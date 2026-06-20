/**
 * SpiralMMO Reality Mode — Explorer / Castle / Economy / Full World presets.
 * RESEARCH-ONLY
 */

import { SPIRAL_MAP_LAYER_V0 } from "./spatialDistributionLayerV0.js";
import {
  readSpiralMapLayerFilterStateV0,
  SPIRAL_MAP_LAYER_FILTER_EVENT_V0,
  writeSpiralMapLayerFilterStateV0
} from "./spiralMapLayerFilterStateV0.js";
import { writeWorldMapMarkerLayerStateV0 } from "./worldMapMarkerLayerStateV0.js";

export const SPIRAL_MAP_REALITY_MODE_V0 = Object.freeze({
  EXPLORER: "explorer",
  CASTLE: "castle",
  ECONOMY: "economy",
  FULL_WORLD: "full_world"
});

export const SPIRAL_MAP_REALITY_MODE_EVENT_V0 = "rhizoh:spiral-map-reality-mode-v0";
export const CASTLE_IDENTITY_MODE_EVENT_V0 = "rhizoh:castle-identity-mode-v0";
/** Dedicated SSOT — survives legacy layer-filter merges; user/DevTools probe target. */
export const SPIRAL_MAP_REALITY_MODE_LS_KEY_V0 = "rhizoh.spiral_map_reality_mode.v0";

/** @type {Record<string, object>} */
const REALITY_MODE_PRESETS_V0 = Object.freeze({
  [SPIRAL_MAP_REALITY_MODE_V0.EXPLORER]: Object.freeze({
    [SPIRAL_MAP_LAYER_V0.EXPLORER]: true,
    [SPIRAL_MAP_LAYER_V0.CASTLE]: false,
    [SPIRAL_MAP_LAYER_V0.ECONOMY]: false,
    [SPIRAL_MAP_LAYER_V0.SEASONAL]: false,
    includeDormant: false,
    fullWorldMesh: false,
    realityMode: SPIRAL_MAP_REALITY_MODE_V0.EXPLORER
  }),
  [SPIRAL_MAP_REALITY_MODE_V0.CASTLE]: Object.freeze({
    [SPIRAL_MAP_LAYER_V0.EXPLORER]: false,
    [SPIRAL_MAP_LAYER_V0.CASTLE]: true,
    [SPIRAL_MAP_LAYER_V0.ECONOMY]: false,
    [SPIRAL_MAP_LAYER_V0.SEASONAL]: false,
    includeDormant: true,
    fullWorldMesh: false,
    realityMode: SPIRAL_MAP_REALITY_MODE_V0.CASTLE
  }),
  [SPIRAL_MAP_REALITY_MODE_V0.ECONOMY]: Object.freeze({
    [SPIRAL_MAP_LAYER_V0.EXPLORER]: false,
    [SPIRAL_MAP_LAYER_V0.CASTLE]: false,
    [SPIRAL_MAP_LAYER_V0.ECONOMY]: true,
    [SPIRAL_MAP_LAYER_V0.SEASONAL]: false,
    includeDormant: true,
    fullWorldMesh: false,
    realityMode: SPIRAL_MAP_REALITY_MODE_V0.ECONOMY
  }),
  [SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD]: Object.freeze({
    [SPIRAL_MAP_LAYER_V0.EXPLORER]: true,
    [SPIRAL_MAP_LAYER_V0.CASTLE]: true,
    [SPIRAL_MAP_LAYER_V0.ECONOMY]: true,
    [SPIRAL_MAP_LAYER_V0.SEASONAL]: false,
    includeDormant: true,
    fullWorldMesh: true,
    realityMode: SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD
  })
});

export function listRealityModeRowsV0() {
  return Object.freeze([
    Object.freeze({
      id: SPIRAL_MAP_REALITY_MODE_V0.EXPLORER,
      tr: "Explorer",
      en: "Explorer",
      hintTr: "Keşif · seed ghost pinleri",
      hintEn: "Discovery · seed ghosts"
    }),
    Object.freeze({
      id: SPIRAL_MAP_REALITY_MODE_V0.CASTLE,
      tr: "Castle",
      en: "Castle",
      hintTr: "Kimlik · HOME + MY CASTLE · memory",
      hintEn: "Identity · HOME + MY CASTLE · memory"
    }),
    Object.freeze({
      id: SPIRAL_MAP_REALITY_MODE_V0.ECONOMY,
      tr: "Economy",
      en: "Economy",
      hintTr: "Ürün · media · shop",
      hintEn: "Product · media · shop"
    }),
    Object.freeze({
      id: SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD,
      tr: "Full World",
      en: "Full World",
      hintTr: "Debug — tüm sovereign mesh",
      hintEn: "Debug — full sovereign mesh"
    })
  ]);
}

const SPIRAL_MAP_LAYER_KEYS_V0 = Object.freeze([
  SPIRAL_MAP_LAYER_V0.EXPLORER,
  SPIRAL_MAP_LAYER_V0.CASTLE,
  SPIRAL_MAP_LAYER_V0.ECONOMY,
  SPIRAL_MAP_LAYER_V0.SEASONAL
]);

/**
 * Layer flags must match the preset — stale realityMode labels are ignored.
 * @param {string} modeId
 * @param {object} filterState
 */
export function spiralMapFilterMatchesRealityPresetV0(modeId, filterState) {
  const preset = REALITY_MODE_PRESETS_V0[String(modeId || "").trim()];
  if (!preset || !filterState) return false;
  for (const key of SPIRAL_MAP_LAYER_KEYS_V0) {
    if (filterState[key] !== preset[key]) return false;
  }
  if (filterState.includeDormant !== preset.includeDormant) return false;
  if (filterState.fullWorldMesh !== preset.fullWorldMesh) return false;
  return true;
}

/**
 * @param {object} [filterState]
 * @returns {string}
 */
export function readSpiralMapRealityModeV0(filterState) {
  const filter = filterState || readSpiralMapLayerFilterStateV0();
  const mode = String(filter.realityMode || "").trim();
  if (mode && REALITY_MODE_PRESETS_V0[mode] && spiralMapFilterMatchesRealityPresetV0(mode, filter)) {
    return mode;
  }
  if (filter.fullWorldMesh === true) return SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD;
  if (filter.castle === true && filter.explorer !== true && filter.economy !== true) {
    return SPIRAL_MAP_REALITY_MODE_V0.CASTLE;
  }
  if (filter.economy === true && filter.explorer !== true && filter.castle !== true) {
    return SPIRAL_MAP_REALITY_MODE_V0.ECONOMY;
  }
  return SPIRAL_MAP_REALITY_MODE_V0.EXPLORER;
}

/**
 * @param {object} [filterState]
 */
export function isCastleRealityModeV0(filterState) {
  return readSpiralMapRealityModeV0(filterState) === SPIRAL_MAP_REALITY_MODE_V0.CASTLE;
}

/**
 * @param {object} [filterState]
 */
export function isFullWorldRealityModeV0(filterState) {
  const filter = filterState || readSpiralMapLayerFilterStateV0();
  return (
    filter.fullWorldMesh === true ||
    readSpiralMapRealityModeV0(filter) === SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD
  );
}

/**
 * @param {string} modeId
 */
export function applySpiralMapRealityModeV0(modeId) {
  const mode = String(modeId || SPIRAL_MAP_REALITY_MODE_V0.EXPLORER).trim();
  const preset = REALITY_MODE_PRESETS_V0[mode] || REALITY_MODE_PRESETS_V0[SPIRAL_MAP_REALITY_MODE_V0.EXPLORER];
  const next = writeSpiralMapLayerFilterStateV0({ ...preset }, { replace: true });
  writePersistedSpiralMapRealityModeIdV0(readSpiralMapRealityModeV0(next));

  if (mode === SPIRAL_MAP_REALITY_MODE_V0.CASTLE) {
    writeWorldMapMarkerLayerStateV0({
      memoryBeacons: true,
      userCastle: true,
      systemAnchors: true
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CASTLE_IDENTITY_MODE_EVENT_V0, {
          detail: Object.freeze({ active: true, atMs: Date.now() })
        })
      );
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SPIRAL_MAP_REALITY_MODE_EVENT_V0, {
        detail: Object.freeze({ mode: readSpiralMapRealityModeV0(next), state: next })
      })
    );
  }

  return next;
}

const STORAGE_KEY_SPIRAL_FILTER_V0 = "rhizoh.spiral_map_layer_filter.v0";

/**
 * @returns {string | null}
 */
export function readPersistedSpiralMapRealityModeIdV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = String(localStorage.getItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0) || "").trim();
    return REALITY_MODE_PRESETS_V0[raw] ? raw : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} modeId
 */
function writePersistedSpiralMapRealityModeIdV0(modeId) {
  if (typeof localStorage === "undefined") return;
  try {
    const mode = String(modeId || "").trim();
    if (!REALITY_MODE_PRESETS_V0[mode]) return;
    localStorage.setItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0, mode);
  } catch {
    /* noop */
  }
}

function spiralMapFilterStorageNeedsHydrateV0(raw) {
  if (!raw || raw === "{}" || raw === "null") return true;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return true;
    return parsed.explorer === undefined && parsed.realityMode === undefined;
  } catch {
    return true;
  }
}

/**
 * Persist default explorer filter when localStorage is empty (first visit).
 */
export function ensureSpiralMapRealityModeHydratedV0() {
  if (typeof localStorage === "undefined") return readSpiralMapLayerFilterStateV0();

  const persistedMode = readPersistedSpiralMapRealityModeIdV0();
  if (persistedMode) {
    const filter = readSpiralMapLayerFilterStateV0();
    if (!spiralMapFilterMatchesRealityPresetV0(persistedMode, filter)) {
      return applySpiralMapRealityModeV0(persistedMode);
    }
    return filter;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPIRAL_FILTER_V0);
    if (spiralMapFilterStorageNeedsHydrateV0(raw)) {
      return applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
    }
    const inferred = readSpiralMapRealityModeV0();
    writePersistedSpiralMapRealityModeIdV0(inferred);
  } catch {
    return applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
  }
  return readSpiralMapLayerFilterStateV0();
}

/**
 * DevTools helpers for /world/space reality slice verification.
 */
export function publishSpiralMapRealityDevtoolsV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.applySpiralMapRealityModeV0 = (modeId) => {
    const requested = String(modeId || SPIRAL_MAP_REALITY_MODE_V0.EXPLORER).trim();
    const state = applySpiralMapRealityModeV0(requested);
    const readBack = readSpiralMapLayerFilterStateV0();
    const mode = readSpiralMapRealityModeV0(state);
    const presetOk = spiralMapFilterMatchesRealityPresetV0(requested, state);
    return Object.freeze({
      ok: presetOk,
      requested,
      mode,
      state,
      readBack,
      persistedRealityMode: readPersistedSpiralMapRealityModeIdV0(),
      storageKey: SPIRAL_MAP_REALITY_MODE_LS_KEY_V0
    });
  };
  window.__rhizoh.readSpiralMapRealityModeV0 = readSpiralMapRealityModeV0;
  window.__rhizoh.readPersistedSpiralMapRealityModeIdV0 = readPersistedSpiralMapRealityModeIdV0;
  window.__rhizoh.readSpiralMapLayerFilterStateV0 = readSpiralMapLayerFilterStateV0;
  window.__rhizoh.ensureSpiralMapRealityModeHydratedV0 = ensureSpiralMapRealityModeHydratedV0;
}
