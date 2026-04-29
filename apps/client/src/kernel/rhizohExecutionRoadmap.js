/**
 * RHIZOH yürütme yol haritası — öncelik: bellek bant genişliği + zamanlama.
 * Z3 / ağır SMT en sonda (Sovereign Verification); önce WGSL compute fabric.
 */

import {
  evaluateRhizohPreApplyGate,
  RHIZOH_GUARANTEE_TIER,
  RHIZOH_GUARANTEE_LAYER_VERSION,
  RHIZOH_GUARANTEE_SEMANTICS
} from "./rhizohRuntimeGuarantees.js";
import { getRhizohLiveClosureFlags } from "./rhizohClosureRegistry.js";
import { isValidGpuDecisionFinalizeV1, decodeGpuDecisionFinalizeV1 } from "./rhizohGpuDecisionFinalize.js";

/** Senin önerdiğin sıra (Phase 1–5). */
export const PRIORITY_PHASES = [
  { phase: 1, code: "WGSL_COMPUTE_FABRIC", focus: "GPU compute: Morton, sort, neighbor, integrate" },
  { phase: 2, code: "RENDER_SIM_DECOUPLE", focus: "Sim tick vs render frame; minimal CPU coupling" },
  { phase: 3, code: "SHARED_ARRAYBUFFER_KERNEL", focus: "Worker ECS heaps; single-writer; triple buffer" },
  { phase: 4, code: "CHRONOS_SCHEDULER", focus: "Deterministic dispatch ordering (not in hot path with SMT)" },
  { phase: 5, code: "SOVEREIGN_VERIFICATION", focus: "Z3 / formal cluster; async sidecar; blocking only high-risk" }
];

/** Uygulama dalgaları (A–E). */
export const RELEASE_WAVES = [
  { wave: "A", scope: "WGSL boids pipeline: Morton → Sort → Neighbor → Integrate" },
  { wave: "B", scope: "GPU instance build: vertex pulling; matrix buffer shader-read; no setMatrixAt flood" },
  { wave: "C", scope: "SAB worker ECS + Chronos kernel + COEP credentialless + feature detect" },
  { wave: "D", scope: "Hypergraph cognition + manager / diplomat / synthesist orchestration" },
  { wave: "E", scope: "Sovereign verifier tiers + robotics authorization + cloud formal cluster" }
];

/**
 * Yürütülebilir faz kapıları — Chronos / META kernel olgunluğu için sözleşme.
 * Değerler: tamamlandığında set edilen boolean bayrak adları (uygulama tarafında doldurulur).
 */
export const PHASE_GATES = {
  A: ["gpuMortonOk", "gpuSortOk", "gpuNeighborOk"],
  B: ["vertexPullingOk"],
  C: ["sabStable", "workerSyncStable"],
  D: ["hypergraphStable"],
  E: ["formalVerifyStable"]
};

/** Kapı olgunluk makinesi — manifest / Chronos semantiği. */
export const PHASE_GATE_MATURITY = /** @type {const} */ (["draft", "experimental", "stable", "production"]);

/** Örnek durum (uygulama gerçek bayrakları runtime günceller). */
export const PHASE_GATE_STATE_EXAMPLE = {
  gpuMortonOk: "stable",
  gpuSortOk: "experimental",
  gpuNeighborOk: "draft",
  vertexPullingOk: "draft",
  sabStable: "experimental",
  workerSyncStable: "draft",
  hypergraphStable: "draft",
  formalVerifyStable: "draft"
};

/**
 * Bitonic v1 sonrası: uniform ring-buffer veya storage param + dispatch index → tek submit’te çok adım;
 * submit storm ve CPU overhead düşer (rhizohGpuShadowPath ile uyumlu dispatchGraph korunur).
 */
export const BITONIC_DISPATCH_OPTIMIZATION = {
  v1: "per_step_submit_separate_uniform",
  v2_candidate: "uniform_ring_dynamic_offset_or_storage_param_buffer"
};

/**
 * RHIZOH compute fabric — pass sırası.
 * Tam GPU resident: spawn/pos/vel/cell/sort/neighbor/instance CPU’ya sürekli upload etmez; yalnız dispatch + seyrek senk.
 */
export const COMPUTE_PASS_STACK = [
  { pass: 0, id: "SpawnInit", role: "Initialize / recycle particles" },
  { pass: 1, id: "MortonEncode", role: "Cell key from position (GPU)" },
  { pass: 2, id: "Sort", role: "v1 Bitonic (debug); v2 OneSweep radix (prod)" },
  { pass: 3, id: "CellOffsets", role: "Build cell start indices from sorted keys" },
  { pass: 3.5, id: "CellBounds", role: "cellEnd + cellCount on GPU (atomicLoad unique count)" },
  {
    pass: 4,
    id: "NeighborIndexList",
    role: "Komşu indeks listesi (neighborStart, neighborCount, sampleIdx[K]); örnek: hash/blue-noise jitter — düz random değil"
  },
  {
    pass: 4.5,
    id: "NeighborStats",
    role: "Yerel özet: localDensity, localVelocityMean, localIntentMean, hazardMean (mean-field eşiği için)"
  },
  { pass: 5, id: "BoidIntegrate", role: "Cohesion / alignment / separation + field blend (incremental)" },
  { pass: 6, id: "BuildInstanceMatrices", role: "Instance transform buffer GPU yazımı" },
  { pass: 7, id: "IndirectDrawArgs", role: "Indirect draw arg tamponu; CPU yalnızca dispatch" }
];

/** Komşu örneklem politikası — physics mode selector; p95 eşikleri + yumuşatma (flicker önleme). */
export const NEIGHBOR_POLICY = {
  thresholdP95Local: 32,
  thresholdP95HybridMax: 128,
  modes: {
    local_neighbors: "local_neighbors",
    hybrid: "hybrid",
    mean_field_dominant: "mean_field_dominant"
  },
  smoothing: {
    emaAlpha: 0.22,
    hysteresisStableFrames: 8,
    cooldownFramesAfterSwitch: 12,
    /** Tam kilit (GPU geçiş maliyeti); ardından decay fazı. */
    cooldownHardFrames: 8,
    /** Decay fazında cooldownSoftScalar *= (1 - alpha). */
    unlockDecayAlpha: 0.32,
    note: "EMA(p95) + N kare stabil; switch sonrası hard lock + decay tail — titreme / thrash önleme"
  },
  description: "p95 < 32 → local; 32–128 → hybrid; >128 → mean-field dominant; Chronos’ta EMA + histerezis şart"
};

/** max/avg skew → partition invalidation sinyali (uyarı değil aksiyon katmanı). */
export const CELL_SKEW_PARTITION_SIGNAL = {
  tiers: [
    { maxRatio: 32, action: "local_neighbors", chronos: "none" },
    { maxRatio: 64, action: "hybrid_micro_repartition", chronos: "schedule_micro_partition" },
    { maxRatio: 128, action: "forced_repartition_morton_precision", chronos: "escalate_morton_precision" },
    { maxRatio: Infinity, action: "mean_field_dominant_cell_rebuild_deferred", chronos: "defer_cell_rebuild_mean_field" }
  ],
  /** Schmitt bantları — tier yükselt: enterWhenRgte, düşür: exitWhenRlt (ör. hybrid 40↔28). */
  hysteresis: {
    transitions: [
      { fromTier: 0, toTier: 1, enterWhenRgte: 40 },
      { fromTier: 1, toTier: 0, exitWhenRlt: 28 },
      { fromTier: 1, toTier: 2, enterWhenRgte: 72 },
      { fromTier: 2, toTier: 1, exitWhenRlt: 60 },
      { fromTier: 2, toTier: 3, enterWhenRgte: 132 },
      { fromTier: 3, toTier: 2, exitWhenRlt: 110 }
    ]
  },
  combinedWithCoverage: "full_spatial_rebuild_hard_reset",
  note: "Kontrol yüzeyi; anlık tier ile locked tier farklı olabilir (partitionSkewSmoother)"
};

export function resolveSkewPartitionAction(ratioMaxAvg) {
  const r = Number(ratioMaxAvg) || 0;
  for (const t of CELL_SKEW_PARTITION_SIGNAL.tiers) {
    if (r < t.maxRatio) return { ratioMaxAvg: r, ...t };
  }
  const last = CELL_SKEW_PARTITION_SIGNAL.tiers[CELL_SKEW_PARTITION_SIGNAL.tiers.length - 1];
  return { ratioMaxAvg: r, ...last };
}

export const COMBINED_VALIDATION_REMEDIATION = {
  CELL_SKEW_AND_CELL_COVERAGE: {
    codes: ["CELL_SKEW", "CELL_COVERAGE"],
    action: "full_spatial_rebuild_hard_reset",
    invalidate: ["neighbor_cache", "cell_table", "sort_stable_tag"]
  }
};

/**
 * @param {{ p50?: number, p95?: number, max?: number, skewMaxP50?: number, ratioMaxAvg?: number }} stats
 */
