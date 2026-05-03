export const RHIZOH_GOVERNANCE_STABILITY_CONSTRAINT_LAYER_VERSION = "v1";

export function createRhizohGovernanceStabilityConstraintLayerV1() {
  const state = {
    lastDecision: null,
    lastDecisionAtMs: 0,
    decisionMomentum: 0,
    conflictSeen: new Map(),
    lastPatchAtMs: 0
  };

  function applyPolicyHysteresis(proposedDecision, nowMs, minFlipIntervalMs = 8000) {
    if (!state.lastDecision) {
      state.lastDecision = proposedDecision;
      state.lastDecisionAtMs = nowMs;
      return { allow: true, decision: proposedDecision, hysteresisBlocked: false };
    }
    if (state.lastDecision !== proposedDecision && nowMs - state.lastDecisionAtMs < minFlipIntervalMs) {
      return { allow: false, decision: state.lastDecision, hysteresisBlocked: true };
    }
    state.lastDecision = proposedDecision;
    state.lastDecisionAtMs = nowMs;
    return { allow: true, decision: proposedDecision, hysteresisBlocked: false };
  }

  function applyConflictAging(conflictKind, nowMs, ageWindowMs = 20000) {
    const last = state.conflictSeen.get(conflictKind) ?? 0;
    const repeatedTooSoon = nowMs - last < ageWindowMs;
    state.conflictSeen.set(conflictKind, nowMs);
    return { allowEscalation: !repeatedTooSoon, repeatedTooSoon };
  }

  function applyPatchRateLimit(nowMs, minPatchIntervalMs = 6000) {
    const tooFast = nowMs - state.lastPatchAtMs < minPatchIntervalMs;
    if (!tooFast) state.lastPatchAtMs = nowMs;
    return { allowPatch: !tooFast, tooFast };
  }

  function updateGovernanceMomentum(decisionDirection) {
    const dir = decisionDirection === "strict" ? 1 : decisionDirection === "relax" ? -1 : 0;
    state.decisionMomentum = Math.max(-5, Math.min(5, state.decisionMomentum + dir));
    return state.decisionMomentum;
  }

  function getSnapshot() {
    return Object.freeze({
      lastDecision: state.lastDecision,
      lastDecisionAtMs: state.lastDecisionAtMs,
      decisionMomentum: state.decisionMomentum,
      lastPatchAtMs: state.lastPatchAtMs
    });
  }

  return Object.freeze({
    applyPolicyHysteresis,
    applyConflictAging,
    applyPatchRateLimit,
    updateGovernanceMomentum,
    getSnapshot
  });
}

