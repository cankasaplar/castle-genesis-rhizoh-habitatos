import {
  genesisContinuityDiskPersistEnabled,
  readGenesisCheckpointLogRecordsV0,
  validateGenesisCheckpointRecordsChainV0
} from "./genesisContinuityPersistenceV0.js";
import { getGenesisLedgerChainAnchorHexV0 } from "./genesisLedgerAnchorV0.js";

export const GENESIS_CHECKPOINT_QUERY_PROJECTION_BY_SEQ = "castle.genesis.checkpoint_query.by_seq.v0";
export const GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE = "castle.genesis.checkpoint_query.range.v0";
export const GENESIS_CHECKPOINT_QUERY_PROJECTION_LINEAGE = "castle.genesis.checkpoint_query.lineage.v0";

/** Max inclusive seq span for range queries (abuse guard). */
export const GENESIS_CHECKPOINT_QUERY_MAX_RANGE_SPAN = 512;

/** Max checkpoints returned in one response. */
export const GENESIS_CHECKPOINT_QUERY_MAX_RESULTS = 256;

/**
 * Query layer: read-only projections over persisted log — does not mint new assertions.
 */

async function loadValidatedLog() {
  const flag = String(process.env.CASTLE_GENESIS_DISK_PERSIST ?? "").trim();
  if (flag === "0") {
    return {
      ok: false,
      error: "genesis_ephemeral_mode",
      hint: "CASTLE_GENESIS_DISK_PERSIST_explicitly_0",
      records: []
    };
  }
  if (!genesisContinuityDiskPersistEnabled()) {
    return {
      ok: false,
      error: "genesis_disk_query_unavailable",
      hint: "set_CASTLE_GENESIS_DISK_PERSIST_1",
      records: []
    };
  }
  const read = await readGenesisCheckpointLogRecordsV0();
  if (!read.ok) {
    return { ok: false, error: read.error || "checkpoint_log_read_failed", records: read.records || [] };
  }
  const v = validateGenesisCheckpointRecordsChainV0(read.records);
  if (!v.ok) {
    return {
      ok: false,
      error: v.error || "checkpoint_chain_invalid",
      records: [],
      chainBrokenAt: v.linesValidated
    };
  }
  return { ok: true, records: read.records };
}

/**
 * @param {number} seq
 */
export async function genesisCheckpointQueryBySeqV0(seq) {
  const s = Math.floor(Number(seq) || 0);
  if (s <= 0) return { ok: false, error: "invalid_seq", projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_BY_SEQ };
  const L = await loadValidatedLog();
  if (!L.ok) return { ok: false, error: L.error, hint: L.hint, projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_BY_SEQ };
  const hit = L.records.find((r) => Math.floor(Number(r.cp.seqCommittedThrough) || 0) === s);
  if (!hit) {
    return {
      ok: false,
      error: "checkpoint_not_found",
      seq: s,
      projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_BY_SEQ
    };
  }
  return {
    ok: true,
    projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_BY_SEQ,
    seq: s,
    checkpoint: hit.cp,
    lineIndex: hit.lineIndex
  };
}

/**
 * @param {number} fromSeq inclusive
 * @param {number} toSeq inclusive
 */
export async function genesisCheckpointQueryRangeV0(fromSeq, toSeq) {
  const from = Math.floor(Number(fromSeq) || 0);
  const to = Math.floor(Number(toSeq) || 0);
  if (from <= 0 || to <= 0) return { ok: false, error: "invalid_range", projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE };
  if (to < from) return { ok: false, error: "range_inverted", projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE };
  if (to - from > GENESIS_CHECKPOINT_QUERY_MAX_RANGE_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_CHECKPOINT_QUERY_MAX_RANGE_SPAN,
      projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE
    };
  }
  const L = await loadValidatedLog();
  if (!L.ok) return { ok: false, error: L.error, hint: L.hint, projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE };
  const filtered = L.records.filter((r) => {
    const c = Math.floor(Number(r.cp.seqCommittedThrough) || 0);
    return c >= from && c <= to;
  });
  if (filtered.length > GENESIS_CHECKPOINT_QUERY_MAX_RESULTS) {
    return {
      ok: false,
      error: "range_result_cap_exceeded",
      maxResults: GENESIS_CHECKPOINT_QUERY_MAX_RESULTS,
      projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE
    };
  }
  return {
    ok: true,
    projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_RANGE,
    from,
    to,
    count: filtered.length,
    checkpoints: filtered.map((r) => ({
      lineIndex: r.lineIndex,
      seqCommittedThrough: r.cp.seqCommittedThrough,
      ledgerRoot: r.cp.ledgerRoot,
      prevLedgerRoot: r.cp.prevLedgerRoot,
      checkpoint: r.cp
    }))
  };
}

/**
 * All checkpoints with seqCommittedThrough <= throughSeq (causal prefix), ascending.
 * @param {number} throughSeq
 */
export async function genesisCheckpointQueryLineageV0(throughSeq) {
  const t = Math.floor(Number(throughSeq) || 0);
  if (t <= 0) return { ok: false, error: "invalid_seq", projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_LINEAGE };
  const L = await loadValidatedLog();
  if (!L.ok) return { ok: false, error: L.error, hint: L.hint, projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_LINEAGE };
  const filtered = L.records.filter((r) => Math.floor(Number(r.cp.seqCommittedThrough) || 0) <= t);
  if (filtered.length > GENESIS_CHECKPOINT_QUERY_MAX_RESULTS) {
    return {
      ok: false,
      error: "lineage_result_cap_exceeded",
      maxResults: GENESIS_CHECKPOINT_QUERY_MAX_RESULTS,
      projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_LINEAGE
    };
  }
  return {
    ok: true,
    projection: GENESIS_CHECKPOINT_QUERY_PROJECTION_LINEAGE,
    throughSeq: t,
    genesisAnchorHex: getGenesisLedgerChainAnchorHexV0(),
    count: filtered.length,
    checkpoints: filtered.map((r) => ({
      lineIndex: r.lineIndex,
      seqCommittedThrough: r.cp.seqCommittedThrough,
      ledgerRoot: r.cp.ledgerRoot,
      prevLedgerRoot: r.cp.prevLedgerRoot,
      checkpoint: r.cp
    }))
  };
}