export function resolveNeighborPolicy(stats) {
  const p95 = stats?.p95 ?? 0;
  let mode = NEIGHBOR_POLICY.modes.mean_field_dominant;
  if (p95 < NEIGHBOR_POLICY.thresholdP95Local) mode = NEIGHBOR_POLICY.modes.local_neighbors;
  else if (p95 <= NEIGHBOR_POLICY.thresholdP95HybridMax) mode = NEIGHBOR_POLICY.modes.hybrid;
  return {
    mode,
    p50: stats?.p50 ?? 0,
    p95,
    max: stats?.max ?? 0,
    skewMaxP50: stats?.skewMaxP50 ?? 0,
    ratioMaxAvg: stats?.ratioMaxAvg ?? 0,
    thresholds: {
      localMax: NEIGHBOR_POLICY.thresholdP95Local,
      hybridMax: NEIGHBOR_POLICY.thresholdP95HybridMax
    }
  };
}

/** Pass 4 v0 — GPU çıktı sözleşmesi (K=16 örnek). */
export const NEIGHBOR_PASS_V0_SPEC = {
  outputs: ["neighborStart", "neighborCount", "sampleIdx16"],
  sampling:
    "deterministic_hash_jitter: idx = (hash(entityId, cellKey, seed, i) % uint(max(1,neighborCountInCell))) — cluster bias azaltır; blue-noise tablo ile genişletilebilir",
  temporalCoherence:
    "seed = hash(frameId, cellKey) ^ streamSalt — kareler arası tutarlı alt örnekleme; ghost motion önlemek için frame başına sabit türetilmiş jitter",
  hashContinuityGuard:
    "abs(seed(t)-seed(t-1)) > threshold ise fallback: önceki kare örnekleri veya deterministik ardışık indeks — ani sıçrama ghost artifact önler",
  note: "Sparse cell tablosu üzerinden pencere; boids Pass 5’te."
};

/** Pass 4.5 — birleşik karar (GPU veya Chronos tek çıktı). */
export const UNIFIED_EXECUTION_MODE = {
  LOCAL: "LOCAL",
  HYBRID: "HYBRID",
  MEAN_FIELD: "MEAN_FIELD",
  REBUILD: "REBUILD",
  QUARANTINE: "QUARANTINE"
};

/** Pass 4.5: anında güvenlik / doğrulama vs kalıcılık kapısı. */
export const PASS_45_DECISION_PATH = {
  FAST: "FAST",
  SLOW: "SLOW"
};

/**
 * FAST/SLOW = yalnız “scheduler hızı” değil — farklı execution graph topolojisi.
 * FAST: aynı kare içinde devam (single-pass DAG continuation).
 * SLOW: çok kareli stabilizasyon / persistence (temporal smoothing loop).
 */
export const PASS_45_EXECUTION_TOPOLOGY = {
  SINGLE_PASS_CONTINUATION: "SINGLE_PASS_CONTINUATION",
  MULTI_PASS_STABILIZATION: "MULTI_PASS_STABILIZATION",
  /** Topology değerleri → uzam/zaman anlamı (SLOW = performans değil, zaman boyutu genişlemesi). */
  semantics: Object.freeze({
    SINGLE_PASS_CONTINUATION: "spatial_compute_same_frame_dag",
    MULTI_PASS_STABILIZATION: "temporal_compute_multi_frame_convergence"
  })
};

export function derivePass45ExecutionTopology(decisionPath) {
  return decisionPath === PASS_45_DECISION_PATH.FAST
    ? PASS_45_EXECUTION_TOPOLOGY.SINGLE_PASS_CONTINUATION
    : PASS_45_EXECUTION_TOPOLOGY.MULTI_PASS_STABILIZATION;
}

/**
 * Açık sinir hattı: şu an karar CPU’da yorumlanır; hedef GPU = decision emitter.
 * TARGET_GPU_CLOSURE → JS brain stem kapanır, host yalnız schedule + frame assembly.
 */
export const DECISION_FEEDBACK_LOOP = {
  PARTIAL_JS_BRAIN: "partial_js_brain",
  TARGET_GPU_CLOSURE: "target_gpu_closure"
};

/**
 * Temporal truth contract — frame event değil kanıtlanabilir compute artifact.
 * schemaVersion + contractId = versioned reality; hash = immutable identity (replay / rollback / forensic).
 */
export const RHIZOH_FRAME_STATE_SCHEMA = {
  id: "RhizohFrameState",
  version: 1,
  contractId: "rhizoh.frame_state.v1",
  role: "truth_layer",
  contractKind: "temporal_truth",
  /** Frame = mutable snapshot değil; kanıt üretim birimi / invariant evidence object. */
  frameSemantics: "invariant_evidence_object",
  note: "Mutation yok; nedensellik frame snapshot üzerinden; her frame addressable artifact",
  evidenceFraming: "verifiable_computation_event — replay · rollback · forensic",
  feedbackTarget: "Pass 4.5 WGSL decision buffer → JS read + schedule only"
};

/** Kanonik vNext-529: GPU-assisted + deterministik karar grafiği (experimental kernel tier ayrı). */
export const RHIZOH_RUNTIME_CLASSIFICATION = "temporal_gpu_assisted_deterministic_decision_graph_runtime";

export const RHIZOH_RUNTIME_KERNEL_TIER = "experimental_kernel";

/**
 * Ontoloji — pipeline değil layered cognition graph.
 * Şu an: split brain (GPU compute · karar JS’te finalize); closure ile policy GPU’ya kayar.
 */
export const RHIZOH_SYSTEM_LAYERS = Object.freeze({
  L1_truthLayer: "RhizohFrameState · contractKind · hash identity · evidence object",
  L2_executionGraph: "PASS_45 topology · FAST/SLOW · spatial vs temporal compute semantics",
  L3_decisionLayer: "risk field · mode · spatialLock · feedback loop (partial JS brain)",
  L4_futureKernel: "GPU decision closure · emitter · apply-only host",
  truthLayer: "RhizohFrameState · schema v1 · hash anchor",
  executionGraph: "FAST/SLOW topology · pass45 execution tree",
  decisionSystem: "partial JS brain · risk vector · executionMode · spatialLock",
  futureKernelTarget: "GPU decision emission · decision buffer · topology override · frame rebuild"
});

export const PASS_45_UNIFIED_DECISION_SPEC = {
  id: "UnifiedSpatialDecision",
  modePersistenceFrames: 4,
  decisionPath: "FAST = QUARANTINE|REBUILD anında; SLOW = executionMode persistence gate",
  inputs: [
    "skewPartitionSignal (hysteresis locked)",
    "neighborPolicy (EMA + hysteresis + cooldown)",
    "occupancy.computeOccupancy",
    "quarantine.riskScore / memory trajectory",
    "riskVector [skewRisk, samplingRisk, occupancyRisk] + scalar combine",
    "density.absoluteDeviationEstimate (partition anchor)"
  ],
  output: "executionMode: LOCAL | HYBRID | MEAN_FIELD | REBUILD | QUARANTINE",
  priority: "QUARANTINE > REBUILD > MEAN_FIELD > HYBRID > LOCAL (özet; Chronos policy tablosu ile kesinleşir)",
  note: "RHIZOH: autonomous spatial OS — tek executionMode ile dispatch graph seçimi; kernel çıktısı downstream’de mutate edilmemeli",
  hashCanonicalization:
    "Sabit anahtar sırası + sabit quantize (hashPass45InputSnapshot); float’lar platformdan bağımsız int’e çevrilir"
};

/**
 * Milestone: Pass 4.5 GPU Decision Closure Kernel — WGSL karar üretimi; host yalnız apply + assembly.
 * Minimum üç çıktı sözleşmesi; JS tarafı: applyRhizohDecisionBuffer(frameState, decisionBuffer).
 */
export const PASS_45_GPU_DECISION_FEEDBACK_SPEC = {
  milestoneKernelId: "Pass45GpuDecisionClosureKernel",
  id: "Pass45GpuDecisionFeedback",
  status: "partial_v1_finalize_wgsl",
  splitBrainNote: "Şu an karar JS’te finalize; closure ile GPU = policy generator, CPU = glue",
  inputs: ["WGSL cell stats", "neighbor influence field", "risk field", "mode hint scratch"],
  gpuOutputs: Object.freeze({
    decisionBuffer: {
      role: "wgsl_compact_output",
      note: "execution quanta · lock bits · quantize mode — tek okuma paketi"
    },
    modeHintField: { role: "spatial", note: "hücre/tile execution mode hint alanı" },
    riskGradientField: { role: "temporal_influence", note: "kare komşuluğunda risk gradyanı / alan" }
  }),
  hostApplyContract: "applyRhizohDecisionBuffer(frameState, decisionBuffer)",
  hostRole: "map_read + apply buffer + dispatch submit — policy üretimi yok",
  closesLoop: DECISION_FEEDBACK_LOOP.TARGET_GPU_CLOSURE
};

