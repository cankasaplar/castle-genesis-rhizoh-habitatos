import { describe, it, expect } from "vitest";
import {
  FOX_IDENTITY_ANCHOR_BASELINE_V1,
  applyFoxIdentityStabilityAnchorV1,
  clampAdaptationDeltaV1,
  computeRawFoxCalibrationFromSignalsV1,
  computeFoxToneModulationV1,
  computeFoxCalibrationDriftV1
} from "../foxIdentityAnchorV1.js";

describe("foxIdentityAnchorV1", () => {
  it("clamps adaptation delta to maxDrift from baseline", () => {
    const base = 0.72;
    expect(clampAdaptationDeltaV1(0.95, base, 0.08)).toBe(0.8);
    expect(clampAdaptationDeltaV1(0.5, base, 0.08)).toBe(0.64);
  });

  it("routes dismissal to threshold and engagement to frequency only", () => {
    const dismissOnly = computeRawFoxCalibrationFromSignalsV1([
      { userDismissed: true, userEngaged: false, ghostComfort: 0.5 },
      { userDismissed: true, userEngaged: false, ghostComfort: 0.5 }
    ]);
    expect(dismissOnly.significanceThreshold).toBeGreaterThan(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits.significanceThreshold
    );
    expect(dismissOnly.maxInitiationsPerHour).toBe(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits.maxInitiationsPerHour
    );

    const engageOnly = computeRawFoxCalibrationFromSignalsV1([
      { userEngaged: true, userDismissed: false, ghostComfort: 0.5 },
      { userEngaged: true, userDismissed: false, ghostComfort: 0.5 },
      { userEngaged: true, userDismissed: false, ghostComfort: 0.5 },
      { userEngaged: true, userDismissed: false, ghostComfort: 0.5 }
    ]);
    expect(engageOnly.cooldownMinutes).toBeLessThan(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits.cooldownMinutes
    );
    expect(engageOnly.significanceThreshold).toBe(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits.significanceThreshold
    );
  });

  it("routes emotionalShift to tone modulation only", () => {
    const tone = computeFoxToneModulationV1([
      { emotionalShiftDetected: true, userEngaged: true },
      { emotionalShiftDetected: true, userEngaged: false }
    ]);
    expect(tone.active).toBe(true);
    expect(tone.elasticity).toBeGreaterThan(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.emotionalElasticityRange.min
    );

    const raw = computeRawFoxCalibrationFromSignalsV1([
      { emotionalShiftDetected: true, userEngaged: true, ghostComfort: 0.9 },
      { emotionalShiftDetected: true, userEngaged: true, ghostComfort: 0.9 }
    ]);
    expect(raw.significanceThreshold).toBe(
      FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits.significanceThreshold
    );
  });

  it("prevents over-adaptation drift under extreme user signals", () => {
    const extreme = Array.from({ length: 12 }, () => ({
      userEngaged: true,
      userDismissed: false,
      ghostComfort: 0.95,
      wasInterrupted: false
    }));
    const raw = computeRawFoxCalibrationFromSignalsV1(extreme);
    const anchored = applyFoxIdentityStabilityAnchorV1(raw);
    const drift = computeFoxCalibrationDriftV1(anchored);
    const prior = FOX_IDENTITY_ANCHOR_BASELINE_V1.stabilityPrior;

    expect(Math.abs(drift.cooldownMinutes)).toBeLessThanOrEqual(
      prior.maxCooldownDriftMinutes + 0.01
    );
    expect(Math.abs(drift.maxInitiationsPerHour)).toBeLessThanOrEqual(prior.maxInitiationsDrift);
    expect(drift.withinAnchor.cooldown).toBe(true);
    expect(drift.withinAnchor.initiations).toBe(true);
  });
});
