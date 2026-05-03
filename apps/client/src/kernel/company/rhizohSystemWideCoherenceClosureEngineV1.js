import { evaluateRhizohGlobalGovernanceCoherenceV1 } from "./rhizohGlobalGovernanceCoherenceEngineV1.js";
import { verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";
import { validateRhizohPolicyWithSmtV1 } from "./rhizohFormalGovernanceSystemV1.js";

export const RHIZOH_SYSTEM_WIDE_COHERENCE_CLOSURE_ENGINE_VERSION = "v1";

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function hashStringFNV1a(value) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function attemptGlobalInvariantConvergenceProofV1(history = []) {
  if (!history.length) {
    return Object.freeze({
      attempted: true,
      converged: false,
      reason: "no_history",
      confidence: 0
    });
  }
  const hashes = history.map((h) => hashStringFNV1a(JSON.stringify(h.invariants ?? {})));
  const tail = hashes.slice(-3);
  const converged = tail.length >= 2 && new Set(tail).size === 1;
  return Object.freeze({
    attempted: true,
    converged,
    confidence: converged ? 0.75 : clamp01(1 - new Set(tail).size / Math.max(1, tail.length)),
    tailHashes: Object.freeze(tail)
  });
}

export function detectRecoveryCycleFixedPointV1(cycles = []) {
  if (cycles.length < 2) {
    return Object.freeze({
      fixedPointDetected: false,
      reason: "insufficient_cycles",
      cycleCount: cycles.length
    });
  }
  const tail = cycles.slice(-3).map((c) =>
    hashStringFNV1a(
      JSON.stringify({
        phase: c.phase ?? null,
        freezeReasonClass: c.freezeReasonClass ?? null,
        lastValidReplayPoint: c.lastValidReplayPoint ?? null
      })
    )
  );
  const fixedPointDetected = new Set(tail).size === 1;
  return Object.freeze({
    fixedPointDetected,
    cycleCount: cycles.length,
    tailHashes: Object.freeze(tail)
  });
}

export function analyzePolicyTemporalFixpointV1(policyHistory = []) {
  if (policyHistory.length < 2) {
    return Object.freeze({
      fixedPoint: false,
      reason: "insufficient_policy_history",
      score: 0
    });
  }
  const tail = policyHistory.slice(-4).map((p) =>
    hashStringFNV1a(
      JSON.stringify({
        policyVersion: p.policyVersion ?? null,
        requiresHumanApprovalReset: !!p.requiresHumanApprovalReset,
        changeJustified: !!p.changeJustified
      })
    )
  );
  const unique = new Set(tail).size;
  const fixedPoint = unique === 1;
  return Object.freeze({
    fixedPoint,
    score: fixedPoint ? 1 : clamp01(1 - (unique - 1) * 0.25),
    tailHashes: Object.freeze(tail)
  });
}

export async function evaluateSystemWideCoherenceClosureV1(inputs = {}) {
  const governance = await evaluateRhizohGlobalGovernanceCoherenceV1(inputs);
  const replay = verifyRhizohReplayTraceV1(inputs.events ?? []);
  const smt = await validateRhizohPolicyWithSmtV1({
    governanceFacts: inputs.governanceFacts ?? {},
    bridgePayload: inputs.bridgePayload ?? {}
  });
  const convergence = attemptGlobalInvariantConvergenceProofV1(inputs.invariantHistory ?? []);
  const recoveryFixedPoint = detectRecoveryCycleFixedPointV1(inputs.recoveryCycles ?? []);
  const policyFixpoint = analyzePolicyTemporalFixpointV1(inputs.policyHistory ?? []);

  const smtAcceptable = smt.solver?.status === "sat" || smt.solver?.status === "unknown";
  const closureBinding = Object.freeze({
    smtAcceptable,
    replayOk: replay.ok,
    governanceOk: governance.ok
  });

  const score = clamp01(
    governance.score * 0.3 +
      (replay.ok ? 0.2 : 0) +
      (smtAcceptable ? 0.15 : 0) +
      (convergence.converged ? 0.15 : convergence.confidence * 0.1) +
      (recoveryFixedPoint.fixedPointDetected ? 0.1 : 0) +
      policyFixpoint.score * 0.1
  );

  return Object.freeze({
    version: RHIZOH_SYSTEM_WIDE_COHERENCE_CLOSURE_ENGINE_VERSION,
    ok:
      governance.ok &&
      replay.ok &&
      smtAcceptable &&
      convergence.converged &&
      recoveryFixedPoint.fixedPointDetected &&
      policyFixpoint.fixedPoint,
    score,
    globalInvariantConvergence: convergence,
    recoveryCycleFixedPoint: recoveryFixedPoint,
    policyTemporalFixpoint: policyFixpoint,
    closureBinding,
    governance,
    replay,
    smt
  });
}

