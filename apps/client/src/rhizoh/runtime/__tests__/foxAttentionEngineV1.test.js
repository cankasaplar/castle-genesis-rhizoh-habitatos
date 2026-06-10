import { describe, it, expect } from "vitest";
import {
  computeFoxAttentionFieldV1,
  computeFoxAttentionScoreV1,
  buildRhizohFoxAttentionFieldV1,
  mapFoxAttentionScoreToGenerationModeV1,
  resolveFoxAttentionEngineV1,
  applyFoxAttentionToDepthV1,
  FOX_ATTENTION_DOMINANT_SOURCE_V1,
  FOX_ATTENTION_SCORE_WEIGHTS_V1
} from "../foxAttentionEngineV1.js";
import { RHIZOH_CONVERSATION_MODE_V0 } from "../rhizohConversationDepthV0.js";
import { RHIZOH_CONVERSATION_PHASE } from "../../product/rhizohConversationOrchestratorV1.js";
import { resolveRhizohConversationDepthV0 } from "../rhizohConversationDepthV0.js";

describe("foxAttentionEngineV1 field model", () => {
  it("scores trivial clock queries with low userSignal", () => {
    const field = computeFoxAttentionFieldV1({
      message: "Saat kaç?",
      router: { intent: "CHAT", emotionalSignal: "NEUTRAL" },
      depth: { continuityStrength: 0.8, depthLevel: 4 }
    });
    expect(field.userSignal).toBe(0.1);
    expect(computeFoxAttentionScoreV1(field)).toBe(0.15);
    expect(mapFoxAttentionScoreToGenerationModeV1(0.15)).toBe("FAST_DIALOGUE");
  });

  it("raises userSignal and emotionalSignal for vulnerable phrasing", () => {
    const field = computeFoxAttentionFieldV1({
      message: "Bugün biraz yalnız hissediyorum.",
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" },
      depth: { continuityStrength: 0.55, depthLevel: 2 }
    });
    expect(field.userSignal).toBeGreaterThanOrEqual(0.7);
    expect(field.emotionalSignal).toBeGreaterThanOrEqual(0.55);
    const score = computeFoxAttentionScoreV1(field);
    expect(score).toBeGreaterThanOrEqual(0.45);
    expect(mapFoxAttentionScoreToGenerationModeV1(score)).not.toBe("FAST_DIALOGUE");
  });

  it("uses weighted attentionScore formula", () => {
    const field = computeFoxAttentionFieldV1({
      message: "Kendimi kötü hissediyorum.",
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" },
      depth: { continuityStrength: 0.5, depthLevel: 2 },
      emotions: { care: 0.7, tension: 0.4, rupture: 0.2 }
    });
    const w = FOX_ATTENTION_SCORE_WEIGHTS_V1;
    const expected =
      field.userSignal * w.userSignal +
      field.continuitySignal * w.continuitySignal +
      field.emotionalSignal * w.emotionalSignal +
      field.noveltySignal * w.noveltySignal +
      field.worldSignal * w.worldSignal;
    expect(computeFoxAttentionScoreV1(field)).toBeCloseTo(expected, 3);
  });

  it("lowers noveltySignal when same intent repeats in episodes", () => {
    const high = computeFoxAttentionFieldV1({
      message: "yeni bir konu",
      router: { intent: "CHAT" },
      depth: { continuityStrength: 0.4, depthLevel: 2 },
      memoryEpisodes: []
    });
    const low = computeFoxAttentionFieldV1({
      message: "yine aynı konu",
      router: { intent: "CHAT" },
      depth: { continuityStrength: 0.7, depthLevel: 3 },
      memoryEpisodes: Array.from({ length: 10 }, (_, i) => ({ intent: "CHAT", id: i }))
    });
    expect(high.noveltySignal).toBeGreaterThan(low.noveltySignal);
    expect(low.noveltySignal).toBeLessThanOrEqual(0.15);
  });

  it("raises continuitySignal when narrative thread repeats intent", () => {
    const field = computeFoxAttentionFieldV1({
      message: "devam edelim",
      router: { intent: "REFLECT" },
      depth: { continuityStrength: 0.6, depthLevel: 3 },
      narrativeThread: {
        focusIntent: "REFLECT",
        intentChain: ["REFLECT", "REFLECT", "REFLECT", "CHAT"],
        arcSummary: "yalnızlık üzerine konuşuyoruz"
      },
      recentTurns: [
        { user: "a", ts: Date.now() - 120_000 },
        { user: "b", ts: Date.now() - 60_000 }
      ]
    });
    expect(field.continuitySignal).toBeGreaterThanOrEqual(0.65);
  });

  it("buildRhizohFoxAttentionFieldV1 exposes dominantSource and ghostBindings", () => {
    const field = computeFoxAttentionFieldV1({
      message: "Deprem oldu mu?",
      router: { intent: "CRISIS", emotionalSignal: "ALERT", urgency: 0.9 },
      depth: { continuityStrength: 0.4, depthLevel: 2 }
    });
    const score = computeFoxAttentionScoreV1(field);
    const attentionField = buildRhizohFoxAttentionFieldV1(field, score, 1_700_000_000_000);
    expect(attentionField.dominantSource).toBeTruthy();
    expect(attentionField.ghostBindings.ghostCuriosity).toBe(field.noveltySignal);
    expect(attentionField.ghostBindings.ghostFocus).toBe(field.continuitySignal);
    expect(attentionField.ghostBindings.ghostAlertness).toBe(field.worldSignal);
    expect(attentionField.generatedAt).toBe(1_700_000_000_000);
    expect(field.worldSignal).toBeGreaterThanOrEqual(0.9);
  });

  it("applyFoxAttentionToDepthV1 elevates narrative mode for high score", () => {
    const depth = {
      conversationMode: RHIZOH_CONVERSATION_MODE_V0.GREET,
      depthLevel: 1,
      continuityStrength: 0.3,
      conversationIntent: "extend"
    };
    const field = {
      emotionalSignal: 0.5,
      userSignal: 0.7,
      continuitySignal: 0.4,
      noveltySignal: 0.3,
      worldSignal: 0.2
    };
    const next = applyFoxAttentionToDepthV1(depth, 0.88, field);
    expect(next.conversationMode).toBe(RHIZOH_CONVERSATION_MODE_V0.NARRATIVE);
    expect(next.depthLevel).toBeGreaterThanOrEqual(4);
  });

  it("resolveFoxAttentionEngineV1 returns unified attentionField", () => {
    const depth = resolveRhizohConversationDepthV0({
      message: "Hayatımın yönünü sorguluyorum.",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 10,
      voiceTurn: true
    });
    const fox = resolveFoxAttentionEngineV1({
      message: "Hayatımın yönünü sorguluyorum.",
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" },
      depth
    });
    expect(fox.attentionField.schema).toBeTruthy();
    expect(fox.attentionField.score).toBe(fox.attentionScore);
    expect(fox.promptBlock).toContain("FOX attention field");
    expect(fox.ghostBindings).toBeTruthy();
    expect(Object.values(FOX_ATTENTION_DOMINANT_SOURCE_V1)).toContain(
      fox.attentionField.dominantSource
    );
  });
});
