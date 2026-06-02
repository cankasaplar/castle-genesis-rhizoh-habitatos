import { describe, expect, it, beforeEach } from "vitest";
import {
  clearUiLocalePickedForTestV0,
  isLanguagePickerRequiredForIngressV0,
  normalizeUiLocaleV0,
  readUiLocaleV0,
  resolveDefaultUiLocaleV0,
  writeUiLocaleV0
} from "../rhizohUiLocaleV0.js";

describe("rhizohUiLocaleV0", () => {
  beforeEach(() => {
    clearUiLocalePickedForTestV0();
  });

  it("normalizeUiLocale falls back to default for unknown codes", () => {
    expect(normalizeUiLocaleV0("xx")).toBe(resolveDefaultUiLocaleV0());
    expect(normalizeUiLocaleV0("zh-cn")).toBe("zh");
  });

  it("writeUiLocale persists launch locale", () => {
    writeUiLocaleV0("fr");
    expect(readUiLocaleV0()).toBe("fr");
    expect(isLanguagePickerRequiredForIngressV0()).toBe(false);
  });

  it("requires ingress picker until contract v2 on product path", () => {
    localStorage.setItem("rhizoh.ui.locale.picked.v1", "1");
    localStorage.setItem("rhizoh.user.language.v0", "en");
    expect(isLanguagePickerRequiredForIngressV0()).toBe(true);
    writeUiLocaleV0("en");
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
});
