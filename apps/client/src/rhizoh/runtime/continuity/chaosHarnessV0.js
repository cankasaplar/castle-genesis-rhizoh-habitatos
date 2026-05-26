/**
 * Hat B — Controlled Chaos Harness (Substrate Truth Validator).
 *
 * External adversarial isolation only: corrupts lab adapter/IDB sandbox; never weakens
 * production invariants. Answers: "When state breaks, what does the system do?"
 *
 * @see apps/client/docs/CONTROLLED_CHAOS_HARNESS_V0.md
 */

import { commitCursorWithMonotonicGuardV0, resolveSubstrateContinuityBootGuardV0 } from "./continuityBootGuardV0.js";
import { REPLAY_CORRUPTION_BREACH_V0, SUBSTRATE_BOOT_PHASE_V0 } from "./replayCorruptionTaxonomyV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./walHashChainV0.js";
import { deriveWalSegmentIdV0 } from "../substrateContinuityIdbV0.js";
import { WAL_SEGMENT_BODY_SCHEMA_V0 } from "./walSegmentIntegrityV0.js";
import { assertNextReplayTickV0 } from "./replayApplyOrderGuardV0.js";
import {
  createQuarantineScoreboardV0,
  finalizeQuarantineScoreboardV0,
  formatQuarantineScoreboardBannerV0,
  printQuarantineScoreboardV0,
  recordChaosScoreV0
} from "./chaosScoreboardV0.js";

export const CONTROLLED_CHAOS_HARNESS_SCHEMA_V0 = "castle.rhizoh.controlled_chaos_harness.v0";

/** Kaos odası matrisi — enjekte edilen canavar → filtre → skor hedefi */
export const CHAOS_ANOMALY_MATRIX_V0 = Object.freeze([
  {
    anomalyId: 1,
    name: "Stale Replay",
    breach: REPLAY_CORRUPTION_BREACH_V0.STALE_REPLAY,
    filter: "commitCursorWithMonotonicGuard",
    passLabel: "Monotonic Violation Blocked"
  },
  {
    anomalyId: 2,
    name: "Hash Chain Mutation",
    breach: REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION,
    filter: "resolveSubstrateContinuityBootGuard",
    passLabel: "Quarantine triggered: HASH_CHAIN_MUTATION"
  },
  {
    anomalyId: 3,
    name: "Partial Crash Write",
    breach: REPLAY_CORRUPTION_BREACH_V0.PARTIAL_WRITE,
    filter: "validateWalSegmentIntegrity + bootGuard",
    passLabel: "Quarantine triggered: PARTIAL_WRITE"
  },
  {
    anomalyId: 4,
    name: "Duplicate Append Injection",
    breach: REPLAY_CORRUPTION_BREACH_V0.DUPLICATE_APPEND,
    filter: "wal_segments composite key idempotency",
    passLabel: "Duplicate Collapse Idempotent"
  },
  {
    anomalyId: 5,
    name: "Out-of-Order Replay Attempt",
    breach: REPLAY_CORRUPTION_BREACH_V0.OUT_OF_ORDER_REPLAY,
    filter: "assertNextReplayTickV0 (chrono skew)",
    passLabel: "Chrono-Skew Isolation Successful"
  },
  {
    anomalyId: 6,
    name: "Epoch Regression",
    breach: REPLAY_CORRUPTION_BREACH_V0.EPOCH_REGRESSION,
    filter: "bootGuard minEpoch floor",
    passLabel: "Epoch Floor Enforced"
  },
  {
    anomalyId: 7,
    name: "Profile Switch / Identity Hijack",
    breach: REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH,
    filter: "diskKey envelope isolation",
    passLabel: "Identity Bleed Isolated"
  }
]);

const DEFAULT_CHAOS_DISK_KEY_V0 = "castle.controlled_chaos_frame.v0";

