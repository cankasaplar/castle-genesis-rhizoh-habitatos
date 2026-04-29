/**
 * RHIZOH Runtime Guarantee Layer — davranışsal tam garanti değil; yapısal ön koşul + bloklama yolu.
 * v0: pre-apply gate, replay anchor dilimi, fallback bilinci.
 */

import { verifyCpuDeterministicKernelSelfTest } from "./rhizohCpuDeterministicFallback.js";
import { markRhizohHardFirewallObserved } from "./rhizohClosureRegistry.js";

export const RHIZOH_GUARANTEE_LAYER_VERSION = "v0";

/** Garanti türü: closure/replay/fallback tam olana dek yalnızca şema ve izin politikası. */
export const RHIZOH_GUARANTEE_SEMANTICS = "structural_not_behavioral";

export const RHIZOH_GUARANTEE_TIER = Object.freeze({
  EXPERIMENTAL: "EXPERIMENTAL",
  STRICT_PREVIEW: "STRICT_PREVIEW",
  /** STRICT + replay zinciri + GPU/CPU konsensüs atölye; aksi halde execute=false. */
  PRODUCTION_BLOCKING: "PRODUCTION_BLOCKING"
});

const CONTRACT_ID_V1 = "rhizoh.frame_state.v1";

/**
 * apply / dispatch öncesi bariyer. EXPERIMENTAL: snapshot varlığına güvenir.
 * STRICT_PREVIEW: contract + hash + executionMode zorunlu (tam üretim öncesi dry-run).
 */
export function evaluateRhizohPreApplyGate(frameState, opts = {}) {
  const tier = opts.tier ?? RHIZOH_GUARANTEE_TIER.EXPERIMENTAL;
  const blockedReasons = [];

  if (!frameState) {
    return { execute: false, blockedReasons: ["missing_frame_state"], tier };
  }

  if (tier === RHIZOH_GUARANTEE_TIER.EXPERIMENTAL) {
    return {
      execute: true,
      blockedReasons: [],
      tier,
      mode: "allow_trust_snapshot_structural_only"
    };
  }

  if (frameState.contractId !== CONTRACT_ID_V1) blockedReasons.push("contract_id_mismatch");
  if ((frameState.schemaVersion ?? 0) < 1) blockedReasons.push("schema_version_below_v1");
  const hash = frameState.meta?.inputSnapshotHash;
  if (!hash || typeof hash !== "string") blockedReasons.push("input_snapshot_hash_missing");
  const em = frameState.executionMode;
  if (!em || typeof em.executionMode !== "string") blockedReasons.push("execution_mode_missing");

  if (tier === RHIZOH_GUARANTEE_TIER.PRODUCTION_BLOCKING) {
    const rs = frameState.meta?.replaySeal;
    if (!rs?.chainHash || typeof rs.chainHash !== "string") blockedReasons.push("replay_seal_chain_missing");
    const ca = frameState.meta?.closureAttestation;
    if (!ca?.gpuFinalizeV1Consensus) blockedReasons.push("gpu_cpu_closure_consensus_missing");
    const js = frameState.meta?.jointSeal;
    if (!js?.closureRoot || typeof js.closureRoot !== "string") blockedReasons.push("joint_seal_root_missing");
    const uc = frameState.meta?.unifiedClosureContract;
    if (!uc?.truthEquivalent) blockedReasons.push("unified_closure_contract_not_equivalent");
    markRhizohHardFirewallObserved(true);
  }

  return {
    execute: blockedReasons.length === 0,
    blockedReasons,
    tier
  };
}

/**
 * GPU yokken davranış: açıkça tanımsız güvenli mod yok — kritik yollar bağlanmamalı.
 */
export function getRhizohComputeFallbackStatus({ gpuAvailable = false, cpuKernelSelfTestOk = null } = {}) {
  const cpuOk = cpuKernelSelfTestOk != null ? !!cpuKernelSelfTestOk : verifyCpuDeterministicKernelSelfTest();
  if (gpuAvailable) {
    return Object.freeze({
      path: "GPU_SHADOW",
      cpuDeterministicKernelAvailable: !!cpuOk,
      undefinedBehaviorRiskIfMisused: "low_while_gpu_healthy",
      message: null,
      specRef: cpuOk ? "rhizohCpuDeterministicFallback" : null
    });
  }
  return Object.freeze({
    path: "UNAVAILABLE",
    cpuDeterministicKernelAvailable: !!cpuOk,
    undefinedBehaviorRiskIfMisused: cpuOk ? "medium_use_cpu_det_path" : "high_without_fallback_kernel",
    message: cpuOk
      ? "RHIZOH: GPU yok; minimal deterministik CPU çekirdeği self-test OK — sınırlı sim yolu kullanılabilir."
      : "RHIZOH: GPU kullanılamıyor; deterministic CPU-only minimal çekirdek doğrulanamadı — kritik kontrol bağlamayın.",
    specRef: "MinimalFallbackKernel"
  });
}

/** Replay Seal v1 için minimal serializable dilim (hash zinciri girdisi). */
export function sliceReplaySealAnchor(frameState) {
  if (!frameState) return null;
  return Object.freeze({
    contractId: frameState.contractId ?? null,
    schemaVersion: frameState.schemaVersion ?? null,
    inputSnapshotHash: frameState.meta?.inputSnapshotHash ?? null,
    executionTopology: frameState.executionTopology ?? null,
    decisionPath: frameState.meta?.decisionPath ?? null
  });
}
