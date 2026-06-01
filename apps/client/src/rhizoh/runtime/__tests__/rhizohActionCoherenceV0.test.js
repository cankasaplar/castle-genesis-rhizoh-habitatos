import { describe, expect, it } from "vitest";
import {
  ACL_BINDING_SENTENCE_V0,
  computeCognitionExposureBudgetV0,
  resolveNextActionAnchorV0
} from "../rhizohActionCoherenceV0.js";

describe("rhizohActionCoherenceV0", () => {
  it("exposes ACL binding", () => {
    expect(ACL_BINDING_SENTENCE_V0).toContain("action coherence");
  });

  it("studio anchor at rest", () => {
    const a = resolveNextActionAnchorV0({
      activeSurface: "studio",
      rhizohFieldState: "IDLE",
      localeTr: true
    });
    expect(a.line).toBe("Üretim alanı açık");
    expect(a.busy).toBe(false);
  });

  it("holds direction while generating", () => {
    const a = resolveNextActionAnchorV0({
      activeSurface: "world",
      rhizohFieldState: "GENERATING",
      localeTr: true
    });
    expect(a.busy).toBe(true);
    expect(a.line).toContain("Yönün korunuyor");
  });

  it("caps ambient when thought field + busy", () => {
    const b = computeCognitionExposureBudgetV0({
      rhizohFieldState: "INTERPRETING",
      thoughtFieldExpanded: true,
      ambientEnabled: true
    });
    expect(b.overloadRisk).toBe(true);
    expect(b.ambientOpacityScale).toBeLessThan(0.6);
    expect(b.showThinkingPhaseChip).toBe(false);
  });
});
