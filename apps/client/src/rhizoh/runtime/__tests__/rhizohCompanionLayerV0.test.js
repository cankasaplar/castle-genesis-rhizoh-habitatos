import { describe, it, expect } from "vitest";
import { extractMeaningFrameV0 } from "../rhizohMeaningFrameV0.js";
import { routeFastConversationV0, FAST_ROUTE_V0 } from "../rhizohFastConversationRouterV0.js";
import {
  resolveCompanionLayerV0,
  applyCompanionToProjectionV0,
  resolveCompanionFlowAckV0
} from "../rhizohCompanionLayerV0.js";
import { projectMeaningFrameV0 } from "../rhizohGlobalMeaningProjectorV0.js";
import { normalizeConversationVoicingV0, RHIZOH_CONVERSATION_VOICING_V0 } from "../rhizohConversationVoicingV0.js";

describe("rhizohCompanionLayerV0", () => {
  it("maps assistant role alias to companion voicing", () => {
    expect(normalizeConversationVoicingV0("assistant")).toBe(
      RHIZOH_CONVERSATION_VOICING_V0.COMPANION
    );
  });

  it("resolves companion field not service agent", () => {
    const mf = extractMeaningFrameV0({ text: "Merhaba Rhizoh" });
    const route = routeFastConversationV0({ text: "Merhaba Rhizoh", meaningFrame: mf });
    const companion = resolveCompanionLayerV0({ meaningFrame: mf, route });
    expect(companion.ownsConversation).toBe(false);
    expect(companion.generatesResponses).toBe(false);
    expect(companion.flowModel).toBe("shared_speech_field");
    expect(companion.presenceMode).toBe("expressive");
  });

  it("applies companion attunement to projection", () => {
    const mf = extractMeaningFrameV0({ text: "Dün ne konuşmuştuk?", cohortLanguage: "tr" });
    const route = routeFastConversationV0({ text: mf.tokenEstimate ? "x" : "", meaningFrame: mf });
    const companion = resolveCompanionLayerV0({
      meaningFrame: mf,
      route,
      conversationDepth: { continuityStrength: 0.7 }
    });
    const proj = applyCompanionToProjectionV0(projectMeaningFrameV0(mf), companion);
    expect(proj.companionAttunement.relationalTone).toBeTruthy();
    expect(String(proj.projectionDirective.hint)).toContain("Companion field");
  });

  it("companion flow ack avoids assistant framing", () => {
    const ack = resolveCompanionFlowAckV0("tr");
    expect(ack).not.toMatch(/asistan|assistant/i);
    expect(ack).toMatch(/akış|Buradayız/i);
  });
});
