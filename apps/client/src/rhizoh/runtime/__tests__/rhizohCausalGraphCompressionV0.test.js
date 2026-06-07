import { describe, expect, it } from "vitest";
import { compressCausalGraphV0 } from "../rhizohCausalGraphCompressionV0.js";
import { TRUTH_TRACE_KIND_V0 } from "../rhizohTruthTraceLayerV0.js";

describe("rhizohCausalGraphCompressionV0", () => {
  it("collapses duplicate replay branches", () => {
    const raw = {
      nodes: [
        { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, domain: "world", label: "open_world_map → spatial_render_init", atMs: 100 },
        { id: "r1", kind: TRUTH_TRACE_KIND_V0.TENSOR_REPLAY, domain: "world", label: "replay:open_world_map", atMs: 101 }
      ],
      edges: []
    };
    const out = compressCausalGraphV0(raw);
    expect(out.stats.replayBranchesDropped).toBe(1);
    expect(out.nodes.some((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_REPLAY)).toBe(false);
  });

  it("clusters excess temporal trail nodes", () => {
    const trails = Array.from({ length: 10 }, (_, i) => ({
      id: `trail_${i}`,
      kind: "temporal_trail",
      domain: "world",
      label: `poi_fetch_trail:node-${i}`,
      atMs: 1000 + i
    }));
    const out = compressCausalGraphV0({ nodes: trails, edges: [] }, { maxNodes: 32 });
    expect(out.stats.temporalTrailClustered).toBeGreaterThan(0);
    expect(out.nodes.some((n) => n.kind === "temporal_trail_cluster")).toBe(true);
    expect(out.nodes.length).toBeLessThan(trails.length);
  });

  it("caps nodes and edges within policy limits", () => {
    const nodes = Array.from({ length: 80 }, (_, i) => ({
      id: `n_${i}`,
      kind: "temporal_trail",
      domain: "world",
      label: `x:${i}`,
      atMs: i
    }));
    const edges = Array.from({ length: 120 }, (_, i) => ({
      from: `n_${i}`,
      to: `n_${i + 1}`,
      relation: "trails"
    }));
    const out = compressCausalGraphV0({ nodes, edges }, { maxNodes: 16, maxEdges: 20 });
    expect(out.nodes.length).toBeLessThanOrEqual(16);
    expect(out.edges.length).toBeLessThanOrEqual(20);
    expect(out.influencesExecution).toBe(false);
  });

  it("preserves critical path nodes under pressure", () => {
    const nodes = [
      ...Array.from({ length: 40 }, (_, i) => ({
        id: `trail_${i}`,
        kind: "temporal_trail",
        domain: "world",
        label: `poi:${i}`,
        atMs: i
      })),
      { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world", label: "t0 → world", atMs: 9999 },
      { id: "ten1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, domain: "world", label: "open_world_map", atMs: 10000 }
    ];
    const out = compressCausalGraphV0({ nodes, edges: [] }, { maxNodes: 12 });
    expect(out.nodes.some((n) => n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION)).toBe(true);
    expect(out.nodes.some((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION)).toBe(true);
  });
});
