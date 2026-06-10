/**
 * Rhizoh Co-Presence Runtime v1 — product identity SSOT.
 * Attention-based co-presence agent; STT = signal feeder, spike = consciousness gate.
 * @see apps/client/docs/RHIZOH_CO_PRESENCE_RUNTIME_SPEC_V1.md
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_CO_PRESENCE_RUNTIME_SCHEMA_V1 = "rhizoh.co_presence_runtime.v1";

export const CO_PRESENCE_SPIKE_KIND_V1 = Object.freeze({
  NONE: "none",
  EMERGENCY: "emergency",
  NAME_CALL: "name_call",
  QUESTION: "question",
  ANALYTICAL: "analytical",
  DIRECTIVE: "directive"
});

/** Spike taxonomy weights — max relevance floor per kind. */
export const CO_PRESENCE_SPIKE_WEIGHTS_V1 = Object.freeze({
  [CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY]: 0.9,
  [CO_PRESENCE_SPIKE_KIND_V1.NAME_CALL]: 0.78,
  [CO_PRESENCE_SPIKE_KIND_V1.QUESTION]: 0.68,
  [CO_PRESENCE_SPIKE_KIND_V1.ANALYTICAL]: 0.64,
  [CO_PRESENCE_SPIKE_KIND_V1.DIRECTIVE]: 0.58,
  [CO_PRESENCE_SPIKE_KIND_V1.NONE]: 0.18
});

export const CO_PRESENCE_CONTEXT_WINDOW_V1 = Object.freeze({
  IMMEDIATE_MS: 30_000,
  CONVERSATION_MS: 90_000,
  SESSION_MS: 300_000,
  STREAM_RING_MAX: 96
});

export const CO_PRESENCE_LATENCY_BUDGET_MS_V1 = Object.freeze({
  INSTANT_ACK: 500,
  SPIKE_TO_DISPATCH: 2000,
  VOICE_LLM_SOFT: 8000,
  SHADOW_SCAFFOLD_SYNC: 50
});

export const CO_PRESENCE_THRESHOLD_V1 = Object.freeze({
  TAU_BASE: 0.52,
  TAU_CAP: 0.72,
  RELEVANCE_RESPOND_FLOOR: 0.58,
  SILENCE_PENALTY: 0.08,
  FLOOD_SPIKE_SOFT_CAP: 3,
  FLOOD_SPIKE_WINDOW_MS: 60_000,
  FLOOD_TAU_STEP: 0.04,
  COMPOSITE_NAME_QUESTION_TAU_DISCOUNT: 0.06
});

export const CO_PRESENCE_BACKGROUND_LEAK_PATTERNS_V1 = [
  /altyazı/i,
  /abone ol/i,
  /izlediğiniz için/i,
  /thanks for watching/i,
  /subscribe/i,
  /like and subscribe/i
];

export const CO_PRESENCE_ANALYTICAL_PATTERNS_V1 = [
  /\b(neden|niye|how come|why)\b/i,
  /\b(hamle|pozisyon|position|move|foul|offside|taktik)\b/i,
  /\b(şu|bu)\s+(an|pozisyon|hamle|faul)/i,
  /\bwhat (is|was|about)\b/i
];

export const CO_PRESENCE_DIRECTIVE_PATTERNS_V1 = [
  /\b(bak|dinle|look|listen)\b/i,
  /\b(rhizoh|rizo|rizoh)\b.*\b(bak|dinle|söyle|anlat)/i
];

/** @type {object[]} */
const spikeHistoryV1 = [];

/**
 * @param {number} n
 */
