import { describe, expect, it, beforeEach } from "vitest";
import { tryResolveLocalConversationTurnV0 } from "../tryResolveLocalConversationTurnV0.js";
import { RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1 } from "../sovereignWorldMapNodesV0.js";
import { ORCHESTRATOR_ACTION_REGISTRY_V0, RHIZOH_V11_MAP_INTENT_EVENT_V0 } from "../symbyoMapIntentBridgeV0.js";
import { applyUiLanguagePreferenceToOlpV0 } from "../rhizohOutputLanguagePolicyV0.js";
import { persistObserverInviteContextV0, parseObserverInviteTokenV0 } from "../../ingress/observerInviteLandingV0.js";

describe("tryResolveLocalConversationTurnV0", () => {
  beforeEach(() => {
    applyUiLanguagePreferenceToOlpV0("tr", "test");
    sessionStorage.clear();
  });
  it("routes invite onboarding without LLM when session has invite", () => {
    const invite = parseObserverInviteTokenV0("rhizoh_inv_observer_systems_engineer_42");
    persistObserverInviteContextV0({ ...invite, perceptionMode: "explorer" });
    const out = tryResolveLocalConversationTurnV0("tanıştık ne yapabiliriz?", { source: "test" });
    expect(out?.ok).toBe(true);
    expect(out?.llmBypass).toBe(true);
    expect(out?.kind).toBe("observer_invite_onboarding");
    expect(out?.reply).toMatch(/keşif/i);
  });

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

  it("routes paris git to mistral map open without LLM", () => {
    const intents = [];
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, (ev) => intents.push(ev.detail));
    const out = tryResolveLocalConversationTurnV0("paris git", { source: "test" });
    expect(out?.ok).toBe(true);
    expect(out?.llmBypass).toBe(true);
    expect(out?.kind).toBe("MAP_NODE_OPEN");
    expect(out?.reply).toMatch(/Mistral Kulesi açılıyor/);
    expect(intents[0]?.normalizedDecision?.decision).toBe(
      ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_WORKSPACE
    );
  });

  it("routes chess arena voice without LLM", () => {
    const intents = [];
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, (ev) => intents.push(ev.detail));
    const out = tryResolveLocalConversationTurnV0("chess arena'ya geç", { source: "test" });
    expect(out?.ok).toBe(true);
    expect(out?.kind).toBe("MAP_NODE_OPEN");
    expect(out?.reply).toMatch(/Satranç Arenası açılıyor/);
    expect(intents[0]?.normalizedDecision?.decision).toBe(
      ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_CHESS_ARENA
    );
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
