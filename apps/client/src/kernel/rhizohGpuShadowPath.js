/**
 * RHIZOH GPU shadow path — Pass 0–3: spawn, Morton encode, bitonic sort, cell offsets.
 * N must be a power of two (default 4096). CPU validation via optional readback.
 *
 * Sparse cell tablosu: sıralı Morton → unique starts → bounds; neighbor için for(i=start;i<end;i++).
 */

import spawnWgsl from "./shaders/rhizohPass0Spawn.wgsl?raw";
import mortonWgsl from "./shaders/rhizohPass1Morton.wgsl?raw";
import bitonicWgsl from "./shaders/rhizohPass2Bitonic.wgsl?raw";
import cellWgsl from "./shaders/rhizohPass3Cell.wgsl?raw";
import cellBoundsWgsl from "./shaders/rhizohPass35CellBounds.wgsl?raw";
import finalizeWgsl from "./shaders/rhizohPass45DecisionFinalize.wgsl?raw";
import {
  resolveUnifiedExecutionMode,
  hashPass45InputSnapshot,
  PASS_45_UNIFIED_DECISION_SPEC,
  PASS_45_DECISION_PATH,
  assembleRhizohFrameState,
  derivePass45ExecutionTopology,
  RHIZOH_FRAME_STATE_SCHEMA
} from "./rhizohExecutionRoadmap.js";
import { createExecutionModePersistence } from "./executionModePersistence.js";
import { createNeighborPolicySmoother } from "./neighborPolicySmoother.js";
import { createPartitionSkewSmoother } from "./partitionSkewSmoother.js";
import {
  decodeGpuDecisionFinalizeV1,
  isValidGpuDecisionFinalizeV1,
  expectedGpuDecisionFinalizeFromCellStats
} from "./rhizohGpuDecisionFinalize.js";
import {
  appendReplaySealFrame,
  createReplaySealGenesis,
  verifyReplaySealChainIntegrity
} from "./rhizohReplaySeal.js";
import { createRhizohDriftStabilizer } from "./rhizohDriftStabilizer.js";
import {
  markRhizohGpuClosureV1Live,
  markRhizohReplaySealChainVerified,
  markRhizohDriftKernelActive,
  markRhizohCpuDeterministicKernelVerified
} from "./rhizohClosureRegistry.js";
import { verifyCpuDeterministicKernelSelfTest } from "./rhizohCpuDeterministicFallback.js";
import { provePass45FinalizeCanonicalEquivalence } from "./rhizohCanonicalEquivalence.js";
import {
  appendJointSealFrame,
  createJointSealGenesis,
  sealLayerFingerprintFromBytes,
  sealLayerFingerprintFromU32Quad
} from "./rhizohJointSealV2.js";
import { evaluateUnifiedClosureContractV1 } from "./rhizohUnifiedClosureContract.js";
import { compressRhizohIdentityV1 } from "./rhizohIdentityCompressionLayerV1.js";
import { RHIZOH_CONTRACT_GRAPH_VERSION } from "./rhizohFullClosureContractGraph.js";

const UNIFORM_ALIGN = 256;

/** GPU shadow readback doğrulama — META / Chronos hata sınıflandırması. */
export const ValidationErrorCode = {
  SORT_ORDER: "SORT_ORDER",
  KEY_DUP: "KEY_DUP",
  CELL_CHAIN: "CELL_CHAIN",
  CELL_OVERFLOW: "CELL_OVERFLOW",
  COUNT_MISMATCH: "COUNT_MISMATCH",
  CELL_MONOTONICITY: "CELL_MONOTONICITY",
  CELL_COVERAGE: "CELL_COVERAGE",
  /** Eski kod yolu / IR: skew artık doğrudan fail değil; partition kontrol sinyali smoother ile birleşir. */
  CELL_SKEW: "CELL_SKEW"
};

/** Runtime self-healing / compiler optimizer ipuçları (primary + escalate + Chronos). */
export const VALIDATION_REMEDIATION_HINTS = {
  [ValidationErrorCode.SORT_ORDER]: {
    primary: "rerun_sort_pass",
    escalate: "increase_radix_depth_if_repeated",
    chronos: "schedule_sort_retry",
    confidence: 0.96
  },
  [ValidationErrorCode.CELL_COVERAGE]: {
    primary: "rebuild_cell_offsets",
    escalate: "invalidate_neighbor_cache",
    chronos: "batch_cell_rebuild",
    confidence: 0.94
  },
  [ValidationErrorCode.CELL_OVERFLOW]: {
    primary: "grow_cell_buffer_or_n",
    escalate: "shard_split_hint",
    chronos: "allocate_gpu_heap",
    confidence: 0.9
  },
  [ValidationErrorCode.KEY_DUP]: {
    primary: "morton_precision_bump_or_dual_u32",
    escalate: "rehash_seed_shift",
    chronos: "escalate_partition_key",
    confidence: 0.88
  },
  [ValidationErrorCode.CELL_CHAIN]: {
    primary: "repair_chain_fallback_sort",
    escalate: "rebuild_cell_offsets",
    chronos: "verify_sort_then_offsets",
    confidence: 0.92
  },
  [ValidationErrorCode.COUNT_MISMATCH]: {
    primary: "rerun_cell_bounds_pass",
    escalate: "full_cell_pass_replay",
    chronos: "single_writer_fence",
    confidence: 0.91
  },
  [ValidationErrorCode.CELL_MONOTONICITY]: {
    primary: "validate_sorted_keys_then_offsets",
    escalate: "hard_reset_cell_buffer",
    chronos: "quarantine_sim_tick",
    confidence: 0.9
  },
  [ValidationErrorCode.CELL_SKEW]: {
    primary: "adaptive_partition_or_mean_field",
    escalate: "chronos_partition_escalation",
    chronos: "partitionSkewSmoother_step",
    confidence: 0.72
  }
};

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

