/**
 * FOX_BEHAVIOR_GATE_V1 — Phase D.1–D.3
 * Perception ≠ Response: silence gate, observation ledger, initiative queue.
 *
 * D.1 Silence Gate   — observe + !maySpeak → SILENT_OBSERVATION (no LLM/TTS)
 * D.2 Observation Ledger — record noticed events without speaking
 * D.3 Initiative Queue — queue initiate_candidate without speaking
 * Phase E hooks: foxProactiveChannelV1.js (budget + controlled speak)
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { FOX_BEHAVIOR_POSTURE_V1 } from "./foxSignificanceEngineV1.js";
import { buildRhizohLlmDepthBundleV0 } from "./rhizohConversationDepthLlmBridgeV0.js";

export const FOX_BEHAVIOR_GATE_SCHEMA_V1 = "castle.rhizoh.fox_behavior_gate.v1";

export const FOX_BEHAVIOR_OUTCOME_V1 = Object.freeze({
  SILENT_OBSERVATION: "silent_observation",
  REACT_RESPONSE: "react_response",
  INITIATE_QUEUED: "initiate_queued"
});

export const FOX_OBSERVATION_TYPE_V1 = Object.freeze({
  WORLD_EVENT: "world_event",
  AWARENESS_SHIFT: "awareness_shift",
  LOW_SIGNIFICANCE_NOTICE: "low_significance_notice"
});

const MAX_LEDGER_ENTRIES_V1 = 100;
const MAX_QUEUE_ENTRIES_V1 = 20;
const INITIATIVE_TTL_MS_V1 = 30 * 60 * 1000;

/** @type {Array<Record<string, unknown>>} */
let _observationLedger = [];
/** @type {Array<Record<string, unknown>>} */
let _initiativeQueue = [];
/** @type {string | null} */
let _lastAwarenessFingerprint = null;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {ReturnType<import("./foxSignificanceEngineV1.js").evaluateFoxBehaviorPostureV1>} posture
 */
export function resolveFoxBehaviorOutcomeV1(posture) {
  const p = posture && typeof posture === "object" ? posture : {};

  if (p.posture === FOX_BEHAVIOR_POSTURE_V1.OBSERVE && p.maySpeak === false) {
    return Object.freeze({
      outcome: FOX_BEHAVIOR_OUTCOME_V1.SILENT_OBSERVATION,
      mayProceedToLlm: false,
      maySpeak: false,
      mayInitiate: false,
      reason: p.reason || "observe_silence"
    });
  }

  if (p.posture === FOX_BEHAVIOR_POSTURE_V1.INITIATE_CANDIDATE) {
    return Object.freeze({
      outcome: FOX_BEHAVIOR_OUTCOME_V1.INITIATE_QUEUED,
      mayProceedToLlm: false,
      maySpeak: false,
      mayInitiate: p.mayInitiate === true,
      reason: p.reason || "initiate_candidate_queued"
    });
  }

  return Object.freeze({
    outcome: FOX_BEHAVIOR_OUTCOME_V1.REACT_RESPONSE,
    mayProceedToLlm: true,
    maySpeak: p.maySpeak !== false,
    mayInitiate: false,
    reason: p.reason || "react_response"
  });
}

/**
 * @param {ReturnType<import("./castleAwarenessFieldV1.js").readCastleAwarenessFieldV1>} awareness
 */
export function dominantAwarenessSourceV1(awareness) {
  const a = awareness && typeof awareness === "object" ? awareness : {};
  const slices = Object.freeze({
    weather: clamp01(a.weatherAwareness),
    traffic: clamp01(a.trafficAwareness),
    sports: clamp01(a.sportsAwareness),
    news: clamp01(a.newsAwareness),
    social: clamp01(a.socialAwareness),
    narrative: clamp01(a.narrativeAwareness)
  });
  const ranked = Object.entries(slices).sort((x, y) => y[1] - x[1]);
  const top = ranked[0];
  return Object.freeze({
    source: top?.[0] || "world",
    salience: top?.[1] ?? 0,
    slices
  });
}

/**
 * @param {ReturnType<import("./castleAwarenessFieldV1.js").readCastleAwarenessFieldV1>} awareness
 */
