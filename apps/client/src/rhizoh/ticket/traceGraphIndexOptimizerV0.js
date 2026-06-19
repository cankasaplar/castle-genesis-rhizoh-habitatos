/**
 * Trace Graph Index Optimizer V0 — Index Builder · Causal Compressor · Drift Signal Extractor.
 *
 * interpretationOnly · nonExecutive · never mutates CubeState or admission
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1, MUTATION_REASON_CODE_V1 } from "./mutationReasonCodeOntologyV1.js";
import { tombstoneTicketV0, TOMBSTONE_REASON_V0 } from "./ticketTombstoneLayerV0.js";

export const TRACE_GRAPH_INDEX_SCHEMA_V0 = "castle.rhizoh.trace_graph_index.v0";
export const CAUSAL_RESIDUE_SCHEMA_V0 = "castle.rhizoh.causal_residue.v0";
export const DRIFT_SIGNAL_SCHEMA_V0 = "castle.rhizoh.drift_signal.v0";

export const DRIFT_SIGNAL_KIND_V0 = Object.freeze({
  PERMISSION_DRIFT: "permission_drift",
  RESOURCE_STRESS: "resource_stress",
  TEMPORAL_DRIFT: "temporal_drift",
  IDENTITY_DRIFT: "identity_drift"
});

/** @type {Map<string, Set<string>>} */
const reasonShardIndexV0 = new Map();
/** @type {Map<string, Set<string>>} */
const actorBucketIndexV0 = new Map();
/** @type {Map<string, Set<string>>} */
const epochPartitionIndexV0 = new Map();
/** @type {Map<string, Set<string>>} */
const statusLaneIndexV0 = new Map();
/** @type {object[]} */
const causalResidueStoreV0 = [];
/** @type {object[]} */
const ingestedRecordsV0 = [];
/** @type {Set<string>} */
const compressedMutationIdsV0 = new Set();

let residueSeqV0 = 0;

const DEFAULT_DRIFT_THRESHOLDS_V0 = Object.freeze({
  permissionDriftShare: 0.35,
  resourceStressMinCount: 3,
  temporalDriftShare: 0.3,
  identityDriftShare: 0.25,
  windowSize: 50
});

/**
 * @param {Map<string, Set<string>>} map
 * @param {string} key
 * @param {string} mutationId
 */
function indexAddV0(map, key, mutationId) {
  const k = String(key || "unknown");
  if (!map.has(k)) map.set(k, new Set());
  map.get(k).add(mutationId);
}

/**
 * @param {object} record — MutationRecord v2
 */
