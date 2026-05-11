import { describe, expect, it } from "vitest";
import {
  createAnchoredAdaptivePhaseConstraintPipeline565,
  createConstraintEquilibriumAnchorV565,
  DEFAULT_EQUILIBRIUM_ANCHOR565
} from "./phaseConstraintEquilibriumAnchorV565.js";
import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
describe("phaseConstraintEquilibriumAnchorV565", () => {
  it("anchor step follows adaptation target from fixed baseline, not prior equilibrium drift", () => {
    const adapt = createPhaseConstraintAdaptationLayer564({ vetoRelaxOnset: 0, enterTightenOnset: 99 });
    for (let i = 0; i < 8; i++) adapt.recordCollapseVeto(1000 + i);
    const anchor = createConstraintEquilibriumAnchorV565({
      baselinePolicy: { collapseStressLock01: 0.86 },
      equilibriumSmoothing01: 1,
      anchorPullTowardBaseline01: 0,
      maxPolicyDeltaPerTick: {
        collapseStressLock01: 1,
        maxDispersion01ForCollapseEnter: 1,
        collapseViralFloor01: 1,
        maxPhaseStepPerTick01: 1,
        couplingSoftenAtHighViral01: 1
      }
    });
    const direct = adapt.computePolicyPatch(anchor.getBaseline(), 5000);
    const eq = anchor.step(adapt, 5000);
    expect(eq.collapseStressLock01).toBeCloseTo(direct.collapseStressLock01, 5);
  });

  it("anchored pipeline limits per-tick stress movement", () => {
    const pipe = createAnchoredAdaptivePhaseConstraintPipeline565({
      adaptation: { vetoRelaxOnset: 0, enterTightenOnset: 99 },
      anchor: { equilibriumSmoothing01: 0.35, anchorPullTowardBaseline01: 0.02 }
    });
    let prev = pipe.kernel.getPolicy().collapseStressLock01;
    for (let i = 0; i < 25; i++) {
      pipe.recordCollapseVeto(i * 200);
      pipe.tick(i * 200 + 100);
      const s = pipe.kernel.getPolicy().collapseStressLock01;
      expect(Math.abs(s - prev)).toBeLessThanOrEqual(
        DEFAULT_EQUILIBRIUM_ANCHOR565.maxPolicyDeltaPerTick.collapseStressLock01 + 0.006
      );
      prev = s;
    }
  });

  it("createAnchoredAdaptivePhaseConstraintPipeline565 wires tick to kernel", () => {
    const pipe = createAnchoredAdaptivePhaseConstraintPipeline565({
      adaptation: { enterTightenOnset: 0, vetoRelaxOnset: 99 }
    });
    const before = pipe.kernel.getPolicy().collapseStressLock01;
    for (let i = 0; i < 6; i++) pipe.recordCollapseEnterMetric(i);
    pipe.tick(10_000);
    const after = pipe.kernel.getPolicy().collapseStressLock01;
    expect(after).toBeGreaterThan(before);
  });
});
