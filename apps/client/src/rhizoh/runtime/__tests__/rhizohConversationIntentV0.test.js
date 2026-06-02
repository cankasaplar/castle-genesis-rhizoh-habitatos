import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyRhizohInputClassV0,
  RHIZOH_INPUT_CLASS_V0
} from "../rhizohConversationIntentV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohConversationIntentV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "tr");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("classifies map command as COMMAND", () => {
    const snap = classifyRhizohInputClassV0("haritayı aç");
    expect(snap.class).toBe(RHIZOH_INPUT_CLASS_V0.COMMAND);
    expect(snap.suppressInstantAck).toBe(true);
  });

  it("classifies long monologue as NARRATIVE", () => {
    const long = "Dün ".repeat(80);
    const snap = classifyRhizohInputClassV0(long);
    expect(snap.class).toBe(RHIZOH_INPUT_CLASS_V0.NARRATIVE);
  });

  it("classifies short chat as DIALOGUE", () => {
    const snap = classifyRhizohInputClassV0("Merhaba Rhizoh nasılsın");
    expect(snap.class).toBe(RHIZOH_INPUT_CLASS_V0.DIALOGUE);
  });
});
