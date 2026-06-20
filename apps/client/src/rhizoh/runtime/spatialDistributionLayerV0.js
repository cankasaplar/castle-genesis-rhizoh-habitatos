/**
 * Spatial Distribution Layer v0 — pin spread, tower registry, SpiralMMO map layers.
 * Projection places pins; distribution separates colliding coordinates.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPATIAL_DISTRIBUTION_LAYER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { ARENA_TYPE_V0 } from "./arenaBindingLayerV0.js";
import { CESIUM_WORLD_COMMIT_PHASE_V0 } from "./cesiumWorldCommitV0.js";
import { setPrismCubeMapPinsV0 } from "./cesiumWorldCommitV0.js";

export const SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0 = "castle.rhizoh.spatial_distribution_layer.v0";

export const SPATIAL_DISTRIBUTION_PHASE_V0 = Object.freeze({
  PHASE_5_0_SPIRAL_WORLD_LAYER: "phase_5_0_spiral_mmo_world_layer"
});

export const SPIRAL_MAP_LAYER_V0 = Object.freeze({
  EXPLORER: "explorer",
  CASTLE: "castle",
  ECONOMY: "economy",
  SEASONAL: "seasonal"
});

export const TOWER_CLASS_V0 = Object.freeze({
  AUTHORITY_EPISTEMIC: "AUTHORITY_EPISTEMIC",
  CASTLE: "CASTLE",
  RESEARCH: "RESEARCH",
  ACADEMY: "ACADEMY",
  SPORTS: "SPORTS",
  CHESS: "CHESS",
  MEDIA: "MEDIA",
  LLM: "LLM",
  ECONOMY: "ECONOMY",
  TRAVEL: "TRAVEL",
  GHOST: "GHOST",
  EXPLORER: "EXPLORER"
});

/** Golden-angle spiral — deterministic pin separation (~220m per ring step at mid-lat). */
const DISTRIBUTION_RING_DEGREE_V0 = 0.002;
const GOLDEN_ANGLE_RAD_V0 = (137.508 * Math.PI) / 180;
const LOGICAL_GRID_SCALE_V0 = 0.0012;

