import { describe, expect, it, beforeEach } from "vitest";
import { evaluateSttScriptAgainstUiLocaleV0 } from "../sttScriptLocaleGuardV0.js";
import { rescoreVoiceTranscriptAfterMergeV0 } from "../rhizohPostMergeTranscriptRescoreV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohPostMergeTranscriptRescoreV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
  });

  it("flags Persian-script merge as phantom for rescore", () => {
    const fa = "سیزن ایکایی میشه، دوام ایده همیشه این ایکایی؟";
    const scored = rescoreVoiceTranscriptAfterMergeV0({
      text: fa,
      strategy: "split_merged"
    });
    expect(scored.phantomLikely).toBe(true);
    expect(scored.languageHint).toBe("tr");
  });

  it("soft script mismatch for phantom with low VEPM confidence", () => {
    const fa = "سیزن ایکایی میشه، دوام ایده همیشه این ایکایی؟";
    const guard = evaluateSttScriptAgainstUiLocaleV0(fa, {
      strategy: "split_merged",
      phantomLikely: true,
      vepmConfidence: 0.63
    });
    expect(guard.ok).toBe(false);
    expect(guard.softMismatch).toBe(true);
    expect(guard.shadowForward).toBe(true);
  });
});
