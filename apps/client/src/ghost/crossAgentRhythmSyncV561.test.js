import { describe, expect, it } from "vitest";
import {
  cappedPullTowardCollective,
  circularDelta01,
  circularMeanPhase01,
  createCrossAgentRhythmOrchestrator,
  rhythmDispersion01,
  viralSynchronizationSignal01,
  wrapPhase01
} from "./crossAgentRhythmSyncV561.js";

describe("crossAgentRhythmSyncV561", () => {
  it("circularMeanPhase01 aligns opposite phases toward middle", () => {
    const m = circularMeanPhase01([
      { phase01: 0, weight01: 1 },
      { phase01: 0.5, weight01: 1 }
    ]);
    expect(m.mean01).toBeGreaterThan(0.2);
    expect(m.mean01).toBeLessThan(0.8);
    expect(m.cohesion01).toBeLessThan(0.2);
  });

  it("rhythmDispersion01 low when phases match", () => {
    const d = rhythmDispersion01([
      { phase01: 0.3, weight01: 1 },
      { phase01: 0.31, weight01: 1 },
      { phase01: 0.29, weight01: 1 }
    ]);
    expect(d).toBeLessThan(0.25);
  });

  it("circularDelta01 wraps correctly", () => {
    expect(circularDelta01(0.95, 0.05)).toBeGreaterThan(0);
    expect(Math.abs(circularDelta01(0.5, 0.5))).toBeLessThan(1e-9);
  });

  it("cappedPullTowardCollective respects max step", () => {
    const out = cappedPullTowardCollective(0, 0.5, 1, 0.05);
    expect(Math.abs(circularDelta01(0, out))).toBeLessThanOrEqual(0.06);
  });

  it("viralSynchronizationSignal01 spikes on collapse + engagement", () => {
    const v = viralSynchronizationSignal01(0.9, 0.2, 0.8, 0.3, { wCollapse: 1, wEngage: 1 });
    expect(v.viralSync01).toBeGreaterThan(0.5);
  });

  it("createCrossAgentRhythmOrchestrator dampens pull when viralSync high", () => {
    const orch = createCrossAgentRhythmOrchestrator({ basePull01: 0.6, desyncGuard01: 0.55 });
    const spread = [
      { phase01: 0, weight01: 1 },
      { phase01: 0.02, weight01: 1 }
    ];
    const hi = orch.step(spread, 0.5);
    expect(hi.viralSync01).toBeGreaterThan(0.35);
    expect(hi.pullEffective01).toBeLessThan(0.55);
  });

  it("wrapPhase01 normalizes", () => {
    expect(wrapPhase01(-0.25)).toBeCloseTo(0.75, 5);
  });
});
