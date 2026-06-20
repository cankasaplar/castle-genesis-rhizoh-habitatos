import { describe, expect, it } from "vitest";
import {
  projectUnifiedSemanticRealityFieldV1,
  resetUnifiedSemanticRealityFieldForTestV1,
  SEMANTIC_NODE_CLASS_V1
} from "../unifiedSemanticRealityFieldV1.js";

describe("unifiedSemanticRealityFieldV1", () => {
  it("projects prod-like cross-epoch graph into semantic field", () => {
    resetUnifiedSemanticRealityFieldForTestV1();

    const crossEpochReplay = {
      ok: true,
      mergedEpochId: "h7617c88b",
      partitionCoherence: 0.83,
      crossEpochIntegrity: 0.91,
      graphModel: "multi_partition_dag",
      unifiedTrace: [
        {
          partitionKey: "h64fddcfb:1",
          status: "cross_epoch_coherent",
          clientSealHash: "h020bb4d8",
          gatewaySealHash: null,
          crossEpochSealBridge: true
        },
        {
          partitionKey: "h9540b5f1:1",
          status: "cross_epoch_coherent",
          clientSealHash: null,
          gatewaySealHash: "h020bb4d8",
          crossEpochSealBridge: true
        }
      ]
    };

    const field = projectUnifiedSemanticRealityFieldV1({
      crossEpochReplay,
      mergeEvent: {
        sourceEpoch: "h64fddcfb",
        targetEpoch: "h9540b5f1",
        output: { mergedEpochId: "h7617c88b" }
      }
    });

    expect(field.ok).toBe(true);
    expect(field.realityPhase).toBe("phase_4_unified_semantic_reality_field");
    expect(field.priorPhase).toBe("phase_3_multi_epoch_partial_graph");
    expect(field.fieldCoherence).toBeGreaterThan(0.7);
    expect(field.semanticNodeCount).toBe(2);
    expect(field.semanticNodes[0].semanticClass).toBe(
      SEMANTIC_NODE_CLASS_V1.CROSS_EPOCH_WITNESS_BRIDGE
    );
    expect(field.semanticNodes[0].trustClass).toBe("interpretation_only");
    expect(field.projectionHead).toMatch(/^h[0-9a-f]{8}$/);
    expect(field.question).toBe("what_semantic_field_does_merged_graph_project");
  });

  it("assigns zero weight to conflict-preserved nodes", () => {
    const field = projectUnifiedSemanticRealityFieldV1({
      crossEpochReplay: {
        ok: false,
        partitionCoherence: 0,
        crossEpochIntegrity: 0,
        unifiedTrace: [
          {
            partitionKey: "hepoch_x:1",
            status: "seal_conflict_preserved",
            clientSealHash: "ha",
            gatewaySealHash: "hb"
          }
        ]
      }
    });

    expect(field.semanticNodes[0].semanticClass).toBe(
      SEMANTIC_NODE_CLASS_V1.CONFLICT_PRESERVED_SEMANTIC
    );
    expect(field.semanticNodes[0].fieldWeight).toBe(0);
    expect(field.fieldCoherence).toBe(0);
  });

  it("requires cross epoch replay input", () => {
    const field = projectUnifiedSemanticRealityFieldV1({});
    expect(field.ok).toBe(false);
    expect(field.error).toBe("cross_epoch_replay_required");
  });
});
