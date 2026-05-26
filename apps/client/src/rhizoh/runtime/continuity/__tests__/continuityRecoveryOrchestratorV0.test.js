import { describe, it, expect } from "vitest";
import {
  EPISTEMIC_PAST_V0,
  REHYDRATE_GATE_V0,
  RECOVERY_ACTION_V0,
  assertRepairEligibilityV0,
  gateRepairWithEligibilityV0,
  runContinuityRecoveryOrchestratorV0,
  selectRepairVsRejectV0,
  resolveEpistemicPastV0
} from "../continuityRecoveryOrchestratorV0.js";
import { createInMemoryContinuityAdapterV0 } from "./inMemoryContinuityAdapterV0.js";
import { SUBSTRATE_BOOT_PHASE_V0 } from "../replayCorruptionTaxonomyV0.js";
import { REPLAY_CORRUPTION_BREACH_V0 } from "../replayCorruptionTaxonomyV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import { deriveWalSegmentIdV0 } from "../../substrateContinuityIdbV0.js";
import { WAL_SEGMENT_BODY_SCHEMA_V0 } from "../walSegmentIntegrityV0.js";
import { REPAIR_OUTCOME_V0 } from "../replayRepairKernelV0.js";

const DISK = "castle.orchestrator_lab.v0";

async function seedChain(idb, n) {
  let prev = WAL_HASH_CHAIN_GENESIS_V0;
  for (let t = 0; t <= n; t++) {
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: t, replayOk: true };
    const hash = foldWalSegmentHashV0(prev, body);
    await idb.appendWalSegment({ tick: t, hash, body });
    prev = hash;
  }
  await idb.writeReplayCursorMonotonic({
    lastTick: n,
    lastHash: prev,
    lastSegmentId: deriveWalSegmentIdV0(DISK, n, prev)
  });
}

function ports(idb) {
  return {
    diskKey: DISK,
    readReplayCursor: () => idb.readReplayCursor(),
    getWalSegment: (t) => idb.getWalSegment(t),
    putWalSegment: (s) => idb.putWalSegmentRepaired(s),
    writeReplayCursor: (c) => idb.writeReplayCursorDirect(c)
  };
}

describe("continuityRecoveryOrchestratorV0", () => {
  it("selects REJECT for profile switch breach", () => {
    const d = selectRepairVsRejectV0(REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH, null);
    expect(d.action).toBe(RECOVERY_ACTION_V0.REJECT);
  });

  it("selects REPAIR for reanchorable hash mutation", () => {
    const d = selectRepairVsRejectV0(REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION, {
      reanchorable: true
    });
    expect(d.action).toBe(RECOVERY_ACTION_V0.REPAIR);
  });

  it("opens rehydrate gate on canonical chain", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 4);
    const r = await runContinuityRecoveryOrchestratorV0(ports(idb));
    expect(r.bootAfter.phase).toBe(SUBSTRATE_BOOT_PHASE_V0.RUN);
    expect(r.rehydrateGate).toBe(REHYDRATE_GATE_V0.OPEN);
    expect(r.epistemic.past).toBe(EPISTEMIC_PAST_V0.CANONICAL_CHAIN);
    expect(r.decision.action).toBe(RECOVERY_ACTION_V0.ACCEPT);
  });

  it("repairs hash mutation and admits repaired past", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 3);
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 3, replayOk: true };
    const prev = await idb.getWalSegment(2);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 3,
      hash: "BAD",
      segmentId: deriveWalSegmentIdV0(DISK, 3, "BAD"),
      body
    });

    const r = await runContinuityRecoveryOrchestratorV0(ports(idb), {
      applyRepair: true,
      lastTrustedCheckpoint: 0
    });
    expect(r.decision.action).toBe(RECOVERY_ACTION_V0.REPAIR);
    expect(r.repair?.outcome).toBe(REPAIR_OUTCOME_V0.HASH_REANCHOR);
    expect(r.mayRehydrate).toBe(true);
    expect(r.epistemic.past).toBe(EPISTEMIC_PAST_V0.REPAIRED_CHAIN);
    expect(r.epistemic.rejectedFromTick).toBe(3);
  });

  it("rejects identity breach and withholds rehydration", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 2);
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 0, replayOk: true };
    const hash = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, body);
    await idb._testPutRawSegment({
      diskKey: "other.universe",
      tick: 0,
      hash,
      segmentId: deriveWalSegmentIdV0("other.universe", 0, hash),
      body
    });
    await idb._testSetCursor({ diskKey: DISK, lastTick: 0, lastHash: hash });

    const r = await runContinuityRecoveryOrchestratorV0(ports(idb), { applyRepair: true });
    expect(r.decision.action).toBe(RECOVERY_ACTION_V0.REJECT);
    expect(r.rehydrateGate).toBe(REHYDRATE_GATE_V0.CLOSED);
    expect(r.epistemic.past).toBe(EPISTEMIC_PAST_V0.NO_TRUSTED_PAST);
  });

  it("repair eligibility denies rollback before trusted checkpoint", () => {
    expect(assertRepairEligibilityV0(12, 40).ok).toBe(false);
    expect(assertRepairEligibilityV0(40, 40).ok).toBe(true);
    const gated = gateRepairWithEligibilityV0(
      { action: RECOVERY_ACTION_V0.REPAIR, reason: "integrity_rollback" },
      55,
      8,
      50
    );
    expect(gated.decision.action).toBe(RECOVERY_ACTION_V0.REJECT);
    expect(gated.decision.reason).toBe("repair_eligibility_denied");
  });

  it("denies repair when rollback would precede checkpoint", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 12);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 12,
      hash: "h",
      segmentId: "",
      body: null
    });
    await idb._testSetCursor({ diskKey: DISK, lastTick: 12, lastHash: "h" });

    const r = await runContinuityRecoveryOrchestratorV0(ports(idb), {
      applyRepair: true,
      lastTrustedCheckpoint: 50,
      rollbackWindowTicks: 8
    });
    expect(r.decision.action).toBe(RECOVERY_ACTION_V0.REJECT);
    expect(r.repairEligibility.ok).toBe(false);
    expect(r.mayRehydrate).toBe(false);
  });

  it("resolveEpistemicPastV0 states truncated tail narrative", () => {
    const e = resolveEpistemicPastV0({
      bootPhase: SUBSTRATE_BOOT_PHASE_V0.RUN,
      repairOutcome: REPAIR_OUTCOME_V0.ROLLBACK_WINDOW,
      lastKnownGoodTick: 9,
      rollbackTargetTick: 1,
      corruptionTick: 10
    });
    expect(e.past).toBe(EPISTEMIC_PAST_V0.TRUNCATED_TAIL);
    expect(e.trustedThroughTick).toBe(9);
    expect(e.rejectedFromTick).toBe(10);
  });
});
