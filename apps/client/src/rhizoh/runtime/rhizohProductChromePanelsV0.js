/**
 * Product surface panels — bottom nav toggles open/close per section (default all closed).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

export const RHIZOH_PRODUCT_CHROME_PANELS_CONTRACT_V0 = "rhizoh-product-chrome-panels-v0";
export const RHIZOH_CHROME_PANEL_CHANGE_EVENT_V0 = "rhizoh:chrome-panel-change";

/** @typedef {'world' | 'hall' | 'greenroom' | 'broadcast' | 'studio' | 'profile'} RhizohProductSurfacePanelIdV0 */

export const RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0 = Object.freeze([
  "world",
  "hall",
  "greenroom",
  "broadcast",
  "studio",
  "profile"
]);

/** @deprecated use RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0 */
export const RHIZOH_CHROME_PANEL_IDS_V0 = RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0;

const STORAGE_KEY_V0 = "rhizoh.product.surface_panels.v0";

/** Referentially stable empty snapshot for useSyncExternalStore. */
const EMPTY_PANELS_V0 = Object.freeze({
  world: false,
  hall: false,
  greenroom: false,
  broadcast: false,
  studio: false,
  profile: false
});

/** @type {Record<RhizohProductSurfacePanelIdV0, boolean> | null} */
let cachedPanelsSnapshotV0 = EMPTY_PANELS_V0;
/** @type {string} */
let cachedPanelsKeyV0 = "000000";

/**
 * @param {Record<string, boolean>} panels
 * @returns {string}
 */
function panelsCacheKeyV0(panels) {
  return RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0.map((id) => (panels[id] ? "1" : "0")).join("");
}

/**
 * @param {Record<string, boolean>} panels
 * @returns {Record<RhizohProductSurfacePanelIdV0, boolean>}
 */
function freezePanelsSnapshotV0(panels) {
  const key = panelsCacheKeyV0(panels);
  if (key === cachedPanelsKeyV0 && cachedPanelsSnapshotV0) {
    return cachedPanelsSnapshotV0;
  }
  cachedPanelsKeyV0 = key;
  cachedPanelsSnapshotV0 = Object.freeze({ ...panels });
  return cachedPanelsSnapshotV0;
}

/** @returns {Record<RhizohProductSurfacePanelIdV0, boolean>} */
function emptyPanelsV0() {
  return EMPTY_PANELS_V0;
}

/**
 * @returns {Record<RhizohProductSurfacePanelIdV0, boolean>}
 */
export function defaultRhizohChromePanelsOpenV0() {
  return emptyPanelsV0();
}

/**
 * @returns {Record<RhizohProductSurfacePanelIdV0, boolean>}
 */
export function readRhizohChromePanelsOpenV0() {
  if (typeof localStorage === "undefined") return emptyPanelsV0();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return emptyPanelsV0();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyPanelsV0();
    const base = emptyPanelsV0();
    /** @type {Record<string, boolean>} */
    const next = { ...base };
    for (const id of RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0) {
      next[id] = parsed[id] === true;
    }
    return freezePanelsSnapshotV0(next);
  } catch {
    return emptyPanelsV0();
  }
}

/**
 * @param {Partial<Record<RhizohProductSurfacePanelIdV0, boolean>>} patch
 */
export function writeRhizohChromePanelsOpenV0(patch) {
  const next = freezePanelsSnapshotV0({
    ...readRhizohChromePanelsOpenV0(),
    ...patch
  });
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_CHROME_PANEL_CHANGE_EVENT_V0, {
        detail: Object.freeze({ panels: next })
      })
    );
  }
  return next;
}

/**
 * @param {string} panelId
 */
function isKnownSurfacePanelV0(panelId) {
  return RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0.includes(
    /** @type {RhizohProductSurfacePanelIdV0} */ (String(panelId || ""))
  );
}

/**
 * @param {RhizohProductSurfacePanelIdV0 | string} panelId
 * @param {boolean} [open]
 * @returns {boolean} next open state
 */
