import { describe, expect, it } from "vitest";
import {
  evaluatePreSttInputSanitizationV0,
  estimatePreSttSpeechProbabilityV0,
  PRE_STT_GATE_ACTION_V0,
  PRE_STT_HOLD_MIN_DURATION_MS_V0,
  PRE_STT_HOLD_SPEECH_PROB_MAX_V0,
  PRE_STT_MIN_SPEECH_PROBABILITY_V0,
  PRE_STT_SHORT_UTTERANCE_MIN_SPEECH_PROB_V0
} from "../rhizohVoicePreSttInputSanitizationGateV0.js";
import { VOICE_MIN_SPEECH_RMS_V3 } from "../voiceEngineV3/voiceAudioLevelV3.js";

describe("rhizohVoicePreSttInputSanitizationGateV0", () => {
  it("drops below minimum speech energy", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: VOICE_MIN_SPEECH_RMS_V3 - 0.004,
      recordedMs: 2500,
      bytes: 90000,
      warmProbe: { avgWarmScore: 0.7, minWarmScore: 0.65 },
      sampleCount: 6,
      voiceGatewaySessionActive: false
    });
    expect(v.pass).toBe(false);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.DROP);
    expect(v.reason).toBe("pre_stt_low_energy");
  });

  it("allow_if_session_active bypasses low energy for live gateway voice session", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.002,
      recordedMs: 6776,
      bytes: 42415,
      warmProbe: { avgWarmScore: 0.3, minWarmScore: 0.3 },
      sampleCount: 2,
      voiceGatewaySessionActive: true
    });
    expect(v.pass).toBe(true);
    expect(v.reason).toBe("allow_if_session_active");
    expect(v.gatewaySessionBypass).toBe(true);
  });

  it("allow_if_session_active bypasses when citizenship registered (not only live WS chunk)", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.003,
      recordedMs: 3200,
      bytes: 52000,
      warmProbe: { avgWarmScore: 0.4, minWarmScore: 0.35 },
      sampleCount: 3,
      voiceGatewaySessionActive: true
    });
    expect(v.pass).toBe(true);
    expect(v.reason).toBe("allow_if_session_active");
  });

  it("drops when speech probability below 0.6", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.013,
      recordedMs: 900,
      bytes: 30000,
      warmProbe: { avgWarmScore: 0.35, minWarmScore: 0.3 },
      sampleCount: 1
    });
    expect(v.pass).toBe(false);
    expect(v.speechProbability).toBeLessThan(PRE_STT_MIN_SPEECH_PROBABILITY_V0);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.DROP);
    expect(v.reason).toBe("pre_stt_low_speech_probability");
  });

  it("holds only when entropy high AND speech probability below 0.55", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.014,
      recordedMs: 7200,
      bytes: 120000,
      warmProbe: { avgWarmScore: 0.62, minWarmScore: 0.28 },
      sampleCount: 5
    });
    expect(v.pass).toBe(false);
    expect(v.recordedMs).toBeGreaterThan(PRE_STT_HOLD_MIN_DURATION_MS_V0);
    expect(v.speechProbability).toBeLessThan(PRE_STT_HOLD_SPEECH_PROB_MAX_V0);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.HOLD);
    expect(v.reason).toBe("pre_stt_acoustic_entropy");
  });

  it("does not hold high entropy on short clips", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.014,
      recordedMs: 700,
      bytes: 32000,
      warmProbe: { avgWarmScore: 0.62, minWarmScore: 0.28 },
      sampleCount: 3
    });
    expect(v.action).not.toBe(PRE_STT_GATE_ACTION_V0.HOLD);
  });

  it("allows short whisper-like utterance with lower speech probability floor", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.017,
      recordedMs: 820,
      bytes: 36000,
      warmProbe: { avgWarmScore: 0.62, minWarmScore: 0.58 },
      sampleCount: 4
    });
    expect(v.speechProbability).toBeGreaterThanOrEqual(PRE_STT_SHORT_UTTERANCE_MIN_SPEECH_PROB_V0);
    expect(v.pass).toBe(true);
    expect(v.reason).toBe("pre_stt_short_utterance_ok");
  });

  it("does not hold high entropy when speech probability is healthy", () => {
    const prob = estimatePreSttSpeechProbabilityV0({
      maxRms: 0.042,
      recordedMs: 7200,
      bytes: 120000,
      warmProbe: { avgWarmScore: 0.62, minWarmScore: 0.28 },
      sampleCount: 6
    });
    expect(prob).toBeGreaterThanOrEqual(PRE_STT_HOLD_SPEECH_PROB_MAX_V0);
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.042,
      recordedMs: 7200,
      bytes: 120000,
      warmProbe: { avgWarmScore: 0.62, minWarmScore: 0.28 },
      sampleCount: 6
    });
    expect(v.pass).toBe(true);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.PROCEED);
  });

  it("proceeds for clear directed speech clip", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.045,
      recordedMs: 3200,
      bytes: 95000,
      warmProbe: { avgWarmScore: 0.78, minWarmScore: 0.72 },
      sampleCount: 8
    });
    expect(v.pass).toBe(true);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.PROCEED);
  });

  it("proceeds on borderline RMS when warm probe is healthy", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.0075,
      recordedMs: 9473,
      bytes: 123575,
      warmProbe: { avgWarmScore: 0.88, minWarmScore: 0.78 },
      sampleCount: 6
    });
    expect(v.pass).toBe(true);
    expect(v.reason).toBe("pre_stt_borderline_warm_ok");
    expect(v.borderlineWarm).toBe(true);
  });

  it("defers large silent-capture clip to post-STT when warm probe is healthy", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.0014,
      recordedMs: 8500,
      bytes: 128719,
      warmProbe: { avgWarmScore: 0.9, minWarmScore: 0.68 },
      sampleCount: 6
    });
    expect(v.pass).toBe(true);
    expect(v.action).toBe(PRE_STT_GATE_ACTION_V0.PROCEED);
    expect(v.reason).toBe("pre_stt_silent_capture_warm_defer");
    expect(v.warmDefer).toBe(true);
    expect(v.warmVoiceEnergy).toBeGreaterThanOrEqual(0.72);
  });

  it("drops large silent-capture clip when warm probe is cold", () => {
    const v = evaluatePreSttInputSanitizationV0({
      maxRms: 0.0014,
      recordedMs: 8500,
      bytes: 128719,
      warmProbe: { avgWarmScore: 0.4, minWarmScore: 0.3 },
      sampleCount: 6
    });
    expect(v.pass).toBe(false);
    expect(v.reason).toBe("pre_stt_silent_capture");
    expect(v.silentCapture).toBe(true);
  });
});
