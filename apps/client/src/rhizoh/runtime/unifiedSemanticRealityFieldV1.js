/**
 * Unified Semantic Reality Field v1 — Phase 4 projection from multi-partition DAG.
 * Projects partition graph → interpretable semantic field (no execution authority).
 * Question: "what semantic field does the merged graph project?" — not "what is true?"
 * RESEARCH-ONLY
 * @see docs/RHIZOH_UNIFIED_SEMANTIC_REALITY_FIELD_V1.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { REALITY_GRAPH_PHASE_V1 } from "./crossEpochDeterministicReplayV1.js";

export const UNIFIED_SEMANTIC_REALITY_FIELD_SCHEMA_V1 =
  "castle.rhizoh.unified_semantic_reality_field.v1";

export const REALITY_FIELD_PHASE_V1 = Object.freeze({
  PHASE_4_UNIFIED_SEMANTIC_FIELD: "phase_4_unified_semantic_reality_field"
});

export const SEMANTIC_NODE_CLASS_V1 = Object.freeze({
  SAME_PARTITION_AUTHORITY: "same_partition_authority",
  CROSS_EPOCH_WITNESS_BRIDGE: "cross_epoch_witness_bridge",
  PARTIAL_SEMANTIC_PRESENCE: "partial_semantic_presence",
  CONFLICT_PRESERVED_SEMANTIC: "conflict_preserved_semantic"
});

const TRUST_CLASS_V1 = "interpretation_only";

/**
 * @param {number} n
 */
function clamp01V1(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {number} n
 */
function round2V1(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * @param {string} status
 */
function semanticClassFromPartitionStatusV1(status) {
  switch (String(status || "")) {
    case "aligned":
      return SEMANTIC_NODE_CLASS_V1.SAME_PARTITION_AUTHORITY;
    case "cross_epoch_coherent":
      return SEMANTIC_NODE_CLASS_V1.CROSS_EPOCH_WITNESS_BRIDGE;
    case "seal_conflict_preserved":
      return SEMANTIC_NODE_CLASS_V1.CONFLICT_PRESERVED_SEMANTIC;
    default:
      return SEMANTIC_NODE_CLASS_V1.PARTIAL_SEMANTIC_PRESENCE;
  }
}

/**
 * @param {string} semanticClass
 * @param {number} crossEpochIntegrity
 */
function fieldWeightFromClassV1(semanticClass, crossEpochIntegrity) {
  switch (semanticClass) {
    case SEMANTIC_NODE_CLASS_V1.SAME_PARTITION_AUTHORITY:
      return 1;
    case SEMANTIC_NODE_CLASS_V1.CROSS_EPOCH_WITNESS_BRIDGE:
      return round2V1(clamp01V1(0.75 + 0.25 * crossEpochIntegrity));
    case SEMANTIC_NODE_CLASS_V1.CONFLICT_PRESERVED_SEMANTIC:
      return 0;
    default:
      return 0.5;
  }
}

/**
 * @param {object[]} semanticNodes
 * @param {number} partitionCoherence
 */
function computeFieldCoherenceV1(semanticNodes, partitionCoherence) {
  if (!semanticNodes.length) return 0;
  const weights = semanticNodes.map((n) => Number(n.fieldWeight) || 0);
  const meanWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
  return round2V1(clamp01V1(partitionCoherence * 0.6 + meanWeight * 0.4));
}

/**
 * @param {object} crossEpochReplay
 * @param {object | null} mergeEvent
 */
function buildSemanticNodesV1(crossEpochReplay, mergeEvent) {
  const integrity = Number(crossEpochReplay?.crossEpochIntegrity) || 0;
  const trace = Array.isArray(crossEpochReplay?.unifiedTrace) ? crossEpochReplay.unifiedTrace : [];

  return trace.map((slot) => {
    const [epochId, heightRaw] = String(slot.partitionKey || ":").split(":");
    const height = Number(heightRaw) || 0;
    const semanticClass = semanticClassFromPartitionStatusV1(slot.status);
    const sealRef = String(slot.clientSealHash || slot.gatewaySealHash || "");
    const fieldWeight = fieldWeightFromClassV1(semanticClass, integrity);

    return Object.freeze({
      nodeId: foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
        schema: `${UNIFIED_SEMANTIC_REALITY_FIELD_SCHEMA_V1}.node`,
        partitionKey: slot.partitionKey,
        semanticClass,
        sealRef: sealRef || null
      }),
      partitionKey: slot.partitionKey,
      epochId: epochId || null,
      height,
      semanticClass,
      sealRef: sealRef || null,
      fieldWeight,
      crossEpochSealBridge: Boolean(slot.crossEpochSealBridge),
      trustClass: TRUST_CLASS_V1,
      derivationDepth: 1,
      sourceChain: Object.freeze([
        mergeEvent?.sourceEpoch || "client_epoch",
        mergeEvent?.targetEpoch || "gateway_epoch",
        slot.partitionKey
      ])
    });
  });
}

