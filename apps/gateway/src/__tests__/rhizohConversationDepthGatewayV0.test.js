import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveRhizohConversationDepthGatewayV0,
  applyConversationDepthToGenerationV0
} from "../rhizohConversationDepthGatewayV0.js";

describe("resolveRhizohConversationDepthGatewayV0", () => {
  it("resolves explore defaults", () => {
    const d = resolveRhizohConversationDepthGatewayV0({
      conversationMode: "explore",
      depthLevel: 2,
      continuityStrength: 0.5
    });
    assert.equal(d.conversationMode, "explore");
    assert.equal(d.depthLevel, 2);
    assert.equal(d.maxTokensCeiling, 480);
  });

  it("sets needsRecall for high continuity", () => {
    const d = resolveRhizohConversationDepthGatewayV0({
      conversationMode: "debate",
      continuityStrength: 0.8
    });
    assert.equal(d.needsRecall, true);
  });
});

describe("applyConversationDepthToGenerationV0", () => {
  it("replaces maxTokens with depth ceiling", () => {
    const out = applyConversationDepthToGenerationV0(
      { options: { conversationMode: "greet", depthLevel: 1, continuityStrength: 0.3 } },
      { maxTokens: 320, temperature: 0.35, modeDirective: "", generationModeLabel: "STANDARD" }
    );
    assert.equal(out.maxTokens, 200);
    assert.ok(out.modeDirective.includes("GREET"));
    assert.equal(out.conversationDepth.conversationMode, "greet");
  });

  it("passes through when no depth axis", () => {
    const out = applyConversationDepthToGenerationV0(
      { options: { generationMode: "STANDARD" } },
      { maxTokens: 320, temperature: 0.35, modeDirective: "x", generationModeLabel: "STANDARD" }
    );
    assert.equal(out.maxTokens, 320);
    assert.equal(out.conversationDepth, null);
  });
});
