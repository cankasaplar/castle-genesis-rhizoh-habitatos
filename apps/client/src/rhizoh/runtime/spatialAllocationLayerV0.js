/**
 * Spatial Allocation Layer v0 — assigns logical spatial slots to prism cubes.
 * Cube → spatialSlot · arena binding prep · event→world position deferred.
 * Does NOT execute geometry or world runtime — placement only.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { PRISM_CUBE_LINK_TYPE_V0, PRISM_CUBE_PHASE_V0 } from "./prismCubeEngineV0.js";

export const SPATIAL_ALLOCATION_LAYER_SCHEMA_V0 = "castle.rhizoh.spatial_allocation_layer.v0";

export const SPATIAL_COORDINATE_SPACE_V0 = Object.freeze({
  LOGICAL_EPISTEMIC_GRID: "logical_epistemic_grid"
});

export const ARENA_BINDING_STATUS_V0 = Object.freeze({
  PENDING: "pending",
  UNBOUND: "unbound"
});

export const SPATIAL_ALLOCATION_PHASE_V0 = Object.freeze({
  PHASE_4_2_LOGICAL_PLACEMENT: "phase_4_2_logical_spatial_allocation"
});

/** @type {[number, number, number]} */
const LINK_OFFSET_V0 = Object.freeze({
  [PRISM_CUBE_LINK_TYPE_V0.CROSS_EPOCH_BRIDGE]: [1, 0, 0],
  [PRISM_CUBE_LINK_TYPE_V0.TEMPORAL_CHAIN]: [0, 1, 0],
  [PRISM_CUBE_LINK_TYPE_V0.SEMANTIC_COHERENCE]: [0, 0, 1],
  [PRISM_CUBE_LINK_TYPE_V0.PARTITION_ADJACENT]: [1, 1, 0]
});

/**
 * @param {object[]} cubes
 * @param {object} adjacencyGraph
 */
function allocateLogicalPositionsV0(cubes, adjacencyGraph) {
  /** @type {Map<string, { x: number, y: number, z: number }>} */
  const positions = new Map();
  /** @type {Map<string, object>} */
  const cubeById = new Map(cubes.map((c) => [c.cubeId, c]));

  const sorted = [...cubes].sort((a, b) => String(a.cubeId).localeCompare(String(b.cubeId)));
  if (!sorted.length) return positions;

  const root = sorted[0];
  positions.set(root.cubeId, { x: 0, y: 0, z: Number(root.temporalBoundary?.height) || 0 });

  /** @type {string[]} */
  const queue = [root.cubeId];
  const visited = new Set([root.cubeId]);

  const edges = Array.isArray(adjacencyGraph?.edges) ? adjacencyGraph.edges : [];

  while (queue.length) {
    const currentId = queue.shift();
    const currentPos = positions.get(currentId);
    if (!currentPos) continue;

    for (const edge of edges) {
      const neighborId =
        edge.from === currentId ? edge.to : edge.to === currentId ? edge.from : null;
      if (!neighborId || visited.has(neighborId)) continue;

      const offset = LINK_OFFSET_V0[edge.linkType] || [1, 0, 0];
      const neighborCube = cubeById.get(neighborId);
      const z = Number(neighborCube?.temporalBoundary?.height) || currentPos.z;

      positions.set(neighborId, {
        x: currentPos.x + offset[0],
        y: currentPos.y + offset[1],
        z: z + offset[2]
      });
      visited.add(neighborId);
      queue.push(neighborId);
    }
  }

  for (const cube of sorted) {
    if (!positions.has(cube.cubeId)) {
      const h = Number(cube.temporalBoundary?.height) || 0;
      positions.set(cube.cubeId, { x: positions.size, y: 0, z: h });
    }
  }

  return positions;
}

/**
 * @param {object} cube
 * @param {{ x: number, y: number, z: number }} logicalPosition
 */
