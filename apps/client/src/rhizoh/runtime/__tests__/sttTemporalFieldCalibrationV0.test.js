import { describe, expect, it, beforeEach } from "vitest";
import {
  getSttTemporalFieldCalibrationV0,
  recordSttTemporalFieldTurnV0,
  __resetSttTemporalFieldCalibrationForTestV0
} from "../sttTemporalFieldCalibrationV0.js";

describe("sttTemporalFieldCalibrationV0", () => {
  beforeEach(() => {
    __resetSttTemporalFieldCalibrationForTestV0();
  });

  it("does not calibrate until minimum samples", () => {
    for (let i = 0; i < 5; i++) {
      recordSttTemporalFieldTurnV0({ noiseScore: 4, suppress: true });
    }
    const cal = getSttTemporalFieldCalibrationV0();
    expect(cal.enabled).toBe(false);
    expect(cal.sampleCount).toBe(5);
  });

  it("lowers noise enter threshold in persistently noisy field", () => {
    for (let i = 0; i < 12; i++) {
      recordSttTemporalFieldTurnV0({
        noiseScore: 4.5,
        suppress: i % 2 === 0,
        profileId: "noisy"
      });
    }
    const cal = getSttTemporalFieldCalibrationV0();
    expect(cal.enabled).toBe(true);
    expect(cal.noiseScoreEnter).toBeLessThanOrEqual(3);
    expect(cal.spikeThresholdNoisy).toBeLessThanOrEqual(0.2);
  });

  it("raises spike threshold in quiet low-suppress field", () => {
    for (let i = 0; i < 10; i++) {
      recordSttTemporalFieldTurnV0({
        noiseScore: 1,
        suppress: false,
        profileId: "quiet"
      });
    }
    const cal = getSttTemporalFieldCalibrationV0();
    expect(cal.enabled).toBe(true);
    expect(cal.spikeThresholdQuiet).toBeGreaterThanOrEqual(0.22);
  });
});
