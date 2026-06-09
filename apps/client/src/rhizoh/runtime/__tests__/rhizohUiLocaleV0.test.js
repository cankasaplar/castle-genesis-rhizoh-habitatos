import { describe, expect, it, beforeEach } from "vitest";
import {
  clearUiLocalePickedForTestV0,
  isLanguagePickerRequiredForIngressV0,
  normalizeUiLocaleV0,
  readUiLocaleV0,
  resolveDefaultUiLocaleV0,
  writeUiLocaleV0
} from "../rhizohUiLocaleV0.js";
import { writeRhizohSpeechProfileV0, RHIZOH_SPEECH_MODE_V0, clearRhizohSpeechProfileForTestV0 } from "../rhizohSpeechProfileV0.js";

describe("rhizohUiLocaleV0", () => {
  beforeEach(() => {
    clearUiLocalePickedForTestV0();
    clearRhizohSpeechProfileForTestV0();
  });

  it("normalizeUiLocale falls back to default for unknown codes", () => {
    expect(normalizeUiLocaleV0("xx")).toBe(resolveDefaultUiLocaleV0());
    expect(normalizeUiLocaleV0("zh-cn")).toBe("zh");
  });

  it("writeUiLocale persists launch locale", () => {
    writeUiLocaleV0("fr");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    expect(readUiLocaleV0()).toBe("fr");
    expect(isLanguagePickerRequiredForIngressV0()).toBe(false);
  });

  it("requires ingress picker until contract v2 on product path", () => {
    localStorage.setItem("rhizoh.ui.locale.picked.v1", "1");
    localStorage.setItem("rhizoh.user.language.v0", "en");
    expect(isLanguagePickerRequiredForIngressV0()).toBe(true);
    writeUiLocaleV0("en");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    expect(isLanguagePickerRequiredForIngressV0()).toBe(false);
  });

  it("resolveDefaultUiLocale prefers env when set", () => {
    const orig = import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE;
    import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE = "ja";
    try {
      expect(resolveDefaultUiLocaleV0()).toBe("ja");
    } finally {
      import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE = orig;
    }
  });

  it("readUiLocale prefers explicit env default over navigator when unpicked", () => {
    const orig = import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE;
    import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE = "tr";
    try {
      sessionStorage.clear();
      expect(readUiLocaleV0()).toBe("tr");
    } finally {
      import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE = orig;
      sessionStorage.clear();
    }
  });
});
