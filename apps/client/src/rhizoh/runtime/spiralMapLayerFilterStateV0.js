/**
 * SpiralMMO map layer visibility — explorer / castle / economy / seasonal.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_EXPLORER_MAP_UI_V0.md
 */

import { SPIRAL_MAP_LAYER_V0 } from "./spatialDistributionLayerV0.js";

const STORAGE_KEY_V0 = "rhizoh.spiral_map_layer_filter.v0";
export const SPIRAL_MAP_LAYER_FILTER_EVENT_V0 = "rhizoh:spiral-map-layer-filter-v0";

export const SPIRAL_MAP_LAYER_FILTER_KEYS_V0 = Object.freeze([
  SPIRAL_MAP_LAYER_V0.EXPLORER,
  SPIRAL_MAP_LAYER_V0.CASTLE,
  SPIRAL_MAP_LAYER_V0.ECONOMY,
  SPIRAL_MAP_LAYER_V0.SEASONAL
]);

const DEFAULT_STATE_V0 = Object.freeze({
  [SPIRAL_MAP_LAYER_V0.EXPLORER]: true,
  [SPIRAL_MAP_LAYER_V0.CASTLE]: false,
  [SPIRAL_MAP_LAYER_V0.ECONOMY]: false,
  [SPIRAL_MAP_LAYER_V0.SEASONAL]: false,
  includeDormant: false
});

export const SPIRAL_MAP_LAYER_FILTER_POLICY_V0 = Object.freeze({
  [SPIRAL_MAP_LAYER_V0.EXPLORER]: Object.freeze({
    tr: "Explorer",
    en: "Explorer",
    descriptionTr: "Traveler · Explorer · Ghost · Castle · Chess · Sports",
    descriptionEn: "Traveler · Explorer · Ghost · Castle · Chess · Sports"
  }),
  [SPIRAL_MAP_LAYER_V0.CASTLE]: Object.freeze({
    tr: "Castle",
    en: "Castle",
    descriptionTr: "Castle · Research · Academy · Authority",
    descriptionEn: "Castle · Research · Academy · Authority"
  }),
  [SPIRAL_MAP_LAYER_V0.ECONOMY]: Object.freeze({
    tr: "Economy",
    en: "Economy",
    descriptionTr: "Product · Design · Media · Shop",
    descriptionEn: "Product · Design · Media · Shop"
  }),
  [SPIRAL_MAP_LAYER_V0.SEASONAL]: Object.freeze({
    tr: "Seasonal",
    en: "Seasonal",
    descriptionTr: "06:44 döngüleri (deferred)",
    descriptionEn: "06:44 cycles (deferred)",
    deferred: true
  })
});

function isKnownSpiralLayerV0(key) {
  return SPIRAL_MAP_LAYER_FILTER_KEYS_V0.includes(String(key || ""));
}

function normalizeSpiralMapLayerFilterStateV0(raw = {}) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  /** @type {Record<string, boolean>} */
  const next = {};
  for (const key of SPIRAL_MAP_LAYER_FILTER_KEYS_V0) {
    next[key] =
      parsed[key] === undefined ? DEFAULT_STATE_V0[key] === true : parsed[key] === true;
  }
  next.includeDormant = parsed.includeDormant === true;
  next.fullWorldMesh = parsed.fullWorldMesh === true;
  next.realityMode =
    typeof parsed.realityMode === "string" && parsed.realityMode.trim()
      ? String(parsed.realityMode).trim()
      : undefined;
  return Object.freeze(next);
}

/**
 * @returns {typeof DEFAULT_STATE_V0}
 */
export function readSpiralMapLayerFilterStateV0() {
  if (typeof localStorage === "undefined") return DEFAULT_STATE_V0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    return normalizeSpiralMapLayerFilterStateV0(raw ? JSON.parse(raw) : {});
  } catch {
    return DEFAULT_STATE_V0;
  }
}

/**
 * @param {Partial<typeof DEFAULT_STATE_V0>} patch
 * @param {{ replace?: boolean }} [opts]
 */
export function writeSpiralMapLayerFilterStateV0(patch, opts = {}) {
  const prev = readSpiralMapLayerFilterStateV0();
  /** @type {Record<string, boolean>} */
  const sanitizedPatch = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === "includeDormant") {
      sanitizedPatch.includeDormant = value === true;
      continue;
    }
    if (key === "fullWorldMesh") {
      sanitizedPatch.fullWorldMesh = value === true;
      continue;
    }
    if (key === "realityMode") {
      if (value === null) {
        sanitizedPatch.realityMode = null;
        continue;
      }
      sanitizedPatch.realityMode = String(value || "").trim() || undefined;
      continue;
    }
    if (!isKnownSpiralLayerV0(key)) continue;
    sanitizedPatch[key] = value === true;
  }
  const merged = opts.replace === true ? sanitizedPatch : { ...prev, ...sanitizedPatch };
  if (!opts.replace && sanitizedPatch.realityMode === null) {
    merged.realityMode = undefined;
  }
  const next = normalizeSpiralMapLayerFilterStateV0(merged);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, {
        detail: Object.freeze({ state: next })
      })
    );
  }
  return next;
}

const REALITY_MODE_FOR_LAYER_FOCUS_V0 = Object.freeze({
  [SPIRAL_MAP_LAYER_V0.EXPLORER]: SPIRAL_MAP_LAYER_V0.EXPLORER,
  [SPIRAL_MAP_LAYER_V0.CASTLE]: SPIRAL_MAP_LAYER_V0.CASTLE,
  [SPIRAL_MAP_LAYER_V0.ECONOMY]: SPIRAL_MAP_LAYER_V0.ECONOMY
});

/**
 * Single-layer focus — e.g. Explorer Map full-screen mode.
 * @param {string} layerId
 */
export function focusSpiralMapLayerV0(layerId) {
  const id = String(layerId || "").trim();
  if (!isKnownSpiralLayerV0(id)) return readSpiralMapLayerFilterStateV0();
  /** @type {Record<string, boolean | string>} */
  const patch = {
    includeDormant: id !== SPIRAL_MAP_LAYER_V0.EXPLORER,
    realityMode: REALITY_MODE_FOR_LAYER_FOCUS_V0[id] || undefined
  };
  for (const key of SPIRAL_MAP_LAYER_FILTER_KEYS_V0) {
    patch[key] = key === id;
  }
  return writeSpiralMapLayerFilterStateV0(patch, { replace: true });
}

/**
 * @param {string} [search]
 */
export function applySpiralMapLayerFromQueryV0(search) {
  const params = new URLSearchParams(String(search || ""));
  const layer = params.get("spiralLayer");
  if (!layer || !isKnownSpiralLayerV0(layer)) return null;
  return focusSpiralMapLayerV0(layer);
}

export function listSpiralMapLayerFilterRowsV0() {
  return SPIRAL_MAP_LAYER_FILTER_KEYS_V0.map((key) =>
    Object.freeze({ key, ...SPIRAL_MAP_LAYER_FILTER_POLICY_V0[key] })
  );
}

/** @param {() => void} onChange */
export function subscribeSpiralMapLayerFilterStateV0(onChange) {
  if (typeof window === "undefined" || typeof onChange !== "function") return () => {};
  const handler = () => onChange();
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  };
  window.addEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
