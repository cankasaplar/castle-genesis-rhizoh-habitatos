import { describe, it, expect } from "vitest";
import {
  composeRhizohCognitiveFieldV0,
  VCL_BINDING_SENTENCE_V0,
  VCL_LAYER_AGENT_V0,
  VCL_LAYER_SYSTEM_V0
} from "../rhizohVisualCognitiveLanguageV0.js";
import { T0_INTENT_PRODUCE_V0 } from "../t0ContextStripV0.js";

describe("rhizohVisualCognitiveLanguageV0", () => {
  it("locks binding sentence", () => {
    expect(VCL_BINDING_SENTENCE_V0).toMatch(/deforms perception/i);
  });

  it("composes four language layers", () => {
    const field = composeRhizohCognitiveFieldV0({
      activeSurface: "studio",
      userIntent: T0_INTENT_PRODUCE_V0,
      rhizohFieldState: "INTERPRETING",
      collectiveDensity: 0.6,
      anchorActive: true
    });
    expect(field.layers.system.layer).toBe(VCL_LAYER_SYSTEM_V0);
    expect(field.layers.agent.layer).toBe(VCL_LAYER_AGENT_V0);
    expect(field.deformation.facets).toBeGreaterThanOrEqual(5);
    expect(field.tension).toBeGreaterThan(0.3);
  });

  it("shifts deformation geometry by intent not only color", () => {
    const produce = composeRhizohCognitiveFieldV0({
      userIntent: T0_INTENT_PRODUCE_V0
    });
    const observe = composeRhizohCognitiveFieldV0({
      userIntent: "observe"
    });
    expect(produce.deformation.twistDeg).not.toBe(observe.deformation.twistDeg);
  });
});
