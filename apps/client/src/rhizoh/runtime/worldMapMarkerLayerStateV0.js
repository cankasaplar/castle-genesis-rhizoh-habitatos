/**
 * World map marker layer visibility — HUD filter toggles (non-destructive hide).
 */

const STORAGE_KEY_V0 = "rhizoh.world.map_marker_layers.v0";
export const WORLD_MAP_MARKER_LAYER_EVENT_V0 = "rhizoh:world-map-marker-layers-v0";

export const WORLD_MAP_MARKER_LAYERS_V0 = Object.freeze([
  "systemAnchors",
  "memoryBeacons",
  "ecosystemNodes",
  "userCastle",
  "ghostCastles",
  "coPresence",
  "epistemicPoi"
]);

const DEFAULT_STATE_V0 = Object.freeze({
  systemAnchors: true,
  memoryBeacons: true,
  ecosystemNodes: false,
  userCastle: true,
  ghostCastles: false,
  coPresence: false,
  epistemicPoi: false
});

export const WORLD_MAP_MARKER_LAYER_POLICY_V0 = Object.freeze({
  systemAnchors: Object.freeze({
    allowed: true,
    defaultVisible: true,
    tier: "root",
    tr: "Rhizoh Core",
    en: "Rhizoh Core"
  }),
  userCastle: Object.freeze({
    allowed: true,
    defaultVisible: true,
    tier: "actionable",
    tr: "Aktif Castle",
    en: "Active Castle"
  }),
  memoryBeacons: Object.freeze({
    allowed: true,
    defaultVisible: true,
    tier: "memory",
    tr: "Memory node",
    en: "Memory node"
  }),
  ecosystemNodes: Object.freeze({
    allowed: false,
    defaultVisible: false,
    tier: "archive",
    tr: "Ekosistem arşivi",
    en: "Ecosystem archive"
  }),
  ghostCastles: Object.freeze({
    allowed: false,
    defaultVisible: false,
    tier: "placeholder",
    tr: "Ghost placeholder",
    en: "Ghost placeholder"
  }),
  coPresence: Object.freeze({
    allowed: false,
    defaultVisible: false,
    tier: "gated",
    tr: "Witness",
    en: "Witness"
  }),
  epistemicPoi: Object.freeze({
    allowed: false,
    defaultVisible: false,
    tier: "passive",
    tr: "POI galerisi",
    en: "POI gallery"
  })
});

function isKnownLayerV0(key) {
  return WORLD_MAP_MARKER_LAYERS_V0.includes(String(key || ""));
}

export function isWorldMapMarkerLayerAllowedV0(key) {
  const policy = WORLD_MAP_MARKER_LAYER_POLICY_V0[String(key || "")];
  return policy?.allowed === true;
}

export function listVisibleWorldMapMarkerLayerRowsV0() {
  return WORLD_MAP_MARKER_LAYERS_V0
    .map((key) => Object.freeze({ key, ...WORLD_MAP_MARKER_LAYER_POLICY_V0[key] }))
    .filter((row) => row.allowed);
}

function normalizeWorldMapMarkerLayerStateV0(raw = {}) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  /** @type {Record<string, boolean>} */
  const next = {};
  for (const key of WORLD_MAP_MARKER_LAYERS_V0) {
    const policy = WORLD_MAP_MARKER_LAYER_POLICY_V0[key];
    if (!policy?.allowed) {
      next[key] = false;
      continue;
    }
    next[key] = parsed[key] === undefined ? policy.defaultVisible === true : parsed[key] === true;
  }
  return Object.freeze(next);
}

/**
 * @returns {typeof DEFAULT_STATE_V0}
 */
export function readWorldMapMarkerLayerStateV0() {
  if (typeof localStorage === "undefined") return DEFAULT_STATE_V0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    return normalizeWorldMapMarkerLayerStateV0(raw ? JSON.parse(raw) : {});
  } catch {
    return DEFAULT_STATE_V0;
  }
}

/**
 * @param {Partial<typeof DEFAULT_STATE_V0>} patch
 */
export function writeWorldMapMarkerLayerStateV0(patch) {
  const prev = readWorldMapMarkerLayerStateV0();
  /** @type {Record<string, boolean>} */
  const sanitizedPatch = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (!isKnownLayerV0(key) || !isWorldMapMarkerLayerAllowedV0(key)) continue;
    sanitizedPatch[key] = value === true;
  }
  const next = normalizeWorldMapMarkerLayerStateV0({ ...prev, ...sanitizedPatch });
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORLD_MAP_MARKER_LAYER_EVENT_V0, {
        detail: Object.freeze({ state: next })
      })
    );
  }
  return next;
}

/** @param {() => void} onChange */
export function subscribeWorldMapMarkerLayerStateV0(onChange) {
  if (typeof window === "undefined" || typeof onChange !== "function") return () => {};
  const handler = () => onChange();
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  };
  window.addEventListener(WORLD_MAP_MARKER_LAYER_EVENT_V0, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(WORLD_MAP_MARKER_LAYER_EVENT_V0, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
