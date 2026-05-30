/**
 * WebGPU köprüsü + RHIZOH compute fabric ile hizalı hazırlık.
 * Hedef: tamponlar GPU resident; CPU yalnızca dispatch (sık map/upload yok).
 *
 * Pass 4.5: `executionModeHint` çekirdek çıktısı — köprüden alındıktan sonra mutate edilmemeli
 * (Object.freeze + readonlyKernelOutput shadow path’te).
 */

import { getRhizohRoadmapManifest } from "./rhizohExecutionRoadmap.js";
import { getRuntimeCapabilityMap, getSabReadiness } from "./isolationSupport.js";
import { createRhizohGpuShadowPath } from "./rhizohGpuShadowPath.js";
import {
  getRhizohComputeFallbackStatus,
  RHIZOH_GUARANTEE_TIER
} from "./rhizohRuntimeGuarantees.js";
import { buildFormalClosureBridgePayload } from "./rhizohFormalClosureBridgeV1.js";

let _adapter = null;
let _device = null;
let _initPromise = null;

export function isSwarmGpuAvailable() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

export async function getSwarmGpuDevice() {
  if (_device) return _device;
  if (!isSwarmGpuAvailable()) return null;
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const win = /Windows/i.test(String(navigator.userAgent || ""));
        _adapter = await navigator.gpu.requestAdapter(win ? {} : { powerPreference: "high-performance" });
        if (!_adapter) {
          console.info(
            "[WEBGPU_ADAPTER] no gpu adapter (Chrome may log 'No available adapters' — unrelated to voice STT)"
          );
          return null;
        }
        _device = await _adapter.requestDevice();
        return _device;
      } catch {
        return null;
      }
    })();
  }
  return _initPromise;
}

/** Cihaz + yol haritası + Chronos’un okuyabileceği compute graph (shadow Pass 0–3). */
export async function warmSwarmGpu(options = {}) {
  const device = await getSwarmGpuDevice();
  let computeGraph = null;
  if (device) {
    try {
      computeGraph = createRhizohGpuShadowPath(device, {
        n: options.n ?? 4096,
        mortonBits: options.mortonBits ?? 10,
        invCell: options.invCell,
        origin: options.origin
      });
    } catch {
      computeGraph = null;
    }
  }
  return {
    device: device ? "ready" : "unavailable",
    computePath: device ? "GPU_SHADOW" : "UNAVAILABLE",
    computeFallback: getRhizohComputeFallbackStatus({ gpuAvailable: !!device }),
    guaranteeTierDefault: RHIZOH_GUARANTEE_TIER.EXPERIMENTAL,
    roadmap: getRhizohRoadmapManifest(),
    formalClosureBridge: buildFormalClosureBridgePayload(),
    sab: getSabReadiness(),
    capabilities: getRuntimeCapabilityMap(),
    computeGraph
  };
}

