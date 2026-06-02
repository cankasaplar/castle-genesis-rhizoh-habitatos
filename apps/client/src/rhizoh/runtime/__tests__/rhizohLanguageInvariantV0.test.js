import { describe, expect, it, beforeEach } from "vitest";
import {
  CASTLE_LANGUAGE_INVARIANT_V0,
  enforceUserVisibleTextLocaleV0,
  readCastleLanguageInvariantV0
} from "../rhizohLanguageInvariantV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohLanguageInvariantV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("exposes global invariant contract", () => {
    const snap = readCastleLanguageInvariantV0();
    expect(snap.invariant.rule).toBe(CASTLE_LANGUAGE_INVARIANT_V0.rule);
    expect(snap.outputLocale).toBe("en");
    expect(snap.invariant.enforcedAt).toContain("instant_ack");
  });

  it("repairs TR instant ack under EN OLP", () => {
    const out = enforceUserVisibleTextLocaleV0("instant_ack", "Tamam, dinliyorum.");
    expect(out.repaired).toBe(true);
    expect(out.text).toMatch(/listening|moment|second/i);
  });
});
