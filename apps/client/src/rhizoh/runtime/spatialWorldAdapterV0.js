/**
 * Spatial World Adapter v0 — consumer/sink: spatial stream → Cesium world commit.
 * RESEARCH-ONLY — closes orphan spatial emission (execution without sink).
 *
 * Pipeline: spatialEmitter → worldAdapter.attach(stream) → cesium.commit()
 */

import { RHIZOH_SPATIAL_EVENT_V0 } from "./rhizohSpatialEventEmitterV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import {
  executeCesiumCommandV0,
  getCesiumExecutorApiV0,
  isCesiumExecutorCommandReadyV0
} from "../../castleFlight/cesiumCommandExecutorV0.js";
import { routeCesiumCommandV0 } from "../../castleFlight/cesiumCommandRouterV0.js";
import {
  CASTLE_CESIUM_COMMAND_READY_EVENT_V0
} from "./rhizohSpatialReadyGateV0.js";
import { getSpatialExecutionTickSnapshotV0 } from "./spatialExecutionTickV0.js";
import {
  publishSpatialSinkRegistriesV0,
  resolveSpatialSinkProbeV0
} from "./spatialWorldSinkProbeV0.js";

export const SPATIAL_WORLD_ADAPTER_SCHEMA_V0 = "castle.rhizoh.spatial_world_adapter.v0";
export const SPATIAL_SINK_MISSING_CODE_V0 = "SPATIAL_SINK_MISSING";

/** @type {Set<string>} */
const worldCommittedKeysV0 = new Set();
/** @type {Set<string>} */
const deferredKeysV0 = new Set();

let adapterAttachedV0 = false;
/** @type {(() => void) | null} */
let stopAdapterWireV0 = null;
/** @type {object | null} */
let lastDrainV0 = null;
/** @type {object | null} */
let lastSinkValidationV0 = null;

/**
 * @param {object} node
 */
export function spatialNodeKeyV0(node) {
  const tier = String(node?.tier || "node");
  const id = String(node?.id || node?.nodeId || "");
  return `${tier}:${id}`;
}

/**
 * @param {object} node
 */
export function resolveSpatialNodeGeoV0(node) {
  const payload = node?.payload && typeof node.payload === "object" ? node.payload : node || {};
  const vec = payload.spatial_vector;
  const geo =
    typeof window !== "undefined" && window.__CASTLE_NEXUS_GEO__
      ? window.__CASTLE_NEXUS_GEO__
      : null;
  let lat = Number(geo?.lat);
  let lon = Number(geo?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    lat = 41.045;
    lon = 29.006;
  }
  let alt = 120;
  if (vec && Number.isFinite(Number(vec.x)) && Number.isFinite(Number(vec.y))) {
    lat += Number(vec.y) * 0.0008;
    lon += Number(vec.x) * 0.0008;
    alt += Number(vec.z || 0) * 40;
  }
  return Object.freeze({ lat, lon, alt });
}

/**
 * Sink validation — honest world commit surface probe (not adapter-level accept).
 */
export function validateSpatialSinkV0() {
  const probe = resolveSpatialSinkProbeV0();
  const spatialCount = listSpatialNodesV0().length;
  const worldCommittedCount = worldCommittedKeysV0.size;
  const deferredCount = deferredKeysV0.size;
  const backlog = Math.max(0, spatialCount - worldCommittedCount);

  const sinkMissing =
    spatialCount > 0 &&
    worldCommittedCount === 0 &&
    !probe.commandReady &&
    !probe.hasCommitSurface;

  const snap = Object.freeze({
    schema: SPATIAL_WORLD_ADAPTER_SCHEMA_V0,
    ok: !sinkMissing,
    code: sinkMissing ? SPATIAL_SINK_MISSING_CODE_V0 : null,
    sink: probe.sink,
    commandReady: probe.commandReady,
    hasCommitSurface: probe.hasCommitSurface,
    hasExecutorApi: probe.hasExecutorApi,
    worldLayerEnabled: probe.worldLayerEnabled,
    cesiumLayerActive: probe.cesiumLayerActive,
    layerGateAllowed: probe.layerGateAllowed,
    layerGateReason: probe.layerGateReason,
    attached: adapterAttachedV0,
    spatialNodeCount: spatialCount,
    worldCommittedCount,
    deferredCount,
    /** @deprecated use worldCommittedCount — kept for one release of console scripts */
    committedCount: worldCommittedCount,
    backlog,
    probe,
    atMs: Date.now()
  });

  lastSinkValidationV0 = snap;
  publishSpatialWorldAdapterV0({ sink: snap });
  publishSpatialSinkRegistriesV0({ adapter: snap });
  return snap;
}

