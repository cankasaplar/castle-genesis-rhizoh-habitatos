/**
 * Cesium World Commit v0 — prism cube spatial objects → world map pins + Cesium sink.
 * Registers spatial nodes and commits via spatialWorldAdapter; Leaflet pin rows for fallback.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_CESIUM_WORLD_COMMIT_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { ARENA_TYPE_V0 } from "./arenaBindingLayerV0.js";
import { PRISM_CUBE_COMMIT_PHASE_V0 } from "./prismCubeCommitV0.js";
import {
  SPATIAL_NODE_TIER_V0,
  registerSpatialNodeV0
} from "./rhizohSpatialNodeLayerV0.js";
import {
  commitSpatialNodeToWorldV0,
  shouldRouteSpatialNodeToCesiumV0
} from "./spatialWorldAdapterV0.js";

export const CESIUM_WORLD_COMMIT_SCHEMA_V0 = "castle.rhizoh.cesium_world_commit.v0";

export const CESIUM_WORLD_COMMIT_PHASE_V0 = Object.freeze({
  PHASE_5_3_WORLD_SINK_COMMIT: "phase_5_3_cesium_world_sink_commit"
});

export const PRISM_CUBE_MAP_PIN_EVENT_V0 = "rhizoh:prism-cube-map-pins-v0";

const ARENA_PIN_COLOR_V0 = Object.freeze({
  [ARENA_TYPE_V0.AUTHORITY_EPISTEMIC]: "#6366f1",
  [ARENA_TYPE_V0.CHESS]: "#f59e0b",
  [ARENA_TYPE_V0.SPORTS]: "#22c55e",
  [ARENA_TYPE_V0.MEDIA]: "#94a3b8"
});

/** @type {object[]} */
const cesiumWorldCommitSignalsV0 = [];
/** @type {ReadonlyArray<object>} */
let activePrismCubeMapPinsV0 = Object.freeze([]);

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishCesiumWorldCommitSignalV0(signal, detail = {}) {
  const row = Object.freeze({
    signal,
    atMs: Date.now(),
    ...detail
  });
  cesiumWorldCommitSignalsV0.unshift(row);
  if (cesiumWorldCommitSignalsV0.length > 64) cesiumWorldCommitSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:cesium-world-commit-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {object} committedCube
 */
export function buildPrismCubeSpatialNodeV0(committedCube) {
  const spatialObject = committedCube.spatialObject || {};
  const worldPosition = spatialObject.worldPosition || committedCube.spatialSlot?.worldPosition || null;
  const logical = spatialObject.logicalPosition || committedCube.spatialSlot?.logicalPosition || null;
  const cubeId = String(committedCube.cubeId || spatialObject.cubeId || "");
  const nodeId = `prism-cube-${cubeId}`;

  return Object.freeze({
    tier: SPATIAL_NODE_TIER_V0.STATIC,
    id: nodeId,
    payload: Object.freeze({
      kind: "prism_cube_spatial_object",
      source: "cesium_world_commit_v0",
      cubeId,
      entityId: committedCube.entityId || spatialObject.entityId || null,
      slotId: spatialObject.slotId || null,
      arenaType: spatialObject.arenaType || committedCube.arenaBinding?.arenaType || null,
      lat: worldPosition?.lat ?? null,
      lon: worldPosition?.lon ?? null,
      alt: worldPosition?.alt ?? null,
      spatial_vector: logical
        ? Object.freeze({ x: logical.x, y: logical.y, z: logical.z })
        : null,
      observerRelative: spatialObject.observerRelative === true,
      mapPinEligible: spatialObject.mapPinEligible === true
    })
  });
}

/**
 * @param {object} committedCube
 */
export function buildPrismCubeMapPinRowV0(committedCube) {
  const spatialObject = committedCube.spatialObject || {};
  const worldPosition = spatialObject.worldPosition || committedCube.spatialSlot?.worldPosition || null;
  if (!worldPosition || !Number.isFinite(worldPosition.lat) || !Number.isFinite(worldPosition.lon)) {
    return null;
  }

  const arenaType = spatialObject.arenaType || committedCube.arenaBinding?.arenaType || "unknown";
  const cubeId = String(committedCube.cubeId || spatialObject.cubeId || "");
  const entityId = String(committedCube.entityId || spatialObject.entityId || "");

  return Object.freeze({
    id: `prism_cube:${cubeId}`,
    name: entityId ? `Entity ${entityId.slice(0, 8)}` : `Cube ${cubeId.slice(0, 8)}`,
    label: String(arenaType).replace(/_/g, " ").toUpperCase(),
    type: "agent",
    lat: worldPosition.lat,
    lon: worldPosition.lon,
    color: ARENA_PIN_COLOR_V0[arenaType] || "#6366f1",
    owner: worldPosition.observationOrigin?.source || "observer",
    description: `Prism cube · ${arenaType}`,
    prismCube: Object.freeze({
      cubeId,
      entityId,
      arenaType,
      slotId: spatialObject.slotId || null,
      observerRelative: spatialObject.observerRelative === true
    })
  });
}

/**
 * @param {object} committedCube
 */
export function commitPrismCubeSpatialObjectToWorldV0(committedCube) {
  const spatialObject = committedCube.spatialObject || {};
  if (!spatialObject.mapPinEligible) {
    return Object.freeze({
      ok: false,
      skipped: true,
      reason: "map_pin_not_eligible",
      cubeId: committedCube.cubeId || null
    });
  }

  const nodeShape = buildPrismCubeSpatialNodeV0(committedCube);
  const row = registerSpatialNodeV0(nodeShape.tier, nodeShape.id, nodeShape.payload);
  if (!row) {
    return Object.freeze({
      ok: false,
      reason: "spatial_node_registration_failed",
      cubeId: committedCube.cubeId || null
    });
  }

  const outcome = commitSpatialNodeToWorldV0(row);
  const mapPin = buildPrismCubeMapPinRowV0(committedCube);

  publishCesiumWorldCommitSignalV0("cesium.world.pin_committed", {
    cubeId: committedCube.cubeId,
    entityId: committedCube.entityId,
    worldCommitted: outcome.worldCommitted === true,
    deferred: outcome.deferred === true,
    arenaType: spatialObject.arenaType || null
  });

  return Object.freeze({
    ok: outcome.worldCommitted === true || outcome.deferred === true,
    worldCommitted: outcome.worldCommitted === true,
    deferred: outcome.deferred === true,
    cubeId: committedCube.cubeId,
    entityId: committedCube.entityId,
    nodeId: row.id,
    mapPin,
    sink: outcome
  });
}

/**
 * @param {ReadonlyArray<object>} pins
 */
export function setPrismCubeMapPinsV0(pins) {
  activePrismCubeMapPinsV0 = Object.freeze([...(pins || [])]);
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(PRISM_CUBE_MAP_PIN_EVENT_V0, {
        detail: Object.freeze({ pins: activePrismCubeMapPinsV0, atMs: Date.now() })
      })
    );
  }
  return activePrismCubeMapPinsV0;
}

