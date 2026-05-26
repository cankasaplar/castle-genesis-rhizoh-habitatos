import { describe, expect, it } from "vitest";
import {
  compileCesiumTerrainDeformationV0,
  compileDisagreementManifoldV0,
  compileEpistemicRenderFromObservationsV0,
  compileFieldShaderUniformsV0,
  compileTemporalRayCastV0,
  EPISTEMIC_FIELD_SHADER_ID_V0
} from "../epistemicRenderingEngineV0.js";
import { compileEpistemicTopologyFromObservationsV0 } from "../epistemicTopologyCompilerV0.js";
import { deriveEpistemicFingerprintV0, IDENTITY_CONTINUITY_VERDICT_V0 } from "../epistemicIdentityContinuityV0.js";

const WORLD = "world:mediterranean";

function obs(nodeId, w = 0) {
  return {
    nodeId,
    verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
    confidence: 0.7 + w,
    fingerprint: deriveEpistemicFingerprintV0({
      livingWorldId: WORLD,
      issuancePath: "canonical_chain",
      lineageRoot: "lineage:shared",
      witnessAnchor: { weight: 4 + w, class: "gateway" }
    }),
    lineageEquivalent: true
  };
}

describe("epistemicRenderingEngineV0 (Phase 9.3 RESEARCH-ONLY)", () => {
  const baseInput = {
    livingWorldId: WORLD,
    observations: [obs("node:barcelona"), obs("node:istanbul", 0.04)],
    topologyEdges: [{ from: "node:barcelona", to: "node:istanbul", trustWeight: 0.9 }],
    networkExecutorNodeId: "node:istanbul"
  };

  it("compiles full render packet with four channels", () => {
    const packet = compileEpistemicRenderFromObservationsV0(baseInput, {
      geo: { anchorLon: 2.17, anchorLat: 41.38 }
    });

    expect(packet.truthCollapsed).toBe(false);
    expect(packet.channels.fieldShader.shaderId).toBe(EPISTEMIC_FIELD_SHADER_ID_V0);
    expect(packet.channels.disagreementManifold.routes.length).toBeGreaterThan(0);
    expect(packet.channels.cesiumTerrain.samples.length).toBe(2);
    expect(packet.channels.temporalRayCast.rays.length).toBe(1);
    expect(packet.channels.temporalRayCast.executorNodeId).toBe("node:istanbul");
  });

  it("field shader uniforms track split-brain tension", () => {
    const topology = compileEpistemicTopologyFromObservationsV0(baseInput);
    const shader = compileFieldShaderUniformsV0(topology);
    expect(shader.uniforms.u_epistemicTension).toBe(topology.meta.epistemicSplitBrainScore);
    expect(shader.uniforms.u_coherenceGradient).toBe(topology.meta.coherenceGradient);
  });

  it("disagreement manifold exposes navigable routes and panels", () => {
    const topology = compileEpistemicTopologyFromObservationsV0(baseInput);
    const manifold = compileDisagreementManifoldV0(topology);
    expect(manifold.panels).toHaveLength(2);
    expect(manifold.routes.every((r) => r.navigable)).toBe(true);
    expect(manifold.ensembleHub.verdict).toBeTruthy();
  });

  it("cesium deformation maps stress to height offsets", () => {
    const topology = compileEpistemicTopologyFromObservationsV0(baseInput);
    const terrain = compileCesiumTerrainDeformationV0(topology);
    const maxOffset = Math.max(...terrain.samples.map((s) => s.heightOffsetMeters));
    expect(maxOffset).toBeGreaterThan(0);
    expect(terrain.heightmap.normalized.length).toBeGreaterThan(0);
  });

  it("temporal ray cast aims at executor", () => {
    const topology = compileEpistemicTopologyFromObservationsV0(baseInput);
    const rays = compileTemporalRayCastV0(topology);
    expect(rays.rays[0].targetExecutorId).toBe("node:istanbul");
    expect(rays.convergencePoint?.nodeId).toBe("node:istanbul");
  });
});
