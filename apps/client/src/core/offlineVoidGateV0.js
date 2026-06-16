/**
 * Offline void gate — at 00:00 when offline, freeze collapse and await canonical tick.
 */

export const RHIZOH_OFFLINE_VOID_SCHEMA_V0 = "rhizoh.offline_void_gate.v0";
export const RHIZOH_OFFLINE_VOID_EVENT_V0 = "rhizoh:offline-void-v0";

/**
 * @returns {boolean}
 */
export function isBrowserOfflineV0() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * @param {{ pendingSyncCount?: number }} [ctx]
 */
export function shouldEnterVoidAtCountdownZeroV0(ctx = {}) {
  if (!isBrowserOfflineV0()) return false;
  const pending = Number(ctx.pendingSyncCount) || 0;
  return pending > 0 || isBrowserOfflineV0();
}

/**
 * @param {boolean} active
 */
export function publishOfflineVoidStateV0(active) {
  const detail = Object.freeze({
    schema: RHIZOH_OFFLINE_VOID_SCHEMA_V0,
    active: active === true,
    message: active ? "AWAITING CANONICAL TICK..." : "",
    subMessage: active ? "REALITY NOT RESOLVED" : ""
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.offlineVoid = detail;
    window.dispatchEvent(new CustomEvent(RHIZOH_OFFLINE_VOID_EVENT_V0, { detail }));
  }
  return detail;
}
