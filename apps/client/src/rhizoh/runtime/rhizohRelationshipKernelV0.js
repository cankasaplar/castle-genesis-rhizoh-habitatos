/**
 * Rhizoh Relationship Kernel V0 — RESEARCH-ONLY
 * Defines how Rhizoh relates (friend / shared awareness), not what it optimizes (coach).
 * No execution authority: does not change gates, LLM prompts, or memory writes.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  observeMutualFamiliarityV0,
  publishMutualFamiliarityObservationV0
} from "./rhizohMutualFamiliarityFieldV0.js";
import {
  resetResponsePressureDynamicsForTestV0,
  tickResponsePressureDynamicsV0
} from "./voiceResponsePressureDynamicsV0.js";
import { resetMutualFamiliarityFieldForTestV0 } from "./rhizohMutualFamiliarityFieldV0.js";
import {
  VOICE_ATTENTION_MODE_V0,
  resolveVoiceAttentionContextV0
} from "./voiceAttentionContextV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";

export const RHIZOH_RELATIONSHIP_KERNEL_SCHEMA = "castle.rhizoh.relationship_kernel.v0";

/** Rejected interaction model — never default. */
export const RHIZOH_INTERACTION_INTENT_V0 = Object.freeze({
  FRIEND: "friend",
  COACH: "coach"
});

/**
 * "Hangi birlikte-bakma biçimindeyiz?" — not lab mode, not performance channel.
 */
export const RHIZOH_SHARED_ATTENTION_TYPE_V0 = Object.freeze({
  CO_PRESENCE: "co_presence",
  EXPLORATORY: "exploratory",
  SILENCE_AWARE: "silence_aware",
  SHARED_FOCUS: "shared_focus"
});

const VALID_SHARED_ATTENTION = new Set(Object.values(RHIZOH_SHARED_ATTENTION_TYPE_V0));

/** Dürüst arkadaş posture — observation labels for downstream policy (staged). */
export const RHIZOH_FRIEND_POSTURE_V0 = Object.freeze({
  interactionIntent: RHIZOH_INTERACTION_INTENT_V0.FRIEND,
  coachModelRejected: true,
  responsePressure: 0.25,
  initiativeRule: "user_first",
  silenceRights: "system_may_hold",
  disagreementStyle: "soft_reflection_only",
  commandLanguage: false,
  performanceScoring: false,
  growthEngine: false,
  awarenessResonance: true,
  listensFor: "shared_awareness",
  reflectionStance: "option_present",
  reflectionTemplateHint: "su_da_var_istersen_bakabiliriz",
  prohibitedCoachPatterns: Object.freeze([
    "must_do",
    "should_improve",
    "performance_score",
    "optimize_you",
    "try_harder"
  ])
});

const SHARED_ATTENTION_PROFILES = Object.freeze({
  [RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE]: Object.freeze({
    type: RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE,
    sharedLooking: "reflective_friend",
    description: "Walk, daily life — Rhizoh mirrors, does not steer",
    responsePressureCap: 0.35,
    systemInitiative: "low"
  }),
  [RHIZOH_SHARED_ATTENTION_TYPE_V0.EXPLORATORY]: Object.freeze({
    type: RHIZOH_SHARED_ATTENTION_TYPE_V0.EXPLORATORY,
    sharedLooking: "option_opener",
    description: "Curiosity / learning — opens choices, no direction",
    responsePressureCap: 0.4,
    systemInitiative: "on_question_only"
  }),
  [RHIZOH_SHARED_ATTENTION_TYPE_V0.SILENCE_AWARE]: Object.freeze({
    type: RHIZOH_SHARED_ATTENTION_TYPE_V0.SILENCE_AWARE,
    sharedLooking: "quiet_presence",
    description: "Silence, transit — near-silent; ultra-low signal only",
    responsePressureCap: 0.1,
    systemInitiative: "forbidden_unless_called"
  }),
  [RHIZOH_SHARED_ATTENTION_TYPE_V0.SHARED_FOCUS]: Object.freeze({
    type: RHIZOH_SHARED_ATTENTION_TYPE_V0.SHARED_FOCUS,
    sharedLooking: "same_point_together",
    description: "Same object/event — we are looking at the same thing",
    responsePressureCap: 0.45,
    systemInitiative: "reflect_only"
  })
});

const LEGACY_MODE_TO_SHARED = Object.freeze({
  [VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT]: RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE,
  [VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN]: RHIZOH_SHARED_ATTENTION_TYPE_V0.SHARED_FOCUS,
  [VOICE_ATTENTION_MODE_V0.OBSERVER]: RHIZOH_SHARED_ATTENTION_TYPE_V0.SILENCE_AWARE
});

let runtimeSharedAttentionOverride = "";

function readEnvSharedAttentionV0() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_SHARED_ATTENTION_TYPE ?? "")
      .trim()
      .toLowerCase();
    if (VALID_SHARED_ATTENTION.has(raw)) return raw;
  } catch {
    /* noop */
  }
  return "";
}

function normalizeSharedAttentionV0(type) {
  const t = String(type || "").trim().toLowerCase();
  return VALID_SHARED_ATTENTION.has(t) ? t : "";
}

export function setRhizohSharedAttentionOverrideV0(type) {
  runtimeSharedAttentionOverride = normalizeSharedAttentionV0(type);
}

export function clearRhizohSharedAttentionOverrideV0() {
  runtimeSharedAttentionOverride = "";
}

/**
 * @param {{ legacyMode?: string, explicitType?: string, text?: string }} [input]
 */
