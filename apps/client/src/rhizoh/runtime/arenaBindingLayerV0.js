/**
 * Arena Binding Layer v0 — shared identity kernel + cube→arena mapping.
 * Unifies chess / sports / media / authority under entity_id continuity prep.
 * Does NOT resolve world_position or execute arena physics.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_ARENA_BINDING_LAYER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import { SPATIAL_ALLOCATION_PHASE_V0 } from "./spatialAllocationLayerV0.js";

export const ARENA_BINDING_LAYER_SCHEMA_V0 = "castle.rhizoh.arena_binding_layer.v0";

export const ARENA_BINDING_STATUS_V0 = Object.freeze({
  PENDING: "pending",
  BOUND: "bound",
  UNBOUND: "unbound"
});

export const ARENA_TYPE_V0 = Object.freeze({
  AUTHORITY_EPISTEMIC: "authority_epistemic",
  CHESS: "chess",
  SPORTS: "sports",
  MEDIA: "media"
});

export const ARENA_EVENT_GRAMMAR_V0 = Object.freeze({
  AUTHORITY_SEAL: "arena.authority.seal.v1",
  CHESS_MOVE: "arena.chess.move.v1",
  SPORTS_DELTA: "arena.sports.delta.v1",
  MEDIA_FRAME: "arena.media.frame.v1"
});

export const ARENA_COVERAGE_V0 = Object.freeze({
  FULL_ACTIVE: "full_active",
  INFERENCE_ONLY: "inference_only",
  EVENT_INGEST: "event_ingest",
  UI_STUB: "ui_stub",
  BOUND_EPISTEMIC: "bound_epistemic"
});

export const ARENA_BINDING_PHASE_V0 = Object.freeze({
  PHASE_5_ARENA_IDENTITY_KERNEL: "phase_5_arena_identity_kernel"
});

/** @type {Map<string, object>} */
const entityContinuityRegistryV0 = new Map();

/**
 * @param {{ sealRef?: string, partitionKey?: string, mergedEpochId?: string, clientSeed?: string }} opts
 */
