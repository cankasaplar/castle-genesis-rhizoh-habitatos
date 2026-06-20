/**
 * Prism Cube Engine v0 — semantic compression into bounded execution units.
 * Stabilizes semantic reality into cube topology — does NOT spatialize or execute.
 * Cube = execution substrate prep (temporal boundary + semantic compression only).
 * Action surface + spatial slot explicitly deferred.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_PRISM_CUBE_ENGINE_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { REALITY_FIELD_PHASE_V1 } from "./unifiedSemanticRealityFieldV1.js";

export const PRISM_CUBE_ENGINE_SCHEMA_V0 = "castle.rhizoh.prism_cube_engine.v0";

export const PRISM_CUBE_LINK_TYPE_V0 = Object.freeze({
  CROSS_EPOCH_BRIDGE: "cross_epoch_bridge",
  TEMPORAL_CHAIN: "temporal_chain",
  SEMANTIC_COHERENCE: "semantic_coherence",
  PARTITION_ADJACENT: "partition_adjacent"
});

export const PRISM_CUBE_PHASE_V0 = Object.freeze({
  PHASE_4_1_BOUNDED_UNITS: "phase_4_1_semantic_compression_units"
});

/**
 * @param {object} node
 */
function buildCubePayloadV0(node) {
  return Object.freeze({
    nodeId: node.nodeId,
    semanticClass: node.semanticClass,
    sealRef: node.sealRef,
    fieldWeight: node.fieldWeight,
    height: node.height,
    crossEpochSealBridge: Boolean(node.crossEpochSealBridge),
    compressed: true
  });
}

/**
 * @param {object[]} cubes
 */
function buildAdjacencyGraphV0(cubes) {
  /** @type {object[]} */
  const edges = [];

  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const a = cubes[i];
      const b = cubes[j];

      if (a.epochBoundary.epochId !== b.epochBoundary.epochId && a.height === b.height) {
        if (a.payload.sealRef && a.payload.sealRef === b.payload.sealRef) {
          edges.push(
            Object.freeze({
              from: a.cubeId,
              to: b.cubeId,
              linkType: PRISM_CUBE_LINK_TYPE_V0.CROSS_EPOCH_BRIDGE,
              height: a.height,
              sealRef: a.payload.sealRef
            })
          );
        }
      }

      if (a.epochBoundary.epochId === b.epochBoundary.epochId && a.height !== b.height) {
        edges.push(
          Object.freeze({
            from: a.cubeId,
            to: b.cubeId,
            linkType: PRISM_CUBE_LINK_TYPE_V0.TEMPORAL_CHAIN,
            epochId: a.epochBoundary.epochId
          })
        );
      }

      if (a.payload.sealRef && a.payload.sealRef === b.payload.sealRef) {
        edges.push(
          Object.freeze({
            from: a.cubeId,
            to: b.cubeId,
            linkType: PRISM_CUBE_LINK_TYPE_V0.SEMANTIC_COHERENCE,
            sealRef: a.payload.sealRef
          })
        );
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const e of edges) {
    const key = [e.from, e.to, e.linkType].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }

  return Object.freeze({
    schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.adjacency`,
    nodeCount: cubes.length,
    edgeCount: unique.length,
    edges: Object.freeze(unique)
  });
}

/**
 * @param {{ semanticField?: object, mergeEvent?: object | null }} opts
 */
export function generatePrismCubesFromSemanticFieldV0(opts = {}) {
  const semanticField = opts.semanticField || null;
  const mergeEvent = opts.mergeEvent || null;

  if (!semanticField || semanticField.ok === false) {
    return Object.freeze({
      schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.result`,
      ok: false,
      error: "semantic_field_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const nodes = Array.isArray(semanticField.semanticNodes) ? semanticField.semanticNodes : [];
  if (!nodes.length) {
    return Object.freeze({
      schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.result`,
      ok: false,
      error: "semantic_nodes_empty",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const cubes = nodes.map((node) => {
    const cubeId = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
      schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.cube`,
      partitionKey: node.partitionKey,
      epochId: node.epochId,
      height: node.height
    });

    return Object.freeze({
      schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.cube`,
      cubeId,
      partitionKey: node.partitionKey,
      epochBoundary: Object.freeze({
        epochId: node.epochId,
        mergedEpochId: semanticField.mergedEpochId || mergeEvent?.output?.mergedEpochId || null
      }),
      temporalBoundary: Object.freeze({
        height: node.height,
        epochId: node.epochId
      }),
      payload: buildCubePayloadV0(node),
      actionSurface: null,
      spatialSlot: null,
      executionSubstrate: true,
      trustClass: "interpretation_only",
      interpretationOnly: true,
      nonExecutive: true
    });
  });

  const adjacencyGraph = buildAdjacencyGraphV0(cubes);
  const topologyHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: PRISM_CUBE_ENGINE_SCHEMA_V0,
    fieldId: semanticField.fieldId || semanticField.projectionHead,
    cubeCount: cubes.length,
    edgeCount: adjacencyGraph.edgeCount
  });

  return Object.freeze({
    schema: `${PRISM_CUBE_ENGINE_SCHEMA_V0}.result`,
    ok: true,
    topologyHead,
    cubeCount: cubes.length,
    cubes: Object.freeze(cubes),
    adjacencyGraph,
    sourceFieldId: semanticField.fieldId || semanticField.projectionHead || null,
    fieldCoherence: semanticField.fieldCoherence ?? null,
    realityPhase: PRISM_CUBE_PHASE_V0.PHASE_4_1_BOUNDED_UNITS,
    priorPhase: REALITY_FIELD_PHASE_V1.PHASE_4_UNIFIED_SEMANTIC_FIELD,
    mode: "semantic_compression_bounded_units",
    deferred: Object.freeze({
      actionSurface: true,
      spatialSlot: true,
      arenaBinding: true,
      mediaLedgerization: true,
      workerConsensus: true
    }),
    question: "how_is_semantic_field_compressed_into_execution_units",
    trustClass: "interpretation_only",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastPrismCubeEngineResultV0 = null;

export function getLastPrismCubeEngineResultV0() {
  return lastPrismCubeEngineResultV0;
}

export function setLastPrismCubeEngineResultV0(result) {
  lastPrismCubeEngineResultV0 = result;
  return result;
}

export function ensurePrismCubeEngineV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.generatePrismCubes) {
    window.__rhizoh.generatePrismCubes = (opts) => {
      const result = generatePrismCubesFromSemanticFieldV0(opts);
      if (result.ok !== false) setLastPrismCubeEngineResultV0(result);
      return result;
    };
  }
  if (!window.__rhizoh.prismCubeEngine) {
    window.__rhizoh.prismCubeEngine = () => getLastPrismCubeEngineResultV0();
  }

  return window.__rhizoh.generatePrismCubes;
}

/** @internal vitest */
export function resetPrismCubeEngineForTestV0() {
  lastPrismCubeEngineResultV0 = null;
}
