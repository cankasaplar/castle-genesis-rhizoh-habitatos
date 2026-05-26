/**
 * RESEARCH-ONLY: Phase 9.4 — Epistemic Runtime GPU Kernel
 *
 * Render packet → interactive simulation runtime (not execution authority):
 * - fieldShader → shader execution tick loop
 * - disagreementManifold → interactive simulation layer
 * - temporalRayCast → live causality tracing
 * - cesiumTerrain → real-time field deformation frames
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import { EPISTEMIC_RENDER_INVARIANT_V0 } from "./epistemicRenderingEngineV0.js";
import { compileEpistemicRenderFromObservationsV0 } from "./epistemicRenderingEngineV0.js";
import { EXECUTION_CONVERGENCE_INVARIANT_V0 } from "./epistemicExecutionInvariantsV0.js";

export const EPISTEMIC_RUNTIME_GPU_KERNEL_SCHEMA_V0 =
  "castle.rhizoh.epistemic_runtime_gpu_kernel.research.v0.4";

export const SIMULATION_TICK_MODE_V0 = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused"
});

/**
 * @typedef {Object} EpistemicSimulationRuntimeV0
 * @property {string} schema
 * @property {string} runtimeId
 * @property {import('./epistemicRenderingEngineV0.js').ReturnType<compileEpistemicRenderFromObservationsV0>} renderPacket
 * @property {object} shaderRuntime
 * @property {object} manifoldSimulation
 * @property {object} causalityTracer
 * @property {object} terrainEngine
 * @property {number} frame
 * @property {number} simTimeMs
 * @property {string} mode
 */

/**
 * @param {import('./epistemicRenderingEngineV0.js').ReturnType<compileEpistemicRenderFromObservationsV0>} renderPacket
 * @param {{ nowMs?: number }} [opts]
 */
export function createEpistemicSimulationRuntimeV0(renderPacket, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const runtimeId = foldWalSegmentHashV0(renderPacket.renderId, { layer: "sim_runtime_v0.4" });

  return {
    schema: EPISTEMIC_RUNTIME_GPU_KERNEL_SCHEMA_V0,
    runtimeId,
    renderPacket,
    frame: 0,
    simTimeMs: 0,
    mode: SIMULATION_TICK_MODE_V0.IDLE,
    truthCollapsed: false,
    invariants: {
      render: EPISTEMIC_RENDER_INVARIANT_V0.statement,
      execution: EXECUTION_CONVERGENCE_INVARIANT_V0.statement
    },
    shaderRuntime: initShaderExecutionRuntimeV0(renderPacket.channels.fieldShader, nowMs),
    manifoldSimulation: initDisagreementSimulationV0(renderPacket.channels.disagreementManifold),
    causalityTracer: initCausalityTracerV0(renderPacket.channels.temporalRayCast),
    terrainEngine: initCesiumFieldEngineV0(renderPacket.channels.cesiumTerrain),
    createdAtMs: nowMs
  };
}

function initShaderExecutionRuntimeV0(fieldShader, nowMs) {
  return {
    kind: "shader_execution_runtime",
    shaderId: fieldShader.shaderId,
    uniforms: { ...fieldShader.uniforms, u_time: 0 },
    phase: 0,
    lastTickMs: nowMs,
    drawCalls: 0,
    truthCollapsed: false
  };
}

function initDisagreementSimulationV0(manifold) {
  return {
    kind: "disagreement_simulation_layer",
    focusNodeId: manifold.defaultFocusNodeId,
    activeRouteId: manifold.routes[0]?.routeId ?? null,
    visitHistory: [],
    panelStates: manifold.panels.map((p) => ({ panelId: p.panelId, expanded: false })),
    interactionCount: 0,
    truthCollapsed: false
  };
}

function initCausalityTracerV0(rayCast) {
  return {
    kind: "causality_tracer",
    executorNodeId: rayCast.executorNodeId,
    traces: [],
    activeRayId: rayCast.rays[0]?.rayId ?? null,
    stepIndex: 0,
    truthCollapsed: false
  };
}

