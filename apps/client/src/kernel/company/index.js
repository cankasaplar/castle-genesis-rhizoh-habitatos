import { createRhizohAutonomySubstrateV0 } from "./autonomySubstrateState.js";
import { bootstrapRhizohCompanyContracts } from "./agentContractsRuntime.js";
import { createRhizohFounderConsoleStore } from "./founderConsoleStore.js";
import { createRhizohStudioBridgeHooks } from "./studioBridgeHooks.js";

export function createRhizohAutonomousCompanyRuntimeV0() {
  const substrate = createRhizohAutonomySubstrateV0();
  const bootstrap = bootstrapRhizohCompanyContracts(substrate);
  return Object.freeze({
    version: "v0",
    substrate,
    bootstrap,
    founderConsole: createRhizohFounderConsoleStore(substrate),
    studioHooks: createRhizohStudioBridgeHooks(substrate)
  });
}

export { createRhizohAutonomySubstrateV0 } from "./autonomySubstrateState.js";
export { createRhizohFounderConsoleStore } from "./founderConsoleStore.js";
export { createRhizohStudioBridgeHooks } from "./studioBridgeHooks.js";
export {
  RHIZOH_COMPANY_AGENT_IDS,
  getDefaultRhizohCompanyAgentContractsV1,
  bootstrapRhizohCompanyContracts
} from "./agentContractsRuntime.js";
export { RHIZOH_TASK_NODE_STATUS } from "./taskDagExecutor.js";
export { RHIZOH_STATE_REDUCER_VERSION, reduceRhizohEventLogV1 } from "./rhizohStateReducerV1.js";
export { RHIZOH_REPLAY_VERIFIER_VERSION, verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";
export { RHIZOH_AUDIT_EXPORT_VERSION, exportRhizohAuditBundleV1 } from "./rhizohAuditExportV1.js";
export { RHIZOH_AUTONOMY_SUBSTRATE_VERSION } from "./autonomySubstrateState.js";
export {
  RHIZOH_RECOVERY_STATE_MACHINE_VERSION,
  RHIZOH_RECOVERY_PHASE,
  RHIZOH_FREEZE_REASON_CLASS,
  classifyRecoveryReasonV1,
  createRecoveryStateMachineV1
} from "./rhizohRecoveryStateMachineV1.js";
export { RHIZOH_RECOVERY_POLICY_ENGINE_VERSION, createRhizohRecoveryPolicyEngineV1 } from "./rhizohRecoveryPolicyEngineV1.js";
export {
  RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
  RHIZOH_GOVERNANCE_INVARIANT,
  evaluateRhizohGovernanceInvariantsV1,
  proveRhizohDecisionConsistencyV1,
  validateRhizohPolicyWithSmtV1,
  evaluateFormalGovernanceSystemV1
} from "./rhizohFormalGovernanceSystemV1.js";
export {
  RHIZOH_GLOBAL_GOVERNANCE_COHERENCE_ENGINE_VERSION,
  evaluateTemporalPolicyCoherenceV1,
  evaluateInvariantStabilityUnderRecoveryCyclesV1,
  resolveCrossAgentGovernanceConflictsV1,
  evaluateRhizohGlobalGovernanceCoherenceV1
} from "./rhizohGlobalGovernanceCoherenceEngineV1.js";
export {
  RHIZOH_SYSTEM_WIDE_COHERENCE_CLOSURE_ENGINE_VERSION,
  attemptGlobalInvariantConvergenceProofV1,
  detectRecoveryCycleFixedPointV1,
  analyzePolicyTemporalFixpointV1,
  evaluateSystemWideCoherenceClosureV1
} from "./rhizohSystemWideCoherenceClosureEngineV1.js";
export {
  RHIZOH_GOVERNANCE_EXECUTION_SPLIT_VERSION,
  RHIZOH_GOVERNANCE_MODE,
  evaluateRhizohGovernanceOnlineModeV1,
  evaluateRhizohGovernanceOfflineModeV1
} from "./rhizohGovernanceExecutionSplitV1.js";
export {
  RHIZOH_GOVERNANCE_RECONCILIATION_LAYER_VERSION,
  RHIZOH_GOVERNANCE_CONFLICT_KIND,
  reconcileGovernanceDecisionsV1
} from "./rhizohGovernanceReconciliationLayerV1.js";
export {
  RHIZOH_GOVERNANCE_STABILITY_CONSTRAINT_LAYER_VERSION,
  createRhizohGovernanceStabilityConstraintLayerV1
} from "./rhizohGovernanceStabilityConstraintLayerV1.js";

