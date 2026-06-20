/**
 * Arena Population Layer v0 — which pins exist; arena event → tower → layer.
 * Answers "hangi pin oluşacak?" after distribution separates coordinates.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_ARENA_POPULATION_LAYER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import {
  ingestChessMoveArenaEventV0,
  ingestMediaFrameArenaEventV0,
  ingestSportsArenaEventV0,
  ARENA_TYPE_V0
} from "./arenaBindingLayerV0.js";
import { setPrismCubeMapPinsV0 } from "./cesiumWorldCommitV0.js";
import { resolveObservationOriginV0 } from "./spatialSlotResolverV0.js";
import {
  computeDistributionOffsetV0,
  computeExplorerSeedSpreadOffsetV0,
  resolveSpiralMapLayerV0,
  resolveTowerClassV0,
  SPATIAL_DISTRIBUTION_PHASE_V0,
  SPIRAL_MAP_LAYER_V0,
  TOWER_CLASS_V0
} from "./spatialDistributionLayerV0.js";

export const ARENA_POPULATION_LAYER_SCHEMA_V0 = "castle.rhizoh.arena_population_layer.v0";

export const ARENA_POPULATION_PHASE_V0 = Object.freeze({
  PHASE_5_1_ARENA_POPULATION: "phase_5_1_arena_population"
});

export const ARENA_POPULATION_STATUS_V0 = Object.freeze({
  ACTIVE: "active",
  DORMANT: "dormant",
  LOCKED: "locked"
});

export const ARENA_POPULATION_KIND_V0 = Object.freeze({
  AUTHORITY_MERGE: "authority_merge",
  V11_SEED: "v11_seed",
  ARENA_EVENT: "arena_event"
});

const TOWER_PIN_COLOR_V0 = Object.freeze({
  [TOWER_CLASS_V0.TRAVEL]: "#06b6d4",
  [TOWER_CLASS_V0.EXPLORER]: "#38bdf8",
  [TOWER_CLASS_V0.GHOST]: "#a78bfa",
  [TOWER_CLASS_V0.CASTLE]: "#6366f1",
  [TOWER_CLASS_V0.AUTHORITY_EPISTEMIC]: "#6366f1",
  [TOWER_CLASS_V0.RESEARCH]: "#8b5cf6",
  [TOWER_CLASS_V0.ACADEMY]: "#c084fc",
  [TOWER_CLASS_V0.CHESS]: "#f59e0b",
  [TOWER_CLASS_V0.SPORTS]: "#22c55e",
  [TOWER_CLASS_V0.MEDIA]: "#ec4899",
  [TOWER_CLASS_V0.LLM]: "#14b8a6",
  [TOWER_CLASS_V0.ECONOMY]: "#eab308"
});

/** V11 Explorer first-live seed pins. */
const V11_EXPLORER_SEED_TOWERS_V0 = Object.freeze([
  { towerClass: TOWER_CLASS_V0.TRAVEL, label: "Traveler", pinType: "traveler" },
  { towerClass: TOWER_CLASS_V0.EXPLORER, label: "Explorer", pinType: "explorer" },
  { towerClass: TOWER_CLASS_V0.GHOST, label: "Ghost", pinType: "ghost" },
  { towerClass: TOWER_CLASS_V0.CASTLE, label: "Castle", pinType: "castle" }
]);

/** V11 Castle layer dormant seeds (armed, visible on castle map). */
const V11_CASTLE_SEED_TOWERS_V0 = Object.freeze([
  { towerClass: TOWER_CLASS_V0.CASTLE, label: "Castle", pinType: "castle" },
  { towerClass: TOWER_CLASS_V0.RESEARCH, label: "Research", pinType: "research" },
  { towerClass: TOWER_CLASS_V0.ACADEMY, label: "Academy", pinType: "academy" }
]);

