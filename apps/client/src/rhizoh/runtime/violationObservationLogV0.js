/**
 * Reality breach observability v0.1 — READ-ONLY truth trace (factual, not counterfactual).
 *
 * Records what happened; never decides, revokes, or repairs.
 * @see docs/RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md
 */

import { getActiveCorrelationIdV0 } from "./breachCorrelationWindowV0.js";

const INTEGRITY_LIVE_OK_V0 = "LIVE_OK";
const INTEGRITY_QUARANTINE_V0 = "QUARANTINE";

/**
 * @param {number[]} seqs
 */
function isEventSeqMonotonicV0(seqs) {
  if (!seqs.length) return true;
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] < seqs[i - 1]) return false;
  }
  return true;
}

export const BREACH_OBSERVATION_SCHEMA_V0 = "castle.rhizoh.breach_observation.v0";

export const BREACH_RESPONSE_MODE_V0 = Object.freeze({
  SHADOW: "shadow",
  REVOKE: "revoke",
  QUARANTINE: "quarantine",
  CORRECTION_CHAIN: "correction_chain"
});

export const BREACH_VIOLATION_CLASS_V0 = Object.freeze({
  TIME_INTEGRITY: "TIME_INTEGRITY",
  DATA_INTEGRITY: "DATA_INTEGRITY",
  PERCEPTION_INTEGRITY: "PERCEPTION_INTEGRITY",
  CAUSAL_INTEGRITY: "CAUSAL_INTEGRITY",
  PEER_INGRESS: "PEER_INGRESS",
  ONBOARDING_INTENDED: "ONBOARDING_INTENDED"
});

const MAX_BREACH_OBSERVATIONS_V0 = 256;

/** @type {readonly import('./violationObservationLogV0.js').BreachObservationV0[]} */
let breachTraceV0 = [];
let breachSeqV0 = 0;
let breachDroppedV0 = 0;

/**
 * @typedef {Object} WalDivergenceSnapshotV0
 * @property {number|null} shadowWalTick
 * @property {number[]|null} eventSeqTail
 * @property {boolean|null} orderingMonotonic
 * @property {string|null} integritySystemState
 */

/**
 * @typedef {Object} BreachObservationV0
 * @property {string} schema
 * @property {number} seq
 * @property {number} atMs
 * @property {string} violationClass
 * @property {string} responseMode
 * @property {string} source
 * @property {boolean} auto
 * @property {boolean} captainRequired
 * @property {string} detail
 * @property {WalDivergenceSnapshotV0|null} [walSnapshot]
 * @property {object|null} [context]
 * @property {string|null} [correlationId]
 */

/**
 * @param {object} [signals]
 * @returns {WalDivergenceSnapshotV0}
 */
export function buildWalDivergenceSnapshotV0(signals = {}) {
  const eventSeqs = Array.isArray(signals.eventSeqs)
    ? signals.eventSeqs.filter(Number.isFinite)
    : null;
  return Object.freeze({
    shadowWalTick: Number.isFinite(signals.shadowWalTick) ? Number(signals.shadowWalTick) : null,
    eventSeqTail: eventSeqs?.length ? eventSeqs.slice(-8) : null,
    orderingMonotonic: eventSeqs?.length ? isEventSeqMonotonicV0(eventSeqs) : null,
    integritySystemState:
      typeof signals.system_state === "string" ? signals.system_state : null
  });
}

/**
 * Append-only breach record. No enforcement side effects.
 *
 * @param {{
 *   violationClass: string,
 *   responseMode: string,
 *   source: string,
 *   detail: string,
 *   auto?: boolean,
 *   captainRequired?: boolean,
 *   walSnapshot?: WalDivergenceSnapshotV0 | null,
 *   context?: object | null,
 *   atMs?: number,
 *   correlationId?: string | null
 * }} input
 * @returns {BreachObservationV0}
 */
export function recordBreachObservationV0(input) {
  const correlationId = input.correlationId ?? getActiveCorrelationIdV0() ?? null;

  const entry = Object.freeze({
    schema: BREACH_OBSERVATION_SCHEMA_V0,
    seq: ++breachSeqV0,
    atMs: Number(input.atMs) || Date.now(),
    violationClass: String(input.violationClass || BREACH_VIOLATION_CLASS_V0.DATA_INTEGRITY),
    responseMode: String(input.responseMode || BREACH_RESPONSE_MODE_V0.QUARANTINE),
    source: String(input.source || "unknown"),
    auto: input.auto !== false,
    captainRequired: Boolean(input.captainRequired),
    detail: String(input.detail || ""),
    walSnapshot: input.walSnapshot ? Object.freeze({ ...input.walSnapshot }) : null,
    context: input.context ? Object.freeze({ ...input.context }) : null,
    correlationId: correlationId ? String(correlationId) : null
  });

  const next = [...breachTraceV0, entry];
  if (next.length > MAX_BREACH_OBSERVATIONS_V0) {
    breachDroppedV0 += next.length - MAX_BREACH_OBSERVATIONS_V0;
    breachTraceV0 = Object.freeze(next.slice(-MAX_BREACH_OBSERVATIONS_V0));
  } else {
    breachTraceV0 = Object.freeze(next);
  }

  syncBreachObservationWindowV0();
  return entry;
}

