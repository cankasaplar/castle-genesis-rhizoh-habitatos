import { describe, expect, it } from "vitest";
import {
  createObservationControlCoupling567,
  createObservationCoupledPhaseConstraintPipeline567,
  DEFAULT_OBSERVATION_COUPLING567
} from "./phaseObservationControlCouplingV567.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
import { createAnchorPlasticityLayer566, readTriaxialStabilitySnapshot566 } from "./phaseAnchorPlasticityV566.js";

describe("phaseObservationControlCouplingV567", () => {
  it("tick567 tightens fast guard when budget is low (hysteresis)", () => {
    const anchor = createConstraintEquilibriumAnchorV565();
    const plasticity = createAnchorPlasticityLayer566({
      plasticityRate01: 0.02,
      equilibriumEmaAlpha01: 0.03
    });
    const coupling = createObservationControlCoupling567({
      budgetSmoothing01: 1,
      lowBudgetEnter01: 0.002,
      lowBudgetExit01: 0.05
    });
    const snap0 = readTriaxialStabilitySnapshot566({ plasticity, anchor });
    const baseCap = anchor.getFastGuardTuning565().maxPolicyDeltaPerTick.collapseStressLock01;
    coupling.tick567(anchor, plasticity, snap0);
    expect(coupling.getState567().lowArmed).toBe(true);
    const tightCap = anchor.getFastGuardTuning565().maxPolicyDeltaPerTick.collapseStressLock01;
    expect(tightCap).toBeLessThan(baseCap);

    const snapHigh = {
      ...snap0,
      budget01: 0.9,
      plasticityRate01: 0.8,
      equilibriumEmaAlpha01: 0.9
    };
    for (let i = 0; i < 15; i++) coupling.tick567(anchor, plasticity, snapHigh);
    expect(coupling.getState567().lowArmed).toBe(false);
    const relaxedCap = anchor.getFastGuardTuning565().maxPolicyDeltaPerTick.collapseStressLock01;
    expect(relaxedCap).toBeCloseTo(baseCap, 5);
  });

  it("tick567 relaxes slow loop when budget is high", () => {
    const anchor = createConstraintEquilibriumAnchorV565();
    const plasticity = createAnchorPlasticityLayer566({
      plasticityRate01: 0.2,
      equilibriumEmaAlpha01: 0.25
    });
    const coupling = createObservationControlCoupling567({
      budgetSmoothing01: 1,
      highBudgetEnter01: 0.03,
      highBudgetExit01: 0.02
    });
    const snap = readTriaxialStabilitySnapshot566({ plasticity, anchor });
    expect(snap.budget01).toBeGreaterThan(0.03);
    coupling.tick567(anchor, plasticity, snap);
    expect(coupling.getState567().highArmed).toBe(true);
    const r = plasticity.getMetaStabilityReadout566();
    expect(r.plasticityRate01).toBeLessThan(0.2);
  });

  it("createObservationCoupledPhaseConstraintPipeline567 runs coupling after tick", () => {
    const pipe = createObservationCoupledPhaseConstraintPipeline567({
      plasticity: { plasticityRate01: 0.025, equilibriumEmaAlpha01: 0.03 },
      observationCoupling: { budgetSmoothing01: 1, lowBudgetEnter01: 0.002 }
    });
    pipe.tick(1000);
    expect(pipe.coupling.getState567().smoothedBudget01).toBeGreaterThan(0);
    expect(DEFAULT_OBSERVATION_COUPLING567.fastMaxDeltaScaleTight).toBeLessThan(1);
  });
});
