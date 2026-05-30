import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import {
  VOICE_ATTENTION_CHANNEL_V0,
  VOICE_ATTENTION_MODE_V0,
  clearVoiceAttentionModeOverrideV0,
  resolveVoiceAttentionContextV0,
  setVoiceAttentionModeOverrideV0
} from "../voiceAttentionContextV0.js";

describe("voiceAttentionContextV0", () => {
  beforeEach(() => clearVoiceAttentionModeOverrideV0());

  it("direct_listen is clean channel", () => {
    const ctx = resolveVoiceAttentionContextV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN
    });
    expect(ctx.channel).toBe(VOICE_ATTENTION_CHANNEL_V0.CLEAN);
    expect(ctx.policyAuthority).toBe("observation_only");
  });

  it("override wins over ambient heuristic", () => {
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN);
    expect(
      resolveVoiceAttentionContextV0({ band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT }).mode
    ).toBe(VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN);
  });
});