export {
  getRhizohRoadmapManifest,
  resolveNeighborPolicy,
  NEIGHBOR_POLICY,
  resolveSkewPartitionAction,
  resolveUnifiedExecutionMode,
  hashPass45InputSnapshot,
  combineRiskVector,
  assembleRhizohFrameState,
  getRhizohFrameIdentity,
  derivePass45ExecutionTopology,
  PASS_45_DECISION_PATH,
  PASS_45_EXECUTION_TOPOLOGY,
  DECISION_FEEDBACK_LOOP,
  RHIZOH_FRAME_STATE_SCHEMA,
  RHIZOH_SYSTEM_LAYERS,
  RHIZOH_RUNTIME_CLASSIFICATION,
  RHIZOH_RUNTIME_KERNEL_TIER,
  RHIZOH_VNEXT_529_RELEASE_SNAPSHOT,
  RHIZOH_FULL_CLOSURE_READINESS_PATH,
  evaluateRhizohFullClosureProductionReady,
  isRhizohProdReadyLive,
  REPLAY_SEAL_V1_SPEC,
  applyRhizohDecisionBuffer,
  PASS_45_GPU_DECISION_FEEDBACK_SPEC,
  PASS_45_GPU_DECISION_CLOSURE_SPEC,
  UNIFIED_EXECUTION_MODE,
  COMBINED_VALIDATION_REMEDIATION
} from "./rhizohExecutionRoadmap.js";
export { createExecutionModePersistence } from "./executionModePersistence.js";
export { createRhizohGpuShadowPath, ValidationErrorCode, VALIDATION_REMEDIATION_HINTS } from "./rhizohGpuShadowPath.js";
export { createNeighborPolicySmoother } from "./neighborPolicySmoother.js";
export { createQuarantineMemory } from "./quarantineMemory.js";
export {
  evaluateRhizohPreApplyGate,
  getRhizohComputeFallbackStatus,
  sliceReplaySealAnchor,
  RHIZOH_GUARANTEE_TIER,
  RHIZOH_GUARANTEE_LAYER_VERSION,
  RHIZOH_GUARANTEE_SEMANTICS
} from "./rhizohRuntimeGuarantees.js";
export {
  appendReplaySealFrame,
  createReplaySealGenesis,
  verifyReplaySealChainIntegrity
} from "./rhizohReplaySeal.js";
export {
  verifyCpuDeterministicKernelSelfTest,
  createCpuDeterministicSwarmState,
  cpuDeterministicSwarmStep,
  hashCpuDeterministicSwarmState
} from "./rhizohCpuDeterministicFallback.js";
export { createRhizohDriftStabilizer } from "./rhizohDriftStabilizer.js";
export {
  getRhizohLiveClosureFlags,
  resetRhizohClosureLiveFlags,
  markRhizohGpuClosureV1Live
} from "./rhizohClosureRegistry.js";
export {
  decodeGpuDecisionFinalizeV1,
  RHIZOH_GPU_DECISION_MAGIC_V1,
  expectedGpuDecisionFinalizeFromCellStats
} from "./rhizohGpuDecisionFinalize.js";
export {
  provePass45FinalizeCanonicalEquivalence,
  RHIZOH_CANONICAL_EQUIVALENCE_VERSION
} from "./rhizohCanonicalEquivalence.js";
export {
  appendJointSealFrame,
  createJointSealGenesis,
  verifyJointSealIntegrity,
  sealLayerFingerprintFromBytes,
  sealLayerFingerprintFromU32Quad
} from "./rhizohJointSealV2.js";
export { evaluateUnifiedClosureContractV1, UNIFIED_CLOSURE_CONTRACT_VERSION } from "./rhizohUnifiedClosureContract.js";
export {
  createRhizohHardEntryFirewall,
  withRhizohHardExecutionGate
} from "./rhizohHardEntryFirewall.js";
export {
  RHIZOH_FORMAL_CLOSURE_BRIDGE_VERSION,
  buildFormalClosureBridgePayload,
  getRhizohClosureClassification,
  getRhizohFieldTruthV529,
  getRhizohFormalFieldRealityFinal,
  getRhizohFormalClosureBridgeVersion
} from "./rhizohFormalClosureBridgeV1.js";
export {
  RHIZOH_EPISTEMIC_KERNEL_VERSION,
  buildEpistemicKernelSurface,
  buildEpistemicSmtIrV1,
  checkClosureTypePropagationConsistency,
  getTruthDriftPreventionHint,
  reconcileFormalVsSemanticClosure,
  getRhizohEpistemicKernelSpec
} from "./rhizohEpistemicKernelV1.js";
export {
  RHIZOH_CONTRACT_GRAPH_VERSION,
  buildFullClosureContractGraphSkeleton
} from "./rhizohFullClosureContractGraph.js";
export {
  RHIZOH_FORMALIZATION_LAYER_VERSION,
  buildFormalizationLayerSurface,
  getFormalizationLayerSpec
} from "./rhizohFormalizationLayerV1.js";
export {
  RHIZOH_CLOSURE_ENFORCEMENT_LAYER_VERSION,
  RHIZOH_ENFORCEMENT_GATE_KIND,
  evaluateRhizohClosureProofGate,
  buildClosureEnforcementLayerSurface,
  getClosureEnforcementLayerSpec
} from "./rhizohClosureEnforcementLayerV1.js";
export {
  RHIZOH_IDENTITY_COMPRESSION_VERSION,
  compressRhizohIdentityV1,
  buildIdentityCompressionLayerSurface,
  getIdentityCompressionLayerSpec
} from "./rhizohIdentityCompressionLayerV1.js";
export {
  RHIZOH_INEVITABLE_EVOLUTION_LINE_ID,
  buildInevitableEvolutionLinePack
} from "./rhizohEvolutionLineV529.js";
export {
  RHIZOH_SOLVER_EXTERNALIZATION_LAYER_VERSION,
  registerRhizohSmtSolverPlugin,
  clearRhizohSmtSolverPlugin,
  getRhizohSmtSolverPlugin,
  runRhizohSmtCheckViaPlugin,
  createRhizohProofVerifierAdapter,
  bridgeCanonicalEquivalenceToSolverLayer,
  buildSolverExternalizationLayerPayload,
  proposeExternalTruthCertificationV1,
  ingestExternalTruthCertResponseV1,
  createMockRhizohSmtSolverPlugin
} from "./rhizohSolverExternalizationLayerV1.js";
export {
  RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION,
  EXTERNAL_TRUTH_CERT_MESSAGE_KIND,
  encodeExternalTruthCertRequestV1,
  parseExternalTruthCertResponseV1,
  buildExternalTruthCertProtocolSurface
} from "./rhizohExternalTruthCertProtocolV1.js";
export {
  RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION,
  registerRhizohProofSolverNode,
  unregisterRhizohProofSolverNode,
  clearRhizohProofSolverNodes,
  listRhizohProofSolverNodes,
  getRhizohProofSolverNode,
  buildDefaultProofRoutingGraphV1,
  buildDefaultDelegationPolicyV1,
  buildDelegationPlanV1,
  mergeTrustWeightedSolverResultsV1,
  orchestrateRhizohMultiSolverCheckV1,
  computeTrustWeightedCertificationV1,
  buildExternalProofNetworkPayload,
  assertValidProofSolverNodeV1
} from "./rhizohExternalProofNetworkV1.js";
export {
  createRhizohAutonomousCompanyRuntimeV0,
  createRhizohAutonomySubstrateV0,
  createRhizohFounderConsoleStore,
  createRhizohStudioBridgeHooks,
  RHIZOH_COMPANY_AGENT_IDS,
  getDefaultRhizohCompanyAgentContractsV1,
  bootstrapRhizohCompanyContracts,
  RHIZOH_TASK_NODE_STATUS,
  RHIZOH_STATE_REDUCER_VERSION,
  reduceRhizohEventLogV1,
  RHIZOH_REPLAY_VERIFIER_VERSION,
  verifyRhizohReplayTraceV1,
  RHIZOH_AUDIT_EXPORT_VERSION,
  exportRhizohAuditBundleV1,
  RHIZOH_RECOVERY_STATE_MACHINE_VERSION,
  RHIZOH_RECOVERY_PHASE,
  RHIZOH_FREEZE_REASON_CLASS,
  classifyRecoveryReasonV1,
  createRecoveryStateMachineV1,
  RHIZOH_RECOVERY_POLICY_ENGINE_VERSION,
  createRhizohRecoveryPolicyEngineV1,
  RHIZOH_FORMAL_GOVERNANCE_SYSTEM_VERSION,
  RHIZOH_GOVERNANCE_INVARIANT,
  evaluateRhizohGovernanceInvariantsV1,
  proveRhizohDecisionConsistencyV1,
  validateRhizohPolicyWithSmtV1,
  evaluateFormalGovernanceSystemV1,
  RHIZOH_GLOBAL_GOVERNANCE_COHERENCE_ENGINE_VERSION,
  evaluateTemporalPolicyCoherenceV1,
  evaluateInvariantStabilityUnderRecoveryCyclesV1,
  resolveCrossAgentGovernanceConflictsV1,
  evaluateRhizohGlobalGovernanceCoherenceV1,
  RHIZOH_SYSTEM_WIDE_COHERENCE_CLOSURE_ENGINE_VERSION,
  attemptGlobalInvariantConvergenceProofV1,
  detectRecoveryCycleFixedPointV1,
  analyzePolicyTemporalFixpointV1,
  evaluateSystemWideCoherenceClosureV1,
  RHIZOH_GOVERNANCE_EXECUTION_SPLIT_VERSION,
  RHIZOH_GOVERNANCE_MODE,
  evaluateRhizohGovernanceOnlineModeV1,
  evaluateRhizohGovernanceOfflineModeV1,
  RHIZOH_GOVERNANCE_RECONCILIATION_LAYER_VERSION,
  RHIZOH_GOVERNANCE_CONFLICT_KIND,
  reconcileGovernanceDecisionsV1,
  RHIZOH_GOVERNANCE_STABILITY_CONSTRAINT_LAYER_VERSION,
  createRhizohGovernanceStabilityConstraintLayerV1
} from "./company/index.js";
