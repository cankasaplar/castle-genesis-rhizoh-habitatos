/**
 * Spatial Slot Resolver v0 — logical_epistemic_grid → world_position projection.
 * Arena-bound cubes gain WGS84 epistemic coordinates; Cesium commit deferred.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import {
  getRhizohCalibrationRootAnchorV0,
  RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
} from "../spatial/geographicAnchorsV0.js";
import { SPATIAL_COORDINATE_SPACE_V0 } from "./spatialAllocationLayerV0.js";
import { ARENA_BINDING_PHASE_V0 } from "./arenaBindingLayerV0.js";

export const SPATIAL_SLOT_RESOLVER_SCHEMA_V0 = "castle.rhizoh.spatial_slot_resolver.v0";

export const WORLD_COORDINATE_SPACE_V0 = Object.freeze({
  WGS84_EPISTEMIC_PROJECTION: "wgs84_epistemic_projection"
});

export const SPATIAL_SLOT_RESOLVER_METHOD_V0 = Object.freeze({
  LOGICAL_GRID_CALIBRATION_ROOT: "logical_grid_calibration_root_v0"
});

export const SPATIAL_SLOT_RESOLVER_PHASE_V0 = Object.freeze({
  PHASE_5_1_WORLD_PROJECTION: "phase_5_1_logical_to_world_projection"
});

/** Matches spatialWorldAdapterV0 vec scale for sink compatibility */
const GRID_LON_LAT_DEGREE_SCALE_V0 = 0.0008;
const GRID_ALT_METERS_SCALE_V0 = 40;
const BASE_ALT_METERS_V0 = 120;

