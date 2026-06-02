import { describe, expect, it, beforeEach } from "vitest";
import {
  runFastPrecheckFromTextV0,
  normalizeForFastPrecheckV0
} from "../rhizohFastPrecheckV0.js";
import { runRhizohSpeechPipelineV0 } from "../rhizohSpeechPipelineV0.js";
import { clearMicroPatternMemoryForTestV0, recordHotPhraseV0 } from "../rhizohMicroPatternMemoryV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohFastPrecheckV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    clearMicroPatternMemoryForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("exact map hits nasılsın in O(1)", () => {
    const n = normalizeForFastPrecheckV0("nasılsın?");
    expect(n).toBe("nasılsın");
    const hit = runFastPrecheckFromTextV0("nasılsın?");
    expect(hit?.source).toBe("exact_map");
    expect(hit?.reply).toMatch(/İyiyim|iyiyim/i);
    expect(hit?.latencyMs).toBeLessThan(20);
  });

  it("hot phrase memory serves learned exact phrase", () => {
    const n = normalizeForFastPrecheckV0("iyi geceler");
    recordHotPhraseV0(n, "tr", "greeting", "İyi geceler — buradayım.");
    const hit = runFastPrecheckFromTextV0("iyi geceler");
    expect(hit?.source).toBe("hot_phrase_memory");
    expect(hit?.reply).toBe("İyi geceler — buradayım.");
  });

  it("pipeline runs precheck before intent router", () => {
    const out = runRhizohSpeechPipelineV0("tamam");
    expect(out.stage).toBe("fast_precheck");
    expect(out.llmBypass).toBe(true);
  });
});
