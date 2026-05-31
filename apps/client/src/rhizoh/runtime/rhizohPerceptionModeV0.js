/**
 * Perception mode SSOT — Layer Switcher placeholder (state only, no map/route side effects).
 * Navigation = Product Bar · embodiment = Spatial Shell · cognition = Capability Wheel.
 */

export const RHIZOH_PERCEPTION_MODE_SCHEMA_V0 = "castle.rhizoh.perception_mode.v0";

/** @typedef {"t0"|"spatial"|"studio"|"hall"|"live"} RhizohPerceptionModeV0 */

export const RHIZOH_PERCEPTION_MODES_V0 = Object.freeze([
  "t0",
  "spatial",
  "studio",
  "hall",
  "live"
]);

const STORAGE_KEY_V0 = "rhizoh.perception_mode.v0";
const CHANGE_EVENT = "rhizoh:perception_mode";

/** @returns {RhizohPerceptionModeV0} */
export function readRhizohPerceptionModeV0() {
  if (typeof localStorage === "undefined") return "t0";
  try {
    const raw = String(localStorage.getItem(STORAGE_KEY_V0) || "").trim();
    if (RHIZOH_PERCEPTION_MODES_V0.includes(/** @type {RhizohPerceptionModeV0} */ (raw))) {
      return /** @type {RhizohPerceptionModeV0} */ (raw);
    }
  } catch {
    /* noop */
  }
  return "t0";
}

/** @param {RhizohPerceptionModeV0} mode */
export function setPerceptionMode(mode) {
  const next = String(mode || "").trim();
  if (!RHIZOH_PERCEPTION_MODES_V0.includes(/** @type {RhizohPerceptionModeV0} */ (next))) {
    return readRhizohPerceptionModeV0();
  }
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, next);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return /** @type {RhizohPerceptionModeV0} */ (next);
}

/** @returns {RhizohPerceptionModeV0} */
export function getRhizohPerceptionModeSnapshotV0() {
  return readRhizohPerceptionModeV0();
}

/** @param {() => void} onStoreChange */
export function subscribeRhizohPerceptionModeV0(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}
