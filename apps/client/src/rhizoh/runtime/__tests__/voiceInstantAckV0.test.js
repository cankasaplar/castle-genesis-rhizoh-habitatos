import { describe, expect, it, vi, afterEach } from "vitest";
import {
  awaitVoiceInstantAckReleaseV0,
  isVoiceInstantAckPlayingV0,
  markVoiceTurnDispatchV0,
  pickVoiceInstantAckPhraseV0,
  resetVoiceInstantAckForTestV0,
  VOICE_INSTANT_ACK_SCHEMA
} from "../voiceInstantAckV0.js";

describe("voiceInstantAckV0", () => {
  afterEach(() => {
    resetVoiceInstantAckForTestV0();
    vi.useRealTimers();
  });

  it("picks a Turkish ack phrase", () => {
    expect(pickVoiceInstantAckPhraseV0().length).toBeGreaterThan(4);
  });

  it("resolves release immediately when ack idle", async () => {
    const r = await awaitVoiceInstantAckReleaseV0();
    expect(r.reason).toBe("idle");
    expect(isVoiceInstantAckPlayingV0()).toBe(false);
  });

  it("schema constant", () => {
    markVoiceTurnDispatchV0(1);
    expect(VOICE_INSTANT_ACK_SCHEMA).toContain("instant_ack");
  });
});
