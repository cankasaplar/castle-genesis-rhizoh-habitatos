import { describe, expect, it } from "vitest";
import {
  deriveCanonicalAuthorityFromTickV0,
  deriveDeterministicLayerSeedV0,
  normalizeMapInteractionV0
} from "../simulationDeviceParityV0.js";
import { buildCatchUpCascadePlanV0 } from "../cascadeReplayRendererV0.js";
import { deriveCanonicalAuthorityFromTickV0 as derive2 } from "../simulationDeviceParityV0.js";

describe("simulationDeviceParityV0", () => {
  it("normalizeMapInteractionV0 maps touch to click", () => {
    expect(normalizeMapInteractionV0("touch")).toBe("click");
    expect(normalizeMapInteractionV0("tap")).toBe("click");
    expect(normalizeMapInteractionV0("click")).toBe("click");
  });

  it("deriveDeterministicLayerSeedV0 is stable per layer", () => {
    const a = deriveDeterministicLayerSeedV0(99821, 4);
    const b = deriveDeterministicLayerSeedV0(99821, 4);
    expect(a).toBe(b);
    expect(a).not.toBe(deriveDeterministicLayerSeedV0(99821, 3));
  });

  it("deriveCanonicalAuthorityFromTickV0 matches on repeat calls", () => {
    const a = deriveCanonicalAuthorityFromTickV0(4);
    const b = derive2(4);
    expect(a.canonicalLayer).toBe(4);
    expect(a.seed).toBe(b.seed);
  });
});

describe("cascadeReplayRendererV0", () => {
  it("buildCatchUpCascadePlanV0 produces deterministic layer steps", () => {
    const plan = buildCatchUpCascadePlanV0({ fromLayer: 1, toLayer: 4, canonicalSeed: 99821 });
    expect(plan.totalSteps).toBe(3);
    expect(plan.steps[0].layer).toBe(2);
    expect(plan.steps[2].layer).toBe(4);
    expect(plan.steps[0].seed).toBe(deriveDeterministicLayerSeedV0(99821, 2));
  });
});
