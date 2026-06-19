import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetEpistemicGraphInflationGuardForTestV0,
  assessDampenedAnomalyScoreV2,
  assessEpistemicGraphInflationRiskV0,
  dampenAnomalyScoreV2,
  recordCouncilTriggerForInflationGuardV0,
  recordStressRunForInflationGuardV0,
  resolveCouncilCooldownMsV2
} from "../rhizohEpistemicGraphInflationGuardV0.js";
import { __resetEpistemicMemoryGraphForTestV0 } from "../rhizohEpistemicMemoryGraphV0.js";

describe("rhizohEpistemicGraphInflationGuardV0", () => {
  beforeEach(() => {
    __resetEpistemicGraphInflationGuardForTestV0();
    __resetEpistemicMemoryGraphForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true } };
    }
  });

  it("escalates risk with council and stress density", () => {
    const low = assessEpistemicGraphInflationRiskV0();
    expect(low.level).toBe("low");
    expect(low.version).toBe(2);
    expect(low.recommendedCooldownMs).toBe(60_000);

    for (let i = 0; i < 6; i += 1) recordCouncilTriggerForInflationGuardV0();
    for (let i = 0; i < 3; i += 1) recordStressRunForInflationGuardV0();
    const high = assessEpistemicGraphInflationRiskV0();
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("dampens anomaly score when inflation elevated", () => {
    const mediumInflation = { level: "medium", score: 0.5 };
    const dampened = dampenAnomalyScoreV2(0.97, mediumInflation);
    expect(dampened).toBeLessThan(0.97);

    for (let i = 0; i < 9; i += 1) recordCouncilTriggerForInflationGuardV0();
    for (let i = 0; i < 5; i += 1) recordStressRunForInflationGuardV0();
    const wrapped = assessDampenedAnomalyScoreV2(0.97);
    expect(wrapped.dampeningActive).toBe(true);
    expect(wrapped.dampened).toBeLessThan(0.97);
  });

  it("extends council cooldown by inflation level", () => {
    expect(resolveCouncilCooldownMsV2("low")).toBe(60_000);
    expect(resolveCouncilCooldownMsV2("medium")).toBe(120_000);
    expect(resolveCouncilCooldownMsV2("high")).toBe(300_000);
  });
});
