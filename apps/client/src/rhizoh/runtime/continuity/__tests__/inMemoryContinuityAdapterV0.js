/**
 * TEST-ONLY in-memory continuity backend.
 * Never import from production runtime paths — avoids test/production invariant leak.
 */

import {
  assessContinuityHydrateV0,
  canAdvanceReplayCursorV0,
  deriveWalSegmentIdV0,
  resolveSubstrateContinuityDiskKeyV0,
  validateCursorSegmentAnchorV0
} from "../../substrateContinuityIdbV0.js";
import { validateWalSegmentIntegrityV0 } from "../walSegmentIntegrityV0.js";

/**
 * @param {string} [diskKey]
 */
export function createInMemoryContinuityAdapterV0(diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  /** @type {Map<string, import('../../substrateContinuityIdbV0.js').WalSegmentRecordV0>} */
  const segments = new Map();
  /** @type {import('../../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null} */
  let cursor = null;

  const segKey = (tick) => `${dk}:${tick}`;

  return {
    diskKey: dk,

    /** @param {{ tick: number, hash: string, body?: unknown, wallClockMs?: number }} segment */
    async appendWalSegment(segment) {
      const tick = Number(segment.tick);
      const hash = String(segment.hash || "");
      const record = {
        diskKey: dk,
        tick,
        hash,
        segmentId: deriveWalSegmentIdV0(dk, tick, hash),
        wallClockMs: Number(segment.wallClockMs) || Date.now(),
        body: segment.body ?? null
      };
      const integrity = validateWalSegmentIntegrityV0(record);
      if (!integrity.ok) return integrity;
      const k = segKey(tick);
      const existing = segments.get(k);
      if (existing) {
        const same =
          existing.hash === hash && JSON.stringify(existing.body) === JSON.stringify(record.body);
        if (same) return { ok: true, segment: existing, duplicate: true };
        return { ok: false, code: "duplicate_segment", tick };
      }
      segments.set(k, record);
      return { ok: true, segment: record };
    },

    /** @param {number} tick */
    async getWalSegment(tick) {
      return segments.get(segKey(Number(tick))) ?? null;
    },

    async readReplayCursor() {
      return cursor;
    },

    /** @param {Omit<import('../../substrateContinuityIdbV0.js').ReplayCursorRecordV0, 'diskKey' | 'updatedAtMs'>} incoming */
    async writeReplayCursorMonotonic(incoming) {
      const guard = canAdvanceReplayCursorV0(cursor, { ...incoming, diskKey: dk });
      if (!guard.ok) return { ok: false, blocked: true, ...guard };

      const iTick = Number(incoming.lastTick);
      const segment = await this.getWalSegment(iTick);
      const draft = {
        diskKey: dk,
        lastTick: iTick,
        lastHash: String(incoming.lastHash || ""),
        lastSegmentId: String(incoming.lastSegmentId || deriveWalSegmentIdV0(dk, iTick, incoming.lastHash)),
        bootGeneration: Number(incoming.bootGeneration) || (cursor?.bootGeneration ?? 0),
        lastEpoch:
          incoming.lastEpoch !== undefined
            ? Number(incoming.lastEpoch)
            : Number(segment?.body?.realityEpoch) || (cursor?.lastEpoch ?? 0),
        updatedAtMs: Date.now()
      };
      const anchor = validateCursorSegmentAnchorV0(draft, segment);
      if (!anchor.ok) return { ok: false, ...anchor };
      cursor = draft;
      return { ok: true, cursor };
    },

    /** @param {{ requireContinuityProof?: boolean }} [opts] */
    async assessHydrate(opts = {}) {
      const segmentAtCursor =
        cursor != null ? await this.getWalSegment(Number(cursor.lastTick)) : null;
      return assessContinuityHydrateV0({
        cursor,
        segmentAtCursor,
        requireContinuityProof: Boolean(opts.requireContinuityProof)
      });
    },

    /** Test-only direct poison injection */
    async _testPutRawSegment(record) {
      segments.set(segKey(Number(record.tick)), record);
    },

    /** @param {import('../../substrateContinuityIdbV0.js').ReplayCursorRecordV0} next */
    async _testSetCursor(next) {
      cursor = { ...next, diskKey: dk, updatedAtMs: Date.now() };
    },

    /** Repair kernel apply — replace segment at tick (lab only). */
    async putWalSegmentRepaired(segment) {
      const record = { ...segment, diskKey: dk };
      segments.set(segKey(Number(record.tick)), record);
      return { ok: true };
    },

    /** Repair kernel apply — direct cursor write (lab only). */
    async writeReplayCursorDirect(next) {
      cursor = { ...next, diskKey: dk, updatedAtMs: Date.now() };
      return { ok: true };
    }
  };
}
