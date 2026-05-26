/**
 * Replay Repair Kernel V0 — Phase 2.2 recovery semantics (detect → repair → re-anchor).
 *
 * - corrupted segment detection
 * - hash re-anchor attempt (body intact, hash drift only)
 * - last-known-good (LKG) cursor fallback
 * - deterministic rollback window
 *
 * Does not weaken Faz 2.1 quarantine rules: repair is explicit, auditable, optional apply.
 */

import { deriveWalSegmentIdV0 } from "../substrateContinuityIdbV0.js";
import { mapIssueCodeToBreachV0 } from "./replayCorruptionTaxonomyV0.js";
import { validateWalSegmentIntegrityV0 } from "./walSegmentIntegrityV0.js";
import {
  foldWalSegmentHashV0,
  validateSegmentHashLinkV0,
  WAL_HASH_CHAIN_GENESIS_V0
} from "./walHashChainV0.js";
import { assertNextReplayTickV0 } from "./replayApplyOrderGuardV0.js";

export const REPLAY_REPAIR_KERNEL_SCHEMA_V0 = "castle.rhizoh.replay_repair_kernel.v0";

/** Deterministic rollback depth from LKG tail (inclusive). */
export const DEFAULT_REPLAY_ROLLBACK_WINDOW_TICKS_V0 = 8;

export const REPAIR_OUTCOME_V0 = Object.freeze({
  NOT_NEEDED: "not_needed",
  CURSOR_FALLBACK: "cursor_fallback",
  HASH_REANCHOR: "hash_reanchor",
  ROLLBACK_WINDOW: "rollback_window",
  FAILED: "failed"
});

/**
 * @param {string} expectedDiskKey
 * @param {import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null} segment
 */
function assertDiskKeyBoundV0(expectedDiskKey, segment) {
  if (!segment) return { ok: true };
  if (segment.diskKey !== expectedDiskKey) {
    return { ok: false, code: "disk_key_mismatch" };
  }
  return { ok: true };
}

/**
 * Scan wal chain and locate first corruption + last known good tick.
 *
 * @param {{
 *   diskKey: string,
 *   headTick: number,
 *   getWalSegment: (tick: number) => Promise<import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null>
 * }} ctx
 */
export async function scanWalChainCorruptionV0(ctx) {
  const headTick = Math.max(0, Math.floor(Number(ctx.headTick)));
  let prevHash = WAL_HASH_CHAIN_GENESIS_V0;
  let lastProcessed = -1;
  let lastKnownGoodTick = -1;
  let lastKnownGoodHash = WAL_HASH_CHAIN_GENESIS_V0;
  /** @type {Array<{ tick: number, code: string, breach: string | null, reanchorable?: boolean }>} */
  const corruptions = [];

  for (let t = 0; t <= headTick; t++) {
    const order = assertNextReplayTickV0(lastProcessed, t);
    if (!order.ok) {
      corruptions.push({
        tick: t,
        code: order.code,
        breach: mapIssueCodeToBreachV0(order.code)
      });
      break;
    }

    const segment = await ctx.getWalSegment(t);
    const integrity = validateWalSegmentIntegrityV0(segment);
    if (!integrity.ok) {
      corruptions.push({
        tick: t,
        code: integrity.code,
        breach: mapIssueCodeToBreachV0(integrity.code)
      });
      break;
    }

    const bound = assertDiskKeyBoundV0(ctx.diskKey, segment);
    if (!bound.ok) {
      corruptions.push({
        tick: t,
        code: bound.code,
        breach: mapIssueCodeToBreachV0(bound.code)
      });
      break;
    }

    const link = validateSegmentHashLinkV0(prevHash, segment);
    if (!link.ok) {
      const reanchorable =
        segment?.body != null &&
        typeof segment.body === "object" &&
        foldWalSegmentHashV0(prevHash, segment.body) !== segment.hash;
      corruptions.push({
        tick: t,
        code: link.code,
        breach: mapIssueCodeToBreachV0(link.code),
        reanchorable: Boolean(reanchorable)
      });
      break;
    }

    lastKnownGoodTick = t;
    lastKnownGoodHash = String(segment.hash);
    prevHash = lastKnownGoodHash;
    lastProcessed = t;
  }

  return {
    ok: corruptions.length === 0,
    headTick,
    lastKnownGoodTick,
    lastKnownGoodHash,
    corruptions,
    firstCorruption: corruptions[0] ?? null
  };
}

/**
 * Attempt to rebuild segment hash from intact body.
 *
 * @param {string} diskKey
 * @param {string} prevHash
 * @param {import('../substrateContinuityIdbV0.js').WalSegmentRecordV0} segment
 */
export function buildHashReanchorSegmentV0(diskKey, prevHash, segment) {
  const repairedHash = foldWalSegmentHashV0(prevHash, segment.body);
  return {
    ...segment,
    diskKey,
    hash: repairedHash,
    segmentId: deriveWalSegmentIdV0(diskKey, segment.tick, repairedHash)
  };
}

/**
 * Deterministic rollback target from LKG and window.
 *
 * @param {number} lastKnownGoodTick
 * @param {number} rollbackWindowTicks
 */
export function computeRollbackTargetTickV0(lastKnownGoodTick, rollbackWindowTicks) {
  const lkg = Number(lastKnownGoodTick);
  const win = Math.max(0, Math.floor(Number(rollbackWindowTicks)));
  if (lkg < 0) return -1;
  return Math.max(0, lkg - win);
}

/**
 * Build LKG cursor record.
 *
 * @param {string} diskKey
 * @param {number} tick
 * @param {string} hash
 * @param {import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null} [prior]
 */
