import { afterEach, describe, expect, it } from "vitest";
import {
  buildConversationBehaviorMirrorSnapshotV0,
  markConversationMirrorDispatchV0,
  recordConversationMirrorGlueV0,
  recordConversationMirrorTurnV0,
  recordConversationMirrorVoiceRouteV0,
  resetConversationBehaviorMirrorForTestV0
} from "../rhizohConversationBehaviorMirrorV0.js";

describe("rhizohConversationBehaviorMirrorV0", () => {
  afterEach(() => {
    resetConversationBehaviorMirrorForTestV0();
  });

  it("aggregates language heatmap and speak/silence log", () => {
    recordConversationMirrorTurnV0({
      language: "tr",
      routeId: "fast_path",
      fastPath: true,
      channel: "voice",
      relationalTone: "warm_open",
      warmth01: 0.7
    });
    recordConversationMirrorTurnV0({
      language: "es",
      routeId: "full_pipeline",
      fastPath: false,
      channel: "text",
      relationalTone: "measured",
      warmth01: 0.5
    });
    recordConversationMirrorVoiceRouteV0({
      executionAccepted: true,
      reason: "ok",
      preview: "merhaba"
    });
    recordConversationMirrorVoiceRouteV0({
      executionAccepted: false,
      reason: "low_confidence",
      rejectionLayer: "sanity"
    });

    const snap = buildConversationBehaviorMirrorSnapshotV0();
    expect(snap.note).toBe("MEASUREMENT_ONLY_NOT_LEARNING");
    expect(snap.languageHeatmap.tr.turns).toBe(1);
    expect(snap.languageHeatmap.es.turns).toBe(1);
    expect(snap.speakSilenceLog.length).toBe(2);
    expect(snap.speakSilenceLog[0].decision).toBe("speak");
    expect(snap.speakSilenceLog[1].decision).toBe("silence");
  });

  it("builds ack→reply latency from dispatch mark + glue", () => {
    markConversationMirrorDispatchV0(Date.now() - 250);
    recordConversationMirrorGlueV0({ bridgeGapMs: 40, handoffMode: "chunk_tts" });

    const snap = buildConversationBehaviorMirrorSnapshotV0();
    expect(snap.ackReplyLatency.sampleCount).toBeGreaterThan(0);
    expect(snap.ackReplyLatency.p50Ms).toBeGreaterThan(0);
  });

  it("computes companion tone drift index across turns", () => {
    recordConversationMirrorTurnV0({
      language: "en",
      relationalTone: "calm",
      warmth01: 0.2
    });
    recordConversationMirrorTurnV0({
      language: "en",
      relationalTone: "warm",
      warmth01: 0.85
    });

    const snap = buildConversationBehaviorMirrorSnapshotV0();
    expect(snap.companionToneDrift.sampleCount).toBe(2);
    expect(snap.companionToneDrift.driftIndex01).toBeGreaterThan(0);
    expect(snap.companionToneDrift.toneChanges).toBe(1);
  });
});
