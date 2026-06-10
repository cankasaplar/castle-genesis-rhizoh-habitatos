/**
 * Streaming Attention Gate v0 — consciousness gate for co-presence.
 * Implementation of RHIZOH_CO_PRESENCE_RUNTIME_SPEC_V1.md
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  VOICE_ATTENTION_MODE_V0,
  resolveVoiceAttentionContextV0
} from "./voiceAttentionContextV0.js";
import { detectAlertRecallSignalV0 } from "./rhizohVoiceOperatingModeV0.js";
import { classifyDirectedPatternsV0, isShortAddressOnlyV0 } from "./behavioralTurnSovereigntyV0.js";
import {
  CO_PRESENCE_ANALYTICAL_PATTERNS_V1,
  CO_PRESENCE_BACKGROUND_LEAK_PATTERNS_V1,
  CO_PRESENCE_CONTEXT_WINDOW_V1,
  CO_PRESENCE_DIRECTIVE_PATTERNS_V1,
  CO_PRESENCE_SPIKE_KIND_V1,
  CO_PRESENCE_SPIKE_WEIGHTS_V1,
  clamp01V1,
  computeCoPresenceUtilityV1,
  noteCoPresenceSpikeResponseV1,
  publishCoPresenceRuntimeSnapshotV1,
  resolveAdaptiveSpikeThresholdV1,
  shouldCoPresenceRespondV1
} from "./rhizohCoPresenceRuntimeV1.js";

export const RHIZOH_STREAMING_ATTENTION_SCHEMA_V0 = "rhizoh.streaming_attention_gate.v0";

/** @deprecated use CO_PRESENCE_SPIKE_KIND_V1 */
export const ATTENTION_SPIKE_KIND_V0 = CO_PRESENCE_SPIKE_KIND_V1;

/** @type {object[]} */
const streamRingV0 = [];

export function isCoPresenceStreamModeV0() {
  const ctx = resolveVoiceAttentionContextV0();
  return ctx.mode === VOICE_ATTENTION_MODE_V0.CO_PRESENCE;
}

export function noteStreamingTranscriptChunkV0(chunk = {}) {
  const text = String(chunk.text || "").trim();
  if (!text) return null;
  const row = Object.freeze({
    text: text.slice(0, 200),
    confidence: Number.isFinite(Number(chunk.confidence)) ? Number(chunk.confidence) : null,
    band: chunk.band ? String(chunk.band) : null,
    maxRms: Number.isFinite(Number(chunk.maxRms)) ? Number(chunk.maxRms) : null,
    source: chunk.source || "mic",
    atMs: Date.now()
  });
  streamRingV0.push(row);
  if (streamRingV0.length > CO_PRESENCE_CONTEXT_WINDOW_V1.STREAM_RING_MAX) streamRingV0.shift();
  publishStreamingAttentionSnapshotV0();
  return row;
}

/**
 * @param {number} [nowMs]
 * @param {number} [windowMs]
 */
export function getStreamingContextWindowV0(
  nowMs = Date.now(),
  windowMs = CO_PRESENCE_CONTEXT_WINDOW_V1.CONVERSATION_MS
) {
  const cutoff = nowMs - windowMs;
  return Object.freeze(streamRingV0.filter((r) => r.atMs >= cutoff));
}

function isBackgroundLeakTemplateV0(text) {
  return CO_PRESENCE_BACKGROUND_LEAK_PATTERNS_V1.some((re) =>
    re.test(String(text || "").trim())
  );
}

/**
 * Classify spike kind + relevance from transcript chunk (STT = signal feeder).
 */
