import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARENA_BINDING_STATUS_V0,
  ARENA_EVENT_GRAMMAR_V0,
  bindArenasToPlacedCubesV0,
  mintArenaEntityIdV0,
  registerArenaEntityContinuityV0,
  resetArenaBindingLayerForTestV0
} from "../arenaBindingLayerV0.js";
import { allocateSpatialSlotsV0 } from "../spatialAllocationLayerV0.js";
import { generatePrismCubesFromSemanticFieldV0 } from "../prismCubeEngineV0.js";
import { projectUnifiedSemanticRealityFieldV1 } from "../unifiedSemanticRealityFieldV1.js";

vi.mock("../../useRhizohGatewayMonitor.js", () => ({
  getOrCreateCastleDevUid: () => "arena-test-uid"
}));

function buildPipelineFixtures() {
  const semanticField = projectUnifiedSemanticRealityFieldV1({
    crossEpochReplay: {
      ok: true,
      mergedEpochId: "hmerge_arena",
      partitionCoherence: 0.83,
      crossEpochIntegrity: 0.91,
      unifiedTrace: [
        {
          partitionKey: "hepoch_a:1",
          status: "cross_epoch_coherent",
          clientSealHash: "hseal_arena",
          crossEpochSealBridge: true
        },
        {
          partitionKey: "hepoch_b:1",
          status: "cross_epoch_coherent",
          gatewaySealHash: "hseal_arena",
          crossEpochSealBridge: true
        }
      ]
    },
    mergeEvent: { sourceEpoch: "hepoch_a", targetEpoch: "hepoch_b", output: { mergedEpochId: "hmerge_arena" } }
  });
  const prismCubes = generatePrismCubesFromSemanticFieldV0({ semanticField });
  const spatialAllocation = allocateSpatialSlotsV0({ prismCubes });
  return { semanticField, spatialAllocation };
}

describe("arenaBindingLayerV0", () => {
  beforeEach(() => {
    resetArenaBindingLayerForTestV0();
  });

  it("binds placed cubes with shared entity_id kernel", () => {
    const { spatialAllocation } = buildPipelineFixtures();
    const binding = bindArenasToPlacedCubesV0({ spatialAllocation });

    expect(binding.ok).toBe(true);
    expect(binding.boundCount).toBe(2);
    expect(binding.boundCubes[0].arenaBinding.status).toBe(ARENA_BINDING_STATUS_V0.BOUND);
    expect(binding.boundCubes[0].arenaBinding.eventGrammar).toBe(
      ARENA_EVENT_GRAMMAR_V0.AUTHORITY_SEAL
    );
    expect(binding.boundCubes[0].entityId).toMatch(/^h[0-9a-f]{8}$/);
    expect(binding.identityKernel.entityCount).toBe(2);
    expect(binding.arenaRegistry.chess.coverage).toBe("inference_only");
    expect(binding.arenaRegistry.sports.coverage).toBe("event_ingest");
    expect(binding.arenaRegistry.media.ledgerization).toBe(false);
  });

  it("mints deterministic entity id from seal + partition", () => {
    const a = mintArenaEntityIdV0({
      sealRef: "hseal_x",
      partitionKey: "hepoch:1",
      mergedEpochId: "hmerge",
      clientSeed: "seed"
    });
    const b = mintArenaEntityIdV0({
      sealRef: "hseal_x",
      partitionKey: "hepoch:1",
      mergedEpochId: "hmerge",
      clientSeed: "seed"
    });
    expect(a).toBe(b);
  });

  it("registers cross-arena continuity mapping", () => {
    const entityId = mintArenaEntityIdV0({ sealRef: "hseal_reg", partitionKey: "h:1" });
    const r = registerArenaEntityContinuityV0({
      entityId,
      arenaType: "chess",
      localId: "match_local_1"
    });
    expect(r.ok).toBe(true);
    expect(r.localId).toBe("match_local_1");
  });
});
