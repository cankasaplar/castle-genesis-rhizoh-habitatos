/**
 * Claim-local-anchor interaction mode — map pick only when explicitly armed.
 */

export const WORLD_MAP_CLAIM_MODE_EVENT_V0 = "rhizoh:world-map-claim-mode-v0";

/**
 * @returns {boolean}
 */
export function readWorldMapClaimModeV0() {
  if (typeof window === "undefined") return false;
  return window.__RHIZOH_MAP_CLAIM_MODE__ === true;
}

/**
 * @param {boolean} enabled
 */
export function writeWorldMapClaimModeV0(enabled) {
  if (typeof window === "undefined") return false;
  window.__RHIZOH_MAP_CLAIM_MODE__ = !!enabled;
  try {
    window.dispatchEvent(
      new CustomEvent(WORLD_MAP_CLAIM_MODE_EVENT_V0, {
        detail: Object.freeze({ enabled: !!enabled })
      })
    );
  } catch {
    /* noop */
  }
  return window.__RHIZOH_MAP_CLAIM_MODE__ === true;
}
