/**
 * Arena Binding Layer v0 — unified ArenaEvent ontology + entity-first identity kernel.
 * No arena event without entity binding. world_position deferred.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_ARENA_BINDING_LAYER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import { getAuthorityEpochIdV1 } from "./authorityEpochBoundaryV1.js";
import { SPATIAL_ALLOCATION_PHASE_V0 } from "./spatialAllocationLayerV0.js";

export const ARENA_BINDING_LAYER_SCHEMA_V0 = "castle.rhizoh.arena_binding_layer.v0";
export const ARENA_EVENT_SCHEMA_V0 = "castle.rhizoh.arena_event.v0";

export const ARENA_BINDING_STATUS_V0 = Object.freeze({
  PENDING: "pending",
  BOUND: "bound",
  UNBOUND: "unbound"
});

export const ARENA_ENTITY_STATUS_V0 = Object.freeze({
  CREATED: "created",
  BOUND: "bound",
  DRIFTING: "drifting",
  QUARANTINED: "quarantined"
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

export const MEDIA_LEDGERIZATION_LOCK_V0 = "MEDIA_LEDGERIZATION_LOCKED_PHASE_1";

/** @type {Map<string, object>} */
const entityRegistryByIdV0 = new Map();
/** @type {Map<string, string>} */
const entityRegistryByPersistentHashV0 = new Map();

/** @type {object[]} */
const arenaBindingSignalsV0 = [];

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishArenaBindingSignalV0(signal, detail = {}) {
  const row = Object.freeze({
    signal,
    atMs: Date.now(),
    ...detail
  });
  arenaBindingSignalsV0.unshift(row);
  if (arenaBindingSignalsV0.length > 64) arenaBindingSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:arena-binding-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {{ sealRef?: string, partitionKey?: string, mergedEpochId?: string, semanticClass?: string }} opts
 */
export function computeArenaPersistentHashV0(opts = {}) {
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.persistent_hash`,
    sealRef: opts.sealRef || null,
    partitionKey: opts.partitionKey || null,
    mergedEpochId: opts.mergedEpochId || null,
    semanticClass: opts.semanticClass || null
  });
}

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
 * @param {object} partial
 */
function buildArenaEntityKernelV0(partial) {
  return Object.freeze({
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.entity_kernel`,
    entityId: partial.entityId,
    persistentHash: partial.persistentHash,
    epochOrigin: partial.epochOrigin,
    aliases: Object.freeze({
      chess: partial.aliases?.chess ?? null,
      sports: partial.aliases?.sports ?? null,
      media: partial.aliases?.media ?? null,
      authority: partial.aliases?.authority ?? null
    }),
    semanticClass: partial.semanticClass || "unknown",
    status: partial.status || ARENA_ENTITY_STATUS_V0.CREATED,
    lastSeenAt: partial.lastSeenAt || Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {string} entityId
 */
export function resolveCrossArenaIdentityV0(entityId) {
  const id = String(entityId || "").trim();
  if (!id) return null;

  const direct = entityRegistryByIdV0.get(id);
  if (direct) return direct;

  for (const entity of entityRegistryByIdV0.values()) {
    const aliases = entity.aliases || {};
    if (Object.values(aliases).includes(id)) return entity;
  }
  return null;
}

/**
 * @param {object} event ArenaEventV0-shaped
 */
export function bindArenaEntityV0(event) {
  const arenaType = String(event?.arenaType || "").trim();
  const epochId = String(event?.epochId || getAuthorityEpochIdV1() || "").trim();
  const timestamp = Number(event?.timestamp) || Date.now();
  const entityInput = event?.entity || {};
  const persistentHash =
    String(entityInput.persistentHash || "").trim() ||
    computeArenaPersistentHashV0({
      sealRef: event?.sealRef || entityInput.sealRef,
      partitionKey: entityInput.partitionKey,
      mergedEpochId: epochId,
      semanticClass: entityInput.semanticClass
    });

  if (!arenaType || !persistentHash) {
    return Object.freeze({
      ok: false,
      error: "arena_event_requires_type_and_entity",
      invariant: "no_arena_event_without_entity_binding"
    });
  }

  const localEntityId = String(entityInput.entityId || mintArenaEntityIdV0({
    sealRef: event?.sealRef,
    partitionKey: entityInput.partitionKey,
    mergedEpochId: epochId
  }));

  const existingId = entityRegistryByPersistentHashV0.get(persistentHash);
  let entity;

  if (!existingId) {
    entity = buildArenaEntityKernelV0({
      entityId: localEntityId,
      persistentHash,
      epochOrigin: epochId,
      aliases: { [arenaType]: localEntityId },
      semanticClass: entityInput.semanticClass || "arena_entity",
      status: ARENA_ENTITY_STATUS_V0.CREATED,
      lastSeenAt: timestamp
    });
    entityRegistryByIdV0.set(entity.entityId, entity);
    entityRegistryByPersistentHashV0.set(persistentHash, entity.entityId);
    publishArenaBindingSignalV0("arena.binding.entity_resolved", {
      entityId: entity.entityId,
      status: entity.status,
      arenaType
    });
  } else {
    const existing = entityRegistryByIdV0.get(existingId);
    const aliases = {
      ...(existing?.aliases || {}),
      [arenaType]: localEntityId
    };
    entity = buildArenaEntityKernelV0({
      entityId: existing?.entityId || existingId,
      persistentHash,
      epochOrigin: existing?.epochOrigin || epochId,
      aliases,
      semanticClass: entityInput.semanticClass || existing?.semanticClass || "arena_entity",
      status: ARENA_ENTITY_STATUS_V0.BOUND,
      lastSeenAt: timestamp
    });
    entityRegistryByIdV0.set(entity.entityId, entity);
    publishArenaBindingSignalV0("arena.cross_identity.linked", {
      entityId: entity.entityId,
      arenaType,
      crossArenaAliases: entity.aliases
    });
  }

  const boundEvent = Object.freeze({
    schema: ARENA_EVENT_SCHEMA_V0,
    eventId: foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
      schema: ARENA_EVENT_SCHEMA_V0,
      arenaType,
      entityId: entity.entityId,
      timestamp
    }),
    arenaType,
    entity,
    payload: Object.freeze(event?.payload || {}),
    epochId,
    sealRef: String(event?.sealRef || entityInput.sealRef || ""),
    timestamp,
    interpretationOnly: true,
    nonExecutive: true
  });

  return Object.freeze({
    ok: true,
    entity,
    event: boundEvent,
    invariant: "entity_first_event_system"
  });
}