/**
 * @returns {{ schema: string, entries: readonly BreachObservationV0[], total: number, dropped: number, centralizedArbitrationBus: false }}
 */
export function getBreachObservationTraceV0() {
  return Object.freeze({
    schema: BREACH_OBSERVATION_SCHEMA_V0,
    version: "0.1",
    entries: breachTraceV0,
    total: breachTraceV0.length,
    dropped: breachDroppedV0,
    centralizedArbitrationBus: false
  });
}

/** @returns {BreachObservationV0 | null} */
export function getLastBreachObservationV0() {
  return breachTraceV0.length ? breachTraceV0[breachTraceV0.length - 1] : null;
}

/** Test-only reset */
export function clearBreachObservationTraceForTestV0() {
  breachTraceV0 = [];
  breachSeqV0 = 0;
  breachDroppedV0 = 0;
  syncBreachObservationWindowV0();
}

function syncBreachObservationWindowV0() {
  if (typeof window === "undefined") return;
  const trace = getBreachObservationTraceV0();
  window.__rhizoh_breach_observation = trace;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh.breachObservation = Object.freeze({
    trace: () => getBreachObservationTraceV0(),
    last: () => getLastBreachObservationV0(),
    record: recordBreachObservationV0
  });
}

/**
 * Map post-go-live integrity evaluation → factual breach observation (non-LIVE_OK only).
 *
 * @param {ReturnType<import('./postGoLiveIntegrityLoopV0.js').evaluatePostGoLiveIntegrityV0>} result
 * @param {object} [signals]
 */
export function observePostGoLiveIntegrityBreachV0(result, signals = {}) {
  if (!result || result.system_state === INTEGRITY_LIVE_OK_V0) return null;

  const failed = Object.entries(result.checks || {}).filter(([, c]) => c && !c.ok);
  const keys = failed.map(([k]) => k);
  const correlationId = signals.correlationId ?? getActiveCorrelationIdV0() ?? null;
  const responseMode = BREACH_RESPONSE_MODE_V0.QUARANTINE;
  const baseContext = Object.freeze({
    checks: result.checks,
    system_state: result.system_state,
    failedChecks: keys
  });
  const walSnapshot = buildWalDivergenceSnapshotV0({
    ...signals,
    system_state: result.system_state
  });

  /** @type {import('./violationObservationLogV0.js').BreachObservationV0 | null} */
  let last = null;

  const recordForCheck = (checkKey) => {
    let violationClass = BREACH_VIOLATION_CLASS_V0.CAUSAL_INTEGRITY;
    if (checkKey === "layerTrace") violationClass = BREACH_VIOLATION_CLASS_V0.DATA_INTEGRITY;
    else if (checkKey === "nodeHealthEcho") violationClass = BREACH_VIOLATION_CLASS_V0.PEER_INGRESS;

    last = recordBreachObservationV0({
      violationClass,
      responseMode,
      source: "postGoLiveIntegrityLoopV0",
      auto: true,
      captainRequired: result.system_state === INTEGRITY_QUARANTINE_V0,
      detail: `system_state=${result.system_state}; check=${checkKey}`,
      walSnapshot,
      context: baseContext,
      correlationId
    });
  };

  if (correlationId && keys.length > 1) {
    for (const key of keys) recordForCheck(key);
    return last;
  }

  let violationClass = BREACH_VIOLATION_CLASS_V0.CAUSAL_INTEGRITY;
  if (keys.includes("layerTrace")) violationClass = BREACH_VIOLATION_CLASS_V0.DATA_INTEGRITY;
  else if (keys.includes("nodeHealthEcho")) violationClass = BREACH_VIOLATION_CLASS_V0.PEER_INGRESS;

  return recordBreachObservationV0({
    violationClass,
    responseMode,
    source: "postGoLiveIntegrityLoopV0",
    auto: true,
    captainRequired: result.system_state === INTEGRITY_QUARANTINE_V0,
    detail: `system_state=${result.system_state}; failed=${keys.join(",") || "unknown"}`,
    walSnapshot,
    context: baseContext,
    correlationId
  });
}

/**
 * @param {{ revoked?: boolean, mismatch?: boolean, code?: string, statement?: string }} enforcement
 * @param {string} [diskKey]
 */
export function observeBootValidityEnforcementBreachV0(enforcement, diskKey) {
  if (!enforcement?.revoked && !enforcement?.mismatch) return null;
  if (enforcement.revoked !== true && enforcement.mismatch !== true) return null;

  return recordBreachObservationV0({
    violationClass: BREACH_VIOLATION_CLASS_V0.PERCEPTION_INTEGRITY,
    responseMode: enforcement.revoked
      ? BREACH_RESPONSE_MODE_V0.REVOKE
      : BREACH_RESPONSE_MODE_V0.QUARANTINE,
    source: "bootValidityTokenV0",
    auto: true,
    captainRequired: Boolean(enforcement.hardReload),
    detail: String(enforcement.statement || enforcement.code || "boot_validity_breach"),
    walSnapshot: null,
    context: Object.freeze({
      diskKey: diskKey || null,
      hardReload: Boolean(enforcement.hardReload),
      code: enforcement.code || null
    })
  });
}
