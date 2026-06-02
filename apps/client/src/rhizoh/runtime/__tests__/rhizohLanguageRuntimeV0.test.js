import { describe, expect, it, afterEach, beforeEach } from "vitest";
import {
  __resetVoiceLanguageLockForTestV0,
  beginVoiceSessionLanguageLockV0
} from "../rhizohConversationLanguageV0.js";
import { buildRhizohLanguageRuntimeSnapshotV0 } from "../rhizohLanguageRuntimeV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohLanguageRuntimeV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  afterEach(() => {
    __resetVoiceLanguageLockForTestV0();
  });

  it("separates ui presentation from stt auto and olp output", () => {
    beginVoiceSessionLanguageLockV0({ locale: "en", sessionId: "s1" });
    const snap = buildRhizohLanguageRuntimeSnapshotV0({ sttInferred: "tr" });
    expect(snap.ui.role).toBe("presentation_only");
    expect(snap.stt.inputHint).toBe("auto");
    expect(snap.stt.inferred).toBe("tr");
    expect(snap.olp.outputLocale).toBe("en");
    expect(snap.tts.voiceLocale).toBe("en");
  });
});
