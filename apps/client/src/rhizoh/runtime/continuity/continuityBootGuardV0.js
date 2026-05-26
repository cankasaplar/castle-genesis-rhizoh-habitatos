/**
 * Deep hydration boot guard — maps substrate breaches → QUARANTINE_ISOLATION.
 */

import {
  assessContinuityHydrateV0,
  validateCursorSegmentAnchorV0
} from "../substrateContinuityIdbV0.js";
import { validateWalSegmentIntegrityV0 } from "./walSegmentIntegrityV0.js";
import { validateSegmentHashLinkV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./walHashChainV0.js";
import { assertNextReplayTickV0 } from "./replayApplyOrderGuardV0.js";
import {
  mapIssueCodeToBreachV0,
  REPLAY_CORRUPTION_BREACH_V0,
  SUBSTRATE_BOOT_PHASE_V0,
  suggestRecoveryPolicyV0
} from "./replayCorruptionTaxonomyV0.js";

export const CONTINUITY_BOOT_GUARD_SCHEMA_V0 = "castle.rhizoh.continuity_boot_guard.v0";

/**
 * @param {string} expectedDiskKey
 * @param {import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null} segment
 */
function assertDiskKeyBoundV0(expectedDiskKey, segment) {
  if (!segment) return { ok: true };
  if (segment.diskKey !== expectedDiskKey) {
    return { ok: false, code: "disk_key_mismatch", expected: expectedDiskKey, actual: segment.diskKey };
  }
  return { ok: true };
}

/**
 * @param {import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null} cursor
 * @param {number | undefined} minEpoch
 */
function assertEpochMonotonicV0(cursor, minEpoch) {
  const floor = Number(minEpoch);
  const cur = Number(cursor?.lastEpoch);
  if (!Number.isFinite(floor) || !Number.isFinite(cur)) return { ok: true };
  if (cur < floor) {
    return { ok: false, code: "epoch_regressed", floor, cursorEpoch: cur };
  }
  return { ok: true };
}

/**
 * Scan wal chain 0..cursor.lastTick with integrity + order + hash links.
 *
 * @param {{
 *   diskKey: string,
 *   cursor: import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0,
 *   getWalSegment: (tick: number) => Promise<import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null>
 * }} ctx
 */
export async function validateWalChainThroughCursorV0(ctx) {
  const lastTick = Number(ctx.cursor.lastTick);
  if (!Number.isFinite(lastTick) || lastTick < 0) {
    return { ok: false, code: "cursor_tick_invalid" };
  }

  let prevHash = WAL_HASH_CHAIN_GENESIS_V0;
  let lastProcessed = -1;

  for (let t = 0; t <= lastTick; t++) {
    const order = assertNextReplayTickV0(lastProcessed, t);
    if (!order.ok) return order;

    const segment = await ctx.getWalSegment(t);
    const integrity = validateWalSegmentIntegrityV0(segment);
    if (!integrity.ok) return integrity;

    const bound = assertDiskKeyBoundV0(ctx.diskKey, segment);
    if (!bound.ok) return bound;

    const link = validateSegmentHashLinkV0(prevHash, segment);
    if (!link.ok) return link;

    prevHash = String(segment.hash);
    lastProcessed = t;
  }

  const tail = await ctx.getWalSegment(lastTick);
  const anchor = validateCursorSegmentAnchorV0(ctx.cursor, tail);
  if (!anchor.ok) return anchor;

  return { ok: true, lastTick, tailHash: prevHash };
}

/**
 * @param {import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0} persisted
 * @param {import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0} incoming
 */
export function commitCursorWithMonotonicGuardV0(persisted, incoming) {
  const iTick = Number(incoming?.lastTick);
  const pTick = persisted == null ? -1 : Number(persisted.lastTick);
  if (Number.isFinite(pTick) && iTick < pTick) {
    return { ok: false, blocked: true, code: "cursor_regressed", persistedTick: pTick, incomingTick: iTick };
  }
  return { ok: true, blocked: false };
}

/**
 * Deep boot assessment (Faz 2.1). Production path when continuity IDB enabled.
 *
 * @param {{
 *   diskKey: string,
 *   readReplayCursor: () => Promise<import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null>,
 *   getWalSegment: (tick: number) => Promise<import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null>,
 *   minEpoch?: number
 * }} ports
 */
export async function resolveSubstrateContinuityBootGuardV0(ports) {
  const cursor = await ports.readReplayCursor();
  const hydrate = assessContinuityHydrateV0({
    cursor,
    segmentAtCursor:
      cursor != null ? await ports.getWalSegment(Number(cursor.lastTick)) : null,
    requireContinuityProof: true
  });

  if (!cursor) {
    return {
      schema: CONTINUITY_BOOT_GUARD_SCHEMA_V0,
      phase: SUBSTRATE_BOOT_PHASE_V0.RUN,
      hydrate,
      breach: null,
      recoveryPolicy: null
    };
  }

  const epochGuard = assertEpochMonotonicV0(cursor, ports.minEpoch);
  if (!epochGuard.ok) {
    return quarantineFromCodeV0(hydrate, epochGuard.code);
  }

  if (!hydrate.ok) {
    const code = hydrate.issues?.[0] || "continuity_broken";
    return quarantineFromCodeV0(hydrate, code);
  }

  const chain = await validateWalChainThroughCursorV0({
    diskKey: ports.diskKey,
    cursor,
    getWalSegment: ports.getWalSegment
  });
  if (!chain.ok) {
    return quarantineFromCodeV0(hydrate, chain.code);
  }

  return {
    schema: CONTINUITY_BOOT_GUARD_SCHEMA_V0,
    phase: SUBSTRATE_BOOT_PHASE_V0.RUN,
    hydrate,
    breach: null,
    recoveryPolicy: null,
    chainTail: { lastTick: chain.lastTick, tailHash: chain.tailHash }
  };
}

/**
 * @param {ReturnType<typeof assessContinuityHydrateV0>} hydrate
 * @param {string} code
 */
function quarantineFromCodeV0(hydrate, code) {
  const breach = mapIssueCodeToBreachV0(code) || REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION;
  return {
    schema: CONTINUITY_BOOT_GUARD_SCHEMA_V0,
    phase: SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION,
    status: SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION,
    reason: breach,
    hydrate,
    breach,
    issues: [code],
    recoveryPolicy: suggestRecoveryPolicyV0(breach)
  };
}
