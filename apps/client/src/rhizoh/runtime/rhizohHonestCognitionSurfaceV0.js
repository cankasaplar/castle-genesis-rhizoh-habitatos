/**
 * Honest Baseline cognition surface toggles (session).
 * @see docs/RHIZOH_HONEST_COGNITION_SURFACE_V0.md
 */

export const RHIZOH_HONEST_COGNITION_SURFACE_CONTRACT_V0 = "rhizoh-honest-cognition-surface-v0";

const KEY_AMBIENT_V0 = "rhizoh.honest.cognition_ambient.v0";
const KEY_THOUGHT_FIELD_V0 = "rhizoh.honest.thought_field.v0";

export const RHIZOH_THINKING_EXPOSURE_EVENT_V0 = "rhizoh:thinking-exposure";
export const RHIZOH_GRAMMAR_RESOLUTION_EVENT_V0 = "rhizoh:grammar-resolution";

/**
 * @returns {boolean}
 */
export function readHonestCognitionAmbientEnabledV0() {
  try {
    const v = sessionStorage.getItem(KEY_AMBIENT_V0);
    if (v === "0") return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * @param {boolean} enabled
 */
export function writeHonestCognitionAmbientEnabledV0(enabled) {
  try {
    sessionStorage.setItem(KEY_AMBIENT_V0, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:honest-cognition-toggle", {
        detail: Object.freeze({ ambient: Boolean(enabled) })
      })
    );
  }
}

/**
 * @returns {boolean}
 */
export function readThoughtFieldExpandedV0() {
  try {
    return sessionStorage.getItem(KEY_THOUGHT_FIELD_V0) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {boolean} expanded
 */
export function writeThoughtFieldExpandedV0(expanded) {
  try {
    sessionStorage.setItem(KEY_THOUGHT_FIELD_V0, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:honest-cognition-toggle", {
        detail: Object.freeze({ thoughtField: Boolean(expanded) })
      })
    );
  }
}
