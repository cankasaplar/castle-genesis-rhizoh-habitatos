import { describe, expect, it } from "vitest";
import {
  createObservationTrustCalibration568,
  createTrustCalibratedObservationPipeline568
} from "./phaseObservationTrustCalibrationV568.js";
import { createObservationControlCoupling567 } from "./phaseObservationControlCouplingV567.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
import { createAnchorPlasticityLayer566, readTriaxialStabilitySnapshot566 } from "./phaseAnchorPlasticityV566.js";

describe("phaseObservationTrustCalibrationV568", () => {
  it("getTrustReadout568 reflects coherence of triaxial snap", () => {
    const t = createObservationTrustCalibration568();
    const snapGood = {
      anchorPullTowardBaseline01: 0.04,
      budget01: 0.12,
      plasticityRate01: 0.4,
      equilibriumEmaAlpha01: 0.3,
      metaIntervalMs: 45_000
    };
    const r = t.getTrustReadout568(snapGood);
    expect(r.coherence01).toBeGreaterThan(0.9);
    expect(r.trust01).toBeGreaterThan(0);
  });

  it("low trust reduces effectiveBeta01 in tick567", () => {
    const anchor = createConstraintEquilibriumAnchorV565();
    const plasticity = createAnchorPlasticityLayer566({ plasticityRate01: 0.2, equilibriumEmaAlpha01: 0.25 });
    const snap = readTriaxialStabilitySnapshot566({ plasticity, anchor });
    const cHi = createObservationControlCoupling567({ budgetSmoothing01: 0.2 });
    const cLo = createObservationControlCoupling567({ budgetSmoothing01: 0.2 });
    const hi = cHi.tick567(anchor, plasticity, snap, { trust01: 1, bypassUrgency01: 0 });
    const lo = cLo.tick567(anchor, plasticity, snap, { trust01: 0.25, bypassUrgency01: 0 });
    expect(hi.skipped).toBe(false);
    expect(lo.skipped).toBe(false);
    expect(lo.effectiveBeta01).toBeLessThan(hi.effectiveBeta01);
  });

  it("createTrustCalibratedObservationPipeline568 wires trust before coupling", () => {
    const pipe = createTrustCalibratedObservationPipeline568({
      plasticity: { plasticityRate01: 0.15, equilibriumEmaAlpha01: 0.2 }
    });
    pipe.tick(1000);
    const tr = pipe.trust.getTrustReadout568(pipe.readStabilitySnapshot566());
    expect(tr.trust01).toBeGreaterThanOrEqual(0);
    expect(tr.trust01).toBeLessThanOrEqual(1);
  });
});
