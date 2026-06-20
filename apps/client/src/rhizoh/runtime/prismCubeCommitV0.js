/**
 * Prism Cube Commit v0 — resolved cubes become spatial objects; actionSurface opens.
 * Interpretation-only commit — Cesium world sink still deferred.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_PRISM_CUBE_COMMIT_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { ARENA_TYPE_V0 } from "./arenaBindingLayerV0.js";
import { SPATIAL_SLOT_RESOLVER_PHASE_V0 } from "./spatialSlotResolverV0.js";

export const PRISM_CUBE_COMMIT_SCHEMA_V0 = "castle.rhizoh.prism_cube_commit.v0";

export const PRISM_CUBE_COMMIT_PHASE_V0 = Object.freeze({
  PHASE_5_2_SPATIAL_OBJECT_COMMIT: "phase_5_2_prism_cube_spatial_commit"
});

export const SPATIAL_OBJECT_STATUS_V0 = Object.freeze({
  COMMITTED: "committed",
  QUARANTINED: "quarantined"
});

export const ACTION_SURFACE_STATUS_V0 = Object.freeze({
  ACTIVE: "active",
  LOCKED: "locked"
});

/** @type {object[]} */
const prismCubeCommitSignalsV0 = [];

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishPrismCubeCommitSignalV0(signal, detail = {}) {
  const row = Object.freeze({
    signal,
    atMs: Date.now(),
    ...detail
  });
  prismCubeCommitSignalsV0.unshift(row);
  if (prismCubeCommitSignalsV0.length > 64) prismCubeCommitSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:prism-cube-commit-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {string} arenaType
 */
function buildArenaAffordancesV0(arenaType) {
  const observe = Object.freeze({
    id: "observe",
    label: "Observe",
    enabled: true,
    meaning: "projection_only"
  });

  if (arenaType === ARENA_TYPE_V0.CHESS) {
    return Object.freeze({
      observe,
      playMove: Object.freeze({
        id: "play_move",
        label: "Chess move",
        enabled: true,
        stub: true,
        ingest: "ingestChessMoveArena"
      }),
      resolveIdentity: Object.freeze({
        id: "resolve_identity",
        label: "Resolve entity",
        enabled: true,
        ingest: "resolveArenaIdentity"
      })
    });
  }

  if (arenaType === ARENA_TYPE_V0.SPORTS) {
    return Object.freeze({
      observe,
      viewScore: Object.freeze({
        id: "view_score",
        label: "Sports delta",
        enabled: true,
        stub: true,
        ingest: "ingestSportsArena"
      }),
      resolveIdentity: Object.freeze({
        id: "resolve_identity",
        label: "Resolve entity",
        enabled: true,
        ingest: "resolveArenaIdentity"
      })
    });
  }

  if (arenaType === ARENA_TYPE_V0.MEDIA) {
    return Object.freeze({
      observe: Object.freeze({
        ...observe,
        enabled: false,
        reason: "MEDIA_LEDGERIZATION_LOCKED_PHASE_1"
      })
    });
  }

  return Object.freeze({
    observe,
    resolveIdentity: Object.freeze({
      id: "resolve_identity",
      label: "Resolve cross-arena identity",
      enabled: true,
      ingest: "resolveArenaIdentity"
    }),
    bindEntity: Object.freeze({
      id: "bind_entity",
      label: "Entity kernel",
      enabled: true,
      ingest: "bindArenaEntity"
    })
  });
}

/**
 * @param {object} resolvedCube
 */
export function buildCommittedSpatialObjectV0(resolvedCube) {
  const worldPosition = resolvedCube.spatialSlot?.worldPosition || null;
  return Object.freeze({
    schema: `${PRISM_CUBE_COMMIT_SCHEMA_V0}.spatial_object`,
    status: SPATIAL_OBJECT_STATUS_V0.COMMITTED,
    cubeId: resolvedCube.cubeId || null,
    entityId: resolvedCube.entityId || null,
    slotId: resolvedCube.spatialSlot?.slotId || null,
    arenaType: resolvedCube.arenaBinding?.arenaType || ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
    logicalPosition: resolvedCube.spatialSlot?.logicalPosition || null,
    worldPosition,
    observerRelative: worldPosition?.observerRelative === true,
    mapPinEligible: worldPosition != null,
    eventAnchor: resolvedCube.spatialSlot?.eventAnchor || null,
    cesiumCommitDeferred: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} resolvedCube
 */
export function buildCommittedActionSurfaceV0(resolvedCube) {
  const arenaType = resolvedCube.arenaBinding?.arenaType || ARENA_TYPE_V0.AUTHORITY_EPISTEMIC;
  const locked = arenaType === ARENA_TYPE_V0.MEDIA;

  return Object.freeze({
    schema: `${PRISM_CUBE_COMMIT_SCHEMA_V0}.action_surface`,
    status: locked ? ACTION_SURFACE_STATUS_V0.LOCKED : ACTION_SURFACE_STATUS_V0.ACTIVE,
    entityId: resolvedCube.entityId || null,
    cubeId: resolvedCube.cubeId || null,
    arenaType,
    commitDeferred: false,
    priorStatus: resolvedCube.actionSurface?.status || "armed",
    affordances: buildArenaAffordancesV0(arenaType),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} resolvedCube
 */
export function commitResolvedPrismCubeV0(resolvedCube) {
  const spatialObject = buildCommittedSpatialObjectV0(resolvedCube);
  const actionSurface = buildCommittedActionSurfaceV0(resolvedCube);

  publishPrismCubeCommitSignalV0("prism.cube.committed", {
    cubeId: spatialObject.cubeId,
    entityId: spatialObject.entityId,
    arenaType: spatialObject.arenaType
  });
  publishPrismCubeCommitSignalV0("prism.spatial_object.registered", {
    slotId: spatialObject.slotId,
    observerRelative: spatialObject.observerRelative
  });
  publishPrismCubeCommitSignalV0("prism.action_surface.active", {
    cubeId: spatialObject.cubeId,
    arenaType: spatialObject.arenaType,
    status: actionSurface.status
  });

  return Object.freeze({
    ...resolvedCube,
    spatialObject,
    actionSurface,
    executionSubstrate: true,
    committed: true
  });
}

/**
 * @param {{ spatialSlotResolver?: object }} opts
 */
export function commitPrismCubesV0(opts = {}) {
  const spatialSlotResolver = opts.spatialSlotResolver || null;

  if (!spatialSlotResolver || spatialSlotResolver.ok === false) {
    return Object.freeze({
      schema: `${PRISM_CUBE_COMMIT_SCHEMA_V0}.result`,
      ok: false,
      error: "spatial_slot_resolver_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const resolvedCubes = Array.isArray(spatialSlotResolver.resolvedCubes)
    ? spatialSlotResolver.resolvedCubes
    : [];

  if (!resolvedCubes.length) {
    return Object.freeze({
      schema: `${PRISM_CUBE_COMMIT_SCHEMA_V0}.result`,
      ok: false,
      error: "resolved_cubes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const committedCubes = resolvedCubes.map(commitResolvedPrismCubeV0);
  const spatialObjects = committedCubes.map((c) => c.spatialObject);
  const actionSurfaces = committedCubes.map((c) => c.actionSurface);

  const commitHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: PRISM_CUBE_COMMIT_SCHEMA_V0,
    resolverHead: spatialSlotResolver.resolverHead,
    committedCount: committedCubes.length,
    cubeIds: committedCubes.map((c) => c.cubeId).sort()
  });

  publishPrismCubeCommitSignalV0("prism.commit.complete", {
    committedCount: committedCubes.length,
    mapPinEligible: spatialObjects.filter((o) => o.mapPinEligible).length
  });

  return Object.freeze({
    schema: `${PRISM_CUBE_COMMIT_SCHEMA_V0}.result`,
    ok: true,
    commitHead,
    committedCount: committedCubes.length,
    committedCubes: Object.freeze(committedCubes),
    spatialObjects: Object.freeze(spatialObjects),
    actionSurfaces: Object.freeze(actionSurfaces),
    observationOrigin: spatialSlotResolver.observationOrigin || null,
    signals: Object.freeze(prismCubeCommitSignalsV0.slice(0, 8)),
    realityPhase: PRISM_CUBE_COMMIT_PHASE_V0.PHASE_5_2_SPATIAL_OBJECT_COMMIT,
    priorPhase: SPATIAL_SLOT_RESOLVER_PHASE_V0.PHASE_5_1_OBSERVER_RELATIVE_PROJECTION,
    deferred: Object.freeze({
      cesiumWorldCommit: true,
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "which_bounded_cubes_are_now_spatial_objects_with_active_surfaces",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastPrismCubeCommitV0 = null;

export function getLastPrismCubeCommitV0() {
  return lastPrismCubeCommitV0;
}

export function setLastPrismCubeCommitV0(result) {
  lastPrismCubeCommitV0 = result;
  return result;
}

export function getPrismCubeCommitSignalsV0() {
  return Object.freeze([...prismCubeCommitSignalsV0]);
}

export function ensurePrismCubeCommitV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.commitPrismCubes) {
    window.__rhizoh.commitPrismCubes = (opts) => {
      const result = commitPrismCubesV0(opts);
      if (result.ok !== false) setLastPrismCubeCommitV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.prismCubeCommit) {
    window.__rhizoh.prismCubeCommit = () => getLastPrismCubeCommitV0();
  }
  if (!window.__rhizoh.prismCubeCommitSignals) {
    window.__rhizoh.prismCubeCommitSignals = () => getPrismCubeCommitSignalsV0();
  }

  return window.__rhizoh.commitPrismCubes;
}

/** @internal vitest */
export function resetPrismCubeCommitForTestV0() {
  lastPrismCubeCommitV0 = null;
  prismCubeCommitSignalsV0.length = 0;
}
