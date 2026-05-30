import { describe, expect, it } from "vitest";
import {
  evaluateVoiceCommitmentFromBandV0,
  finalizeVoiceBehavioralCommitmentV0,
  shouldDispatchVoiceToLlmV0
} from "../voiceBehavioralCommitmentV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";

describe("voiceBehavioralCommitmentV0", () => {
  it("ambient is observe-only — no memory or behavior", () => {
    const pre = evaluateVoiceCommitmentFromBandV0(VOICE_DIRECTED_SPEECH_BAND.AMBIENT, {
      source: "mic_v3"
    });
    expect(pre.memoryEligible).toBe(false);
    expect(pre.behaviorEligible).toBe(false);
    expect(shouldDispatchVoiceToLlmV0(pre, { sanityAccepted: true })).toBe(false);

    const fin = finalizeVoiceBehavioralCommitmentV0({
      band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
      source: "mic_v3",
      sanityAccepted: true,
      turnAccepted: true
    });
    expect(fin.memoryEligible).toBe(false);
    expect(fin.behaviorEligible).toBe(false);
    expect(fin.turnCounts).toBe(false);
  });

  it("unknown is statistics-only until gate passes", () => {
    const pre = evaluateVoiceCommitmentFromBandV0(VOICE_DIRECTED_SPEECH_BAND.UNKNOWN, {
      source: "mic"
    });
    expect(pre.memoryEligible).toBe(false);
    expect(shouldDispatchVoiceToLlmV0(pre, { sanityAccepted: true })).toBe(true);

    const rejected = finalizeVoiceBehavioralCommitmentV0({
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      source: "mic",
      sanityAccepted: true,
      turnAccepted: false,
      turnReason: "low_confidence"
    });
    expect(rejected.memoryEligible).toBe(false);
    expect(rejected.behaviorEligible).toBe(false);

    const ok = finalizeVoiceBehavioralCommitmentV0({
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      source: "mic",
      sanityAccepted: true,
      turnAccepted: true
    });
    expect(ok.memoryEligible).toBe(false);
    expect(ok.behaviorEligible).toBe(true);
    expect(ok.turnCounts).toBe(true);
  });

  it("directed_candidate commits only after sanity + turn gate", () => {
    const pre = evaluateVoiceCommitmentFromBandV0(VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE, {
      source: "mic_v3"
    });
    expect(pre.behaviorMode).toBe("after_gate");

    const fin = finalizeVoiceBehavioralCommitmentV0({
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3",
      sanityAccepted: true,
      turnAccepted: true
    });
    expect(fin.memoryEligible).toBe(true);
    expect(fin.behaviorEligible).toBe(true);
    expect(fin.turnCounts).toBe(true);
  });
});