/**
 * @param {{
 *   crossEpochReplay?: object,
 *   mergeEvent?: object | null,
 *   alignment?: object | null
 * }} opts
 */
export function projectUnifiedSemanticRealityFieldV1(opts = {}) {
  const crossEpochReplay = opts.crossEpochReplay || null;
  const mergeEvent = opts.mergeEvent || null;

  if (!crossEpochReplay) {
    return Object.freeze({
      schema: `${UNIFIED_SEMANTIC_REALITY_FIELD_SCHEMA_V1}.result`,
      ok: false,
      error: "cross_epoch_replay_required",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  const semanticNodes = buildSemanticNodesV1(crossEpochReplay, mergeEvent);
  const partitionCoherence = Number(crossEpochReplay.partitionCoherence) || 0;
  const crossEpochIntegrity = Number(crossEpochReplay.crossEpochIntegrity) || 0;
  const fieldCoherence = computeFieldCoherenceV1(semanticNodes, partitionCoherence);
  const mergedEpochId = mergeEvent?.output?.mergedEpochId || crossEpochReplay.mergedEpochId || null;

  const projectionHead = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: UNIFIED_SEMANTIC_REALITY_FIELD_SCHEMA_V1,
    mergedEpochId,
    fieldCoherence,
    crossEpochIntegrity,
    nodeCount: semanticNodes.length
  });

  return Object.freeze({
    schema: `${UNIFIED_SEMANTIC_REALITY_FIELD_SCHEMA_V1}.result`,
    ok: crossEpochReplay.ok !== false,
    fieldId: projectionHead,
    projectionHead,
    mergedEpochId,
    fieldCoherence,
    partitionCoherence,
    crossEpochIntegrity,
    graphModel: crossEpochReplay.graphModel || "multi_partition_dag",
    realityPhase: REALITY_FIELD_PHASE_V1.PHASE_4_UNIFIED_SEMANTIC_FIELD,
    priorPhase: REALITY_GRAPH_PHASE_V1.PHASE_3_MULTI_EPOCH_PARTIAL_GRAPH,
    semanticNodeCount: semanticNodes.length,
    semanticNodes: Object.freeze(semanticNodes),
    alignmentHint: opts.alignment
      ? Object.freeze({
          divergenceType: opts.alignment.divergenceType || null,
          witnessPropagation: opts.alignment.witnessPropagation || null
        })
      : null,
    question: "what_semantic_field_does_merged_graph_project",
    trustClass: TRUST_CLASS_V1,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @type {object | null} */
let lastSemanticFieldV1 = null;

export function getLastSemanticRealityFieldV1() {
  return lastSemanticFieldV1;
}

export function setLastSemanticRealityFieldV1(field) {
  lastSemanticFieldV1 = field;
  return field;
}

export function ensureUnifiedSemanticRealityFieldV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.projectSemanticRealityField) {
    window.__rhizoh.projectSemanticRealityField = (opts) => {
      const field = projectUnifiedSemanticRealityFieldV1(opts);
      if (field.ok !== false) setLastSemanticRealityFieldV1(field);
      return field;
    };
  }
  if (!window.__rhizoh.semanticRealityField) {
    window.__rhizoh.semanticRealityField = () =>
      lastSemanticFieldV1 || getLastSemanticRealityFieldV1();
  }
  if (!window.__rhizoh.runSemanticRealityPipeline) {
    window.__rhizoh.runSemanticRealityPipeline = async (opts) => {
      const { epochMergeAndAssimilateV1 } = await import("./authorityEpochMergeEventV1.js");
      return epochMergeAndAssimilateV1(opts);
    };
  }

  return window.__rhizoh.projectSemanticRealityField;
}

/** @internal vitest */
export function resetUnifiedSemanticRealityFieldForTestV1() {
  lastSemanticFieldV1 = null;
}
