import { beforeEach, describe, expect, it } from "vitest";
import { crossEpochDeterministicReplayV1 } from "../crossEpochDeterministicReplayV1.js";

describe("crossEpochDeterministicReplayV1", () => {
  it("unifies partitions without override when seals align", () => {
    const result = crossEpochDeterministicReplayV1({
      clientReplay: {
        epochId: "hepoch_a",
        trace: [{ height: 1, actual: "hseal001", ok: true }]
      },
      gatewayReplay: {
        epochId: "hepoch_b",
        trace: [{ height: 1, clientSealHash: "hseal001", ok: true }]
      },
      mergeEvent: {
        sourceEpoch: "hepoch_a",
        targetEpoch: "hepoch_b",
        output: { mergedEpochId: "hmerged01" }
      }
    });
    expect(result.ok).toBe(true);
    expect(result.partitionCount).toBe(2);
    expect(result.alignedPartitions).toBe(0);
    expect(result.partialPartitions).toBe(2);
    expect(result.resolutionRule).toBe("preserve_both_histories");
    expect(result.question).toBe("which_unified_reality_was_produced");
  });

  it("treats cross-epoch same-height as partial presence (not override)", () => {
    const result = crossEpochDeterministicReplayV1({
      clientReplay: {
        epochId: "hepoch_a",
        trace: [{ height: 1, actual: "hseal_a", ok: true }]
      },
      gatewayReplay: {
        epochId: "hepoch_b",
        trace: [{ height: 1, clientSealHash: "hseal_b", ok: true }]
      },
      mergeEvent: {
        sourceEpoch: "hepoch_a",
        targetEpoch: "hepoch_b",
        output: { mergedEpochId: "hmerged02" }
      }
    });
    expect(result.ok).toBe(true);
    expect(result.conflictPartitions).toBe(0);
    expect(result.partialPartitions).toBe(2);
    expect(result.unifiedTrace.every((t) => t.status === "partial_presence")).toBe(true);
  });

  it("marks same-partition seal mismatch as conflict preserved", () => {
    const result = crossEpochDeterministicReplayV1({
      clientReplay: {
        epochId: "hepoch_x",
        trace: [{ height: 1, actual: "hseal_a", ok: true }]
      },
      gatewayReplay: {
        epochId: "hepoch_x",
        trace: [{ height: 1, clientSealHash: "hseal_b", ok: true }]
      },
      mergeEvent: {
        sourceEpoch: "hepoch_x",
        targetEpoch: "hepoch_x",
        output: { mergedEpochId: "hmerged03" }
      }
    });
    expect(result.conflictPartitions).toBe(1);
    expect(result.unifiedTrace[0].status).toBe("seal_conflict_preserved");
    expect(result.unifiedTrace[0].preservedBoth).toBe(true);
  });
});
