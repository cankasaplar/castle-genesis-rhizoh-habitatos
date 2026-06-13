/**
 * Drawer Awakening v0 — beta modules graduate from "coming soon" to awake drawers.
 * RESEARCH-ONLY product chrome; no frozen core changes.
 */

export const RHIZOH_DRAWER_AWAKENING_SCHEMA_V0 = "rhizoh.drawer_awakening.v0";
export const RHIZOH_DRAWER_AWAKENING_LS_KEY_V0 = "rhizoh_drawer_awakening_v0";
export const RHIZOH_DRAWER_AWAKENING_EVENT_V0 = "rhizoh:drawer-awakening-v0";

/** Modules that open as drawers (not routes-only) when awakened. */
export const DRAWER_AWAKENING_MODULE_IDS_V0 = Object.freeze([
  "hall",
  "greenroom",
  "broadcast",
  "studio",
  "profile"
]);

const DEFAULT_AWAKE_V0 = Object.freeze({
  hall: true,
  greenroom: true,
  broadcast: true,
  studio: true,
  profile: true
});

function readRawV0() {
  if (typeof window === "undefined") return { ...DEFAULT_AWAKE_V0 };
  try {
    const raw = window.localStorage.getItem(RHIZOH_DRAWER_AWAKENING_LS_KEY_V0);
    if (!raw) return { ...DEFAULT_AWAKE_V0 };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AWAKE_V0, ...(parsed?.modules || {}) };
  } catch {
    return { ...DEFAULT_AWAKE_V0 };
  }
}

function writeRawV0(modules) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    RHIZOH_DRAWER_AWAKENING_LS_KEY_V0,
    JSON.stringify({ schema: RHIZOH_DRAWER_AWAKENING_SCHEMA_V0, modules })
  );
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_DRAWER_AWAKENING_EVENT_V0, {
        detail: Object.freeze({ modules: { ...modules } })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * Boot sprint 37 defaults — all product drawers awake (no deploy flag required).
 */
export function bootDrawerAwakeningV0() {
  const current = readRawV0();
  writeRawV0(current);
  return listAwakenedDrawerModulesV0();
}

/**
 * @param {string} moduleId
 */
export function isDrawerModuleAwakenedV0(moduleId) {
  const id = String(moduleId || "").trim();
  if (!DRAWER_AWAKENING_MODULE_IDS_V0.includes(id)) return false;
  return readRawV0()[id] === true;
}

/**
 * @returns {ReadonlyArray<string>}
 */
export function listAwakenedDrawerModulesV0() {
  const modules = readRawV0();
  return Object.freeze(DRAWER_AWAKENING_MODULE_IDS_V0.filter((id) => modules[id] === true));
}

/**
 * @param {string} moduleId
 * @param {boolean} [awake=true]
 */
export function setDrawerModuleAwakenedV0(moduleId, awake = true) {
  const id = String(moduleId || "").trim();
  if (!DRAWER_AWAKENING_MODULE_IDS_V0.includes(id)) return readRawV0();
  const next = { ...readRawV0(), [id]: awake === true };
  writeRawV0(next);
  return Object.freeze(next);
}

/**
 * World · Space: open drawer in-place instead of navigating away.
 * @param {string} surfaceId
 */
export function shouldOpenDrawerInPlaceV0(surfaceId) {
  const id = String(surfaceId || "");
  if (id === "world") return false;
  return isDrawerModuleAwakenedV0(id);
}

export function subscribeDrawerAwakeningV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RHIZOH_DRAWER_AWAKENING_EVENT_V0, handler);
  return () => window.removeEventListener(RHIZOH_DRAWER_AWAKENING_EVENT_V0, handler);
}

export function resetDrawerAwakeningForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RHIZOH_DRAWER_AWAKENING_LS_KEY_V0);
  }
}