export function mintArenaEntityIdV0(opts = {}) {
  const sealRef = String(opts.sealRef || "").trim();
  const partitionKey = String(opts.partitionKey || "").trim();
  const mergedEpochId = String(opts.mergedEpochId || "").trim();
  const clientSeed = String(opts.clientSeed || getOrCreateCastleDevUid() || "client");

  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.entity`,
    sealRef: sealRef || null,
    partitionKey: partitionKey || null,
    mergedEpochId: mergedEpochId || null,
    clientSeed
  });
}

/**
 * @param {object} placedCube
 * @param {{ mergedEpochId?: string | null, clientSeed?: string }} ctx
 */
function bindPlacedCubeToArenaV0(placedCube, ctx) {
  const sealRef = String(placedCube?.payload?.sealRef || "").trim() || null;
  const entityId = mintArenaEntityIdV0({
    sealRef: sealRef || undefined,
    partitionKey: placedCube.partitionKey,
    mergedEpochId: ctx.mergedEpochId || undefined,
    clientSeed: ctx.clientSeed
  });

  const arenaBinding = Object.freeze({
    status: ARENA_BINDING_STATUS_V0.BOUND,
    arenaId: "arena.authority_epistemic",
    arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
    entityId,
    eventGrammar: ARENA_EVENT_GRAMMAR_V0.AUTHORITY_SEAL,
    cubeId: placedCube.cubeId,
    partitionKey: placedCube.partitionKey,
    slotId: placedCube.spatialSlot?.slotId || null,
    crossArenaContinuity: Object.freeze({
      chess: null,
      sports: null,
      media: null
    }),
    coverage: ARENA_COVERAGE_V0.BOUND_EPISTEMIC,
    interpretationOnly: true,
    nonExecutive: true
  });

  entityContinuityRegistryV0.set(entityId, Object.freeze({
    entityId,
    sealRef,
    partitionKey: placedCube.partitionKey,
    cubeId: placedCube.cubeId,
    boundAtMs: Date.now()
  }));

  return Object.freeze({
    ...placedCube,
    arenaBinding,
    entityId
  });
}

/**
 * Register cross-arena local id → shared entity (prep for chess/sports/media wiring).
 * @param {{ entityId: string, arenaType: string, localId: string }} opts
 */
export function registerArenaEntityContinuityV0(opts = {}) {
  const entityId = String(opts.entityId || "").trim();
  const arenaType = String(opts.arenaType || "").trim();
  const localId = String(opts.localId || "").trim();
  if (!entityId || !arenaType || !localId) {
    return Object.freeze({ ok: false, error: "entity_arena_local_required" });
  }

  const row = entityContinuityRegistryV0.get(entityId) || { entityId, crossArena: {} };
  const crossArena = { ...(row.crossArena || {}), [arenaType]: localId };
  entityContinuityRegistryV0.set(
    entityId,
    Object.freeze({ ...row, entityId, crossArena: Object.freeze(crossArena) })
  );

  return Object.freeze({ ok: true, entityId, arenaType, localId });
}

function buildArenaRegistrySnapshotV0() {
  return Object.freeze({
    chess: Object.freeze({
      arenaType: ARENA_TYPE_V0.CHESS,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.CHESS_MOVE,
      coverage: ARENA_COVERAGE_V0.INFERENCE_ONLY,
      consensus: false,
      note: "deterministic simulation stream — not historical arena yet"
    }),
    sports: Object.freeze({
      arenaType: ARENA_TYPE_V0.SPORTS,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.SPORTS_DELTA,
      coverage: ARENA_COVERAGE_V0.EVENT_INGEST,
      crossEventContinuity: false,
      note: "event collector — identity kernel prep only"
    }),
    media: Object.freeze({
      arenaType: ARENA_TYPE_V0.MEDIA,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.MEDIA_FRAME,
      coverage: ARENA_COVERAGE_V0.UI_STUB,
      ledgerization: false,
      note: "UI present — epistemic binding not connected"
    }),
    authority_epistemic: Object.freeze({
      arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.AUTHORITY_SEAL,
      coverage: ARENA_COVERAGE_V0.BOUND_EPISTEMIC
    })
  });
}

/**
 * @param {{ spatialAllocation?: object, mergeEvent?: object | null, clientSeed?: string }} opts
 */
export function bindArenasToPlacedCubesV0(opts = {}) {
  const spatialAllocation = opts.spatialAllocation || null;
  const mergeEvent = opts.mergeEvent || null;

  if (!spatialAllocation || spatialAllocation.ok === false) {
    return Object.freeze({
      schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "spatial_allocation_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const placed = Array.isArray(spatialAllocation.placedCubes) ? spatialAllocation.placedCubes : [];
  if (!placed.length) {
    return Object.freeze({
      schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "placed_cubes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const mergedEpochId =
    mergeEvent?.output?.mergedEpochId || spatialAllocation.sourceTopologyHead || null;
  const ctx = { mergedEpochId, clientSeed: opts.clientSeed };

  const boundCubes = placed.map((cube) => bindPlacedCubeToArenaV0(cube, ctx));
  const entityIds = boundCubes.map((c) => c.entityId);

  const bindingHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: ARENA_BINDING_LAYER_SCHEMA_V0,
    allocationHead: spatialAllocation.allocationHead,
    boundCount: boundCubes.length,
    entityIds: entityIds.sort()
  });

  return Object.freeze({
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.result`,
    ok: true,
    bindingHead,
    boundCount: boundCubes.length,
    boundCubes: Object.freeze(boundCubes),
    identityKernel: Object.freeze({
      schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.identity_kernel`,
      entityCount: entityIds.length,
      entityIds: Object.freeze([...entityIds]),
      continuityRegistrySize: entityContinuityRegistryV0.size
    }),
    arenaRegistry: buildArenaRegistrySnapshotV0(),
    eventGrammars: Object.freeze({ ...ARENA_EVENT_GRAMMAR_V0 }),
    realityPhase: ARENA_BINDING_PHASE_V0.PHASE_5_ARENA_IDENTITY_KERNEL,
    priorPhase: SPATIAL_ALLOCATION_PHASE_V0.PHASE_4_2_LOGICAL_PLACEMENT,
    deferred: Object.freeze({
      worldPosition: true,
      spatialSlotResolver: true,
      prismCubeCommit: true,
      mediaLedgerization: true,
      workerConsensus: true,
      chessHistoricalConsensus: true
    }),
    question: "which_entity_continues_across_arenas",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastArenaBindingV0 = null;

export function getLastArenaBindingV0() {
  return lastArenaBindingV0;
}

export function setLastArenaBindingV0(result) {
  lastArenaBindingV0 = result;
  return result;
}

export function ensureArenaBindingLayerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.bindArenasToCubes) {
    window.__rhizoh.bindArenasToCubes = (opts) => {
      const result = bindArenasToPlacedCubesV0(opts);
      if (result.ok !== false) setLastArenaBindingV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.arenaBinding) {
    window.__rhizoh.arenaBinding = () => getLastArenaBindingV0();
  }
  if (!window.__rhizoh.registerArenaEntity) {
    window.__rhizoh.registerArenaEntity = (opts) => registerArenaEntityContinuityV0(opts);
  }
  if (!window.__rhizoh.arenaEntityId) {
    window.__rhizoh.arenaEntityId = (opts) => mintArenaEntityIdV0(opts);
  }

  return window.__rhizoh.bindArenasToCubes;
}

/** @internal vitest */
export function resetArenaBindingLayerForTestV0() {
  lastArenaBindingV0 = null;
  entityContinuityRegistryV0.clear();
}
