/**
 * CORE-ELIGIBLE — Living loop memory WAL (observation lane; does not advance sealer cursor).
 *
 * Appends `castle.rhizoh.living_loop_frame.v0` segments at high tick offsets to avoid
 * collision with substrate sealer drain ticks.
 *
 * Env: `VITE_SUBSTRATE_CONTINUITY_IDB=1` (same gate as continuity harness).
 */

import {
  createSubstrateContinuityIdbAdapterV0,
  openSubstrateContinuityIdbV0,
  resolveSubstrateContinuityDiskKeyV0
} from "./substrateContinuityIdbV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const LIVING_LOOP_WAL_FRAME_SCHEMA_V0 = "castle.rhizoh.living_loop_frame.v0";
export const LIVING_LOOP_WAL_TICK_BASE_V0 = 2_000_000_000;

/** @type {string} */
let _livingLoopWalDiskKey = "";

/** @type {number} */
let _livingLoopWalSeq = 0;

/**
 * @returns {boolean}
 */
export function livingLoopMemoryWalEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_SUBSTRATE_CONTINUITY_IDB === "1";
  } catch {
    return false;
  }
}

export function resetLivingLoopMemoryWalForTestsV0() {
  _livingLoopWalDiskKey = "";
  _livingLoopWalSeq = 0;
}

/**
 * @param {string} [diskKey]
 */
export function resolveLivingLoopWalDiskKeyV0(diskKey) {
  const base = resolveSubstrateContinuityDiskKeyV0(diskKey);
  return `${base}:living_loop`;
}

/**
 * @param {{
 *   locationSeed: { timeZone: string, locale: string, seedBasis: string },
 *   worldInstance: { instanceId: string },
 *   ribbon: { atmosphereLead: string, worldEcho: string },
 *   castle: { affordanceId: string, metabolicPulse: number },
 *   atmosphereTickMs: number
 * }} frame
 */
export async function appendLivingLoopMemoryWalV0(frame) {
  if (!livingLoopMemoryWalEnabledV0() || typeof indexedDB === "undefined") {
    return { ok: false, code: "disabled" };
  }

  const diskKey = resolveLivingLoopWalDiskKeyV0(_livingLoopWalDiskKey || undefined);
  _livingLoopWalDiskKey = diskKey;

  const tick = LIVING_LOOP_WAL_TICK_BASE_V0 + _livingLoopWalSeq;
  _livingLoopWalSeq += 1;

  const body = {
    schema: LIVING_LOOP_WAL_FRAME_SCHEMA_V0,
    atMs: frame.atmosphereTickMs,
    locationSeed: {
      timeZone: frame.locationSeed.timeZone,
      locale: frame.locationSeed.locale,
      seedBasis: frame.locationSeed.seedBasis
    },
    worldInstanceId: frame.worldInstance.instanceId,
    ribbon: frame.ribbon,
    castle: frame.castle
  };

  const db = await openSubstrateContinuityIdbV0();
  try {
    const adapter = createSubstrateContinuityIdbAdapterV0(db, diskKey);
    const prev =
      tick > LIVING_LOOP_WAL_TICK_BASE_V0
        ? await adapter.getWalSegment(tick - 1)
        : null;
    const prevHash = prev?.hash ? String(prev.hash) : WAL_HASH_CHAIN_GENESIS_V0;
    const hash = foldWalSegmentHashV0(prevHash, body);
    const appended = await adapter.appendWalSegment({ tick, hash, body, wallClockMs: frame.atmosphereTickMs });
    if (!appended.ok) {
      return { ok: false, code: appended.code || "append_failed" };
    }
    return {
      ok: true,
      tick,
      hash,
      segmentId: appended.segment?.segmentId ?? null,
      chainHead: hash
    };
  } finally {
    db.close();
  }
}
