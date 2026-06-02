import { describe, expect, it } from "vitest";
import {
  pickSpeechVoiceForLocaleV0,
  resolveSpeechBcp47ForUiLocaleV0
} from "../rhizohSpeechLocaleV0.js";

/** @param {string} lang @param {boolean} [isDefault] */
function mockVoice(lang, isDefault = false) {
  return { lang, name: lang, default: isDefault };
}

describe("rhizohSpeechLocaleV0", () => {
  it("maps en UI locale to en-US BCP-47", () => {
    expect(resolveSpeechBcp47ForUiLocaleV0("en")).toBe("en-US");
  });

  it("maps tr UI locale to tr-TR BCP-47", () => {
    expect(resolveSpeechBcp47ForUiLocaleV0("tr")).toBe("tr-TR");
  });

  it("prefers en-US voice over Turkish system default when UI is en", () => {
    const voices = [mockVoice("tr-TR", true), mockVoice("en-US"), mockVoice("en-GB")];
    const picked = pickSpeechVoiceForLocaleV0(voices, "en");
    expect(picked?.lang).toBe("en-US");
  });

  it("uses any en-* before falling back when en-US missing", () => {
    const voices = [mockVoice("tr-TR", true), mockVoice("en-GB")];
    const picked = pickSpeechVoiceForLocaleV0(voices, "en");
    expect(picked?.lang).toBe("en-GB");
  });
});
