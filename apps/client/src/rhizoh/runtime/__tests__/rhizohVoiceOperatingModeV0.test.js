import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  detectAlertRecallSignalV0,
  evaluateAlertRecallRescueV0,
  isCompanionContinuityFirstV0,
  VOICE_OPERATING_MODE_V0
} from "../rhizohVoiceOperatingModeV0.js";

describe("rhizohVoiceOperatingModeV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_VOICE_OPERATING_MODE", "companion");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to companion continuity-first", () => {
    expect(isCompanionContinuityFirstV0()).toBe(true);
  });

  it("detects alert recall signals", () => {
    expect(detectAlertRecallSignalV0("yardım edin").alert).toBe(true);
    expect(detectAlertRecallSignalV0("imdat").alert).toBe(true);
    expect(detectAlertRecallSignalV0("help me").alert).toBe(true);
    expect(detectAlertRecallSignalV0("merhaba nasılsın").alert).toBe(false);
  });

  it("alert rescue accepts execution recall-first", () => {
    const rescue = evaluateAlertRecallRescueV0({
      text: "düştüm yardım",
      source: "mic_v3"
    });
    expect(rescue.recallFirst).toBe(true);
    expect(rescue.operatingMode).toBe(VOICE_OPERATING_MODE_V0.ALERT);
  });
});
