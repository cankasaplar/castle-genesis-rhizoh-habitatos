import { describe, expect, it, beforeEach } from "vitest";
import {
  runVoiceTranscriptWitnessPipelineV0,
  runVoiceTurnGateAfterWitnessV0,
  witnessRawVoiceTranscriptV0,
  resetVoiceWitnessPipelineForTestV0
} from "../voiceTranscriptWitnessPipelineV0.js";
import { resetVoiceObservationShadowForTestV0 } from "../voiceObservationShadowV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import { resetRhizohRelationshipKernelForTestV0 } from "../rhizohRelationshipKernelV0.js";

describe("voiceTranscriptWitnessPipelineV0", () => {
  beforeEach(() => {
    resetVoiceWitnessPipelineForTestV0();
    resetVoiceObservationShadowForTestV0();
    resetRhizohRelationshipKernelForTestV0();
  });

  it("witnesses before sanity reject (ambient TV)", () => {
    const pipe = runVoiceTranscriptWitnessPipelineV0({
      text: "Herkese iyi geceler.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      stage: "test_raw",
      runTurnGate: false
    });
    expect(pipe.witnessed.observation.band).toBe(VOICE_DIRECTED_SPEECH_BAND.AMBIENT);
    expect(pipe.route.executionAccepted).toBe(false);
    expect(pipe.sane.reason).toBe("whisper_default_conf");
  });

  it("runs turn gate after witness when runTurnGate true", () => {
    const pipe = runVoiceTranscriptWitnessPipelineV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      strategy: "whisper_only",
      source: "mic_v3",
      stage: "test_full",
      runTurnGate: true
    });
    expect(pipe.witnessed.observation.band).toBe(VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE);
    expect(pipe.turnAcceptance?.accepted).toBe(true);
  });

  it("runVoiceTurnGateAfterWitness does not re-witness raw", () => {
    const witnessed = witnessRawVoiceTranscriptV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      source: "mic_v3",
      stage: "v3_orchestrator_raw"
    });
    const turn = runVoiceTurnGateAfterWitnessV0(witnessed, {
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      strategy: "whisper_only",
      source: "mic_v3"
    });
    expect(turn.accepted).toBe(true);
  });
});