export function resolveSharedAttentionTypeV0(input = {}) {
  const explicit =
    normalizeSharedAttentionV0(input.explicitType) ||
    runtimeSharedAttentionOverride ||
    readEnvSharedAttentionV0();

  if (explicit) {
    return Object.freeze({
      ...SHARED_ATTENTION_PROFILES[explicit],
      reason: "explicit"
    });
  }

  const legacy = String(input.legacyMode || "");
  let type = LEGACY_MODE_TO_SHARED[legacy] || RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE;
  let reason = legacy ? "legacy_mode_map" : "default_co_presence";

  const text = String(input.text || "").trim();
  if (text.includes("?") && legacy !== VOICE_ATTENTION_MODE_V0.OBSERVER) {
    type = RHIZOH_SHARED_ATTENTION_TYPE_V0.EXPLORATORY;
    reason = "heuristic_question";
  }

  return Object.freeze({
    ...SHARED_ATTENTION_PROFILES[type],
    reason
  });
}

/**
 * @param {{
 *   attention?: ReturnType<typeof resolveVoiceAttentionContextV0>,
 *   explicitMode?: string,
 *   explicitSharedAttention?: string,
 *   band?: string,
 *   source?: string,
 *   stage?: string,
 *   text?: string,
 *   reason?: string
 * }} [input]
 */
export function resolveRhizohRelationshipKernelV0(input = {}) {
  const attention =
    input.attention ||
    resolveVoiceAttentionContextV0({
      explicitMode: input.explicitMode,
      band: input.band,
      source: input.source,
      stage: input.stage,
      reason: input.reason
    });

  const sharedAttention = resolveSharedAttentionTypeV0({
    legacyMode: attention.mode,
    explicitType: input.explicitSharedAttention,
    text: input.text
  });

  const staticCap = Math.min(
    RHIZOH_FRIEND_POSTURE_V0.responsePressure,
    sharedAttention.responsePressureCap
  );

  const band = String(input.band || "");
  const text = String(input.text || "").trim();
  const lifecycle = String(input.lifecycleEvent || "");
  let pressureEvent = "speech";
  if (lifecycle === "no_speech" || lifecycle === "no_transcript" || lifecycle === "stream_empty") {
    pressureEvent = "stream_empty";
  } else if (!text && lifecycle) {
    pressureEvent = "silence";
  } else if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    pressureEvent = "ambient_noise";
  } else if (!text) {
    pressureEvent = "silence";
  }

  const pressureDynamics = tickResponsePressureDynamicsV0({
    atMs: input.atMs,
    basePressure: staticCap,
    pressureCap: sharedAttention.responsePressureCap,
    sharedAttentionType: sharedAttention.type,
    band,
    event: pressureEvent,
    text
  });

  const familiarity = observeMutualFamiliarityV0({
    atMs: input.atMs,
    band,
    strategy: input.strategy,
    maxRms: input.maxRms,
    lat: input.lat,
    lon: input.lon
  });

  return Object.freeze({
    schema: RHIZOH_RELATIONSHIP_KERNEL_SCHEMA,
    ...RHIZOH_FRIEND_POSTURE_V0,
    sharedAttentionType: sharedAttention.type,
    sharedLooking: sharedAttention.sharedLooking,
    sharedAttentionDescription: sharedAttention.description,
    sharedAttentionReason: sharedAttention.reason,
    legacyAttentionMode: attention.mode,
    attentionChannel: attention.channel,
    attentionWeight: attention.attentionWeight,
    staticResponsePressure: staticCap,
    effectiveResponsePressure: pressureDynamics.dynamicPressure,
    pressureDynamics,
    mutualFamiliarity: familiarity,
    systemInitiative: sharedAttention.systemInitiative,
    attention,
    policyAuthority: "observation_only",
    resolvedAtMs: Date.now(),
    stage: input.stage,
    source: input.source
  });
}

/**
 * @param {ReturnType<typeof resolveRhizohRelationshipKernelV0>} kernel
 * @param {Record<string, unknown>} [detail]
 */
export function publishRhizohRelationshipKernelV0(kernel, detail = {}) {
  logVoiceInfoV0("RELATIONSHIP_KERNEL", {
    interactionIntent: kernel.interactionIntent,
    sharedAttentionType: kernel.sharedAttentionType,
    sharedLooking: kernel.sharedLooking,
    staticResponsePressure: kernel.staticResponsePressure,
    effectiveResponsePressure: kernel.effectiveResponsePressure,
    pressureDeltas: kernel.pressureDynamics?.deltas,
    familiarityScore: kernel.mutualFamiliarity?.familiarityScore,
    systemInitiative: kernel.systemInitiative,
    silenceRights: kernel.silenceRights,
    legacyAttentionMode: kernel.legacyAttentionMode,
    reason: kernel.sharedAttentionReason,
    stage: kernel.stage,
    ...detail
  });
  if (kernel.mutualFamiliarity) {
    publishMutualFamiliarityObservationV0(kernel.mutualFamiliarity, { stage: kernel.stage });
  }
  publishRelationshipKernelWindowV0(kernel);
  return kernel;
}

function publishRelationshipKernelWindowV0(kernel) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.relationshipKernel = Object.freeze({ ...kernel, atMs: Date.now() });
  window.__rhizoh.setSharedAttentionType = setRhizohSharedAttentionOverrideV0;
  window.__rhizoh.clearSharedAttentionType = clearRhizohSharedAttentionOverrideV0;
}

export function initRhizohRelationshipKernelDebugV0() {
  if (typeof window === "undefined") return;
  if (window.__rhizoh?.relationshipKernel) return;
  publishRelationshipKernelWindowV0(
    resolveRhizohRelationshipKernelV0({ reason: "core_import" })
  );
}

export function resetRhizohRelationshipKernelForTestV0() {
  runtimeSharedAttentionOverride = "";
  resetResponsePressureDynamicsForTestV0();
  resetMutualFamiliarityFieldForTestV0();
}