/**
 * @typedef {ReturnType<import('./__tests__/inMemoryContinuityAdapterV0.js').createInMemoryContinuityAdapterV0>} ChaosLabAdapter
 */

/**
 * @param {ChaosLabAdapter} idb
 * @param {string} diskKey
 * @param {number} throughTick
 */
async function seedValidChainV0(idb, diskKey, throughTick) {
  let prev = WAL_HASH_CHAIN_GENESIS_V0;
  for (let t = 0; t <= throughTick; t++) {
    const body = {
      schema: WAL_SEGMENT_BODY_SCHEMA_V0,
      realityEpoch: t,
      sealHashHead: `h${String(t).padStart(7, "0")}`,
      replayOk: true
    };
    const hash = foldWalSegmentHashV0(prev, body);
    await idb.appendWalSegment({ tick: t, hash, body });
    prev = hash;
  }
  const lastTick = throughTick;
  const lastHash = prev;
  await idb.writeReplayCursorMonotonic({
    lastTick,
    lastHash,
    lastSegmentId: deriveWalSegmentIdV0(diskKey, lastTick, lastHash),
    lastEpoch: throughTick
  });
}

/**
 * Controlled chaos — 7 anomalies, deterministic scoreboard.
 *
 * @param {{
 *   createAdapter?: (diskKey: string) => ChaosLabAdapter,
 *   diskKey?: string,
 *   print?: boolean
 * }} [opts]
 */
