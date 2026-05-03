import { evaluateRhizohGovernanceInvariantsV1 } from "./rhizohFormalGovernanceSystemV1.js";
import { verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";
import { evaluateSystemWideCoherenceClosureV1 } from "./rhizohSystemWideCoherenceClosureEngineV1.js";

export const RHIZOH_GOVERNANCE_EXECUTION_SPLIT_VERSION = "v1";

export const RHIZOH_GOVERNANCE_MODE = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE"
});

/**
 * ONLINE MODE (kritik): freeze/kill/approval gating için hızlı değerlendirme.
 * Tasarım hedefi: düşük gecikme, SMT yok, fixpoint yok.
 */
export function evaluateRhizohGovernanceOnlineModeV1(inputs = {}) {
  const replay = verifyRhizohReplayTraceV1(inputs.events ?? []);
  const invariants = evaluateRhizohGovernanceInvariantsV1({
    snapshot: inputs.snapshot ?? {},
    replayVerification: replay,
    taskProposalPolicy: inputs.taskProposalPolicy ?? {}
  });

  const shouldFreeze = replay.ok === false || invariants.ok === false;
  const shouldKillSwitch = replay.divergenceCount > 0;
  const shouldApprovalGate = shouldFreeze || (inputs.taskProposalPolicy?.highRiskRequiresApproval === true && inputs.highRiskTask === true);

  return Object.freeze({
    version: RHIZOH_GOVERNANCE_EXECUTION_SPLIT_VERSION,
    mode: RHIZOH_GOVERNANCE_MODE.ONLINE,
    latencyBudgetMs: Object.freeze({ min: 5, max: 20 }),
    replay,
    invariants,
    decisions: Object.freeze({
      freeze: shouldFreeze,
      killSwitch: shouldKillSwitch,
      approvalGate: shouldApprovalGate
    }),
    ok: !shouldFreeze
  });
}

/**
 * OFFLINE MODE (derin analiz): SMT + fixpoint + global coherence.
 * Worker/batch/cron ile çalıştırılması hedeflenir.
 */
export async function evaluateRhizohGovernanceOfflineModeV1(inputs = {}) {
  const closure = await evaluateSystemWideCoherenceClosureV1(inputs);
  return Object.freeze({
    version: RHIZOH_GOVERNANCE_EXECUTION_SPLIT_VERSION,
    mode: RHIZOH_GOVERNANCE_MODE.OFFLINE,
    executionProfile: "async_worker_batch_or_cron",
    closure
  });
}

