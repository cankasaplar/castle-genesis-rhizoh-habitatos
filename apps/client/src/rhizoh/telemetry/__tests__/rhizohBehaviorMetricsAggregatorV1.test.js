import { describe, expect, it } from "vitest";
import {
  applyRhizohBehaviorSignalToRollup,
  createEmptyRhizohBehaviorMetricsRollup,
  resetRhizohBehaviorMetricsRollup
} from "../rhizohBehaviorMetricsAggregatorV1.js";

describe("rhizohBehaviorMetricsAggregatorV1", () => {
  it("aggregates phase dwell and enter counts", () => {
    resetRhizohBehaviorMetricsRollup();
    const s = createEmptyRhizohBehaviorMetricsRollup();
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.phase.enter",
      phase: "INTRO",
      ts: 1
    });
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.phase.exit",
      phase: "INTRO",
      durationMs: 1200,
      ts: 2
    });
    expect(s.phaseEnterCount.INTRO).toBe(1);
    expect(s.phaseDwellMs.INTRO).toBe(1200);
    expect(s.counts["rhizoh.phase.enter"]).toBe(1);
    expect(s.counts["rhizoh.phase.exit"]).toBe(1);
  });

  it("aggregates closure dismiss reasons and visibility", () => {
    const s = createEmptyRhizohBehaviorMetricsRollup();
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.closure.dismiss",
      reason: "timeout",
      visibleMs: 11000,
      ts: 1
    });
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.closure.dismiss",
      reason: "replaced_or_unmount",
      visibleMs: 800,
      ts: 2
    });
    expect(s.closureDismiss.timeout).toBe(1);
    expect(s.closureDismiss.replaced_or_unmount).toBe(1);
    expect(s.closureVisibleMsSum).toBe(11800);
    expect(s.closureVisibleMsCount).toBe(2);
  });

  it("aggregates turn depth", () => {
    const s = createEmptyRhizohBehaviorMetricsRollup();
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.conversation.turn_depth",
      depth01: 0.4,
      userChars: 120,
      ts: 1
    });
    applyRhizohBehaviorSignalToRollup(s, {
      name: "rhizoh.conversation.turn_depth",
      depth01: 0.8,
      userChars: 50,
      ts: 2
    });
    expect(s.turnDepthCount).toBe(2);
    expect(s.turnDepthSum).toBeCloseTo(1.2);
    expect(s.turnDepthMax).toBe(0.8);
    expect(s.turnUserCharsSum).toBe(170);
  });
});