/** V11 Economy layer dormant seeds. */
const V11_ECONOMY_SEED_TOWERS_V0 = Object.freeze([
  { towerClass: TOWER_CLASS_V0.ECONOMY, label: "Product", pinType: "product" },
  { towerClass: TOWER_CLASS_V0.ECONOMY, label: "Design", pinType: "design" },
  { towerClass: TOWER_CLASS_V0.MEDIA, label: "Media", pinType: "media" },
  { towerClass: TOWER_CLASS_V0.ECONOMY, label: "Shop", pinType: "shop" }
]);

export const ARENA_POPULATION_CHAIN_V0 = Object.freeze({
  chess: Object.freeze({
    arenaType: ARENA_TYPE_V0.CHESS,
    event: "arena.chess.move.v1",
    cube: "chess_cube",
    towerClass: TOWER_CLASS_V0.CHESS,
    spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER,
    ingest: "ingestChessMoveArena"
  }),
  sports: Object.freeze({
    arenaType: ARENA_TYPE_V0.SPORTS,
    event: "arena.sports.delta.v1",
    cube: "sports_cube",
    towerClass: TOWER_CLASS_V0.SPORTS,
    spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER,
    ingest: "ingestSportsArena"
  }),
  media: Object.freeze({
    arenaType: ARENA_TYPE_V0.MEDIA,
    event: "arena.media.frame.v1",
    cube: "media_cube",
    towerClass: TOWER_CLASS_V0.MEDIA,
    spiralLayer: SPIRAL_MAP_LAYER_V0.ECONOMY,
    ingest: "ingestMediaFrameArena",
    lock: "MEDIA_LEDGERIZATION_LOCKED_PHASE_1"
  }),
  authority: Object.freeze({
    arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
    event: "arena.authority.seal.v1",
    cube: "prism_cube",
    towerClass: TOWER_CLASS_V0.AUTHORITY_EPISTEMIC,
    spiralLayer: SPIRAL_MAP_LAYER_V0.CASTLE
  })
});

/** @type {object[]} */
const arenaPopulationSignalsV0 = [];
/** @type {ReadonlyArray<object>} */
let activeArenaPopulationV0 = Object.freeze([]);

/**
 * @param {string} signal
 * @param {object} [detail]
 */
function publishArenaPopulationSignalV0(signal, detail = {}) {
  const row = Object.freeze({ signal, atMs: Date.now(), ...detail });
  arenaPopulationSignalsV0.unshift(row);
  if (arenaPopulationSignalsV0.length > 64) arenaPopulationSignalsV0.length = 64;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent("rhizoh:arena-population-v0", { detail: row }));
  }
  return row;
}

/**
 * @param {object} opts
 */
