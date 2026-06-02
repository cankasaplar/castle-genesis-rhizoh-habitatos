import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateSttScriptAgainstUiLocaleV0,
  measureArabicScriptRatioV0
} from "../sttScriptLocaleGuardV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("sttScriptLocaleGuardV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
  });

  it("flags Persian-script Whisper garbage for Turkish UI", () => {
    const fa = "سیزن ایکایی میشه، دوام ایده همیشه این ایکایی؟";
    expect(measureArabicScriptRatioV0(fa)).toBeGreaterThan(0.5);
    const guard = evaluateSttScriptAgainstUiLocaleV0(fa);
    expect(guard.ok).toBe(false);
    expect(guard.reason).toBe("script_locale_mismatch");
  });

  it("allows Turkish transcript", () => {
    const guard = evaluateSttScriptAgainstUiLocaleV0("Merhaba Rhizoh haritayı aç");
    expect(guard.ok).toBe(true);
  });

  it("allows Latin Turkish at ~0.6 Whisper confidence when script ratio is soft", () => {
    const guard = evaluateSttScriptAgainstUiLocaleV0("merhaba nasılsın bugün", {
      confidence: 0.6,
      sttLanguageHint: "tr"
    });
    expect(guard.ok).toBe(true);
    expect(["script", "semantic", "lang_only"]).toContain(guard.passMode);
  });

  it("allows Arabic-script marhaba remapped to Turkish Latin", () => {
    const guard = evaluateSttScriptAgainstUiLocaleV0("مرحبا مرحبا مرحبا مرحبا");
    expect(guard.ok).toBe(true);
    expect(guard.crossScriptRemap).toBe(true);
    expect(guard.normalizedText).toBe("merhaba");
  });

  it("rejects Persian script with soft mismatch when flagged phantom", () => {
    const fa = "سیزن ایکایی میشه، دوام ایده همیشه این ایکایی؟";
    const guard = evaluateSttScriptAgainstUiLocaleV0(fa, {
      confidence: 0.62,
      sttLanguageHint: "tr",
      phantomLikely: true,
      vepmConfidence: 0.63
    });
    expect(guard.ok).toBe(false);
    expect(guard.softMismatch).toBe(true);
  });
});
