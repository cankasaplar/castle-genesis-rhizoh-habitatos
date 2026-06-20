import {
  AUTHORITY_WAL_HASH_GENESIS_V1,
  foldAuthorityWalSegmentHashV1
} from "./authorityWalHashChainV1.js";
import {
  getAuthorityLedgerWitnessSnapshotV1,
  replayAuthorityLedgerWitnessChainV1
} from "./authorityLedgerWitnessStoreV1.js";

export const EPOCH_MERGE_EVENT_SCHEMA_V1 = "castle.rhizoh.epoch_merge_event.v1";

export const MERGE_STRATEGY_V1 = Object.freeze({
  CAUSAL_ASSIMILATION: "causal_assimilation"
});

export const MERGE_RESOLUTION_MODE_V1 = Object.freeze({
  APPEND_ONLY_RECONCILIATION: "append_only_reconciliation"
});

export const MERGE_RESOLUTION_RULE_V1 = Object.freeze({
  PRESERVE_BOTH_HISTORIES: "preserve_both_histories"
});

/** @type {Map<string, object[]>} */
const mergeEventsBySubjectV1 = new Map();

/**
 * @param {string} sourceEpoch
 * @param {string} targetEpoch
 */
export function computeMergedEpochIdV1(sourceEpoch, targetEpoch) {
  const a = String(sourceEpoch || "epoch_unknown").trim() || "epoch_unknown";
  const b = String(targetEpoch || "epoch_unknown").trim() || "epoch_unknown";
  const sorted = [a, b].sort();
  return foldAuthorityWalSegmentHashV1(AUTHORITY_WAL_HASH_GENESIS_V1, {
    schema: EPOCH_MERGE_EVENT_SCHEMA_V1,
    sourceEpoch: sorted[0],
    targetEpoch: sorted[1],
    mergeStrategy: MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION
  });
}

/**
 * @param {object[]} clientEntries
 * @param {object[]} gatewayEntries
 */
function collectMergePayloadSignalsV1(clientEntries, gatewayEntries) {
  const clientByKey = new Map();
  for (const row of clientEntries || []) {
    const epochId = String(row?.epoch?.epochId || row?.epochId || "").trim();
    const height = Number(row?.height || 0);
    if (!epochId || !height) continue;
    clientByKey.set(`${epochId}:${height}`, String(row?.seal?.sealHash || ""));
  }

  const gatewayByKey = new Map();
  for (const row of gatewayEntries || []) {
    const epochId = String(row?.epochId || "").trim();
    const height = Number(row?.height || 0);
    if (!epochId || !height) continue;
    gatewayByKey.set(`${epochId}:${height}`, String(row?.clientSealHash || ""));
  }

  const keys = new Set([...clientByKey.keys(), ...gatewayByKey.keys()]);
  /** @type {string[]} */
  const missingEntries = [];
  /** @type {string[]} */
  const overlappingSeals = [];
  /** @type {string[]} */
  const divergenceSignals = [];

  for (const key of keys) {
    const c = clientByKey.get(key);
    const g = gatewayByKey.get(key);
    if (c && g && c === g) overlappingSeals.push(key);
    else if (c && !g) missingEntries.push(`gateway:${key}`);
    else if (!c && g) missingEntries.push(`client:${key}`);
    else if (c && g && c !== g) divergenceSignals.push(`seal_conflict:${key}`);
  }

  return Object.freeze({
    missingEntries: Object.freeze(missingEntries),
    overlappingSeals: Object.freeze(overlappingSeals),
    divergenceSignals: Object.freeze(divergenceSignals)
  });
}

/**
 * Causal assimilation — records merge metadata; does not delete epoch chains.
 * @param {string} subjectId
 * @param {object} body
 */
