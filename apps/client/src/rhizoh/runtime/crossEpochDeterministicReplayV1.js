/**
 * Cross-Epoch Deterministic Replay v1 — multi-epoch merge replay surface.
 * Question: "which unified reality was produced?" — not "which reality is correct?"
 * Graph model: multi-partition DAG — coherence is continuous, not binary alignment.
 * NO override · NO history deletion · preserve_both_histories
 * RESEARCH-ONLY
 * @see docs/RHIZOH_EPOCH_MERGE_EVENT_V1.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const CROSS_EPOCH_REPLAY_SCHEMA_V1 = "castle.rhizoh.cross_epoch_deterministic_replay.v1";

export const REALITY_GRAPH_PHASE_V1 = Object.freeze({
  PHASE_3_MULTI_EPOCH_PARTIAL_GRAPH: "phase_3_multi_epoch_partial_graph"
});

const NAMESPACE_DIVERGENCE_PENALTY_V1 = 0.09;
const COHERENCE_FRAGMENTATION_STEP_V1 = 0.08;

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
 * @param {string} epochId
 * @param {number} height
 */
export function crossEpochPartitionKeyV1(epochId, height) {
  return `${String(epochId || "epoch_unknown")}:${Number(height) || 0}`;
}

/**
 * @param {object[]} traces
 */
function normalizeTraceRowsV1(traces) {
  const rows = [];
  for (const t of traces || []) {
    const epochId = String(t?.epochId || t?.epoch?.epochId || "").trim();
    const height = Number(t?.height || 0);
    const seal = String(t?.actual || t?.clientSealHash || t?.sealHash || t?.expected || "");
    if (!epochId || !height || !seal) continue;
    rows.push(
      Object.freeze({
        partitionKey: crossEpochPartitionKeyV1(epochId, height),
        epochId,
        height,
        sealHash: seal,
        source: String(t?.source || "trace")
      })
    );
  }
  return rows;
}

/**
 * @param {object[]} clientTrace
 * @param {object[]} gatewayTrace
 */
function computeCrossEpochIntegrityV1(clientTrace, gatewayTrace, mergeEvent) {
  /** @type {Map<number, Set<string>>} */
  const clientByHeight = new Map();
  /** @type {Map<number, Set<string>>} */
  const gatewayByHeight = new Map();

  for (const row of clientTrace) {
    const set = clientByHeight.get(row.height) || new Set();
    set.add(row.sealHash);
    clientByHeight.set(row.height, set);
  }
  for (const row of gatewayTrace) {
    const set = gatewayByHeight.get(row.height) || new Set();
    set.add(row.sealHash);
    gatewayByHeight.set(row.height, set);
  }

  const heights = [...new Set([...clientByHeight.keys(), ...gatewayByHeight.keys()])].sort(
    (a, b) => a - b
  );
  if (!heights.length) return 0;

  let sum = 0;
  let fullMatches = 0;
  for (const h of heights) {
    const c = clientByHeight.get(h) || new Set();
    const g = gatewayByHeight.get(h) || new Set();
    if (c.size && g.size) {
      const intersects = [...c].some((seal) => g.has(seal));
      sum += intersects ? 1 : 0;
      if (intersects) fullMatches += 1;
    } else {
      sum += 0.5;
    }
  }

  let raw = sum / heights.length;
  const sourceEpoch = String(mergeEvent?.sourceEpoch || "").trim();
  const targetEpoch = String(mergeEvent?.targetEpoch || "").trim();
  const epochSplit = Boolean(sourceEpoch && targetEpoch && sourceEpoch !== targetEpoch);
  if (epochSplit && fullMatches === heights.length && heights.length > 0) {
    raw = clamp01V1(raw - NAMESPACE_DIVERGENCE_PENALTY_V1);
  }

  return round2V1(clamp01V1(raw));
}

/**
 * Graph-level coherence — continuous, not binary alignment.
 * @param {number} crossEpochIntegrity
 * @param {number} partitionCount
 * @param {number} uniqueHeights
 * @param {number} conflictPartitions
 * @param {number} samePartitionAligned
 */
function computePartitionCoherenceV1(
  crossEpochIntegrity,
  partitionCount,
  uniqueHeights,
  conflictPartitions,
  samePartitionAligned
) {
  if (conflictPartitions > 0) return 0;
  if (!partitionCount) return 0;

  const fragmentation = Math.max(0, partitionCount - uniqueHeights);
  const samePartitionBonus = samePartitionAligned > 0 ? Math.min(0.1, samePartitionAligned / partitionCount) : 0;

  return round2V1(
    clamp01V1(crossEpochIntegrity - fragmentation * COHERENCE_FRAGMENTATION_STEP_V1 + samePartitionBonus)
  );
}

/**
 * @param {number} height
 * @param {string | null} seal
 * @param {"client" | "gateway"} side
 * @param {object[]} clientTrace
 * @param {object[]} gatewayTrace
 */
function hasCrossEpochSealBridgeV1(height, seal, side, clientTrace, gatewayTrace) {
  if (!seal) return false;
  const other = side === "client" ? gatewayTrace : clientTrace;
  return other.some((row) => row.height === height && row.sealHash === seal);
}

