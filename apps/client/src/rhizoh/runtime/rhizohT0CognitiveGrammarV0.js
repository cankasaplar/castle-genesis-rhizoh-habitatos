/**
 * Rhizoh T0 Cognitive Grammar v0 — constitution axes + build priority (SSOT constants).
 * @see docs/RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md
 */

export const RHIZOH_T0_COGNITIVE_GRAMMAR_CONTRACT_V0 = "rhizoh-t0-cognitive-grammar-v0";

export const T0_GRAMMAR_BINDING_SENTENCE_V0 =
  "Rhizoh OS T0 is a cognitive grammar system that translates intent into shared perceptual fields through continuous state transitions.";

export const T0_OS_FORMULA_V0 = "state + intent + field + transition grammar";

/** @type {readonly string[]} — immutable build order */
export const RHIZOH_PRIORITY_STACK_V0 = Object.freeze([
  "meaning",
  "language",
  "behavior",
  "ui",
  "surface"
]);

/** @type {readonly string[]} */
export const T0_GRAMMAR_AXES_V0 = Object.freeze([
  "state",
  "intent",
  "field",
  "transition"
]);

export const T0_GRAMMAR_AXIS_STATE_V0 = "state";
export const T0_GRAMMAR_AXIS_INTENT_V0 = "intent";
export const T0_GRAMMAR_AXIS_FIELD_V0 = "field";
export const T0_GRAMMAR_AXIS_TRANSITION_V0 = "transition";

/** Perception chain — documentation + telemetry keys */
export const T0_PERCEPTION_CHAIN_V0 = Object.freeze([
  "intent",
  "field_deformation",
  "anchor_shift",
  "surface_change",
  "user_perception"
]);

/**
 * @param {string} axis
 * @returns {boolean}
 */
export function isT0GrammarAxisV0(axis) {
  return T0_GRAMMAR_AXES_V0.includes(String(axis || "").trim().toLowerCase());
}