/** Alias — roadmap / dokümantasyon adı. */
export const PASS_45_GPU_DECISION_CLOSURE_SPEC = PASS_45_GPU_DECISION_FEEDBACK_SPEC;

/** Tam deterministik replay mührü — GPU + host assembly fingerprint konsensüsü (planlı). */
export const REPLAY_SEAL_V1_SPEC = Object.freeze({
  id: "ReplaySealV1",
  status: "planned",
  guarantee: "frame_chain_gpu_cpu_hash_consensus",
  requires: Object.freeze([
    "sequential_frame_identity_chain",
    "gpu_dispatch_fingerprint",
    "js_assembly_fingerprint",
    "shared_canonical_quantize"
  ]),
  note: "Frame replay foundation var; mühür = GPU+JS birlikte doğrulama sözleşmesi"
});

/** L∞ — skaler eşik bağımlılığını azaltmak için vektör bileşenleri ayrı taşınır; birleşik skalar telemetri. */
export function combineRiskVector(riskVector = {}) {
  const a = Number(riskVector.skewRisk ?? 0);
  const b = Number(riskVector.samplingRisk ?? 0);
  const c = Number(riskVector.occupancyRisk ?? 0);
  return {
    skewRisk: Math.min(1, Math.max(0, a)),
    samplingRisk: Math.min(1, Math.max(0, b)),
    occupancyRisk: Math.min(1, Math.max(0, c)),
    linf: Math.min(1, Math.max(a, b, c)),
    l1mean: Math.min(1, (a + b + c) / 3)
  };
}

/**
 * Kanonik sıra + quantize: aynı anlamsal snapshot → aynı hash (replay / verifier).
 * riskVector yoksa softRiskProxy tek skaler olarak risk_skew slotuna yazılır (geriye uyum).
 */