export function buildIndexFromMutationRecordV0(record) {
  const mutationId = String(record?.mutationId || "");
  if (!mutationId) return null;

  const reasonPrimary = record?.reason?.primary || "NONE";
  const actorId = record?.actor?.actorId || "unknown";
  const epoch = record?.epoch || "rec_soft";
  const status = record?.status || "rejected";

  indexAddV0(reasonShardIndexV0, reasonPrimary, mutationId);
  indexAddV0(actorBucketIndexV0, actorId, mutationId);
  indexAddV0(epochPartitionIndexV0, epoch, mutationId);
  indexAddV0(statusLaneIndexV0, status, mutationId);

  return Object.freeze({
    schema: TRACE_GRAPH_INDEX_SCHEMA_V0,
    mutationId,
    reasonShard: reasonPrimary,
    actorBucket: actorId,
    epochPartition: epoch,
    statusLane: status,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} record
 */
export function ingestMutationRecordForIndexV0(record) {
  ingestedRecordsV0.push(record);
  return buildIndexFromMutationRecordV0(record);
}

/**
 * @param {object[]} records
 * @param {{ tombstoneTickets?: boolean }} [opts]
 */
export function compressEligibleRecordsV0(records, opts = {}) {
  const compressibleStatuses = new Set(["expired", "rejected", "quota_denied"]);
  /** @type {Map<string, object[]>} */
  const groups = new Map();

  for (const record of records) {
    const mutationId = String(record?.mutationId || "");
    if (!mutationId || compressedMutationIdsV0.has(mutationId)) continue;
    if (!compressibleStatuses.has(record?.status)) continue;

    const key = [
      record?.reason?.primary || "NONE",
      record?.status,
      record?.epoch || "rec_soft",
      record?.actor?.type || "unknown"
    ].join("|");

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const residues = [];
  for (const [, batch] of groups) {
    if (batch.length === 0) continue;
    const head = batch[0];
    const residue = Object.freeze({
      schema: CAUSAL_RESIDUE_SCHEMA_V0,
      residueId: `res_${++residueSeqV0}`,
      reasonCategory: head?.reason?.category || "SYS",
      reasonPrimary: head?.reason?.primary || "SYS_UNKNOWN_ERROR",
      status: head?.status,
      epoch: head?.epoch,
      actorType: head?.actor?.type || "unknown",
      traceGraphLink: head?.trace?.traceGraphLink || undefined,
      mutationCount: batch.length,
      sampleMutationIds: Object.freeze(batch.slice(0, 5).map((r) => r.mutationId)),
      compressedAt: new Date().toISOString(),
      interpretationOnly: true,
      nonExecutive: true
    });
    causalResidueStoreV0.push(residue);
    residues.push(residue);

    for (const r of batch) {
      compressedMutationIdsV0.add(r.mutationId);
      if (opts.tombstoneTickets === true && r.ticketId) {
        tombstoneTicketV0({
          ticketId: r.ticketId,
          reason: TOMBSTONE_REASON_V0.REC_CLOSEOUT,
          epochId: r.epoch,
          traceGraphLink: r.trace?.traceGraphLink
        });
      }
    }
  }

  return Object.freeze(residues);
}

/**
 * @param {{
 *   windowSize?: number,
 *   thresholds?: Partial<typeof DEFAULT_DRIFT_THRESHOLDS_V0>,
 *   records?: object[]
 * }} [opts]
 */
export function extractDriftSignalsV0(opts = {}) {
  const windowSize = opts.windowSize ?? DEFAULT_DRIFT_THRESHOLDS_V0.windowSize;
  const thresholds = { ...DEFAULT_DRIFT_THRESHOLDS_V0, ...(opts.thresholds || {}) };
  const window = (opts.records ?? ingestedRecordsV0).slice(-windowSize);
  if (window.length === 0) {
    return Object.freeze({ signals: Object.freeze([]), windowSize: 0 });
  }

  /** @type {Record<string, number>} */
  const categoryCounts = {};
  /** @type {Record<string, number>} */
  const codeCounts = {};
  let total = 0;

  for (const r of window) {
    total += 1;
    const cat = r?.reason?.category || "NONE";
    const code = r?.reason?.primary || "NONE";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    codeCounts[code] = (codeCounts[code] || 0) + 1;
  }

  /** @type {object[]} */
  const signals = [];

  const scShare = (categoryCounts[MUTATION_REASON_CATEGORY_V1.SC] || 0) / total;
  if (scShare >= thresholds.permissionDriftShare) {
    signals.push(
      buildDriftSignalV0({
        kind: DRIFT_SIGNAL_KIND_V0.PERMISSION_DRIFT,
        category: MUTATION_REASON_CATEGORY_V1.SC,
        share: scShare,
        topCode: topCodeInCategoryV0(codeCounts, "SC_"),
        message: "SC category frequency elevated — permission boundary stress"
      })
    );
  }

  const quotaCount =
    (codeCounts[MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED] || 0) +
    (codeCounts[MUTATION_REASON_CODE_V1.QUOTA_RATE_LIMITED] || 0) +
    (codeCounts[MUTATION_REASON_CODE_V1.QUOTA_LIMIT_REACHED] || 0);
  if (quotaCount >= thresholds.resourceStressMinCount) {
    signals.push(
      buildDriftSignalV0({
        kind: DRIFT_SIGNAL_KIND_V0.RESOURCE_STRESS,
        category: MUTATION_REASON_CATEGORY_V1.QUOTA,
        share: quotaCount / total,
        topCode: MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED,
        message: "QUOTA reason clustering — resource stress detected"
      })
    );
  }

  const recShare = (categoryCounts[MUTATION_REASON_CATEGORY_V1.REC] || 0) / total;
  if (recShare >= thresholds.temporalDriftShare) {
    signals.push(
      buildDriftSignalV0({
        kind: DRIFT_SIGNAL_KIND_V0.TEMPORAL_DRIFT,
        category: MUTATION_REASON_CATEGORY_V1.REC,
        share: recShare,
        topCode: topCodeInCategoryV0(codeCounts, "REC_"),
        message: "REC category frequency elevated — temporal continuity stress"
      })
    );
  }

  const sigShare = (categoryCounts[MUTATION_REASON_CATEGORY_V1.SIG] || 0) / total;
  if (sigShare >= thresholds.identityDriftShare) {
    signals.push(
      buildDriftSignalV0({
        kind: DRIFT_SIGNAL_KIND_V0.IDENTITY_DRIFT,
        category: MUTATION_REASON_CATEGORY_V1.SIG,
        share: sigShare,
        topCode: topCodeInCategoryV0(codeCounts, "SIG_"),
        message: "SIG category frequency elevated — identity/trust stress"
      })
    );
  }

  return Object.freeze({
    schema: TRACE_GRAPH_INDEX_SCHEMA_V0,
    windowSize: window.length,
    categoryCounts: Object.freeze({ ...categoryCounts }),
    signals: Object.freeze(signals),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {Record<string, number>} codeCounts
 * @param {string} prefix
 */
function topCodeInCategoryV0(codeCounts, prefix) {
  let best = "";
  let max = 0;
  for (const [code, count] of Object.entries(codeCounts)) {
    if (!code.startsWith(prefix)) continue;
    if (count > max) {
      max = count;
      best = code;
    }
  }
  return best || prefix;
}

/**
 * @param {{
 *   kind: string,
 *   category: string,
 *   share: number,
 *   topCode: string,
 *   message: string
 * }} input
 */
function buildDriftSignalV0(input) {
  return Object.freeze({
    schema: DRIFT_SIGNAL_SCHEMA_V0,
    kind: input.kind,
    category: input.category,
    topReasonCode: input.topCode,
    share01: Math.max(0, Math.min(1, input.share)),
    confidenceHint01: Math.max(0, Math.min(1, 0.5 + input.share / 2)),
    message: input.message,
    executionClass: "suggest",
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   records: object[],
 *   compress?: boolean,
 *   tombstoneTickets?: boolean,
 *   windowSize?: number
 * }} input
 */
export function optimizeTraceGraphIndexV0(input) {
  const records = input.records || [];
  const indexRefs = records.map((r) => ingestMutationRecordForIndexV0(r)).filter(Boolean);
  const residues =
    input.compress === true ? compressEligibleRecordsV0(records, { tombstoneTickets: input.tombstoneTickets }) : [];
  const drift = extractDriftSignalsV0({ records, windowSize: input.windowSize });

  return Object.freeze({
    schema: TRACE_GRAPH_INDEX_SCHEMA_V0,
    indexedCount: indexRefs.length,
    residueCount: residues.length,
    indexSnapshot: getTraceGraphIndexSnapshotV0(),
    drift,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getTraceGraphIndexSnapshotV0() {
  const mapToCounts = (m) => {
    /** @type {Record<string, number>} */
    const out = {};
    for (const [k, set] of m.entries()) out[k] = set.size;
    return Object.freeze(out);
  };
  return Object.freeze({
    reasonShards: mapToCounts(reasonShardIndexV0),
    actorBuckets: mapToCounts(actorBucketIndexV0),
    epochPartitions: mapToCounts(epochPartitionIndexV0),
    statusLanes: mapToCounts(statusLaneIndexV0),
    causalResidueCount: causalResidueStoreV0.length,
    ingestedCount: ingestedRecordsV0.length
  });
}

export function listCausalResiduesV0(limit = 50) {
  return causalResidueStoreV0.slice(-limit);
}

/** Test only. */
export function clearTraceGraphIndexForTestV0() {
  reasonShardIndexV0.clear();
  actorBucketIndexV0.clear();
  epochPartitionIndexV0.clear();
  statusLaneIndexV0.clear();
  causalResidueStoreV0.length = 0;
  ingestedRecordsV0.length = 0;
  compressedMutationIdsV0.clear();
  residueSeqV0 = 0;
}
