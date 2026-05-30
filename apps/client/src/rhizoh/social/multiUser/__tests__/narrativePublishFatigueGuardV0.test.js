import { describe, expect, it } from "vitest";
import {
  advanceNarrativePublishFatigueObservationV0,
  createInitialNarrativePublishFatigueStateV0,
  evaluateNarrativePublishFatigueGateV0,
  recordNarrativePublishAcceptedV0
} from "../narrativePublishFatigueGuardV0.js";

describe("evaluateNarrativePublishFatigueGateV0", () => {
  it("blocks during cooldown", () => {
    const s = { ...createInitialNarrativePublishFatigueStateV0(), cooldownUntilMs: Date.now() + 60_000 };
    const g = evaluateNarrativePublishFatigueGateV0(s, {}, Date.now(), { lastEmitAtMs: 0 });
    expect(g.allow).toBe(false);
    expect(g.reason).toBe("NARRATIVE_COOLDOWN");
  });

  it("blocks arc saturation in window", () => {
    const arc = "castle.test.arc.v0";
    const now = 1_000_000;
    const s = {
      ...createInitialNarrativePublishFatigueStateV0(),
      lastPublishEmitAtMs: 0,
      recentArcPublishStamps: [
        { arcId: arc, ts: now },
        { arcId: arc, ts: now + 1 },
        { arcId: arc, ts: now + 2 }
      ]
    };
    const g = evaluateNarrativePublishFatigueGateV0(
      s,
      { youtubePipelineHint: { narrativeArcId: arc, publishRecommendationScore: 0.99 } },
      now + 3000,
      { lastEmitAtMs: 0, maxPerArc: 3 }
    );
    expect(g.allow).toBe(false);
    expect(g.reason).toBe("ARC_SATURATION_WINDOW");
  });
});

describe("advanceNarrativePublishFatigueObservationV0", () => {
  it("tracks intensity without throwing", () => {
    const s1 = advanceNarrativePublishFatigueObservationV0(createInitialNarrativePublishFatigueStateV0(), {
      nowMs: 5000,
      distributor: {
        youtubePipelineHint: { publishRecommendationScore: 0.8, emotionalDensity01: 0.85 }
      }
    });
    expect(typeof s1.intensityEwma01).toBe("number");
  });
});