function initCesiumFieldEngineV0(terrain) {
  return {
    kind: "cesium_field_deformation_engine",
    anchor: terrain.anchor,
    maxDisplacementMeters: terrain.maxDisplacementMeters,
    frameSamples: terrain.samples.map((s) => ({ ...s })),
    heightmap: [...terrain.heightmap.normalized],
    deformationFrame: 0,
    truthCollapsed: false
  };
}

/**
 * GPU-kernel style shader tick — updates uniforms, never elects truth.
 *
 * @param {EpistemicSimulationRuntimeV0["shaderRuntime"]} shaderRuntime
 * @param {number} dtMs
 * @param {number} simTimeMs
 */
export function executeFieldShaderRuntimeV0(shaderRuntime, dtMs, simTimeMs) {
  const tension = Number(shaderRuntime.uniforms.u_epistemicTension) || 0;
  const coherence = Number(shaderRuntime.uniforms.u_coherenceGradient) || 1;
  const phase = shaderRuntime.phase + dtMs * 0.001 * (0.5 + tension * 0.5);
  const pulse = Math.sin(phase) * 0.04 * (1 - coherence);

  shaderRuntime.uniforms = {
    ...shaderRuntime.uniforms,
    u_time: simTimeMs,
    u_epistemicTension: Math.max(0, Math.min(1, tension + pulse)),
    u_coherenceGradient: Math.max(0, Math.min(1, coherence - pulse * 0.25))
  };
  shaderRuntime.phase = phase;
  shaderRuntime.drawCalls += 1;
  shaderRuntime.lastTickMs = simTimeMs;

  return {
    kind: "shader_tick_result",
    uniforms: shaderRuntime.uniforms,
    drawCalls: shaderRuntime.drawCalls,
    truthCollapsed: false
  };
}

/**
 * @param {EpistemicSimulationRuntimeV0["manifoldSimulation"]} simulation
 * @param {import('./epistemicRenderingEngineV0.js').ReturnType<compileDisagreementManifoldV0> extends never ? never : object} manifold
 * @param {{ navigateTo?: string, focusNodeId?: string }} input
 */
export function stepDisagreementSimulationV0(simulation, manifold, input = {}) {
  if (input.focusNodeId) {
    simulation.focusNodeId = input.focusNodeId;
  }
  if (input.navigateTo) {
    const route = manifold.routes.find((r) => r.to === input.navigateTo || r.from === input.navigateTo);
    if (route) {
      simulation.activeRouteId = route.routeId;
      simulation.focusNodeId = input.navigateTo;
      simulation.visitHistory.push({
        atMs: Date.now(),
        routeId: route.routeId,
        nodeId: input.navigateTo
      });
    }
  }
  simulation.interactionCount += 1;

  return {
    kind: "manifold_simulation_step",
    focusNodeId: simulation.focusNodeId,
    activeRouteId: simulation.activeRouteId,
    visitCount: simulation.visitHistory.length,
    pluralismPreserved: true,
    truthCollapsed: false
  };
}

/**
 * Live causality tracing along temporal rays (governance geometry).
 *
 * @param {EpistemicSimulationRuntimeV0["causalityTracer"]} tracer
 * @param {import('./epistemicRenderingEngineV0.js').ReturnType<compileTemporalRayCastV0> extends never ? never : object} rayCast
 * @param {{ maxSteps?: number, dtMs?: number }} [opts]
 */
export function traceTemporalCausalityV0(tracer, rayCast, opts = {}) {
  const maxSteps = Math.max(1, Number(opts.maxSteps) || 8);
  const dtMs = Number(opts.dtMs) || 16;
  const ray = rayCast.rays.find((r) => r.rayId === tracer.activeRayId) || rayCast.rays[0];
  if (!ray) {
    return { kind: "causality_trace_empty", events: [], truthCollapsed: false };
  }

  const events = [];
  const steps = Math.min(maxSteps, 32);
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    events.push({
      step: tracer.stepIndex + i,
      t,
      position: {
        x: ray.origin.x + ray.direction.x * ray.length * t,
        y: ray.origin.y + ray.direction.y * ray.length * t,
        z: ray.origin.z + ray.direction.z * t
      },
      causalWeight: ray.temporalWeight * t,
      fromNodeId: ray.origin.nodeId,
      towardExecutorId: ray.targetExecutorId,
      atSimMs: tracer.stepIndex * dtMs + i * dtMs
    });
  }

  tracer.traces = [...tracer.traces, ...events].slice(-128);
  tracer.stepIndex += steps;

  return {
    kind: "causality_trace_batch",
    events,
    executorNodeId: rayCast.executorNodeId,
    truthCollapsed: false,
    statement: "Causality trace — governance pull path, not WAL replay proof."
  };
}

