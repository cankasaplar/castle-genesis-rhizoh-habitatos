import { describe, expect, it } from "vitest";
import {
  createTrustCalibrationDrift569,
  createTrustLearningObservationPipeline569
} from "./phaseTrustCalibrationDriftV569.js";

describe("phaseTrustCalibrationDriftV569", () => {
  it("adjustCouplingHint569 scales down trust when epistemicBias grows", () => {
    const d = createTrustCalibrationDrift569({ biasBump01: 0.2, flipsForBiasBump: 2, flipWindow: 6 });
    for (let i = 0; i < 8; i++) {
      d.recordCouplingOutcome569({
        skipped: false,
        lowArmed: i % 2 === 0,
        highArmed: false,
        smoothedBudget01: 0.1,
        rawBudget01: 0.1
      });
    }
    expect(d.getDriftState569().epistemicBias01).toBeGreaterThan(0.05);
    const h = d.adjustCouplingHint569({ trust01: 0.9, bypassUrgency01: 0.5 });
    expect(h.trust01).toBeLessThan(0.9);
    expect(h.bypassUrgency01).toBeLessThanOrEqual(0.5);
  });

  it("createTrustLearningObservationPipeline569 runs drift after coupling", () => {
    const pipe = createTrustLearningObservationPipeline569({
      plasticity: { plasticityRate01: 0.12, equilibriumEmaAlpha01: 0.15 },
      observationCoupling: { budgetSmoothing01: 0.95, lowBudgetEnter01: 0.5, lowBudgetExit01: 0.51 }
    });
    for (let i = 0; i < 15; i++) pipe.tick(1000 + i * 50);
    expect(pipe.drift.getDriftState569().epistemicBias01).toBeGreaterThanOrEqual(0);
  });
});
