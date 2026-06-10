import { describe, expect, it, beforeEach } from "vitest";
import {
  FABRIC_SPIKE_INTENT_V1,
  FABRIC_SOURCE_V1,
  __resetExperienceFabricForTestV1,
  classifySpikeIntentV1,
  ingestFabricEventV1,
  normalizeExperienceEventV1,
  registerMediaSyncV1,
  resolveMemoryRetrievalV1,
  runSpikeEngineV1
} from "../rhizohExperienceFabricV1.js";
import { __resetCoPresenceRuntimeForTestV1 } from "../rhizohCoPresenceRuntimeV1.js";
import { __resetStreamingAttentionGateForTestV0 } from "../rhizohStreamingAttentionGateV0.js";
import {
  clearVoiceAttentionModeOverrideV0,
  setVoiceAttentionModeOverrideV0,
  VOICE_ATTENTION_MODE_V0
} from "../voiceAttentionContextV0.js";

describe("rhizohExperienceFabricV1", () => {
  beforeEach(() => {
    __resetExperienceFabricForTestV1();
    __resetCoPresenceRuntimeForTestV1();
    __resetStreamingAttentionGateForTestV0();
    clearVoiceAttentionModeOverrideV0();
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.CO_PRESENCE);
  });

  it("normalizes multi-source events", () => {
    const ev = normalizeExperienceEventV1({
      source: "youtube",
      text: "goal replay commentary",
      mediaPositionMs: 763_000
    });
    expect(ev.source).toBe(FABRIC_SOURCE_V1.YOUTUBE);
    expect(ev.signal.mediaPositionMs).toBe(763_000);
    expect(ev.semantic_hint).toBeTruthy();
  });

  it("not al triggers memory_write anchor", () => {
    registerMediaSyncV1({ source: "youtube", positionMs: 763_000, playing: true });
    const spike = runSpikeEngineV1({
      source: "mic",
      text: "bunu not al Rhizoh",
      userAction: "pause"
    });
    expect(spike.intent).toBe(FABRIC_SPIKE_INTENT_V1.MEMORY_WRITE);
    expect(spike.respond).toBe(true);
    expect(spike.anchor?.mediaPositionMs).toBe(763_000);
  });

  it("analytical question on youtube co-watch", () => {
    registerMediaSyncV1({ source: "youtube", positionMs: 12 * 60 * 1000 + 43 * 1000 });
    const spike = runSpikeEngineV1({
      source: "mic",
      text: "şu pozisyonu açıklayabilir misin?",
      confidence: 0.55
    });
    expect([
      FABRIC_SPIKE_INTENT_V1.ANALYTICAL,
      FABRIC_SPIKE_INTENT_V1.EXPLAIN_MOMENT,
      FABRIC_SPIKE_INTENT_V1.CONVERSATION
    ]).toContain(spike.intent);
    expect(spike.respond).toBe(true);
    expect(spike.mediaPositionMs).toBe(763_000);
  });

  it("memory retrieval resolves anchor", () => {
    runSpikeEngineV1({ source: "mic", text: "not al: kaleci hatası", userAction: "pause" });
    const intent = classifySpikeIntentV1("şu sahne neydi kaleci");
    expect(intent.intent).toBe(FABRIC_SPIKE_INTENT_V1.MEMORY_RETRIEVAL);
    const spike = runSpikeEngineV1({ source: "mic", text: "şu sahne neydi kaleci" });
    expect(spike.retrieval?.ok).toBe(true);
  });

  it("ingest builds attention field mass", () => {
    ingestFabricEventV1({ source: "youtube", preview: "commentator", salienceHint: 0.3 });
    ingestFabricEventV1({ source: "mic", preview: "user question", userInitiated: true });
    const spike = runSpikeEngineV1({ source: "mic", text: "Rhizoh dinle" });
    expect(spike.attentionField.userStreamPriority).toBeGreaterThan(0);
  });
});