/**
 * Real-time terrain deformation frame (research — Cesium consumer hook).
 *
 * @param {EpistemicSimulationRuntimeV0["terrainEngine"]} engine
 * @param {number} frameIndex
 * @param {number} tension
 */
export function stepCesiumFieldDeformationV0(engine, frameIndex, tension) {
  const wobble = Math.sin(frameIndex * 0.07) * 0.03 * (0.5 + tension);
  engine.frameSamples = engine.frameSamples.map((s) => ({
    ...s,
    heightOffsetMeters: Math.max(0, s.heightOffsetMeters * (1 + wobble))
  }));
  engine.heightmap = engine.heightmap.map((h, i) => {
    const sample = engine.frameSamples[i % engine.frameSamples.length];
    return sample ? sample.heightOffsetMeters / engine.maxDisplacementMeters : h;
  });
  engine.deformationFrame = frameIndex;

  return {
    kind: "cesium_deformation_frame",
    frame: frameIndex,
    maxOffsetMeters: Math.max(...engine.frameSamples.map((s) => s.heightOffsetMeters)),
    sampleCount: engine.frameSamples.length,
    truthCollapsed: false
  };
}

/**
 * Master simulation tick — all kernels advance in parallel; execution axis unchanged.
 *
 * @param {EpistemicSimulationRuntimeV0} runtime
 * @param {{ dtMs?: number, manifoldInput?: { navigateTo?: string }, nowMs?: number }} [opts]
 */
export function tickEpistemicSimulationV0(runtime, opts = {}) {
  const dtMs = Number(opts.dtMs) || 16;
  const nowMs = Number(opts.nowMs) || Date.now();
  runtime.mode = SIMULATION_TICK_MODE_V0.RUNNING;
  runtime.frame += 1;
  runtime.simTimeMs += dtMs;

  const packet = runtime.renderPacket;
  const tension = Number(runtime.shaderRuntime.uniforms.u_epistemicTension) || 0;

  const shader = executeFieldShaderRuntimeV0(runtime.shaderRuntime, dtMs, runtime.simTimeMs);
  const manifold = stepDisagreementSimulationV0(
    runtime.manifoldSimulation,
    packet.channels.disagreementManifold,
    opts.manifoldInput || {}
  );
  const causality = traceTemporalCausalityV0(
    runtime.causalityTracer,
    packet.channels.temporalRayCast,
    { maxSteps: 4, dtMs }
  );
  const terrain = stepCesiumFieldDeformationV0(runtime.terrainEngine, runtime.frame, tension);

  return {
    schema: EPISTEMIC_RUNTIME_GPU_KERNEL_SCHEMA_V0,
    runtimeId: runtime.runtimeId,
    frame: runtime.frame,
    simTimeMs: runtime.simTimeMs,
    truthCollapsed: false,
    kernels: { shader, manifold, causality, terrain },
    statement: "Interactive epistemic simulation tick — renders and simulates fields, does not execute world."
  };
}

/**
 * @param {Parameters<typeof compileEpistemicRenderFromObservationsV0>[0]} input
 * @param {{ ticks?: number, dtMs?: number, geo?: object }} [opts]
 */
export function runEpistemicSimulationHarnessV0(input, opts = {}) {
  const packet = compileEpistemicRenderFromObservationsV0(input, { geo: opts.geo });
  const runtime = createEpistemicSimulationRuntimeV0(packet);
  const ticks = Math.max(1, Number(opts.ticks) || 10);
  const outputs = [];
  for (let i = 0; i < ticks; i++) {
    outputs.push(tickEpistemicSimulationV0(runtime, { dtMs: opts.dtMs || 16 }));
  }
  return { runtime, outputs, finalFrame: runtime.frame };
}
