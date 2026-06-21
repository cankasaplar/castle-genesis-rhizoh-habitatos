/**
 * Epistemic Invocation Guard v0 — prevents Epistemic Echo Loops.
 * Rule: narrative bridge / ledger consume observations; they never produce them.
 * @see docs/RHIZOH_MEANING_RESONANCE_LEDGER_V0.md
 */

export const EPISTEMIC_INVOCATION_GUARD_SCHEMA_V0 = "castle.rhizoh.epistemic_invocation_guard.v0";

let consumeOnlyDepthV0 = 0;

export function isEpistemicConsumeOnlyPassV0() {
  return consumeOnlyDepthV0 > 0;
}

/**
 * @param {number} [observerCountBefore]
 */
export function beginEpistemicConsumeOnlyPassV0(observerCountBefore = 0) {
  consumeOnlyDepthV0 += 1;
  return observerCountBefore;
}

export function endEpistemicConsumeOnlyPassV0() {
  consumeOnlyDepthV0 = Math.max(0, consumeOnlyDepthV0 - 1);
}

/**
 * @param {() => T} fn
 * @param {number} observerCountBefore
 * @returns {T}
 * @template T
 */
export function runEpistemicConsumeOnlyPassV0(fn, observerCountBefore = 0) {
  beginEpistemicConsumeOnlyPassV0(observerCountBefore);
  try {
    return fn();
  } finally {
    endEpistemicConsumeOnlyPassV0();
  }
}

/**
 * @param {{ observerCountBefore: number, observerCountAfter: number, bridgeProducedObservation?: boolean }} input
 */
export function detectEpistemicEchoLoopV0(input) {
  const observerAmplified = input.observerCountAfter > input.observerCountBefore;
  const echoLoopDetected = observerAmplified || input.bridgeProducedObservation === true;

  return Object.freeze({
    schema: EPISTEMIC_INVOCATION_GUARD_SCHEMA_V0,
    echoLoopDetected,
    observerAmplified,
    invocationAsymmetryHolds: !echoLoopDetected,
    attentionShapingRisk: echoLoopDetected ? "elevated" : "none",
    interpretationOnly: true
  });
}

/**
 * @param {{ observerTraceCount?: number, ledgerCount?: number }} [snap]
 */
export function buildEpistemicInvocationGuardSnapshotV0(snap = {}) {
  return Object.freeze({
    schema: EPISTEMIC_INVOCATION_GUARD_SCHEMA_V0,
    consumeOnlyPassActive: isEpistemicConsumeOnlyPassV0(),
    observerTraceCount: snap.observerTraceCount ?? 0,
    ledgerCount: snap.ledgerCount ?? 0,
    rule: "bridge_and_ledger_consume_only_never_observe",
    interpretationOnly: true
  });
}

export function mountEpistemicInvocationGuardConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.epistemicInvocationGuard = Object.freeze({
    snapshot: buildEpistemicInvocationGuardSnapshotV0,
    consumeOnlyActive: isEpistemicConsumeOnlyPassV0
  });
}