export async function runControlledChaosV0(opts = {}) {
  const diskKey = opts.diskKey || DEFAULT_CHAOS_DISK_KEY_V0;
  const board = createQuarantineScoreboardV0();

  let createAdapter = opts.createAdapter;
  if (!createAdapter) {
    const mod = await import("./__tests__/inMemoryContinuityAdapterV0.js");
    createAdapter = mod.createInMemoryContinuityAdapterV0;
  }

  if (typeof console !== "undefined" && opts.print !== false) {
    console.log("⚡ [RHIZOH_CHAOS] Initializing Controlled Chaos Chamber (steril lab)...");
  }

  try {
    // --- 1 Stale Replay ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[0];
      const idb = createAdapter(diskKey);
      await seedValidChainV0(idb, diskKey, 100);
      const cur = await idb.readReplayCursor();
      const guard = commitCursorWithMonotonicGuardV0(cur, {
        diskKey,
        lastTick: 50,
        lastHash: "HASH_STALE_50"
      });
      const write = await idb.writeReplayCursorMonotonic({ lastTick: 50, lastHash: "HASH_STALE_50" });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass: guard.blocked === true && write.ok === false && write.code === "cursor_regressed",
        message: "Blocked lower-tick regression from overwriting current cursor.",
        passLabel: meta.passLabel
      });
    }

    // --- 2 Hash Chain Mutation ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[1];
      const idb = createAdapter(diskKey);
      await seedValidChainV0(idb, diskKey, 100);
      await idb._testPutRawSegment({
        diskKey,
        tick: 100,
        hash: "SABOTAGED_HASH_MUTATION",
        segmentId: deriveWalSegmentIdV0(diskKey, 100, "SABOTAGED_HASH_MUTATION"),
        body: { schema: WAL_SEGMENT_BODY_SCHEMA_V0, drift: "micro-sapma-data" }
      });
      const boot = await resolveSubstrateContinuityBootGuardV0({
        diskKey,
        readReplayCursor: () => idb.readReplayCursor(),
        getWalSegment: (t) => idb.getWalSegment(t)
      });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass:
          boot.phase === SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION &&
          boot.reason === REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION,
        message: `Substrate isolated reality matrix. Reason: ${boot.reason || "none"}`,
        passLabel: meta.passLabel
      });
    }

    // --- 3 Partial Write ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[2];
      const idb = createAdapter(diskKey);
      await idb._testPutRawSegment({
        diskKey,
        tick: 0,
        hash: "h00000001",
        segmentId: deriveWalSegmentIdV0(diskKey, 0, "h00000001"),
        body: null
      });
      await idb._testSetCursor({ diskKey, lastTick: 0, lastHash: "h00000001" });
      const boot = await resolveSubstrateContinuityBootGuardV0({
        diskKey,
        readReplayCursor: () => idb.readReplayCursor(),
        getWalSegment: (t) => idb.getWalSegment(t)
      });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass:
          boot.phase === SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION &&
          boot.reason === REPLAY_CORRUPTION_BREACH_V0.PARTIAL_WRITE,
        message: `Malformed segment rejected on deep hydrate.`,
        passLabel: meta.passLabel
      });
    }

    // --- 4 Duplicate Append ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[3];
      const idb = createAdapter(diskKey);
      const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 0, replayOk: true };
      const hash = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, body);
      const a = await idb.appendWalSegment({ tick: 0, hash, body });
      const b = await idb.appendWalSegment({ tick: 0, hash, body });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass: a.ok === true && b.ok === true && b.duplicate === true,
        message: "Second identical append collapsed without state double-apply.",
        passLabel: meta.passLabel
      });
    }

    // --- 5 Out-of-Order ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[4];
      const order = assertNextReplayTickV0(103, 105);
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass: order.ok === false && order.code === "replay_order_violation",
        message: "Non-consecutive tick rejected before mutation.",
        passLabel: meta.passLabel
      });
    }

    // --- 6 Epoch Regression ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[5];
      const idb = createAdapter(diskKey);
      await seedValidChainV0(idb, diskKey, 3);
      const cur = await idb.readReplayCursor();
      const boot = await resolveSubstrateContinuityBootGuardV0({
        diskKey,
        readReplayCursor: () => cur,
        getWalSegment: (t) => idb.getWalSegment(t),
        minEpoch: (Number(cur?.lastEpoch) || 0) + 1
      });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass:
          boot.phase === SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION &&
          boot.reason === REPLAY_CORRUPTION_BREACH_V0.EPOCH_REGRESSION,
        message: "Epoch floor prevented constitutional rollback.",
        passLabel: meta.passLabel
      });
    }

    // --- 7 Profile Switch ---
    {
      const meta = CHAOS_ANOMALY_MATRIX_V0[6];
      const idb = createAdapter(diskKey);
      const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 0, replayOk: true };
      const hash = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, body);
      await idb._testPutRawSegment({
        diskKey: "other.universe.v0",
        tick: 0,
        hash,
        segmentId: deriveWalSegmentIdV0("other.universe.v0", 0, hash),
        body
      });
      await idb._testSetCursor({ diskKey, lastTick: 0, lastHash: hash });
      const boot = await resolveSubstrateContinuityBootGuardV0({
        diskKey,
        readReplayCursor: () => idb.readReplayCursor(),
        getWalSegment: (t) => idb.getWalSegment(t)
      });
      recordChaosScoreV0(board, {
        anomalyId: meta.anomalyId,
        name: meta.name,
        breach: meta.breach,
        filter: meta.filter,
        pass:
          boot.phase === SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION &&
          boot.reason === REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH,
        message: "Foreign diskKey segment blocked from local universe hydrate.",
        passLabel: meta.passLabel
      });
    }
  } catch (error) {
    recordChaosScoreV0(board, {
      anomalyId: 0,
      name: "Chaos Engine Runtime",
      breach: "RUNTIME_ERROR",
      filter: "harness",
      pass: false,
      message: String(error?.message || error || "unknown"),
      passLabel: "Harness Error"
    });
  }

  finalizeQuarantineScoreboardV0(board);

  const report = {
    schema: CONTROLLED_CHAOS_HARNESS_SCHEMA_V0,
    diskKey,
    scoreboard: board,
    allPassed: board.immune,
    banner: formatQuarantineScoreboardBannerV0(board)
  };

  if (opts.print !== false) {
    printQuarantineScoreboardV0(board);
  }

  return report;
}
