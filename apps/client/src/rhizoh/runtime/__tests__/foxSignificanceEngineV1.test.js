import { describe, it, expect } from "vitest";
import {
  resolveFoxSignificanceEngineV1,
  evaluateFoxBehaviorPostureV1,
  FOX_BEHAVIOR_POSTURE_V1
} from "../foxSignificanceEngineV1.js";

describe("foxSignificanceEngineV1", () => {
  it("scores long-running narrative higher than fresh sports novelty alone", () => {
    const longTopic = resolveFoxSignificanceEngineV1({
      narrativeThread: {
        intentChain: ["REFLECT", "REFLECT", "REFLECT", "CHAT"],
        arcSummary: "20 günlük yalnızlık konusu"
      },
      narrativeArc: { phase: "deepening", direction: "trust_build", bondTrend: "rising" },
      memoryEpisodes: Array.from({ length: 8 }, (_, i) => ({ intent: "REFLECT", id: i })),
      userTurnCount: 18,
      continuity: {
        relationship: { bondScore: 0.72, trust: 0.7, familiarity: 0.74 },
        identityNarrative: "x".repeat(120)
      }
    });

    const sportsOnlyAttention = {
      score: 0.58,
      worldSignal: 0.55,
      userSignal: 0.2
    };
    const lowSignificance = resolveFoxSignificanceEngineV1({
      userTurnCount: 1,
      memoryEpisodes: []
    });

    expect(longTopic.significanceScore).toBeGreaterThan(lowSignificance.significanceScore);
    expect(longTopic.significanceField.longTermContinuityImpact).toBeGreaterThan(0.4);
    expect(longTopic.significanceScore).toBeGreaterThan(
      lowSignificance.significanceScore + sportsOnlyAttention.worldSignal * 0.1
    );
  });

  it("behavior posture: user turn reacts, world-only observes", () => {
    const react = evaluateFoxBehaviorPostureV1({
      attentionField: { score: 0.5, worldSignal: 0.6 },
      significanceField: { score: 0.3 },
      userInitiated: true,
      message: "hava nasıl"
    });
    expect(react.posture).toBe(FOX_BEHAVIOR_POSTURE_V1.REACT);
    expect(react.maySpeak).toBe(true);

    const observe = evaluateFoxBehaviorPostureV1({
      attentionField: { score: 0.4, worldSignal: 0.5 },
      significanceField: { score: 0.25 },
      userInitiated: false,
      message: ""
    });
    expect(observe.posture).toBe(FOX_BEHAVIOR_POSTURE_V1.OBSERVE);
    expect(observe.maySpeak).toBe(false);
  });

  it("behavior posture: high significance + world yields initiate candidate not speak", () => {
    const init = evaluateFoxBehaviorPostureV1({
      attentionField: { score: 0.55, worldSignal: 0.7 },
      significanceField: { score: 0.8 },
      userInitiated: false,
      message: ""
    });
    expect(init.posture).toBe(FOX_BEHAVIOR_POSTURE_V1.INITIATE_CANDIDATE);
    expect(init.maySpeak).toBe(false);
    expect(init.mayInitiate).toBe(true);
  });
});
