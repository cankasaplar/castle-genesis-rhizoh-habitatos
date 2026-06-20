import { describe, expect, it } from "vitest";
import { crossEpochDeterministicReplayV1 } from "../crossEpochDeterministicReplayV1.js";

describe("crossEpochDeterministicReplayV1", () => {
  it("prod-like cross-epoch same seal: high integrity, not binary aligned", () => {
    const result = crossEpochDeterministicReplayV1({
      clientReplay: {
        epochId: "h64fddcfb",
        trace: [{ height: 1, actual: "h020bb4d8", ok: true }]
      },
      gatewayReplay: {
        epochId: "h9540b5f1",
        trace: [{ height: 1, clientSealHash: "h020bb4d8", ok: true }]
      },
      mergeEvent: {
        sourceEpoch: "h64fddcfb",
        targetEpoch: "h9540b5f1",
        output: { mergedEpochId: "h7617c88b" }
      }
    });

    expect(result.ok).toBe(true);
    expect(result.partitionCount).toBe(2);
    expect(result.samePartitionAligned).toBe(0);
    expect(result.alignedPartitions).toBe(0);
    expect(result.crossEpochCoherentPartitions).toBe(2);
    expect(result.crossEpochIntegrity).toBe(0.91);
    expect(result.partitionCoherence).toBe(0.83);
    expect(result.graphModel).toBe("multi_partition_dag");
    expect(result.unifiedTrace.every((t) => t.status === "cross_epoch_coherent")).toBe(true);
    expect(result.unifiedTrace.every((t) => t.crossEpochSealBridge)).toBe(true);
  });

  it("reports low integrity when cross-epoch seals diverge at same height", () => {
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
    expect(result.crossEpochIntegrity).toBe(0);
    expect(result.partialPartitions).toBe(2);
    expect(result.partitionCoherence).toBeLessThan(0.5);
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
    expect(result.crossEpochIntegrity).toBe(0);
    expect(result.partitionCoherence).toBe(0);
    expect(result.unifiedTrace[0].status).toBe("seal_conflict_preserved");
  });

  it("same-partition aligned scores full coherence", () => {
    const result = crossEpochDeterministicReplayV1({
      clientReplay: {
        epochId: "hepoch_z",
        trace: [{ height: 1, actual: "hseal_z", ok: true }]
      },
      gatewayReplay: {
        epochId: "hepoch_z",
        trace: [{ height: 1, clientSealHash: "hseal_z", ok: true }]
      },
      mergeEvent: {
        sourceEpoch: "hepoch_z",
        targetEpoch: "hepoch_z",
        output: { mergedEpochId: "hmerged04" }
      }
    });
    expect(result.samePartitionAligned).toBe(1);
    expect(result.partitionCoherence).toBe(1);
    expect(result.crossEpochIntegrity).toBe(1);
  });
});
