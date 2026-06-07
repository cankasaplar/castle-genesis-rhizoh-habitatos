/**
 * Active system mode within World drawer · Modes tab.
 * Robotics / Spiral / Dream / Simulation — isolated from Maps and Social.
 */

export const RHIZOH_WORLD_SYSTEM_MODE_V0 = Object.freeze({
  ROBOTICS: "robotics",
  SPIRAL: "spiral",
  DREAM: "dream",
  SIMULATION: "simulation"
});

export const RHIZOH_WORLD_SYSTEM_MODE_EVENT_V0 = "rhizoh:world-system-mode-v0";

const STORAGE_KEY_V0 = "rhizoh.world.system_mode.v0";

/** @type {string} */
let cachedModeV0 = RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS;

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeRhizohWorldSystemModeV0(raw) {
  const s = String(raw || "").trim().toLowerCase();
  const values = Object.values(RHIZOH_WORLD_SYSTEM_MODE_V0);
  return values.includes(s) ? s : RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS;
}

/** @returns {string} */
export function readRhizohWorldSystemModeV0() {
  if (typeof localStorage === "undefined") return cachedModeV0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return cachedModeV0;
    cachedModeV0 = normalizeRhizohWorldSystemModeV0(raw);
    return cachedModeV0;
  } catch {
    return cachedModeV0;
  }
}

/** @param {string} mode */
export function writeRhizohWorldSystemModeV0(mode) {
  const next = normalizeRhizohWorldSystemModeV0(mode);
  cachedModeV0 = next;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, next);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_WORLD_SYSTEM_MODE_EVENT_V0, {
        detail: Object.freeze({ mode: next })
      })
    );
  }
  return next;
}

/** @param {() => void} onChange */
export function subscribeRhizohWorldSystemModeV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RHIZOH_WORLD_SYSTEM_MODE_EVENT_V0, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  });
  return () => window.removeEventListener(RHIZOH_WORLD_SYSTEM_MODE_EVENT_V0, handler);
}

/** @internal vitest */
export function __resetRhizohWorldSystemModeForTestV0() {
  cachedModeV0 = RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
