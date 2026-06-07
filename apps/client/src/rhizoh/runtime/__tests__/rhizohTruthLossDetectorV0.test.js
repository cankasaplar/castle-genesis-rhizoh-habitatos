import { describe, expect, it } from "vitest";
import { detectTruthLossV0 } from "../rhizohTruthLossDetectorV0.js";
import { compressCausalGraphV0 } from "../rhizohCausalGraphCompressionV0.js";
import { TRUTH_TRACE_KIND_V0 } from "../rhizohTruthTraceLayerV0.js";
import { CAUSAL_EDGE_RELATION_V0 } from "../rhizohCausalMapLayerV0.js";

describe("rhizohTruthLossDetectorV0", () => {
  it("passes when only acceptable temporal/replay compression occurs", () => {
    const raw = {
      nodes: [
        { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world", label: "t0→world", atMs: 1 },
        { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, domain: "world", label: "open_world_map → act", atMs: 2 },
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `trail_${i}`,
          kind: "temporal_trail",
          domain: "world",
          label: `poi:${i}`,
          atMs: 10 + i
        }))
      ],
      edges: [
        { from: "d1", to: "t1", relation: CAUSAL_EDGE_RELATION_V0.ENABLES }
      ]
    };
    const compressed = compressCausalGraphV0(raw);
    const report = detectTruthLossV0(raw, compressed);
    expect(report.influencesExecution).toBe(false);
    expect(report.pass).toBe(true);
    expect(report.selfExplanation).toContain("No semantic truth loss");
  });

  it("detects weakened causal path when critical edge dropped but nodes kept", () => {
    const raw = {
      nodes: [
        { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world", atMs: 1 },
        { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, domain: "world", atMs: 2 },
        { id: "s1", kind: TRUTH_TRACE_KIND_V0.SPATIAL_NODE, domain: "world", atMs: 3 }
      ],
      edges: [
        { from: "d1", to: "t1", relation: CAUSAL_EDGE_RELATION_V0.ENABLES },
        { from: "t1", to: "s1", relation: CAUSAL_EDGE_RELATION_V0.PROJECTS_TO }
      ]
    };
    const compressed = {
      nodes: raw.nodes,
      edges: [{ from: "d1", to: "t1", relation: CAUSAL_EDGE_RELATION_V0.ENABLES }],
      stats: { compressionRatio: 0.3 }
    };
    const report = detectTruthLossV0(raw, compressed);
    expect(report.pass).toBe(false);
    expect(report.weakenedPaths.some((p) => p.code === "causal_edge_semantic_loss")).toBe(true);
    expect(report.selfExplanation).toContain("Semantic truth loss");
  });

  it("detects critical node kind loss under aggressive pruning", () => {
    const raw = {
      nodes: [
        { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world", atMs: 1 },
        { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, domain: "world", atMs: 2 }
      ],
      edges: []
    };
    const compressed = {
      nodes: [{ id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world", atMs: 1 }],
      edges: [],
      stats: { compressionRatio: 0.5 }
    };
    const report = detectTruthLossV0(raw, compressed);
    expect(report.criticalLosses.length).toBeGreaterThan(0);
    expect(report.pass).toBe(false);
  });

  it("passes for policy-bounded compression when critical skeleton preserved", () => {
    const raw = {
      nodes: [
        ...Array.from({ length: 200 }, (_, i) => ({
          id: `trail_${i}`,
          kind: "temporal_trail",
          domain: "world",
          label: `poi:${i}`,
          atMs: i
        })),
        {
          id: "d1",
          kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
          domain: "world",
          label: "t0→world",
          atMs: 9999
        },
        {
          id: "t1",
          kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
          domain: "world",
          label: "open_world_map → act",
          atMs: 10000
        }
      ],
      edges: Array.from({ length: 60 }, (_, i) => ({
        from: `trail_${i}`,
        to: `trail_${i + 1}`,
        relation: CAUSAL_EDGE_RELATION_V0.TRAILS
      }))
    };
    const compressed = compressCausalGraphV0(raw);
    const report = detectTruthLossV0(raw, compressed);
    expect(report.policyBoundedCompression).toBe(true);
    expect(report.criticalSkeletonPreserved).toBe(true);
    expect(report.pass).toBe(true);
    expect(report.selfExplanation).toContain("No semantic truth loss");
  });

  it("reports domain influence degradation", () => {
    const raw = {
      nodes: Array.from({ length: 10 }, (_, i) => ({
        id: `w_${i}`,
        kind: "temporal_trail",
        domain: "world",
        atMs: i
      })),
      edges: []
    };
    const compressed = {
      nodes: [{ id: "w_0", kind: "temporal_trail", domain: "world", atMs: 0 }],
      edges: [],
      stats: { compressionRatio: 0.9 }
    };
    const report = detectTruthLossV0(raw, compressed);
    const world = report.domainInfluence.find((d) => d.domain === "world");
    expect(world?.degraded).toBe(true);
  });
});