export function hashPass45InputSnapshot(snapshot = {}) {
  const qMillis = (x) => Math.round(Math.max(0, Number(x) || 0) * 1000);
  const qCenti = (x) => Math.round(Math.max(0, Number(x) || 0) * 100);

  const rv = snapshot.riskVector && typeof snapshot.riskVector === "object" ? snapshot.riskVector : null;
  const fallbackScalar = Number(snapshot.softRiskProxy ?? 0);
  const skewR = qMillis(rv ? rv.skewRisk : fallbackScalar);
  const sampR = qMillis(rv ? rv.samplingRisk : fallbackScalar);
  const occR = qMillis(rv ? rv.occupancyRisk : fallbackScalar);

  const canonical = [
    ["v", 1],
    ["skewLockedTierIndex", String(Math.max(0, Math.floor(Number(snapshot.skewLockedTierIndex) || 0)))],
    ["needsRebuild", snapshot.needsRebuild ? "1" : "0"],
    ["quarantineRisk_milli", String(qMillis(snapshot.quarantineRisk))],
    ["risk_skew_milli", String(skewR)],
    ["risk_sampling_milli", String(sampR)],
    ["risk_occupancy_milli", String(occR)],
    ["ratioMaxAvg_centi", String(qCenti(snapshot.ratioMaxAvg))],
    ["absoluteDeviation_centi", String(qCenti(snapshot.absoluteDeviationEstimate))],
    ["neighborMode", String(snapshot.neighborMode ?? "")]
  ];

  let h = 2166136261;
  const mixStr = (s) => {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  };
  for (const [k, v] of canonical) {
    mixStr(k);
    mixStr("\t");
    mixStr(v);
    mixStr("\n");
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {{ skewLockedTierIndex?: number, neighborMode?: string, quarantineRisk?: number, softRiskProxy?: number, riskVector?: { skewRisk?: number, samplingRisk?: number, occupancyRisk?: number }, needsRebuild?: boolean }} snapshot
 */
export function resolveUnifiedExecutionMode(snapshot = {}) {
  const combined = combineRiskVector(snapshot.riskVector ?? {});
  const scalarFromVector = combined.linf;
  const legacyScalar = Number(snapshot.softRiskProxy ?? 0);
  const riskInfinity = Math.max(
    Number(snapshot.quarantineRisk ?? 0),
    scalarFromVector,
    legacyScalar
  );
  const risk = riskInfinity;

  if (risk >= 0.85) {
    return {
      executionMode: UNIFIED_EXECUTION_MODE.QUARANTINE,
      reason: "quarantine_risk",
      decisionPath: PASS_45_DECISION_PATH.FAST,
      riskVector: combined
    };
  }
  if (snapshot.needsRebuild) {
    return {
      executionMode: UNIFIED_EXECUTION_MODE.REBUILD,
      reason: "spatial_validation",
      decisionPath: PASS_45_DECISION_PATH.FAST,
      riskVector: combined
    };
  }
  const tier = snapshot.skewLockedTierIndex ?? 0;
  const nm = snapshot.neighborMode ?? "";
  if (tier >= 3 || nm === NEIGHBOR_POLICY.modes.mean_field_dominant) {
    return {
      executionMode: UNIFIED_EXECUTION_MODE.MEAN_FIELD,
      reason: "skew_tier_or_neighbor",
      decisionPath: PASS_45_DECISION_PATH.SLOW,
      riskVector: combined
    };
  }
  if (tier >= 1 || nm === NEIGHBOR_POLICY.modes.hybrid) {
    return {
      executionMode: UNIFIED_EXECUTION_MODE.HYBRID,
      reason: "skew_or_hybrid_policy",
      decisionPath: PASS_45_DECISION_PATH.SLOW,
      riskVector: combined
    };
  }
  return {
    executionMode: UNIFIED_EXECUTION_MODE.LOCAL,
    reason: "local_default",
    decisionPath: PASS_45_DECISION_PATH.SLOW,
    riskVector: combined
  };
}

/**
 * Tek canonical okuma yüzeyi — kararlar yalnızca bu çerçeveden türetilmeli (WGSL fusion hedefi).
 * GPU → panel → verifier: aynı snapshot; replay için frame identity = getRhizohFrameIdentity.
 */
export function assembleRhizohFrameState(parts = {}) {
  const decisionPath = parts.decisionPath ?? null;
  const executionTopology =
    parts.executionTopology ?? derivePass45ExecutionTopology(decisionPath);
  const decisionFeedbackLoop =
    parts.decisionFeedbackLoop ?? DECISION_FEEDBACK_LOOP.PARTIAL_JS_BRAIN;

  return Object.freeze({
    schemaVersion: RHIZOH_FRAME_STATE_SCHEMA.version,
    contractId: RHIZOH_FRAME_STATE_SCHEMA.contractId,
    contractKind: RHIZOH_FRAME_STATE_SCHEMA.contractKind,
    executionTopology,
    decisionFeedbackLoop,
    density: parts.density ?? null,
    occupancy: parts.occupancy ?? null,
    riskVector: parts.riskVector ?? null,
    softRiskProxy: parts.softRiskProxy ?? 0,
    skewSignal: parts.skewSignal ?? null,
    executionMode: parts.executionMode ?? null,
    neighborPolicy: parts.neighborPolicy ?? null,
    spatialLock: parts.spatialLock ?? null,
    meta: Object.freeze({
      inputSnapshotHash: parts.inputSnapshotHash ?? null,
      contractKind: RHIZOH_FRAME_STATE_SCHEMA.contractKind,
      decisionPath,
      executionTopology,
      decisionFeedbackLoop,
      meanFieldAdaptiveHint: parts.meanFieldAdaptiveHint ?? null,
      replaySeal: parts.replaySeal ?? null,
      jointSeal: parts.jointSeal ?? null,
      unifiedClosureContract: parts.unifiedClosureContract ?? null,
      proofWitness: parts.proofWitness ?? null,
      compressedIdentity: parts.compressedIdentity ?? null,
      closureAttestation: parts.closureAttestation ?? null
    })
  });
}

/**
 * Pass 4.5 kapanınca: GPU üretir, host yalnız uygular — merge/yorum yok.
 * Şimdilik stub: kernel bağlanınca buffer → sonraki assemble girdisi.
 *
 * @param {ReturnType<typeof assembleRhizohFrameState> | null | undefined} frameState
 * @param {object | null | undefined} decisionBuffer — WGSL compact çıktı (ileride modeHintField / riskGradientField ile birleşik paket)
 * @param {{ guaranteeTier?: string }} [opts] — STRICT_PREVIEW: pre-apply gate sıkı
 */
export function applyRhizohDecisionBuffer(frameState, decisionBuffer, opts = {}) {
  const tier = opts.guaranteeTier ?? RHIZOH_GUARANTEE_TIER.EXPERIMENTAL;
  const gate = evaluateRhizohPreApplyGate(frameState, { tier });
  if (!gate.execute) {
    return {
      ok: false,
      applied: false,
      reason: "pre_apply_gate_blocked",
      blockedReasons: gate.blockedReasons,
      frameState: frameState ?? null,
      gateTier: tier
    };
  }
  if (decisionBuffer == null || typeof decisionBuffer !== "object") {
    return {
      ok: true,
      applied: false,
      reason: "no_decision_buffer",
      frameState,
      specRef: PASS_45_GPU_DECISION_CLOSURE_SPEC.milestoneKernelId,
      gateTier: tier
    };
  }

  if (decisionBuffer.kind === "gpu_finalize_v1") {
    let decoded = null;
    if (decisionBuffer.bytes instanceof Uint8Array) decoded = decodeGpuDecisionFinalizeV1(decisionBuffer.bytes);
    else if (Array.isArray(decisionBuffer.words) || decisionBuffer.words instanceof Uint32Array) {
      const u = new Uint32Array(decisionBuffer.words);
      if (u.length >= 4) decoded = { magic: u[0], maxCellCount: u[1], uniqueCells: u[2], modeQuanta: u[3] };
    }
    if (decoded && isValidGpuDecisionFinalizeV1(decoded)) {
      return {
        ok: true,
        applied: true,
        reason: "gpu_closure_v1_applied",
        decoded,
        frameState,
        gateTier: tier
      };
    }
    return {
      ok: false,
      applied: false,
      reason: "gpu_closure_v1_invalid",
      frameState,
      gateTier: tier
    };
  }

  return {
    ok: true,
    applied: false,
    reason: "gpu_closure_kernel_unbound",
    frameState,
    specRef: PASS_45_GPU_DECISION_CLOSURE_SPEC.milestoneKernelId,
    gpuOutputsExpected: PASS_45_GPU_DECISION_CLOSURE_SPEC.gpuOutputs,
    gateTier: tier
  };
}

/** Canlı registry + tam kapanış dört bayrak — tek çağrı. */
export function isRhizohProdReadyLive() {
  return evaluateRhizohFullClosureProductionReady().productionReady;
}

/**
 * Frame DNA: persistence key, replay anchor, verifier girdisi — her kare addressable object.
 * @param {ReturnType<typeof assembleRhizohFrameState> | null | undefined} frameState
 */
export function getRhizohFrameIdentity(frameState) {
  if (!frameState) return null;
  const hash = frameState.meta?.inputSnapshotHash ?? null;
  const v = frameState.schemaVersion ?? RHIZOH_FRAME_STATE_SCHEMA.version;
  return Object.freeze({
    schemaVersion: v,
    contractId: frameState.contractId ?? RHIZOH_FRAME_STATE_SCHEMA.contractId,
    inputSnapshotHash: hash,
    persistenceKey: hash ? `rhizoh:${v}:${hash}` : null
  });
}

/** Pass 4 CPU doğrulama sözleşmesi (readback / debug). */
export const NEIGHBOR_CPU_VALIDATION_CONTRACT = {
  invariants: [
    { id: 1, code: "NEIGHBOR_COUNT_CAP", rule: "neighborCount <= 16 (K)" },
    { id: 2, code: "SAMPLE_IDX_BOUNDS", rule: "forall i: sampleIdx[i] < N" },
    {
      id: 3,
      code: "DUPLICATE_RATIO",
      rule: "unique(sampleIdx[0..count)) / max(1,count) > 0.6 — düşük tekrar"
    },
    { id: 4, code: "SELF_BIAS", rule: "self index ağırlığı abartılı değil (ör. count(self)/K < 0.35)" },
    { id: 5, code: "CELL_DOMINANCE", rule: "aynı kaynak hücreden gelen örnekler dominant küme oluşturmuyor" }
  ],
  note: "WGSL Pass 4 sonrası META validator ile bağlanır."
};

export const GPU_BUFFER_ROLES = [
  "SpawnBuffer",
  "PositionBuffer_pingpong",
  "VelocityBuffer_pingpong",
  "CellKeyBuffer",
  "SortBuffer",
  "CellOffsetBuffer",
  "NeighborBuffer",
  "InstanceMatrixBuffer"
];

export const SORT_PIPELINE = {
  v1: { algorithm: "bitonic", complexity: "O(n log² n)", note: "debug friendly, stable WGSL" },
  v2: { algorithm: "onesweep_radix", complexity: "~O(kn)", note: "production throughput" }
};

/**
 * Eksen başına 10 bit → tek u32 Morton güvenli.
 * 12/16+: native u64 tarayıcıya göre değişir; RHIZOH hedefi taşınabilir çift u32 (hi32, lo32), Morton96 / çok seviye (district, cell, microcell).
 */
export const ADAPTIVE_MORTON_PRECISION = {
  morton3d_10: { cellsPerAxis: 1024, storage: "u32" },
  morton3d_12: { cellsPerAxis: 4096, storage: "dual_u32_hi_lo" },
  morton3d_16: { cellsPerAxis: 65536, storage: "dual_u32_hi_lo" },
  morton96: {
    storage: "dual_u32_hi_lo",
    routingNote: "L8 CityMind · L12 verifier shard · L13 robotics ortak anahtar uzayı",
    hierarchical: {
      hi32: "district + macrocell (shard routing ile hizalı)",
      lo32: "microcell + flags",
      query: "seviye atlamalı; WGSL taşınabilir",
      lo32FlagBits: {
        hazard: "bit hazard",
        restricted: "bit restricted",
        verified: "bit verified",
        simulated: "bit simulated",
        note: "Örnek maske; sorgu maliyetsiz governance/spatial birleşik"
      },
      routingPriorityBits: {
        width: 8,
        layoutMsbToLsb: "[ priority(3) | hazard(1) | restricted(1) | verified(1) | simulated(1) | reserved(1) ]",
        note: "Tek lo32 altında routing + verifier + physics; çakışma önleme için öncelik üst bitlerde"
      }
    }
  }
};

/** Mean-field hibrit: yakın K örnek + uzak ρ,v,I,T alan örneği. */
export const MEAN_FIELD_HYBRID = {
  localNeighborSamples: 16,
  farFieldChannels: ["rho", "velocity", "intent", "threat"]
};

/** Üçlü tampon: front / mid / back snapshot; tek yazar çok okuyucu. */
export const TRIPLE_BUFFER_HEAPS = ["PhysicsHeap", "SwarmHeap", "CityHeap", "CognitionHeap", "RenderReadSnapshot"];

/**
 * %100 production readiness = tek özellik değil; dört çekirdeğin aynı anda sağlanması (mimari birleşim milestone’u).
 * Engine (compute + graph + runtime) ve governance (pre-apply, izin) bilinçli iki hat; gap = eksiklik değil split mimari.
 */
export const RHIZOH_FULL_CLOSURE_READINESS_PATH = Object.freeze({
  id: "RhizohFullClosureReadinessPath",
  version: 1,
  transparentStateMap: Object.freeze({
    compute: "strong",
    policyLayer: "strong",
    frameIntegrity: "strong",
    executionGating: "strong",
    gpuDecisionClosure: "absent",
    cpuDeterministicFallback: "absent",
    replaySealV1: "absent",
    temporalDriftKernel: "absent"
  }),
  /** READINESS === true iff hepsi aynı anda (formal AND). */
  fullClosurePredicateIds: Object.freeze([
    "GPU_DECISION_CLOSED",
    "CPU_DETERMINISTIC_FALLBACK_ACTIVE",
    "FRAME_REPLAY_SEAL_VALIDATED",
    "TEMPORAL_DRIFT_CONTROLLED"
  ]),
  fourCores: Object.freeze([
    {
      id: "GPU_DECISION_CLOSED",
      gap: "gpu_field_compute_only",
      target: "gpu_semantic_intent_finalize",
      wgslNeeds: Object.freeze(["aggregation", "normalization", "final_decision_vector"])
    },
    {
      id: "CPU_DETERMINISTIC_FALLBACK_ACTIVE",
      gap: "gpu_fail_implicit_fallback",
      target: "cpu_minimal_sim_same_input_same_output"
    },
    {
      id: "FRAME_REPLAY_SEAL_VALIDATED",
      gap: "frame_hash_without_chain_proof",
      target: "frame_chain_gpu_cpu_dual_hash_forensic_replay"
    },
    {
      id: "TEMPORAL_DRIFT_CONTROLLED",
      gap: "ema_smoothing_without_long_horizon_loop",
      target: "multi_frame_stability_correction_loop"
    }
  ]),
  formalProductReadyFormula: Object.freeze({
    expression:
      "gpuClosure && cpuFallbackDeterministic && replaySealVerified && driftKernelActive",
    note: "İnsan özeti: deterministik hibrit runtime OS çekirdeği — dört koşul birlikte."
  }),
  estimatedHolisticReadinessBand: Object.freeze({
    min: 0.65,
    max: 0.72,
    interpretation: "normalized_holistic_band_not_single_scalar"
  }),
  /** Tam kapanış olmadan ulaşılabilir üst band (teknik olarak gerçekçi). */
  realisticNearTermCeilingWithoutFullClosure: Object.freeze({ min: 0.85, max: 0.9 }),
  architectureDualTrack: Object.freeze({
    engineBuild: "compute_graph_runtime_kernel",
    governanceSystem: "pre_apply_gate_execution_permission",
    convergenceNote: "hundred_percent_readiness_is_architectural_fusion_not_single_ticket"
  }),
  /** Production-grade deterministic hybrid runtime hedefi — kapanışa giden kanon sıra. */
  phaseOrderToFullClosure: Object.freeze([
    { phase: 1, id: "GPU_DECISION_CLOSURE", priority: "P0", focus: "WGSL finalize pass · intent vector output" },
    { phase: 2, id: "CPU_FALLBACK_KERNEL", priority: "P1", focus: "deterministic minimal sim · GPU degrade" },
    { phase: 3, id: "REPLAY_SEAL_V1", priority: "P2", focus: "hash chain · GPU+CPU dual verification" },
    { phase: 4, id: "DRIFT_KERNEL", priority: "P3", focus: "long_horizon stability · frame chain correction" },
    { phase: 5, id: "HARD_ENFORCEMENT_GATE", priority: "P4", focus: "preApplyGate blocking firewall · not advisory" }
  ]),
  positioningSentence:
    "policy_aware_gpu_accelerated_temporal_decision_runtime_structured_guarantee_layer",
  incompleteClosureNote: "semantic_closure_deterministic_fallback_replay_proof_drift_engine_incomplete",
  hundredPercentIsMilestoneNotFeature: true
});

/**
 * Tam üretim kapanışı — yalnızca dört bayrak birden true iken.
 * @param {{ gpuClosure?: boolean, cpuFallbackDeterministic?: boolean, replaySealVerified?: boolean, driftKernelActive?: boolean }} flags
 */
export function evaluateRhizohFullClosureProductionReady(flags = {}) {
  const live = flags.fromLiveRegistry !== false ? getRhizohLiveClosureFlags() : {};
  const gpu = flags.gpuClosure !== undefined ? !!flags.gpuClosure : !!live.gpuClosure;
  const cpu =
    flags.cpuFallbackDeterministic !== undefined ? !!flags.cpuFallbackDeterministic : !!live.cpuFallbackDeterministic;
  const replay = flags.replaySealVerified !== undefined ? !!flags.replaySealVerified : !!live.replaySealVerified;
  const drift = flags.driftKernelActive !== undefined ? !!flags.driftKernelActive : !!live.driftKernelActive;
  const missing = [];
  if (!gpu) missing.push("GPU_DECISION_CLOSED");
  if (!cpu) missing.push("CPU_DETERMINISTIC_FALLBACK_ACTIVE");
  if (!replay) missing.push("FRAME_REPLAY_SEAL_VALIDATED");
  if (!drift) missing.push("TEMPORAL_DRIFT_CONTROLLED");
  return Object.freeze({
    productionReady: gpu && cpu && replay && drift,
    flags: Object.freeze({
      gpuClosure: gpu,
      cpuFallbackDeterministic: cpu,
      replaySealVerified: replay,
      driftKernelActive: drift
    }),
    missing: Object.freeze(missing)
  });
}

/**
 * vNext-529 — yayın olgunluğu özeti (beta/experimental tier).
 * HARD BLOCKER yok; GPU closure / tam replay / prod fallback sonraki milestone.
 */
export const RHIZOH_VNEXT_529_RELEASE_SNAPSHOT = Object.freeze({
  id: "vNext-529",
  snapshotNote: "temporal_truth · topology · decision bridge · apply contract · ontology — semi-closed loop",
  releaseMode: "EXPERIMENTAL_RELEASE",
  /** Production değil; prototype değil — kontrollü deneysel çalışma zamanı çekirdeği. */
  releasePosition: "EXPERIMENTAL_RUNTIME_KERNEL",
  runtimeClassification: RHIZOH_RUNTIME_CLASSIFICATION,
  architectureClaim: Object.freeze({
    is: RHIZOH_RUNTIME_CLASSIFICATION,
    isNot: Object.freeze(["production_autonomous_runtime", "fully_deterministic_closed_loop", "game_engine_ecs_only"]),
    gpuComputeLayer: true,
    gpuCognitionLayer: false
  }),
  workingModel: Object.freeze({
    gpu: "compute",
    js: "decision_merge_plus_apply",
    frame: "immutable_truth_artifact",
    topology: "temporal_graph_execution"
  }),
  /** CPU = orkestratör (zeka finalize GPU’da değil); GPU = compute engine; güvenlik = soft + shadow. */
  architectureRoles: Object.freeze({
    cpuOrchestrator: "decision_routing · frame_assembly · apply_contract · scheduling",
    gpuComputeEngine:
      "boids_cell_density_sort · pass45_v1_decision_finalize_compact · full_wgsl_semantic_closure_pending",
    frameArtifact: "immutable_temporal · invariant_evidence_object · replay_forensic_ready",
    systemShape: "temporal_decision_graph_runtime · not_dag_only",
    securityModel:
      "soft_quarantine · shadow_verifier · pre_apply_gate code_path (STRICT_PREVIEW) · prod hard barrier pending"
  }),
  technicalDesignation: `${RHIZOH_RUNTIME_CLASSIFICATION} (${RHIZOH_RUNTIME_KERNEL_TIER} + guarantee_layer ${RHIZOH_GUARANTEE_LAYER_VERSION})`,
  systemNickname: "self_aware_experimental_runtime_enforceable_pre_apply_policy",
  /** compute-only engine değil — izin/önkoşul bilinci olan çalışma zamanı. */
  runtimePositioning: Object.freeze({
    kind: "policy_aware_experimental_runtime_kernel",
    notMerely: Object.freeze(["uncontrolled_simulation_engine", "compute_only_engine"])
  }),
  /**
   * Sahadaki fiili gerçek — “experimental hybrid” değil; çok katmanlı kısmi deterministik kapanış.
   */
  fieldTruthV529: Object.freeze({
    actingSystemDefinition: Object.freeze({
      gpu: "compute_plus_partial_pass45_v1_decision_finalize_readback_cpu_validate",
      cpu: "deterministic_fallback_v1_frame_assembly_bridge",
      js: "orchestrator_policy_kernel_gating_apply_layer",
      stateModel: "immutable_frame_artifact_temporal_evidence_object"
    }),
    technicalRealityDesignation:
      "multi_layer_temporal_compute_graph_partial_deterministic_closure_guarantees",
    alternateDesignation: "hybrid_temporal_decision_runtime_emergent_partial_closure",
    rejectedNickname: "experimental_deterministic_hybrid_decision_runtime_full_closure_claim",
    coreLayers: Object.freeze([
      {
        id: "GPU_COMPUTE",
        label: "GPU compute + Pass45 v1 finalize",
        status: "partially_closed",
        readinessBand: Object.freeze({ min: 0.6, max: 0.7 }),
        gaps: Object.freeze(["full_semantic_closure", "wgsl_js_bitwise_determinism_parity_proof"])
      },
      {
        id: "CPU_DETERMINISTIC",
        label: "CPU deterministic fallback + shadow validation",
        status: "closed_candidate",
        readinessBand: Object.freeze({ min: 0.9, max: 0.95 }),
        gaps: Object.freeze([])
      },
      {
        id: "FRAME_TRUTH",
        label: "RHIZOH_FRAME_STATE_SCHEMA · identity · anchor",
        status: "mature",
        readiness: 1,
        gaps: Object.freeze([])
      },
      {
        id: "GOVERNANCE_RUNTIME",
        label: "STRICT/EXPERIMENTAL · pre-apply · permission paradigm",
        status: "partial",
        readiness: 0.75,
        gaps: Object.freeze(["hard_entry_firewall_kernel_level_absolute_block"])
      },
      {
        id: "REPLAY_DRIFT",
        label: "replaySeal v1 chain · drift EMA",
        status: "partial",
        readiness: 0.7,
        gaps: Object.freeze(["gpu_cpu_joint_seal_single_verifier_root", "cross_layer_hash_consensus"])
      }
    ]),
    prodClosureGapAnalysis: Object.freeze([
      {
        id: "GAP_GPU_CANONICAL_EQUIVALENCE",
        severity: "critical",
        have: "gpu_finalize_v1_cpu_expected_match_runtime",
        missing: "bitwise_cross_platform_wgsl_tint_proof_certified_compiler",
        implementationRef: "rhizohCanonicalEquivalence.js"
      },
      {
        id: "GAP_JOINT_REPLAY_SEAL",
        severity: "critical",
        have: "cpu_anchor_chain_gpu_fingerprint_slot",
        missing: "audited_crypto_hash_engine_single_root_optional_upgrade",
        implementationRef: "rhizohJointSealV2.js"
      },
      {
        id: "GAP_HARD_ENTRY_FIREWALL",
        severity: "critical",
        have: "pre_apply_gate_strict_production_blocking_tier",
        missing: "host_must_route_all_mutations_through_permit_choke_point",
        implementationRef: "rhizohHardEntryFirewall.js"
      },
      {
        id: "GAP_UNIFIED_DETERMINISTIC_CONTRACT",
        severity: "critical",
        have: "layered_validation_gpu_cpu_js_separate",
        missing: "formal_verified_f_equivalence_external_proof_assistant",
        implementationRef: "rhizohUnifiedClosureContract.js"
      }
    ]),
    /** GAP paketi sonrası — ne iddia edildiği / sınır nedir (makine-okur). */
    gapClosureRealityCheckV529: Object.freeze({
      version: "v1",
      gap1_canonicalEquivalence: Object.freeze({
        status: "conditional_proof_layer",
        have: Object.freeze([
          "gpu_readback_vs_cpu_canonical_compare",
          "witness_generation",
          "closure_attestation_write"
        ]),
        strength: "structured_equivalence_proof_shared_semantics_not_formal_verification",
        limit: "no_bitwise_hardware_level_determinism_wgsl_execution_variance_external",
        conclusion: "proof_of_agreement_under_shared_semantics_not_mathematical_proof"
      }),
      gap2_jointSeal: Object.freeze({
        status: "composite_integrity_root",
        have: Object.freeze(["gpu_seal_cpu_seal_frame_seal_to_closureRoot"]),
        strength: "single_truth_artifact_internal_consistency_root",
        limit: "no_cryptographic_immutability_adversary_model",
        conclusion: "internal_consistency_root_yes_external_tamper_proof_seal_no"
      }),
      gap3_hardEntryFirewall: Object.freeze({
        status: "enforcement_gate_v1",
        have: Object.freeze(["permitToken", "runIfPermitted", "PRODUCTION_BLOCKING_dependency_chain"]),
        strength: "execution_choke_point_architecture",
        limit: "logical_js_layer_not_os_runtime_kernel_boundary",
        conclusion: "logical_firewall_yes_system_level_firewall_no"
      }),
      gap4_unifiedClosureContract: Object.freeze({
        status: "semantic_closure_contract",
        have: Object.freeze(["canonicalProof_plus_jointSeal_plus_frameHash_to_truthEquivalent"]),
        strength: "closure_algebra_semantic_level",
        limit: "no_smt_coq_z3_formal_proof_system",
        conclusion: "semantic_equivalence_yes_formal_equivalence_no"
      })
    }),
    closureClassTruth: Object.freeze({
      notClosureSimulatingRuntime: true,
      isClosureEnforcingRuntimeSkeleton: true,
      notMathematicalClosureSystem: true
    }),
    criticalDivergence: Object.freeze({
      nowPresent: Object.freeze([
        "closure_root",
        "joint_seal",
        "canonical_witness",
        "execution_gate",
        "deterministic_cpu_fallback"
      ]),
      stillAbsent: Object.freeze([
        "formal_equivalence_proof_system",
        "hardware_level_determinism_binding",
        "global_seal_immutability_guarantee"
      ])
    }),
    /** SMT / teorem / closure-kanıt sınırı — net “yapıyor / yapmıyor” (self-honesty). */
    criticalSolverAndProofRealityV529: Object.freeze({
      systemDoesProduce: Object.freeze([
        "execution_graph",
        "truth_artifact",
        "identity_fingerprint",
        "proof_witness_placeholder_carrier"
      ]),
      systemDoesNot: Object.freeze([
        "real_smt_solving_attached_solver",
        "formal_proof_emission_certificate",
        "closure_mathematical_verification"
      ]),
      closureHandling: "gating_and_witness_slots_only_not_verification",
      gateSemantics: "structural_permission_barrier_not_mathematical_verifier",
      honestyInvariant: "no_attached_solver_no_emitted_theorem"
    }),
    canonicalArchitectSentenceV529:
      "RHIZOH v529 is now a semantically closed execution system with probabilistic determinism guarantees and enforced pre-apply gating",
    productionLikeCorrectness: Object.freeze({
      engineeringClosureSystemBand: Object.freeze({ min: 0.8, max: 0.9 }),
      mathematicalDeterminismTarget: 1,
      note: "eighty_percent_production_like_correctness_engineering_not_hundred_percent_math_system"
    }),
    /** GAP çözüm paketi sonrası saha yüzdeleri (panel değil mimari öz-değerlendirme). */
    readinessHonestField: Object.freeze({
      frameTruth: 1,
      cpuDeterminism: 0.95,
      gpuCompute: 0.7,
      replaySeal: 0.8,
      jointSeal: Object.freeze({ min: 0.8, max: 0.85 }),
      firewallEnforcement: 0.75,
      formalClosure: 0.4
    }),
    closureTurnPriority: Object.freeze([
      "gpu_cpu_canonical_equivalence_lock_same_input_same_output_proof",
      "unified_seal_gpu_hash_cpu_hash_frame_hash_single_closure_root",
      "hard_entry_firewall_validate_permit_run_no_execute_short_circuit"
    ]),
    nextForkOptions: Object.freeze([
      {
        fork: "A",
        id: "GPU_CPU_CANONICAL_CLOSURE_PROOF",
        note: "prod_determinism_starts_here"
      },
      {
        fork: "B",
        id: "HARD_FIREWALL_KERNEL_ENFORCEMENT",
        note: "security_grade_runtime_entry"
      },
      {
        fork: "C",
        id: "UNIFIED_REPLAY_SEAL_V2",
        note: "forensic_grade_simulation_log"
      }
    ]),
    /** Closure-grade deterministic runtime için doğal evrim (formal / sınır / kripto). */
    nextNaturalEvolutionFork: Object.freeze([
      {
        step: 1,
        id: "FORMAL_EQUIVALENCE_LAYER",
        focus: "SMT_symbolic_GPU_CPU_isomorphism_proof"
      },
      {
        step: 2,
        id: "KERNEL_LEVEL_ENFORCEMENT_BOUNDARY",
        focus: "JS_orchestrator_only_not_sole_control_plane"
      },
      {
        step: 3,
        id: "CRYPTOGRAPHIC_CLOSURE_ROOT",
        focus: "jointSeal_immutable_root_of_truth_adversary_model"
      }
    ]),
    /** Final field reality — teknik dürüstlük / ont sınıfı / köprü girdisi. */
    formalFieldRealityFinalV529: Object.freeze({
      designation: Object.freeze({
        enReadable:
          "closure-capable but non-formally-closed distributed deterministic runtime",
        trSummary:
          "kapanış_üretebilir_matematiksel_kanıt_yok_bunu_açıkça_kabul_system_honesty"
      }),
      truthAxiom: Object.freeze({
        tr: "Sistem closure üretir, closure garanti etmez.",
        en: "The system produces closure; it does not guarantee closure."
      }),
      illusionToClassification: Object.freeze({
        note: "gaps_are_types_of_closure_not_missing_features",
        architecture: "classification_driven_not_bug_driven",
        closureTypes: Object.freeze([
          "conditional_proof",
          "composite_integrity",
          "enforcement_skeleton",
          "semantic_contract"
        ])
      }),
      architectLines: Object.freeze({
        selfAwarePartialClosure:
          "RHIZOH v529 is now a self-aware partial closure runtime that enforces structural determinism without claiming formal determinism",
        approximationEnglish:
          "We are not building a deterministic system; we are building a deterministic approximation runtime with enforced consistency constraints"
      }),
      determinismHonestStance: Object.freeze({
        notFullyDeterministic: true,
        notRandom: true,
        selfDescribedRealityAware: true
      }),
      runtimeKind: Object.freeze({
        engine: false,
        simulator: false,
        closureSystem: false,
        hybridRuntime: true,
        /** “Hibrit truth runtime” — yalnızca compute değil, truth + epistemik öz-tanım. */
        hybridTruthRuntime: true,
        modelsOwnLimitsInRuntime: true
      }),
      /** Compute / Truth / Epistemik — runtime’un üç bileşeni. */
      tripleSystem: Object.freeze({
        A_compute: Object.freeze({
          label: "Compute_System",
          parts: Object.freeze(["gpu_compute_graph", "cpu_deterministic_fallback", "js_orchestration"])
        }),
        B_truth: Object.freeze({
          label: "Truth_System",
          parts: Object.freeze(["fieldTruthV529", "gapClosureRealityCheckV529", "formalFieldRealityFinalV529"])
        }),
        C_epistemic: Object.freeze({
          label: "Epistemic_System",
          parts: Object.freeze([
            "closure_classification",
            "honesty_axioms",
            "illusion_to_classification_mapping",
            "runtime_self_description_layer"
          ])
        })
      }),
      bridgeEpistemology: Object.freeze({
        role: "runtime_epistemology_layer_not_mere_module",
        does: Object.freeze([
          "states_what_system_does",
          "states_what_system_is_not",
          "states_ontological_class",
          "states_which_closure_types_are_produced"
        ]),
        selfDescribingRuntimeSystem: true,
        maps: Object.freeze({
          compute_vs_truth: "distinct",
          truth_vs_closure: "distinct",
          closure_vs_guarantee: "distinct",
          bridge: "field_truth_gap_reality_closure_classification_map"
        })
      }),
      truthAxiomInvariant: Object.freeze({
        role: "runtime_invariant_not_only_documentation",
        note: "mathematical_boundary_of_advertised_behavior"
      }),
      illusionToClassificationArchitecture: Object.freeze({
        from: "bug_driven_gap_as_missing_feature",
        to: "classification_driven_runtime_architecture",
        implication: "no_error_only_closure_level_grades"
      }),
      systemOneLiner: Object.freeze({
        en: "RHIZOH is a self-describing, partially deterministic closure-classified runtime system"
      }),
      honestEngineeringVerdict: Object.freeze({
        productionEngine: false,
        researchSimulator: false,
        formalClosureSystem: false,
        whatItIs:
          "first_hybrid_compute_architecture_that_emits_own_truth_class_inside_runtime"
      }),
      nextEvolutionForkSemantics: Object.freeze([
        { step: 1, id: "FORMAL_EQUIVALENCE", meaning: "correctness_proof_layer_not_feature" },
        { step: 2, id: "KERNEL_BOUNDARY", meaning: "runtime_isolation_execution_authority_separation" },
        { step: 3, id: "CRYPTO_ROOT", meaning: "absolute_integrity_anchor_adversary_model" }
      ])
    }),
    /** Gerçek durum raporu — üretim snapshot özeti (kod + epistemik durum). */
    finalSnapshotReportV529: Object.freeze({
      runtimeKindHybridTruth: Object.freeze({
        label: "hybridTruthRuntime",
        meaning: Object.freeze([
          "may_behave_deterministically_without_determinism_guarantee_at_modeling_layer",
          "truth_production_without_truth_guarantee",
          "closure_is_classification_not_only_outcome"
        ])
      }),
      tripleSystemStatus: Object.freeze({
        A_compute: Object.freeze({
          status: "functional_stable",
          have: Object.freeze([
            "gpu_shadow_path",
            "wgsl_pass_pipeline",
            "boids_cell_finalize",
            "cpu_det_fallback_sim"
          ])
        }),
        B_truth: Object.freeze({
          status: "semi_formal_strong_observation",
          have: Object.freeze([
            "RHIZOH_FRAME_STATE_SCHEMA",
            "fieldTruthV529",
            "execution_topology_fast_slow",
            "replay_seal_drift_telemetry"
          ])
        }),
        C_epistemic: Object.freeze({
          status: "skeletal_but_structured",
          have: Object.freeze([
            "formalClosureBridgeV1",
            "epistemicKernelV1",
            "classification_driven_architecture",
            "truthAxiomInvariant",
            "bridgeEpistemology"
          ])
        })
      }),
      gapOntology: Object.freeze({
        note: "gap_is_closure_type_difference_not_missing_code",
        mapping: Object.freeze([
          { absence: "gpu_closure_full", closureType: "execution_gap" },
          { absence: "replay_seal_complete", closureType: "temporal_identity_gap" },
          { absence: "cpu_fallback_total", closureType: "determinism_gap" },
          { absence: "formal_closure", closureType: "epistemic_gap" }
        ]),
        implication: "incomplete_reality_model_not_broken_system"
      }),
      readinessEngineeringFieldFinal: Object.freeze({
        computeGpuCpu: Object.freeze({ min: 0.85, max: 0.9 }),
        frameTruthSystem: 0.85,
        executionTopology: Object.freeze({ min: 0.8, max: 0.85 }),
        replayIdentity: Object.freeze({ min: 0.75, max: 0.8 }),
        jointSeal: 0.8,
        firewallGating: 0.75,
        epistemicKernel: Object.freeze({ min: 0.5, max: 0.6 }),
        formalClosure: Object.freeze({ min: 0.35, max: 0.45 })
      }),
      maturityDivergence: Object.freeze({
        engineReadinessNearProduction: true,
        closureCorrectnessFarFromProduction: true,
        has: Object.freeze(["render_sim", "decision_pipeline", "telemetry", "frame_consistency"]),
        lacks: Object.freeze([
          "mathematical_closure",
          "global_determinism_guarantee",
          "epistemic_closure_proof"
        ])
      }),
      architectureEvolution: Object.freeze({
        bugDrivenArchitecture: false,
        simulationDrivenRuntime: "transitional_layer",
        classificationDrivenEpistemicRuntime: true,
        primaryModel: "classification_driven_epistemic_runtime"
      }),
      nextPhaseMandatoryEvolution: Object.freeze([
        {
          id: "FORMAL_CLOSURE_LAYER",
          focus: "SMT_proof_equivalence",
          includes: Object.freeze([
            "gpu_cpu_equivalence_proof",
            "frame_invariance_proof",
            "closure_identity_stabilization"
          ])
        },
        {
          id: "HARD_RUNTIME_BOUNDARY_LAYER",
          focus: "execution_firewall_physical_separation",
          includes: Object.freeze(["permit_not_execute_distinction_materializes"])
        },
        {
          id: "DRIFT_KERNEL_CONTINUOUS",
          focus: "temporal_stabilization_feedback_physics_not_model_only",
          includes: Object.freeze(["self_error_correction_loop_closed"])
        }
      ]),
      finalSystemDefinitionSentence:
        "RHIZOH_VNEXT_529 is a hybrid GPU-assisted, partially deterministic, classification-driven temporal decision graph runtime that produces structured truth artifacts without guaranteeing formal closure.",
      truthComputationOntologyVerdict:
        "truth_computation_ontology_class_distinct_from_game_engine_ecs_or_ai_stack"
    }),
    netOutcome: Object.freeze({
      provenArchitecture: true,
      hundredPercentProdDeterministicRuntime: false,
      firstStabilizedCoreTowardProduction: true,
      gapResolutionCodePackV529Shipped: true,
      realityCheckDocument: "gapClosureRealityCheckV529",
      formalClosureBridge: "rhizohFormalClosureBridgeV1",
      epistemicKernelV1: "rhizohEpistemicKernelV1",
      fullClosureContractGraphV0: "rhizohFullClosureContractGraph",
      inevitableEvolutionLineV529: "rhizohEvolutionLineV529",
      solverExternalizationLayerV1: "rhizohSolverExternalizationLayerV1",
      externalProofNetworkV1: "rhizohExternalProofNetworkV1"
    })
  }),
  prodReady: false,
  /** Tüm dört canlı bayrak true ise `isRhizohProdReadyLive()` true; statik snapshot prod iddiası yapmaz. */
  prodReadyLiveQuery: "isRhizohProdReadyLive",
  closureCodePackV1: Object.freeze({
    gpuFinalizeWgsl: "rhizohPass45DecisionFinalize.wgsl",
    cpuDeterministicFallback: "rhizohCpuDeterministicFallback.js",
    replaySealChain: "rhizohReplaySeal.js",
    driftStabilizer: "rhizohDriftStabilizer.js",
    guaranteeTierProductionBlocking: "PRODUCTION_BLOCKING"
  }),
  closureGapResolutionPackV529: Object.freeze({
    canonicalEquivalence: "rhizohCanonicalEquivalence.js",
    jointSealV2: "rhizohJointSealV2.js",
    hardEntryFirewall: "rhizohHardEntryFirewall.js",
    unifiedClosureContract: "rhizohUnifiedClosureContract.js"
  }),
  formalClosureBridgeV1: Object.freeze({
    module: "rhizohFormalClosureBridgeV1.js",
    version: "v1",
    payloadBuilder: "buildFormalClosureBridgePayload",
    classification: "getRhizohClosureClassification",
    epistemologyLayer: true
  }),
  epistemicKernelV1: Object.freeze({
    module: "rhizohEpistemicKernelV1.js",
    version: "v1",
    status: "skeleton",
    builder: "buildEpistemicKernelSurface",
    smtIr: "buildEpistemicSmtIrV1"
  }),
  fullClosureContractGraphV0: Object.freeze({
    module: "rhizohFullClosureContractGraph.js",
    version: "v0_graph_skeleton",
    builder: "buildFullClosureContractGraphSkeleton"
  }),
  inevitableEvolutionLineV529: Object.freeze({
    module: "rhizohEvolutionLineV529.js",
    builder: "buildInevitableEvolutionLinePack",
    layers: Object.freeze({
      A: "rhizohFormalizationLayerV1",
      B: "rhizohClosureEnforcementLayerV1",
      C: "rhizohIdentityCompressionLayerV1"
    })
  }),
  solverExternalizationLayerV1: Object.freeze({
    module: "rhizohSolverExternalizationLayerV1.js",
    protocol: "rhizohExternalTruthCertProtocolV1.js",
    version: "v1",
    payloadBuilder: "buildSolverExternalizationLayerPayload",
    registerPlugin: "registerRhizohSmtSolverPlugin"
  }),
  /** Tam kapanış tanımı, dört çekirdek, bant tahmini ve faz sırası — tek makine-okur kaynak. */
  fullClosureReadinessPath: RHIZOH_FULL_CLOSURE_READINESS_PATH,
  guaranteeLayer: Object.freeze({
    version: RHIZOH_GUARANTEE_LAYER_VERSION,
    semantics: RHIZOH_GUARANTEE_SEMANTICS,
    modes: Object.freeze({
      EXPERIMENTAL: "runs_minimal_gate_soft_fallback_default",
      STRICT_PREVIEW: "schema_contract_hash_executionMode_required_may_block",
      PRODUCTION_BLOCKING: "strict_plus_replay_chain_plus_gpu_cpu_consensus_attestation"
    }),
    preApplyEntrypoint: "evaluateRhizohPreApplyGate",
    replaySealStatus: "v1_cpu_chain_gpu_fingerprint_partial_joint_root_pending",
    fallbackAwareness: "cpu_det_kernel_v1_self_test_shipped_gpu_degrade_path"
  }),
  runtimeThreeLayers: Object.freeze({
    L1_compute: "GPU boids · cell · density · spatial sim",
    L2_decision: "JS executionMode · topology · apply orchestration",
    L3_guarantee: "preApplyGate · replay seal skeleton · fallback status · STRICT_PREVIEW"
  }),
  guaranteeSummary: Object.freeze({
    works: true,
    underFormalGuarantee: false,
    guaranteeKind: "structural_policy_not_behavioral_seal",
    gap: "semantic_closure_full_replay_deterministic_fallback_drift_kernel",
    /** v0 kırılma: execute etmeden önce izin ölçümü (tam prod barrier değil). */
    engineeringVerdict:
      "execution_jurisprudence_layer_on_sim_engine_structural_pre_apply_not_behavioral_seal"
  }),
  executionPermissionParadigm: Object.freeze({
    prior: "run_if_it_runs",
    /** İnsan özeti: validate → permit → run (STRICT_PREVIEW’da blok yolu açık). */
    sequence: Object.freeze(["validate", "permit", "run"]),
    current: "validate_permit_run_pre_apply_measurement",
    anchor: "evaluateRhizohPreApplyGate"
  }),
  maturity: Object.freeze({
    temporalTruthLayer: "STABLE",
    executionTopologyGraph: "STABLE",
    decisionSystem: "FUNCTIONAL_SPLIT_BRAIN",
    guaranteeLayerV0: "INITIAL_STRUCTURAL",
    futureKernelGpuClosure: "SPEC_PENDING",
    runtimeOntology: "COMPLETE",
    hostApplyContract: "STABLE"
  }),
  /** Final rapor yüzdeleri — anlam: truth/ontology tam; closure ayrı eksen. */
  readinessPercent: Object.freeze({
    truthLayer: 100,
    runtimeOntology: 100,
    executionTopology: 95,
    decisionLayer: 85,
    gpuComputeLayer: 30,
    productionSafetyModel: 65
  }),
  readinessDomains: Object.freeze({
    truthSystem: 100,
    executionGraph: 95,
    decisionSystem: 85,
    gpuCompute: 30,
    safetyModel: 65,
    prodReadiness: 0
  }),
  /** Guarantee layer v0 raporu — compute vs closure ayrımı. productionSafety === safety === productionSafetyModel. */
  readinessGuaranteeSnapshotV0: Object.freeze({
    computeLayer: 90,
    decisionGraph: 85,
    frameSystem: 100,
    guaranteeLayer: 30,
    replaySeal: 10,
    productionSafety: 65,
    safety: 65
  }),
  /** Otonom / prod “live” iddiası için — deneysel sürümde hard release blocker değil. */
  autonomousProductionBlockers: Object.freeze([
    {
      id: "gpu_decision_closure_semantic_finalize",
      note: "decisionBuffer → semantic closure → intent; WGSL influence_agg mode_finalize risk_compress"
    },
    { id: "production_fallback_kernel", note: "minimal_cpu_only_deterministic_kernel emergency_safe_mode" },
    { id: "replay_seal_v1", note: "full_frame_determinism GPU+JS dual_validation" },
    { id: "temporal_drift_control", note: "long_horizon frame_chain_stabilizer" },
    { id: "hard_safety_runtime_gate", note: "execution_block_before_apply pre_apply_barrier_prod_firewall" }
  ]),
  deployPolicy: Object.freeze({
    allow: Object.freeze(["demo", "sandbox", "research_runtime"]),
    disallow: Object.freeze([
      "production_autonomous_decision_system",
      "critical_robotics_city_physics_control_unguarded"
    ])
  }),
  productizationGaps: Object.freeze([
    "deterministic_closure_guarantee",
    "safe_execution_boundary_hard_gate",
    "minimal_fallback_kernel"
  ]),
  /** @see RHIZOH_FULL_CLOSURE_READINESS_PATH.phaseOrderToFullClosure — tek kanon sıra. */
  phaseRoadmap: RHIZOH_FULL_CLOSURE_READINESS_PATH.phaseOrderToFullClosure,
  hardBlockers: false,
  softBlockers: Object.freeze([
    "gpu_decision_closure_wgsl_live_output",
    "full_frame_deterministic_replay_driver_gpu_seal",
    "production_kernel_fallback_gpu_degrade_policy",
    "long_run_multi_session_drift_stabilizer"
  ]),
  softBlockerImpact: Object.freeze([
    { id: "gpu_decision_closure", impact: "low_medium", risk: "cognitive_purity_gap" },
    { id: "full_replay_seal", impact: "medium", risk: "forensic_perfect_replay_gpu_path" },
    { id: "production_fallback", impact: "low_experimental_tier", risk: "gpu_failure_degrade" },
    { id: "drift_stabilizer", impact: "long_horizon", risk: "multi_session_divergence" }
  ]),
  recommendedFlags: Object.freeze({
    gpuDecisionClosure: "staged_or_disabled",
    verifier: "shadow_mode"
  }),
  nextMilestones: Object.freeze([
    "Pass45GpuDecisionClosureKernel",
    "ProductionFallbackMinimalKernel",
    "ReplaySealV1",
    "DriftStabilizerLoop",
    "HardSafetyPreApplyGate"
  ])
});

export function getRhizohRoadmapManifest() {
  return {
    priorityPhases: PRIORITY_PHASES,
    releaseWaves: RELEASE_WAVES,
    phaseGates: PHASE_GATES,
    phaseGateMaturityLevels: [...PHASE_GATE_MATURITY],
    phaseGateStateExample: PHASE_GATE_STATE_EXAMPLE,
    bitonicDispatchOptimization: BITONIC_DISPATCH_OPTIMIZATION,
    computePasses: COMPUTE_PASS_STACK,
    gpuBuffers: GPU_BUFFER_ROLES,
    sortPipeline: SORT_PIPELINE,
    adaptiveMorton: ADAPTIVE_MORTON_PRECISION,
    neighborPassV0: NEIGHBOR_PASS_V0_SPEC,
    neighborPolicy: NEIGHBOR_POLICY,
    neighborCpuValidation: NEIGHBOR_CPU_VALIDATION_CONTRACT,
    cellSkewPartitionSignal: CELL_SKEW_PARTITION_SIGNAL,
    pass45UnifiedDecision: PASS_45_UNIFIED_DECISION_SPEC,
    pass45GpuDecisionFeedback: PASS_45_GPU_DECISION_FEEDBACK_SPEC,
    pass45GpuDecisionClosure: PASS_45_GPU_DECISION_CLOSURE_SPEC,
    pass45DecisionPath: PASS_45_DECISION_PATH,
    pass45ExecutionTopology: PASS_45_EXECUTION_TOPOLOGY,
    decisionFeedbackLoop: DECISION_FEEDBACK_LOOP,
    rhizohFrameStateSchema: RHIZOH_FRAME_STATE_SCHEMA,
    rhizohSystemLayers: RHIZOH_SYSTEM_LAYERS,
    rhizohRuntimeClassification: RHIZOH_RUNTIME_CLASSIFICATION,
    rhizohRuntimeKernelTier: RHIZOH_RUNTIME_KERNEL_TIER,
    replaySealV1: REPLAY_SEAL_V1_SPEC,
    rhizohFullClosureReadinessPath: RHIZOH_FULL_CLOSURE_READINESS_PATH,
    isRhizohProdReadyLive,
    closureGapResolutionPackV529: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.closureGapResolutionPackV529,
    formalClosureBridgeV1: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.formalClosureBridgeV1,
    epistemicKernelV1: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.epistemicKernelV1,
    fullClosureContractGraphV0: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.fullClosureContractGraphV0,
    inevitableEvolutionLineV529: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.inevitableEvolutionLineV529,
    solverExternalizationLayerV1: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.solverExternalizationLayerV1,
    externalProofNetworkV1: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.externalProofNetworkV1,
    rhizohVNext529ReleaseSnapshot: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT,
    unifiedExecutionMode: UNIFIED_EXECUTION_MODE,
    combinedValidationRemediation: COMBINED_VALIDATION_REMEDIATION,
    meanFieldHybrid: MEAN_FIELD_HYBRID,
    heapPolicy: {
      residency: "gpu_resident_sim_buffers",
      cpuRole: "dispatch_commands_only",
      sabHeaps: TRIPLE_BUFFER_HEAPS,
      writers: "single_writer_per_heap",
      readers: "multi_reader_immutable_snapshots"
    }
  };
}
