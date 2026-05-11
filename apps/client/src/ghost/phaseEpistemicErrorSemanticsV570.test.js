import { describe, expect, it } from "vitest";
import {
  classifyEpistemicObservation570,
  createSemanticEpistemicObservationPipeline570,
  EPISTEMIC_ERROR_KIND570
} from "./phaseEpistemicErrorSemanticsV570.js";
import { createTrustCalibrationDrift569 } from "./phaseTrustCalibrationDriftV569.js";

describe("phaseEpistemicErrorSemanticsV570", () => {
  it("classifyEpistemicObservation570 marks skipped as mild semantics", () => {
    const r = classifyEpistemicObservation570({
      snap566: { budget01: 0.1 },
      result567: { skipped: true },
      driftState569: { recentFlipPressure01: 0.9 }
    });
    expect(r.kind).toBe(EPISTEMIC_ERROR_KIND570.SKIPPED_OBSERVATION);
    expect(r.benign01).toBeGreaterThan(0.55);
    expect(r.correctionPriority01).toBeLessThan(0.45);
  });

  it("high flip pressure with small raw/smooth gap → harmful skew", () => {
    const r = classifyEpistemicObservation570({
      snap566: { budget01: 0.05 },
      result567: {
        skipped: false,
        rawBudget01: 0.1,
        smoothedBudget01: 0.11
      },
      driftState569: { recentFlipPressure01: 0.55 }
    });
    expect(r.kind).toBe(EPISTEMIC_ERROR_KIND570.HARMFUL_FLIP_PRESSURE);
    expect(r.benign01).toBeLessThan(0.45);
    expect(r.correctionPriority01).toBeGreaterThan(0.65);
  });

  it("large raw vs smoothed gap credits path noise → more benign, lower correction priority", () => {
    const lowGap = classifyEpistemicObservation570({
      snap566: { budget01: 0.2 },
      result567: {
        skipped: false,
        rawBudget01: 0.2,
        smoothedBudget01: 0.21
      },
      driftState569: { recentFlipPressure01: 0.5 }
    });
    const highGap = classifyEpistemicObservation570({
      snap566: { budget01: 0.2 },
      result567: {
        skipped: false,
        rawBudget01: 0.2,
        smoothedBudget01: 0.05
      },
      driftState569: { recentFlipPressure01: 0.5 }
    });
    expect(highGap.benign01).toBeGreaterThan(lowGap.benign01);
    expect(highGap.correctionPriority01).toBeLessThan(lowGap.correctionPriority01);
  });

  it("semantics570 changes drift accumulation vs defaults", () => {
    const flip = { skipped: false, lowArmed: true, highArmed: false, smoothedBudget01: 0.1, rawBudget01: 0.1 };
    const base = {
      biasBump01: 0.08,
      flipsForBiasBump: 2,
      flipWindow: 8,
      biasDecayPerTick01: 0.018,
      biasMax01: 0.28
    };
    const d0 = createTrustCalibrationDrift569({ ...base });
    const d1 = createTrustCalibrationDrift569({ ...base });
    let diverged = false;
    for (let i = 0; i < 10; i++) {
      const arm = i % 2 === 0;
      const row = { ...flip, lowArmed: arm, highArmed: false };
      d0.recordCouplingOutcome569(row);
      d1.recordCouplingOutcome569(row, { benign01: 0.12, correctionPriority01: 0.95 });
      if (Math.abs(d0.getDriftState569().epistemicBias01 - d1.getDriftState569().epistemicBias01) > 1e-5) {
        diverged = true;
        break;
      }
    }
    expect(diverged).toBe(true);
  });

  it("createSemanticEpistemicObservationPipeline570 wires classifier", () => {
    const pipe = createSemanticEpistemicObservationPipeline570({
      plasticity: { plasticityRate01: 0.12, equilibriumEmaAlpha01: 0.15 },
      observationCoupling: { budgetSmoothing01: 0.95, lowBudgetEnter01: 0.5, lowBudgetExit01: 0.51 }
    });
    for (let i = 0; i < 12; i++) pipe.tick(2000 + i * 50);
    expect(pipe.drift.getDriftState569().delayedTrustScale01).toBeGreaterThan(0);
  });
});