/** @type {object[]} */
const spatialSlotResolverSignalsV0 = [];

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishSpatialSlotResolverSignalV0(signal, detail = {}) {
  const row = Object.freeze({
    signal,
    atMs: Date.now(),
    ...detail
  });
  spatialSlotResolverSignalsV0.unshift(row);
  if (spatialSlotResolverSignalsV0.length > 64) spatialSlotResolverSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:spatial-slot-resolver-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {{ x?: number, y?: number, z?: number } | null | undefined} logicalPosition
 * @param {{ originAnchor?: object }} [opts]
 */
export function resolveLogicalToWorldPositionV0(logicalPosition, opts = {}) {
  const anchor = opts.originAnchor || getRhizohCalibrationRootAnchorV0();
  const x = Number(logicalPosition?.x) || 0;
  const y = Number(logicalPosition?.y) || 0;
  const z = Number(logicalPosition?.z) || 0;

  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.world_position`,
    lat: anchor.lat + y * GRID_LON_LAT_DEGREE_SCALE_V0,
    lon: anchor.lon + x * GRID_LON_LAT_DEGREE_SCALE_V0,
    alt: BASE_ALT_METERS_V0 + z * GRID_ALT_METERS_SCALE_V0,
    coordinateSpace: WORLD_COORDINATE_SPACE_V0.WGS84_EPISTEMIC_PROJECTION,
    originAnchorId: anchor.id || RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
    resolverMethod: SPATIAL_SLOT_RESOLVER_METHOD_V0.LOGICAL_GRID_CALIBRATION_ROOT,
    logicalSource: Object.freeze({ x, y, z }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} boundCube
 */
function buildEventAnchorV0(boundCube, worldPosition) {
  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.event_anchor`,
    entityId: boundCube.entityId || null,
    cubeId: boundCube.cubeId || null,
    slotId: boundCube.spatialSlot?.slotId || null,
    worldPosition,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} boundCube
 */
function buildActionSurfacePrepV0(boundCube) {
  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.action_surface_prep`,
    status: "armed",
    reason: "world_position_resolved",
    entityId: boundCube.entityId || null,
    cubeId: boundCube.cubeId || null,
    commitDeferred: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} boundCube
 * @param {{ originAnchor?: object }} [opts]
 */
export function resolveBoundCubeSpatialSlotV0(boundCube, opts = {}) {
  const logicalPosition =
    boundCube?.spatialSlot?.logicalPosition ||
    boundCube?.spatialBinding?.spatialSlot?.logicalPosition ||
    { x: 0, y: 0, z: 0 };

  const worldPosition = resolveLogicalToWorldPositionV0(logicalPosition, opts);
  const eventAnchor = buildEventAnchorV0(boundCube, worldPosition);

  const spatialSlot = Object.freeze({
    ...(boundCube.spatialSlot || {}),
    slotId: boundCube.spatialSlot?.slotId || null,
    logicalPosition: Object.freeze({ ...logicalPosition }),
    coordinateSpace:
      boundCube.spatialSlot?.coordinateSpace ||
      SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID,
    allocationMethod: boundCube.spatialSlot?.allocationMethod || "topology_bfs_v0",
    worldPosition,
    worldCoordinateSpace: worldPosition.coordinateSpace,
    eventAnchor
  });

  const spatialBinding = Object.freeze({
    ...(boundCube.spatialBinding || {}),
    schema: boundCube.spatialBinding?.schema || `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.spatial_binding`,
    entityId: boundCube.entityId || boundCube.spatialBinding?.entityId || null,
    spatialSlot: Object.freeze({
      slotId: spatialSlot.slotId,
      logicalPosition: spatialSlot.logicalPosition,
      coordinateSpace: spatialSlot.coordinateSpace,
      worldPosition,
      eventAnchor
    }),
    arenaBinding: Object.freeze({
      ...(boundCube.spatialBinding?.arenaBinding || boundCube.arenaBinding || {}),
      status: "bound"
    }),
    interpretationOnly: true,
    nonExecutive: true
  });

  publishSpatialSlotResolverSignalV0("spatial.slot.world_resolved", {
    entityId: boundCube.entityId,
    cubeId: boundCube.cubeId,
    slotId: spatialSlot.slotId,
    lat: worldPosition.lat,
    lon: worldPosition.lon
  });

  return Object.freeze({
    ...boundCube,
    spatialSlot,
    spatialBinding,
    actionSurface: buildActionSurfacePrepV0(boundCube)
  });
}

/**
 * @param {{ arenaBinding?: object, originAnchor?: object }} opts
 */
export function resolveSpatialSlotsV0(opts = {}) {
  const arenaBinding = opts.arenaBinding || null;

  if (!arenaBinding || arenaBinding.ok === false) {
    return Object.freeze({
      schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.result`,
      ok: false,
      error: "arena_binding_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const boundCubes = Array.isArray(arenaBinding.boundCubes) ? arenaBinding.boundCubes : [];
  if (!boundCubes.length) {
    return Object.freeze({
      schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.result`,
      ok: false,
      error: "bound_cubes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const originAnchor = opts.originAnchor || getRhizohCalibrationRootAnchorV0();
  const resolvedCubes = boundCubes.map((cube) =>
    resolveBoundCubeSpatialSlotV0(cube, { originAnchor })
  );

  const resolverHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: SPATIAL_SLOT_RESOLVER_SCHEMA_V0,
    bindingHead: arenaBinding.bindingHead,
    resolvedCount: resolvedCubes.length,
    originAnchorId: originAnchor.id
  });

  publishSpatialSlotResolverSignalV0("spatial.binding.world_position_set", {
    resolvedCount: resolvedCubes.length,
    originAnchorId: originAnchor.id
  });

  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.result`,
    ok: true,
    resolverHead,
    resolvedCount: resolvedCubes.length,
    resolvedCubes: Object.freeze(resolvedCubes),
    originAnchorId: originAnchor.id,
    coordinateSpaces: Object.freeze({
      logical: SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID,
      world: WORLD_COORDINATE_SPACE_V0.WGS84_EPISTEMIC_PROJECTION
    }),
    resolverMethod: SPATIAL_SLOT_RESOLVER_METHOD_V0.LOGICAL_GRID_CALIBRATION_ROOT,
    signals: Object.freeze(spatialSlotResolverSignalsV0.slice(0, 8)),
    realityPhase: SPATIAL_SLOT_RESOLVER_PHASE_V0.PHASE_5_1_WORLD_PROJECTION,
    priorPhase: ARENA_BINDING_PHASE_V0.PHASE_5_ARENA_IDENTITY_KERNEL,
    deferred: Object.freeze({
      prismCubeCommit: true,
      cesiumWorldCommit: true,
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "where_do_arena_bound_entities_exist_in_world_space",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastSpatialSlotResolverV0 = null;

export function getLastSpatialSlotResolverV0() {
  return lastSpatialSlotResolverV0;
}

export function setLastSpatialSlotResolverV0(result) {
  lastSpatialSlotResolverV0 = result;
  return result;
}

export function getSpatialSlotResolverSignalsV0() {
  return Object.freeze([...spatialSlotResolverSignalsV0]);
}

export function ensureSpatialSlotResolverV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.resolveSpatialSlots) {
    window.__rhizoh.resolveSpatialSlots = (opts) => {
      const result = resolveSpatialSlotsV0(opts);
      if (result.ok !== false) setLastSpatialSlotResolverV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.spatialSlotResolver) {
    window.__rhizoh.spatialSlotResolver = () => getLastSpatialSlotResolverV0();
  }
  if (!window.__rhizoh.resolveLogicalToWorld) {
    window.__rhizoh.resolveLogicalToWorld = (logical, anchorOpts) =>
      resolveLogicalToWorldPositionV0(logical, anchorOpts);
  }
  if (!window.__rhizoh.spatialSlotResolverSignals) {
    window.__rhizoh.spatialSlotResolverSignals = () => getSpatialSlotResolverSignalsV0();
  }

  return window.__rhizoh.resolveSpatialSlots;
}

/** @internal vitest */
export function resetSpatialSlotResolverForTestV0() {
  lastSpatialSlotResolverV0 = null;
  spatialSlotResolverSignalsV0.length = 0;
}