/** @type {object[]} */
const spatialDistributionSignalsV0 = [];

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishSpatialDistributionSignalV0(signal, detail = {}) {
  const row = Object.freeze({
    signal,
    atMs: Date.now(),
    ...detail
  });
  spatialDistributionSignalsV0.unshift(row);
  if (spatialDistributionSignalsV0.length > 64) spatialDistributionSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:spatial-distribution-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {string} arenaType
 * @param {string} [towerClassOverride]
 */
export function resolveTowerClassV0(arenaType, towerClassOverride = null) {
  if (towerClassOverride && TOWER_CLASS_V0[towerClassOverride]) {
    return TOWER_CLASS_V0[towerClassOverride];
  }

  const type = String(arenaType || "").trim();
  const map = Object.freeze({
    [ARENA_TYPE_V0.AUTHORITY_EPISTEMIC]: TOWER_CLASS_V0.AUTHORITY_EPISTEMIC,
    [ARENA_TYPE_V0.CHESS]: TOWER_CLASS_V0.CHESS,
    [ARENA_TYPE_V0.SPORTS]: TOWER_CLASS_V0.SPORTS,
    [ARENA_TYPE_V0.MEDIA]: TOWER_CLASS_V0.MEDIA,
    castle: TOWER_CLASS_V0.CASTLE,
    research: TOWER_CLASS_V0.RESEARCH,
    academy: TOWER_CLASS_V0.ACADEMY,
    llm: TOWER_CLASS_V0.LLM,
    economy: TOWER_CLASS_V0.ECONOMY,
    travel: TOWER_CLASS_V0.TRAVEL,
    ghost: TOWER_CLASS_V0.GHOST,
    explorer: TOWER_CLASS_V0.EXPLORER
  });

  return map[type] || TOWER_CLASS_V0.AUTHORITY_EPISTEMIC;
}

/**
 * @param {string} towerClass
 */
export function resolveSpiralMapLayerV0(towerClass) {
  const tc = String(towerClass || TOWER_CLASS_V0.AUTHORITY_EPISTEMIC);
  const layerMap = Object.freeze({
    [TOWER_CLASS_V0.TRAVEL]: SPIRAL_MAP_LAYER_V0.EXPLORER,
    [TOWER_CLASS_V0.EXPLORER]: SPIRAL_MAP_LAYER_V0.EXPLORER,
    [TOWER_CLASS_V0.GHOST]: SPIRAL_MAP_LAYER_V0.EXPLORER,
    [TOWER_CLASS_V0.CHESS]: SPIRAL_MAP_LAYER_V0.EXPLORER,
    [TOWER_CLASS_V0.SPORTS]: SPIRAL_MAP_LAYER_V0.EXPLORER,
    [TOWER_CLASS_V0.AUTHORITY_EPISTEMIC]: SPIRAL_MAP_LAYER_V0.CASTLE,
    [TOWER_CLASS_V0.CASTLE]: SPIRAL_MAP_LAYER_V0.CASTLE,
    [TOWER_CLASS_V0.RESEARCH]: SPIRAL_MAP_LAYER_V0.CASTLE,
    [TOWER_CLASS_V0.ACADEMY]: SPIRAL_MAP_LAYER_V0.CASTLE,
    [TOWER_CLASS_V0.LLM]: SPIRAL_MAP_LAYER_V0.CASTLE,
    [TOWER_CLASS_V0.ECONOMY]: SPIRAL_MAP_LAYER_V0.ECONOMY,
    [TOWER_CLASS_V0.MEDIA]: SPIRAL_MAP_LAYER_V0.ECONOMY
  });
  return layerMap[tc] || SPIRAL_MAP_LAYER_V0.CASTLE;
}

export function buildTowerRegistrySnapshotV0() {
  return Object.freeze({
    schema: `${SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0}.tower_registry`,
    towerClasses: Object.freeze({ ...TOWER_CLASS_V0 }),
    spiralMapLayers: Object.freeze({
      [SPIRAL_MAP_LAYER_V0.EXPLORER]: Object.freeze({
        id: SPIRAL_MAP_LAYER_V0.EXPLORER,
        label: "Explorer Map",
        pinTypes: Object.freeze(["TRAVEL", "EXPLORER", "GHOST", "CHESS", "SPORTS"]),
        purpose: "discover_observe_collect"
      }),
      [SPIRAL_MAP_LAYER_V0.CASTLE]: Object.freeze({
        id: SPIRAL_MAP_LAYER_V0.CASTLE,
        label: "Castle Map",
        pinTypes: Object.freeze([
          "CASTLE",
          "GHOST",
          "RESEARCH",
          "ACADEMY",
          "AUTHORITY_EPISTEMIC",
          "LLM"
        ]),
        purpose: "settlement_learning_creation"
      }),
      [SPIRAL_MAP_LAYER_V0.ECONOMY]: Object.freeze({
        id: SPIRAL_MAP_LAYER_V0.ECONOMY,
        label: "Economy Map",
        pinTypes: Object.freeze(["ECONOMY", "MEDIA", "PRODUCT", "DESIGN", "MARKET", "SHOP"]),
        purpose: "create_sell_fund"
      }),
      [SPIRAL_MAP_LAYER_V0.SEASONAL]: Object.freeze({
        id: SPIRAL_MAP_LAYER_V0.SEASONAL,
        label: "Seasonal Map",
        pinTypes: Object.freeze(["SEASONAL_EVENT", "MIGRATION", "WORLD_STORY"]),
        purpose: "ephemeral_cycle_events",
        ephemeral: true
      })
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{ x?: number, y?: number, z?: number } | null} logicalPosition
 * @param {number} index
 * @param {number} collisionIndex
 */
export function computeDistributionOffsetV0(logicalPosition, index, collisionIndex = 0) {
  const x = Number(logicalPosition?.x) || 0;
  const y = Number(logicalPosition?.y) || 0;
  const z = Number(logicalPosition?.z) || 0;

  const logicalLat = y * LOGICAL_GRID_SCALE_V0;
  const logicalLon = x * LOGICAL_GRID_SCALE_V0;

  const ring = collisionIndex + 1;
  const angle = index * GOLDEN_ANGLE_RAD_V0;
  const spiralLat = ring * DISTRIBUTION_RING_DEGREE_V0 * Math.cos(angle);
  const spiralLon = ring * DISTRIBUTION_RING_DEGREE_V0 * Math.sin(angle);

  return Object.freeze({
    dLat: logicalLat + spiralLat,
    dLon: logicalLon + spiralLon,
    dAlt: z * 40,
    method:
      collisionIndex > 0 ? "golden_angle_spiral_v0" : "logical_grid_plus_spiral_v0",
    collisionIndex,
    index
  });
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} precision
 */
function coordKeyV0(lat, lon, precision = 5) {
  const f = 10 ** precision;
  return `${Math.round(lat * f)}:${Math.round(lon * f)}`;
}

/**
 * @param {object} pin
 * @param {object} committedCube
 * @param {number} index
 * @param {Map<string, number>} collisionCounts
 */
export function distributeMapPinV0(pin, committedCube, index, collisionCounts) {
  const worldPosition =
    committedCube?.spatialObject?.worldPosition ||
    committedCube?.spatialSlot?.worldPosition ||
    null;
  const logical =
    committedCube?.spatialObject?.logicalPosition ||
    committedCube?.spatialSlot?.logicalPosition ||
    { x: 0, y: 0, z: 0 };

  const baseLat = Number(worldPosition?.lat ?? pin.lat);
  const baseLon = Number(worldPosition?.lon ?? pin.lon);
  const baseAlt = Number(worldPosition?.alt ?? 120);

  const key = coordKeyV0(baseLat, baseLon);
  const collisionIndex = collisionCounts.get(key) || 0;
  collisionCounts.set(key, collisionIndex + 1);

  const offset = computeDistributionOffsetV0(logical, index, collisionIndex);
  const arenaType = pin.prismCube?.arenaType || committedCube?.arenaBinding?.arenaType || null;
  const towerClass = resolveTowerClassV0(arenaType);
  const spiralLayer = resolveSpiralMapLayerV0(towerClass);

  const distributedLat = baseLat + offset.dLat;
  const distributedLon = baseLon + offset.dLon;
  const distributedAlt = baseAlt + offset.dAlt;

  publishSpatialDistributionSignalV0("spatial.distribution.spread", {
    pinId: pin.id,
    towerClass,
    spiralLayer,
    collisionIndex,
    method: offset.method
  });

  return Object.freeze({
    ...pin,
    lat: distributedLat,
    lon: distributedLon,
    label: towerClass,
    towerClass,
    spiralLayer,
    distribution: Object.freeze({
      schema: `${SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0}.pin_distribution`,
      baseLat,
      baseLon,
      distributedLat,
      distributedLon,
      offset,
      collisionIndex,
      interpretationOnly: true,
      nonExecutive: true
    }),
    prismCube: Object.freeze({
      ...(pin.prismCube || {}),
      towerClass,
      spiralLayer,
      distributed: true
    })
  });
}

/**
 * @param {object} committedCube
 * @param {object} distributedPin
 */
export function applyDistributionToCommittedCubeV0(committedCube, distributedPin) {
  const dist = distributedPin.distribution;
  if (!dist) return committedCube;

  const baseAlt = Number(
    committedCube.spatialObject?.worldPosition?.alt ??
      committedCube.spatialSlot?.worldPosition?.alt ??
      120
  );

  const worldPosition = Object.freeze({
    ...(committedCube.spatialObject?.worldPosition || committedCube.spatialSlot?.worldPosition || {}),
    lat: dist.distributedLat,
    lon: dist.distributedLon,
    alt: baseAlt + (dist.offset?.dAlt || 0),
    distributed: true,
    distributionMethod: dist.offset?.method || null,
    towerClass: distributedPin.towerClass,
    spiralLayer: distributedPin.spiralLayer
  });

  return Object.freeze({
    ...committedCube,
    spatialObject: Object.freeze({
      ...(committedCube.spatialObject || {}),
      worldPosition,
      towerClass: distributedPin.towerClass,
      spiralLayer: distributedPin.spiralLayer,
      distributed: true
    }),
    spatialSlot: committedCube.spatialSlot
      ? Object.freeze({
          ...committedCube.spatialSlot,
          worldPosition
        })
      : committedCube.spatialSlot
  });
}

/**
 * @param {{ cesiumWorldCommit?: object, prismCubeCommit?: object }} opts
 */
export function distributeSpatialPinsV0(opts = {}) {
  const cesiumWorldCommit = opts.cesiumWorldCommit || null;
  const prismCubeCommit = opts.prismCubeCommit || null;

  if (!cesiumWorldCommit || cesiumWorldCommit.ok === false) {
    return Object.freeze({
      schema: `${SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "cesium_world_commit_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const mapPins = Array.isArray(cesiumWorldCommit.mapPins) ? cesiumWorldCommit.mapPins : [];
  const committedCubes = Array.isArray(prismCubeCommit?.committedCubes)
    ? prismCubeCommit.committedCubes
    : [];

  if (!mapPins.length) {
    return Object.freeze({
      schema: `${SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "map_pins_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  /** @type {Map<string, number>} */
  const collisionCounts = new Map();
  const distributedPins = mapPins.map((pin, index) => {
    const cube =
      committedCubes.find((c) => `prism_cube:${c.cubeId}` === pin.id) || committedCubes[index] || null;
    return distributeMapPinV0(pin, cube, index, collisionCounts);
  });

  const distributedCubes = committedCubes.map((cube, index) => {
    const pin = distributedPins.find((p) => p.prismCube?.cubeId === cube.cubeId) || distributedPins[index];
    return pin ? applyDistributionToCommittedCubeV0(cube, pin) : cube;
  });

  setPrismCubeMapPinsV0(distributedPins);

  const spreadCount = distributedPins.filter((p) => (p.distribution?.collisionIndex || 0) > 0).length;
  const uniqueCoords = new Set(
    distributedPins.map((p) => coordKeyV0(p.lat, p.lon))
  ).size;

  const distributionHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0,
    cesiumCommitHead: cesiumWorldCommit.commitHead,
    pinCount: distributedPins.length,
    uniqueCoords
  });

  publishSpatialDistributionSignalV0("spatial.distribution.layer_assigned", {
    pinCount: distributedPins.length,
    uniqueCoords,
    spreadCount
  });
  publishSpatialDistributionSignalV0("spatial.distribution.complete", {
    uniqueCoords,
    spreadCount
  });

  return Object.freeze({
    schema: `${SPATIAL_DISTRIBUTION_LAYER_SCHEMA_V0}.result`,
    ok: true,
    distributionHead,
    distributedCount: distributedPins.length,
    uniqueCoordinateCount: uniqueCoords,
    spreadCount,
    distributedPins: Object.freeze(distributedPins),
    distributedCubes: Object.freeze(distributedCubes),
    towerRegistry: buildTowerRegistrySnapshotV0(),
    observationOrigin: cesiumWorldCommit.observationOrigin || prismCubeCommit?.observationOrigin || null,
    signals: Object.freeze(spatialDistributionSignalsV0.slice(0, 8)),
    realityPhase: SPATIAL_DISTRIBUTION_PHASE_V0.PHASE_5_0_SPIRAL_WORLD_LAYER,
    priorPhase: CESIUM_WORLD_COMMIT_PHASE_V0.PHASE_5_3_WORLD_SINK_COMMIT,
    deferred: Object.freeze({
      seasonalEphemeralPins: true,
      mediaLedgerization: true,
      workerConsensus: true,
      chessArenaIngest: true
    }),
    question: "how_are_epistemic_pins_distributed_across_the_world_mesh",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastSpatialDistributionV0 = null;

export function getLastSpatialDistributionV0() {
  return lastSpatialDistributionV0;
}

export function setLastSpatialDistributionV0(result) {
  lastSpatialDistributionV0 = result;
  return result;
}

export function getSpatialDistributionSignalsV0() {
  return Object.freeze([...spatialDistributionSignalsV0]);
}

export function ensureSpatialDistributionLayerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.distributeSpatialPins) {
    window.__rhizoh.distributeSpatialPins = (opts) => {
      const result = distributeSpatialPinsV0(opts);
      if (result.ok !== false) setLastSpatialDistributionV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.spatialDistribution) {
    window.__rhizoh.spatialDistribution = () => getLastSpatialDistributionV0();
  }
  if (!window.__rhizoh.towerRegistry) {
    window.__rhizoh.towerRegistry = () => buildTowerRegistrySnapshotV0();
  }
  if (!window.__rhizoh.spatialDistributionSignals) {
    window.__rhizoh.spatialDistributionSignals = () => getSpatialDistributionSignalsV0();
  }

  return window.__rhizoh.distributeSpatialPins;
}

/** @internal vitest */
export function resetSpatialDistributionForTestV0() {
  lastSpatialDistributionV0 = null;
  spatialDistributionSignalsV0.length = 0;
}