/**
 * Deterministic union replay across epochs — conflicts preserved, not resolved by override.
 * @param {{
 *   clientReplay?: object,
 *   gatewayReplay?: object,
 *   mergeEvent?: object,
 *   extraTraces?: object[]
 * }} opts
 */
export function crossEpochDeterministicReplayV1(opts = {}) {
  const mergeEvent = opts.mergeEvent || null;
  const clientTrace = normalizeTraceRowsV1(
    (opts.clientReplay?.trace || []).map((t) => ({
      ...t,
      epochId: t?.epochId || mergeEvent?.sourceEpoch || opts.clientReplay?.epochId,
      source: "client"
    }))
  );
  const gatewayTrace = normalizeTraceRowsV1(
    (opts.gatewayReplay?.trace || []).map((t) => ({
      ...t,
      epochId: t?.epochId || mergeEvent?.targetEpoch || opts.gatewayReplay?.epochId,
      source: "gateway"
    }))
  );
  const extra = normalizeTraceRowsV1(opts.extraTraces || []);

  /** @type {Map<string, { client?: object, gateway?: object, extras: object[] }>} */
  const byPartition = new Map();

  for (const row of clientTrace) {
    const slot = byPartition.get(row.partitionKey) || { extras: [] };
    slot.client = row;
    byPartition.set(row.partitionKey, slot);
  }
  for (const row of gatewayTrace) {
    const slot = byPartition.get(row.partitionKey) || { extras: [] };
    slot.gateway = row;
    byPartition.set(row.partitionKey, slot);
  }
  for (const row of extra) {
    const slot = byPartition.get(row.partitionKey) || { extras: [] };
    slot.extras.push(row);
    byPartition.set(row.partitionKey, slot);
  }

  const partitions = [...byPartition.keys()].sort();
  const uniqueHeights = new Set([
    ...clientTrace.map((r) => r.height),
    ...gatewayTrace.map((r) => r.height)
  ]).size;

  const crossEpochIntegrity = computeCrossEpochIntegrityV1(clientTrace, gatewayTrace, mergeEvent);

  /** @type {object[]} */
  const unifiedTrace = [];
  let samePartitionAligned = 0;
  let conflictPartitions = 0;
  let partialPartitions = 0;
  let crossEpochCoherentPartitions = 0;

  for (const key of partitions) {
    const slot = byPartition.get(key);
    const clientSeal = slot?.client?.sealHash || null;
    const gatewaySeal = slot?.gateway?.sealHash || null;
    const height = Number(slot?.client?.height || slot?.gateway?.height || 0);

    let status = "aligned";
    let crossEpochSealBridge = false;

    if (clientSeal && gatewaySeal && clientSeal !== gatewaySeal) {
      status = "seal_conflict_preserved";
      conflictPartitions += 1;
    } else if (clientSeal && gatewaySeal && clientSeal === gatewaySeal) {
      samePartitionAligned += 1;
    } else {
      const bridgeClient =
        clientSeal &&
        hasCrossEpochSealBridgeV1(height, clientSeal, "client", clientTrace, gatewayTrace);
      const bridgeGateway =
        gatewaySeal &&
        hasCrossEpochSealBridgeV1(height, gatewaySeal, "gateway", clientTrace, gatewayTrace);
      crossEpochSealBridge = Boolean(bridgeClient || bridgeGateway);
      if (crossEpochSealBridge) {
        status = "cross_epoch_coherent";
        crossEpochCoherentPartitions += 1;
      } else {
        status = "partial_presence";
        partialPartitions += 1;
      }
    }

    unifiedTrace.push(
      Object.freeze({
        partitionKey: key,
        status,
        clientSealHash: clientSeal,
        gatewaySealHash: gatewaySeal,
        crossEpochSealBridge,
        preservedBoth: Boolean(clientSeal && gatewaySeal)
      })
    );
  }

  const partitionCoherence = computePartitionCoherenceV1(
    crossEpochIntegrity,
    partitions.length,
    uniqueHeights,
    conflictPartitions,
    samePartitionAligned
  );

  const mergedEpochId = mergeEvent?.output?.mergedEpochId || null;
  const replayHead =
    mergedEpochId &&
    foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
      schema: CROSS_EPOCH_REPLAY_SCHEMA_V1,
      mergedEpochId,
      partitionCount: partitions.length,
      partitionCoherence,
      crossEpochIntegrity
    });

  return Object.freeze({
    schema: `${CROSS_EPOCH_REPLAY_SCHEMA_V1}.result`,
    ok: conflictPartitions === 0,
    mergedEpochId,
    replayHead: replayHead || null,
    partitionCount: partitions.length,
    partitionCoherence,
    crossEpochIntegrity,
    graphModel: "multi_partition_dag",
    realityPhase: REALITY_GRAPH_PHASE_V1.PHASE_3_MULTI_EPOCH_PARTIAL_GRAPH,
    samePartitionAligned,
    crossEpochCoherentPartitions,
    conflictPartitions,
    partialPartitions,
    /** @deprecated use samePartitionAligned — binary alignment misleading in multi-epoch graph */
    alignedPartitions: samePartitionAligned,
    unifiedTrace: Object.freeze(unifiedTrace),
    resolutionRule: "preserve_both_histories",
    question: "which_unified_reality_was_produced",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}