/**
 * @param {object} placedCube
 * @param {object} entity
 */
export function buildSpatialBindingV0(placedCube, entity) {
  const slot = placedCube?.spatialSlot || null;
  return Object.freeze({
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.spatial_binding`,
    entityId: entity.entityId,
    spatialSlot: Object.freeze({
      slotId: slot?.slotId || null,
      logicalPosition: slot?.logicalPosition || null,
      coordinateSpace: slot?.coordinateSpace || "logical_epistemic_grid",
      worldPosition: null
    }),
    arenaBinding: Object.freeze({
      status: ARENA_BINDING_STATUS_V0.BOUND,
      arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} placedCube
 * @param {{ mergedEpochId?: string | null, clientSeed?: string }} ctx
 */
function bindPlacedCubeToArenaV0(placedCube, ctx) {
  const sealRef = String(placedCube?.payload?.sealRef || "").trim() || null;
  const persistentHash = computeArenaPersistentHashV0({
    sealRef,
    partitionKey: placedCube.partitionKey,
    mergedEpochId: ctx.mergedEpochId,
    semanticClass: placedCube?.payload?.semanticClass
  });

  const bound = bindArenaEntityV0({
    arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
    epochId: placedCube?.epochBoundary?.epochId || ctx.mergedEpochId,
    sealRef,
    timestamp: Date.now(),
    entity: {
      entityId: mintArenaEntityIdV0({
        sealRef: sealRef || undefined,
        partitionKey: placedCube.partitionKey,
        mergedEpochId: ctx.mergedEpochId,
        clientSeed: ctx.clientSeed
      }),
      persistentHash,
      partitionKey: placedCube.partitionKey,
      semanticClass: placedCube?.payload?.semanticClass || "cross_epoch_witness_bridge"
    },
    payload: Object.freeze({ sealRef, partitionKey: placedCube.partitionKey })
  });

  const entity = bound.entity;
  const spatialBinding = buildSpatialBindingV0(placedCube, entity);

  const arenaBinding = Object.freeze({
    status: ARENA_BINDING_STATUS_V0.BOUND,
    arenaId: "arena.authority_epistemic",
    arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
    entityId: entity.entityId,
    persistentHash: entity.persistentHash,
    eventGrammar: ARENA_EVENT_GRAMMAR_V0.AUTHORITY_SEAL,
    cubeId: placedCube.cubeId,
    partitionKey: placedCube.partitionKey,
    slotId: placedCube.spatialSlot?.slotId || null,
    crossArenaContinuity: entity.aliases,
    coverage: ARENA_COVERAGE_V0.BOUND_EPISTEMIC,
    interpretationOnly: true,
    nonExecutive: true
  });

  return Object.freeze({
    ...placedCube,
    arenaBinding,
    spatialBinding,
    entityId: entity.entityId,
    entityKernel: entity
  });
}

/**
 * @param {{ entityId: string, arenaType: string, localId: string }} opts
 */
export function registerArenaEntityContinuityV0(opts = {}) {
  const entity = resolveCrossArenaIdentityV0(opts.entityId);
  if (!entity) {
    return Object.freeze({ ok: false, error: "entity_not_found" });
  }
  const arenaType = String(opts.arenaType || "").trim();
  const localId = String(opts.localId || "").trim();
  if (!arenaType || !localId) {
    return Object.freeze({ ok: false, error: "entity_arena_local_required" });
  }

  const updated = buildArenaEntityKernelV0({
    ...entity,
    aliases: { ...entity.aliases, [arenaType]: localId },
    status: ARENA_ENTITY_STATUS_V0.BOUND,
    lastSeenAt: Date.now()
  });
  entityRegistryByIdV0.set(updated.entityId, updated);
  publishArenaBindingSignalV0("arena.cross_identity.linked", {
    entityId: updated.entityId,
    arenaType,
    localId
  });

  return Object.freeze({ ok: true, entityId: updated.entityId, arenaType, localId, entity: updated });
}

/**
 * @param {string} move
 * @param {string} entityId
 */
export function ingestChessMoveArenaEventV0(move, entityId) {
  const entity = resolveCrossArenaIdentityV0(entityId);
  if (!entity) {
    return Object.freeze({
      ok: false,
      error: "entity_binding_required",
      invariant: "no_arena_event_without_entity_binding"
    });
  }

  return bindArenaEntityV0({
    arenaType: ARENA_TYPE_V0.CHESS,
    epochId: getAuthorityEpochIdV1(),
    sealRef: computeArenaPersistentHashV0({ sealRef: String(move), semanticClass: "chess_move" }),
    timestamp: Date.now(),
    entity: {
      ...entity,
      entityId: entity.entityId,
      semanticClass: "chess_move"
    },
    payload: Object.freeze({ move: String(move || "") })
  });
}

/**
 * @param {{ delta?: unknown }} eventData
 * @param {string} entityId
 */
export function ingestSportsArenaEventV0(eventData, entityId) {
  const entity = resolveCrossArenaIdentityV0(entityId);
  if (!entity) {
    return Object.freeze({
      ok: false,
      error: "entity_binding_required",
      invariant: "no_arena_event_without_entity_binding"
    });
  }

  return bindArenaEntityV0({
    arenaType: ARENA_TYPE_V0.SPORTS,
    epochId: getAuthorityEpochIdV1(),
    sealRef: computeArenaPersistentHashV0({ semanticClass: "sports_delta" }),
    timestamp: Date.now(),
    entity: {
      ...entity,
      entityId: entity.entityId,
      semanticClass: "sports_delta"
    },
    payload: Object.freeze({ scoreDelta: eventData?.delta ?? eventData ?? null })
  });
}

/**
 * @param {object} [_frame]
 */
export function ingestMediaFrameArenaEventV0(_frame) {
  return Object.freeze({
    ok: false,
    status: ARENA_BINDING_STATUS_V0.UNBOUND,
    reason: MEDIA_LEDGERIZATION_LOCK_V0,
    invariant: "no_arena_event_without_entity_binding",
    interpretationOnly: true,
    nonExecutive: true
  });
}

function buildArenaRegistrySnapshotV0() {
  return Object.freeze({
    chess: Object.freeze({
      arenaType: ARENA_TYPE_V0.CHESS,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.CHESS_MOVE,
      coverage: ARENA_COVERAGE_V0.INFERENCE_ONLY,
      consensus: false
    }),
    sports: Object.freeze({
      arenaType: ARENA_TYPE_V0.SPORTS,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.SPORTS_DELTA,
      coverage: ARENA_COVERAGE_V0.EVENT_INGEST,
      crossEventContinuity: true
    }),
    media: Object.freeze({
      arenaType: ARENA_TYPE_V0.MEDIA,
      eventGrammar: ARENA_EVENT_GRAMMAR_V0.MEDIA_FRAME,
      coverage: ARENA_COVERAGE_V0.UI_STUB,
      ledgerization: false,
      lock: MEDIA_LEDGERIZATION_LOCK_V0
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
  const entityKernels = boundCubes.map((c) => c.entityKernel);
  const entityIds = boundCubes.map((c) => c.entityId);

  const bindingHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: ARENA_BINDING_LAYER_SCHEMA_V0,
    allocationHead: spatialAllocation.allocationHead,
    boundCount: boundCubes.length,
    entityIds: entityIds.sort()
  });

  publishArenaBindingSignalV0("arena.binding.complete", {
    boundCount: boundCubes.length,
    crossArenaAliases: "active"
  });

  return Object.freeze({
    schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.result`,
    ok: true,
    bindingHead,
    boundCount: boundCubes.length,
    boundCubes: Object.freeze(boundCubes),
    entityKernels: Object.freeze(entityKernels),
    identityKernel: Object.freeze({
      schema: `${ARENA_BINDING_LAYER_SCHEMA_V0}.identity_kernel`,
      entityCount: entityIds.length,
      entityIds: Object.freeze([...entityIds]),
      registrySize: entityRegistryByIdV0.size,
      crossArenaAliases: "active"
    }),
    arenaRegistry: buildArenaRegistrySnapshotV0(),
    eventGrammars: Object.freeze({ ...ARENA_EVENT_GRAMMAR_V0 }),
    signals: Object.freeze(arenaBindingSignalsV0.slice(0, 8)),
    realityPhase: ARENA_BINDING_PHASE_V0.PHASE_5_ARENA_IDENTITY_KERNEL,
    priorPhase: SPATIAL_ALLOCATION_PHASE_V0.PHASE_4_2_LOGICAL_PLACEMENT,
    deferred: Object.freeze({
      worldPosition: false,
      spatialSlotResolver: false,
      prismCubeCommit: false,
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

export function getArenaBindingSignalsV0() {
  return Object.freeze([...arenaBindingSignalsV0]);
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
  if (!window.__rhizoh.bindArenaEntity) {
    window.__rhizoh.bindArenaEntity = (event) => bindArenaEntityV0(event);
  }
  if (!window.__rhizoh.resolveArenaIdentity) {
    window.__rhizoh.resolveArenaIdentity = (entityId) => resolveCrossArenaIdentityV0(entityId);
  }
  if (!window.__rhizoh.ingestChessMoveArena) {
    window.__rhizoh.ingestChessMoveArena = (move, entityId) => ingestChessMoveArenaEventV0(move, entityId);
  }
  if (!window.__rhizoh.ingestSportsArena) {
    window.__rhizoh.ingestSportsArena = (eventData, entityId) =>
      ingestSportsArenaEventV0(eventData, entityId);
  }
  if (!window.__rhizoh.ingestMediaFrameArena) {
    window.__rhizoh.ingestMediaFrameArena = (frame) => ingestMediaFrameArenaEventV0(frame);
  }
  if (!window.__rhizoh.arenaBindingSignals) {
    window.__rhizoh.arenaBindingSignals = () => getArenaBindingSignalsV0();
  }

  return window.__rhizoh.bindArenasToCubes;
}

/** @internal vitest */
export function resetArenaBindingLayerForTestV0() {
  lastArenaBindingV0 = null;
  entityRegistryByIdV0.clear();
  entityRegistryByPersistentHashV0.clear();
  arenaBindingSignalsV0.length = 0;
}
