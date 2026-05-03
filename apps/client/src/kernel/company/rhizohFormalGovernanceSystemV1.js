import { buildEpistemicSmtIrV1 } from "../rhizohEpistemicKernelV1.js";
import { runRhizohSmtCheckViaPlugin } from "../rhizohSolverExternalizationLayerV1.js";

export const RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION = "v1";

export const RHIZOH_GOVERNANCE_INVARIANT = Object.freeze({
  HUMAN_RESET_REQUIRED_ON_DIVERGENCE: "human_reset_required_on_divergence",
  FROZEN_BLOCKS_NEW_TASKS: "frozen_blocks_new_tasks",
  SAFE_MODE_RESTRICTS_TASK_KINDS: "safe_mode_restricts_task_kinds",
  APPROVAL_REQUIRED_FOR_HIGH_RISK: "approval_required_for_high_risk"
});

function bool(ok, detail = null) {
  return Object.freeze({ ok: !!ok, detail });
}

export function evaluateRhizohGovernanceInvariantsV1(inputs) {
  const snap = inputs?.snapshot ?? {};
  const replay = inputs?.replayVerification ?? null;
  const policy = inputs?.taskProposalPolicy ?? {};

  const divergence = Number(replay?.divergenceCount ?? 0);
  const checks = Object.freeze({
    [RHIZOH_GOVERNANCE_INVARIANT.HUMAN_RESET_REQUIRED_ON_DIVERGENCE]: bool(
      divergence <= 0 || snap.requiresHumanApprovalReset === true,
      { divergenceCount: divergence, requiresHumanApprovalReset: !!snap.requiresHumanApprovalReset }
    ),
    [RHIZOH_GOVERNANCE_INVARIANT.FROZEN_BLOCKS_NEW_TASKS]: bool(
      !snap.agentSetFrozen || snap.killState?.active === true,
      { agentSetFrozen: !!snap.agentSetFrozen, killActive: !!snap.killState?.active }
    ),
    [RHIZOH_GOVERNANCE_INVARIANT.SAFE_MODE_RESTRICTS_TASK_KINDS]: bool(
      snap.recovery?.phase !== "SAFE_MODE" || policy.safeModeOnlyKindsValidated === true,
      { phase: snap.recovery?.phase ?? null, validated: !!policy.safeModeOnlyKindsValidated }
    ),
    [RHIZOH_GOVERNANCE_INVARIANT.APPROVAL_REQUIRED_FOR_HIGH_RISK]: bool(
      policy.highRiskRequiresApproval === true,
      { highRiskRequiresApproval: !!policy.highRiskRequiresApproval }
    )
  });

  const failed = Object.entries(checks)
    .filter(([, v]) => v.ok === false)
    .map(([k, v]) => Object.freeze({ invariant: k, detail: v.detail }));

  return Object.freeze({
    version: RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
    checks,
    ok: failed.length === 0,
    failed
  });
}

export function proveRhizohDecisionConsistencyV1(inputs) {
  const decision = inputs?.decision ?? {};
  const evidence = inputs?.evidence ?? {};

  const proof = Object.freeze({
    approvalConsistent:
      decision.requiresApproval !== true || decision.approvedByHuman === true || decision.status === "blocked",
    freezeConsistent: decision.agentSetFrozen !== true || decision.status === "blocked" || decision.status === "rejected",
    replayConsistent:
      evidence.replayVerification?.ok !== false ||
      (decision.agentSetFrozen === true && decision.requiresHumanApprovalReset === true)
  });

  const ok = proof.approvalConsistent && proof.freezeConsistent && proof.replayConsistent;
  return Object.freeze({
    version: RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
    ok,
    proof,
    decisionRef: Object.freeze({
      traceId: decision.traceId ?? null,
      taskId: decision.taskId ?? null
    })
  });
}

export async function validateRhizohPolicyWithSmtV1(inputs) {
  const governanceFacts = inputs?.governanceFacts ?? {};
  const bridgePayload = inputs?.bridgePayload ?? {};
  const smtIr = buildEpistemicSmtIrV1(
    Object.freeze({
      ...bridgePayload,
      governanceFacts
    })
  );
  const solver = await runRhizohSmtCheckViaPlugin(smtIr);
  return Object.freeze({
    version: RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
    smtIr,
    solver
  });
}

export async function evaluateFormalGovernanceSystemV1(inputs) {
  const invariants = evaluateRhizohGovernanceInvariantsV1(inputs);
  const consistency = proveRhizohDecisionConsistencyV1({
    decision: inputs?.decision ?? {},
    evidence: Object.freeze({ replayVerification: inputs?.replayVerification ?? null })
  });
  const smt = await validateRhizohPolicyWithSmtV1({
    governanceFacts: inputs?.governanceFacts ?? {},
    bridgePayload: inputs?.bridgePayload ?? {}
  });
  return Object.freeze({
    version: RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
    invariants,
    consistency,
    smt,
    ok: invariants.ok && consistency.ok && (smt.solver?.status === "sat" || smt.solver?.status === "unknown")
  });
}