export function clamp01V1(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/**
 * Utility = Relevance × ContextAwareness − SilencePenalty
 * @param {object} p
 */
export function computeCoPresenceUtilityV1(p = {}) {
  const relevance = clamp01V1(p.relevance);
  const contextAwareness = clamp01V1(p.contextAwareness ?? 0.35);
  const silencePenalty =
    p.kind === CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY ? 0 : CO_PRESENCE_THRESHOLD_V1.SILENCE_PENALTY;
  return Number((relevance * contextAwareness - silencePenalty).toFixed(3));
}

/**
 * Adaptive τ — raises threshold under spike flooding (not more filtering).
 */
export function resolveAdaptiveSpikeThresholdV1(nowMs = Date.now()) {
  const cutoff = nowMs - CO_PRESENCE_THRESHOLD_V1.FLOOD_SPIKE_WINDOW_MS;
  const recent = spikeHistoryV1.filter((s) => s.atMs >= cutoff && s.responded);
  const excess = Math.max(0, recent.length - CO_PRESENCE_THRESHOLD_V1.FLOOD_SPIKE_SOFT_CAP);
  const tau = Math.min(
    CO_PRESENCE_THRESHOLD_V1.TAU_CAP,
    CO_PRESENCE_THRESHOLD_V1.TAU_BASE + excess * CO_PRESENCE_THRESHOLD_V1.FLOOD_TAU_STEP
  );
  return Object.freeze({
    tauBase: CO_PRESENCE_THRESHOLD_V1.TAU_BASE,
    tauAdaptive: Number(tau.toFixed(3)),
    recentRespondCount: recent.length,
    floodBoost: Number((tau - CO_PRESENCE_THRESHOLD_V1.TAU_BASE).toFixed(3))
  });
}

/**
 * @param {object} spike
 */
export function noteCoPresenceSpikeResponseV1(spike) {
  if (!spike?.respond) return;
  spikeHistoryV1.push(Object.freeze({ kind: spike.kind, atMs: spike.atMs || Date.now(), responded: true }));
  const cutoff = Date.now() - CO_PRESENCE_THRESHOLD_V1.FLOOD_SPIKE_WINDOW_MS * 2;
  while (spikeHistoryV1.length && spikeHistoryV1[0].atMs < cutoff) spikeHistoryV1.shift();
}

/**
 * @param {object} p
 */
export function shouldCoPresenceRespondV1(p = {}) {
  const kind = p.kind || CO_PRESENCE_SPIKE_KIND_V1.NONE;
  const relevance = clamp01V1(p.relevance);
  const utility = computeCoPresenceUtilityV1({
    relevance,
    contextAwareness: p.contextAwareness,
    kind
  });
  const threshold = resolveAdaptiveSpikeThresholdV1(p.atMs);
  let tau = threshold.tauAdaptive;

  if (
    p.hasName &&
    (kind === CO_PRESENCE_SPIKE_KIND_V1.QUESTION || kind === CO_PRESENCE_SPIKE_KIND_V1.ANALYTICAL)
  ) {
    tau -= CO_PRESENCE_THRESHOLD_V1.COMPOSITE_NAME_QUESTION_TAU_DISCOUNT;
  }

  if (kind === CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY) {
    return Object.freeze({ respond: true, utility, tau: 0, reason: "emergency_override", threshold });
  }

  const respond =
    utility >= tau ||
    (kind !== CO_PRESENCE_SPIKE_KIND_V1.NONE && relevance >= CO_PRESENCE_THRESHOLD_V1.RELEVANCE_RESPOND_FLOOR);

  return Object.freeze({
    respond,
    utility,
    tau: Number(Math.max(0, tau).toFixed(3)),
    reason: respond ? "spike_above_tau" : "below_adaptive_tau",
    threshold
  });
}

export function getCoPresenceRuntimeSnapshotV1() {
  const threshold = resolveAdaptiveSpikeThresholdV1();
  return Object.freeze({
    schema: RHIZOH_CO_PRESENCE_RUNTIME_SCHEMA_V1,
    identity: "attention_based_co_presence_agent",
    sttRole: "signal_feeder",
    center: "attention_spike",
    spikeWeights: CO_PRESENCE_SPIKE_WEIGHTS_V1,
    contextWindows: CO_PRESENCE_CONTEXT_WINDOW_V1,
    latencyBudgets: CO_PRESENCE_LATENCY_BUDGET_MS_V1,
    threshold,
    spikeHistoryCount: spikeHistoryV1.length
  });
}

export function publishCoPresenceRuntimeSnapshotV1() {
  const snap = getCoPresenceRuntimeSnapshotV1();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.coPresenceRuntime = snap;
  }
  return snap;
}

/** @internal vitest */
export function __resetCoPresenceRuntimeForTestV1() {
  spikeHistoryV1.length = 0;
}