export function setRhizohProductChromePanelOpenV0(panelId, open) {
  const id = String(panelId || "");
  if (!isKnownSurfacePanelV0(id)) return false;
  const prev = readRhizohChromePanelsOpenV0();
  const nextOpen = open === undefined ? !prev[id] : Boolean(open);
  writeRhizohChromePanelsOpenV0({ [id]: nextOpen });
  return nextOpen;
}

/**
 * Open one surface panel; close all others (exclusive drawer).
 * @param {RhizohProductSurfacePanelIdV0 | string} panelId
 * @param {boolean} open
 */
export function setRhizohProductSurfacePanelExclusiveV0(panelId, open) {
  const id = String(panelId || "");
  if (!isKnownSurfacePanelV0(id)) return readRhizohChromePanelsOpenV0();
  if (!open) {
    return writeRhizohChromePanelsOpenV0({ [id]: false });
  }
  /** @type {Partial<Record<RhizohProductSurfacePanelIdV0, boolean>>} */
  const patch = {};
  for (const sid of RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0) {
    patch[sid] = sid === id;
  }
  return writeRhizohChromePanelsOpenV0(patch);
}

/**
 * Bottom-nav toggle: same surface + open → close; else open that surface's panel.
 * @param {RhizohProductSurfacePanelIdV0 | string} surfaceId
 * @param {string} activeSurface
 * @returns {{ open: boolean, closed: boolean, surface: string }}
 */
export function toggleRhizohProductSurfacePanelV0(surfaceId, activeSurface) {
  const id = String(surfaceId || "world");
  const panels = readRhizohChromePanelsOpenV0();
  const isActive = String(activeSurface || "") === id;
  if (isActive && panels[id]) {
    setRhizohProductSurfacePanelExclusiveV0(id, false);
    return Object.freeze({ open: false, closed: true, surface: id });
  }
  setRhizohProductSurfacePanelExclusiveV0(id, true);
  return Object.freeze({ open: true, closed: false, surface: id });
}

/**
 * @param {string} panelId
 */
export function isRhizohProductChromePanelOpenV0(panelId) {
  const id = String(panelId || "");
  return readRhizohChromePanelsOpenV0()[id] === true;
}

/** @returns {Record<RhizohProductSurfacePanelIdV0, boolean>} */
export function getRhizohChromePanelsSnapshotV0() {
  return readRhizohChromePanelsOpenV0();
}

/** @param {() => void} onChange */
export function subscribeRhizohChromePanelsV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RHIZOH_CHROME_PANEL_CHANGE_EVENT_V0, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  });
  return () => {
    window.removeEventListener(RHIZOH_CHROME_PANEL_CHANGE_EVENT_V0, handler);
  };
}

/**
 * @deprecated Wheel visibility follows `productSurface === "world"` — see `isRhizohCapabilityWheelVisibleV0`.
 * Kept for drawer / map-tool flows that still use the world panel toggle.
 */
export function isRhizohWorldWheelOpenV0() {
  return isRhizohProductChromePanelOpenV0("world");
}

/** Any non-world bottom drawer open. */
export function isRhizohProductSurfaceDrawerOpenV0() {
  const p = readRhizohChromePanelsOpenV0();
  return RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0.some((id) => id !== "world" && p[id]);
}

/** Which non-world drawer is open, if any. */
export function resolveOpenProductSurfaceDrawerIdV0() {
  const p = readRhizohChromePanelsOpenV0();
  return RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0.find((id) => id !== "world" && p[id]) || null;
}

/** Close every bottom shell drawer (world panel flag included). */
export function closeAllRhizohProductSurfacePanelsV0() {
  /** @type {Partial<Record<RhizohProductSurfacePanelIdV0, boolean>>} */
  const patch = {};
  for (const id of RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0) {
    patch[id] = false;
  }
  return writeRhizohChromePanelsOpenV0(patch);
}
