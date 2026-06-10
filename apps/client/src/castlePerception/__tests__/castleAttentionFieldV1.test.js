import { describe, expect, it, beforeEach } from "vitest";
import {
  ATTENTION_EVENT_TYPE_V1,
  ATTENTION_EVENT_SOURCE_V1,
  CONTEXTUAL_RELATION_V1,
  __resetCastleAttentionFieldForTestV1,
  classifyAttentionEventTypeV1,
  computeCastleAttentionFieldV1,
  queueRealityNodeV1,
  tickAttentionFieldV1
} from "../castleAttentionFieldV1.js";
import { evaluateSpikeCollapseV1, __resetSpikeEngineForTestV1 } from "../castleSpikeEngineV1.js";

describe("castleAttentionFieldV1 graph core", () => {
  beforeEach(() => {
    __resetCastleAttentionFieldForTestV1();
    __resetSpikeEngineForTestV1();
  });

  it("classifies TV commentary as narrative context", () => {
    const cls = classifyAttentionEventTypeV1({
      source: "tv",
      preview: "commentator describes the foul"
    });
    expect(cls.type).toBe(ATTENTION_EVENT_TYPE_V1.NARRATIVE);
  });

  it("tick builds reality graph with mass and resonance zones", () => {
    queueRealityNodeV1({ source: "youtube", preview: "match replay", mediaPositionMs: 5000, atMs: 1000 });
    queueRealityNodeV1({ source: "mic", text: "Rhizoh şu an?", userInitiated: true, atMs: 1100 });
    const graph = tickAttentionFieldV1(1200);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(2);
    expect(graph.nodes[0].mass).toBeDefined();
    expect(graph.decayFunction).toBe("temporal+salience");
    expect(graph.globalMass).toBeGreaterThan(0);
  });

  it("cross-modal edge links mic intent to youtube at same media position", () => {
    queueRealityNodeV1({ source: "youtube", preview: "goal", mediaPositionMs: 763_000, atMs: 1000 });
    queueRealityNodeV1({
      source: "mic",
      text: "Rhizoh bu pozisyonu açıkla",
      mediaPositionMs: 763_000,
      userInitiated: true,
      atMs: 1100
    });
    const graph = tickAttentionFieldV1(1200);
    const crossModal = graph.edges.some((e) => e.relation === CONTEXTUAL_RELATION_V1.CROSS_MODAL);
    expect(crossModal).toBe(true);
  });

  it("spike engine collapses emergency from field graph", () => {
    queueRealityNodeV1({
      source: "mic",
      text: "Rhizoh yardım!",
      userInitiated: true,
      atMs: 1000
    });
    const graph = tickAttentionFieldV1(1100);
    const spikes = evaluateSpikeCollapseV1({ graph, atMs: 1100 });
    expect(spikes.length).toBeGreaterThan(0);
    expect(spikes[0].type).toBe("emergency");
  });

  it("equal source weights — youtube and mic both contribute mass", () => {
    queueRealityNodeV1({ source: "youtube", preview: "live", atMs: 1000 });
    queueRealityNodeV1({ source: "mic", preview: "user", atMs: 1010 });
    tickAttentionFieldV1(1100);
    const field = computeCastleAttentionFieldV1(1200);
    expect(field.sourceMass[ATTENTION_EVENT_SOURCE_V1.YOUTUBE]).toBeGreaterThan(0);
    expect(field.sourceMass[ATTENTION_EVENT_SOURCE_V1.MIC]).toBeGreaterThan(0);
  });
});
