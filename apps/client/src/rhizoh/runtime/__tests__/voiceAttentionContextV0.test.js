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

  it("direct_listen profile is clean channel with high attention", () => {
    const ctx = resolveVoiceAttentionContextV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN
    });
    expect(ctx.channel).toBe(VOICE_ATTENTION_CHANNEL_V0.CLEAN);
    expect(ctx.attentionWeight).toBeGreaterThan(0.8);
    expect(ctx.directedSpeechRelaxed).toBe(true);
    expect(ctx.memoryWritePolicy).toBe("minimal_delayed");
    expect(ctx.policyAuthority).toBe("observation_only");
  });

  it("moving_context is default when unset", () => {
    const ctx = resolveVoiceAttentionContextV0();
    expect(ctx.mode).toBe(VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT);
    expect(ctx.channel).toBe(VOICE_ATTENTION_CHANNEL_V0.MIXED);
  });

  it("ambient band heuristic suggests observer when no explicit mode", () => {
    const ctx = resolveVoiceAttentionContextV0({
      band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT
    });
    expect(ctx.mode).toBe(VOICE_ATTENTION_MODE_V0.OBSERVER);
    expect(ctx.ambientFilterStrength).toBe("high");
  });

  it("runtime override wins", () => {
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN);
    const ctx = resolveVoiceAttentionContextV0({ band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT });
    expect(ctx.mode).toBe(VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN);
  });
});
