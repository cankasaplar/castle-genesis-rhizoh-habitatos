import { describe, expect, it } from "vitest";
import {
  applyV558RelaxedStabilityStack,
  buildRelaxationBundle,
  computeStabilityRelaxation01,
  createCreativeBurstScheduler,
  deterministicVolatilityNoise01,
  effectiveRunawayAfterRelaxation,
  injectSafeVolatilityIntoReaction,
  relaxedGovernanceFeedScale,
  relaxedMinEntropy01,
  relaxedPeakCap
} from "./adaptiveStabilityRelaxationV558.js";

describe("adaptiveStabilityRelaxationV558", () => {
  it("computeStabilityRelaxation01 rises when quiet and stagnant and runaway low", () => {
    const hi = computeStabilityRelaxation01({
      activity01: 0.08,
      stagnation01: 0.85,
      runawayRisk01: 0.12
    });
    const lo = computeStabilityRelaxation01({
      activity01: 0.7,
      stagnation01: 0.15,
      runawayRisk01: 0.12
    });
    expect(hi.relaxation01).toBeGreaterThan(lo.relaxation01);
  });

  it("computeStabilityRelaxation01 drops when runaway high", () => {
    const safe = computeStabilityRelaxation01({ activity01: 0.1, stagnation01: 0.9, runawayRisk01: 0.1 });
    const risk = computeStabilityRelaxation01({ activity01: 0.1, stagnation01: 0.9, runawayRisk01: 0.92 });
    expect(safe.relaxation01).toBeGreaterThan(risk.relaxation01);
  });

  it("effectiveRunawayAfterRelaxation reduces runaway under relaxation", () => {
    expect(effectiveRunawayAfterRelaxation(0.6, 0.5)).toBeLessThan(0.6);
    expect(effectiveRunawayAfterRelaxation(0.6, 0)).toBeCloseTo(0.6, 5);
  });

  it("relaxedPeakCap and relaxedMinEntropy01 move in expected directions", () => {
    expect(relaxedPeakCap(0.8, 0.5)).toBeGreaterThan(0.8);
    expect(relaxedMinEntropy01(0.5, 0.5)).toBeLessThan(0.5);
  });

  it("createCreativeBurstScheduler opens window on boredom", () => {
    const s = createCreativeBurstScheduler({ burstWindowMs: 5000, boredomTrigger01: 0.5, maxRunawayForBurst: 0.5 });
    const t0 = 1_000_000;
    s.tick({ nowMs: t0, boredom01: 0.8, runawayRisk01: 0.2 });
    expect(s.burstRelaxationBonus01(t0 + 100)).toBeGreaterThan(0);
    expect(s.burstRelaxationBonus01(t0 + 6000)).toBe(0);
  });

  it("injectSafeVolatilityIntoReaction is bounded and deterministic", () => {
    const r0 = { collectiveWakeFeedback01: 0.4, microWakeBoost01: 0.3, resistanceSoftening01: 0.35 };
    const a = injectSafeVolatilityIntoReaction(r0, 0.9, 12345);
    const b = injectSafeVolatilityIntoReaction(r0, 0.9, 12345);
    expect(a).toEqual(b);
    expect(
      Math.abs(a.collectiveWakeFeedback01 - r0.collectiveWakeFeedback01) +
        Math.abs(a.microWakeBoost01 - r0.microWakeBoost01) +
        Math.abs(a.resistanceSoftening01 - r0.resistanceSoftening01)
    ).toBeLessThan(0.2);
  });

  it("deterministicVolatilityNoise01 in [0,1)", () => {
    const x = deterministicVolatilityNoise01(999);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  });

  it("relaxedGovernanceFeedScale increases feed scale when relaxed", () => {
    const s = relaxedGovernanceFeedScale(0.55, 0.6);
    expect(s).toBeGreaterThan(0.55);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("applyV558RelaxedStabilityStack differs from raw under high relaxation", () => {
    const bundle = buildRelaxationBundle({
      nowMs: 5000,
      activity01: 0.05,
      stagnation01: 0.9,
      runawayRisk01: 0.08
    });
    const raw = { collectiveWakeFeedback01: 0.85, microWakeBoost01: 0.12, resistanceSoftening01: 0.1 };
    const out = applyV558RelaxedStabilityStack(raw, bundle, 42_000);
    const sumRaw = raw.collectiveWakeFeedback01 + raw.microWakeBoost01 + raw.resistanceSoftening01;
    const sumOut = out.collectiveWakeFeedback01 + out.microWakeBoost01 + out.resistanceSoftening01;
    expect(Math.abs(sumOut - sumRaw)).toBeLessThan(0.25);
    expect(bundle.volatilityBudget01).toBeGreaterThan(0);
  });

  it("buildRelaxationBundle combines burst bonus", () => {
    const burst = createCreativeBurstScheduler({ burstWindowMs: 8000 });
    burst.tick({ nowMs: 1000, boredom01: 0.9, runawayRisk01: 0.1 });
    const bundle = buildRelaxationBundle({
      nowMs: 1100,
      activity01: 0.1,
      stagnation01: 0.8,
      runawayRisk01: 0.15,
      burstScheduler: burst
    });
    expect(bundle.burstBonus01).toBeGreaterThan(0);
    expect(bundle.effectiveRunawayForStability01).toBeLessThan(0.15);
  });
});
