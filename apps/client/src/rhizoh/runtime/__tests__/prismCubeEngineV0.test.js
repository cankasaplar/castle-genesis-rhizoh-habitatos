import { describe, expect, it } from "vitest";
import {
  generatePrismCubesFromSemanticFieldV0,
  PRISM_CUBE_LINK_TYPE_V0,
  resetPrismCubeEngineForTestV0
} from "../prismCubeEngineV0.js";
import { projectUnifiedSemanticRealityFieldV1 } from "../unifiedSemanticRealityFieldV1.js";

describe("prismCubeEngineV0", () => {
  it("compresses prod-like semantic field into bounded cubes + adjacency", () => {
    resetPrismCubeEngineForTestV0();

    const crossEpochReplay = {
      ok: true,
      mergedEpochId: "h7617c88b",
      partitionCoherence: 0.83,
      crossEpochIntegrity: 0.91,
      unifiedTrace: [
        {
          partitionKey: "h53f7cf38:1",
          status: "cross_epoch_coherent",
          clientSealHash: "h1b18ebb9",
          gatewaySealHash: null,
          crossEpochSealBridge: true
        },
        {
          partitionKey: "hb579d532:1",
          status: "cross_epoch_coherent",
          clientSealHash: null,
          gatewaySealHash: "h1b18ebb9",
          crossEpochSealBridge: true
        }
      ]
    };

    const semanticField = projectUnifiedSemanticRealityFieldV1({
      crossEpochReplay,
      mergeEvent: {
        sourceEpoch: "hb579d532",
        targetEpoch: "h53f7cf38",
        output: { mergedEpochId: "h7617c88b" }
      }
    });

    const result = generatePrismCubesFromSemanticFieldV0({ semanticField });

    expect(result.ok).toBe(true);
    expect(result.cubeCount).toBe(2);
    expect(result.cubes[0].actionSurface).toBe(null);
    expect(result.cubes[0].spatialSlot).toBe(null);
    expect(result.cubes[0].executionSubstrate).toBe(true);
    expect(result.cubes[0].temporalBoundary.height).toBe(1);
    expect(result.adjacencyGraph.edgeCount).toBeGreaterThan(0);
    expect(
      result.adjacencyGraph.edges.some(
        (e) => e.linkType === PRISM_CUBE_LINK_TYPE_V0.CROSS_EPOCH_BRIDGE
      )
    ).toBe(true);
    expect(result.deferred.spatialSlot).toBe(true);
    expect(result.mode).toBe("semantic_compression_bounded_units");
  });

  it("requires semantic field input", () => {
    const result = generatePrismCubesFromSemanticFieldV0({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("semantic_field_required");
  });
});
