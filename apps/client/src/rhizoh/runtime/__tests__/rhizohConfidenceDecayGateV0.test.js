import { describe, expect, it, beforeEach } from "vitest";
import {
  applyConfidenceDecayGateV0,
  applyReflexEffectivenessFeedbackV0,
  clearConfidenceDecayStateForTestV0,
  inferUserReactionV0,
  USER_REACTION_V0
} from "../rhizohConfidenceDecayGateV0.js";
import { classifyRhizohIntentV0, shouldInvokeRhizohLlmV0 } from "../rhizohIntentRouterV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohConfidenceDecayGateV0", () => {
  beforeEach(() => {
    clearConfidenceDecayStateForTestV0();
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("escalates to LLM after repeated identical utterance", () => {
    const base = {
      routeClass: "micro_social",
      confidence: 0.94,
      useLlm: false,
      useLocal: true,
      reason: "micro_social_fast"
    };
    applyConfidenceDecayGateV0({ normalized: "tamam", basePlan: base });
    applyConfidenceDecayGateV0({ normalized: "tamam", basePlan: base });
    const third = applyConfidenceDecayGateV0({ normalized: "tamam", basePlan: base });
    expect(third.escalateToLlm).toBe(true);
    expect(third.useLlm).toBe(true);
    expect(third.decay.reasons).toContain("repetition_decay");
  });

  it("infers override reaction on exact repeat", () => {
    expect(inferUserReactionV0("tamam", "tamam")).toBe(USER_REACTION_V0.OVERRIDE);
    expect(inferUserReactionV0("peki devam", "tamam")).toBe(USER_REACTION_V0.CONTINUE);
  });

  it("classify + decay blocks LLM for greeting until third identical utterance", () => {
    expect(shouldInvokeRhizohLlmV0(classifyRhizohIntentV0("merhaba"))).toBe(false);
    expect(shouldInvokeRhizohLlmV0(classifyRhizohIntentV0("merhaba"))).toBe(false);
    const plan3 = classifyRhizohIntentV0("merhaba");
    expect(plan3.useLlm || plan3.escalateToLlm).toBe(true);
  });

  it("feedback on repeat marks override before next route", () => {
    classifyRhizohIntentV0("tamam");
    const reaction = applyReflexEffectivenessFeedbackV0("tamam");
    expect(reaction).toBe(USER_REACTION_V0.OVERRIDE);
  });
});
