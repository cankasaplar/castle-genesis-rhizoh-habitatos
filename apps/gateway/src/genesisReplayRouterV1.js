/**
 * Unified read-only replay: continuity events (ring → archive, deduped by seq) + optional checkpoint band.
 * Does not mint assertions; priority = live buffer over disk duplicate seq.
 *
 * @see genesisContinuityStreamHubV0.js (ring)
 * @see genesisContinuityEventArchiveV0.js (JSONL)
 * @see genesisCheckpointQueryV0.js (structured chain)
 */

import { queryGenesisContinuityRingV0 } from "./genesisContinuityStreamHubV0.js";
import { queryGenesisContinuityEventArchiveV0 } from "./genesisContinuityEventArchiveV0.js";
import { genesisCheckpointQueryRangeV0 } from "./genesisCheckpointQueryV0.js";
import { fingerprintGenesisReplayRouterOutputV1, GENESIS_REPLAY_DETERMINISM_FINGERPRINT_SCHEMA } from "./genesisReplayDeterminismV1.js";

export const GENESIS_REPLAY_ROUTER_SCHEMA = "castle.genesis.replay_router.v1";

/** Inclusive seq span — aligned with checkpoint / archive guards. */
export const GENESIS_REPLAY_ROUTER_MAX_SPAN = 512;

/** Merged continuity event cap (abuse guard). */
export const GENESIS_REPLAY_ROUTER_MAX_EVENTS = 256;

/**
 * @param {{ from: number, to: number, type?: string, typeFilter?: string, includeCheckpoints?: boolean }} opts
 */
export async function resolveGenesisReplayRouterV1(opts) {
  const from = Math.floor(Number(opts?.from) || 0);
  const to = Math.floor(Number(opts?.to) || 0);
  const typeFilter = String(opts?.typeFilter ?? opts?.type ?? "").trim();
  const includeCheckpoints = opts?.includeCheckpoints !== false;

  if (from <= 0 || to <= 0) {
    return { ok: false, error: "invalid_range", schema: GENESIS_REPLAY_ROUTER_SCHEMA };
  }
  if (to < from) {
    return { ok: false, error: "range_inverted", schema: GENESIS_REPLAY_ROUTER_SCHEMA };
  }
  if (to - from > GENESIS_REPLAY_ROUTER_MAX_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_REPLAY_ROUTER_MAX_SPAN,
      schema: GENESIS_REPLAY_ROUTER_SCHEMA
    };
  }

  const ringQ = queryGenesisContinuityRingV0(from, to, typeFilter);
  const ringEvents = ringQ.ok ? ringQ.events : [];
  const ringSeq = new Set(
    ringEvents.map((e) => Math.floor(Number(/** @type {{ seq?: unknown }} */ (e).seq) || 0)).filter((n) => n > 0)
  );

  /** @type {Record<string, unknown>[]} */
  let archiveEvents = [];
  /** @type {{ ok: boolean, matched: number, error?: string, hint?: string }} */
  const archiveSrc = { ok: false, matched: 0 };
  const ar = await queryGenesisContinuityEventArchiveV0(from, to, typeFilter, GENESIS_REPLAY_ROUTER_MAX_EVENTS);
  if (ar.ok) {
    archiveSrc.ok = true;
    archiveEvents = Array.isArray(ar.events) ? ar.events : [];
    archiveSrc.matched = archiveEvents.length;
  } else {
    archiveSrc.error = ar.error;
    archiveSrc.hint = ar.hint;
  }

  let skippedArchiveDup = 0;
  /** @type {Map<number, { ev: Record<string, unknown>, src: "ring" | "archive" }>} */
  const bySeq = new Map();
  for (const e of archiveEvents) {
    const s = Math.floor(Number(/** @type {{ seq?: unknown }} */ (e).seq) || 0);
    if (!s || s < from || s > to) continue;
    if (ringSeq.has(s)) {
      skippedArchiveDup += 1;
      continue;
    }
    bySeq.set(s, { ev: e, src: "archive" });
  }
  for (const e of ringEvents) {
    const s = Math.floor(Number(/** @type {{ seq?: unknown }} */ (e).seq) || 0);
    if (!s) continue;
    bySeq.set(s, { ev: e, src: "ring" });
  }

  let merged = [...bySeq.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, { ev, src }]) => {
      const o = /** @type {Record<string, unknown>} */ (ev);
      return { ...o, _replaySource: src };
    });
  let continuityTruncated = false;
  if (merged.length > GENESIS_REPLAY_ROUTER_MAX_EVENTS) {
    continuityTruncated = true;
    merged = merged.slice(-GENESIS_REPLAY_ROUTER_MAX_EVENTS);
  }

  /** @type {unknown[]} */
  let checkpoints = [];
  /** @type {{ ok: boolean, count: number, error?: string, hint?: string }} */
  const checkpointSrc = { ok: false, count: 0 };
  if (includeCheckpoints) {
    const cp = await genesisCheckpointQueryRangeV0(from, to);
    if (cp.ok) {
      checkpointSrc.ok = true;
      checkpoints = Array.isArray(cp.checkpoints) ? cp.checkpoints : [];
      checkpointSrc.count = checkpoints.length;
    } else {
      checkpointSrc.error = cp.error;
      checkpointSrc.hint = cp.hint;
    }
  }

  const replayFingerprint = fingerprintGenesisReplayRouterOutputV1({
    continuityEvents: merged,
    checkpoints
  });

  return {
    ok: true,
    schema: GENESIS_REPLAY_ROUTER_SCHEMA,
    from,
    to,
    type: typeFilter || null,
    continuityEvents: merged,
    continuityEventCount: merged.length,
    continuityTruncated,
    checkpoints,
    checkpointCount: checkpoints.length,
    replayFingerprint,
    determinismProjection: GENESIS_REPLAY_DETERMINISM_FINGERPRINT_SCHEMA,
    sources: {
      ring: {
        ok: ringQ.ok,
        count: ringEvents.length,
        ...(!ringQ.ok ? { error: ringQ.error, ...("maxSpan" in ringQ ? { maxSpan: ringQ.maxSpan } : {}) } : {})
      },
      archive: {
        ok: archiveSrc.ok,
        matched: archiveSrc.matched,
        skippedAsDuplicateOfRing: skippedArchiveDup,
        ...(archiveSrc.error ? { error: archiveSrc.error, hint: archiveSrc.hint } : {})
      },
      checkpoint: checkpointSrc
    }
  };
}