function awarenessFingerprintV1(awareness) {
  const d = dominantAwarenessSourceV1(awareness);
  const a = awareness && typeof awareness === "object" ? awareness : {};
  return [
    d.source,
    d.salience,
    clamp01(a.weatherAwareness),
    clamp01(a.trafficAwareness),
    clamp01(a.sportsAwareness),
    clamp01(a.newsAwareness)
  ].join("|");
}

/**
 * @param {{
 *   timestamp?: number,
 *   source?: string,
 *   significance?: number,
 *   observationType?: string,
 *   reason?: string,
 *   attentionScore?: number,
 *   worldSignal?: number,
 *   traceId?: string | null
 * }} entry
 */
export function appendFoxObservationV1(entry = {}) {
  const row = Object.freeze({
    id: `fox_obs_${Number(entry.timestamp) || Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Number(entry.timestamp) || Date.now(),
    source: String(entry.source || "world"),
    significance: clamp01(entry.significance),
    observationType: String(entry.observationType || FOX_OBSERVATION_TYPE_V1.WORLD_EVENT),
    reason: String(entry.reason || ""),
    attentionScore: clamp01(entry.attentionScore),
    worldSignal: clamp01(entry.worldSignal),
    traceId: entry.traceId || null
  });
  _observationLedger = [..._observationLedger, row].slice(-MAX_LEDGER_ENTRIES_V1);
  return row;
}

/**
 * @param {{
 *   significance?: number,
 *   createdAt?: number,
 *   reason?: string,
 *   source?: string,
 *   dominantImpact?: string,
 *   attentionScore?: number,
 *   expiresAt?: number,
 *   traceId?: string | null
 * }} entry
 */
export function enqueueFoxInitiativeV1(entry = {}) {
  const createdAt = Number(entry.createdAt) || Date.now();
  const row = Object.freeze({
    id: `fox_init_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    significance: clamp01(entry.significance),
    createdAt,
    reason: String(entry.reason || ""),
    source: String(entry.source || "world"),
    dominantImpact: String(entry.dominantImpact || ""),
    attentionScore: clamp01(entry.attentionScore),
    expiresAt: Number(entry.expiresAt) || createdAt + INITIATIVE_TTL_MS_V1,
    traceId: entry.traceId || null,
    status: "queued"
  });
  _initiativeQueue = [..._initiativeQueue, row]
    .filter((q) => Number(q.expiresAt) > Date.now())
    .slice(-MAX_QUEUE_ENTRIES_V1);
  return row;
}

export function getFoxObservationLedgerV1() {
  return Object.freeze([..._observationLedger]);
}

export function getFoxInitiativeQueueV1() {
  const now = Date.now();
  return Object.freeze(_initiativeQueue.filter((q) => Number(q.expiresAt) > now));
}

/**
 * Highest-significance queued initiative (not yet consumed).
 * @param {number} [minSignificance]
 */
export function peekTopFoxInitiativeV1(minSignificance = 0.72) {
  const min = clamp01(minSignificance);
  const ranked = getFoxInitiativeQueueV1()
    .filter((q) => q.status === "queued" && clamp01(q.significance) >= min)
    .sort((a, b) => clamp01(b.significance) - clamp01(a.significance));
  return ranked[0] || null;
}

/**
 * @param {string} id
 * @param {string} [status]
 */
export function consumeFoxInitiativeV1(id, status = "consumed") {
  const key = String(id || "").trim();
  if (!key) return false;
  let found = false;
  _initiativeQueue = _initiativeQueue.map((q) => {
    if (q.id !== key || q.status !== "queued") return q;
    found = true;
    return Object.freeze({
      ...q,
      status: String(status || "consumed"),
      consumedAt: Date.now()
    });
  });
  return found;
}

/**
 * @param {ReturnType<import("./rhizohConversationDepthLlmBridgeV0.js").buildRhizohLlmDepthBundleV0>} depthBundle
 * @param {{ traceId?: string | null, tick?: boolean, forceRecord?: boolean }} [opts]
 */
