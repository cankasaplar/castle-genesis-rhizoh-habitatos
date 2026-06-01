import { describe, expect, it } from "vitest";
import {
  resolveThinkingExposureV0,
  resolveThinkingPhaseV0,
  THINKING_EXPOSURE_BINDING_V0,
  THINKING_PHASE_PROBABILITY_FIELD_V0
} from "../rhizohThinkingModelV0.js";
import { applyGrammarFromUtteranceV0 } from "../rhizohGrammarBridgeV0.js";

describe("rhizohThinkingModelV0", () => {
  it("maps GENERATING to probability_field phase", () => {
    expect(resolveThinkingPhaseV0("GENERATING")).toBe(THINKING_PHASE_PROBABILITY_FIELD_V0);
    const exp = resolveThinkingExposureV0("GENERATING");
    expect(exp.orbitActive).toBe(true);
    expect(exp.binding).toBe(THINKING_EXPOSURE_BINDING_V0);
  });
});

describe("rhizohGrammarBridgeV0", () => {
  it("applyGrammar resolves studio navigation intent", () => {
    let surface = null;
    const r = applyGrammarFromUtteranceV0("studio katmanına geçelim", {
      onEnterSurface: (s) => {
        surface = s;
      },
      emitMicroRtl: false
    });
    expect(r.action).toBe("ENTER_SURFACE");
    expect(surface).toBe("studio");
  });
});
