import { describe, expect, it, beforeEach } from "vitest";
import {
  askRhizohKnowledgeGatewayV0,
  resolveKnowledgeEntityIdV0,
  KNOWLEDGE_LAYER_AUTHORITY_V0
} from "../rhizohKnowledgeGatewayV0.js";
import { clearObserverTraceForTestV0, injectObserverTraceEntriesForTestV0 } from "../observerReadOnlyHookV0.js";
import { clearAttentionSedimentForTestV0, refreshAttentionSedimentFromTraceV0 } from "../attentionSedimentationBufferV0.js";

describe("rhizohKnowledgeGatewayV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearAttentionSedimentForTestV0();
  });

  it("resolves WPRL Sports Arena from natural language question", () => {
    expect(resolveKnowledgeEntityIdV0("What is WPRL Sports Arena in Rhizoh?", null)).toBe(
      "wprl_sports_arena"
    );
  });

  it("assembles answer from habitat layers without exposing raw observer trace", () => {
    injectObserverTraceEntriesForTestV0([
      { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
      { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
      { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
    ]);
    refreshAttentionSedimentFromTraceV0();

    const out = askRhizohKnowledgeGatewayV0({
      question: "Rhizoh'da WPRL Sports Arena nedir?",
      locale: "tr"
    });

    expect(out.entityId).toBe("wprl_sports_arena");
    expect(out.answer.authorityStatus).toBe("verified_node");
    expect(out.layers.observerTrace.exposed).toBe(false);
    expect(out.layers.observerTrace.userFacing).toBe(false);
    expect(out.answer.habitatBiasOnly).toBe(true);
    expect(out.answer.badBiasBlocked).toBe(true);
    expect(out.queriableByExternalLlm).toBe(true);
    expect(out.answer.text).toContain("WPRL Sports Arena");
    expect(out.layers.narrative.layer).toBe(KNOWLEDGE_LAYER_AUTHORITY_V0.NARRATIVE.label);
  });
});
