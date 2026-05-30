import { describe, it, expect, beforeEach } from "vitest";
import {
  runClagTraversalPolicyV0,
  CLAG_TRAVERSAL_PROFILE_V0,
  CLAG_CANONICAL_ROUTE_CHAINS_V0
} from "../rhizohClagTraversalPolicyV0.js";
import {
  ingestClagTurnContextV0,
  resetClagGraphV0,
  CLAG_NODE_KIND_V0
} from "../rhizohCrossLayerAwarenessGraphV0.js";

describe("rhizohClagTraversalPolicyV0", () => {
  beforeEach(() => resetClagGraphV0());

  it("exposes frozen canonical route chains", () => {
    expect(CLAG_CANONICAL_ROUTE_CHAINS_V0.length).toBeGreaterThanOrEqual(5);
    expect(CLAG_CANONICAL_ROUTE_CHAINS_V0.some((c) => c.id === "spiral_real_life_mapping")).toBe(true);
  });

  it("llm_turn profile prioritizes influence→depth primary route", () => {
    const graph = ingestClagTurnContextV0({
      traversalProfile: CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN,
      conversationPhase: "TRUST_BUILD",
      conversationDepth: { conversationMode: "explore", depthLevel: 2 },
      turnInfluencePre: { dominantShaper: "depth" },
      spiralAgreement: { agreementLayer: true, meshPhase: "weave" }
    });
    const plan = graph.traversalPlan;
    expect(plan.routingExplicit).toBe(true);
    expect(plan.strategy).toBe("priority_outbound_v0");
    expect(plan.primaryRoute.chainId).toBe("measured_influence_depth");
    expect(plan.layerRoutingOrder[0]).toBe(CLAG_NODE_KIND_V0.INFLUENCE);
  });

  it("living_world_frame profile prioritizes spiral→real_life primary route", () => {
    const graph = ingestClagTurnContextV0({
      traversalProfile: CLAG_TRAVERSAL_PROFILE_V0.LIVING_WORLD_FRAME,
      spiralAgreement: { agreementLayer: true, meshPhase: "weave" },
      geographicAnchor: "anchor_besiktas_pressure",
      persona: { firstName: "Metehan" }
    });
    const plan = graph.traversalPlan;
    expect(plan.primaryRoute.chainId).toBe("spiral_real_life_mapping");
    expect(plan.layerRoutingOrder[0]).toBe(CLAG_NODE_KIND_V0.SPIRAL);
  });

  it("skips edges below min weight in outbound traversal", () => {
    const plan = runClagTraversalPolicyV0({
      traversalProfile: CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN,
      nodes: [
        { id: "studio:active", kind: "studio", label: "studio" },
        { id: "narrative:story", kind: "narrative", label: "narr" }
      ],
      edges: [
        {
          from: "studio:active",
          to: "narrative:story",
          kind: "influences",
          weight: 0.05,
          label: "studio_decision_narrative"
        }
      ]
    });
    expect(plan.implicitEdgesSkipped).toContain("studio_decision_narrative");
    expect(plan.canonicalRoutes.matched.length).toBe(0);
  });
});
