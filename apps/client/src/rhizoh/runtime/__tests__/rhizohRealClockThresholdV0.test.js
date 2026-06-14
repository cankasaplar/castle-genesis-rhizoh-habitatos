import { describe, expect, it } from "vitest";
import {
  isRhizohRealClockThresholdMomentV0,
  resolveRhizohClockThresholdRemainingMsV0,
  resolveRhizohNextClockThresholdV0,
  resolveRhizohRealClockWavePhaseV0,
  resolveRhizohRealClockWaveVisualV0
} from "../rhizohRealClockThresholdV0.js";

describe("rhizohRealClockThresholdV0", () => {
  it("detects 06:44 and 18:44 threshold minutes", () => {
    const dawn = new Date(2026, 5, 14, 6, 44, 10).getTime();
    const dusk = new Date(2026, 5, 14, 18, 44, 0).getTime();
    expect(isRhizohRealClockThresholdMomentV0(dawn)).toBe(true);
    expect(isRhizohRealClockThresholdMomentV0(dusk)).toBe(true);
    expect(isRhizohRealClockThresholdMomentV0(new Date(2026, 5, 14, 12, 0).getTime())).toBe(false);
  });

  it("resolves next threshold deadline", () => {
    const beforeDawn = new Date(2026, 5, 14, 6, 0, 0).getTime();
    const next = resolveRhizohNextClockThresholdV0(beforeDawn);
    expect(next.id).toBe("dawn");
    expect(next.label).toBe("06:44");
    expect(resolveRhizohClockThresholdRemainingMsV0(next.deadlineMs, beforeDawn)).toBe(44 * 60_000);
  });

  it("shifts visual phase at threshold", () => {
    expect(resolveRhizohRealClockWavePhaseV0({ remainingMs: 0, thresholdId: "dusk" })).toBe("dusk");
    expect(resolveRhizohRealClockWavePhaseV0({ remainingMs: 5000 })).toBe("counting");
    expect(resolveRhizohRealClockWaveVisualV0("counting").accent).toBe("#67e8f9");
    expect(resolveRhizohRealClockWaveVisualV0("dusk").accent).toBe("#ff8800");
  });
});
