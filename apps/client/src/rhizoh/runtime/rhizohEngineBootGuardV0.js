/**
 * Apex engine boot guard — one constructor + one ready signal per active mount cycle.
 * RESEARCH-ONLY — presentation/runtime hygiene; no execution authority.
 */

export const RHIZOH_ENGINE_BOOT_GUARD_SCHEMA_V0 = "rhizoh.engine_boot_guard.v0";

/**
 * Claim Apex engine boot for this tab. Returns false when already booted.
 * @returns {boolean}
 */
export function claimRhizohEngineBootV0() {
  if (typeof window === "undefined") return true;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.engineBooted === true) return false;
  window.__rhizoh.engineBooted = true;
  return true;
}

/**
 * Release boot claim on engine teardown (route unmount / HMR).
 */
export function releaseRhizohEngineBootV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.engineBooted = false;
}

/**
 * @returns {boolean}
 */
export function isRhizohEngineBootedV0() {
  if (typeof window === "undefined") return false;
  return window.__rhizoh?.engineBooted === true;
}
