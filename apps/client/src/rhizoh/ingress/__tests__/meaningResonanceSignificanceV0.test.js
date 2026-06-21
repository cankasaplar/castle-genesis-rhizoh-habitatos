import { describe, expect, it, beforeEach } from "vitest";
import {
  isSignificanceQueryV0,
  resolveMeaningResonanceSignificanceV0
} from "../meaningResonanceSignificanceV0.js";
import { askRhizohKnowledgeGatewayV0 } from "../rhizohKnowledgeGatewayV0.js";
import { clearObserverTraceForTestV0, injectObserverTraceEntriesForTestV0 } from "../observerReadOnlyHookV0.js";
import { clearAttentionSedimentForTestV0, refreshAttentionSedimentFromTraceV0 } from "../attentionSedimentationBufferV0.js";

const WPRl_TRACE = [
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
];

describe("meaningResonanceSignificanceV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearAttentionSedimentForTestV0();
  });

  it("detects why/significance questions", () => {
    expect(isSignificanceQueryV0("Why is WPRL Sports Arena important?")).toBe(true);
    expect(isSignificanceQueryV0("WPRL Sports Arena nedir?")).toBe(false);
  });

  it("explains observed return without learning", () => {
    injectObserverTraceEntriesForTestV0(WPRl_TRACE);
    refreshAttentionSedimentFromTraceV0();

    const sig = resolveMeaningResonanceSignificanceV0({
      entityId: "wprl_sports_arena",
      locale: "en"
    });

    expect(sig.isLearning).toBe(false);
    expect(sig.explainsObservedBehavior).toBe(true);
    expect(sig.significance.authority).toContain("exists");
    expect(sig.significance.meaning).toContain("repeated");
    expect(sig.significance.narrative).toContain("attention anchor");
  });

  it("gateway returns significance mode for why questions", () => {
    injectObserverTraceEntriesForTestV0(WPRl_TRACE);
    refreshAttentionSedimentFromTraceV0();

    const out = askRhizohKnowledgeGatewayV0({
      question: "Why is WPRL Sports Arena important in Rhizoh?",
      locale: "en"
    });

    expect(out.queryMode).toBe("significance");
    expect(out.significance).not.toBeNull();
    expect(out.answer.explainsObservedBehavior).toBe(true);
    expect(out.answer.text).toContain("Authority:");
    expect(out.answer.text).toContain("Meaning:");
    expect(out.answer.text).toContain("Narrative:");
    expect(out.queriableByExternalLlm).toBe(true);
  });
});
