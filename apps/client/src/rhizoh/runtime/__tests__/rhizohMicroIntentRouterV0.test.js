import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyMicroIntentFromTextV0,
  MICRO_INTENT_V0,
  tryMicroIntentTextReplyV0
} from "../rhizohMicroIntentRouterV0.js";
import { routeVoiceInputV0, VOICE_ROUTE_EXECUTION_V0 } from "../rhizohVoiceCommandRouterV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohMicroIntentRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("classifies nasılsın as wellbeing", () => {
    const hit = classifyMicroIntentFromTextV0("nasılsın?");
    expect(hit?.id).toBe(MICRO_INTENT_V0.WELLBEING);
  });

  it("classifies merhaba as greeting", () => {
    expect(classifyMicroIntentFromTextV0("merhaba")?.id).toBe(MICRO_INTENT_V0.GREETING);
  });

  it("voice route fast_local for greeting — no LLM", () => {
    const route = routeVoiceInputV0("nasılsın");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL);
    expect(route.microIntent).toBe(MICRO_INTENT_V0.WELLBEING);
  });

  it("text path returns micro reply without llm", () => {
    const out = tryMicroIntentTextReplyV0("tamam");
    expect(out?.llmBypass).toBe(true);
    expect(out?.reply).toMatch(/tamam|anladım|peki/i);
  });

  it("registry command wins over micro ack", () => {
    const route = routeVoiceInputV0("haritayı aç");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
    expect(route.canonical).toBe("map_open");
  });
});
