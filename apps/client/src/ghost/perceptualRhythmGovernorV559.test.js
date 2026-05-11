import { describe, expect, it } from "vitest";
import {
  createCollectiveFatigueSensor,
  createEngagementOscillationSmoother,
  createPerceptualRhythmGovernor,
  shapeBoredomCurve01
} from "./perceptualRhythmGovernorV559.js";

describe("perceptualRhythmGovernorV559", () => {
  it("shapeBoredomCurve01 maps endpoints", () => {
    expect(shapeBoredomCurve01(0)).toBeLessThan(0.2);
    expect(shapeBoredomCurve01(1)).toBeGreaterThan(0.85);
  });

  it("createEngagementOscillationSmoother reduces jagged input", () => {
    const s = createEngagementOscillationSmoother({ alpha: 0.25 });
    const a = s.step(0.9, 0.05);
    const b = s.step(0.1, 0.05);
    expect(Math.abs(a.smoothed01 - b.smoothed01)).toBeLessThan(0.85);
  });

  it("createCollectiveFatigueSensor increases burst interval multiplier", () => {
    const f = createCollectiveFatigueSensor({});
    expect(f.burstIntervalMultiplier01()).toBeCloseTo(1, 5);
    f.ingestCollectiveLoad01(0.9, 1);
    expect(f.fatigue01()).toBeGreaterThan(0.05);
    expect(f.burstIntervalMultiplier01()).toBeGreaterThan(1);
  });

  it("createPerceptualRhythmGovernor enforces cooldown between bursts", () => {
    const rhythm = createPerceptualRhythmGovernor({
      minBurstIntervalMs: 20_000,
      burst: { burstWindowMs: 2000, boredomTrigger01: 0.5, maxRunawayForBurst: 0.5 }
    });
    const t0 = 1_000_000;
    const s1 = rhythm.step({
      nowMs: t0,
      rawActivity01: 0.05,
      stagnation01: 0.95,
      runawayRisk01: 0.1,
      dtSec: 0.05
    });
    expect(s1.inBurst).toBe(true);
    const tEnd = t0 + 3000;
    const s2 = rhythm.step({
      nowMs: tEnd,
      rawActivity01: 0.05,
      stagnation01: 0.95,
      runawayRisk01: 0.1,
      dtSec: 0.05
    });
    expect(s2.inBurst).toBe(false);
    const s3 = rhythm.step({
      nowMs: tEnd + 500,
      rawActivity01: 0.05,
      stagnation01: 0.95,
      runawayRisk01: 0.1,
      dtSec: 0.05
    });
    expect(s3.burstCooldownRemainingMs).toBeGreaterThan(15_000);
  });

  it("high runaway blocks burst", () => {
    const rhythm = createPerceptualRhythmGovernor({
      burst: { boredomTrigger01: 0.3, maxRunawayForBurst: 0.35 }
    });
    const s = rhythm.step({
      nowMs: 2_000_000,
      rawActivity01: 0.1,
      stagnation01: 0.99,
      runawayRisk01: 0.95,
      dtSec: 0.05
    });
    expect(s.inBurst).toBe(false);
  });
});
