import { describe, expect, it, beforeEach } from "vitest";
import { selectInstantAckV0 } from "../rhizohInstantAckSelectV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohInstantAckSelectV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("returns structured ack bound to OLP render locale", () => {
    const ack = selectInstantAckV0({ intent: "acknowledge" });
    expect(ack.semanticIntent).toBe("acknowledge");
    expect(ack.renderLocale).toBe("en");
    expect(["steady", "adaptive"]).toContain(ack.tone);
    expect(ack.text).toMatch(/okay|got it|tamam/i);
  });

  it("follows OLP when preference changes (cross-session simulate)", () => {
    applyUiLanguagePreferenceToOlpV0("tr", "ui_write");
    const ack = selectInstantAckV0({ intent: "acknowledge" });
    expect(ack.renderLocale).toBe("tr");
    expect(ack.text).toBe("Tamam.");
  });
});
