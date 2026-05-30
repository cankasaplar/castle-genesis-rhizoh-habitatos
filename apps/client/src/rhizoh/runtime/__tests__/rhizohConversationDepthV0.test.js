import { describe, it, expect } from "vitest";
import {
  resolveRhizohConversationDepthV0,
  RHIZOH_CONVERSATION_MODE_V0,
  RHIZOH_CONVERSATION_INTENT_V0
} from "../rhizohConversationDepthV0.js";
import { RHIZOH_CONVERSATION_PHASE } from "../../product/rhizohConversationOrchestratorV1.js";

describe("resolveRhizohConversationDepthV0", () => {
  it("maps greeting to greet mode with low depth", () => {
    const d = resolveRhizohConversationDepthV0({
      message: "Selam Rhizoh",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.INTRO,
      userTurnCount: 1
    });
    expect(d.conversationMode).toBe(RHIZOH_CONVERSATION_MODE_V0.GREET);
    expect(d.depthLevel).toBe(1);
    expect(d.responseLength).toBe("short");
  });

  it("maps challenge phrasing to debate", () => {
    const d = resolveRhizohConversationDepthV0({
      message: "Ama bu yanlış değil mi? Neden öyle düşünüyorsun?",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 8
    });
    expect(d.conversationIntent).toBe(RHIZOH_CONVERSATION_INTENT_V0.CHALLENGE);
    expect(d.conversationMode).toBe(RHIZOH_CONVERSATION_MODE_V0.DEBATE);
    expect(d.depthLevel).toBeGreaterThanOrEqual(4);
  });

  it("uses legacy generation hint as mode override", () => {
    const d = resolveRhizohConversationDepthV0({
      message: "devam",
      generationModeHint: "NARRATIVE",
      conversationPhase: RHIZOH_CONVERSATION_PHASE.TRUST_BUILD,
      userTurnCount: 5
    });
    expect(d.conversationMode).toBe(RHIZOH_CONVERSATION_MODE_V0.NARRATIVE);
  });

  it("enables phrase chunking for voice at depth >= 3", () => {
    const d = resolveRhizohConversationDepthV0({
      message: "uzun bir düşünce denemesi " + "x".repeat(120),
      voiceTurn: true,
      conversationPhase: RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
      userTurnCount: 15
    });
    expect(d.phraseChunking).toBe(true);
  });
});
