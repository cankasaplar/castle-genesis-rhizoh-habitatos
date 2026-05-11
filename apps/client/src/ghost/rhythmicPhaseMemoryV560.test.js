import { describe, expect, it } from "vitest";
import {
  blendEngagementWithSeason,
  createBurstPhaseMemory,
  createLongTermOscillationFingerprint,
  createRhythmicPhaseMemoryLayer,
  seasonalEngagementPrior01,
  tickFatigueRecoveryModel
} from "./rhythmicPhaseMemoryV560.js";

describe("rhythmicPhaseMemoryV560", () => {
  it("createBurstPhaseMemory records intervals and suggests cooldown", () => {
    const m = createBurstPhaseMemory({ maxEvents: 16 });
    m.onBurstStart(1000, { boredom01: 0.8, runaway01: 0.1 });
    m.onBurstEnd(3000);
    m.onBurstStart(25_000, { boredom01: 0.7, runaway01: 0.12 });
    m.onBurstEnd(27_000);
    const avg = m.averageInterBurstIntervalMs();
    expect(avg).not.toBeNull();
    expect(avg).toBeGreaterThan(20_000);
    const sug = m.suggestCooldownMs(14_000, { learnRate01: 0.3, maxStretch01: 0.4 });
    expect(sug).toBeGreaterThanOrEqual(14_000 * 0.75);
  });

  it("tickFatigueRecoveryModel slows when deep fatigue", () => {
    const shallow = tickFatigueRecoveryModel(0.35, 0.1, { deepThreshold01: 0.6, lambdaFast: 0.5, lambdaSlow: 0.1 });
    const deep = tickFatigueRecoveryModel(0.75, 0.1, { deepThreshold01: 0.6, lambdaFast: 0.5, lambdaSlow: 0.1 });
    expect(deep).toBeGreaterThan(shallow);
  });

  it("createLongTermOscillationFingerprint tracks zero-cross rate", () => {
    const fp = createLongTermOscillationFingerprint({ windowSize: 16 });
    for (let i = 0; i < 16; i++) fp.push(i % 2 === 0 ? 0.2 : 0.8);
    const f = fp.fingerprint01();
    expect(f.sampleCount).toBe(16);
    expect(f.zeroCrossRate01).toBeGreaterThan(0.3);
  });

  it("seasonalEngagementPrior01 in [0,1]", () => {
    const p = seasonalEngagementPrior01(Date.UTC(2026, 4, 8, 18, 0, 0));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it("blendEngagementWithSeason pulls toward prior", () => {
    const b = blendEngagementWithSeason(0.1, Date.UTC(2026, 4, 8, 18, 0, 0), 0.5);
    const p = seasonalEngagementPrior01(Date.UTC(2026, 4, 8, 18, 0, 0));
    expect(Math.abs(b - p)).toBeLessThan(Math.abs(0.1 - p));
  });

  it("createRhythmicPhaseMemoryLayer ingests rhythm steps", () => {
    const layer = createRhythmicPhaseMemoryLayer({});
    layer.ingestRhythmStep(
      { inBurst: true, shapedBoredom01: 0.7, oscillationRisk01: 0.3, runawayRisk01: 0.1 },
      1000,
      0.5
    );
    layer.ingestRhythmStep(
      { inBurst: false, shapedBoredom01: 0.5, oscillationRisk01: 0.2, runawayRisk01: 0.1 },
      4000,
      0.5
    );
    expect(layer.burstMemory.recentRecords(2).length).toBeGreaterThanOrEqual(1);
    expect(layer.oscillationFingerprint01().sampleCount).toBeGreaterThan(0);
  });
});
