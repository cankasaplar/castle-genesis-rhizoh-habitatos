import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSpatialTruthValidatorForTestV0,
  auditSpatialRegistryTruthV0,
  OPTIMISTIC_WRITE_CONFIDENCE_FLOOR_V0,
  scoreSpatialProjectionConfidenceV0,
  SPATIAL_TRUTH_VERDICT_V0,
  validateSpatialProjectionCandidateV0
} from "../spatialTruthValidatorV0.js";
import { registerSpatialNodeV0, __resetSpatialNodeLayerForTestV0, SPATIAL_NODE_TIER_V0 } from "../rhizohSpatialNodeLayerV0.js";

describe("spatialTruthValidatorV0", () => {
  beforeEach(() => {
    __resetSpatialTruthValidatorForTestV0();
    __resetSpatialNodeLayerForTestV0();
    window.__rhizoh = { causalMap: { nodes: [{ id: "n1", kind: "substrate", atMs: 1000 }], edges: [] } };
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
    window.__CASTLE_CESIUM__ = { ready: true, commandReady: true };
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CESIUM__;
    vi.unstubAllEnvs();
  });

  it("strict pass when causal backing + real anchor + cesium ready", () => {
    const v = validateSpatialProjectionCandidateV0({
      causalNodeId: "n1",
      spatialVector: { x: 0.1, y: 0.2, z: 0.9 },
      atMs: 1000,
      causalMap: window.__rhizoh.causalMap,
      cesiumReady: true
    });
    expect(v.verdict).toBe(SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS);
    expect(v.allowWrite).toBe(true);
  });

  it("optimistic pass on force flush pre-cesium when confidence sufficient", () => {
    const v = validateSpatialProjectionCandidateV0({
      causalNodeId: "n1",
      spatialVector: { x: 0.1, y: 0.2, z: 0.9 },
      atMs: 1000,
      force: true,
      cesiumReady: false,
      causalMap: window.__rhizoh.causalMap
    });
    expect(v.confidence).toBeGreaterThanOrEqual(OPTIMISTIC_WRITE_CONFIDENCE_FLOOR_V0);
    expect([SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS, SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS]).toContain(
      v.verdict
    );
  });

  it("rejects missing causal backing", () => {
    const scored = scoreSpatialProjectionConfidenceV0({
      causalNodeId: "ghost",
      spatialVector: { x: 0, y: 0, z: 1 },
      causalMap: window.__rhizoh.causalMap
    });
    expect(scored.issues).toContain("causal_node_not_in_map");
  });

  it("audits registry and flags ghost spatial nodes", () => {
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "causal_n1", {
      kind: "causal_projection",
      causalNodeId: "n1",
      spatial_vector: { x: 0.1, y: 0.2, z: 0.9 },
      atMs: 1000
    });
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "ghost_node", {
      kind: "causal_projection",
      causalNodeId: "missing",
      spatial_vector: { x: 0, y: 0, z: 0 },
      atMs: 2000
    });
    const audit = auditSpatialRegistryTruthV0(window.__rhizoh.causalMap);
    expect(audit.spatialNodeCount).toBe(2);
    expect(audit.ghostCount).toBeGreaterThan(0);
    expect(window.__rhizoh.spatialTruthValidator).toBeDefined();
  });

  it("strict mode blocks optimistic writes", () => {
    vi.stubEnv("VITE_SPATIAL_TRUTH_STRICT", "1");
    const v = validateSpatialProjectionCandidateV0({
      causalNodeId: "n1",
      spatialVector: { x: 0.1, y: 0.2, z: 0.9 },
      force: true,
      cesiumReady: false,
      causalMap: window.__rhizoh.causalMap
    });
    if (v.verdict === SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS) {
      expect(v.allowWrite).toBe(false);
    }
  });
});