function writeGlobalUniform(arrayBuffer, { n, mortonBits, invCell, origin }) {
  const u32 = new Uint32Array(arrayBuffer, 0, 8);
  const f32 = new Float32Array(arrayBuffer, 0, 32);
  u32[0] = n >>> 0;
  u32[1] = mortonBits >>> 0;
  f32[2] = invCell;
  f32[3] = 0;
  f32[4] = origin[0];
  f32[5] = origin[1];
  f32[6] = origin[2];
  f32[7] = 0;
}

function writeBitonicUniform(arrayBuffer, n, j, k) {
  const u32 = new Uint32Array(arrayBuffer, 0, 4);
  u32[0] = n >>> 0;
  u32[1] = j >>> 0;
  u32[2] = k >>> 0;
  u32[3] = 0;
}

function writeCellUniform(arrayBuffer, n) {
  const u32 = new Uint32Array(arrayBuffer, 0, 4);
  u32[0] = n >>> 0;
  u32[1] = 0;
  u32[2] = 0;
  u32[3] = 0;
}

function countBitonicDispatches(n) {
  let count = 0;
  for (let k = 2; k <= n; k *= 2) {
    for (let j = k >>> 1; j > 0; j >>>= 1) count += 1;
  }
  return count;
}

function percentileNearestRank(sorted, p) {
  if (sorted.length === 0) return 0;
  const r = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, r))];
}

function computeCellDensityStats(cellBytes, uniqueCellCount, u32PerCell) {
  if (uniqueCellCount <= 0) {
    return {
      avg: 0,
      p50: 0,
      p95: 0,
      max: 0,
      skewMaxP50: 0,
      ratioMaxAvg: 0,
      absoluteDeviationEstimate: 0,
      uniqueCells: 0,
      sumCounts: 0,
      histogram16: new Array(16).fill(0)
    };
  }
  const cells = new Uint32Array(
    cellBytes.buffer,
    cellBytes.byteOffset,
    Math.min(uniqueCellCount, (cellBytes.byteLength / 4 / u32PerCell) | 0) * u32PerCell
  );
  const counts = [];
  let sum = 0;
  let max = 0;
  for (let c = 0; c < uniqueCellCount; c++) {
    const cnt = cells[c * u32PerCell + 3] >>> 0;
    counts.push(cnt);
    sum += cnt;
    if (cnt > max) max = cnt;
  }
  counts.sort((a, b) => a - b);
  const avg = sum / uniqueCellCount;
  let madSum = 0;
  for (const cnt of counts) {
    madSum += Math.abs(cnt - avg);
  }
  const absoluteDeviationEstimate = madSum / uniqueCellCount;
  const p50 = percentileNearestRank(counts, 50);
  const p95 = percentileNearestRank(counts, 95);
  const skewMaxP50 = p50 > 0 ? max / p50 : max > 0 ? Infinity : 0;
  const ratioMaxAvg = avg > 0 ? max / avg : max > 0 ? Infinity : 0;
  const hist = new Array(16).fill(0);
  const denom = Math.max(1, max);
  for (const cnt of counts) {
    const b = Math.min(15, ((cnt / denom) * 16) | 0);
    hist[b] += 1;
  }
  return {
    avg,
    p50,
    p95,
    max,
    skewMaxP50,
    ratioMaxAvg,
    absoluteDeviationEstimate,
    uniqueCells: uniqueCellCount,
    sumCounts: sum,
    histogram16: hist
  };
}

/** Warp / iş öğesi verimi — zamanlanan iş parçacığına göre. */
function computeLogicalOccupancy(nParticles, workgroupSize, dispatchX) {
  const scheduledThreads = dispatchX * workgroupSize;
  const ratio = scheduledThreads > 0 ? Math.min(1, nParticles / scheduledThreads) : 0;
  return {
    ratio,
    activeThreads: nParticles,
    scheduledThreads,
    workgroupSize
  };
}

/**
 * Bant genişliği proxy (Pass 0–3.5 bir kare için kabaca byte; ALU değil BW darboğazı için).
 * cacheLineEfficiencyProxy: sıralı/coalesced erişim varsayımı (0–1).
 */
function estimateMemoryOccupancyProxy(n, bitonicSteps, particleStride, pairStride, cellStride) {
  const pN = n * particleStride;
  const pairN = n * pairStride;
  const cellN = n * cellStride;
  let bytesRead = 0;
  let bytesWritten = 0;
  bytesWritten += pN;
  bytesRead += pN;
  bytesWritten += pairN;
  const bitonicTouch = bitonicSteps * pairN * 2;
  bytesRead += bitonicTouch;
  bytesWritten += bitonicTouch;
  bytesRead += pairN + cellN;
  bytesWritten += cellN * 2;
  const total = bytesRead + bytesWritten;
  const cacheLineEfficiencyProxy = 0.72;
  return {
    bytesReadApprox: Math.round(bytesRead),
    bytesWrittenApprox: Math.round(bytesWritten),
    totalBytesApprox: Math.round(total),
    cacheLineEfficiencyProxy,
    note: "approximate_per_shadow_frame; bitonic counts paired KeyIndex traffic"
  };
}