export function classifyStreamingSpikeSignalsV0(input = {}) {
  const text = String(input.text || "").trim();
  let kind = CO_PRESENCE_SPIKE_KIND_V1.NONE;
  let relevance = CO_PRESENCE_SPIKE_WEIGHTS_V1[CO_PRESENCE_SPIKE_KIND_V1.NONE];
  let reason = "ambient_stream";
  let hasName = false;

  const alert = detectAlertRecallSignalV0(text);
  if (alert.alert) {
    kind = CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY;
    relevance = Math.max(relevance, alert.score);
    reason = "emergency_lexicon";
  }

  const directed = classifyDirectedPatternsV0(text);
  if (directed.includes("wake") || isShortAddressOnlyV0(text)) {
    kind = CO_PRESENCE_SPIKE_KIND_V1.NAME_CALL;
    relevance = Math.max(relevance, CO_PRESENCE_SPIKE_WEIGHTS_V1[CO_PRESENCE_SPIKE_KIND_V1.NAME_CALL]);
    reason = "name_or_wake";
    hasName = true;
  } else if (/\b(rhizoh|rizo|rizoh)\b/i.test(text)) {
    kind = CO_PRESENCE_SPIKE_KIND_V1.NAME_CALL;
    relevance = Math.max(relevance, 0.62);
    reason = "name_in_utterance";
    hasName = true;
  }

  if (/\?/.test(text) || /\b(ne|nasıl|kim|nerede|when|what|how|why)\b/i.test(text)) {
    if (kind === CO_PRESENCE_SPIKE_KIND_V1.NONE) kind = CO_PRESENCE_SPIKE_KIND_V1.QUESTION;
    relevance = Math.max(relevance, CO_PRESENCE_SPIKE_WEIGHTS_V1[CO_PRESENCE_SPIKE_KIND_V1.QUESTION]);
    if (reason === "ambient_stream") reason = "question_markers";
  }

  if (CO_PRESENCE_ANALYTICAL_PATTERNS_V1.some((re) => re.test(text))) {
    if (
      kind === CO_PRESENCE_SPIKE_KIND_V1.NONE ||
      kind === CO_PRESENCE_SPIKE_KIND_V1.QUESTION
    ) {
      kind = CO_PRESENCE_SPIKE_KIND_V1.ANALYTICAL;
    }
    relevance = Math.max(relevance, CO_PRESENCE_SPIKE_WEIGHTS_V1[CO_PRESENCE_SPIKE_KIND_V1.ANALYTICAL]);
    if (reason === "ambient_stream") reason = "analytical_context";
  }

  if (CO_PRESENCE_DIRECTIVE_PATTERNS_V1.some((re) => re.test(text))) {
    relevance = Math.max(relevance, CO_PRESENCE_SPIKE_WEIGHTS_V1[CO_PRESENCE_SPIKE_KIND_V1.DIRECTIVE]);
    if (kind === CO_PRESENCE_SPIKE_KIND_V1.NONE) {
      kind = CO_PRESENCE_SPIKE_KIND_V1.DIRECTIVE;
      reason = "directive_to_agent";
    }
  }

  const confidence = Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : 0.42;
  const band = String(input.band || "");
  if (text.length >= 12) relevance += 0.06;
  if (text.split(/\s+/).filter(Boolean).length >= 4) relevance += 0.05;
  relevance += confidence * 0.12;
  if (band === "directed_candidate") relevance += 0.08;

  return Object.freeze({
    kind,
    relevance: clamp01V1(relevance),
    reason,
    hasName
  });
}

export function evaluateStreamingAttentionSpikeV0(input = {}) {
  const text = String(input.text || "").trim();
  const atMs = Date.now();

  if (text.length < 2) {
    return Object.freeze({
      kind: CO_PRESENCE_SPIKE_KIND_V1.NONE,
      score: 0,
      respond: false,
      utility: 0,
      reason: "empty"
    });
  }

  if (isBackgroundLeakTemplateV0(text)) {
    return Object.freeze({
      kind: CO_PRESENCE_SPIKE_KIND_V1.NONE,
      score: 0,
      respond: false,
      utility: 0,
      reason: "background_leak_template"
    });
  }

  const signals = classifyStreamingSpikeSignalsV0(input);
  const contextWindow = getStreamingContextWindowV0(atMs);
  const contextAwareness = Math.min(1, 0.35 + contextWindow.length * 0.015);
  const utility = computeCoPresenceUtilityV1({
    relevance: signals.relevance,
    contextAwareness,
    kind: signals.kind
  });

  const decision = shouldCoPresenceRespondV1({
    kind: signals.kind,
    relevance: signals.relevance,
    contextAwareness,
    hasName: signals.hasName,
    atMs
  });

  const respond = isCoPresenceStreamModeV0() && decision.respond;

  const spike = Object.freeze({
    schema: RHIZOH_STREAMING_ATTENTION_SCHEMA_V0,
    runtimeSchema: "rhizoh.co_presence_runtime.v1",
    kind: signals.kind,
    score: signals.relevance,
    utility: decision.utility,
    contextAwareness: Number(contextAwareness.toFixed(3)),
    tau: decision.tau,
    tauAdaptive: decision.threshold?.tauAdaptive,
    respond,
    reason: respond ? signals.reason : decision.reason,
    coPresence: isCoPresenceStreamModeV0(),
    preview: text.slice(0, 120),
    atMs
  });

  if (respond) noteCoPresenceSpikeResponseV1(spike);

  if (respond || signals.kind !== CO_PRESENCE_SPIKE_KIND_V1.NONE) {
    logVoiceInfoV0("STREAMING_ATTENTION_SPIKE", {
      kind: spike.kind,
      score: spike.score,
      utility: spike.utility,
      tau: spike.tau,
      respond: spike.respond,
      reason: spike.reason,
      preview: spike.preview
    });
  }

  publishStreamingAttentionSnapshotV0(spike);
  publishCoPresenceRuntimeSnapshotV1();
  return spike;
}

export function getStreamingAttentionSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_STREAMING_ATTENTION_SCHEMA_V0,
    coPresence: isCoPresenceStreamModeV0(),
    streamChunks: streamRingV0.length,
    contextWindowMs: CO_PRESENCE_CONTEXT_WINDOW_V1.CONVERSATION_MS,
    contextWindows: CO_PRESENCE_CONTEXT_WINDOW_V1,
    adaptiveThreshold: resolveAdaptiveSpikeThresholdV1(),
    recent: Object.freeze([...streamRingV0.slice(-8)]),
    lastSpike:
      typeof window !== "undefined" ? window.__rhizoh?.lastAttentionSpike ?? null : null
  });
}

function publishStreamingAttentionSnapshotV0(spike) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.streamingAttention = getStreamingAttentionSnapshotV0();
  if (spike) window.__rhizoh.lastAttentionSpike = spike;
}

/** @internal vitest */
export function __resetStreamingAttentionGateForTestV0() {
  streamRingV0.length = 0;
}
