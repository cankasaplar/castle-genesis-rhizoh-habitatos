import { describe, it, expect, beforeEach } from "vitest";
import {
  ingestClagTurnContextV0,
  buildRhizohCrossLayerAwarenessGraphV0,
  resetClagGraphV0,
  CLAG_NODE_KIND_V0,
  deriveClagMemoryShapingHintsV0
} from "../rhizohCrossLayerAwarenessGraphV0.js";

describe("rhizohCrossLayerAwarenessGraphV0", () => {
  beforeEach(() => resetClagGraphV0());

  it("builds cross-layer nodes and edges for a turn", () => {
    const graph = ingestClagTurnContextV0({
      traceId: "TRC-CLAG-1",
      sessionId: "sess-1",
      conversationPhase: "TRUST_BUILD",
      layerSpec: { id: 10, code: "L10" },
      pathname: "/",
      conversationDepth: {
        conversationMode: "explore",
        depthLevel: 2,
        continuityStrength: 0.6
      },
      storySnapshot: {
        whatHappenedLast: "Önceki sahne",
        unresolvedThreads: ["q1"],
        storyContinuityScore: 0.8
      },
      turnInfluencePre: { dominantShaper: "depth", shapingAnswer: "depth_shaping" },
      geographicAnchor: "istanbul_bootstrap",
      spiralAgreement: { agreementLayer: true, meshPhase: "weave" }
    });
    expect(graph.nodeCount).toBeGreaterThanOrEqual(7);
    expect(graph.edgeCount).toBeGreaterThanOrEqual(5);
    expect(graph.layerVisibility[CLAG_NODE_KIND_V0.NARRATIVE].active).toBe(true);
    expect(graph.layerVisibility[CLAG_NODE_KIND_V0.SPIRAL].active).toBe(true);
  });

  it("derives memory shaping hints with studio and spiral paths", () => {
    ingestClagTurnContextV0({
      traceId: "TRC-2",
      layerSpec: { id: 5 },
      pathname: "/studio",
      studioEventType: "presence_commit",
      spiralAgreement: { agreementLayer: true, meshPhase: "spiral" },
      storySnapshot: { unresolvedThreads: ["a"], storyContinuityScore: 0.7 }
    });
    const graph = buildRhizohCrossLayerAwarenessGraphV0();
    const hints = deriveClagMemoryShapingHintsV0(graph.nodes, graph.edges);
    expect(hints.openThreadsBoost.length).toBeGreaterThan(0);
    expect(hints.crossLayerPaths.length).toBeGreaterThan(0);
  });
});
