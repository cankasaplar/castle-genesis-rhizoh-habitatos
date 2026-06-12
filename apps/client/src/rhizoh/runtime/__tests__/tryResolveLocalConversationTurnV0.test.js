import { describe, expect, it } from "vitest";
import { tryResolveLocalConversationTurnV0 } from "../tryResolveLocalConversationTurnV0.js";

describe("tryResolveLocalConversationTurnV0", () => {
  it("routes kale kur without LLM", () => {
    const events = [];
    window.addEventListener("castle:open-init-gate-v0", () => events.push("gate"));
    const out = tryResolveLocalConversationTurnV0("kale kur", {
      source: "test"
    });
    expect(out?.ok).toBe(true);
    expect(out?.llmBypass).toBe(true);
    expect(out?.reply.length).toBeGreaterThan(3);
    expect(events).toContain("gate");
  });

  it("returns null for open-ended chat", () => {
    expect(tryResolveLocalConversationTurnV0("explain quantum physics briefly")).toBeNull();
  });
});