/** Dalgalanma / dallanma proxy — boids + sampling için BW’den sık kritik. */
function estimateComputeOccupancyProxy(nParticles, bitonicSteps, workgroupSize) {
  const divergenceRatioProxy = Math.min(0.62, 0.09 + bitonicSteps * 0.0035);
  const branchEfficiencyProxy = Math.max(0.38, 1 - divergenceRatioProxy * 0.88);
  const waveSize = Math.min(workgroupSize, 64);
  const waveCount = Math.max(1, Math.ceil(nParticles / workgroupSize));
  const avgActiveLanesPerWave = nParticles / waveCount;
  const waveEfficiencyProxy = workgroupSize > 0 ? Math.min(1, avgActiveLanesPerWave / waveSize) : 0;
  return {
    activeLanesEstimate: nParticles,
    totalLanesPerWorkgroup: workgroupSize,
    waveSizeSubgroupProxy: waveSize,
    waveCountEstimate: waveCount,
    waveEfficiencyProxy,
    divergenceRatioProxy,
    branchEfficiencyProxy,
    note: "wavefront_proxy_wgsl_subgroup_typical_32_64"
  };
}

/**
 * Latent instability field — vektör risk; skalar = L∞ (telemetri + eşik).
 */
function computeSoftRiskFields({ density, neighborSmoothResult, computeOccupancy, ratioEma }) {
  const r = Number(density?.ratioMaxAvg) || 0;
  const ema = Number(ratioEma) || 0;
  const skewRisk =
    r > ema + 0.001 ? Math.min(1, (r - ema) / (Math.max(1, ema) * 0.38 + 2.5)) : 0;
  const samplingRisk = Math.min(
    1,
    Math.abs((neighborSmoothResult.rawP95 ?? 0) - (neighborSmoothResult.smoothedP95 ?? 0)) /
      Math.max(20, neighborSmoothResult.smoothedP95 ?? 0)
  );
  const occupancyRisk = Math.min(1, Number(computeOccupancy?.divergenceRatioProxy) || 0);
  const riskVector = { skewRisk, samplingRisk, occupancyRisk };
  const linf = Math.min(1, Math.max(skewRisk, samplingRisk, occupancyRisk));
  return { riskVector, softRiskProxy: linf };
}

