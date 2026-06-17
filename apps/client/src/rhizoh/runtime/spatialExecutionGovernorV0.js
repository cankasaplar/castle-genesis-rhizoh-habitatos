/**
 * Spatial Execution Governor v0 — orchestrates graph→space execution cycle.
 * RESEARCH-ONLY — governs when emitter ticks, blocks over-pruning, forces external projection.
 *
 * Minimum fix bundle:
 * 1) if (bridge.active && graph.diff.length > 0) → spatialEmitter.tick
 * 2) if (nodeCount < previous * 0.9) → disablePruning
 * 3) if (internalMass > 0.9 && spatialNodes === 0) → forceExternalProjection
 */

import {
  computeCausalGraphDiffV0,
  consumeCausalGraphDiffV0,
  isCausalGraphSpatialBridgeActiveV0
} from "./causalGraphSpatialBridgeV0.js";
import {
  flushSpatialEmitterCommitsV0,
  getSpatialEmitterCommitQueueSnapshotV0
} from "./rhizohSpatialEventEmitterV0.js";
import { flushSpatialWorldSpaceBufferV0 } from "./spatialWorldSpaceFlushV0.js";
import { isSpatialWorldSyncReadyV0 } from "./spatialWorldSyncV0.js";
import {
  disableCausalGraphPruningV0,
  isCausalGraphPruningDisabledV0
} from "./rhizohCausalGraphCompressionV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { publishCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";

export const SPATIAL_EXECUTION_GOVERNOR_SCHEMA_V0 = "castle.rhizoh.spatial_execution_governor.v0";

const GRAPH_SHRINK_RATIO_V0 = 0.9;
const INTERNAL_MASS_FORCE_THRESHOLD_V0 = 0.9;

let previousNodeCountV0 = 0;
let governorTickCountV0 = 0;
let lastGovernorTickAtMsV0 = 0;
let lastEmitterTickV0 = null;
let lastShrinkGuardV0 = null;
let lastBalanceFixV0 = null;

/**
 * Spatial emitter tick — consume diff, commit staged, flush world buffer.
 * @param {{ diff?: object, atMs?: number, force?: boolean, causalMap?: object }} [opts]
 */
export function runSpatialEmitterTickV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const causalMap = opts.causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const diff = opts.diff || computeCausalGraphDiffV0(causalMap);
  const shouldRun = opts.force === true || diff.diffCount > 0;

  if (!shouldRun) {
    return Object.freeze({
      ok: true,
      skipped: true,
      reason: "no_graph_diff",
      diffCount: diff.diffCount
    });
  }

  const consume = consumeCausalGraphDiffV0({
    atMs,
    force: true,
    forceAll: opts.force === true,
    causalMap
  });
  const flush = flushSpatialEmitterCommitsV0({ atMs });
  const worldFlush = flushSpatialWorldSpaceBufferV0({ atMs, force: true });

  return Object.freeze({
    ok: true,
    atMs,
    diffCount: diff.diffCount,
    consume,
    flush,
    worldFlush,
    commitQueue: getSpatialEmitterCommitQueueSnapshotV0()
  });
}

/**
 * Graph shrink guard — disable causal pruning when node count drops >10%.
 * @param {number} nodeCount
 */
export function evaluateGraphShrinkGuardV0(nodeCount) {
  const count = Math.max(0, Number(nodeCount) || 0);
  const previous = previousNodeCountV0;
  let shrinkDetected = false;

  if (previous > 0 && count < previous * GRAPH_SHRINK_RATIO_V0) {
    disableCausalGraphPruningV0({
      reason: "graph_shrink_guard",
      previousNodeCount: previous,
      nodeCount: count
    });
    shrinkDetected = true;
  }

  previousNodeCountV0 = count;

  const snap = Object.freeze({
    shrinkDetected,
    previousNodeCount: previous,
    nodeCount: count,
    pruningDisabled: isCausalGraphPruningDisabledV0(),
    ratio: previous > 0 ? Number((count / previous).toFixed(3)) : 1
  });
  lastShrinkGuardV0 = snap;
  return snap;
}

/**
 * Force external projection when internal semantic mass high but spatial registry empty.
 */
export function forceExternalProjectionV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const causalMap =
    opts.causalMap ||
    (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null) ||
    publishCausalMapLayerV0();

  const emitterTick = runSpatialEmitterTickV0({
    atMs,
    force: true,
    causalMap
  });

  return Object.freeze({
    ok: true,
    forced: true,
    atMs,
    emitterTick,
    spatialNodeCount: listSpatialNodesV0().length
  });
}

