import { describe, expect, it, beforeEach } from "vitest";
import {
  applyVoiceEnvironmentThresholdOverrideV0,
  buildVoiceEnvironmentFingerprintV0,
  buildVoiceEnvironmentRoomHintV0,
  measureRoomHintDistanceV0,
  primeVoiceEnvironmentProfileV0,
  recordVoiceEnvironmentTurnV0,
  __resetVoiceEnvironmentMemoryForTestV0,
  __setVepmEnabledForTestV0
} from "../voiceEnvironmentProfileMemoryV0.js";
import { STT_TEMPORAL_PROFILE_ID_V0 } from "../sttTemporalSmoothingV0.js";

describe("voiceEnvironmentProfileMemoryV0", () => {
  beforeEach(() => {
    __resetVoiceEnvironmentMemoryForTestV0();
    __setVepmEnabledForTestV0(true);
  });

  it("builds non-PII fingerprint from user mic and room hint", () => {
    const fp = buildVoiceEnvironmentFingerprintV0({
      userId: "user-abc",
      micDeviceId: "mic-123",
      roomHint: buildVoiceEnvironmentRoomHintV0({ maxRms: 0.04, profileId: "noisy" })
    });
    expect(fp.profileKey).toBeTruthy();
    expect(fp.userId).toBe("user-abc");
    expect(fp.micHash).toBeTruthy();
    expect(fp.micHash).not.toContain("mic-123");
  });

  it("bootstrap then stabilizes regulator weight", async () => {
    await primeVoiceEnvironmentProfileV0({
      userId: "u1",
      micDeviceId: "m1",
      roomHint: buildVoiceEnvironmentRoomHintV0({ profileId: STT_TEMPORAL_PROFILE_ID_V0.QUIET })
    });

    let reg = applyVoiceEnvironmentThresholdOverrideV0({
      fieldCalibration: { enabled: true, noiseScoreEnter: 3, spikeThresholdQuiet: 0.22, spikeThresholdNoisy: 0.18 }
    });
    expect(reg.overrideWeight).toBeLessThan(0.5);

    for (let i = 0; i < 4; i++) {
      await recordVoiceEnvironmentTurnV0({
        noiseScore: 1.5,
        profileId: STT_TEMPORAL_PROFILE_ID_V0.QUIET,
        suppress: false,
        scriptCoherence: 0.9,
        majorityScript: "latin_tr",
        maxRms: 0.02
      });
    }

    reg = applyVoiceEnvironmentThresholdOverrideV0({
      fieldCalibration: { enabled: true, noiseScoreEnter: 3, spikeThresholdQuiet: 0.22, spikeThresholdNoisy: 0.18 },
      temporalProfile: { id: STT_TEMPORAL_PROFILE_ID_V0.QUIET, windowSize: 3, emaAlpha: 0.42 }
    });
    expect(reg.enabled).toBe(true);
    expect(reg.overrideWeight).toBeGreaterThan(0.4);
  });

  it("detects room drift and enters drift mode", async () => {
    const quiet = buildVoiceEnvironmentRoomHintV0({
      profileId: STT_TEMPORAL_PROFILE_ID_V0.QUIET,
      maxRms: 0.02,
      scriptCoherence: 0.9
    });
    const noisy = buildVoiceEnvironmentRoomHintV0({
      profileId: STT_TEMPORAL_PROFILE_ID_V0.NOISY,
      maxRms: 0.06,
      scriptCoherence: 0.4
    });
    expect(measureRoomHintDistanceV0(quiet, noisy)).toBeGreaterThanOrEqual(2);

    await primeVoiceEnvironmentProfileV0({ userId: "u1", micDeviceId: "m1", roomHint: quiet });
    for (let i = 0; i < 5; i++) {
      await recordVoiceEnvironmentTurnV0({
        noiseScore: 1,
        profileId: STT_TEMPORAL_PROFILE_ID_V0.QUIET,
        suppress: false,
        scriptCoherence: 0.9,
        maxRms: 0.02,
        userId: "u1",
        micDeviceId: "m1"
      });
    }

    await recordVoiceEnvironmentTurnV0({
      noiseScore: 4,
      profileId: STT_TEMPORAL_PROFILE_ID_V0.NOISY,
      suppress: true,
      scriptCoherence: 0.4,
      maxRms: 0.08,
      userId: "u1",
      micDeviceId: "m1"
    });

    const reg = applyVoiceEnvironmentThresholdOverrideV0({
      fieldCalibration: { enabled: true, noiseScoreEnter: 3, spikeThresholdQuiet: 0.22, spikeThresholdNoisy: 0.18 }
    });
    expect(reg.driftMode === true || reg.overrideWeight < 0.5).toBe(true);
  });
});