/**
 * Retry deferred commits after Cesium / commit surface becomes available.
 */
export function retryDeferredSpatialCommitsV0() {
  const pending = [...deferredKeysV0];
  deferredKeysV0.clear();
  let worldCommitted = 0;
  let stillDeferred = 0;
  let failed = 0;

  for (const key of pending) {
    const node = listSpatialNodesV0().find((n) => spatialNodeKeyV0(n) === key);
    if (!node) continue;
    const outcome = commitSpatialNodeToWorldV0(node, { retry: true });
    if (outcome.worldCommitted) worldCommitted += 1;
    else if (outcome.deferred) stillDeferred += 1;
    else failed += 1;
  }

  return Object.freeze({
    ok: true,
    retried: pending.length,
    worldCommitted,
    stillDeferred,
    failed
  });
}

/**
 * Commit one spatial node into world/Cesium sink.
 * @param {object} node
 * @param {{ retry?: boolean }} [opts]
 */
export function commitSpatialNodeToWorldV0(node, opts = {}) {
  if (!node?.id) {
    return Object.freeze({ ok: false, reason: "missing_node", worldCommitted: false });
  }

  const key = spatialNodeKeyV0(node);
  if (!opts.retry && worldCommittedKeysV0.has(key)) {
    return Object.freeze({ ok: true, already: true, key, worldCommitted: true });
  }

  const geo = resolveSpatialNodeGeoV0(node);
  const request = {
    schema: "castle.cesium_executor.request.v0",
    op: "commit_spatial_node",
    source: "spatial_world_adapter",
    geo,
    meta: Object.freeze({
      spatialNode: node,
      nodeId: node.id,
      tier: node.tier,
      kind: node.payload?.kind || null
    })
  };

  const result = routeCesiumCommandV0(request);
  const worldCommitted = result.ok === true;
  const deferred = result.deferred === true;

  if (worldCommitted) {
    worldCommittedKeysV0.add(key);
    deferredKeysV0.delete(key);
  } else if (deferred) {
    deferredKeysV0.add(key);
  }

  return Object.freeze({
    ok: worldCommitted,
    deferred,
    failed: !worldCommitted && !deferred,
    worldCommitted,
    key,
    geo,
    result
  });
}

/**
 * @param {{ force?: boolean }} [opts]
 */
export function drainSpatialStreamToWorldV0(opts = {}) {
  const nodes = listSpatialNodesV0();
  let worldCommitted = 0;
  let deferred = 0;
  let failed = 0;
  let skipped = 0;

  for (const node of nodes) {
    const key = spatialNodeKeyV0(node);
    if (worldCommittedKeysV0.has(key)) {
      skipped += 1;
      continue;
    }
    const outcome = commitSpatialNodeToWorldV0(node);
    if (outcome.worldCommitted) worldCommitted += 1;
    else if (outcome.deferred) deferred += 1;
    else failed += 1;
  }

  const sink = validateSpatialSinkV0();
  if (opts.force === true && sink.code === SPATIAL_SINK_MISSING_CODE_V0) {
    console.warn(
      "[Rhizoh][spatialWorldAdapter] SPATIAL_SINK_MISSING",
      {
        sink: sink.sink,
        layerGateReason: sink.layerGateReason,
        deferred,
        worldCommitted
      }
    );
  }

  lastDrainV0 = Object.freeze({
    ok: true,
    atMs: Date.now(),
    worldCommitted,
    deferred,
    failed,
    skipped,
    processed: nodes.length,
    backlog: sink.backlog,
    sink
  });

  publishSpatialWorldAdapterV0({ lastDrain: lastDrainV0 });
  return lastDrainV0;
}

