import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  OLP_MODE_V0,
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0,
  buildOutputLanguagePolicyDirectiveV0,
  hydrateOlpFromPersistedPreferenceV0,
  readOutputLanguagePolicyV0,
  resolveOutputLanguageCodeV0,
  readSttInputLanguageCodeHintV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohOutputLanguagePolicyV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("defaults to ui_locked_output with UI locale", () => {
    const olp = readOutputLanguagePolicyV0();
    expect(olp.mode).toBe(OLP_MODE_V0.UI_LOCKED_OUTPUT);
    expect(olp.inputLanguage).toBe("en-US");
  });

  it("forces English output when UI is en even if input detected tr", () => {
    expect(resolveOutputLanguageCodeV0("tr")).toBe("en");
  });

  it("STT hint mirrors UI locale BCP-47 (output policy stays ui_locked)", () => {
    expect(readSttInputLanguageCodeHintV0()).toBe("en-US");
    applyUiLanguagePreferenceToOlpV0("tr", "ui_write");
    expect(readSttInputLanguageCodeHintV0()).toBe("tr-TR");
    expect(resolveOutputLanguageCodeV0("en")).toBe("tr");
  });

  it("VITE_RHIZOH_STT_LANGUAGE overrides UI locale hint", () => {
    vi.stubEnv("VITE_RHIZOH_STT_LANGUAGE", "tr");
    expect(readSttInputLanguageCodeHintV0()).toBe("tr-TR");
    vi.stubEnv("VITE_RHIZOH_STT_LANGUAGE", "auto");
    expect(readSttInputLanguageCodeHintV0()).toBe("auto");
    vi.unstubAllEnvs();
  });

  it("directive mandates output language only", () => {
    const d = buildOutputLanguagePolicyDirectiveV0("tr", 0.9);
    expect(d).toContain("RHIZOH_OUTPUT_LANGUAGE_POLICY_V0");
    expect(d).toMatch(/ONLY in English/i);
    expect(d).toContain("input_detected_locale: tr");
  });

  it("applyUiLanguagePreferenceToOlpV0 owns state without re-reading UI", () => {
    applyUiLanguagePreferenceToOlpV0("en", "ui_write");
    expect(resolveOutputLanguageCodeV0("tr")).toBe("en");
    applyUiLanguagePreferenceToOlpV0("tr", "ui_write");
    expect(resolveOutputLanguageCodeV0("en")).toBe("tr");
  });

  it("persists preference across hydrate (cross-session)", () => {
    applyUiLanguagePreferenceToOlpV0("en", "ui_write");
    localStorage.setItem("rhizoh.user.language.v0", "en");
    __resetOlpStateForTestV0();
    hydrateOlpFromPersistedPreferenceV0();
    expect(resolveOutputLanguageCodeV0("tr")).toBe("en");
  });
});
