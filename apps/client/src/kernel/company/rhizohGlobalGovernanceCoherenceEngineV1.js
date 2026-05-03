import { evaluateRhizohGovernanceInvariantsV1, validateRhizohPolicyWithSmtV1 } from "./rhizohFormalGovernanceSystemV1.js";
import { verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";

export const RHIZOH_GLOBAL_GOVERNANCE_COHERENCE_ENGINE_VERSION = "v1";

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

export function evaluateTemporalPolicyCoherenceV1(history = []) {
  if (!history.length) return Object.freeze({ ok: true, score: 1, driftPoints: [] });
  const driftPoints = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    if (prev.policyVersion && cur.policyVersion && prev.policyVersion !== cur.policyVersion && !cur.changeJustified) {
      driftPoints.push(Object.freeze({ index: i, kind: "unjustified_policy_version_change" }));
    }
    if (prev.requiresHumanApprovalReset === true && cur.requiresHumanApprovalReset === false && !cur.humanResetRecorded) {
      driftPoints.push(Object.freeze({ index: i, kind: "reset_without_human_record" }));
    }
  }
  const score = clamp01(1 - driftPoints.length * 0.18);
  return Object.freeze({
    ok: driftPoints.length === 0,
    score,
    driftPoints: Object.freeze(driftPoints)
  });
}

export function evaluateInvariantStabilityUnderRecoveryCyclesV1(cycles = []) {
  if (!cycles.length) return Object.freeze({ ok: true, score: 1, unstableCycles: [] });
  const unstableCycles = cycles
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.pre?.ok === false || c.post?.ok === false || c.post?.failed?.length > c.pre?.failed?.length)
    .map(({ c, i }) =>
      Object.freeze({
        cycleIndex: i,
        preFailed: c.pre?.failed?.length ?? 0,
        postFailed: c.post?.failed?.length ?? 0
      })
    );
  const score = clamp01(1 - unstableCycles.length * 0.2);
  return Object.freeze({
    ok: unstableCycles.length === 0,
    score,
    unstableCycles: Object.freeze(unstableCycles)
  });
}

export function resolveCrossAgentGovernanceConflictsV1(conflicts = []) {
  const unresolved = [];
  const resolutions = [];
  for (const c of conflicts) {
    if (!c?.agents?.length || c.agents.length < 2) continue;
    const winner = [...c.agents].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
    if (!winner) {
      unresolved.push(c);
      continue;
    }
    resolutions.push(
      Object.freeze({
        conflictId: c.conflictId ?? null,
        resolvedBy: winner.agentId ?? null,
        strategy: "priority_then_human_gate",
        requiresHumanApproval: c.riskTier === "high" || c.riskTier === "critical"
      })
    );
  }
  const score = clamp01(1 - unresolved.length * 0.25);
  return Object.freeze({
    ok: unresolved.length === 0,
    score,
    resolutions: Object.freeze(resolutions),
    unresolved: Object.freeze(unresolved)
  });
}

export async function evaluateRhizohGlobalGovernanceCoherenceV1(inputs = {}) {
  const replay = verifyRhizohReplayTraceV1(inputs.events ?? []);
  const invariants = evaluateRhizohGovernanceInvariantsV1({
    snapshot: inputs.snapshot ?? {},
    replayVerification: replay,
    taskProposalPolicy: inputs.taskProposalPolicy ?? {}
  });
  const temporal = evaluateTemporalPolicyCoherenceV1(inputs.policyHistory ?? []);
  const recoveryStability = evaluateInvariantStabilityUnderRecoveryCyclesV1(inputs.recoveryCycles ?? []);
  const conflicts = resolveCrossAgentGovernanceConflictsV1(inputs.agentConflicts ?? []);
  const smt = await validateRhizohPolicyWithSmtV1({
    governanceFacts: inputs.governanceFacts ?? {},
    bridgePayload: inputs.bridgePayload ?? {}
  });
  const smtAcceptable = smt.solver?.status === "sat" || smt.solver?.status === "unknown";
  const score = clamp01(
    (invariants.ok ? 0.25 : 0) +
      temporal.score * 0.2 +
      recoveryStability.score * 0.2 +
      conflicts.score * 0.15 +
      (replay.ok ? 0.1 : 0) +
      (smtAcceptable ? 0.1 : 0)
  );
  return Object.freeze({
    version: RHIZOH_GLOBAL_GOVERNANCE_COHERENCE_ENGINE_VERSION,
    ok: invariants.ok && temporal.ok && recoveryStability.ok && conflicts.ok && replay.ok && smtAcceptable,
    score,
    invariants,
    temporalCoherence: temporal,
    recoveryStability,
    crossAgentConflicts: conflicts,
    replay,
    smt
  });
}

