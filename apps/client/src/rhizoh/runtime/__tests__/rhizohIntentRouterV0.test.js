import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyRhizohIntentV0,
  INTENT_ROUTE_CLASS_V0,
  LLM_FALLBACK_CONFIDENCE_MIN_V0,
  shouldInvokeRhizohLlmV0
} from "../rhizohIntentRouterV0.js";
import { tryLocalReflexReplyV0 } from "../rhizohLocalReflexLayerV0.js";
import {
  clearMicroPatternMemoryForTestV0,
  recordMicroReplyPatternV0,
  pickMicroReplyWithMemoryV0
} from "../rhizohMicroPatternMemoryV0.js";
import { MICRO_INTENT_V0 } from "../rhizohMicroIntentRouterV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohIntentRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    clearMicroPatternMemoryForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("nasılsın → greeting/micro_social, no LLM", () => {
    const plan = classifyRhizohIntentV0("nasılsın?");
    expect(plan.useLlm).toBe(false);
    expect(plan.routeClass).toBe(INTENT_ROUTE_CLASS_V0.MICRO_SOCIAL);
    expect(shouldInvokeRhizohLlmV0(plan)).toBe(false);
  });

  it("deep question → LLM fallback", () => {
    const plan = classifyRhizohIntentV0("bana uzun bir hikaye anlat ve açıkla");
    expect(plan.useLlm).toBe(true);
    expect(plan.routeClass).toBe(INTENT_ROUTE_CLASS_V0.QUESTION);
  });

  it("haritayı aç → command, no LLM", () => {
    const plan = classifyRhizohIntentV0("haritayı aç");
    expect(plan.routeClass).toBe(INTENT_ROUTE_CLASS_V0.COMMAND);
    expect(plan.useLlm).toBe(false);
  });

  it("pattern memory prefers learned reply", () => {
    recordMicroReplyPatternV0(MICRO_INTENT_V0.GREETING, "tr", "Selam — buradayım.");
    recordMicroReplyPatternV0(MICRO_INTENT_V0.GREETING, "tr", "Selam — buradayım.");
    const picked = pickMicroReplyWithMemoryV0(MICRO_INTENT_V0.GREETING, "tr", [
      "Merhaba.",
      "Selam — buradayım.",
      "Hey, hazırım."
    ]);
    expect(picked).toBe("Selam — buradayım.");
  });

  it("local reflex returns reply under confidence threshold", () => {
    const out = tryLocalReflexReplyV0("merhaba");
    expect(out?.llmBypass).toBe(true);
    expect(out?.reply).toBeTruthy();
    expect(out?.confidence).toBeGreaterThan(LLM_FALLBACK_CONFIDENCE_MIN_V0);
  });
});
