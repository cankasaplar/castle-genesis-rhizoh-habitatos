/**
 * Faz 1 headless soak — skip Apex / Cesium / swarm GPU; keep substrate + gateway observability.
 *
 * Enable: `?mode=headless` or `VITE_RHIZOH_HEADLESS=1`
 */

export const RHIZOH_HEADLESS_MODE_SCHEMA_V0 = "castle.rhizoh.headless_mode.v0";

/**
 * @returns {boolean}
 */
export function isRhizohHeadlessModeV0() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_HEADLESS === "1") {
      return true;
    }
  } catch {
    /* noop */
  }
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("mode") === "headless";
  } catch {
    return false;
  }
}
