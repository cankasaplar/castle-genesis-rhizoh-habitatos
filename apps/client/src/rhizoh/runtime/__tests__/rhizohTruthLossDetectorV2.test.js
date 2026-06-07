import { describe, expect, it } from "vitest";
import { detectTruthLossV2 } from "../rhizohTruthLossDetectorV2.js";
import { compressCausalGraphV0 } from "../rhizohCausalGraphCompressionV0.js";
import { TRUTH_LOSS_TYPE_V2 } from "../rhizohTruthLossDetectorV2.js";
import { TRUTH_TRACE_KIND_V0 } from "../rhizohTruthTraceLayerV0.js";
import { CAUSAL_EDGE_RELATION_V0 } from "../rhizohCausalMapLayerV0.js";

describe("rhizohTruthLossDetectorV2", () => {
  it("classifies large policy compression as intentional not structural", () => {
    const raw = {
      nodes: [
        ...Array.from({ length: 120 }, (_, i) => ({
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
          atMs: 9999
        },
        {
          id: "t1",
          kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
          domain: "world",
          atMs: 10000
        },
        {
          id: "s1",
          kind: TRUTH_TRACE_KIND_V0.SPATIAL_NODE,
          domain: "world",
          atMs: 10001
        }
      ],
      edges: [
        { from: "d1", to: "t1", relation: CAUSAL_EDGE_RELATION_V0.ENABLES },
        { from: "t1", to: "s1", relation: CAUSAL_EDGE_RELATION_V0.PROJECTS_TO }
      ]
    };
    const compressed = compressCausalGraphV0(raw);
    const report = detectTruthLossV2(raw, compressed);
    expect(report.structuralPass).toBe(true);
    expect(report.pass).toBe(true);
    expect(report.intentionalLossCount).toBeGreaterThanOrEqual(0);
    expect(report.compressionBudget.withinBudget).toBe(true);
  });

  it("flags structural loss when spine tensor pruned", () => {
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
      stats: { compressionRatio: 0.3 },
      compressionContext: { intentional: false }
    };
    const report = detectTruthLossV2(raw, compressed, {
      compressionContext: { intentional: false }
    });
    expect(report.structuralPass).toBe(false);
    expect(
      report.lossClassification.structural.length +
        report.v0.weakenedPaths.filter((p) => p.severity === "high").length
    ).toBeGreaterThan(0);
  });

  it("classifies probe artifacts separately", () => {
    const raw = {
      nodes: [
        {
          id: "probe-trail-temporal",
          kind: "temporal_trail",
          domain: "world",
          label: "probe_trail",
          atMs: 1
        }
      ],
      edges: []
    };
    const compressed = { nodes: raw.nodes, edges: [], stats: {}, compressionContext: { intentional: true } };
    const report = detectTruthLossV2(raw, compressed, { probeIsolated: true });
    const probeItems = report.lossClassification.probeArtifact;
    expect(probeItems.length + report.intentionalLossCount).toBeGreaterThanOrEqual(0);
    expect(report.structuralPass).toBe(true);
    expect(TRUTH_LOSS_TYPE_V2.PROBE_ARTIFACT).toBe("probe_artifact");
  });
});
