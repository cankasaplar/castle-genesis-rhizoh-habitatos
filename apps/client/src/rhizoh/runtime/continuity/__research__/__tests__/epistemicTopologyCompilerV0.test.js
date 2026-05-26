import { describe, expect, it } from "vitest";
import {
  compileDisagreementGraphV0,
  compileEpistemicTopologyFromObservationsV0,
  compileExecutionCollapseLineV0,
  compileStressMeshV0
} from "../epistemicTopologyCompilerV0.js";
import { reconcileCrossNodeIdentityV0 } from "../crossNodeIdentityReconciliationV0.js";
import { propagateEpistemicStressV0 } from "../epistemicStressPropagationV0.js";
import { deriveEpistemicFingerprintV0, IDENTITY_CONTINUITY_VERDICT_V0 } from "../epistemicIdentityContinuityV0.js";

const WORLD = "world:mediterranean";

function obs(nodeId, weightOffset = 0) {
  return {
    nodeId,
    verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
    confidence: 0.68 + weightOffset,
    fingerprint: deriveEpistemicFingerprintV0({
      livingWorldId: WORLD,
      issuancePath: "canonical_chain",
      lineageRoot: "lineage:shared",
      witnessAnchor: { weight: 4 + weightOffset, class: "gateway", decayRate: 0.08 }
    }),
    lineageEquivalent: true,
    bootSealVersion: 12
  };
}

describe("epistemicTopologyCompilerV0 (Phase 9.2 RESEARCH-ONLY)", () => {
  it("compiles four topology layers without truth collapse", () => {
    const topology = compileEpistemicTopologyFromObservationsV0({
      livingWorldId: WORLD,
      observations: [obs("node:barcelona"), obs("node:istanbul", 0.05)],
      topologyEdges: [{ from: "node:barcelona", to: "node:istanbul", trustWeight: 0.85 }],
      networkExecutorNodeId: "node:istanbul"
    });

    expect(topology.schema).toContain("topology_compiler");
    expect(topology.truthCollapsed).toBe(false);
    expect(topology.layers.stressMesh.vertices.length).toBeGreaterThan(2);
    expect(topology.layers.stressMesh.faces.length).toBeGreaterThan(0);
    expect(topology.layers.disagreementGraph.nodes).toHaveLength(2);
    expect(topology.layers.disagreementGraph.edges.length).toBeGreaterThan(0);
    expect(topology.layers.driftFlowMap.vectors).toHaveLength(2);
    expect(topology.layers.executionAxis.segments.length).toBe(1);
    expect(topology.layers.executionAxis.executorNodeId).toBe("node:istanbul");
  });

  it("stress mesh elevates z with stress", () => {
    const mesh = compileStressMeshV0(
      [
        { nodeId: "a", localStress: 0.8, propagatedStress: 0.1, coherenceGradient: 0.2 },
        { nodeId: "b", localStress: 0.2, propagatedStress: 0.1, coherenceGradient: 0.8 }
      ],
      ["a", "b"]
    );
    const a = mesh.vertices.find((v) => v.id === "a");
    const b = mesh.vertices.find((v) => v.id === "b");
    expect(a.z).toBeGreaterThan(b.z);
  });

  it("disagreement graph is navigable", () => {
    const rec = reconcileCrossNodeIdentityV0({
      livingWorldId: WORLD,
      observations: [obs("node:barcelona"), obs("node:istanbul")]
    });
    const graph = compileDisagreementGraphV0(rec);
    expect(graph.nodes.every((n) => n.navigable)).toBe(true);
    expect(graph.edges.some((e) => e.navigable)).toBe(true);
  });

  it("execution axis has no segments without executor", () => {
    const axis = compileExecutionCollapseLineV0(null, ["node:a", "node:b"]);
    expect(axis.segments).toHaveLength(0);
  });
});