function buildSpatialSlotV0(cube, logicalPosition) {
  const slotId = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: `${SPATIAL_ALLOCATION_LAYER_SCHEMA_V0}.slot`,
    cubeId: cube.cubeId,
    x: logicalPosition.x,
    y: logicalPosition.y,
    z: logicalPosition.z
  });

  return Object.freeze({
    slotId,
    logicalPosition: Object.freeze({ ...logicalPosition }),
    coordinateSpace: SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID,
    allocationMethod: "topology_bfs_v0",
    worldPosition: null,
    eventAnchor: null
  });
}

/**
 * @param {object} cube
 */
function buildArenaBindingPrepV0(cube) {
  return Object.freeze({
    status: ARENA_BINDING_STATUS_V0.PENDING,
    arenaId: null,
    eventGrammar: null,
    cubeId: cube.cubeId,
    partitionKey: cube.partitionKey,
    note: "arena_binding_layer_not_wired"
  });
}

/**
 * @param {{ prismCubes?: object }} opts
 */
export function allocateSpatialSlotsV0(opts = {}) {
  const prismCubes = opts.prismCubes || null;

  if (!prismCubes || prismCubes.ok === false) {
    return Object.freeze({
      schema: `${SPATIAL_ALLOCATION_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "prism_cubes_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const cubes = Array.isArray(prismCubes.cubes) ? prismCubes.cubes : [];
  if (!cubes.length) {
    return Object.freeze({
      schema: `${SPATIAL_ALLOCATION_LAYER_SCHEMA_V0}.result`,
      ok: false,
      error: "cubes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const positions = allocateLogicalPositionsV0(cubes, prismCubes.adjacencyGraph);

  const placedCubes = cubes.map((cube) => {
    const logicalPosition = positions.get(cube.cubeId) || { x: 0, y: 0, z: 0 };
    const spatialSlot = buildSpatialSlotV0(cube, logicalPosition);
    const arenaBinding = buildArenaBindingPrepV0(cube);

    return Object.freeze({
      ...cube,
      spatialSlot,
      arenaBinding,
      actionSurface: cube.actionSurface ?? null
    });
  });

  const allocationHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: SPATIAL_ALLOCATION_LAYER_SCHEMA_V0,
    topologyHead: prismCubes.topologyHead,
    placedCount: placedCubes.length
  });

  return Object.freeze({
    schema: `${SPATIAL_ALLOCATION_LAYER_SCHEMA_V0}.result`,
    ok: true,
    allocationHead,
    placedCount: placedCubes.length,
    placedCubes: Object.freeze(placedCubes),
    sourceTopologyHead: prismCubes.topologyHead || null,
    realityPhase: SPATIAL_ALLOCATION_PHASE_V0.PHASE_4_2_LOGICAL_PLACEMENT,
    priorPhase: PRISM_CUBE_PHASE_V0.PHASE_4_1_BOUNDED_UNITS,
    coordinateSpace: SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID,
    deferred: Object.freeze({
      worldPosition: true,
      eventAnchor: true,
      arenaIdentityKernel: true,
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "where_are_bounded_cubes_placed_in_logical_space",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastSpatialAllocationV0 = null;

export function getLastSpatialAllocationV0() {
  return lastSpatialAllocationV0;
}

export function setLastSpatialAllocationV0(result) {
  lastSpatialAllocationV0 = result;
  return result;
}

export function ensureSpatialAllocationLayerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.allocateSpatialSlots) {
    window.__rhizoh.allocateSpatialSlots = (opts) => {
      const result = allocateSpatialSlotsV0(opts);
      if (result.ok !== false) setLastSpatialAllocationV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.spatialAllocation) {
    window.__rhizoh.spatialAllocation = () => getLastSpatialAllocationV0();
  }

  return window.__rhizoh.allocateSpatialSlots;
}

/** @internal vitest */
export function resetSpatialAllocationLayerForTestV0() {
  lastSpatialAllocationV0 = null;
}
