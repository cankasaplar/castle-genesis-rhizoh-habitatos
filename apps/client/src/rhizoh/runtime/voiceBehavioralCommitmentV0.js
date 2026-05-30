/**
 * Behavioral Commitment Layer — NOISE ≠ MEMORY ELIGIBILITY
 *
 * Observation axis (witness): raw / weighted / band — statistics + log.
 * Commitment axis: whether signal may change behavior or durable memory.
 */

import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const VOICE_BEHAVIORAL_COMMITMENT_SCHEMA = "castle.rhizoh.voice_behavioral_commitment.v0";

export const VOICE_COMMITMENT_AXIS = Object.freeze({
  OBSERVATION: "observation",
  MEMORY: "memory_eligibility",
  BEHAVIOR: "behavior_eligibility"
});

const VOICE_SOURCES = new Set(["mic_v3", "mic", "mic_onend", "barge_in", "speech_recognition_onresult"]);

/**
 * Band-only pre-gate commitment (dispatch / LLM routing).
 * @param {string} band
 * @param {{ source?: string }} [ctx]
 */
export function evaluateVoiceCommitmentFromBandV0(band, ctx = {}) {
  const source = String(ctx.source || "mic");
  if (!VOICE_SOURCES.has(source)) {
    return Object.freeze({
      band: "text",
      memoryEligible: true,
      behaviorEligible: true,
      behaviorMode: "immediate",
      memoryMode: "full",
      commitment: "text_input",
      axis: VOICE_COMMITMENT_AXIS.BEHAVIOR
    });
  }

  const b = String(band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  if (b === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    return Object.freeze({
      band: b,
      memoryEligible: false,
      behaviorEligible: false,
      behaviorMode: "never",
      memoryMode: "statistics_only",
      commitment: "observe_only",
      axis: VOICE_COMMITMENT_AXIS.OBSERVATION
    });
  }
  if (b === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) {
    return Object.freeze({
      band: b,
      memoryEligible: false,
      behaviorEligible: false,
      behaviorMode: "after_gate",
      memoryMode: "statistics_only",
      commitment: "conditional_pending",
      axis: VOICE_COMMITMENT_AXIS.OBSERVATION
    });
  }
  return Object.freeze({
    band: b,
    memoryEligible: false,
    behaviorEligible: false,
    behaviorMode: "after_gate",
    memoryMode: "gated",
    commitment: "directed_pending",
    axis: VOICE_COMMITMENT_AXIS.BEHAVIOR
  });
}

/**
 * Post-gate final commitment (identity / turn count / session bump).
 * @param {{
 *   band: string,
 *   source?: string,
 *   sanityAccepted?: boolean,
 *   turnAccepted?: boolean,
 *   turnReason?: string
 * }} input
 */
export function finalizeVoiceBehavioralCommitmentV0(input = {}) {
  const source = String(input.source || "mic");
  const band = String(input.band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  const sanityOk = input.sanityAccepted === true;
  const turnOk = input.turnAccepted === true;

  if (!VOICE_SOURCES.has(source)) {
    return Object.freeze({
      band: "text",
      memoryEligible: true,
      behaviorEligible: true,
      behaviorMode: "immediate",
      memoryMode: "full",
      commitment: "text_committed",
      turnCounts: true,
      sessionBumps: true
    });
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    return Object.freeze({
      band,
      memoryEligible: false,
      behaviorEligible: false,
      behaviorMode: "never",
      memoryMode: "statistics_only",
      commitment: "observe_only",
      turnCounts: false,
      sessionBumps: false
    });
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) {
    const behaviorEligible = turnOk;
    return Object.freeze({
      band,
      memoryEligible: false,
      behaviorEligible,
      behaviorMode: "after_gate",
      memoryMode: "statistics_only",
      commitment: behaviorEligible ? "conditional_committed" : "statistics_only",
      turnCounts: behaviorEligible,
      sessionBumps: behaviorEligible
    });
  }

  const committed = sanityOk && turnOk;
  return Object.freeze({
    band,
    memoryEligible: committed,
    behaviorEligible: committed,
    behaviorMode: "after_gate",
    memoryMode: committed ? "gated_pass" : "gated_reject",
    commitment: committed ? "directed_committed" : "directed_rejected",
    turnCounts: committed,
    sessionBumps: committed,
    turnReason: input.turnReason || null
  });
}

/**
 * @param {ReturnType<typeof evaluateVoiceCommitmentFromBandV0>} pre
 * @param {{ sanityAccepted?: boolean }} [gates]
 */
export function shouldDispatchVoiceToLlmV0(pre, gates = {}) {
  if (!pre) return true;
  if (pre.behaviorMode === "never") return false;
  if (pre.behaviorMode === "immediate") return true;
  return gates.sanityAccepted !== false;
}

/**
 * @param {ReturnType<typeof finalizeVoiceBehavioralCommitmentV0>} commitment
 */
export function publishVoiceBehavioralCommitmentV0(commitment, detail = {}) {
  logVoiceInfoV0("BEHAVIOR_COMMITMENT", {
    band: commitment.band,
    memoryEligible: commitment.memoryEligible,
    behaviorEligible: commitment.behaviorEligible,
    commitment: commitment.commitment,
    behaviorMode: commitment.behaviorMode,
    memoryMode: commitment.memoryMode,
    turnCounts: commitment.turnCounts,
    ...detail
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceWitnessCommitment = Object.freeze({
      schema: VOICE_BEHAVIORAL_COMMITMENT_SCHEMA,
      atMs: Date.now(),
      ...commitment,
      ...detail
    });
  }
  return commitment;
}
