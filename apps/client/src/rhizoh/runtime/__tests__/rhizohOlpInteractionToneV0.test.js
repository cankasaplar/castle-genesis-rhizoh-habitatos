import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetOlpBehavioralToneForTestV0,
  readOlpInteractionToneV0,
  recordOlpBehavioralTurnV0
} from "../rhizohOlpInteractionToneV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohOlpInteractionToneV0", () => {
  beforeEach(() => {
    __resetOlpBehavioralToneForTestV0();
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("defaults to steady without behavioral history", () => {
    expect(readOlpInteractionToneV0()).toBe("steady");
  });

  it("does not read STT inference for tone", () => {
    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "greet" });
    expect(readOlpInteractionToneV0()).toBe("steady");
  });
});
