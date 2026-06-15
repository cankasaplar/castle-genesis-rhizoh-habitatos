import { describe, expect, it, beforeEach } from "vitest";
import {
  commitSpiralMMOAwakeningContinuityV0,
  readSpiralMMOContinuityV0,
  resetSpiralMMOContinuityForTestV0,
  resolveNextSpiralTriggerIndexV0,
  resolveSpiralMMOCollapseHandoffV0,
  resolveSpiralMMOEffectiveTriggerV0
} from "../spiralMMOContinuityV0.js";
import { resolveSpiralMMOBehaviorProfileV0 } from "../spiralMMOSpiralBehaviorV0.js";
import { buildSpiralMMOAwakeningLaunchPlanV0 } from "../spiralMMOAwakeningCycleV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../spiralMMOContinentPinsV0.js";

describe("spiralMMOContinuityV0", () => {
  beforeEach(() => {
    resetSpiralMMOContinuityForTestV0();
  });

  it("forbids re-entering the same spiral on consecutive clicks", () => {
    commitSpiralMMOAwakeningContinuityV0(2);
    const resolved = resolveSpiralMMOEffectiveTriggerV0(2, 7);
    expect(resolved.advanced).toBe(true);
    expect(resolved.triggerIndex).toBe(3);
    expect(resolved.reason).toBe("same_spiral_forbidden");
  });

  it("allows distinct spiral selection without advancing", () => {
    commitSpiralMMOAwakeningContinuityV0(2);
    const resolved = resolveSpiralMMOEffectiveTriggerV0(5, 7);
    expect(resolved.advanced).toBe(false);
    expect(resolved.triggerIndex).toBe(5);
  });

  it("collapse handoff always targets the next spiral on the ring", () => {
    const handoff = resolveSpiralMMOCollapseHandoffV0(4, 7);
    expect(handoff.fromIndex).toBe(4);
    expect(handoff.toIndex).toBe(5);
    expect(handoff.dualTransition).toBe(true);
    expect(resolveNextSpiralTriggerIndexV0(6, 7)).toBe(0);
  });

  it("launch plan collapse mode advances trigger and records continuity", () => {
    buildSpiralMMOAwakeningLaunchPlanV0(1, 1_700_000_000_000, { mode: "click", commit: true });
    const collapsePlan = buildSpiralMMOAwakeningLaunchPlanV0(1, 1_700_000_001_000, {
      mode: "collapse",
      commit: true
    });
    expect(collapsePlan.triggerPinIndex).toBe(2);
    expect(collapsePlan.triggerResolution.reason).toBe("collapse_dual_handoff");
    expect(collapsePlan.previousTriggerPinIndex).toBe(1);
    const state = readSpiralMMOContinuityV0();
    expect(state.lastTriggerIndex).toBe(2);
  });

  it("same-spiral click in plan builder redirects to a different spiral", () => {
    const first = buildSpiralMMOAwakeningLaunchPlanV0(3, 1_700_000_000_000, { commit: true });
    expect(first.triggerPinIndex).toBe(3);
    const second = buildSpiralMMOAwakeningLaunchPlanV0(3, 1_700_000_000_100, { commit: true });
    expect(second.triggerPinIndex).toBe(4);
    expect(second.triggerResolution.reason).toBe("same_spiral_forbidden");
  });
});

describe("spiralMMOSpiralBehaviorV0", () => {
  it("assigns distinct behavior profiles per continent", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const profiles = pins.map((p) => resolveSpiralMMOBehaviorProfileV0(p.continent, 0));
    const continents = new Set(profiles.map((p) => p.continent));
    expect(continents.size).toBe(pins.length);
    expect(profiles[0].dualLead).not.toBe(profiles[1].dualLead);
  });

  it("shifts color wave offset with continuity epoch", () => {
    const a = resolveSpiralMMOBehaviorProfileV0("asia", 0);
    const b = resolveSpiralMMOBehaviorProfileV0("asia", 3);
    expect(b.colorWaveOffset).not.toBe(a.colorWaveOffset);
  });
});