export function assimilateAuthorityEpochMergeV1(subjectId, body) {
  const sourceEpoch = String(body?.sourceEpoch || "").trim();
  const targetEpoch = String(body?.targetEpoch || "").trim();
  const mergeStrategy = String(body?.mergeStrategy || body?.strategy || MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION);
  const clientHead = String(body?.clientHead || body?.clientLedgerHead || "").trim() || null;
  const gatewayHead = String(body?.gatewayHead || body?.gatewayLedgerHead || "").trim() || null;
  const divergence = String(body?.divergence || body?.divergenceClass || "soft_drift");

  if (!sourceEpoch || !targetEpoch) {
    return Object.freeze({
      ok: false,
      error: "source_and_target_epoch_required",
      interpretationOnly: true
    });
  }

  if (mergeStrategy !== MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION) {
    return Object.freeze({
      ok: false,
      error: "unsupported_merge_strategy",
      allowed: MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION,
      interpretationOnly: true
    });
  }

  const sid = String(subjectId || "unknown");
  const mergedEpochId = computeMergedEpochIdV1(sourceEpoch, targetEpoch);
  const sourceReplay = replayAuthorityLedgerWitnessChainV1(sid, sourceEpoch);
  const targetReplay = replayAuthorityLedgerWitnessChainV1(sid, targetEpoch);
  const sourceSnap = getAuthorityLedgerWitnessSnapshotV1(sid, sourceEpoch);
  const targetSnap = getAuthorityLedgerWitnessSnapshotV1(sid, targetEpoch);

  const payloadSignals = collectMergePayloadSignalsV1(
    Array.isArray(body?.clientEntries) ? body.clientEntries : [],
    [
      ...(sourceSnap?.recentWitnessed || []),
      ...(targetSnap?.recentWitnessed || [])
    ]
  );

  const mergeEvent = Object.freeze({
    schema: EPOCH_MERGE_EVENT_SCHEMA_V1,
    mergeId: foldAuthorityWalSegmentHashV1(mergedEpochId, {
      subjectId: sid,
      assimilatedAtMs: Date.now(),
      sourceEpoch,
      targetEpoch
    }),
    sourceEpoch,
    targetEpoch,
    mergeStrategy: MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION,
    payload: Object.freeze({
      clientLedgerHead: clientHead,
      gatewayLedgerHead: gatewayHead,
      divergenceSignals: payloadSignals.divergenceSignals,
      missingEntries: payloadSignals.missingEntries,
      overlappingSeals: payloadSignals.overlappingSeals,
      divergenceClass: divergence
    }),
    resolution: Object.freeze({
      mode: MERGE_RESOLUTION_MODE_V1.APPEND_ONLY_RECONCILIATION,
      rule: MERGE_RESOLUTION_RULE_V1.PRESERVE_BOTH_HISTORIES
    }),
    output: Object.freeze({
      mergedEpochId,
      canonicalPointer: "gateway_witness_extended",
      clientPointer: "client_rebased_chain",
      sourceReplayHeight: sourceReplay.height,
      targetReplayHeight: targetReplay.height
    }),
    interpretationOnly: true,
    nonExecutive: true,
    assimilatedAtMs: Date.now()
  });

  const ring = mergeEventsBySubjectV1.get(sid) || [];
  ring.unshift(mergeEvent);
  if (ring.length > 64) ring.length = 64;
  mergeEventsBySubjectV1.set(sid, ring);

  return Object.freeze({
    ok: true,
    mergeEvent,
    recentMerges: Object.freeze(ring.slice(0, 8)),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {string} subjectId
 */
export function listAuthorityEpochMergesV1(subjectId) {
  const sid = String(subjectId || "unknown");
  const ring = mergeEventsBySubjectV1.get(sid) || [];
  return Object.freeze({
    schema: `${EPOCH_MERGE_EVENT_SCHEMA_V1}.list`,
    subjectId: sid,
    count: ring.length,
    recent: Object.freeze(ring.slice(0, 16)),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** @internal node:test */
export function resetAuthorityEpochMergeStoreForTestV1() {
  mergeEventsBySubjectV1.clear();
}