export function getPrismCubeMapPinRowsV0() {
  return activePrismCubeMapPinsV0;
}

/**
 * @param {{ prismCubeCommit?: object }} opts
 */
export function commitPrismCubesToWorldV0(opts = {}) {
  const prismCubeCommit = opts.prismCubeCommit || null;

  if (!prismCubeCommit || prismCubeCommit.ok === false) {
    return Object.freeze({
      schema: `${CESIUM_WORLD_COMMIT_SCHEMA_V0}.result`,
      ok: false,
      error: "prism_cube_commit_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const committedCubes = Array.isArray(prismCubeCommit.committedCubes)
    ? prismCubeCommit.committedCubes
    : [];

  if (!committedCubes.length) {
    return Object.freeze({
      schema: `${CESIUM_WORLD_COMMIT_SCHEMA_V0}.result`,
      ok: false,
      error: "committed_cubes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const outcomes = committedCubes.map(commitPrismCubeSpatialObjectToWorldV0);
  const mapPins = outcomes.map((o) => o.mapPin).filter(Boolean);
  setPrismCubeMapPinsV0(mapPins);

  const worldCommittedCount = outcomes.filter((o) => o.worldCommitted).length;
  const deferredCount = outcomes.filter((o) => o.deferred).length;
  const cesiumRouteActive = shouldRouteSpatialNodeToCesiumV0();

  const commitHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: CESIUM_WORLD_COMMIT_SCHEMA_V0,
    prismCommitHead: prismCubeCommit.commitHead,
    worldCommittedCount,
    deferredCount,
    mapPinCount: mapPins.length
  });

  publishCesiumWorldCommitSignalV0("cesium.world.commit_complete", {
    worldCommittedCount,
    deferredCount,
    mapPinCount: mapPins.length,
    cesiumRouteActive
  });

  return Object.freeze({
    schema: `${CESIUM_WORLD_COMMIT_SCHEMA_V0}.result`,
    ok: true,
    commitHead,
    committedCount: committedCubes.length,
    worldCommittedCount,
    deferredCount,
    mapPinCount: mapPins.length,
    mapPins,
    outcomes: Object.freeze(outcomes),
    cesiumRouteActive,
    observationOrigin: prismCubeCommit.observationOrigin || null,
    signals: Object.freeze(cesiumWorldCommitSignalsV0.slice(0, 8)),
    realityPhase: CESIUM_WORLD_COMMIT_PHASE_V0.PHASE_5_3_WORLD_SINK_COMMIT,
    priorPhase: PRISM_CUBE_COMMIT_PHASE_V0.PHASE_5_2_SPATIAL_OBJECT_COMMIT,
    deferred: Object.freeze({
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "which_committed_spatial_objects_reached_world_sink",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastCesiumWorldCommitV0 = null;

export function getLastCesiumWorldCommitV0() {
  return lastCesiumWorldCommitV0;
}

export function setLastCesiumWorldCommitV0(result) {
  lastCesiumWorldCommitV0 = result;
  return result;
}

export function getCesiumWorldCommitSignalsV0() {
  return Object.freeze([...cesiumWorldCommitSignalsV0]);
}

export function ensureCesiumWorldCommitV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.commitPrismCubesToWorld) {
    window.__rhizoh.commitPrismCubesToWorld = (opts) => {
      const result = commitPrismCubesToWorldV0(opts);
      if (result.ok !== false) setLastCesiumWorldCommitV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.cesiumWorldCommit) {
    window.__rhizoh.cesiumWorldCommit = () => getLastCesiumWorldCommitV0();
  }
  if (!window.__rhizoh.prismCubeMapPins) {
    window.__rhizoh.prismCubeMapPins = () => getPrismCubeMapPinRowsV0();
  }
  if (!window.__rhizoh.cesiumWorldCommitSignals) {
    window.__rhizoh.cesiumWorldCommitSignals = () => getCesiumWorldCommitSignalsV0();
  }

  return window.__rhizoh.commitPrismCubesToWorld;
}

/** @internal vitest */
export function resetCesiumWorldCommitForTestV0() {
  lastCesiumWorldCommitV0 = null;
  cesiumWorldCommitSignalsV0.length = 0;
  activePrismCubeMapPinsV0 = Object.freeze([]);
}
