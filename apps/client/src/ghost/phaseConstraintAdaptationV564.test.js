import { describe, expect, it } from "vitest";
import {
  createAdaptivePhaseConstraintPipeline564,
  createPhaseConstraintAdaptationLayer564
} from "./phaseConstraintAdaptationV564.js";
import { DEFAULT_PHASE_CONSTRAINT_POLICY } from "./phaseConstraintKernelV563.js";

describe("phaseConstraintAdaptationV564", () => {
  it("many vetoes → relaxes stress lock (lower threshold)", () => {
    const pipe = createAdaptivePhaseConstraintPipeline564({
      adaptation: { vetoRelaxOnset: 0, enterTightenOnset: 99 }
    });
    const before = pipe.kernel.getPolicy().collapseStressLock01;
    for (let i = 0; i < 12; i++) pipe.recordCollapseVeto(1000 + i * 100);
    pipe.tick(5000);
    const after = pipe.kernel.getPolicy().collapseStressLock01;
    expect(after).toBeLessThan(before);
  });

  it("many collapse enters in window → tightens stress lock", () => {
    const pipe = createAdaptivePhaseConstraintPipeline564({
      adaptation: { vetoRelaxOnset: 99, enterTightenOnset: 0 }
    });
    const before = pipe.kernel.getPolicy().collapseStressLock01;
    for (let i = 0; i < 10; i++) pipe.recordCollapseEnterMetric(2000 + i * 50);
    pipe.tick(8000);
    const after = pipe.kernel.getPolicy().collapseStressLock01;
    expect(after).toBeGreaterThan(before);
  });

  it("viral stagnation nudges coupling soften vs flat baseline", () => {
    const a = createPhaseConstraintAdaptationLayer564({
      vetoRelaxOnset: 99,
      enterTightenOnset: 99,
      stagnationStdRef01: 0.08
    });
    for (let i = 0; i < 20; i++) a.recordViralSample(0.62, 10_000 + i);
    const patchFlat = a.computePolicyPatch(DEFAULT_PHASE_CONSTRAINT_POLICY, 20_000);
    const b = createPhaseConstraintAdaptationLayer564({
      vetoRelaxOnset: 99,
      enterTightenOnset: 99,
      stagnationStdRef01: 0.08
    });
    for (let i = 0; i < 20; i++) b.recordViralSample(0.5 + (i % 2) * 0.22, 10_000 + i);
    const patchWiggly = b.computePolicyPatch(DEFAULT_PHASE_CONSTRAINT_POLICY, 20_000);
    expect(patchFlat.couplingSoftenAtHighViral01).not.toBe(patchWiggly.couplingSoftenAtHighViral01);
  });

  it("reset clears adaptation buffers", () => {
    const pipe = createAdaptivePhaseConstraintPipeline564();
    pipe.recordCollapseVeto(1);
    pipe.resetAdaptation();
    const snap = pipe.adaptation.snapshot(10_000);
    expect(snap.vetoCount).toBe(0);
  });
});
