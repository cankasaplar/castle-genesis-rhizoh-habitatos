import { describe, it, expect, beforeEach } from "vitest";
import {
  detectRhizohEmotionalShiftV1,
  snapshotEmotionalTrajectoryFromThreadV1
} from "../rhizohDialogueThreadV1.js";
import {
  recordFoxProactiveOutcomeFeedbackV1,
  getFoxProactiveCalibrationV1,
  beginFoxProactiveOutcomeWatchV1,
  noteProactiveFeedbackEmotionalContextV1,
  evaluateFoxProactiveOutcomeWatchV1,
  __resetFoxProactiveAdaptationForTestV1
} from "../foxProactiveAdaptationV1.js";
import {
  persistFoxProactiveCalibrationDiskV1,
  hydrateFoxProactiveCalibrationDiskV1,
  __clearFoxProactiveCalibrationDiskForTestV1
} from "../foxProactiveCalibrationPersistV1.js";
import {
  buildFoxProactiveLlmPromptMessageV1,
  isFoxProactiveLlmEnabledV1,
  resolveFoxProactiveUtteranceV1
} from "../foxProactiveUtteranceLlmV1.js";

describe("rhizohDialogueThread emotional shift", () => {
  it("detects trajectory delta", () => {
    const baseline = Object.freeze({
      direction: "steady",
      slope: 0,
      tensionEma: 0.2,
      repairEma: 0.2
    });
    const shifted = Object.freeze({
      direction: "rising_tension",
      slope: 0.18,
      tensionEma: 0.34,
      repairEma: 0.2
    });
    expect(detectRhizohEmotionalShiftV1(baseline, shifted)).toBe(true);
    expect(detectRhizohEmotionalShiftV1(baseline, baseline)).toBe(false);
  });
});

describe("foxProactiveCalibrationPersistV1", () => {
  beforeEach(() => {
    __clearFoxProactiveCalibrationDiskForTestV1();
  });

  it("roundtrips calibration via localStorage", () => {
    persistFoxProactiveCalibrationDiskV1({
      calibration: {
        significanceThreshold: 0.81,
        cooldownMinutes: 28,
        maxInitiationsPerHour: 1,
        dailyLimit: 10,
        proactiveTolerance: 0.42,
        engagementRate: 0.2,
        dismissRate: 0.6
      },
      outcomeHistory: [{ userDismissed: true }]
    });
    const disk = hydrateFoxProactiveCalibrationDiskV1();
    expect(disk?.calibration.significanceThreshold).toBe(0.81);
    expect(disk?.calibration.cooldownMinutes).toBe(28);
    expect(disk?.outcomeHistory.length).toBe(1);
  });
});

describe("foxProactiveAdaptation emotional context", () => {
  beforeEach(() => {
    __resetFoxProactiveAdaptationForTestV1();
  });

  it("emotional shift modulates tone without shifting behavior threshold", () => {
    recordFoxProactiveOutcomeFeedbackV1({
      emotionalShiftDetected: true,
      userEngaged: false,
      userDismissed: false,
      ghostComfort: 0.55
    });
    const cal = getFoxProactiveCalibrationV1();
    expect(cal.toneModulation?.active).toBe(true);
    expect(cal.significanceThreshold).toBe(0.72);
    expect(cal.maxInitiationsPerHour).toBe(2);
  });
});

describe("foxProactiveUtteranceLlmV1", () => {
  it("builds proactive continuity prompt with initiative context", () => {
    const msg = buildFoxProactiveLlmPromptMessageV1(
      { source: "traffic", significance: 0.82 },
      null,
      {}
    );
    expect(msg).toContain("[RHIZOH_PROACTIVE_CONTINUITY]");
    expect(msg).toContain("traffic");
  });

  it("falls back to template when llm disabled", async () => {
    const prev = import.meta.env.VITE_FOX_PROACTIVE_LLM;
    import.meta.env.VITE_FOX_PROACTIVE_LLM = "0";
    const out = await resolveFoxProactiveUtteranceV1({ source: "traffic", significance: 0.8 });
    expect(out.source).toBe("template");
    expect(out.phrase.length).toBeGreaterThan(10);
    import.meta.env.VITE_FOX_PROACTIVE_LLM = prev;
  });

  it("is enabled by default", () => {
    const prev = import.meta.env.VITE_FOX_PROACTIVE_LLM;
    delete import.meta.env.VITE_FOX_PROACTIVE_LLM;
    expect(isFoxProactiveLlmEnabledV1()).toBe(true);
    import.meta.env.VITE_FOX_PROACTIVE_LLM = prev;
  });
});