/**
 * Internal vs external balance — epistemic half-collapse rescue.
 */
export function evaluateInternalExternalBalanceV0() {
  const grounding = getGroundingLayerSnapshotV1();
  const spatialCount = listSpatialNodesV0().length;
  const internalMass = Number(grounding.internalMass ?? 0);
  const externalMass = Number(grounding.externalMass ?? 0);
  const imbalance =
    internalMass > INTERNAL_MASS_FORCE_THRESHOLD_V0 && spatialCount === 0;

  const snap = Object.freeze({
    imbalance,
    internalMass,
    externalMass,
    spatialNodeCount: spatialCount,
    threshold: INTERNAL_MASS_FORCE_THRESHOLD_V0,
    forced: false,
    projection: null
  });

  if (!imbalance) {
    lastBalanceFixV0 = snap;
    return snap;
  }

  const projection = forceExternalProjectionV0();
  const out = Object.freeze({
    ...snap,
    forced: true,
    projection
  });
  lastBalanceFixV0 = out;
  return out;
}

/**
 * Single governor tick — shrink guard → balance fix → conditional emitter activation.
 * @param {{ atMs?: number }} [opts]
 */
export function runSpatialExecutionGovernorTickV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  governorTickCountV0 += 1;
  lastGovernorTickAtMsV0 = atMs;

  const causalMap = typeof window !== "undefined" ? window.__rhizoh?.causalMap : null;
  const nodeCount = Number(causalMap?.nodeCount ?? 0);
  const shrinkGuard = evaluateGraphShrinkGuardV0(nodeCount);

  const bridgeActive = isCausalGraphSpatialBridgeActiveV0(causalMap);
  const diff = computeCausalGraphDiffV0(causalMap);

  let emitterActivated = false;
  if (bridgeActive && diff.diffCount > 0) {
    lastEmitterTickV0 = runSpatialEmitterTickV0({ diff, atMs, causalMap });
    emitterActivated = true;
  } else {
    lastEmitterTickV0 = Object.freeze({
      ok: true,
      skipped: true,
      reason: bridgeActive ? "empty_graph_diff" : "bridge_inactive",
      diffCount: diff.diffCount
    });
  }

  const balanceFix = evaluateInternalExternalBalanceV0();
  if (balanceFix.forced && balanceFix.projection?.emitterTick) {
    lastEmitterTickV0 = balanceFix.projection.emitterTick;
    emitterActivated = true;
  }

  const snap = Object.freeze({
    schema: SPATIAL_EXECUTION_GOVERNOR_SCHEMA_V0,
    ok: true,
    atMs,
    tickCount: governorTickCountV0,
    bridgeActive,
    emitterActivated,
    graphDiffCount: diff.diffCount,
    shrinkGuard,
    balanceFix: Object.freeze({
      imbalance: balanceFix.imbalance,
      forced: balanceFix.forced,
      internalMass: balanceFix.internalMass,
      externalMass: balanceFix.externalMass,
      spatialNodeCount: balanceFix.spatialNodeCount
    }),
    emitterTick: lastEmitterTickV0,
    spatialNodeCount: listSpatialNodesV0().length,
    worldSyncReady: isSpatialWorldSyncReadyV0(),
    pruningDisabled: isCausalGraphPruningDisabledV0()
  });

  publishSpatialExecutionGovernorV0(snap);
  return snap;
}

function publishSpatialExecutionGovernorV0(snap) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spatialExecutionGovernor = Object.freeze({
    ...snap,
    runOnce: runSpatialExecutionGovernorTickV0,
    forceExternalProjection: forceExternalProjectionV0
  });
}

export function getSpatialExecutionGovernorSnapshotV0() {
  return Object.freeze({
    schema: SPATIAL_EXECUTION_GOVERNOR_SCHEMA_V0,
    tickCount: governorTickCountV0,
    lastTickAtMs: lastGovernorTickAtMsV0,
    previousNodeCount: previousNodeCountV0,
    lastShrinkGuard: lastShrinkGuardV0,
    lastBalanceFix: lastBalanceFixV0,
    lastEmitterTick: lastEmitterTickV0,
    pruningDisabled: isCausalGraphPruningDisabledV0()
  });
}

/** @internal vitest */
export function __resetSpatialExecutionGovernorForTestV0() {
  previousNodeCountV0 = 0;
  governorTickCountV0 = 0;
  lastGovernorTickAtMsV0 = 0;
  lastEmitterTickV0 = null;
  lastShrinkGuardV0 = null;
  lastBalanceFixV0 = null;
}
