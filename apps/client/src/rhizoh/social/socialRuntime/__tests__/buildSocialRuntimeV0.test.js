import { describe, it, expect } from "vitest";
import { buildSocialRuntimeV0, SOCIAL_RUNTIME_SCHEMA_V0 } from "../buildSocialRuntimeV0.js";

describe("buildSocialRuntimeV0", () => {
  it("attaches schema and persona for Turkish user message", () => {
    const r = buildSocialRuntimeV0({
      nowMs: 1_700_000_000_000,
      userMessage: "Merhaba Rhizoh, nasılsın?",
      navLang: "tr-TR",
      defaultLocale: "tr",
      prevMeta: {},
      routerIntent: "CHAT",
      silenceMode: false,
      layerFocus: 10,
      castlePeerCount: 0,
      hasFirebaseUser: true,
      recentTurns: [{ ts: 1_699_999_000_000, user: "x", assistant: "y" }]
    });
    expect(r.forLlm.schema).toBe(SOCIAL_RUNTIME_SCHEMA_V0);
    expect(r.forLlm.personaId).toBeTruthy();
    expect(r.metaPersist.mode).toBeTruthy();
    expect(typeof r.forLlm.directives.llmBlock).toBe("string");
    expect(r.forLlm.directives.llmBlock).toContain("[SOCIAL_RUNTIME_V0]");
  });

  it("selects interpreter persona for clear English", () => {
    const r = buildSocialRuntimeV0({
      nowMs: 1_700_000_000_000,
      userMessage: "Where is the bathroom please?",
      navLang: "tr-TR",
      defaultLocale: "tr",
      prevMeta: { socialRuntimeV1: { lastDetectedLocale: "tr", mode: "SOCIAL_ACTIVE" } },
      routerIntent: "CHAT",
      silenceMode: false,
      layerFocus: 10,
      castlePeerCount: 0,
      hasFirebaseUser: true,
      recentTurns: []
    });
    expect(r.forLlm.personaId).toBe("RHIZOH_INTERPRETER");
    expect(r.forLlm.respondInLocale).toBe("en");
  });

  it("host surface with peers biases host persona", () => {
    const r = buildSocialRuntimeV0({
      nowMs: 1_700_000_000_000,
      userMessage: "Everyone settle in.",
      navLang: "en-US",
      defaultLocale: "en",
      prevMeta: {},
      routerIntent: "CHAT",
      silenceMode: false,
      layerFocus: 5,
      castlePeerCount: 2,
      hasFirebaseUser: true,
      recentTurns: []
    });
    expect(r.forLlm.mode).toBe("HOST");
    expect(r.forLlm.personaId).toBe("RHIZOH_HOST");
  });
});
