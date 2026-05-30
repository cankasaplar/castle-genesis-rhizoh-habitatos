import { describe, expect, it } from "vitest";
import {
  clusterShadowForwardRingV0,
  buildShadowVoiceAnalysisSnapshotV0
} from "../voiceShadowAnalysisExportV0.js";
import { computeInterpretationStabilityV0 } from "../voiceInterpretationStabilityV0.js";
import { resolveShadowAckModeV0, SHADOW_ACK_MODE_V0 } from "../voiceShadowObservationAckV0.js";
import { VOICE_ROUTER_REJECTION_LAYER_V0 } from "../voiceTranscriptConfidenceRouterV0.js";

describe("voiceShadowAnalysisExportV0", () => {
  const ring = [
    {
      preview: "Nasılsın?",
      band: "unknown",
      route: { reason: "whisper_default_conf", rejectionLayer: "sanity" },
      atMs: 1
    },
    {
      preview: "Burada mısın?",
      band: "unknown",
      route: { reason: "whisper_default_conf", rejectionLayer: "sanity" },
      atMs: 2
    },
    {
      preview: "Sohbet?",
      band: "unknown",
      route: { reason: "whisper_default_conf", rejectionLayer: "sanity" },
      atMs: 3
    },
    {
      preview: "Uzun cümle test",
      band: "unknown",
      route: { reason: "low_confidence", rejectionLayer: "interaction" },
      atMs: 4
    }
  ];

  it("clusters with pattern labels", () => {
    const clusters = clusterShadowForwardRingV0(ring);
    expect(clusters[0].count).toBe(3);
    expect(clusters[0].patternLabel).toBe("short_turkish_utterance_friction");
  });

  it("detects recurring interpretation stability", () => {
    const stability = computeInterpretationStabilityV0(ring);
    expect(stability.recurringPatterns.length).toBeGreaterThan(0);
    expect(stability.learningDecision).toBe("none");
  });

  it("export snapshot forbids auto threshold", () => {
    const snap = buildShadowVoiceAnalysisSnapshotV0();
    expect(snap.executionPolicy.autoThreshold).toBe(false);
    expect(snap.analysisMode).toBe("observation_only");
  });

  it("resolves contextual shadow ack modes", () => {
    expect(
      resolveShadowAckModeV0({ band: "ambient", rejectionLayer: VOICE_ROUTER_REJECTION_LAYER_V0.SANITY })
    ).toBe(SHADOW_ACK_MODE_V0.NONE);
    expect(
      resolveShadowAckModeV0({
        band: "unknown",
        rejectionLayer: VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION,
        reason: "low_confidence"
      })
    ).toBe(SHADOW_ACK_MODE_V0.DELAYED);
    expect(
      resolveShadowAckModeV0({
        band: "unknown",
        rejectionLayer: VOICE_ROUTER_REJECTION_LAYER_V0.SANITY,
        reason: "whisper_default_conf"
      })
    ).toBe(SHADOW_ACK_MODE_V0.LIGHT);
  });
});
