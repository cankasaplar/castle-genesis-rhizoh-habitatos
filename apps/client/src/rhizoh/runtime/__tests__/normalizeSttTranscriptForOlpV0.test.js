import { describe, expect, it, beforeEach } from "vitest";
import { normalizeSttTranscriptForOlpV0 } from "../normalizeSttTranscriptForOlpV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("normalizeSttTranscriptForOlpV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("strips trailing locale tag artifacts", () => {
    const out = normalizeSttTranscriptForOlpV0("İstanbul hava durumu nasıl? [lang:tr]");
    expect(out.text).toBe("İstanbul hava durumu nasıl?");
    expect(out.neutralized).toBe(true);
  });

  it("records inferred hint without changing OLP output locale", () => {
    const out = normalizeSttTranscriptForOlpV0("İstanbul hava durumu nasıl?");
    expect(out.inferredInputLocale).toBe("tr");
    expect(out.hintObservation.outputLocale).toBe("en");
  });
});
