import { describe, expect, it } from "vitest";
import {
  createEpistemicSimulationRuntimeV0,
  executeFieldShaderRuntimeV0,
  runEpistemicSimulationHarnessV0,
  stepCesiumFieldDeformationV0,
  stepDisagreementSimulationV0,
  tickEpistemicSimulationV0,
  traceTemporalCausalityV0
} from "../epistemicRuntimeGpuKernelV0.js";
import { compileEpistemicRenderFromObservationsV0 } from "../epistemicRenderingEngineV0.js";
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

const BASE = {
  livingWorldId: WORLD,
  observations: [obs("node:barcelona"), obs("node:istanbul", 0.03)],
  topologyEdges: [{ from: "node:barcelona", to: "node:istanbul", trustWeight: 0.9 }],
  networkExecutorNodeId: "node:istanbul"
};

describe("epistemicRuntimeGpuKernelV0 (Phase 9.4 RESEARCH-ONLY)", () => {
  it("creates simulation runtime from render packet", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    expect(rt.truthCollapsed).toBe(false);
    expect(rt.shaderRuntime.drawCalls).toBe(0);
    expect(rt.manifoldSimulation.focusNodeId).toBeTruthy();
    expect(rt.causalityTracer.activeRayId).toBeTruthy();
    expect(rt.terrainEngine.frameSamples.length).toBe(2);
  });

  it("shader runtime tick updates u_time without truth collapse", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    const r1 = executeFieldShaderRuntimeV0(rt.shaderRuntime, 16, 16);
    const r2 = executeFieldShaderRuntimeV0(rt.shaderRuntime, 16, 32);
    expect(r2.uniforms.u_time).toBeGreaterThan(r1.uniforms.u_time);
    expect(r2.truthCollapsed).toBe(false);
    expect(rt.shaderRuntime.drawCalls).toBe(2);
  });

  it("manifold simulation navigates without merging truths", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    const step = stepDisagreementSimulationV0(
      rt.manifoldSimulation,
      packet.channels.disagreementManifold,
      { navigateTo: "node:istanbul" }
    );
    expect(step.focusNodeId).toBe("node:istanbul");
    expect(step.pluralismPreserved).toBe(true);
    expect(rt.manifoldSimulation.visitHistory.length).toBe(1);
  });

  it("causality tracer produces stepped events toward executor", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    const trace = traceTemporalCausalityV0(rt.causalityTracer, packet.channels.temporalRayCast, {
      maxSteps: 5
    });
    expect(trace.events.length).toBe(5);
    expect(trace.events[4].towardExecutorId).toBe("node:istanbul");
    expect(trace.truthCollapsed).toBe(false);
  });

  it("cesium field engine advances deformation frames", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    const f1 = stepCesiumFieldDeformationV0(rt.terrainEngine, 1, 0.2);
    const f2 = stepCesiumFieldDeformationV0(rt.terrainEngine, 2, 0.2);
    expect(f2.frame).toBe(2);
    expect(f2.maxOffsetMeters).toBeGreaterThan(0);
    expect(f1.truthCollapsed).toBe(false);
  });

  it("master tick runs all kernels in one frame", () => {
    const packet = compileEpistemicRenderFromObservationsV0(BASE);
    const rt = createEpistemicSimulationRuntimeV0(packet);
    const out = tickEpistemicSimulationV0(rt, {
      dtMs: 16,
      manifoldInput: { navigateTo: "node:barcelona" }
    });
    expect(out.frame).toBe(1);
    expect(out.kernels.shader).toBeTruthy();
    expect(out.kernels.manifold).toBeTruthy();
    expect(out.kernels.causality).toBeTruthy();
    expect(out.kernels.terrain).toBeTruthy();
    expect(out.truthCollapsed).toBe(false);
  });

  it("harness runs multi-tick simulation", () => {
    const { runtime, outputs, finalFrame } = runEpistemicSimulationHarnessV0(BASE, { ticks: 12 });
    expect(finalFrame).toBe(12);
    expect(outputs).toHaveLength(12);
    expect(runtime.causalityTracer.traces.length).toBeGreaterThan(0);
  });
});
