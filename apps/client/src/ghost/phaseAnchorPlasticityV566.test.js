import { describe, expect, it } from "vitest";
import {
  computeMetaStabilityBudget01,
  createAnchorPlasticityLayer566,
  createPlasticAnchoredPhaseConstraintPipeline566,
  DEFAULT_ANCHOR_PLASTICITY566,
  readTriaxialStabilitySnapshot566
} from "./phaseAnchorPlasticityV566.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";

describe("phaseAnchorPlasticityV566", () => {
  it("readTriaxialStabilitySnapshot566 merges anchor pull with plasticity readout", () => {
    const plastic = createAnchorPlasticityLayer566({ plasticityRate01: 0.1, equilibriumEmaAlpha01: 0.2 });
    const snap = readTriaxialStabilitySnapshot566({
      plasticity: plastic,
      anchorPullTowardBaseline01: 0.05
    });
    expect(snap.anchorPullTowardBaseline01).toBe(0.05);
    expect(snap.budget01).toBeCloseTo(0.02, 6);
    expect(snap.metaIntervalMs).toBeGreaterThanOrEqual(1000);
    const r = plastic.getMetaStabilityReadout566();
    expect(r.budget01).toBe(snap.budget01);
  });

  it("createPlasticAnchoredPhaseConstraintPipeline566.readStabilitySnapshot566 uses anchor opts", () => {
    const pipe = createPlasticAnchoredPhaseConstraintPipeline566({
      anchor: { anchorPullTowardBaseline01: 0.07 }
    });
    const s = pipe.readStabilitySnapshot566();
    expect(s.anchorPullTowardBaseline01).toBe(0.07);
    expect(s.budget01).toBeGreaterThan(0);
  });

  it("computeMetaStabilityBudget01 is product of clamped rates", () => {
    expect(computeMetaStabilityBudget01(0.5, 0.4)).toBeCloseTo(0.2, 6);
    expect(computeMetaStabilityBudget01(DEFAULT_ANCHOR_PLASTICITY566.plasticityRate01, DEFAULT_ANCHOR_PLASTICITY566.equilibriumEmaAlpha01)).toBeCloseTo(
      0.006 * 0.055,
      8
    );
    const plastic = createAnchorPlasticityLayer566({ plasticityRate01: 0.1, equilibriumEmaAlpha01: 0.2 });
    expect(plastic.getMetaStabilityBudget01()).toBeCloseTo(0.02, 6);
  });

  it("plasticNudgeBaselineToward566 moves baseline toward target (capped)", () => {
    const adapt = createPhaseConstraintAdaptationLayer564();
    const anchor = createConstraintEquilibriumAnchorV565({
      baselinePolicy: { collapseStressLock01: 0.86 }
    });
    const before = anchor.getBaseline().collapseStressLock01;
    anchor.plasticNudgeBaselineToward566(
      { collapseStressLock01: 0.72 },
      { plasticityRate01: 1, maxPlasticDeltaPerMeta: { collapseStressLock01: 0.02 } }
    );
    const after = anchor.getBaseline().collapseStressLock01;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThanOrEqual(0.84);
  });

  it("plasticity meta step runs only after interval", () => {
    const adapt = createPhaseConstraintAdaptationLayer564({ vetoRelaxOnset: 0, enterTightenOnset: 99 });
    const anchor = createConstraintEquilibriumAnchorV565();
    const plastic = createAnchorPlasticityLayer566({
      metaIntervalMs: 10_000,
      equilibriumEmaAlpha01: 0.5
    });
    for (let i = 0; i < 5; i++) adapt.recordCollapseVeto(i);
    anchor.step(adapt, 1000);
    const b0 = anchor.getBaseline().collapseStressLock01;
    const r1 = plastic.step(anchor, 2000);
    expect(r1.didMeta).toBe(false);
    const r2 = plastic.step(anchor, 12_000);
    expect(r2.didMeta).toBe(true);
    const b1 = anchor.getBaseline().collapseStressLock01;
    expect(b1).not.toBe(b0);
  });

  it("createPlasticAnchoredPhaseConstraintPipeline566 shifts baseline after meta ticks", () => {
    const pipe = createPlasticAnchoredPhaseConstraintPipeline566({
      adaptation: { vetoRelaxOnset: 0, enterTightenOnset: 99 },
      plasticity: { metaIntervalMs: 100, equilibriumEmaAlpha01: 0.85 }
    });
    const b0 = pipe.anchor.getBaseline().collapseStressLock01;
    for (let i = 0; i < 35; i++) {
      pipe.recordCollapseVeto(i);
      pipe.tick(1000 + i * 250);
    }
    expect(pipe.plasticity.getEquilibriumEma()).not.toBe(null);
    const b1 = pipe.anchor.getBaseline().collapseStressLock01;
    expect(b1).not.toBe(b0);
    expect(DEFAULT_ANCHOR_PLASTICITY566.metaIntervalMs).toBeGreaterThan(0);
  });
});
