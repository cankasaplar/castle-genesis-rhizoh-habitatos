import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetEpistemicGraphInflationGuardForTestV0,
  assessEpistemicGraphInflationRiskV0,
  recordCouncilTriggerForInflationGuardV0,
  recordStressRunForInflationGuardV0
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

    for (let i = 0; i < 6; i += 1) recordCouncilTriggerForInflationGuardV0();
    for (let i = 0; i < 3; i += 1) recordStressRunForInflationGuardV0();
    const high = assessEpistemicGraphInflationRiskV0();
    expect(high.score).toBeGreaterThan(low.score);
  });
});
