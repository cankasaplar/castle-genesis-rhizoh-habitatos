import { describe, expect, it, beforeEach } from "vitest";
import { TRUTH_TRACE_KIND_V0 } from "../rhizohTruthTraceLayerV0.js";
import {
  clearIdentityManifestProjectionForTestV0,
  IDENTITY_MANIFEST_CONTINUITY_VERDICT_V0,
  IDENTITY_MANIFEST_PHASE_V0,
  IDENTITY_MANIFEST_PROJECTION_SCHEMA_V0,
  mountIdentityManifestConsoleV0,
  projectIdentityManifestV0
} from "../identityManifestProjectionV0.js";
import { clearEpistemicIdentityContinuityForTestV0 } from "../epistemicIdentityContinuityV0.js";
import { __resetIdentityEventLogForTestV0 } from "../rhizohIdentityEventLogV0.js";
import { __resetIdentityLifecycleForTestV0 } from "../rhizohIdentityLifecycleV0.js";

function mockCausalMapV0() {
  return {
    nodeCount: 3,
    edgeCount: 2,
    compressed: true,
    nodes: [
      { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world.space" },
      { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, label: "chess_cluster_tick" },
      { id: "s1", kind: TRUTH_TRACE_KIND_V0.SPATIAL_NODE, label: "spatial:chess_arena" }
    ],
    edges: [{ from: "d1", to: "t1" }, { from: "t1", to: "s1" }],
    causalMapRaw: {
      nodeCount: 4,
      edgeCount: 3,
      nodes: [
        { id: "d1", kind: TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, domain: "world.space" },
        { id: "t1", kind: TRUTH_TRACE_KIND_V0.TENSOR_DECISION, label: "chess_cluster_tick" },
        { id: "c1", kind: TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE, label: "chess_cluster_move" },
        { id: "s1", kind: TRUTH_TRACE_KIND_V0.SPATIAL_NODE, label: "spatial:chess_arena" }
      ],
      edges: []
    },
    selfNarrative: "Causal graph: 3 nodes."
  };
}

describe("identityManifestProjectionV0 (Phase 1 read-only)", () => {
  beforeEach(() => {
    clearIdentityManifestProjectionForTestV0();
    clearEpistemicIdentityContinuityForTestV0();
    __resetIdentityEventLogForTestV0();
    __resetIdentityLifecycleForTestV0();
  });

  it("projects read-only manifest from causal map without mutating identity pipeline", () => {
    const manifest = projectIdentityManifestV0({ causalMap: mockCausalMapV0() });

    expect(manifest.schema).toBe(IDENTITY_MANIFEST_PROJECTION_SCHEMA_V0);
    expect(manifest.phase).toBe(IDENTITY_MANIFEST_PHASE_V0);
    expect(manifest.subjectId).toBe("unbound");
    expect(manifest.continuityVerdict).toBe(IDENTITY_MANIFEST_CONTINUITY_VERDICT_V0);
    expect(manifest.interpretationOnly).toBe(true);
    expect(manifest.readOnly).toBe(true);
    expect(manifest.influencesExecution).toBe(false);
    expect(manifest.causalSummary.nodeCount).toBe(3);
    expect(manifest.causalSummary.chessAnchors.length).toBeGreaterThanOrEqual(1);
    expect(manifest.identityPipeline.eventLogCount).toBe(0);
    expect(manifest.identityPipeline.eventPipelineWired).toBe(false);
    expect(manifest.identityPipeline.pipelineNote).toContain("not routed");
  });

  it("mounts console API before first project()", () => {
    mountIdentityManifestConsoleV0();
    expect(typeof window.__rhizoh?.identityManifest?.project).toBe("function");
    expect(window.__rhizoh.identityManifest.last()).toBeNull();
    const manifest = window.__rhizoh.identityManifest.project({
      causalMap: mockCausalMapV0()
    });
    expect(manifest.schema).toBe(IDENTITY_MANIFEST_PROJECTION_SCHEMA_V0);
    expect(window.__rhizoh.identityManifest.last()).toBe(manifest);
  });
});
