/**
 * Spatial Slot Resolver v0.1 — logical_epistemic_grid → observer-relative world_position.
 * Arena pins project from user observation origin (not global calibration root).
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import {
  getRhizohCalibrationRootAnchorV0,
  RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
} from "../spatial/geographicAnchorsV0.js";
import { ARENA_BINDING_PHASE_V0, ARENA_TYPE_V0 } from "./arenaBindingLayerV0.js";
import { SPATIAL_COORDINATE_SPACE_V0 } from "./spatialAllocationLayerV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { resolveSportVenueAnchorV0 } from "./worldMapLiveMatchPinsV0.js";

export const SPATIAL_SLOT_RESOLVER_SCHEMA_V0 = "castle.rhizoh.spatial_slot_resolver.v0.1";

export const WORLD_COORDINATE_SPACE_V0 = Object.freeze({
  WGS84_EPISTEMIC_PROJECTION: "wgs84_epistemic_projection"
});

export const SPATIAL_SLOT_RESOLVER_METHOD_V0 = Object.freeze({
  LOGICAL_GRID_OBSERVATION_ORIGIN: "logical_grid_observation_origin_v0.1",
  SPORTS_VENUE_EVENT: "sports_venue_event_origin_v0.1"
});

export const ARENA_PROJECTION_ORIGIN_POLICY_V0 = Object.freeze({
  OBSERVATION_ORIGIN: "observation_origin",
  VENUE_ANCHOR: "venue_anchor",
  LOCKED: "locked"
});

export const SPATIAL_SLOT_RESOLVER_PHASE_V0 = Object.freeze({
  PHASE_5_1_OBSERVER_RELATIVE_PROJECTION: "phase_5_1_observer_relative_world_projection"
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
 * @param {{ lat?: number, lon?: number, label?: string, source?: string }} [override]
 */
