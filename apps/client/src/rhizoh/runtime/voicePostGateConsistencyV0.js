/**
 * Post-gate policy consistency — single execution authority for router vs behavior commitment.
 * Route.executionAccepted is dispatch truth; commitment must not contradict it on directed speech.
 */

import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { finalizeVoiceBehavioralCommitmentV0 } from "./voiceBehavioralCommitmentV0.js";
import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";

export const VOICE_POST_GATE_CONSISTENCY_SCHEMA_V0 = "castle.rhizoh.voice_post_gate_consistency.v0";

const metrics = {
  postGateCount: 0,
  memoryEligibleTrue: 0,
  memoryEligibleFalse: 0,
  unknownBand: 0,
  policyDivergence: 0
};

/**
 * @param {{
 *   route: {
 *     executionAccepted?: boolean,
 *     sanityAccepted?: boolean,
 *     observationPass?: boolean,
 *     reason?: string
 *   },
 *   turnAcceptance?: { accepted?: boolean, reason?: string } | null,
 *   band: string,
 *   source?: string,
 *   gateConfidence?: number,
 *   rawConfidence?: number,
 *   dispatchAuthoritative?: boolean
 * }} input
 */
export function resolvePostGateCommitmentV0(input = {}) {
  const route = input.route && typeof input.route === "object" ? input.route : {};
  const turnAcceptance =
    input.turnAcceptance && typeof input.turnAcceptance === "object" ? input.turnAcceptance : null;
  const band = String(input.band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  const source = String(input.source || "mic_v3");

  const routeExec = route.executionAccepted === true;
  const turnExec = turnAcceptance?.accepted === true;
  const turnGateRan = turnAcceptance != null;
  const turnRouteMismatch = turnGateRan && routeExec !== turnExec;
  const directed = band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  const routeObservationPass = route.observationPass === true;
  const dispatchAuthoritative = input.dispatchAuthoritative === true;
  const gateConfidence = Number(input.gateConfidence);
  const rawConfidence = Number(input.rawConfidence);
  const confidenceDrift01 =
    Number.isFinite(gateConfidence) && Number.isFinite(rawConfidence)
      ? Math.abs(gateConfidence - rawConfidence)
      : null;

  /**
   * Default: route is dispatch truth (no directed_rejected when route accepts).
   * dispatchAuthoritative: memory only when route + turn agree (prevents wrong commit on drift).
   */
  const turnAcceptedForMemory = directed
    ? dispatchAuthoritative
      ? routeExec && (!turnGateRan || turnExec)
      : routeExec
    : turnGateRan
      ? turnExec
      : routeExec;
  const sanityAcceptedForMemory =
    turnAcceptedForMemory ||
    route.sanityAccepted !== false ||
    routeObservationPass;

  const commitment = finalizeVoiceBehavioralCommitmentV0({
    band,
    source,
    sanityAccepted: sanityAcceptedForMemory,
    turnAccepted: turnAcceptedForMemory,
    turnReason: turnAcceptance?.reason || route.reason
  });

  const policyDivergence =
    directed && routeExec && commitment.commitment === "directed_rejected";

  metrics.postGateCount += 1;
  if (band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) metrics.unknownBand += 1;
  if (commitment.memoryEligible === true) metrics.memoryEligibleTrue += 1;
  else metrics.memoryEligibleFalse += 1;
  if (policyDivergence || turnRouteMismatch) metrics.policyDivergence += 1;

  const consistency = Object.freeze({
    schema: VOICE_POST_GATE_CONSISTENCY_SCHEMA_V0,
    routeExecutionAccepted: routeExec,
    turnExecutionAccepted: turnGateRan ? turnExec : null,
    turnRouteMismatch,
    policyDivergence,
    memoryEligible: commitment.memoryEligible,
    commitment: commitment.commitment,
    band,
    routeReason: route.reason || null,
    turnReason: turnAcceptance?.reason || null,
    gateConfidence: Number.isFinite(gateConfidence) ? gateConfidence : null,
    rawConfidence: Number.isFinite(rawConfidence) ? rawConfidence : null,
    confidenceDrift01,
    dispatchAuthoritative
  });

  if (turnRouteMismatch) {
    logVoiceWarnV0("POST_GATE_TURN_ROUTE_MISMATCH", {
      routeExecutionAccepted: routeExec,
      turnAccepted: turnExec,
      routeReason: route.reason,
      turnReason: turnAcceptance?.reason,
      band,
      source,
      gateConfidence: Number.isFinite(gateConfidence) ? gateConfidence : undefined,
      rawConfidence: Number.isFinite(rawConfidence) ? rawConfidence : undefined,
      confidenceDrift01,
      policyNote: "align_turn_gate_with_dispatch_route_or_gateConfidence"
    });
  }
  if (
    directed &&
    routeExec &&
    turnRouteMismatch &&
    Number.isFinite(confidenceDrift01) &&
    confidenceDrift01 >= 0.08
  ) {
    logVoiceWarnV0("POST_GATE_CONFIDENCE_DRIFT", {
      gateConfidence,
      rawConfidence,
      confidenceDrift01,
      routeReason: route.reason,
      turnReason: turnAcceptance?.reason,
      band,
      source
    });
  }
  if (policyDivergence) {
    logVoiceWarnV0("POST_GATE_POLICY_DIVERGENCE", {
      routeExecutionAccepted: routeExec,
      commitment: commitment.commitment,
      memoryEligible: commitment.memoryEligible,
      band,
      source,
      routeReason: route.reason
    });
  }

  logVoiceInfoV0("POST_GATE_CONSISTENCY", {
    ...consistency,
    memoryEligibleRatio: metrics.postGateCount
      ? Number((metrics.memoryEligibleTrue / metrics.postGateCount).toFixed(3))
      : 0,
    policyDivergenceCount: metrics.policyDivergence,
    unknownBandCount: metrics.unknownBand
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_POST_GATE_CONSISTENCY__ = Object.freeze({
      ...consistency,
      atMs: Date.now(),
      metrics: Object.freeze({ ...metrics })
    });
  }

  return Object.freeze({ commitment, consistency });
}

export function getPostGateConsistencyMetricsV0() {
  return Object.freeze({ ...metrics });
}

export function resetPostGateConsistencyMetricsForTestV0() {
  metrics.postGateCount = 0;
  metrics.memoryEligibleTrue = 0;
  metrics.memoryEligibleFalse = 0;
  metrics.unknownBand = 0;
  metrics.policyDivergence = 0;
}
