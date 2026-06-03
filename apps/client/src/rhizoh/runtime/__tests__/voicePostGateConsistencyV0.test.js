import { describe, expect, it, beforeEach } from "vitest";
import {
  resolvePostGateCommitmentV0,
  resetPostGateConsistencyMetricsForTestV0
} from "../voicePostGateConsistencyV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";

describe("voicePostGateConsistencyV0", () => {
  beforeEach(() => resetPostGateConsistencyMetricsForTestV0());

  it("never yields directed_rejected when route executionAccepted is true", () => {
    const { commitment, consistency } = resolvePostGateCommitmentV0({
      route: {
        executionAccepted: true,
        sanityAccepted: false,
        observationPass: true,
        reason: "whisper_default_conf"
      },
      turnAcceptance: { accepted: false, reason: "low_confidence" },
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3"
    });
    expect(commitment.commitment).toBe("directed_committed");
    expect(commitment.memoryEligible).toBe(true);
    expect(consistency.policyDivergence).toBe(false);
    expect(consistency.turnRouteMismatch).toBe(true);
  });

  it("dispatchAuthoritative blocks memory when route/turn drift on directed speech", () => {
    const { commitment } = resolvePostGateCommitmentV0({
      route: {
        executionAccepted: true,
        sanityAccepted: false,
        observationPass: true,
        reason: "whisper_default_conf"
      },
      turnAcceptance: { accepted: false, reason: "low_confidence" },
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3",
      gateConfidence: 0.57,
      rawConfidence: 0.55,
      dispatchAuthoritative: true
    });
    expect(commitment.memoryEligible).toBe(false);
    expect(commitment.commitment).toBe("directed_rejected");
  });

  it("yields directed_rejected when route rejects execution", () => {
    const { commitment } = resolvePostGateCommitmentV0({
      route: {
        executionAccepted: false,
        sanityAccepted: true,
        reason: "low_confidence"
      },
      turnAcceptance: { accepted: false, reason: "low_confidence" },
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3"
    });
    expect(commitment.commitment).toBe("directed_rejected");
    expect(commitment.memoryEligible).toBe(false);
  });
});
