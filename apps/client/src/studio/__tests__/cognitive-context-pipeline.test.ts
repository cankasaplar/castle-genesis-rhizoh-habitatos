import { describe, expect, it } from "vitest";
import { parseAgentBridgeResponse } from "../runtime/agentBridge";
import { buildRhizohMemoryContextPack } from "../runtime/contextBuilder";
import { composeRhizohLlmPrompt } from "../runtime/promptComposer";
import { buildRhizohMemoryContextPackWithSalience, withSalience } from "../runtime/salienceScorer";
import { createInitialStudioKernelState } from "../store/initialState";

describe("cognitive context pipeline (v0)", () => {
  it("buildRhizohMemoryContextPack is pure and shaped", () => {
    const s = createInitialStudioKernelState();
    const pack = buildRhizohMemoryContextPack(s, { episodicClipLimit: 4 });
    expect(Array.isArray(pack.episodicClipIds)).toBe(true);
    expect(pack.roomDigestByRoomUid).toBeDefined();
    expect(pack.regionDigestByRegionUid).toBeDefined();
    expect(pack.salienceWeights).toBeUndefined();
  });

  it("withSalience + composeRhizohLlmPrompt run without throw", () => {
    const s = createInitialStudioKernelState();
    const base = buildRhizohMemoryContextPack(s);
    const scored = buildRhizohMemoryContextPackWithSalience(s);
    expect(scored.salienceWeights?.episodic).toBeDefined();
    const manual = withSalience(base, { episodic: 0.5, social: 0.9 });
    const prompt = composeRhizohLlmPrompt(manual, "test goal");
    expect(prompt.system.length).toBeGreaterThan(20);
    expect(prompt.user).toContain("USER_GOAL: test goal");
  });

  it("parseAgentBridgeResponse accepts wrapped intents", () => {
    const raw = JSON.stringify({
      intents: [
        { toolId: "noop", payload: { x: 1 }, confidence: 0.9, rationale: "ok" },
        { toolId: "bad" }
      ]
    });
    const r = parseAgentBridgeResponse(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.intents.length).toBe(1);
      expect(r.intents[0].toolId).toBe("noop");
    }
  });

  it("parseAgentBridgeResponse accepts fenced json", () => {
    const r = parseAgentBridgeResponse(
      "```json\n" + JSON.stringify([{ toolId: "t1", payload: {} }]) + "\n```"
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intents[0].toolId).toBe("t1");
  });

  it("parseAgentBridgeResponse reads attentionFocus", () => {
    const r = parseAgentBridgeResponse(
      JSON.stringify({
        intents: [{ toolId: "a", payload: {}, attentionFocus: "social", confidence: 0.8 }]
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intents[0].attentionFocus).toBe("social");
  });
});
