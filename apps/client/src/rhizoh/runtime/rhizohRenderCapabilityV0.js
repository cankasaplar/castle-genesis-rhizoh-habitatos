/**
 * Rhizoh **render capability** snapshot (v0) — pre-resolved flags for the substrate / composer boundary.
 *
 * **SER / V1 seal:** projection composers (`spatialOrchestratorV0`, `liveRuntimeOrchestratorV0`) must **not**
 * import this module nor `rhizohCapabilityManagerV0.js`. The **UI shell** (or bootstrap) calls
 * `getRenderCapabilitySnapshotV0()` once per frame or gate transition and passes plain booleans **in** if needed.
 *
 * This snapshot intentionally excludes: user tier, auth/session, monetization, identity claims — only
 * values already collapsed to **observe / interact / write** for rendering and local UI guards.
 *
 * @see rhizohCapabilityManagerV0.js — thin re-export facade for UI imports only
 * @see docs/RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md
 */

export const RENDER_CAPABILITY_SCHEMA_V0 = "renderCapability.v0";

/**
 * @returns {boolean}
 */
export function rhizohObserveAlwaysEnabledV0() {
  return true;
}

/**
 * Default: interact on unless explicitly disabled via env (local / staging UI gate only).
 * @returns {boolean}
 */
export function rhizohInteractEnabledV0() {
  try {
    const v = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RHIZOH_INTERACT_ENABLED;
    if (v === "0" || v === "false") return false;
  } catch {
    /* noop */
  }
  return true;
}

/**
 * @returns {boolean}
 */
export function rhizohWriteEnabledV0() {
  return false;
}

/**
 * Pre-resolved render capability flags (deterministic given env); **not** a policy engine.
 * @returns {{
 *   schema: string,
 *   observe: boolean,
 *   interact: boolean,
 *   write: boolean
 * }}
 */
export function getRenderCapabilitySnapshotV0() {
  return Object.freeze({
    schema: RENDER_CAPABILITY_SCHEMA_V0,
    observe: rhizohObserveAlwaysEnabledV0(),
    interact: rhizohInteractEnabledV0(),
    write: rhizohWriteEnabledV0()
  });
}
