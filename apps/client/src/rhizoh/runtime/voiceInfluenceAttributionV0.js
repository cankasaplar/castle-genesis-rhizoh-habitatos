/**
 * Influence Attribution Layer — "Bu davranış nereden geldi?"
 * Observation + commitment only; no execution authority (debug / drift / memory trace).
 */

import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const VOICE_INFLUENCE_ATTRIBUTION_SCHEMA = "castle.rhizoh.voice_influence_attribution.v0";

/** Reserved for trust-weighted attribution (not wired to memory). */
export const INFLUENCE_STRENGTH_V0 = Object.freeze({
  OBSERVATION_ONLY: "observation_only",
  TRUST_WEIGHTED: "trust_weighted",
  MEMORY_ELIGIBLE: "memory_eligible"
});

/** Provenance class for memory debugging and drift analysis. */
export const INFLUENCE_ATTRIBUTION_KIND_V0 = Object.freeze({
  USER_SPEECH_DIRECTED: "user_speech_directed",
  USER_SPEECH_CONDITIONAL: "user_speech_conditional",
  USER_SPEECH_REJECTED: "user_speech_rejected",
  AMBIENT_ARTIFACT: "ambient_artifact",
  UNKNOWN_OBSERVATION: "unknown_observation",
  MODEL_RESPONSE: "model_response",
  TEXT_INPUT: "text_input",
  STREAM_LIFECYCLE: "stream_lifecycle",
  SYSTEM_TTS: "system_tts"
});

const RING_MAX = 64;

/** @type {object[]} */
const ring = [];

const counts = {
  user_speech_directed: 0,
  user_speech_conditional: 0,
  user_speech_rejected: 0,
  ambient_artifact: 0,
  unknown_observation: 0,
  model_response: 0,
  text_input: 0,
  stream_lifecycle: 0,
  system_tts: 0
};

/**
 * @param {{
 *   direction?: "ingress" | "egress",
 *   band?: string,
 *   source?: string,
 *   stage?: string,
 *   commitment?: { behaviorEligible?: boolean, memoryEligible?: boolean, turnCounts?: boolean } | null,
 *   turnAcceptance?: { accepted?: boolean, reason?: string } | null,
 *   sanityAccepted?: boolean,
 *   streamCode?: string
 * }} input
 */
export function deriveVoiceInfluenceAttributionV0(input = {}) {
  const direction = String(input.direction || "ingress");
  const source = String(input.source || "mic");
  const band = String(input.band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  const stage = String(input.stage || "unknown");

  const observationOnly = INFLUENCE_STRENGTH_V0.OBSERVATION_ONLY;

  if (direction === "egress") {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.MODEL_RESPONSE,
      origin: "rhizoh_llm_or_tts",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  if (input.streamCode) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.STREAM_LIFECYCLE,
      origin: String(input.streamCode),
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  if (source === "text" || band === "text") {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.TEXT_INPUT,
      origin: "dom_text",
      band: "text",
      source: "text",
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.AMBIENT_ARTIFACT,
      origin: "environment_or_tv",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  const committed = input.commitment?.turnCounts === true || input.commitment?.behaviorEligible === true;
  if (committed && band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_DIRECTED,
      origin: "user_mic_directed",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  if (committed) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_CONDITIONAL,
      origin: "user_mic_gated",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  const turnRejected =
    input.turnAcceptance && input.turnAcceptance.accepted !== true && source !== "text";
  const sanityRejected = input.sanityAccepted === false;
  if (turnRejected || sanityRejected) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_REJECTED,
      origin: input.turnAcceptance?.reason || "sanity_or_gate",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) {
    return Object.freeze({
      kind: INFLUENCE_ATTRIBUTION_KIND_V0.UNKNOWN_OBSERVATION,
      origin: "unclassified_speech",
      band,
      source,
      stage,
      influenceStrength: observationOnly,
      trustWeight: 0,
      influencesMemory: false,
      influencesBehavior: false
    });
  }

  return Object.freeze({
    kind: INFLUENCE_ATTRIBUTION_KIND_V0.UNKNOWN_OBSERVATION,
    origin: "fallback",
    band,
    source,
    stage,
    influenceStrength: observationOnly,
    trustWeight: 0,
    influencesMemory: false,
    influencesBehavior: false
  });
}

/**
 * @param {ReturnType<typeof deriveVoiceInfluenceAttributionV0>} attribution
 * @param {Record<string, unknown>} [detail]
 */
export function recordVoiceInfluenceAttributionV0(attribution, detail = {}) {
  const entry = Object.freeze({
    atMs: Date.now(),
    ...attribution,
    ...detail
  });

  const key = String(attribution.kind || "unknown_observation");
  if (key in counts) counts[key] += 1;

  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();

  logVoiceInfoV0("INFLUENCE_ATTRIBUTION", {
    kind: entry.kind,
    origin: entry.origin,
    band: entry.band,
    source: entry.source,
    stage: entry.stage,
    influenceStrength: entry.influenceStrength,
    trustWeight: entry.trustWeight,
    influencesMemory: entry.influencesMemory,
    influencesBehavior: entry.influencesBehavior,
    preview: typeof detail.preview === "string" ? detail.preview.slice(0, 96) : undefined,
    traceId: detail.traceId || undefined
  });

  publishInfluenceAttributionWindowV0(entry);
  return entry;
}

function publishInfluenceAttributionWindowV0(lastEntry) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceInfluenceAttribution = Object.freeze({
    schema: VOICE_INFLUENCE_ATTRIBUTION_SCHEMA,
    last: lastEntry,
    counts: Object.freeze({ ...counts }),
    recent: Object.freeze([...ring]),
    atMs: Date.now()
  });
}

export function getVoiceInfluenceAttributionSnapshotV0() {
  return Object.freeze({
    schema: VOICE_INFLUENCE_ATTRIBUTION_SCHEMA,
    counts: Object.freeze({ ...counts }),
    recent: Object.freeze([...ring]),
    atMs: Date.now()
  });
}

export function resetVoiceInfluenceAttributionForTestV0() {
  ring.length = 0;
  for (const k of Object.keys(counts)) counts[k] = 0;
}
