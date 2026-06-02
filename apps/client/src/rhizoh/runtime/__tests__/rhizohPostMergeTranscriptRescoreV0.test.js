import { describe, expect, it, beforeEach } from "vitest";
import {
  rescoreVoiceTranscriptAfterMergeV0,
  shouldSkipLanguageInferenceForTranscriptV0
} from "../rhizohPostMergeTranscriptRescoreV0.js";
import { evaluateSttScriptAgainstUiLocaleV0 } from "../sttScriptLocaleGuardV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohPostMergeTranscriptRescoreV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
  });

  it("skips language inference for high-entropy RTL split merge at low confidence", () => {
    const fa = "سیزن ایکایی میشه، دوام ایده همیشه این ایکایی؟";
    const skip = shouldSkipLanguageInferenceForTranscriptV0({
      text: fa,
      strategy: "split_merged",
      confidence: 0.55,
      maxRms: 0.016
    });
    expect(skip.skip).toBe(true);
    expect(skip.reasons.length).toBeGreaterThan(0);

    const scored = rescoreVoiceTranscriptAfterMergeV0({
      text: fa,
      strategy: "split_merged",
      confidence: 0.55,
      maxRms: 0.016
    });
    expect(scored.skipLanguageInference).toBe(true);
    expect(scored.detectedLocale).toBeUndefined();
    expect(scored.phantomLikely).toBe(true);
  });

  it("does not skip when Arabic greeting remaps to merhaba", () => {
    const skip = shouldSkipLanguageInferenceForTranscriptV0({
      text: "مرحبا",
      strategy: "split_merged",
      confidence: 0.55,
      maxRms: 0.04
    });
    expect(skip.skip).toBe(false);
    expect(skip.crossScriptRemap).toBe(true);
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