export function applyFoxBehaviorGateV1(depthBundle, opts = {}) {
  const bundle = depthBundle && typeof depthBundle === "object" ? depthBundle : {};
  const posture = bundle.foxBehaviorPosture;
  const outcome = resolveFoxBehaviorOutcomeV1(posture);

  let ledgerEntry = null;
  let queueEntry = null;

  if (outcome.outcome === FOX_BEHAVIOR_OUTCOME_V1.SILENT_OBSERVATION) {
    const awareness = bundle.castleAwarenessField;
    const dominant = dominantAwarenessSourceV1(awareness);
    const fingerprint = awareness ? awarenessFingerprintV1(awareness) : null;
    const awarenessChanged = fingerprint !== _lastAwarenessFingerprint;
    const shouldRecord = opts.forceRecord === true || !opts.tick || awarenessChanged;

    if (shouldRecord) {
      if (fingerprint) _lastAwarenessFingerprint = fingerprint;
      const observationType =
        posture?.reason === "noticed_low_significance_world_event"
          ? FOX_OBSERVATION_TYPE_V1.LOW_SIGNIFICANCE_NOTICE
          : awarenessChanged
            ? FOX_OBSERVATION_TYPE_V1.AWARENESS_SHIFT
            : FOX_OBSERVATION_TYPE_V1.WORLD_EVENT;

      ledgerEntry = appendFoxObservationV1({
        timestamp: Date.now(),
        source: dominant.source,
        significance: bundle.foxSignificanceField?.score,
        observationType,
        reason: posture?.reason || outcome.reason,
        attentionScore: bundle.foxAttentionField?.score,
        worldSignal: bundle.foxAttentionField?.worldSignal,
        traceId: opts.traceId || null
      });

      logVoiceInfoV0("FOX_SILENT_OBSERVATION", {
        traceId: opts.traceId || null,
        source: dominant.source,
        significance: bundle.foxSignificanceField?.score ?? null,
        observationType,
        reason: posture?.reason || outcome.reason
      });
    }
  }

  if (outcome.outcome === FOX_BEHAVIOR_OUTCOME_V1.INITIATE_QUEUED) {
    const awareness = bundle.castleAwarenessField;
    const dominant = dominantAwarenessSourceV1(awareness);
    queueEntry = enqueueFoxInitiativeV1({
      significance: bundle.foxSignificanceField?.score,
      reason: posture?.reason || outcome.reason,
      source: dominant.source,
      dominantImpact: bundle.foxSignificanceField?.dominantImpact,
      attentionScore: bundle.foxAttentionField?.score,
      traceId: opts.traceId || null
    });

    logVoiceInfoV0("FOX_INITIATIVE_QUEUED", {
      traceId: opts.traceId || null,
      id: queueEntry.id,
      significance: queueEntry.significance,
      source: queueEntry.source,
      reason: queueEntry.reason,
      expiresAt: queueEntry.expiresAt
    });
  }

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.foxBehaviorOutcome = outcome;
    window.__rhizoh.foxObservationLedger = getFoxObservationLedgerV1();
    window.__rhizoh.foxInitiativeQueue = getFoxInitiativeQueueV1();
  }

  return Object.freeze({
    schema: FOX_BEHAVIOR_GATE_SCHEMA_V1,
    outcome,
    ledgerEntry,
    queueEntry,
    depthBundle: bundle
  });
}

/**
 * Non-user world perception tick — notice without speaking.
 * @param {{
 *   continuity?: Record<string, unknown> | null,
 *   userTurnCount?: number,
 *   traceId?: string | null,
 *   atMs?: number
 * }} [ctx]
 */
export function runFoxPerceptionTickV1(ctx = {}) {
  const atMs = Number(ctx.atMs) || Date.now();
  const traceId = ctx.traceId || `fox_perception_${atMs}`;

  const bundle = buildRhizohLlmDepthBundleV0({
    message: "",
    userTurnCount: ctx.userTurnCount ?? 0,
    continuity: ctx.continuity,
    traceId
  });

  return applyFoxBehaviorGateV1(bundle, { traceId, tick: true });
}

/** @internal vitest */
export function __resetFoxBehaviorGateForTestV1() {
  _observationLedger = [];
  _initiativeQueue = [];
  _lastAwarenessFingerprint = null;
}
