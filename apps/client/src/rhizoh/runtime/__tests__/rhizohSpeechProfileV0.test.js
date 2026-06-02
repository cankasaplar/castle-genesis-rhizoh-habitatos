import { describe, expect, it, beforeEach } from "vitest";
import {
  clearRhizohSpeechProfileForTestV0,
  RHIZOH_SPEECH_MODE_V0,
  resolveRhizohSpeechSttLanguageCodeV0,
  writeRhizohSpeechProfileV0
} from "../rhizohSpeechProfileV0.js";
import { clearUiLocalePickedForTestV0, writeUiLocaleV0 } from "../rhizohUiLocaleV0.js";
import { readSttInputLanguageCodeHintV0, __resetOlpStateForTestV0 } from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohSpeechProfileV0", () => {
  beforeEach(() => {
    clearRhizohSpeechProfileForTestV0();
    clearUiLocalePickedForTestV0();
    __resetOlpStateForTestV0();
  });

  it("auto mode yields auto STT hint", () => {
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.AUTO });
    expect(resolveRhizohSpeechSttLanguageCodeV0()).toBe("auto");
    expect(readSttInputLanguageCodeHintV0()).toBe("auto");
  });

  it("mirror mode follows UI locale bcp47", () => {
    writeUiLocaleV0("tr");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    expect(resolveRhizohSpeechSttLanguageCodeV0()).toMatch(/^tr/i);
  });

  it("manual mode uses wheel locale", () => {
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MANUAL, manualLocale: "de" });
    expect(resolveRhizohSpeechSttLanguageCodeV0()).toMatch(/^de/i);
  });
});