export function buildLastKnownGoodCursorV0(diskKey, tick, hash, prior = null) {
  const t = Number(tick);
  const h = String(hash || "");
  return {
    diskKey,
    lastTick: t,
    lastHash: h,
    lastSegmentId: deriveWalSegmentIdV0(diskKey, t, h),
    bootGeneration: Number(prior?.bootGeneration) || 0,
    lastEpoch: Number(prior?.lastEpoch) || 0,
    updatedAtMs: Date.now()
  };
}

/**
 * @param {{
 *   diskKey: string,
 *   readReplayCursor: () => Promise<import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null>,
 *   getWalSegment: (tick: number) => Promise<import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null>,
 *   putWalSegment?: (segment: import('../substrateContinuityIdbV0.js').WalSegmentRecordV0) => Promise<{ ok: boolean }>,
 *   writeReplayCursor?: (cursor: import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0) => Promise<{ ok: boolean }>
 * }} ports
 * @param {{
 *   rollbackWindowTicks?: number,
 *   apply?: boolean,
 *   allowHashReanchor?: boolean
 * }} [opts]
 */
export async function runReplayRepairKernelV0(ports, opts = {}) {
  const rollbackWindowTicks =
    Number(opts.rollbackWindowTicks) >= 0
      ? Number(opts.rollbackWindowTicks)
      : DEFAULT_REPLAY_ROLLBACK_WINDOW_TICKS_V0;
  const allowReanchor = opts.allowHashReanchor !== false;
  const apply = opts.apply === true;

  const cursor = await ports.readReplayCursor();
  if (!cursor) {
    return {
      schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0,
      outcome: REPAIR_OUTCOME_V0.NOT_NEEDED,
      ok: true,
      reason: "cold_no_cursor"
    };
  }

  const headTick = Number(cursor.lastTick);
  const scan = await scanWalChainCorruptionV0({
    diskKey: ports.diskKey,
    headTick,
    getWalSegment: ports.getWalSegment
  });

  if (scan.ok) {
    const tail = await ports.getWalSegment(headTick);
    const anchorOk =
      tail && String(tail.hash) === String(cursor.lastHash) && Number(tail.tick) === headTick;
    if (anchorOk) {
      return {
        schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0,
        outcome: REPAIR_OUTCOME_V0.NOT_NEEDED,
        ok: true,
        scan
      };
    }
    const lkgCursor = buildLastKnownGoodCursorV0(
      ports.diskKey,
      headTick,
      String(tail?.hash || cursor.lastHash),
      cursor
    );
    const plan = {
      outcome: REPAIR_OUTCOME_V0.CURSOR_FALLBACK,
      cursorBefore: cursor,
      cursorAfter: lkgCursor,
      scan
    };
    if (apply && ports.writeReplayCursor) {
      await ports.writeReplayCursor(lkgCursor);
    }
    return { schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0, ok: true, ...plan };
  }

  const first = scan.firstCorruption;
  const lkgTick = scan.lastKnownGoodTick;
  const rollbackTargetTick = computeRollbackTargetTickV0(lkgTick, rollbackWindowTicks);

  if (lkgTick < 0) {
    return {
      schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0,
      outcome: REPAIR_OUTCOME_V0.FAILED,
      ok: false,
      scan,
      reason: "no_last_known_good"
    };
  }

  const lkgSeg = await ports.getWalSegment(lkgTick);
  if (!lkgSeg) {
    return {
      schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0,
      outcome: REPAIR_OUTCOME_V0.FAILED,
      ok: false,
      scan,
      reason: "lkg_segment_missing"
    };
  }

  // Hash re-anchor: body intact, hash drift only — repair tick at first corruption
  if (allowReanchor && first?.reanchorable && first.tick === lkgTick + 1) {
    const corruptSeg = await ports.getWalSegment(first.tick);
    const prevHash = String(lkgSeg.hash || WAL_HASH_CHAIN_GENESIS_V0);
    if (corruptSeg) {
      const repaired = buildHashReanchorSegmentV0(ports.diskKey, prevHash, corruptSeg);
      const verify = validateSegmentHashLinkV0(prevHash, repaired);
      if (verify.ok) {
        const lkgCursor = buildLastKnownGoodCursorV0(
          ports.diskKey,
          first.tick,
          repaired.hash,
          cursor
        );
        const plan = {
          outcome: REPAIR_OUTCOME_V0.HASH_REANCHOR,
          scan,
          corruption: first,
          repairedSegment: repaired,
          cursorBefore: cursor,
          cursorAfter: lkgCursor,
          rollbackWindowTicks,
          rollbackTargetTick,
          lastKnownGoodTick: lkgTick
        };
        if (apply && ports.putWalSegment && ports.writeReplayCursor) {
          await ports.putWalSegment(repaired);
          await ports.writeReplayCursor(lkgCursor);
        }
        return { schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0, ok: true, ...plan };
      }
    }
  }

  // LKG cursor fallback + deterministic rollback window (replay entry tick)
  const lkgCursor = buildLastKnownGoodCursorV0(
    ports.diskKey,
    lkgTick,
    String(lkgSeg.hash),
    cursor
  );
  const plan = {
    outcome:
      rollbackTargetTick < lkgTick
        ? REPAIR_OUTCOME_V0.ROLLBACK_WINDOW
        : REPAIR_OUTCOME_V0.CURSOR_FALLBACK,
    ok: true,
    scan,
    corruption: first,
    cursorBefore: cursor,
    cursorAfter: lkgCursor,
    rollbackWindowTicks,
    rollbackTargetTick,
    lastKnownGoodTick: lkgTick
  };

  if (apply && ports.writeReplayCursor) {
    await ports.writeReplayCursor(lkgCursor);
  }

  return { schema: REPLAY_REPAIR_KERNEL_SCHEMA_V0, ...plan };
}
