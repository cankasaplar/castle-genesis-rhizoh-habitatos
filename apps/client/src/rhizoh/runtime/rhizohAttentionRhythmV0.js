/**
 * Attention Rhythm Layer (ARL) v0 — when cognition, direction, or silence leads.
 * @see docs/RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md
 */

import { computeCognitionExposureBudgetV0 } from "./rhizohActionCoherenceV0.js";
import { THINKING_PHASE_REST_V0, resolveThinkingPhaseV0 } from "./rhizohThinkingModelV0.js";

export const RHIZOH_ATTENTION_RHYTHM_CONTRACT_V0 = "rhizoh-attention-rhythm-v0";

export const ARL_BINDING_SENTENCE_V0 =
  "Rhizoh carries meaning in silence, direction in play, and cognition only in rhythm.";

export const ARL_PHASE_SILENCE_V0 = "silence";
export const ARL_PHASE_DIRECTION_V0 = "direction";
export const ARL_PHASE_COGNITION_PULSE_V0 = "cognition_pulse";
export const ARL_PHASE_STABILIZE_QUIET_V0 = "stabilize_quiet";

export const RHIZOH_ATTENTION_RHYTHM_EVENT_V0 = "rhizoh:attention-rhythm";

/** @type {readonly string[]} */
export const ARL_PHASES_V0 = Object.freeze([
  ARL_PHASE_SILENCE_V0,
  ARL_PHASE_DIRECTION_V0,
  ARL_PHASE_COGNITION_PULSE_V0,
  ARL_PHASE_STABILIZE_QUIET_V0
]);

const STABILIZE_QUIET_MS_V0 = 2500;
const SILENCE_AMBIENT_SCALE_V0 = 0.32;
const STABILIZE_AMBIENT_CAP_V0 = 0.4;

/**
 * @param {{
 *   rhizohFieldState?: string,
 *   thoughtFieldExpanded?: boolean,
 *   ambientEnabled?: boolean,
 *   msSinceBusyEnd?: number
 * }} [input]
 */
export function resolveAttentionRhythmV0(input = {}) {
  const budget = computeCognitionExposureBudgetV0(input);
  const fieldState = String(input.rhizohFieldState || "IDLE").toUpperCase();
  const thinkingPhase = resolveThinkingPhaseV0(fieldState);
  const msSinceBusyEnd = Number(input.msSinceBusyEnd ?? Number.POSITIVE_INFINITY);
  const ambientOn = input.ambientEnabled !== false;

  let rhythmPhase = ARL_PHASE_DIRECTION_V0;
  let systemSilence = false;
  let anchorEmphasis = budget.anchorEmphasis;
  let ambientOpacityScale = budget.ambientOpacityScale;
  let showThinkingPhaseChip = budget.showThinkingPhaseChip;
  let showAmbient = ambientOn;
  let showCognitiveFieldChip = true;

  if (budget.busy) {
    rhythmPhase = ARL_PHASE_COGNITION_PULSE_V0;
    systemSilence = false;
  } else if (msSinceBusyEnd < STABILIZE_QUIET_MS_V0 && thinkingPhase === THINKING_PHASE_REST_V0) {
    rhythmPhase = ARL_PHASE_STABILIZE_QUIET_V0;
    systemSilence = true;
    ambientOpacityScale = Math.min(ambientOpacityScale, STABILIZE_AMBIENT_CAP_V0);
    showThinkingPhaseChip = false;
    anchorEmphasis = "normal";
    showCognitiveFieldChip = Boolean(input.thoughtFieldExpanded);
  } else if (fieldState === "IDLE" || fieldState === "DEGRADED") {
    rhythmPhase = ARL_PHASE_SILENCE_V0;
    systemSilence = true;
    ambientOpacityScale = ambientOn ? SILENCE_AMBIENT_SCALE_V0 : 0;
    showThinkingPhaseChip = false;
    anchorEmphasis = "quiet";
    showCognitiveFieldChip = Boolean(input.thoughtFieldExpanded);
  } else {
    rhythmPhase = ARL_PHASE_DIRECTION_V0;
    anchorEmphasis = "normal";
  }

  if (fieldState === "DEGRADED") {
    rhythmPhase = ARL_PHASE_DIRECTION_V0;
    systemSilence = false;
    anchorEmphasis = "high";
    showThinkingPhaseChip = false;
  }

  return Object.freeze({
    contract_version: RHIZOH_ATTENTION_RHYTHM_CONTRACT_V0,
    binding: ARL_BINDING_SENTENCE_V0,
    rhythm_phase: rhythmPhase,
    system_silence: systemSilence,
    anchor_emphasis: anchorEmphasis,
    ambient_opacity_scale: ambientOpacityScale,
    show_thinking_phase_chip: showThinkingPhaseChip,
    show_ambient: showAmbient,
    show_cognitive_field_chip: showCognitiveFieldChip,
    exposure_budget: budget,
    thinking_phase: thinkingPhase
  });
}

/**
 * @param {ReturnType<typeof resolveAttentionRhythmV0>} rhythm
 */
export function emitAttentionRhythmV0(rhythm) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_ATTENTION_RHYTHM_EVENT_V0, { detail: rhythm })
  );
}
