/**
 * Rhizoh Thinking Layer v0 — async post-hoc observation only.
 * Governance · grounding · semantic compression · corrections — never blocks live path.
 */

import { governPulseEmissionV0 } from "./rhizohPulseGovernanceV0.js";
import { touchIdentityLifecycleV0 } from "./rhizohIdentityLifecycleV0.js";
import { resolveGatewayTransportV0 } from "./rhizohGatewayTransportFallbackV0.js";
import { getIdentityEventLogSnapshotV0 } from "./rhizohIdentityEventLogV0.js";
import { getComputeAdapterSnapshotV0 } from "./rhizohComputeAdapterRegistryV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_THINKING_LAYER_SCHEMA_V0 = "rhizoh.thinking_layer.v0";

/** @type {object[]} */
const observationQueueV0 = [];
/** @type {boolean} */
let flushScheduledV0 = false;
/** @type {object | null} */
let lastObservationV0 = null;
/** @type {number} */
let observationCountV0 = 0;

/**
 * Queue governance observation — runs after live response (non-blocking).
 * @param {object} payload
 */
export function scheduleThinkingObservationV0(payload = {}) {
  observationQueueV0.push(
    Object.freeze({
      ...payload,
      enqueuedAtMs: Date.now()
    })
  );
  if (!flushScheduledV0) {
    flushScheduledV0 = true;
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => flushThinkingQueueV0(), { timeout: 150 });
    } else {
      setTimeout(flushThinkingQueueV0, 0);
    }
  }
  publishThinkingSnapshotV0(buildThinkingLayerSnapshotRawV0());
}

function flushThinkingQueueV0() {
  flushScheduledV0 = false;
  const batch = observationQueueV0.splice(0, observationQueueV0.length);
  for (const item of batch) {
    try {
      lastObservationV0 = runThinkingObservationV0(item);
      observationCountV0 += 1;
    } catch (err) {
      logVoiceInfoV0("THINKING_OBSERVATION_FAULT", {
        error: String(err?.message || err),
        source: item.source
      });
    }
  }
  publishThinkingSnapshotV0();
}

/**
 * Post-hoc governance — produces observation + optional correction, never blocks emit.
 * @param {object} payload
 */
export function runThinkingObservationV0(payload = {}) {
  const transport = resolveGatewayTransportV0();
  const eventLog = getIdentityEventLogSnapshotV0();
  const compute = getComputeAdapterSnapshotV0();

  const governed = governPulseEmissionV0(
    {
      presenceKind: payload.kind || payload.signature?.kind,
      intent: payload.intent,
      phrase: payload.phrase,
      userInitiated:
        payload.userInitiated === true ||
        payload.source === "instant_presence" ||
        payload.source === "user_voice",
      type: "post_hoc_observation"
    },
    {
      voiceReady: true,
      computeDegraded: compute.adapterAvailable === false,
      eventLog,
      transport
    }
  );

  if (governed.governance?.identityMeaningful !== false) {
    touchIdentityLifecycleV0({
      type: "thinking_observation",
      intent: payload.intent || payload.signature?.kind,
      emotionalTone: payload.emotionalTone || payload.signature?.emotionalTone,
      turnId: payload.traceId,
      carrier: payload.carrier || transport.mode,
      presenceKind: payload.kind || payload.signature?.kind,
      preview: payload.phrase,
      modality: payload.modality || "presence",
      incrementTurn: payload.incrementTurn === true
    });
  }

  /** @type {object | null} */
  let correction = null;
  if (governed.grounding?.unexpectedImportant) {
    const rescue = governed.grounding.telemetryRescue?.[0];
    correction = Object.freeze({
      kind: "grounding_correction",
      reason: rescue?.reason || "world_mismatch",
      message: rescue?.message || null,
      liveAlreadyEmitted: true
    });
    logVoiceInfoV0("THINKING_GROUNDING_CORRECTION", correction);
  }

  if (!governed.governance?.emit) {
    logVoiceInfoV0("THINKING_WOULD_SUPPRESS", {
      reason: governed.governance?.suppressReason,
      liveAlreadyEmitted: true,
      observationOnly: true
    });
  }

  const observation = Object.freeze({
    schema: RHIZOH_THINKING_LAYER_SCHEMA_V0,
    atMs: Date.now(),
    source: payload.source || "unknown",
    governed,
    correction,
    liveEventId: payload.liveEvent?.signature?.signature || null,
    observationOnly: true,
    blockedLive: false
  });

  logVoiceInfoV0("THINKING_OBSERVATION", {
    source: observation.source,
    wouldSuppress: !governed.governance?.emit,
    correction: Boolean(correction)
  });

  return observation;
}

function buildThinkingLayerSnapshotRawV0() {
  return Object.freeze({
    schema: RHIZOH_THINKING_LAYER_SCHEMA_V0,
    role: "observation_only",
    queueDepth: observationQueueV0.length,
    observationCount: observationCountV0,
    lastObservation: lastObservationV0,
    blocksExecution: false
  });
}

export function getThinkingLayerSnapshotV0() {
  const snap = buildThinkingLayerSnapshotRawV0();
  publishThinkingSnapshotV0(snap);
  return snap;
}

function publishThinkingSnapshotV0(snap) {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.thinkingLayer = snap;
  }
}

/** @internal vitest — flush synchronously in tests */
export function __flushThinkingQueueForTestV0() {
  flushThinkingQueueV0();
}

/** @internal vitest */
export function __resetThinkingLayerForTestV0() {
  observationQueueV0.length = 0;
  flushScheduledV0 = false;
  lastObservationV0 = null;
  observationCountV0 = 0;
}
