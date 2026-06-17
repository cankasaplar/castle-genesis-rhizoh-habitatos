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
import {
  CASTLE_CESIUM_COMMAND_READY_EVENT_V0
} from "./rhizohSpatialReadyGateV0.js";
import { getSpatialExecutionTickSnapshotV0 } from "./spatialExecutionTickV0.js";

export const SPATIAL_WORLD_ADAPTER_SCHEMA_V0 = "castle.rhizoh.spatial_world_adapter.v0";
export const SPATIAL_SINK_MISSING_CODE_V0 = "SPATIAL_SINK_MISSING";

/** @type {Set<string>} */
const committedNodeKeysV0 = new Set();

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
 * Resolve WGS84 from spatial node payload + world anchor.
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
 * Sink validation — assert world adapter present when spatial nodes exist.
 */
export function validateSpatialSinkV0() {
  const api =
    getCesiumExecutorApiV0() ||
    (typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null);
  const commandReady = isCesiumExecutorCommandReadyV0(api);
  const hasCommitSurface = typeof api?.commitSpatialNode === "function";
  const spatialCount = listSpatialNodesV0().length;
  const sinkMissing = spatialCount > 0 && !commandReady && !hasCommitSurface;

  const snap = Object.freeze({
    schema: SPATIAL_WORLD_ADAPTER_SCHEMA_V0,
    ok: !sinkMissing,
    code: sinkMissing ? SPATIAL_SINK_MISSING_CODE_V0 : null,
    sink:
      commandReady && hasCommitSurface
        ? "cesium"
        : api
          ? "cesium_deferred"
          : "missing",
    commandReady,
    hasCommitSurface,
    attached: adapterAttachedV0,
    spatialNodeCount: spatialCount,
    committedCount: committedNodeKeysV0.size,
    backlog: Math.max(0, spatialCount - committedNodeKeysV0.size),
    atMs: Date.now()
  });

  lastSinkValidationV0 = snap;
  publishSpatialWorldAdapterV0({ sink: snap });
  return snap;
}

/**
 * Commit one spatial node into world/Cesium sink.
 * @param {object} node
 */
export function commitSpatialNodeToWorldV0(node) {
  if (!node?.id) {
    return Object.freeze({ ok: false, reason: "missing_node" });
  }

  const key = spatialNodeKeyV0(node);
  if (committedNodeKeysV0.has(key)) {
    return Object.freeze({ ok: true, already: true, key });
  }

  const geo = resolveSpatialNodeGeoV0(node);
  const result = executeCesiumCommandV0({
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
  });

  if (result.ok === true || result.deferred === true) {
    committedNodeKeysV0.add(key);
  }

  return Object.freeze({
    ok: result.ok === true,
    deferred: result.deferred === true,
    key,
    geo,
    result
  });
}

/**
 * Drain spatial registry stream into world sink (idempotent per node key).
 * @param {{ force?: boolean }} [opts]
 */
export function drainSpatialStreamToWorldV0(opts = {}) {
  const nodes = listSpatialNodesV0();
  let committed = 0;
  let deferred = 0;
  let failed = 0;
  let skipped = 0;

  for (const node of nodes) {
    const key = spatialNodeKeyV0(node);
    if (committedNodeKeysV0.has(key)) {
      skipped += 1;
      continue;
    }
    const outcome = commitSpatialNodeToWorldV0(node);
    if (outcome.ok && !outcome.deferred) committed += 1;
    else if (outcome.deferred) deferred += 1;
    else failed += 1;
  }

  const sink = validateSpatialSinkV0();
  if (opts.force === true && sink.code === SPATIAL_SINK_MISSING_CODE_V0) {
    console.warn("[Rhizoh][spatialWorldAdapter] SPATIAL_SINK_MISSING — stream draining to backlog only");
  }

  lastDrainV0 = Object.freeze({
    ok: true,
    atMs: Date.now(),
    committed,
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

/**
 * Attach spatial stream consumer (spatial-event + cesium-ready).
 */
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
  publishSpatialWorldAdapterV0();
  return { ok: true, attached: true };
}

/**
 * Attach + drain when spatial execution loop is active and emitter produced diff.
 * @param {{ executionRunning?: boolean, emitterActivated?: boolean }} [opts]
 */
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
    committedCount: committedNodeKeysV0.size,
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
    validateSink: validateSpatialSinkV0
  });
}

/** @internal vitest */
export function __resetSpatialWorldAdapterForTestV0() {
  if (stopAdapterWireV0) stopAdapterWireV0();
  committedNodeKeysV0.clear();
  adapterAttachedV0 = false;
  lastDrainV0 = null;
  lastSinkValidationV0 = null;
}
