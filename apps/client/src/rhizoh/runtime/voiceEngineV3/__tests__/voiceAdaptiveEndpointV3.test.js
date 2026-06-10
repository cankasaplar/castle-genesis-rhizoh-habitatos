import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  attachAdaptiveRecordingEndpointV3,
  resolveVoiceMaxRecordMsV3,
  VOICE_V3_MAX_RECORD_MS_COMPANION_V3
} from "../voiceAdaptiveEndpointV3.js";

describe("voiceAdaptiveEndpointV3", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("companion max record is shorter than legacy 8s cap", () => {
    vi.stubEnv("VITE_RHIZOH_VOICE_OPERATING_MODE", "companion");
    expect(resolveVoiceMaxRecordMsV3()).toBe(VOICE_V3_MAX_RECORD_MS_COMPANION_V3);
    vi.unstubAllEnvs();
  });

  it("fires endpoint after speech then trailing silence", () => {
    let elapsed = 0;
    let rms = 0.04;
    const hits = [];
    const monitor = attachAdaptiveRecordingEndpointV3({
      profile: {
        pollMs: 100,
        minRecordMs: 600,
        minSpeechMs: 300,
        trailingSilenceMs: 500,
        speechRmsFloor: 0.012,
        speechRmsMultiplier: 2.4,
        silenceRmsMultiplier: 1.65
      },
      getElapsedMs: () => elapsed,
      getLastRms: () => rms,
      onEndpoint: (detail) => hits.push(detail)
    });

    for (let i = 0; i < 8; i += 1) {
      elapsed += 100;
      vi.advanceTimersByTime(100);
    }
    expect(hits.length).toBe(0);

    for (let i = 0; i < 4; i += 1) {
      elapsed += 100;
      vi.advanceTimersByTime(100);
    }

    rms = 0.004;
    for (let i = 0; i < 8; i += 1) {
      elapsed += 100;
      vi.advanceTimersByTime(100);
    }

    expect(hits.length).toBe(1);
    expect(hits[0].reason).toBe("trailing_silence");
    monitor.stop();
  });

  it("does not endpoint early when peak energy never reached speech floor", () => {
    let elapsed = 0;
    const hits = [];
    const monitor = attachAdaptiveRecordingEndpointV3({
      profile: {
        pollMs: 100,
        minRecordMs: 600,
        minSpeechMs: 300,
        trailingSilenceMs: 500,
        speechRmsFloor: 0.012,
        speechRmsMultiplier: 2.4,
        silenceRmsMultiplier: 1.65
      },
      getElapsedMs: () => elapsed,
      getLastRms: () => 0.004,
      getMaxRms: () => 0.004,
      onEndpoint: (detail) => hits.push(detail)
    });

    for (let i = 0; i < 20; i += 1) {
      elapsed += 100;
      vi.advanceTimersByTime(100);
    }

    expect(hits.length).toBe(0);
    monitor.stop();
  });
});
