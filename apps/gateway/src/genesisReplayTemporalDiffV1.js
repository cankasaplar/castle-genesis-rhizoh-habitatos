/**
 * Temporal diff across ring vs archive vs checkpoint band (read-only observability).
 *
 * @see genesisReplayRouterV1.js
 */

import { queryGenesisContinuityRingV0 } from "./genesisContinuityStreamHubV0.js";
import { queryGenesisContinuityEventArchiveV0 } from "./genesisContinuityEventArchiveV0.js";
import { genesisCheckpointQueryRangeV0 } from "./genesisCheckpointQueryV0.js";
import {
  continuityEventIdentitySliceV1,
  stableStringifyGenesisReplayV1
} from "./genesisReplayDeterminismV1.js";
import { GENESIS_REPLAY_ROUTER_MAX_EVENTS, GENESIS_REPLAY_ROUTER_MAX_SPAN } from "./genesisReplayRouterV1.js";

export const GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA = "castle.genesis.replay_temporal_diff.v1";

/**
 * @param {number} from
 * @param {number} to
 * @param {string} typeFilter
 */
function seqSetFromEvents(events, from, to) {
  /** @type {Set<number>} */
  const s = new Set();
  for (const e of events) {
    const n = Math.floor(Number(/** @type {{ seq?: unknown }} */ (e).seq) || 0);
    if (n >= from && n <= to) s.add(n);
  }
  return s;
}

/**
 * @param {{ from: number, to: number, type?: string, typeFilter?: string }} opts
 */
export async function computeGenesisReplayTemporalDiffV1(opts) {
  const from = Math.floor(Number(opts?.from) || 0);
  const to = Math.floor(Number(opts?.to) || 0);
  const typeFilter = String(opts?.typeFilter ?? opts?.type ?? "").trim();

  if (from <= 0 || to <= 0) {
    return { ok: false, error: "invalid_range", schema: GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA };
  }
  if (to < from) {
    return { ok: false, error: "range_inverted", schema: GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA };
  }
  if (to - from > GENESIS_REPLAY_ROUTER_MAX_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_REPLAY_ROUTER_MAX_SPAN,
      schema: GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA
    };
  }

  const rangeSpan = to - from + 1;

  const ringQ = queryGenesisContinuityRingV0(from, to, typeFilter);
  const ringEvents = ringQ.ok ? ringQ.events : [];
  const ringSeq = seqSetFromEvents(ringEvents, from, to);

  /** @type {Record<string, unknown>[]} */
  let archiveEvents = [];
  /** @type {{ ok: boolean, error?: string, hint?: string }} */
  const archiveMeta = { ok: false };
  const ar = await queryGenesisContinuityEventArchiveV0(from, to, typeFilter, GENESIS_REPLAY_ROUTER_MAX_EVENTS);
  if (ar.ok) {
    archiveMeta.ok = true;
    archiveEvents = Array.isArray(ar.events) ? ar.events : [];
  } else {
    archiveMeta.error = ar.error;
    archiveMeta.hint = ar.hint;
  }
  const archiveSeq = seqSetFromEvents(archiveEvents, from, to);

  /** @type {number[]} */
  const overlap = [];
  /** @type {number[]} */
  const ringOnly = [];
  /** @type {number[]} */
  const archiveOnly = [];
  for (const n of ringSeq) {
    if (archiveSeq.has(n)) overlap.push(n);
    else ringOnly.push(n);
  }
  for (const n of archiveSeq) {
    if (!ringSeq.has(n)) archiveOnly.push(n);
  }
  overlap.sort((a, b) => a - b);
  ringOnly.sort((a, b) => a - b);
  archiveOnly.sort((a, b) => a - b);

  /** @type {{ seq: number, ringFingerprint: string, archiveFingerprint: string }[]} */
  const contentMismatch = [];
  const ringBySeq = new Map(ringEvents.map((e) => [Math.floor(Number(e.seq) || 0), e]));
  const archBySeq = new Map(archiveEvents.map((e) => [Math.floor(Number(e.seq) || 0), e]));
  for (const seq of overlap) {
    const re = ringBySeq.get(seq);
    const ae = archBySeq.get(seq);
    if (!re || !ae) continue;
    const fr = stableStringifyGenesisReplayV1(continuityEventIdentitySliceV1(/** @type {Record<string, unknown>} */ (re)));
    const fa = stableStringifyGenesisReplayV1(continuityEventIdentitySliceV1(/** @type {Record<string, unknown>} */ (ae)));
    if (fr !== fa) {
      contentMismatch.push({ seq, ringFingerprint: fr, archiveFingerprint: fa });
    }
  }

  const cp = await genesisCheckpointQueryRangeV0(from, to);
  /** @type {number[]} */
  let checkpointCommittedSeqs = [];
  /** @type {{ ok: boolean, error?: string, hint?: string, count?: number }} */
  const checkpointMeta = { ok: false };
  if (cp.ok) {
    checkpointMeta.ok = true;
    checkpointMeta.count = cp.count;
    const rows = Array.isArray(cp.checkpoints) ? cp.checkpoints : [];
    checkpointCommittedSeqs = rows
      .map((r) => Math.floor(Number(/** @type {{ seqCommittedThrough?: unknown }} */ (r).seqCommittedThrough) || 0))
      .filter((n) => n > 0);
    checkpointCommittedSeqs.sort((a, b) => a - b);
  } else {
    checkpointMeta.error = cp.error;
    checkpointMeta.hint = cp.hint;
  }

  const unionSeq = new Set([...ringSeq, ...archiveSeq]);
  const maxContinuitySeq = unionSeq.size ? Math.max(...unionSeq) : null;
  const maxCheckpointSeq = checkpointCommittedSeqs.length ? Math.max(...checkpointCommittedSeqs) : null;

  const ringArchivePayloadAligned = ringOnly.length === 0 && archiveOnly.length === 0 && contentMismatch.length === 0;

  return {
    ok: true,
    schema: GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA,
    from,
    to,
    type: typeFilter || null,
    rangeSpan,
    seqSets: {
      ring: [...ringSeq].sort((a, b) => a - b),
      archive: [...archiveSeq].sort((a, b) => a - b),
      overlap,
      ringOnly,
      archiveOnly,
      union: [...unionSeq].sort((a, b) => a - b)
    },
    counts: {
      ring: ringSeq.size,
      archive: archiveSeq.size,
      overlap: overlap.length,
      ringOnly: ringOnly.length,
      archiveOnly: archiveOnly.length,
      union: unionSeq.size,
      contentMismatch: contentMismatch.length
    },
    contentMismatch,
    checkpoint: {
      ...checkpointMeta,
      committedSeqs: checkpointCommittedSeqs,
      maxCommittedThrough: maxCheckpointSeq
    },
    signals: {
      /** Ring ve archive aynı seq kümesinde ve gövde özdeş (overlap içinde). */
      ringArchivePayloadAligned,
      /** Ring’de olmayıp archive’da olan seq (bellek ring eviction — beklenen olabilir). */
      archiveRetentionGap: archiveOnly.length > 0,
      /** Archive’da olmayıp ring’de olan seq (archive kapalı / gecikme / disk gap). */
      ringAheadOfArchive: ringOnly.length > 0,
      /** Continuity union son seq ile checkpoint bandı karşılaştırması (bilgi amaçlı). */
      continuityMaxSeq: maxContinuitySeq,
      checkpointMaxSeq: maxCheckpointSeq
    }
  };
}
