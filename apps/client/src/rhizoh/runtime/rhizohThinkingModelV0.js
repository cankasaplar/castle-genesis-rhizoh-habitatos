/**
 * Rhizoh Thinking Model v0 — expose LLM work as state transitions, not hidden answers.
 * @see docs/RHIZOH_THINKING_MODEL_V0.md
 */

export const RHIZOH_THINKING_MODEL_CONTRACT_V0 = "rhizoh-thinking-model-v0";

export const THINKING_EXPOSURE_BINDING_V0 =
  "Rhizoh exposes cognition as a visible, navigable transition field rather than a hidden computational process.";

export const THINKING_PHASE_CONTEXT_INTAKE_V0 = "context_intake";
export const THINKING_PHASE_INTERNAL_REP_V0 = "internal_representation";
export const THINKING_PHASE_PROBABILITY_FIELD_V0 = "probability_field";
export const THINKING_PHASE_SELECTION_V0 = "selection";
export const THINKING_PHASE_STABILIZE_V0 = "stabilize_output";
export const THINKING_PHASE_REST_V0 = "rest";

/** @type {readonly { id: string, states: readonly string[] }[]} */
export const RHIZOH_THINKING_PHASE_MAP_V0 = Object.freeze([
  Object.freeze({
    id: THINKING_PHASE_CONTEXT_INTAKE_V0,
    states: Object.freeze(["LISTENING"])
  }),
  Object.freeze({
    id: THINKING_PHASE_INTERNAL_REP_V0,
    states: Object.freeze(["INTERPRETING"])
  }),
  Object.freeze({
    id: THINKING_PHASE_PROBABILITY_FIELD_V0,
    states: Object.freeze(["GENERATING"])
  }),
  Object.freeze({
    id: THINKING_PHASE_SELECTION_V0,
    states: Object.freeze(["EXECUTING"])
  }),
  Object.freeze({
    id: THINKING_PHASE_STABILIZE_V0,
    states: Object.freeze(["SPEAKING"])
  }),
  Object.freeze({
    id: THINKING_PHASE_REST_V0,
    states: Object.freeze(["IDLE", "DEGRADED"])
  })
]);

/**
 * @param {string} rhizohFieldState
 */
export function resolveThinkingPhaseV0(rhizohFieldState) {
  const s = String(rhizohFieldState || "IDLE").toUpperCase();
  for (const row of RHIZOH_THINKING_PHASE_MAP_V0) {
    if (row.states.includes(s)) return row.id;
  }
  return THINKING_PHASE_REST_V0;
}

/**
 * Ambient + field intensity for honest cognition surface (no randomness).
 * @param {string} rhizohFieldState
 */
export function resolveThinkingExposureV0(rhizohFieldState) {
  const phase = resolveThinkingPhaseV0(rhizohFieldState);
  const s = String(rhizohFieldState || "IDLE").toUpperCase();

  /** @type {{ hue: number, sat: number, light: number, opacity: number }} */
  let ambient = { hue: 200, sat: 42, light: 8, opacity: 0.07 };

  if (phase === THINKING_PHASE_CONTEXT_INTAKE_V0) {
    ambient = { hue: 195, sat: 55, light: 10, opacity: 0.1 };
  } else if (phase === THINKING_PHASE_INTERNAL_REP_V0) {
    ambient = { hue: 265, sat: 48, light: 9, opacity: 0.12 };
  } else if (phase === THINKING_PHASE_PROBABILITY_FIELD_V0) {
    ambient = { hue: 290, sat: 52, light: 11, opacity: 0.14 };
  } else if (phase === THINKING_PHASE_SELECTION_V0) {
    ambient = { hue: 175, sat: 50, light: 10, opacity: 0.13 };
  } else if (phase === THINKING_PHASE_STABILIZE_V0) {
    ambient = { hue: 165, sat: 45, light: 12, opacity: 0.11 };
  }

  const fieldIntensity =
    s === "GENERATING" || s === "INTERPRETING"
      ? 0.85
      : s === "EXECUTING" || s === "SPEAKING"
        ? 0.72
        : s === "LISTENING"
          ? 0.55
          : 0.35;

  const orbitActive = s === "GENERATING" || s === "INTERPRETING";

  return Object.freeze({
    contract_version: RHIZOH_THINKING_MODEL_CONTRACT_V0,
    binding: THINKING_EXPOSURE_BINDING_V0,
    phase,
    fieldState: s,
    ambient,
    fieldIntensity,
    orbitActive,
    agentActivity: fieldIntensity
  });
}

/**
 * Short chip label (tr/en minimal).
 * @param {string} phase
 * @param {boolean} [tr]
 */
export function thinkingPhaseLabelV0(phase, tr = true) {
  const id = String(phase || "");
  if (tr) {
    if (id === THINKING_PHASE_CONTEXT_INTAKE_V0) return "Bağlam";
    if (id === THINKING_PHASE_INTERNAL_REP_V0) return "Yorum";
    if (id === THINKING_PHASE_PROBABILITY_FIELD_V0) return "Olasılık alanı";
    if (id === THINKING_PHASE_SELECTION_V0) return "Seçim";
    if (id === THINKING_PHASE_STABILIZE_V0) return "Sabitleme";
    return "Dinlenme";
  }
  if (id === THINKING_PHASE_CONTEXT_INTAKE_V0) return "Context";
  if (id === THINKING_PHASE_INTERNAL_REP_V0) return "Interpret";
  if (id === THINKING_PHASE_PROBABILITY_FIELD_V0) return "Field";
  if (id === THINKING_PHASE_SELECTION_V0) return "Select";
  if (id === THINKING_PHASE_STABILIZE_V0) return "Stabilize";
  return "Rest";
}