export function buildArenaPopulationPinV0(opts) {
  const towerClass = opts.towerClass || TOWER_CLASS_V0.EXPLORER;
  const spiralLayer = opts.spiralLayer || resolveSpiralMapLayerV0(towerClass);
  const lat = Number(opts.lat);
  const lon = Number(opts.lon);
  const id =
    opts.id ||
    foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
      schema: ARENA_POPULATION_LAYER_SCHEMA_V0,
      towerClass,
      lat,
      lon,
      kind: opts.populationKind || ARENA_POPULATION_KIND_V0.V11_SEED
    });

  return Object.freeze({
    id: `arena_pop:${id}`,
    name: opts.name || towerClass,
    label: opts.label || towerClass,
    type: opts.pinType || "agent",
    lat,
    lon,
    color: TOWER_PIN_COLOR_V0[towerClass] || "#6366f1",
    towerClass,
    spiralLayer,
    populationKind: opts.populationKind || ARENA_POPULATION_KIND_V0.V11_SEED,
    populationStatus: opts.populationStatus || ARENA_POPULATION_STATUS_V0.ACTIVE,
    arenaType: opts.arenaType || null,
    arenaChain: opts.arenaChain || null,
    description: opts.description || `Arena population · ${towerClass}`,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} observationOrigin
 * @param {readonly object[]} seedDefs
 * @param {string} spiralLayer
 * @param {string} populationStatus
 * @param {number} indexOffset
 */
function buildSeedPinsForLayerV0(
  observationOrigin,
  seedDefs,
  spiralLayer,
  populationStatus,
  indexOffset
) {
  const layerBand = Math.floor(indexOffset / 10);
  return seedDefs.map((seed, i) => {
    const slot = indexOffset + i;
    const offset = computeExplorerSeedSpreadOffsetV0(slot, layerBand);
    return buildArenaPopulationPinV0({
      towerClass: seed.towerClass,
      label: seed.label,
      pinType: seed.pinType,
      lat: observationOrigin.lat + offset.dLat,
      lon: observationOrigin.lon + offset.dLon,
      spiralLayer,
      populationKind: ARENA_POPULATION_KIND_V0.V11_SEED,
      populationStatus,
      description: `V11 ${spiralLayer} · ${seed.label}`
    });
  });
}

/**
 * @param {object} distributedPin
 */
function enrichDistributedPinAsPopulationV0(distributedPin) {
  const towerClass =
    distributedPin.towerClass ||
    resolveTowerClassV0(distributedPin.prismCube?.arenaType);
  const spiralLayer = distributedPin.spiralLayer || resolveSpiralMapLayerV0(towerClass);

  return Object.freeze({
    ...distributedPin,
    towerClass,
    spiralLayer,
    label: towerClass,
    populationKind: ARENA_POPULATION_KIND_V0.AUTHORITY_MERGE,
    populationStatus: ARENA_POPULATION_STATUS_V0.ACTIVE,
    arenaChain: ARENA_POPULATION_CHAIN_V0.authority,
    color: TOWER_PIN_COLOR_V0[towerClass] || distributedPin.color
  });
}

/**
 * @param {{ move: string, entityId: string, observationOrigin?: object }} opts
 */
export function populateChessArenaV0(opts) {
  const bound = ingestChessMoveArenaEventV0(opts.move, opts.entityId);
  if (bound.ok === false) return bound;

  const origin = opts.observationOrigin || resolveObservationOriginV0();
  const chain = ARENA_POPULATION_CHAIN_V0.chess;
  const offset = computeDistributionOffsetV0({ x: 2, y: 1, z: 0 }, 0, 0);

  const pin = buildArenaPopulationPinV0({
    id: `chess:${opts.entityId}:${String(opts.move)}`,
    name: `Chess ${String(opts.move)}`,
    label: TOWER_CLASS_V0.CHESS,
    pinType: "chess",
    lat: origin.lat + offset.dLat,
    lon: origin.lon + offset.dLon,
    towerClass: TOWER_CLASS_V0.CHESS,
    spiralLayer: chain.spiralLayer,
    populationKind: ARENA_POPULATION_KIND_V0.ARENA_EVENT,
    populationStatus: ARENA_POPULATION_STATUS_V0.ACTIVE,
    arenaType: ARENA_TYPE_V0.CHESS,
    arenaChain: chain,
    description: `Chess move · ${opts.move}`
  });

  const entry = Object.freeze({
    ok: true,
    arenaType: ARENA_TYPE_V0.CHESS,
    bound,
    pin,
    chain
  });

  publishArenaPopulationSignalV0("arena.population.chess", {
    entityId: opts.entityId,
    move: opts.move,
    spiralLayer: chain.spiralLayer
  });

  return entry;
}

/**
 * @param {{ eventData?: object, entityId: string, observationOrigin?: object }} opts
 */
export function populateSportsArenaV0(opts) {
  const bound = ingestSportsArenaEventV0(opts.eventData || {}, opts.entityId);
  if (bound.ok === false) return bound;

  const origin = opts.observationOrigin || resolveObservationOriginV0();
  const chain = ARENA_POPULATION_CHAIN_V0.sports;
  const offset = computeDistributionOffsetV0({ x: 3, y: 2, z: 0 }, 0, 0);

  const pin = buildArenaPopulationPinV0({
    id: `sports:${opts.entityId}`,
    name: "Sports Arena",
    label: TOWER_CLASS_V0.SPORTS,
    pinType: "sports",
    lat: origin.lat + offset.dLat,
    lon: origin.lon + offset.dLon,
    towerClass: TOWER_CLASS_V0.SPORTS,
    spiralLayer: chain.spiralLayer,
    populationKind: ARENA_POPULATION_KIND_V0.ARENA_EVENT,
    populationStatus: ARENA_POPULATION_STATUS_V0.ACTIVE,
    arenaType: ARENA_TYPE_V0.SPORTS,
    arenaChain: chain
  });

  publishArenaPopulationSignalV0("arena.population.sports", {
    entityId: opts.entityId,
    spiralLayer: chain.spiralLayer
  });

  return Object.freeze({ ok: true, arenaType: ARENA_TYPE_V0.SPORTS, bound, pin, chain });
}

/**
 * @param {object} [_frame]
 */
export function populateMediaArenaV0(_frame) {
  const locked = ingestMediaFrameArenaEventV0(_frame);
  return Object.freeze({
    ok: false,
    status: ARENA_POPULATION_STATUS_V0.LOCKED,
    reason: locked.reason || ARENA_POPULATION_CHAIN_V0.media.lock,
    chain: ARENA_POPULATION_CHAIN_V0.media
  });
}

/**
 * @param {object[]} pins
 */
export function groupPopulationByLayerV0(pins) {
  const layers = Object.freeze({
    [SPIRAL_MAP_LAYER_V0.EXPLORER]: Object.freeze(
      pins.filter((p) => p.spiralLayer === SPIRAL_MAP_LAYER_V0.EXPLORER)
    ),
    [SPIRAL_MAP_LAYER_V0.CASTLE]: Object.freeze(
      pins.filter((p) => p.spiralLayer === SPIRAL_MAP_LAYER_V0.CASTLE)
    ),
    [SPIRAL_MAP_LAYER_V0.ECONOMY]: Object.freeze(
      pins.filter((p) => p.spiralLayer === SPIRAL_MAP_LAYER_V0.ECONOMY)
    ),
    [SPIRAL_MAP_LAYER_V0.SEASONAL]: Object.freeze(
      pins.filter((p) => p.spiralLayer === SPIRAL_MAP_LAYER_V0.SEASONAL)
    )
  });
  return layers;
}

/**
 * @param {{ spatialDistribution?: object, seedV11Layers?: boolean }} opts
 */
export function populateArenaWorldV0(opts = {}) {
  const spatialDistribution = opts.spatialDistribution || null;

  if (!spatialDistribution || spatialDistribution.ok === false) {
    return Object.freeze({
      schema: `${ARENA_POPULATION_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "spatial_distribution_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const observationOrigin =
    spatialDistribution.observationOrigin || resolveObservationOriginV0();

  const authorityPins = (spatialDistribution.distributedPins || []).map(
    enrichDistributedPinAsPopulationV0
  );

  /** @type {object[]} */
  const seededPins = [];

  if (opts.seedV11Layers !== false) {
    seededPins.push(
      ...buildSeedPinsForLayerV0(
        observationOrigin,
        V11_EXPLORER_SEED_TOWERS_V0,
        SPIRAL_MAP_LAYER_V0.EXPLORER,
        ARENA_POPULATION_STATUS_V0.ACTIVE,
        10
      ),
      ...buildSeedPinsForLayerV0(
        observationOrigin,
        V11_CASTLE_SEED_TOWERS_V0,
        SPIRAL_MAP_LAYER_V0.CASTLE,
        ARENA_POPULATION_STATUS_V0.DORMANT,
        20
      ),
      ...buildSeedPinsForLayerV0(
        observationOrigin,
        V11_ECONOMY_SEED_TOWERS_V0,
        SPIRAL_MAP_LAYER_V0.ECONOMY,
        ARENA_POPULATION_STATUS_V0.DORMANT,
        30
      )
    );
  }

  const populatedPins = Object.freeze([...authorityPins, ...seededPins]);
  activeArenaPopulationV0 = populatedPins;

  const pinsForMap = populatedPins.filter(
    (p) => p.populationStatus === ARENA_POPULATION_STATUS_V0.ACTIVE
  );
  setPrismCubeMapPinsV0(pinsForMap);

  const byLayer = groupPopulationByLayerV0(populatedPins);
  const populationHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: ARENA_POPULATION_LAYER_SCHEMA_V0,
    distributionHead: spatialDistribution.distributionHead,
    totalPins: populatedPins.length,
    activePins: pinsForMap.length
  });

  publishArenaPopulationSignalV0("arena.population.v11_seeded", {
    explorer: byLayer[SPIRAL_MAP_LAYER_V0.EXPLORER].length,
    castle: byLayer[SPIRAL_MAP_LAYER_V0.CASTLE].length,
    economy: byLayer[SPIRAL_MAP_LAYER_V0.ECONOMY].length
  });
  publishArenaPopulationSignalV0("arena.population.complete", {
    totalPins: populatedPins.length,
    activePins: pinsForMap.length
  });

  return Object.freeze({
    schema: `${ARENA_POPULATION_LAYER_SCHEMA_V0}.result`,
    ok: true,
    populationHead,
    populatedCount: populatedPins.length,
    activePinCount: pinsForMap.length,
    dormantPinCount: populatedPins.length - pinsForMap.length,
    populatedPins,
    pinsByLayer: byLayer,
    arenaPopulationChains: ARENA_POPULATION_CHAIN_V0,
    observationOrigin,
    signals: Object.freeze(arenaPopulationSignalsV0.slice(0, 8)),
    realityPhase: ARENA_POPULATION_PHASE_V0.PHASE_5_1_ARENA_POPULATION,
    priorPhase: SPATIAL_DISTRIBUTION_PHASE_V0.PHASE_5_0_SPIRAL_WORLD_LAYER,
    deferred: Object.freeze({
      seasonalPopulation: true,
      mediaLedgerization: true,
      chessAutoIngest: true,
      workerConsensus: true
    }),
    question: "which_pins_populate_each_spiral_layer",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function getArenaPopulationPinsV0() {
  return activeArenaPopulationV0;
}

export function getArenaPopulationByLayerV0() {
  return groupPopulationByLayerV0(activeArenaPopulationV0);
}

/** @type {object | null} */
let lastArenaPopulationV0 = null;

export function getLastArenaPopulationV0() {
  return lastArenaPopulationV0;
}

export function setLastArenaPopulationV0(result) {
  lastArenaPopulationV0 = result;
  return result;
}

export function getArenaPopulationSignalsV0() {
  return Object.freeze([...arenaPopulationSignalsV0]);
}

export function ensureArenaPopulationLayerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.populateArenaWorld) {
    window.__rhizoh.populateArenaWorld = (opts) => {
      const result = populateArenaWorldV0(opts);
      if (result.ok !== false) setLastArenaPopulationV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.arenaPopulation) {
    window.__rhizoh.arenaPopulation = () => getLastArenaPopulationV0();
  }
  if (!window.__rhizoh.arenaPopulationByLayer) {
    window.__rhizoh.arenaPopulationByLayer = () => getArenaPopulationByLayerV0();
  }
  if (!window.__rhizoh.populateChessArena) {
    window.__rhizoh.populateChessArena = (opts) => populateChessArenaV0(opts);
  }
  if (!window.__rhizoh.populateSportsArena) {
    window.__rhizoh.populateSportsArena = (opts) => populateSportsArenaV0(opts);
  }
  if (!window.__rhizoh.populateMediaArena) {
    window.__rhizoh.populateMediaArena = (frame) => populateMediaArenaV0(frame);
  }
  if (!window.__rhizoh.arenaPopulationChains) {
    window.__rhizoh.arenaPopulationChains = () => ARENA_POPULATION_CHAIN_V0;
  }
  if (!window.__rhizoh.arenaPopulationSignals) {
    window.__rhizoh.arenaPopulationSignals = () => getArenaPopulationSignalsV0();
  }

  return window.__rhizoh.populateArenaWorld;
}

/** @internal vitest */
export function resetArenaPopulationForTestV0() {
  lastArenaPopulationV0 = null;
  activeArenaPopulationV0 = Object.freeze([]);
  arenaPopulationSignalsV0.length = 0;
}
