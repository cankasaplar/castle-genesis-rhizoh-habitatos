import { describe, expect, it, beforeEach } from "vitest";
import { routeVoiceInputV0, VOICE_ROUTE_EXECUTION_V0 } from "../rhizohVoiceCommandRouterV0.js";
import { buildHybridLlmConfirmDirectiveV0 } from "../rhizohHybridVoiceExecutionV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohHybridVoiceExecutionV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("routes state query to hybrid_local_first", () => {
    const route = routeVoiceInputV0("what is my current state");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST);
    expect(route.hybridPhases).toContain("llm_confirm");
  });

  it("hybrid LLM directive forbids re-execution", () => {
    const d = buildHybridLlmConfirmDirectiveV0({ schema: "test" }, "what is my state");
    expect(d).toContain("HYBRID_LLM_CONFIRM_V0");
    expect(d).toMatch(/Do NOT re-execute/i);
  });
});
