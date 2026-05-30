/**
 * Attention Context Layer — "what kind of reality am I in right now?"
 * RESEARCH-ONLY v0: observation + policy hints; does not change gates, memory, or dispatch.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";

export const VOICE_ATTENTION_CONTEXT_SCHEMA = "castle.rhizoh.voice_attention_context.v0";

export const VOICE_ATTENTION_MODE_V0 = Object.freeze({
  DIRECT_LISTEN: "direct_listen",
  MOVING_CONTEXT: "moving_context",
  OBSERVER: "observer"
});

export const VOICE_ATTENTION_CHANNEL_V0 = Object.freeze({
  CLEAN: "clean_channel",
  MIXED: "mixed_channel",
  OBSERVER: "observer_mode"
});

const MODE_PROFILES = Object.freeze({
  [VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN]: Object.freeze({
    mode: VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN,
    channel: VOICE_ATTENTION_CHANNEL_V0.CLEAN,
    attentionWeight: 0.85,
    ambientFilterStrength: "low",
    directedSpeechRelaxed: true,
    fastResponseAllowed: true,
    memoryWritePolicy: "minimal_delayed",
    description: "Active listening — headphones, run, 1:1 focus on Rhizoh"
  }),
  [VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT]: Object.freeze({
    mode: VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT,
    channel: VOICE_ATTENTION_CHANNEL_V0.MIXED,
    attentionWeight: 0.5,
    ambientFilterStrength: "medium",
    directedSpeechRelaxed: false,
    fastResponseAllowed: true,
    memoryWritePolicy: "gated",
    description: "Co-presence — walk, city, split attention"
  }),
  [VOICE_ATTENTION_MODE_V0.OBSERVER]: Object.freeze({
    mode: VOICE_ATTENTION_MODE_V0.OBSERVER,
    channel: VOICE_ATTENTION_CHANNEL_V0.OBSERVER,
    attentionWeight: 0.2,
    ambientFilterStrength: "high",
    directedSpeechRelaxed: false,
    fastResponseAllowed: false,
    memoryWritePolicy: "observe_only",
    description: "Passive presence — event, crowd, vehicle; Rhizoh mostly watching"
  })
});

const VALID_MODES = new Set(Object.values(VOICE_ATTENTION_MODE_V0));
let runtimeOverrideMode = "";

function readEnvAttentionModeV0() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_VOICE_ATTENTION_MODE ?? "").trim().toLowerCase();
    if (VALID_MODES.has(raw)) return raw;
  } catch {
    /* noop */
  }
  return "";
}

function normalizeModeV0(mode) {
  const m = String(mode || "").trim().toLowerCase();
  return VALID_MODES.has(m) ? m : "";
}

export function setVoiceAttentionModeOverrideV0(mode) {
  runtimeOverrideMode = normalizeModeV0(mode);
  publishVoiceAttentionContextWindowV0(resolveVoiceAttentionContextV0({ reason: "override" }));
}

export function clearVoiceAttentionModeOverrideV0() {
  runtimeOverrideMode = "";
}

export function resolveVoiceAttentionContextV0(input = {}) {
  const explicit =
    normalizeModeV0(input.explicitMode) ||
    runtimeOverrideMode ||
    readEnvAttentionModeV0();

  let mode = explicit || VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT;
  let reason = input.reason || (explicit ? "explicit" : "default_moving_context");

  if (!explicit) {
    const band = String(input.band || "");
    if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
      mode = VOICE_ATTENTION_MODE_V0.OBSERVER;
      reason = "heuristic_ambient_band";
    }
  }

  const profile = MODE_PROFILES[mode] || MODE_PROFILES[VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT];

  return Object.freeze({
    schema: VOICE_ATTENTION_CONTEXT_SCHEMA,
    ...profile,
    resolvedAtMs: Date.now(),
    reason,
    stage: input.stage || undefined,
    source: input.source || undefined,
    band: input.band || undefined,
    policyAuthority: "observation_only"
  });
}

export function publishVoiceAttentionContextV0(ctx, detail = {}) {
  logVoiceInfoV0("ATTENTION_CONTEXT", {
    mode: ctx.mode,
    channel: ctx.channel,
    attentionWeight: ctx.attentionWeight,
    ambientFilterStrength: ctx.ambientFilterStrength,
    directedSpeechRelaxed: ctx.directedSpeechRelaxed,
    memoryWritePolicy: ctx.memoryWritePolicy,
    reason: ctx.reason,
    stage: ctx.stage,
    band: ctx.band,
    ...detail
  });
  publishVoiceAttentionContextWindowV0(ctx);
  return ctx;
}

function publishVoiceAttentionContextWindowV0(ctx) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceAttentionContext = Object.freeze({ ...ctx, atMs: Date.now() });
  window.__rhizoh.setVoiceAttentionMode = setVoiceAttentionModeOverrideV0;
  window.__rhizoh.clearVoiceAttentionMode = clearVoiceAttentionModeOverrideV0;
}

export function initVoiceAttentionContextDebugV0() {
  if (typeof window === "undefined") return;
  if (window.__rhizoh?.voiceAttentionContext) return;
  publishVoiceAttentionContextWindowV0(
    resolveVoiceAttentionContextV0({ reason: "core_import" })
  );
}

export function getVoiceAttentionModeProfilesV0() {
  return MODE_PROFILES;
}

export function resetVoiceAttentionContextForTestV0() {
  runtimeOverrideMode = "";
}
