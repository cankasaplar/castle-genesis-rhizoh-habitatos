import { describe, it, expect } from "vitest";
import {
  buildRhizohLlmDepthBundleV0,
  computeFoxAttentionScoreV0,
  mapFoxAttentionScoreToGenerationModeV0
} from "../rhizohConversationDepthLlmBridgeV0.js";
import { RHIZOH_CONVERSATION_PHASE } from "../../product/rhizohConversationOrchestratorV1.js";
import { FOX_BEHAVIOR_POSTURE_V1 } from "../foxSignificanceEngineV1.js";

describe("rhizohConversationDepthLlmBridgeV0", () => {
  it("keeps trivial clock queries in low attention band", () => {
    const score = computeFoxAttentionScoreV0({
      message: "Saat kaç?",
      router: { intent: "CHAT", emotionalSignal: "NEUTRAL" },
      depth: { continuityStrength: 0.7, depthLevel: 3 }
    });
    expect(score).toBe(0.15);
    expect(mapFoxAttentionScoreToGenerationModeV0(score)).toBe("FAST_DIALOGUE");
  });

  it("raises attention for vulnerable emotional phrasing", () => {
    const score = computeFoxAttentionScoreV0({
      message: "Bugün biraz yalnız hissediyorum.",
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" },
      depth: { continuityStrength: 0.55, depthLevel: 2 }
    });
    expect(score).toBeGreaterThanOrEqual(0.55);
  });

  it("buildRhizohLlmDepthBundleV0 emits gateway depth options", () => {
    const bundle = buildRhizohLlmDepthBundleV0({
      message: "Hayatımın yönünü sorguluyorum.",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 10,
      voiceTurn: true,
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" }
    });
    expect(bundle.gatewayOptions.conversationMode).toBeTruthy();
    expect(bundle.gatewayOptions.depthLevel).toBeGreaterThanOrEqual(1);
    expect(bundle.generationMode).not.toBe("FAST_DIALOGUE");
    expect(bundle.depth.storySnapshot).toBeTruthy();
  });

  it("respects pinGenerationMode when UI forces a mode", () => {
    const bundle = buildRhizohLlmDepthBundleV0({
      message: "uzun anlatı",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 4,
      pinGenerationMode: true,
      callerGenerationMode: "DEEP_REASONING"
    });
    expect(bundle.generationMode).toBe("DEEP_REASONING");
    expect(bundle.modeResolution.pinned).toBe(true);
  });

  it("bundle elevates generation mode for emotional depth via FOX", () => {
    const bundle = buildRhizohLlmDepthBundleV0({
      message: "Kendimi kaybolmuş hissediyorum ve konuşmaya ihtiyacım var.",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 6,
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" }
    });
    expect(["STANDARD", "REFLECTIVE", "NARRATIVE", "DEEP_REASONING"]).toContain(bundle.generationMode);
    expect(bundle.generationMode).not.toBe("FAST_DIALOGUE");
    expect(bundle.fox?.attentionScore).toBeGreaterThan(0.5);
  });

  it("exposes foxAttentionField and ghost bindings on bundle", () => {
    const bundle = buildRhizohLlmDepthBundleV0({
      message: "Merhaba Rhizoh",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.INTRO,
      userTurnCount: 1
    });
    expect(String(bundle.foxAttentionPromptBlock || "")).toContain("FOX attention field");
    expect(bundle.foxAttentionField?.userSignal).toBeGreaterThan(0);
    expect(bundle.ghostAttentionBindings?.ghostCuriosity).toBe(bundle.foxAttentionField?.noveltySignal);
    expect(bundle.ghostAttentionBindings?.ghostFocus).toBe(bundle.foxAttentionField?.continuitySignal);
    expect(bundle.ghostAttentionBindings?.ghostAlertness).toBe(bundle.foxAttentionField?.worldSignal);
  });

  it("emits significance, awareness, behavior posture, and ghost state (Sprint 5)", () => {
    const bundle = buildRhizohLlmDepthBundleV0({
      message: "Bugün biraz yalnız hissediyorum.",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 12,
      narrativeThread: { intentChain: ["REFLECT", "REFLECT"], arcSummary: "yalnızlık" },
      router: { intent: "REFLECT", emotionalSignal: "CONTEMPLATIVE" }
    });
    expect(bundle.foxSignificanceField?.score).toBeGreaterThan(0);
    expect(bundle.castleAwarenessField?.schema).toBeTruthy();
    expect(bundle.foxBehaviorPosture?.posture).toBe(FOX_BEHAVIOR_POSTURE_V1.REACT);
    expect(bundle.foxBehaviorPosture?.maySpeak).toBe(true);
    expect(bundle.ghostState?.curiosity).toBe(bundle.foxAttentionField?.noveltySignal);
    expect(String(bundle.foxSignificancePromptBlock || "")).toContain("FOX significance");
    expect(bundle.dialogueThread?.schema).toBeTruthy();
    expect(bundle.foxContinuityPressure?.pressure).toBeGreaterThanOrEqual(0);
    expect(String(bundle.rhizohDialogueThreadPromptBlock || "")).toContain("dialogue thread");
    expect(bundle.ghostPresentationBias?.role).toBe("presentation_bias_only_no_output");
    expect(bundle.ghostState?.continuity).toBeGreaterThanOrEqual(0);
  });
});
