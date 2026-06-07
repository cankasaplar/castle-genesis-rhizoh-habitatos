import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetEmergencySignalLayerForTestV0,
  computeEmergencyRiskScoreV0,
  EMERGENCY_EVENT_KIND_V0,
  evaluateEmergencyOnPulseV0,
  getEmergencySignalsSnapshotV0,
  ingestVoiceSessionForEmergencyV0,
  noteAcousticSampleV0,
  notePartialTranscriptForEmergencyV0,
  noteBehavioralMarkerV0
} from "../rhizohEmergencySignalLayerV0.js";
import { transitionContinuityStateV0, CONTINUITY_STATE_V0 } from "../rhizohContinuityKernelV0.js";

describe("rhizohEmergencySignalLayerV0", () => {
  beforeEach(() => {
    __resetEmergencySignalLayerForTestV0();
    transitionContinuityStateV0(CONTINUITY_STATE_V0.IDLE);
  });

  it("detects fuzzy emergency keyword on partial transcript", () => {
    const ev = notePartialTranscriptForEmergencyV0({ text: "yar... imda...", confidence: 0.4 });
    expect(ev?.event).toBe(EMERGENCY_EVENT_KIND_V0.EMERGENCY_KEYWORD_MATCH);
    expect(ev?.confidence).toBeGreaterThan(0.5);
  });

  it("computes risk score from audio + keyword + behavior", () => {
    noteAcousticSampleV0({ maxRms: 0.19, recordedMs: 4000 });
    notePartialTranscriptForEmergencyV0({ text: "yardım edin", confidence: 0.5 });
    noteBehavioralMarkerV0({ kind: "mic_restart", context: "v3_shadow_drop" });
    noteBehavioralMarkerV0({ kind: "stt_shadow_drop", context: "fast_noise_drop" });
    noteBehavioralMarkerV0({ kind: "mic_restart", context: "v3_shadow_drop" });

    const risk = computeEmergencyRiskScoreV0();
    expect(risk.riskScore).toBeGreaterThan(0.75);
    expect(risk.keywordMatch).toBeGreaterThan(0);
    expect(risk.audioSpike).toBeGreaterThan(0);
  });

  it("emits EMERGENCY_PRESENCE_EVENT above threshold", () => {
    ingestVoiceSessionForEmergencyV0({
      text: "yardım",
      confidence: 0.55,
      maxRms: 0.2,
      recordedMs: 5000,
      shadowDrop: true,
      restartCtx: "v3_shadow_drop"
    });
    noteBehavioralMarkerV0({ kind: "mic_restart", context: "v3_shadow_drop" });
    noteBehavioralMarkerV0({ kind: "mic_restart", context: "v3_shadow_drop" });

    const out = evaluateEmergencyOnPulseV0({ pulseSeq: 1 });
    expect(out.emitted).toBe(true);
    expect(out.event?.type).toBe("EMERGENCY_PRESENCE_EVENT");
    expect(out.event?.chatBypass).toBe(true);
    expect(out.event?.llmBypass).toBe(true);
    expect(getEmergencySignalsSnapshotV0().lastEmit?.severity).toBeTruthy();
  });

  it("does not treat normal chat as emergency", () => {
    ingestVoiceSessionForEmergencyV0({
      text: "Rhizoh nasılsın bugün",
      confidence: 0.7,
      maxRms: 0.05,
      recordedMs: 3000
    });
    const risk = computeEmergencyRiskScoreV0();
    expect(risk.riskScore).toBeLessThan(0.75);
  });
});