export function attachSpatialWorldAdapterV0() {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  if (adapterAttachedV0) {
    publishSpatialWorldAdapterV0();
    return { ok: true, already: true, attached: true };
  }

  const onSpatial = (event) => {
    const row = event?.detail?.row;
    if (row?.id) commitSpatialNodeToWorldV0(row);
  };
  const onCesiumReady = () => {
    retryDeferredSpatialCommitsV0();
    drainSpatialStreamToWorldV0({ force: true });
  };

  window.addEventListener(RHIZOH_SPATIAL_EVENT_V0, onSpatial);
  window.addEventListener(CASTLE_CESIUM_COMMAND_READY_EVENT_V0, onCesiumReady);

  stopAdapterWireV0 = () => {
    window.removeEventListener(RHIZOH_SPATIAL_EVENT_V0, onSpatial);
    window.removeEventListener(CASTLE_CESIUM_COMMAND_READY_EVENT_V0, onCesiumReady);
    adapterAttachedV0 = false;
    stopAdapterWireV0 = null;
  };

  adapterAttachedV0 = true;
  publishSpatialSinkRegistriesV0();
  publishSpatialWorldAdapterV0();
  return { ok: true, attached: true };
}

export function ensureSpatialWorldAdapterForExecutionV0(opts = {}) {
  const tick = getSpatialExecutionTickSnapshotV0();
  const executionRunning = opts.executionRunning ?? tick.running === true;
  const emitterActivated = opts.emitterActivated === true;

  attachSpatialWorldAdapterV0();

  if (!executionRunning) {
    return Object.freeze({
      ok: true,
      attached: adapterAttachedV0,
      drained: false,
      reason: "execution_not_running"
    });
  }

  if (!emitterActivated) {
    return Object.freeze({
      ok: true,
      attached: adapterAttachedV0,
      drained: false,
      reason: "emitter_inactive"
    });
  }

  const drain = drainSpatialStreamToWorldV0({ force: true });
  return Object.freeze({
    ok: true,
    attached: adapterAttachedV0,
    drained: true,
    drain
  });
}

export function isSpatialWorldAdapterAttachedV0() {
  return adapterAttachedV0;
}

export function getSpatialWorldAdapterSnapshotV0() {
  return Object.freeze({
    schema: SPATIAL_WORLD_ADAPTER_SCHEMA_V0,
    attached: adapterAttachedV0,
    worldCommittedCount: worldCommittedKeysV0.size,
    deferredCount: deferredKeysV0.size,
    committedCount: worldCommittedKeysV0.size,
    lastDrain: lastDrainV0,
    lastSinkValidation: lastSinkValidationV0 || validateSpatialSinkV0()
  });
}

function publishSpatialWorldAdapterV0(extra = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spatialWorldAdapter = Object.freeze({
    ...getSpatialWorldAdapterSnapshotV0(),
    ...extra,
    attach: attachSpatialWorldAdapterV0,
    drain: drainSpatialStreamToWorldV0,
    validateSink: validateSpatialSinkV0,
    retryDeferred: retryDeferredSpatialCommitsV0,
    probeSink: resolveSpatialSinkProbeV0
  });
}

/** @internal vitest */
export function __resetSpatialWorldAdapterForTestV0() {
  if (stopAdapterWireV0) stopAdapterWireV0();
  worldCommittedKeysV0.clear();
  deferredKeysV0.clear();
  adapterAttachedV0 = false;
  lastDrainV0 = null;
  lastSinkValidationV0 = null;
}
