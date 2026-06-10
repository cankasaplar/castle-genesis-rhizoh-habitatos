import { describe, it, expect, beforeEach } from "vitest";
import {
  recordFoxProactiveOutcomeFeedbackV1,
  getFoxProactiveCalibrationV1,
  beginFoxProactiveOutcomeWatchV1,
  noteProactiveFeedbackUserActivityV1,
  evaluateFoxProactiveOutcomeWatchV1,
  computeGhostProactiveToleranceV1,
  __resetFoxProactiveAdaptationForTestV1
} from "../foxProactiveAdaptationV1.js";

describe("foxProactiveAdaptationV1", () => {
  beforeEach(() => {
    __resetFoxProactiveAdaptationForTestV1();
  });

  it("raises significance threshold when user dismisses proactive speech", () => {
    recordFoxProactiveOutcomeFeedbackV1({
      userDismissed: true,
      userEngaged: false,
      wasInterrupted: false,
      ghostComfort: 0.4
    });
    recordFoxProactiveOutcomeFeedbackV1({
      userDismissed: true,
      userEngaged: false,
      wasInterrupted: true,
      ghostComfort: 0.35
    });
    const cal = getFoxProactiveCalibrationV1();
    expect(cal.significanceThreshold).toBeGreaterThan(0.72);
    expect(cal.calibrationDrift?.withinAnchor?.threshold).toBe(true);
    expect(cal.dismissRate).toBeGreaterThan(0);
  });

  it("relaxes cooldown when user engages with proactive speech", () => {
    for (let i = 0; i < 4; i++) {
      recordFoxProactiveOutcomeFeedbackV1({
        userEngaged: true,
        followUpOccurred: true,
        userDismissed: false,
        ghostComfort: 0.72,
        responseLatency: 12_000
      });
    }
    const cal = getFoxProactiveCalibrationV1();
    expect(cal.cooldownMinutes).toBeLessThan(20);
    expect(cal.proactiveTolerance).toBeGreaterThan(0.5);
  });

  it("outcome watch captures engage vs dismiss signals", () => {
    const started = Date.now() - 95_000;
    beginFoxProactiveOutcomeWatchV1({
      initiativeId: "fox_init_test",
      initiatedAt: started,
      ghostComfort: 0.55
    });
    noteProactiveFeedbackUserActivityV1({
      message: "dur artık",
      atMs: started + 5000
    });
    const outcome = evaluateFoxProactiveOutcomeWatchV1(started + 91_000);
    expect(outcome?.userDismissed).toBe(true);
  });

  it("ghost proactive tolerance blends comfort and engagement", () => {
    const high = computeGhostProactiveToleranceV1(0.75, 0.8, 0.05);
    const low = computeGhostProactiveToleranceV1(0.3, 0.1, 0.6);
    expect(high).toBeGreaterThan(low);
  });
});
