/**
 * Cross-Epoch Deterministic Replay v1 — multi-epoch merge replay surface.
 * Question: "which unified reality was produced?" — not "which reality is correct?"
 * NO override · NO history deletion · preserve_both_histories
 * RESEARCH-ONLY
 * @see docs/RHIZOH_EPOCH_MERGE_EVENT_V1.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const CROSS_EPOCH_REPLAY_SCHEMA_V1 = "castle.rhizoh.cross_epoch_deterministic_replay.v1";

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
      epochId: mergeEvent?.sourceEpoch || opts.clientReplay?.epochId,
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
  /** @type {object[]} */
  const unifiedTrace = [];
  let conflicts = 0;
  let aligned = 0;
  let missingSides = 0;

  for (const key of partitions) {
    const slot = byPartition.get(key);
    const clientSeal = slot?.client?.sealHash || null;
    const gatewaySeal = slot?.gateway?.sealHash || null;
    let status = "aligned";
    if (clientSeal && gatewaySeal && clientSeal !== gatewaySeal) {
      status = "seal_conflict_preserved";
      conflicts += 1;
    } else if (clientSeal && gatewaySeal && clientSeal === gatewaySeal) {
      aligned += 1;
    } else {
      status = "partial_presence";
      missingSides += 1;
    }
    unifiedTrace.push(
      Object.freeze({
        partitionKey: key,
        status,
        clientSealHash: clientSeal,
        gatewaySealHash: gatewaySeal,
        preservedBoth: Boolean(clientSeal && gatewaySeal)
      })
    );
  }

  const mergedEpochId = mergeEvent?.output?.mergedEpochId || null;
  const replayHead =
    mergedEpochId &&
    foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
      schema: CROSS_EPOCH_REPLAY_SCHEMA_V1,
      mergedEpochId,
      partitionCount: partitions.length,
      aligned,
      conflicts
    });

  return Object.freeze({
    schema: `${CROSS_EPOCH_REPLAY_SCHEMA_V1}.result`,
    ok: conflicts === 0,
    mergedEpochId,
    replayHead: replayHead || null,
    partitionCount: partitions.length,
    alignedPartitions: aligned,
    conflictPartitions: conflicts,
    partialPartitions: missingSides,
    unifiedTrace: Object.freeze(unifiedTrace),
    resolutionRule: "preserve_both_histories",
    question: "which_unified_reality_was_produced",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}
