import { describe, expect, it } from "vitest";
import { tryResolveLocalConversationTurnV0 } from "../tryResolveLocalConversationTurnV0.js";
import { RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1 } from "../sovereignWorldMapNodesV0.js";

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

  it("routes paris git voice warp without LLM", () => {
    const warps = [];
    window.addEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, (ev) => warps.push(ev.detail));
    const out = tryResolveLocalConversationTurnV0("paris git", { source: "test" });
    expect(out?.ok).toBe(true);
    expect(out?.llmBypass).toBe(true);
    expect(out?.kind).toBe("VOICE_WARP");
    expect(warps[0]?.name).toContain("Mistral");
  });

  it("routes yayın aç to media tube without LLM", () => {
    const media = [];
    window.addEventListener("RHIZOH_OPEN_MEDIA_TUBE", (ev) => media.push(ev.detail));
    const out = tryResolveLocalConversationTurnV0("yayın aç", { source: "test" });
    expect(out?.ok).toBe(true);
    expect(out?.llmBypass).toBe(true);
    expect(out?.kind).toBe("MEDIA_OPEN");
    expect(media[0]?.title).toMatch(/Kuantum|Quantum/i);
  });

  it("returns null for open-ended chat", () => {
    expect(tryResolveLocalConversationTurnV0("explain quantum physics briefly")).toBeNull();
  });
});