/** @param {GPUDevice} device */
export function createRhizohGpuShadowPath(device, options = {}) {
  const n = options.n ?? 4096;
  if (!isPowerOfTwo(n)) throw new Error("rhizohGpuShadowPath: n must be power of 2");
  const mortonBits = options.mortonBits ?? 10;
  const invCell = options.invCell ?? 1 / 50;
  const origin = options.origin ?? [0, 0, 0];
  const neighborSmoother = createNeighborPolicySmoother(options.neighborSmoothing);
  const partitionSkew = createPartitionSkewSmoother(options.partitionSkew);
  const executionModePersistence = createExecutionModePersistence({
    modePersistenceFrames:
      options.executionModePersistence?.modePersistenceFrames ??
      PASS_45_UNIFIED_DECISION_SPEC.modePersistenceFrames
  });
  const driftStabilizer = createRhizohDriftStabilizer(options.driftStabilizer);
  let replaySealState = createReplaySealGenesis();
  let jointSealState = createJointSealGenesis();
  if (verifyCpuDeterministicKernelSelfTest()) {
    markRhizohCpuDeterministicKernelVerified(true);
  }
  const ratioEmaAlpha = options.shadowRiskState?.ratioEmaAlpha ?? 0.18;
  let ratioMaxAvgEma = 0;

  const particleStride = 16;
  const keyIndexStride = 8;
  const cellEntryStride = 16;

  const globalUniform = device.createBuffer({
    size: UNIFORM_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bitonicUniform = device.createBuffer({
    size: UNIFORM_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const cellUniform = device.createBuffer({
    size: UNIFORM_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const particles = device.createBuffer({
    size: n * particleStride,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });
  const pairs = device.createBuffer({
    size: n * keyIndexStride,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });
  const cellOut = device.createBuffer({
    size: n * cellEntryStride,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });
  const cellAtomic = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
  const decisionOut = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });

  const modSpawn = device.createShaderModule({ code: spawnWgsl });
  const modMorton = device.createShaderModule({ code: mortonWgsl });
  const modBitonic = device.createShaderModule({ code: bitonicWgsl });
  const modCell = device.createShaderModule({ code: cellWgsl });
  const modCellBounds = device.createShaderModule({ code: cellBoundsWgsl });
  const modFinalize = device.createShaderModule({ code: finalizeWgsl });

  const layoutSpawn = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });
  const layoutMorton = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });
  const layoutBitonic = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });
  const layoutCell = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });
  const layoutCellBounds = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });
  const layoutFinalize = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
  });

  const plSpawn = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutSpawn] }),
    compute: { module: modSpawn, entryPoint: "spawn_init" }
  });
  const plMorton = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutMorton] }),
    compute: { module: modMorton, entryPoint: "morton_encode" }
  });
  const plBitonic = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutBitonic] }),
    compute: { module: modBitonic, entryPoint: "bitonic_step" }
  });
  const plCell = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutCell] }),
    compute: { module: modCell, entryPoint: "cell_offsets" }
  });
  const plCellBounds = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutCellBounds] }),
    compute: { module: modCellBounds, entryPoint: "cell_bounds" }
  });
  const plFinalize = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [layoutFinalize] }),
    compute: { module: modFinalize, entryPoint: "decision_finalize_v1" }
  });

  const bgSpawn = device.createBindGroup({
    layout: layoutSpawn,
    entries: [
      { binding: 0, resource: { buffer: globalUniform } },
      { binding: 1, resource: { buffer: particles } }
    ]
  });
  const bgMorton = device.createBindGroup({
    layout: layoutMorton,
    entries: [
      { binding: 0, resource: { buffer: globalUniform } },
      { binding: 1, resource: { buffer: particles } },
      { binding: 2, resource: { buffer: pairs } }
    ]
  });
  const bgBitonic = device.createBindGroup({
    layout: layoutBitonic,
    entries: [
      { binding: 0, resource: { buffer: bitonicUniform } },
      { binding: 1, resource: { buffer: pairs } }
    ]
  });
  const bgCell = device.createBindGroup({
    layout: layoutCell,
    entries: [
      { binding: 0, resource: { buffer: cellUniform } },
      { binding: 1, resource: { buffer: pairs } },
      { binding: 2, resource: { buffer: cellOut } },
      { binding: 3, resource: { buffer: cellAtomic } }
    ]
  });
  const bgCellBounds = device.createBindGroup({
    layout: layoutCellBounds,
    entries: [
      { binding: 0, resource: { buffer: cellUniform } },
      { binding: 1, resource: { buffer: cellOut } },
      { binding: 2, resource: { buffer: cellAtomic } }
    ]
  });
  const bgFinalize = device.createBindGroup({
    layout: layoutFinalize,
    entries: [
      { binding: 0, resource: { buffer: cellOut } },
      { binding: 1, resource: { buffer: cellAtomic } },
      { binding: 2, resource: { buffer: decisionOut } }
    ]
  });

  const wg = 256;
  const dispatchX = Math.ceil(n / wg);

  const scratchGlobal = new ArrayBuffer(UNIFORM_ALIGN);
  const scratchBitonic = new ArrayBuffer(UNIFORM_ALIGN);
  const scratchCell = new ArrayBuffer(UNIFORM_ALIGN);

  function encodeDispatchGraph() {
    const steps = [];
    for (let k = 2; k <= n; k *= 2) {
      for (let j = k >>> 1; j > 0; j >>>= 1) {
        steps.push({ pass: "bitonic_step", j, k, workgroups: [dispatchX, 1, 1] });
      }
    }
    return {
      n,
      mortonBits,
      workgroupSize: wg,
      passes: [
        { pass: "spawn_init", pipeline: "spawn", workgroups: [dispatchX, 1, 1] },
        { pass: "morton_encode", pipeline: "morton", workgroups: [dispatchX, 1, 1] },
        ...steps,
        { pass: "cell_offsets", pipeline: "cell", workgroups: [dispatchX, 1, 1] },
        { pass: "cell_bounds", pipeline: "cellBounds", workgroups: [dispatchX, 1, 1] },
        { pass: "decision_finalize_v1", pipeline: "finalize", workgroups: [1, 1, 1] }
      ]
    };
  }

  const dispatchGraph = encodeDispatchGraph();
  const bitonicDispatchCount = countBitonicDispatches(n);

  /** Chronos QoS / adaptive scheduling için son çalıştırma metrikleri (timestamp query yok; kabaca wall clock). */
  const metrics = {
    lastRun: null
  };

  function writeGlobals() {
    writeGlobalUniform(scratchGlobal, { n, mortonBits, invCell, origin });
    device.queue.writeBuffer(globalUniform, 0, scratchGlobal);
  }

  /**
   * Bitonic adımları uniform güncellemesi gerektirir; her adım ayrı submit ile sıralanır.
   * İleride: küçük uniform ring-buffer + dynamic offset → tek submit içinde çoklu dispatch.
   */
  function submitShadowFrame() {
    const tHost0 = performance.now();
    writeGlobals();
    const enc1 = device.createCommandEncoder();
    {
      const pass = enc1.beginComputePass();
      pass.setPipeline(plSpawn);
      pass.setBindGroup(0, bgSpawn);
      pass.dispatchWorkgroups(dispatchX);
      pass.end();
    }
    {
      const pass = enc1.beginComputePass();
      pass.setPipeline(plMorton);
      pass.setBindGroup(0, bgMorton);
      pass.dispatchWorkgroups(dispatchX);
      pass.end();
    }
    device.queue.submit([enc1.finish()]);

    for (let k = 2; k <= n; k *= 2) {
      for (let j = k >>> 1; j > 0; j >>>= 1) {
        writeBitonicUniform(scratchBitonic, n, j, k);
        device.queue.writeBuffer(bitonicUniform, 0, scratchBitonic);
        const encB = device.createCommandEncoder();
        const pass = encB.beginComputePass();
        pass.setPipeline(plBitonic);
        pass.setBindGroup(0, bgBitonic);
        pass.dispatchWorkgroups(dispatchX);
        pass.end();
        device.queue.submit([encB.finish()]);
      }
    }

    device.queue.writeBuffer(cellAtomic, 0, new Uint32Array([0]));
    writeCellUniform(scratchCell, n);
    device.queue.writeBuffer(cellUniform, 0, scratchCell);
    const enc2 = device.createCommandEncoder();
    {
      const pass = enc2.beginComputePass();
      pass.setPipeline(plCell);
      pass.setBindGroup(0, bgCell);
      pass.dispatchWorkgroups(dispatchX);
      pass.end();
    }
    {
      const pass = enc2.beginComputePass();
      pass.setPipeline(plCellBounds);
      pass.setBindGroup(0, bgCellBounds);
      pass.dispatchWorkgroups(dispatchX);
      pass.end();
    }
    {
      const pass = enc2.beginComputePass();
      pass.setPipeline(plFinalize);
      pass.setBindGroup(0, bgFinalize);
      pass.dispatchWorkgroups(1, 1, 1);
      pass.end();
    }
    device.queue.submit([enc2.finish()]);
    metrics.lastRun = {
      dispatchHostMs: performance.now() - tHost0,
      bitonicSubmits: bitonicDispatchCount,
      totalSubmits: 2 + bitonicDispatchCount,
      gpuQueueIdleMs: null,
      readbackMs: null,
      validationErrors: [],
      occupancy: {
        logicalOccupancy: computeLogicalOccupancy(n, wg, dispatchX),
        memoryOccupancy: estimateMemoryOccupancyProxy(
          n,
          bitonicDispatchCount,
          particleStride,
          keyIndexStride,
          cellEntryStride
        ),
        computeOccupancy: estimateComputeOccupancyProxy(n, bitonicDispatchCount, wg)
      },
      cellDensityStats: null,
      skewPartitionSignal: null,
      executionModeHint: null,
      gpuDecisionFinalizeV1: null,
      softRiskProxy: null,
      riskVector: null,
      rhizohFrameState: null,
      neighborPolicy: null,
      meanFieldAdaptiveHint: null
    };
  }

  async function readBufferCopy(src, byteSize) {
    const readback = device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const enc = device.createCommandEncoder();
    enc.copyBufferToBuffer(src, 0, readback, 0, byteSize);
    device.queue.submit([enc.finish()]);
    await device.queue.onSubmittedWorkDone();
    await readback.mapAsync(GPUMapMode.READ);
    const copy = readback.getMappedRange().slice(0);
    readback.unmap();
    readback.destroy();
    return new Uint8Array(copy);
  }

  function validateSortedKeys(pairBytes) {
    const u32 = new Uint32Array(pairBytes.buffer, pairBytes.byteOffset, (n * 8) / 4);
    for (let i = 1; i < n; i++) {
      const k0 = u32[i * 2 - 2];
      const k1 = u32[i * 2];
      if (k0 > k1) {
        return { ok: false, code: ValidationErrorCode.SORT_ORDER, detail: "keys_descending", i, k0, k1 };
      }
    }
    return { ok: true };
  }

  function validateCellStarts(pairBytes, cellBytes, uniqueCellCount) {
    const pairs = new Uint32Array(pairBytes.buffer, pairBytes.byteOffset, (n * 8) / 4);
    const u32PerCell = 4;
    const cells = new Uint32Array(
      cellBytes.buffer,
      cellBytes.byteOffset,
      Math.min(uniqueCellCount, n) * u32PerCell
    );
    for (let c = 0; c < uniqueCellCount; c++) {
      const keyCell = cells[c * u32PerCell];
      const start = cells[c * u32PerCell + 1];
      if (c + 1 < uniqueCellCount && keyCell === cells[(c + 1) * u32PerCell]) {
        return { ok: false, code: ValidationErrorCode.KEY_DUP, detail: "duplicate_cell_key", c, key: keyCell };
      }
      if (start >= n) {
        return { ok: false, code: ValidationErrorCode.CELL_OVERFLOW, detail: "start_oob", c, start, n };
      }
      const keyAt = pairs[start * 2];
      if (keyCell !== keyAt) {
        return { ok: false, code: ValidationErrorCode.CELL_CHAIN, detail: "key_mismatch_sorted_pairs", c, expected: keyCell, got: keyAt };
      }
      if (c > 0) {
        const prevStart = cells[(c - 1) * u32PerCell + 1];
        const prevKey = pairs[prevStart * 2];
        if (prevKey === keyAt) {
          return { ok: false, code: ValidationErrorCode.KEY_DUP, detail: "adjacent_equal_key_in_sorted", c, key: keyAt };
        }
        if (prevKey > keyAt) {
          return { ok: false, code: ValidationErrorCode.SORT_ORDER, detail: "cell_table_key_order", c, prevKey, keyAt };
        }
      }
    }
    return { ok: true };
  }

  function validateCellBounds(cellBytes, uniqueCellCount) {
    const u32PerCell = 4;
    const cells = new Uint32Array(
      cellBytes.buffer,
      cellBytes.byteOffset,
      Math.min(uniqueCellCount, n) * u32PerCell
    );
    let sumCounts = 0;
    for (let c = 0; c < uniqueCellCount; c++) {
      const start = cells[c * u32PerCell + 1];
      const end = cells[c * u32PerCell + 2];
      const count = cells[c * u32PerCell + 3];
      if (start > end) {
        return { ok: false, code: ValidationErrorCode.CELL_MONOTONICITY, detail: "start_gt_end", c, start, end };
      }
      if (count < 1) {
        return { ok: false, code: ValidationErrorCode.CELL_MONOTONICITY, detail: "count_lt_1", c, count };
      }
      if (end - start !== count) {
        return { ok: false, code: ValidationErrorCode.COUNT_MISMATCH, detail: "end_start_count", c, start, end, count };
      }
      if (end > n) {
        return { ok: false, code: ValidationErrorCode.CELL_OVERFLOW, detail: "end_oob", c, end, n };
      }
      if (c + 1 < uniqueCellCount) {
        const nextStart = cells[(c + 1) * u32PerCell + 1];
        if (end > nextStart) {
          return { ok: false, code: ValidationErrorCode.CELL_MONOTONICITY, detail: "end_gt_next_start", c, end, nextStart };
        }
        if (end !== nextStart) {
          return { ok: false, code: ValidationErrorCode.CELL_CHAIN, detail: "gap_in_chain", c, end, nextStart };
        }
      } else if (end !== n) {
        return { ok: false, code: ValidationErrorCode.CELL_CHAIN, detail: "last_end_not_n", c, end, expectedN: n };
      }
      sumCounts += count;
    }
    if (sumCounts !== n) {
      return { ok: false, code: ValidationErrorCode.CELL_COVERAGE, detail: "sum_count_neq_n", sumCounts, n };
    }
    return { ok: true };
  }

  async function runAndValidateReadback() {
    const validationErrors = [];
    submitShadowFrame();
    const tw0 = performance.now();
    await device.queue.onSubmittedWorkDone();
    const gpuQueueIdleMs = performance.now() - tw0;
    const tr0 = performance.now();
    const pairBytes = await readBufferCopy(pairs, n * keyIndexStride);
    const atomicBytes = await readBufferCopy(cellAtomic, 4);
    const uniqueCellCount = new Uint32Array(atomicBytes.buffer, atomicBytes.byteOffset, 1)[0];
    const cellReadBytes = Math.max(Math.min(uniqueCellCount, n) * cellEntryStride, 16);
    const cellBytes = await readBufferCopy(cellOut, cellReadBytes);
    const decisionBytes = await readBufferCopy(decisionOut, 16);
    const readbackMs = performance.now() - tr0;
    if (metrics.lastRun) {
      metrics.lastRun.gpuQueueIdleMs = gpuQueueIdleMs;
      metrics.lastRun.readbackMs = readbackMs;
    }
    const u32PerCell = 4;
    const sortV = validateSortedKeys(pairBytes);
    if (!sortV.ok) {
      validationErrors.push({ stage: "sort", ...sortV });
      if (metrics.lastRun) metrics.lastRun.validationErrors = validationErrors;
      return { ok: false, stage: "sort", metrics: metrics.lastRun, ...sortV, uniqueCellCount };
    }
    const cellV = validateCellStarts(pairBytes, cellBytes, uniqueCellCount);
    if (!cellV.ok) {
      validationErrors.push({ stage: "cell_starts", ...cellV });
      if (metrics.lastRun) metrics.lastRun.validationErrors = validationErrors;
      return { ok: false, stage: "cell", metrics: metrics.lastRun, ...cellV, uniqueCellCount };
    }
    const boundsV = validateCellBounds(cellBytes, uniqueCellCount);
    if (!boundsV.ok) {
      validationErrors.push({ stage: "cell_bounds", ...boundsV });
      if (metrics.lastRun) metrics.lastRun.validationErrors = validationErrors;
      return { ok: false, stage: "cell_bounds", metrics: metrics.lastRun, ...boundsV, uniqueCellCount };
    }

    const density = computeCellDensityStats(cellBytes, uniqueCellCount, u32PerCell);
    const decodedGpuDecision = decodeGpuDecisionFinalizeV1(decisionBytes);
    const expectedGpuDecision = expectedGpuDecisionFinalizeFromCellStats({
      maxParticleCountInCell: density.max,
      uniqueCellCount
    });
    const gpuFinalizeV1Consensus =
      !!decodedGpuDecision &&
      isValidGpuDecisionFinalizeV1(decodedGpuDecision) &&
      decodedGpuDecision.maxCellCount === expectedGpuDecision.maxCellCount &&
      decodedGpuDecision.uniqueCells === expectedGpuDecision.uniqueCells &&
      decodedGpuDecision.modeQuanta === expectedGpuDecision.modeQuanta;
    markRhizohGpuClosureV1Live(gpuFinalizeV1Consensus);
    const canonicalEquivalenceProof = provePass45FinalizeCanonicalEquivalence({
      gpuReadbackBytes: decisionBytes,
      maxParticleCountInCell: density.max,
      uniqueCellCount
    });
    const skewPartitionSignal = partitionSkew.step(density.ratioMaxAvg);
    const neighborSmoothResult = neighborSmoother.step(density);
    const neighborPolicy = neighborSmoothResult.policy;
    const meanFieldAdaptiveHint =
      neighborPolicy.mode === "mean_field_dominant"
        ? "prefer_mean_field_blend"
        : neighborPolicy.mode === "hybrid"
          ? "hybrid_mean_field"
          : "local_neighbor_ok";

    const rNow = Number(density.ratioMaxAvg) || 0;
    ratioMaxAvgEma =
      ratioMaxAvgEma === 0 ? rNow : ratioEmaAlpha * rNow + (1 - ratioEmaAlpha) * ratioMaxAvgEma;
    const occSnap = metrics.lastRun?.occupancy?.computeOccupancy ?? null;
    const { riskVector, softRiskProxy } = computeSoftRiskFields({
      density,
      neighborSmoothResult,
      computeOccupancy: occSnap,
      ratioEma: ratioMaxAvgEma
    });

    const instantExecutionModeHint = resolveUnifiedExecutionMode({
      skewLockedTierIndex: skewPartitionSignal.lockedTierIndex,
      neighborMode: neighborPolicy.mode,
      quarantineRisk: 0,
      softRiskProxy,
      riskVector,
      needsRebuild: false
    });

    const pass45Snapshot = {
      skewLockedTierIndex: skewPartitionSignal.lockedTierIndex,
      neighborMode: neighborPolicy.mode,
      quarantineRisk: 0,
      softRiskProxy,
      riskVector,
      needsRebuild: false,
      ratioMaxAvg: density.ratioMaxAvg,
      absoluteDeviationEstimate: density.absoluteDeviationEstimate
    };
    const inputSnapshotHash = hashPass45InputSnapshot(pass45Snapshot);
    const driftResult = driftStabilizer.step({ inputSnapshotHash });
    if (driftResult.frameIndex >= 1) markRhizohDriftKernelActive(true);

    const replayAnchor = {
      contractId: RHIZOH_FRAME_STATE_SCHEMA.contractId,
      schemaVersion: RHIZOH_FRAME_STATE_SCHEMA.version,
      inputSnapshotHash,
      executionTopology: derivePass45ExecutionTopology(instantExecutionModeHint.decisionPath),
      decisionPath: instantExecutionModeHint.decisionPath
    };
    const gpuDispatchFingerprint = decodedGpuDecision
      ? `${decodedGpuDecision.maxCellCount ^ decodedGpuDecision.uniqueCells ^ decodedGpuDecision.modeQuanta}`
      : "none";
    replaySealState = appendReplaySealFrame(replaySealState, replayAnchor, {
      gpuDispatchFingerprint
    });
    const sealIntegrity = verifyReplaySealChainIntegrity(replaySealState);
    markRhizohReplaySealChainVerified(sealIntegrity.ok && replaySealState.frameIndex >= 1);

    const gpuLayerSeal = sealLayerFingerprintFromBytes(decisionBytes);
    const cpuLayerSeal = sealLayerFingerprintFromU32Quad(expectedGpuDecision);
    jointSealState = appendJointSealFrame(jointSealState, {
      frameSeal: inputSnapshotHash,
      gpuSeal: gpuLayerSeal,
      cpuSeal: cpuLayerSeal
    });
    const unifiedClosureContract = evaluateUnifiedClosureContractV1({
      canonicalProof: canonicalEquivalenceProof,
      jointSealState,
      frameInputHash: inputSnapshotHash
    });

    const persist = executionModePersistence.step(instantExecutionModeHint);
    const executionModeMismatch =
      persist.instantHint.executionMode !== persist.persistedHint.executionMode;
    const spatialLock = Object.freeze({
      neighborPolicyLocked: !!neighborSmoothResult.lockedDuringCooldown,
      executionModePersistenceActive:
        executionModeMismatch || persist.persistencePendingTarget != null,
      samplingLocked:
        !!neighborSmoothResult.lockedDuringCooldown ||
        !!(executionModeMismatch && persist.instantHint.decisionPath === PASS_45_DECISION_PATH.SLOW),
      inheritedFromNeighborCooldown: !!neighborSmoothResult.lockedDuringCooldown,
      inheritedFromExecutionModePending: executionModeMismatch
    });
    const executionModeHint = Object.freeze({
      executionMode: persist.persistedHint.executionMode,
      reason: persist.persistedHint.reason,
      instantExecutionMode: persist.instantHint.executionMode,
      instantReason: persist.instantHint.reason,
      decisionPath: persist.instantHint.decisionPath ?? PASS_45_DECISION_PATH.SLOW,
      riskVector: Object.freeze({
        skewRisk: instantExecutionModeHint.riskVector.skewRisk,
        samplingRisk: instantExecutionModeHint.riskVector.samplingRisk,
        occupancyRisk: instantExecutionModeHint.riskVector.occupancyRisk,
        linf: instantExecutionModeHint.riskVector.linf,
        l1mean: instantExecutionModeHint.riskVector.l1mean
      }),
      inputSnapshotHash,
      persistenceStableFrames: persist.persistenceStableFrames,
      persistenceFramesRequired: persist.persistenceFramesRequired,
      persistencePendingTarget: persist.persistencePendingTarget,
      persistenceApplied: persist.persistenceApplied,
      readonlyKernelOutput: true
    });

    const compressedIdentity = compressRhizohIdentityV1({
      inputSnapshotHash,
      jointClosureRoot: jointSealState.closureRoot,
      replayChainHash: replaySealState.chainHash,
      contractGraphVersion: RHIZOH_CONTRACT_GRAPH_VERSION,
      unifiedClosureFingerprint: unifiedClosureContract.closureFingerprint
    });

    const rhizohFrameState = assembleRhizohFrameState({
      density,
      occupancy: metrics.lastRun?.occupancy ?? null,
      riskVector,
      softRiskProxy,
      skewSignal: skewPartitionSignal,
      executionMode: executionModeHint,
      neighborPolicy,
      spatialLock,
      inputSnapshotHash,
      decisionPath: instantExecutionModeHint.decisionPath,
      meanFieldAdaptiveHint,
      replaySeal: replaySealState,
      jointSeal: jointSealState,
      unifiedClosureContract,
      compressedIdentity,
      closureAttestation: Object.freeze({
        gpuFinalizeV1Consensus,
        canonicalEquivalenceProof,
        decodedGpu: decodedGpuDecision,
        expectedCpu: expectedGpuDecision
      })
    });

    if (metrics.lastRun) {
      metrics.lastRun.validationErrors = [];
      metrics.lastRun.cellDensityStats = density;
      metrics.lastRun.skewPartitionSignal = skewPartitionSignal;
      metrics.lastRun.executionModeHint = executionModeHint;
      metrics.lastRun.gpuDecisionFinalizeV1 = Object.freeze({
        decoded: decodedGpuDecision,
        expected: expectedGpuDecision,
        consensus: gpuFinalizeV1Consensus,
        canonicalEquivalenceProof,
        drift: driftResult
      });
      metrics.lastRun.jointSeal = jointSealState;
      metrics.lastRun.unifiedClosureContract = unifiedClosureContract;
      metrics.lastRun.compressedIdentity = compressedIdentity;
      metrics.lastRun.softRiskProxy = softRiskProxy;
      metrics.lastRun.riskVector = riskVector;
      metrics.lastRun.rhizohFrameState = rhizohFrameState;
      metrics.lastRun.neighborPolicy = neighborPolicy;
      metrics.lastRun.neighborPolicySmoothing = {
        smoothedP95: neighborSmoothResult.smoothedP95,
        rawP95: neighborSmoothResult.rawP95,
        hysteresisPending: neighborSmoothResult.hysteresisPending,
        pendingSwitchTo: neighborSmoothResult.pendingSwitchTo,
        pendingFrames: neighborSmoothResult.pendingFrames,
        cooldownRemaining: neighborSmoothResult.cooldownRemaining,
        lockedDuringCooldown: neighborSmoothResult.lockedDuringCooldown,
        cooldownPhase: neighborSmoothResult.cooldownPhase,
        cooldownHardRemaining: neighborSmoothResult.cooldownHardRemaining,
        cooldownSoftScalar: neighborSmoothResult.cooldownSoftScalar
      };
      metrics.lastRun.meanFieldAdaptiveHint = meanFieldAdaptiveHint;
    }

    return {
      ok: true,
      uniqueCellCount,
      n,
      metrics: metrics.lastRun,
      cellDensityStats: density,
      gpuDecisionFinalizeV1: metrics.lastRun?.gpuDecisionFinalizeV1 ?? null,
      jointSeal: jointSealState,
      unifiedClosureContract,
      compressedIdentity,
      replaySeal: replaySealState,
      skewPartitionSignal,
      softRiskProxy,
      riskVector,
      rhizohFrameState,
      executionModeHint,
      spatialLock,
      neighborPolicy,
      neighborPolicySmoothing: {
        smoothedP95: neighborSmoothResult.smoothedP95,
        rawP95: neighborSmoothResult.rawP95,
        hysteresisPending: neighborSmoothResult.hysteresisPending,
        pendingSwitchTo: neighborSmoothResult.pendingSwitchTo,
        pendingFrames: neighborSmoothResult.pendingFrames,
        cooldownRemaining: neighborSmoothResult.cooldownRemaining,
        lockedDuringCooldown: neighborSmoothResult.lockedDuringCooldown,
        cooldownPhase: neighborSmoothResult.cooldownPhase,
        cooldownHardRemaining: neighborSmoothResult.cooldownHardRemaining,
        cooldownSoftScalar: neighborSmoothResult.cooldownSoftScalar
      },
      meanFieldAdaptiveHint
    };
  }

  const pipelines = {
    spawn: plSpawn,
    morton: plMorton,
    bitonic: plBitonic,
    cell: plCell,
    cellBounds: plCellBounds,
    finalize: plFinalize
  };
  const bindGroups = {
    spawn: bgSpawn,
    morton: bgMorton,
    bitonic: bgBitonic,
    cell: bgCell,
    cellBounds: bgCellBounds,
    finalize: bgFinalize
  };
  const buffers = {
    globalUniform,
    bitonicUniform,
    cellUniform,
    particles,
    pairs,
    cellOut,
    cellAtomic,
    decisionOut
  };

  return {
    n,
    mortonBits,
    bitonicDispatchCount,
    pipelines,
    bindGroups,
    buffers,
    dispatchGraph,
    metrics,
    submitShadowFrame,
    runAndValidateReadback,
    writeGlobals
  };
}
