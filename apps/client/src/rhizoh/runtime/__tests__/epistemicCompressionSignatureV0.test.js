import { describe, expect, it } from "vitest";
import {
  buildEpistemicCompressionSignatureV0,
  derivePatternClusterIdentitiesV0,
  deriveTraceSemanticFingerprintV0,
  deriveTopologyDriftSignatureV0,
  EPISTEMIC_COMPRESSION_MODE_V0
} from "../epistemicCompressionSignatureV0.js";
import { EPISTEMIC_EVENT_CLASS_V0 } from "../epistemicEventBusV0.js";

describe("epistemicCompressionSignatureV0 (9.4.5)", () => {
  it("deriveTraceSemanticFingerprintV0 is deterministic", () => {
    const trace = [
      { seq: 1, eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS, kind: "a", nodeId: "n", severity: 0.5 },
      { seq: 2, eventClass: EPISTEMIC_EVENT_CLASS_V0.OBSERVER, kind: "b", nodeId: "n", severity: 0 }
    ];
    const a = deriveTraceSemanticFingerprintV0(trace);
    const b = deriveTraceSemanticFingerprintV0(trace);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.fingerprint.startsWith("epi_trace_fp_")).toBe(true);
  });

  it("derivePatternClusterIdentitiesV0 groups by pattern kind", () => {
    const clusters = derivePatternClusterIdentitiesV0([
      { id: "p1", kind: "coherence_collapse_burst", severity: 0.6, evidenceSeqs: [1, 2] },
      { id: "p2", kind: "coherence_collapse_burst", severity: 0.4, evidenceSeqs: [3] }
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].memberPatternIds).toEqual(["p1", "p2"]);
    expect(clusters[0].clusterSignature.startsWith("epi_pcluster_")).toBe(true);
  });

  it("deriveTopologyDriftSignatureV0 uses physics snapshots", () => {
    const topo = deriveTopologyDriftSignatureV0(
      [
        {
          seq: 1,
          eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
          kind: "terrain_stress_peak",
          nodeId: "node:istanbul",
          severity: 0.8,
          physicsSnapshot: { navigationalGravity: 0.4, movementCost: 3.2 }
        }
      ],
      { coherenceGradient: 0.7, epistemicSplitBrainScore: 0.5, stabilizationMode: "parallel_hold" }
    );
    expect(topo.topologySignature.startsWith("epi_topo_")).toBe(true);
    expect(topo.coherenceDriftSlope).not.toBeNull();
    expect(topo.nodeStressMap["node:istanbul"]).toBeGreaterThan(0);
  });

  it("buildEpistemicCompressionSignatureV0 is read-only frozen report", () => {
    const sig = buildEpistemicCompressionSignatureV0({
      trace: [{ seq: 1, eventClass: "physics", kind: "k", nodeId: "n", severity: 0.1 }],
      analysisReport: {
        patterns: [{ id: "x", kind: "test_pattern", severity: 0.2, evidenceSeqs: [1] }],
        summary: { dominantPattern: "test_pattern" }
      },
      simSnapshot: null
    });
    expect(sig.mode).toBe(EPISTEMIC_COMPRESSION_MODE_V0);
    expect(sig.witnessWrite).toBe(false);
    expect(sig.executionWrite).toBe(false);
    expect(sig.composedSignature.startsWith("epi_sig_")).toBe(true);
    expect(Object.isFrozen(sig)).toBe(true);
  });
});
