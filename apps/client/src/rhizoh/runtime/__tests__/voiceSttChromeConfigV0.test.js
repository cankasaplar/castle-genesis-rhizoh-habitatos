import { describe, expect, it } from "vitest";
import {
  planVoiceSttNoSpeechRetryV0,
  resolveVoiceSttContinuousV0,
  resolveVoiceSttLangV0,
  VOICE_STT_LANG_FALLBACK,
  VOICE_STT_LANG_PRIMARY,
  VOICE_STT_NO_SPEECH_RETRY_MAX
} from "../voiceSttChromeConfigV0.js";

describe("voiceSttChromeConfigV0", () => {
  it("uses continuous mode for keepAlive loop", () => {
    expect(resolveVoiceSttContinuousV0(true)).toBe(true);
    expect(resolveVoiceSttContinuousV0(false)).toBe(false);
  });

  it("falls back to en-US after primary tr-TR attempts", () => {
    expect(resolveVoiceSttLangV0({ langAttempt: 0 })).toBe(VOICE_STT_LANG_PRIMARY);
    expect(resolveVoiceSttLangV0({ langAttempt: 1 })).toBe(VOICE_STT_LANG_FALLBACK);
  });

  it("plans no-speech retry with jitter and lang fallback", () => {
    const first = planVoiceSttNoSpeechRetryV0({ retryCount: 0, keepAlive: true });
    expect(first.ok).toBe(true);
    expect(first.nextRetryCount).toBe(1);
    expect(first.langAttempt).toBe(0);
    expect(first.delayMs).toBeGreaterThanOrEqual(220);
    expect(first.delayMs).toBeLessThanOrEqual(420);

    const third = planVoiceSttNoSpeechRetryV0({ retryCount: 1, keepAlive: true });
    expect(third.ok).toBe(true);
    expect(third.langAttempt).toBe(1);

    const max = planVoiceSttNoSpeechRetryV0({
      retryCount: VOICE_STT_NO_SPEECH_RETRY_MAX,
      keepAlive: true
    });
    expect(max.ok).toBe(false);
  });
});
