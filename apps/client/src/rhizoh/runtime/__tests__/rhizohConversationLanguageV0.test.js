import { describe, expect, it, afterEach, beforeEach } from "vitest";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";
import {
  __resetVoiceLanguageLockForTestV0,
  beginVoiceSessionLanguageLockV0,
  pickVoiceInstantAckPhraseV0,
  readSttLanguageCodeHintV0,
  readVoiceLanguageLockV0,
  recordSttInferredLanguageHintV0,
  voiceSttEmptyPromptForConversationV0
} from "../rhizohConversationLanguageV0.js";

describe("rhizohConversationLanguageV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  afterEach(() => {
    __resetVoiceLanguageLockForTestV0();
  });

  it("locks voice output locale at session begin", () => {
    beginVoiceSessionLanguageLockV0({ locale: "en", sessionId: "s1" });
    expect(readVoiceLanguageLockV0()).toBe("en");
    expect(readSttLanguageCodeHintV0()).toBe("en-US");
  });

  it("STT hint records inference without changing output policy locale", () => {
    beginVoiceSessionLanguageLockV0({ locale: "en" });
    const obs = recordSttInferredLanguageHintV0("tr");
    expect(obs.hint).toBe("tr");
    expect(obs.outputLocale).toBe("en");
    expect(readSttLanguageCodeHintV0()).toBe("en-US");
  });

  it("instant ack phrases follow locked locale", () => {
    beginVoiceSessionLanguageLockV0({ locale: "en" });
    const phrase = pickVoiceInstantAckPhraseV0();
    expect(phrase).toMatch(/listening|moment|second/i);
  });

  it("empty STT prompts use conversation locale not hardcoded TR", () => {
    const en = voiceSttEmptyPromptForConversationV0("retry", "en");
    const tr = voiceSttEmptyPromptForConversationV0("retry", "tr");
    expect(en).toMatch(/speech detected/i);
    expect(tr).toMatch(/Ses algılanmadı/);
  });
});
