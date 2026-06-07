import { describe, expect, it } from "vitest";
import {
  createRhizohMemoryV0,
  enqueueRhizohAttentionHintV0,
  extractRhizohTopicSignalsV0,
  recordRhizohAttentionV0,
  snapshotRhizohMemoryV0,
  stepRhizohMemoryV0
} from "../rhizohMemoryV0.js";
import { createCognitiveGeometryEngineV1, ingestCognitiveDraftV1 } from "../octoCognitiveGeometryCompilerV1.js";

describe("rhizohMemoryV0", () => {
  it("extracts topic signals without personality conclusions", () => {
    const topics = extractRhizohTopicSignalsV0("harita aç ve spiral geometri göster");
    expect(topics).toContain("map");
    expect(topics).toContain("spiral");
    expect(topics).toContain("geometry");
  });

  it("records mention frequency not user preferences", () => {
    const memory = createRhizohMemoryV0();
    stepRhizohMemoryV0(memory, { draftText: "basketbol maçı", nowMs: 1000 });
    stepRhizohMemoryV0(memory, { draftText: "basketbol", nowMs: 2000 });

    const snap = snapshotRhizohMemoryV0(memory);
    const basketball = snap.topicSignals.find((row) => row.topic === "basketball");
    expect(basketball.mentions).toBe(2);
    expect(snap.topicSignals.find((row) => row.topic === "userLikesBasketball")).toBeUndefined();
  });

  it("tracks interaction patterns from usage not content interpretation", () => {
    const memory = createRhizohMemoryV0({ interactionPatterns: { sessionStartedAtMs: 0 } });
    stepRhizohMemoryV0(memory, {
      draftText: "uzun bir prompt " + "x".repeat(180),
      nowMs: 60000,
      deltaMs: 16,
      fieldState: "thinking"
    });
    stepRhizohMemoryV0(memory, {
      nowMs: 120000,
      deltaMs: 16,
      mapSurfaceActive: true,
      fieldState: "idle"
    });

    const patterns = snapshotRhizohMemoryV0(memory).interactionPatterns;
    expect(patterns.avgPromptLength).toBeGreaterThan(150);
    expect(patterns.avgSessionMinutes).toBeGreaterThan(1);
    expect(patterns.worldModeSamples).toBeGreaterThan(0);
    expect(patterns.conversationModeSamples).toBeGreaterThan(0);
  });

  it("records attention history as observed focus strength", () => {
    const memory = createRhizohMemoryV0();
    recordRhizohAttentionV0(memory, "map", 0.76, 1000);
    recordRhizohAttentionV0(memory, "spiral", 0.92, 2000);

    const snap = snapshotRhizohMemoryV0(memory);
    expect(snap.attentionHistory).toHaveLength(2);
    expect(snap.attentionHistory[1].focus).toBe("spiral");
    expect(snap.attentionHistory[1].strength).toBeCloseTo(0.92);
  });

  it("stores attention hints in decaying field cells", () => {
    const memory = createRhizohMemoryV0();
    const hint = enqueueRhizohAttentionHintV0(memory, { target: "spiral", weight: 0.32 });

    expect(hint.target).toBe("spiral");
    expect(memory.attentionField.spiral).toBeGreaterThan(0);
    expect(snapshotRhizohMemoryV0(memory).attentionField.spiral).toBeGreaterThan(0);
  });

  it("does not duplicate draft snapshots on repeated ticks", () => {
    const memory = createRhizohMemoryV0();
    stepRhizohMemoryV0(memory, { draftText: "harita", nowMs: 1000 });
    stepRhizohMemoryV0(memory, { draftText: "harita", nowMs: 1500 });

    expect(memory.topicSignals.map.mentions).toBe(1);
  });

  it("observes cube geometry shifts into attention history", () => {
    const memory = createRhizohMemoryV0();
    const engine = createCognitiveGeometryEngineV1(12);
    ingestCognitiveDraftV1(engine, "neden mantık spiral");

    stepRhizohMemoryV0(memory, { engine, nowMs: 1000, deltaMs: 16 });
    const snap = snapshotRhizohMemoryV0(memory);

    expect(snap.attentionHistory.length).toBeGreaterThan(0);
    expect(memory.topicSignals.spiral?.mentions).toBeUndefined();
  });
});
