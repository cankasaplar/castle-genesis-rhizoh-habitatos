import { describe, it, expect } from "vitest";
import {
  buildHashReanchorSegmentV0,
  computeRollbackTargetTickV0,
  REPAIR_OUTCOME_V0,
  runReplayRepairKernelV0,
  scanWalChainCorruptionV0
} from "../replayRepairKernelV0.js";
import { createInMemoryContinuityAdapterV0 } from "./inMemoryContinuityAdapterV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import { deriveWalSegmentIdV0 } from "../../substrateContinuityIdbV0.js";
import { WAL_SEGMENT_BODY_SCHEMA_V0 } from "../walSegmentIntegrityV0.js";

const DISK = "castle.repair_lab.v0";

async function seedChain(idb, throughTick) {
  let prev = WAL_HASH_CHAIN_GENESIS_V0;
  for (let t = 0; t <= throughTick; t++) {
    const body = {
      schema: WAL_SEGMENT_BODY_SCHEMA_V0,
      realityEpoch: t,
      replayOk: true
    };
    const hash = foldWalSegmentHashV0(prev, body);
    await idb.appendWalSegment({ tick: t, hash, body });
    prev = hash;
  }
  await idb.writeReplayCursorMonotonic({
    lastTick: throughTick,
    lastHash: prev,
    lastSegmentId: deriveWalSegmentIdV0(DISK, throughTick, prev),
    lastEpoch: throughTick
  });
}

function repairPorts(idb) {
  return {
    diskKey: DISK,
    readReplayCursor: () => idb.readReplayCursor(),
    getWalSegment: (t) => idb.getWalSegment(t),
    putWalSegment: (seg) => idb.putWalSegmentRepaired(seg),
    writeReplayCursor: (c) => idb.writeReplayCursorDirect(c)
  };
}

describe("replayRepairKernelV0", () => {
  it("detects corrupted segment on hash mutation", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 5);
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 5, replayOk: true };
    const prev = await idb.getWalSegment(4);
    const hash = foldWalSegmentHashV0(String(prev?.hash), body);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 5,
      hash: "SABOTAGED",
      segmentId: deriveWalSegmentIdV0(DISK, 5, "SABOTAGED"),
      body
    });

    const scan = await scanWalChainCorruptionV0({
      diskKey: DISK,
      headTick: 5,
      getWalSegment: (t) => idb.getWalSegment(t)
    });
    expect(scan.ok).toBe(false);
    expect(scan.lastKnownGoodTick).toBe(4);
    expect(scan.firstCorruption?.tick).toBe(5);
    expect(scan.firstCorruption?.reanchorable).toBe(true);
  });

  it("re-anchors hash when body is intact", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 3);
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 3, replayOk: true };
    const prev = await idb.getWalSegment(2);
    const goodHash = foldWalSegmentHashV0(String(prev?.hash), body);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 3,
      hash: "WRONG_HASH",
      segmentId: deriveWalSegmentIdV0(DISK, 3, "WRONG_HASH"),
      body
    });

    const seg = await idb.getWalSegment(3);
    const repaired = buildHashReanchorSegmentV0(DISK, String(prev?.hash), seg);
    expect(repaired.hash).toBe(goodHash);

    const result = await runReplayRepairKernelV0(repairPorts(idb), {
      apply: true,
      allowHashReanchor: true
    });
    expect(result.outcome).toBe(REPAIR_OUTCOME_V0.HASH_REANCHOR);
    const after = await idb.getWalSegment(3);
    expect(after?.hash).toBe(goodHash);
  });

  it("falls back cursor to last-known-good on partial write", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 10);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 10,
      hash: "h",
      segmentId: "broken",
      body: null
    });

    const result = await runReplayRepairKernelV0(repairPorts(idb), { apply: true });
    expect(result.outcome).toBe(REPAIR_OUTCOME_V0.ROLLBACK_WINDOW);
    expect(result.lastKnownGoodTick).toBe(9);
    expect(result.rollbackTargetTick).toBe(1);
    expect(result.cursorAfter?.lastTick).toBe(9);
    const cur = await idb.readReplayCursor();
    expect(cur?.lastTick).toBe(9);
  });

  it("applies deterministic rollback window from LKG", () => {
    expect(computeRollbackTargetTickV0(20, 8)).toBe(12);
    expect(computeRollbackTargetTickV0(3, 8)).toBe(0);
    expect(computeRollbackTargetTickV0(-1, 8)).toBe(-1);
  });

  it("rollback window outcome when corruption is not reanchorable", async () => {
    const idb = createInMemoryContinuityAdapterV0(DISK);
    await seedChain(idb, 12);
    await idb._testPutRawSegment({
      diskKey: DISK,
      tick: 12,
      hash: "h",
      segmentId: "",
      body: null
    });

    const result = await runReplayRepairKernelV0(repairPorts(idb), {
      apply: true,
      rollbackWindowTicks: 4,
      allowHashReanchor: false
    });
    expect(result.outcome).toBe(REPAIR_OUTCOME_V0.ROLLBACK_WINDOW);
    expect(result.lastKnownGoodTick).toBe(11);
    expect(result.rollbackTargetTick).toBe(7);
    expect(result.cursorAfter?.lastTick).toBe(11);
  });
});
