import { describe, expect, it } from "vitest";
import { projectUnifiedSemanticRealityFieldV1 } from "../unifiedSemanticRealityFieldV1.js";
import { generatePrismCubesFromSemanticFieldV0 } from "../prismCubeEngineV0.js";
import {
  allocateSpatialSlotsV0,
  resetSpatialAllocationLayerForTestV0,
  SPATIAL_COORDINATE_SPACE_V0
} from "../spatialAllocationLayerV0.js";

describe("spatialAllocationLayerV0", () => {
  it("assigns logical spatial slots to prism cubes", () => {
    resetSpatialAllocationLayerForTestV0();

    const semanticField = projectUnifiedSemanticRealityFieldV1({
      crossEpochReplay: {
        ok: true,
        mergedEpochId: "hmerge01",
        partitionCoherence: 0.83,
        crossEpochIntegrity: 0.91,
        unifiedTrace: [
          {
            partitionKey: "hepoch_a:1",
            status: "cross_epoch_coherent",
            clientSealHash: "hseal01",
            crossEpochSealBridge: true
          },
          {
            partitionKey: "hepoch_b:1",
            status: "cross_epoch_coherent",
            gatewaySealHash: "hseal01",
            crossEpochSealBridge: true
          }
        ]
      },
      mergeEvent: { sourceEpoch: "hepoch_a", targetEpoch: "hepoch_b" }
    });

    const prismCubes = generatePrismCubesFromSemanticFieldV0({ semanticField });
    const allocation = allocateSpatialSlotsV0({ prismCubes });

    expect(allocation.ok).toBe(true);
    expect(allocation.placedCount).toBe(2);
    expect(allocation.placedCubes[0].spatialSlot.slotId).toMatch(/^h[0-9a-f]{8}$/);
    expect(allocation.placedCubes[0].spatialSlot.worldPosition).toBe(null);
    expect(allocation.placedCubes[0].spatialSlot.eventAnchor).toBe(null);
    expect(allocation.placedCubes[0].spatialSlot.coordinateSpace).toBe(
      SPATIAL_COORDINATE_SPACE_V0.LOGICAL_EPISTEMIC_GRID
    );
    expect(allocation.placedCubes[0].arenaBinding.status).toBe("pending");
    expect(allocation.realityPhase).toBe("phase_4_2_logical_spatial_allocation");
  });

  it("requires prism cubes input", () => {
    const result = allocateSpatialSlotsV0({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("prism_cubes_required");
  });
});