export function resolveObservationOriginV0(override = null) {
  if (override && Number.isFinite(override.lat) && Number.isFinite(override.lon)) {
    return Object.freeze({
      schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.observation_origin`,
      lat: Number(override.lat),
      lon: Number(override.lon),
      label: override.label || "Observation origin",
      source: override.source || "explicit_override",
      policy: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  const bootstrap = resolveWorldMapBootstrapGeoV0();
  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.observation_origin`,
    lat: bootstrap.lat,
    lon: bootstrap.lon,
    label: bootstrap.label || "Observation origin",
    source: bootstrap.source,
    policy: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {string} arenaType
 * @param {{ observationOrigin?: object, venueTeamName?: string | null, boundCube?: object }} opts
 */
export function resolveArenaProjectionOriginV0(arenaType, opts = {}) {
  const type = String(arenaType || ARENA_TYPE_V0.AUTHORITY_EPISTEMIC).trim();
  const observationOrigin = opts.observationOrigin || resolveObservationOriginV0();

  if (type === ARENA_TYPE_V0.MEDIA) {
    return Object.freeze({
      ok: false,
      policy: ARENA_PROJECTION_ORIGIN_POLICY_V0.LOCKED,
      reason: "MEDIA_LEDGERIZATION_LOCKED_PHASE_1"
    });
  }

  const venueTeamName =
    opts.venueTeamName ||
    opts.boundCube?.payload?.teamName ||
    opts.boundCube?.payload?.homeTeam ||
    null;

  if (type === ARENA_TYPE_V0.SPORTS && venueTeamName) {
    const venue = resolveSportVenueAnchorV0(String(venueTeamName));
    if (venue) {
      return Object.freeze({
        ok: true,
        policy: ARENA_PROJECTION_ORIGIN_POLICY_V0.VENUE_ANCHOR,
        lat: venue.lat,
        lon: venue.lon,
        label: venue.city || String(venueTeamName),
        source: `sports_venue:${String(venueTeamName).toLowerCase()}`,
        arenaType: type,
        interpretationOnly: true,
        nonExecutive: true
      });
    }
  }

  return Object.freeze({
    ok: true,
    policy: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
    lat: observationOrigin.lat,
    lon: observationOrigin.lon,
    label: observationOrigin.label,
    source: observationOrigin.source,
    arenaType: type,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{ x?: number, y?: number, z?: number } | null | undefined} logicalPosition
 * @param {{ projectionOrigin?: object, observationOrigin?: object }} [opts]
 */
export function resolveLogicalToWorldPositionV0(logicalPosition, opts = {}) {
  const projectionOrigin =
    opts.projectionOrigin ||
    resolveArenaProjectionOriginV0(ARENA_TYPE_V0.AUTHORITY_EPISTEMIC, {
      observationOrigin: opts.observationOrigin
    });

  if (projectionOrigin.ok === false) {
    return Object.freeze({
      ok: false,
      error: projectionOrigin.reason || "projection_origin_locked",
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  const x = Number(logicalPosition?.x) || 0;
  const y = Number(logicalPosition?.y) || 0;
  const z = Number(logicalPosition?.z) || 0;
  const calibrationRoot = getRhizohCalibrationRootAnchorV0();

  const resolverMethod =
    projectionOrigin.policy === ARENA_PROJECTION_ORIGIN_POLICY_V0.VENUE_ANCHOR
      ? SPATIAL_SLOT_RESOLVER_METHOD_V0.SPORTS_VENUE_EVENT
      : SPATIAL_SLOT_RESOLVER_METHOD_V0.LOGICAL_GRID_OBSERVATION_ORIGIN;

  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.world_position`,
    lat: projectionOrigin.lat + y * GRID_LON_LAT_DEGREE_SCALE_V0,
    lon: projectionOrigin.lon + x * GRID_LON_LAT_DEGREE_SCALE_V0,
    alt: BASE_ALT_METERS_V0 + z * GRID_ALT_METERS_SCALE_V0,
    coordinateSpace: WORLD_COORDINATE_SPACE_V0.WGS84_EPISTEMIC_PROJECTION,
    observationOrigin: Object.freeze({
      lat: projectionOrigin.lat,
      lon: projectionOrigin.lon,
      source: projectionOrigin.source,
      label: projectionOrigin.label || null,
      policy: projectionOrigin.policy,
      arenaType: projectionOrigin.arenaType || null
    }),
    calibrationOriginId: calibrationRoot.id || RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
    resolverMethod,
    observerRelative: projectionOrigin.policy === ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
    logicalSource: Object.freeze({ x, y, z }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} boundCube
 * @param {object} worldPosition
 */
function buildEventAnchorV0(boundCube, worldPosition) {
  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.event_anchor`,
    entityId: boundCube.entityId || null,
    cubeId: boundCube.cubeId || null,
    slotId: boundCube.spatialSlot?.slotId || null,
    arenaType: boundCube.arenaBinding?.arenaType || null,
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
    arenaType: boundCube.arenaBinding?.arenaType || null,
    commitDeferred: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} boundCube
 * @param {{ observationOrigin?: object }} [opts]
 */
export function resolveBoundCubeSpatialSlotV0(boundCube, opts = {}) {
  const logicalPosition =
    boundCube?.spatialSlot?.logicalPosition ||
    boundCube?.spatialBinding?.spatialSlot?.logicalPosition ||
    { x: 0, y: 0, z: 0 };

  const arenaType = boundCube?.arenaBinding?.arenaType || ARENA_TYPE_V0.AUTHORITY_EPISTEMIC;
  const projectionOrigin = resolveArenaProjectionOriginV0(arenaType, {
    observationOrigin: opts.observationOrigin,
    boundCube
  });

  if (projectionOrigin.ok === false) {
    return Object.freeze({
      ...boundCube,
      spatialResolution: Object.freeze({
        ok: false,
        reason: projectionOrigin.reason,
        arenaType
      })
    });
  }

  const worldPosition = resolveLogicalToWorldPositionV0(logicalPosition, {
    projectionOrigin,
    observationOrigin: opts.observationOrigin
  });
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
    arenaType,
    observerRelative: worldPosition.observerRelative === true,
    lat: worldPosition.lat,
    lon: worldPosition.lon,
    originSource: worldPosition.observationOrigin?.source || null
  });

  return Object.freeze({
    ...boundCube,
    spatialSlot,
    spatialBinding,
    actionSurface: buildActionSurfacePrepV0(boundCube)
  });
}

/**
 * @param {{ arenaBinding?: object, observationOrigin?: object }} opts
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

  const observationOrigin = resolveObservationOriginV0(opts.observationOrigin || null);
  const resolvedCubes = boundCubes.map((cube) =>
    resolveBoundCubeSpatialSlotV0(cube, { observationOrigin })
  );

  const resolverHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: SPATIAL_SLOT_RESOLVER_SCHEMA_V0,
    bindingHead: arenaBinding.bindingHead,
    resolvedCount: resolvedCubes.length,
    observationSource: observationOrigin.source
  });

  publishSpatialSlotResolverSignalV0("spatial.binding.world_position_set", {
    resolvedCount: resolvedCubes.length,
    observationSource: observationOrigin.source,
    observerRelative: true
  });
  publishSpatialSlotResolverSignalV0("spatial.observer_origin.active", {
    lat: observationOrigin.lat,
    lon: observationOrigin.lon,
    source: observationOrigin.source
  });

  return Object.freeze({
    schema: `${SPATIAL_SLOT_RESOLVER_SCHEMA_V0}.result`,
    ok: true,
    resolverHead,
    resolvedCount: resolvedCubes.length,
    resolvedCubes: Object.freeze(resolvedCubes),
    observationOrigin,
    calibrationOriginId: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
    coordinateSpaces: Object.freeze({
      logical: SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID,
      world: WORLD_COORDINATE_SPACE_V0.WGS84_EPISTEMIC_PROJECTION
    }),
    resolverMethod: SPATIAL_SLOT_RESOLVER_METHOD_V0.LOGICAL_GRID_OBSERVATION_ORIGIN,
    arenaProjectionPolicy: Object.freeze({
      authority_epistemic: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
      chess: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
      sports_entity: ARENA_PROJECTION_ORIGIN_POLICY_V0.OBSERVATION_ORIGIN,
      sports_live_event: ARENA_PROJECTION_ORIGIN_POLICY_V0.VENUE_ANCHOR,
      media: ARENA_PROJECTION_ORIGIN_POLICY_V0.LOCKED
    }),
    signals: Object.freeze(spatialSlotResolverSignalsV0.slice(0, 8)),
    realityPhase: SPATIAL_SLOT_RESOLVER_PHASE_V0.PHASE_5_1_OBSERVER_RELATIVE_PROJECTION,
    priorPhase: ARENA_BINDING_PHASE_V0.PHASE_5_ARENA_IDENTITY_KERNEL,
    deferred: Object.freeze({
      prismCubeCommit: true,
      cesiumWorldCommit: true,
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "where_do_arena_bound_entities_exist_for_this_observer",
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
  if (!window.__rhizoh.resolveObservationOrigin) {
    window.__rhizoh.resolveObservationOrigin = (override) => resolveObservationOriginV0(override);
  }
  if (!window.__rhizoh.resolveLogicalToWorld) {
    window.__rhizoh.resolveLogicalToWorld = (logical, anchorOpts) =>
      resolveLogicalToWorldPositionV0(logical, anchorOpts);
  }
  if (!window.__rhizoh.resolveArenaProjectionOrigin) {
    window.__rhizoh.resolveArenaProjectionOrigin = (arenaType, opts) =>
      resolveArenaProjectionOriginV0(arenaType, opts);
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
