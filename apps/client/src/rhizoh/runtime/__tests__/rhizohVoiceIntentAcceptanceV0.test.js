import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
  applyIntentFirstAcceptanceV0,
  assessUserDirectedIntentV0,
  shouldAttemptIntentRescueV0
} from "../rhizohVoiceIntentAcceptanceV0.js";
import { transitionContinuityStateV0, CONTINUITY_STATE_V0 } from "../rhizohContinuityKernelV0.js";
import { noteGroundSignalV1, GROUND_SIGNAL_KIND_V1, __resetGroundingLayerForTestV1 } from "../rhizohGroundingLayerV1.js";
import { VOICE_SPEAK_MODE_V0 } from "../rhizohVoiceDualPathRouterV0.js";

describe("rhizohVoiceIntentAcceptanceV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    transitionContinuityStateV0(CONTINUITY_STATE_V0.IDLE);
    __resetGroundingLayerForTestV1();
  });

  it("scores user-directed intent from listening + RMS + duration", () => {
    transitionContinuityStateV0(CONTINUITY_STATE_V0.LISTENING, { source: "mic_open" });
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.MIC_OPEN);
    const assessment = assessUserDirectedIntentV0({
      text: "Rhizoh hava nasıl",
      maxRms: 0.09,
      recordedMs: 6000
    });
    expect(assessment.directedAttempt).toBe(true);
    expect(assessment.score).toBeGreaterThan(0.6);
    expect(assessment.signals).toContain("directed_lexeme");
  });

  it("rescues fast_noise_drop to hold when engagement signals strong", () => {
    transitionContinuityStateV0(CONTINUITY_STATE_V0.LISTENING);
    const silent = {
      speakMode: VOICE_SPEAK_MODE_V0.SILENT,
      reason: "fast_noise_drop",
      band: "unknown",
      fastIntent: "noise"
    };
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.MIC_OPEN);
    const rescued = applyIntentFirstAcceptanceV0(
      silent,
      { text: "Rizo ava na", maxRms: 0.08, recordedMs: 5000 },
      {},
      {
        buildHoldDecision: (intent, reason, band, tier, extra) =>
          Object.freeze({
            speakMode: VOICE_SPEAK_MODE_V0.HOLD,
            reason,
            band,
            confidenceTier: tier,
            ...extra
          }),
        classifyVoiceFastIntentV0: () => ({ intent: "noise" }),
        VOICE_CONFIDENCE_TIER_V0: { SLOW_READY: "slow_ready" }
      }
    );
    expect(rescued.speakMode).toBe(VOICE_SPEAK_MODE_V0.HOLD);
    expect(rescued.reason).toBe("presence_intent_hold");
  });

  it("strict ingest upgrades hold rescue to slow_llm speak", () => {
    vi.stubEnv("VITE_RHIZOH_VOICE_ENGINE_V3", "1");
    vi.stubEnv("VITE_RHIZOH_VOICE_INGEST_STRICT", "1");
    transitionContinuityStateV0(CONTINUITY_STATE_V0.LISTENING);
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.MIC_OPEN);
    const silent = {
      speakMode: VOICE_SPEAK_MODE_V0.SILENT,
      reason: "fast_noise_drop",
      band: "unknown",
      fastIntent: "noise"
    };
    const rescued = applyIntentFirstAcceptanceV0(
      silent,
      { text: "Rhizoh can you hear me", maxRms: 0.08, recordedMs: 8000 },
      {},
      {
        buildHoldDecision: (intent, reason, band, tier, extra) =>
          Object.freeze({
            speakMode: VOICE_SPEAK_MODE_V0.HOLD,
            reason,
            band,
            confidenceTier: tier,
            ...extra
          }),
        buildSpeakSlowDecision: (intent, reason, band, tier, guards, extra) =>
          Object.freeze({
            speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
            execMode: "slow_llm",
            reason,
            band,
            confidenceTier: tier,
            guards,
            ...extra
          }),
        trySlowPathEligibilityV0: () => true,
        classifyVoiceFastIntentV0: () => ({ intent: "chat" }),
        VOICE_CONFIDENCE_TIER_V0: { SLOW_READY: "slow_ready" }
      }
    );
    expect(rescued.speakMode).toBe(VOICE_SPEAK_MODE_V0.SPEAK);
    expect(rescued.execMode).toBe("slow_llm");
    expect(["presence_intent_strict_slow", "presence_intent_slow"].includes(rescued.reason)).toBe(true);
  });

  it("does not rescue without engagement signals even when score is high", () => {
    const assessment = assessUserDirectedIntentV0({
      text: "Rhizoh hava nasıl",
      maxRms: 0.01,
      recordedMs: 500
    });
    transitionContinuityStateV0(CONTINUITY_STATE_V0.IDLE);
    expect(
      shouldAttemptIntentRescueV0("fast_noise_drop", assessment, {
        text: "Rhizoh hava nasıl",
        maxRms: 0.01,
        recordedMs: 500
      })
    ).toBe(false);
  });

  it("does not rescue ui_chrome_echo without engagement", () => {
    const assessment = assessUserDirectedIntentV0({
      text: "Altyazı M.K.",
      maxRms: 0.01,
      recordedMs: 800
    });
    expect(
      shouldAttemptIntentRescueV0("ui_chrome_echo", assessment, {
        text: "Altyazı M.K.",
        maxRms: 0.01,
        recordedMs: 800
      })
    ).toBe(false);
  });
});
