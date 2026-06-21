import { describe, expect, it, beforeEach } from "vitest";
import {
  isObserverInviteOnboardingQuestionV0,
  tryResolveObserverInviteOnboardingV0
} from "../observerInviteOnboardingV0.js";
import { persistObserverInviteContextV0 } from "../observerInviteLandingV0.js";
import { parseObserverInviteTokenV0 } from "../observerInviteLandingV0.js";
import { applyUiLanguagePreferenceToOlpV0 } from "../../runtime/rhizohOutputLanguagePolicyV0.js";

describe("observerInviteOnboardingV0", () => {
  beforeEach(() => {
    applyUiLanguagePreferenceToOlpV0("tr", "test");
    sessionStorage.clear();
    window.__CASTLE_NEXUS_GEO__ = undefined;
    window.localStorage.clear();
  });

  it("detects onboarding questions", () => {
    expect(isObserverInviteOnboardingQuestionV0("tanıştık, ne yapabiliriz?")).toBe(true);
    expect(isObserverInviteOnboardingQuestionV0("what can we do")).toBe(true);
    expect(isObserverInviteOnboardingQuestionV0("explain quantum physics")).toBe(false);
  });

  it("returns null without invite context", () => {
    expect(tryResolveObserverInviteOnboardingV0("ne yapabiliriz")).toBeNull();
  });

  it("returns mode-specific guidance for explorer invite", () => {
    const invite = parseObserverInviteTokenV0("rhizoh_inv_observer_systems_engineer_42");
    persistObserverInviteContextV0({ ...invite, perceptionMode: "explorer" });

    const out = tryResolveObserverInviteOnboardingV0("tanıştık ne yapabiliriz?");
    expect(out?.source).toBe("observer_invite_onboarding");
    expect(out?.perceptionMode).toBe("explorer");
    expect(out?.reply).toMatch(/keşif|explorer/i);
    expect(out?.reply).toMatch(/kale kur|castle/i);
  });

  it("mentions research mode for reviewer invite", () => {
    const invite = parseObserverInviteTokenV0("rhizoh_inv_review_human_explorer_82079");
    persistObserverInviteContextV0({ ...invite, perceptionMode: "research" });

    const out = tryResolveObserverInviteOnboardingV0("what can we do?");
    expect(out?.perceptionMode).toBe("research");
    expect(out?.reply).toMatch(/research|araştırma/i);
  });
});
