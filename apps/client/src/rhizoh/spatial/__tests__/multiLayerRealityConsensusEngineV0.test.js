import { describe, expect, it } from "vitest";
import {
  MULTI_LAYER_REALITY_CONSENSUS_ENGINE_SCHEMA_V0,
  REALITY_TICK_SOURCES_V0,
  buildMultiLayerRealityConsensusSnapshotV0
} from "../multiLayerRealityConsensusEngineV0.js";

describe("multiLayerRealityConsensusEngineV0", () => {
  it("lists four tick sources", () => {
    expect(REALITY_TICK_SOURCES_V0).toHaveLength(4);
  });

  it("recommends decoupled executors with shared epoch", () => {
    const s = buildMultiLayerRealityConsensusSnapshotV0();
    expect(s.schema).toBe(MULTI_LAYER_REALITY_CONSENSUS_ENGINE_SCHEMA_V0);
    expect(s.design.recommendedModel.name).toBe("canonical_epoch_decoupled_executors");
    expect(s.design.epochInflation.risk.id).toBe("epoch_inflation");
    expect(s.design.epochInflation.mitigations.length).toBe(5);
    expect(s.design.epochInflation.guardrails.goldenRules.length).toBeGreaterThan(1);
    expect(s.design.epochInflation.preEpochClassifierEngine).toContain("epochClassificationEngineV0");
    expect(s.design.epochInflation.epochPolicyAlgebraLayer).toContain("epochPolicyAlgebraLayerV0");
  });
});
