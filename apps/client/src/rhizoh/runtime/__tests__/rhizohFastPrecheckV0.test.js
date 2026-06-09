import { describe, expect, it, beforeEach, vi } from "vitest";
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

  it("pipeline runs precheck before intent router when living surface off", () => {
    vi.stubEnv("VITE_RHIZOH_LIVING_CONVERSATION_V1", "0");
    const out = runRhizohSpeechPipelineV0("tamam");
    expect(out.stage).toBe("fast_precheck");
    expect(out.llmBypass).toBe(true);
    vi.unstubAllEnvs();
  });

  it("günaydın and rezo hit instant greeting precheck", () => {
    expect(runFastPrecheckFromTextV0("günaydın")?.intent).toBe("greeting");
    expect(runFastPrecheckFromTextV0("Rezo")?.intent).toBe("greeting");
    expect(runFastPrecheckFromTextV0("Rezo, beni duyabiliyor musun?")?.intent).toBe("hearing_check");
    expect(runFastPrecheckFromTextV0("günaydın rhizoh")?.intent).toBe("greeting");
    expect(runFastPrecheckFromTextV0("rhizoh merhaba beni duyabiliyor musun")?.intent).toBe(
      "hearing_check"
    );
    expect(runFastPrecheckFromTextV0("Nasılsın dostum?")?.intent).toBe("wellbeing");
    expect(runFastPrecheckFromTextV0("Resol, merhaba.")?.intent).toBe("greeting");
    expect(runFastPrecheckFromTextV0("Merhaba Erizo.")?.intent).toBe("greeting");
  });

  it("small talk chat_invite bypasses LLM locally", () => {
    expect(runFastPrecheckFromTextV0("sohbet edelim")?.intent).toBe("chat_invite");
    expect(runFastPrecheckFromTextV0("Neler yapalım, neler yapabiliriz?")?.intent).toBe("chat_invite");
    expect(runFastPrecheckFromTextV0("Şu anda beni duyabiliyor musunuz?")?.intent).toBe("hearing_check");
    expect(runFastPrecheckFromTextV0("Merhaba Yusuf.")?.intent).toBe("greeting");
  });

  it("substantive planning questions bypass chat_invite reflex", () => {
    expect(runFastPrecheckFromTextV0("İstanbul'da neler yapabilirim?")).toBeNull();
    expect(runFastPrecheckFromTextV0("Bu güzel havada neler yapabiliriz?")).toBeNull();
  });

  it("social ack hits guzel sag olun eyvallah", () => {
    expect(runFastPrecheckFromTextV0("Güzel.")?.intent).toBe("social_ack");
    expect(runFastPrecheckFromTextV0("Sağ olun.")?.intent).toBe("social_ack");
    expect(runFastPrecheckFromTextV0("Eyvallah dostum.")?.intent).toBe("social_ack");
  });

  it("answers bugünün tarihi locally without LLM", () => {
    const hit = runFastPrecheckFromTextV0("Bugün bugünün tarihimiz");
    expect(hit?.intent).toBe("date_today");
    expect(hit?.reply).toMatch(/Bugün/i);
    expect(hit?.reply).toMatch(/\d{4}/);
    expect(runFastPrecheckFromTextV0("bugünün tarihini söyler misin")?.intent).toBe("date_today");
  });

  it("pipeline allows shallow greeting precheck when living surface on", () => {
    vi.stubEnv("VITE_RHIZOH_LIVING_CONVERSATION_V1", "1");
    const out = runRhizohSpeechPipelineV0("günaydın");
    expect(out.stage).toBe("fast_precheck");
    expect(out.llmBypass).toBe(true);
    vi.unstubAllEnvs();
  });
});
