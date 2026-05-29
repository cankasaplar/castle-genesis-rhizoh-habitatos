/**
 * Phase 9.4.1 wire — rAF epistemic simulation loop + Cesium postRender hook.
 * Dynamically imports __research__ modules; gated by VITE_EPISTEMIC_SIM_RESEARCH.
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";
import {
  getEpistemicSimResearchSnapshotV0,
  setEpistemicSimResearchSnapshotV0
} from "./epistemicSimResearchStoreV0.js";
import { applyEpistemicSimToCesiumSceneV0 } from "../spatial/applyEpistemicSimToCesiumSceneV0.js";
import {
  clearEpistemicPerceptionMirrorV0,
  setEpistemicPerceptionMirrorV0
} from "./epistemicPerceptionMirrorV0.js";
import {
  clearEpistemicEventBusV0,
  getEpistemicEventTraceV0,
  publishEpistemicPhysicsEventsBatchV0,
  setEpistemicEventBusEnabledV0
} from "./epistemicEventBusV0.js";
import {
  maybeRefreshReplayFeedbackAnalysisV0,
  teardownEpistemicReplayAnalysisWireV0
} from "./epistemicReplayAnalysisWireV0.js";
import {
  maybeRefreshEpistemicCompressionSignatureV0,
  teardownEpistemicCompressionSignatureWireV0
} from "./epistemicCompressionSignatureWireV0.js";
import {
  clearCrossNodeResonanceWireV0,
  refreshCrossNodeCausalResonanceV0
} from "./sovereign/crossNodeResonanceWireV0.js";

export const EPISTEMIC_SIM_RESEARCH_WIRE_SCHEMA_V0 = "castle.rhizoh.epistemic_sim_research_wire.v0.4.1";

/**
 * @returns {boolean}
 */
export function isEpistemicSimResearchEnabledV0() {
  if (isCastleDebugGranularFlagEnabled("VITE_EPISTEMIC_SIM_RESEARCH")) return true;
  return isCastleDebugGranularFlagEnabled("VITE_EPISTEMIC_RENDER_RESEARCH");
}

/**
 * Build default Mediterranean twin-node observations from boot / window context.
 */
export function buildEpistemicSimObservationsFromContextV0() {
  const ctx = typeof window !== "undefined" ? window.__rhizoh_boot_context : null;
  const livingWorldId = ctx?.livingWorldId || "world:research";
  const localNode = String(
    (typeof window !== "undefined" && window.__rhizoh_node_id) ||
      ctx?.livingNodeId ||
      "node:istanbul"
  );
  const peerNode = localNode.includes("barcelona") ? "node:istanbul" : "node:barcelona";
  const checkpoint = Number(ctx?.targetTick) || 0;

  return {
    livingWorldId,
    observations: [
      {
        nodeId: localNode,
        verdict: "same_subject_low_confidence",
        confidence: 0.72,
        lineageEquivalent: true,
        bootSealVersion: checkpoint || 1,
        fingerprint: null
      },
      {
        nodeId: peerNode,
        verdict: "same_subject_low_confidence",
        confidence: 0.68,
        lineageEquivalent: true,
        bootSealVersion: checkpoint || 1,
        fingerprint: null
      }
    ],
    topologyEdges: [{ from: localNode, to: peerNode, trustWeight: 0.88 }],
    networkExecutorNodeId: localNode
  };
}

/** @type {{
 *   runtime: object | null,
 *   stopRaf: (() => void) | null,
 *   refCount: number,
 *   pendingManifoldNav: { navigateTo?: string, focusNodeId?: string } | null
 * }} */
const wireStateV0 = {
  runtime: null,
  stopRaf: null,
  refCount: 0,
  pendingManifoldNav: null
};

async function ensureResearchRuntimeV0() {
  if (wireStateV0.runtime) return wireStateV0.runtime;

  const { deriveEpistemicFingerprintV0 } = await import(
    "./continuity/__research__/epistemicIdentityContinuityV0.js"
  );
  const { compileEpistemicRenderFromObservationsV0 } = await import(
    "./continuity/__research__/epistemicRenderingEngineV0.js"
  );
  const { createEpistemicSimulationRuntimeV0, tickEpistemicSimulationV0 } = await import(
    "./continuity/__research__/epistemicRuntimeGpuKernelV0.js"
  );

  const input = buildEpistemicSimObservationsFromContextV0();
  input.observations = input.observations.map((o) => ({
    ...o,
    fingerprint: deriveEpistemicFingerprintV0({
      livingWorldId: input.livingWorldId,
      issuancePath: "canonical_chain",
      lineageRoot: "lineage:wire",
      witnessAnchor: { weight: o.confidence * 6, class: "gateway", decayRate: 0.06 }
    })
  }));

  const packet = compileEpistemicRenderFromObservationsV0(input, {
    geo: { anchorLon: 28.9784, anchorLat: 41.0082 }
  });
  wireStateV0.runtime = {
    sim: createEpistemicSimulationRuntimeV0(packet),
    tick: tickEpistemicSimulationV0,
    manifold: packet.channels.disagreementManifold
  };
  return wireStateV0.runtime;
}

async function publishSnapshotFromTickV0(tickOut, runtime) {
  const packet = runtime.sim.renderPacket;
  const snap = {
    frame: tickOut.frame,
    simTimeMs: tickOut.simTimeMs,
    epistemicSplitBrainScore: packet.meta.epistemicSplitBrainScore ?? 0,
    coherenceGradient: packet.meta.coherenceGradient ?? 1,
    focusNodeId: runtime.sim.manifoldSimulation.focusNodeId,
    executorNodeId: packet.channels.temporalRayCast.executorNodeId,
    stabilizationMode: packet.meta.stabilizationMode ?? null,
    allowConcurrentExecution: inferAllowConcurrentFromPacketV0(packet),
    terrainMaxOffsetMeters: tickOut.kernels?.terrain?.maxOffsetMeters ?? 0,
    causalityTraceCount: runtime.sim.causalityTracer.traces?.length ?? 0,
    shaderDrawCalls: runtime.sim.shaderRuntime.drawCalls,
    truthCollapsed: false
  };

  try {
    const { deriveCausalTerrainMutationV0 } = await import(
      "./continuity/__research__/causalTerrainMutationV0.js"
    );
    const mutation = deriveCausalTerrainMutationV0(snap, {
      visitCount: runtime.sim.manifoldSimulation.visitHistory?.length ?? 0
    });
    snap.navigationPhysics = mutation.physics;
    snap.physicsEvents = mutation.events;
    publishEpistemicPhysicsEventsBatchV0(mutation.events, {
      atFrame: snap.frame,
      focusNodeId: snap.focusNodeId,
      stabilizationMode: snap.stabilizationMode,
      physicsSnapshot: mutation.physics
    });
    const eventTrace = getEpistemicEventTraceV0();
    snap.eventBusSeqHead = eventTrace.length ? eventTrace[eventTrace.length - 1].seq : 0;
    setEpistemicPerceptionMirrorV0({
      enabled: true,
      simSnapshot: snap,
      navigationPhysics: mutation.physics,
      physicsEvents: mutation.events,
      eventTraceTail: eventTrace.slice(-8)
    });
  } catch {
    setEpistemicPerceptionMirrorV0({
      enabled: true,
      simSnapshot: snap,
      navigationPhysics: null,
      physicsEvents: []
    });
  }

  maybeRefreshReplayFeedbackAnalysisV0(snap.frame);
  maybeRefreshEpistemicCompressionSignatureV0(snap.frame);
  refreshCrossNodeCausalResonanceV0();

  setEpistemicSimResearchSnapshotV0(snap);
}

/**
 * Start global rAF simulation loop (ref-counted).
 * @returns {() => void} teardown
 */
export function startEpistemicSimResearchWireV0() {
  if (!isEpistemicSimResearchEnabledV0()) {
    return () => {};
  }

  setEpistemicEventBusEnabledV0(true);

  wireStateV0.refCount += 1;
  if (wireStateV0.stopRaf) {
    return () => stopEpistemicSimResearchWireV0();
  }

  let rafId = 0;
  let lastMs = 0;
  const frame = async (nowMs) => {
    rafId = requestAnimationFrame(frame);
    const dt = lastMs ? Math.min(48, nowMs - lastMs) : 16;
    lastMs = nowMs;
    try {
      const rt = await ensureResearchRuntimeV0();
      const nav = wireStateV0.pendingManifoldNav;
      wireStateV0.pendingManifoldNav = null;
      const tickOut = rt.tick(rt.sim, {
        dtMs: dt,
        nowMs,
        manifoldInput: nav || {}
      });
      await publishSnapshotFromTickV0(tickOut, rt);
    } catch {
      /* research wire must not break prod */
    }
  };

  void ensureResearchRuntimeV0().then(() => {
    rafId = requestAnimationFrame(frame);
  });

  wireStateV0.stopRaf = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastMs = 0;
  };

  return () => stopEpistemicSimResearchWireV0();
}

export function stopEpistemicSimResearchWireV0() {
  wireStateV0.refCount = Math.max(0, wireStateV0.refCount - 1);
  if (wireStateV0.refCount > 0) return;
  wireStateV0.stopRaf?.();
  wireStateV0.stopRaf = null;
  wireStateV0.runtime = null;
  setEpistemicEventBusEnabledV0(false);
  clearEpistemicEventBusV0();
  teardownEpistemicReplayAnalysisWireV0();
  teardownEpistemicCompressionSignatureWireV0();
  clearCrossNodeResonanceWireV0();
  clearEpistemicPerceptionMirrorV0();
}

/**
 * Queue manifold navigation for next tick (interactive simulation).
 * @param {string} nodeId
 */
export function navigateEpistemicSimManifoldV0(nodeId) {
  if (!isEpistemicSimResearchEnabledV0()) return;
  wireStateV0.pendingManifoldNav = { navigateTo: String(nodeId || "") };
}

function inferAllowConcurrentFromPacketV0(packet) {
  const mode = String(packet?.meta?.stabilizationMode || "");
  return (
    mode === "degraded_ensemble" ||
    mode === "parallel_hold" ||
    mode === "jurisdictional_split"
  );
}

/**
 * @param {import('cesium').Viewer} viewer
 * @returns {() => void}
 */
export function maybeInstallEpistemicSimResearchOnCesiumV0(viewer) {
  if (!isEpistemicSimResearchEnabledV0() || !viewer) {
    return () => {};
  }

  const stopWire = startEpistemicSimResearchWireV0();

  const onPostRender = () => {
    try {
      const snap = getEpistemicSimResearchSnapshotV0();
      applyEpistemicSimToCesiumSceneV0(viewer, snap);
    } catch {
      /* noop */
    }
  };

  viewer.scene.postRender.addEventListener(onPostRender);

  return () => {
    try {
      viewer.scene.postRender.removeEventListener(onPostRender);
    } catch {
      /* noop */
    }
    stopWire();
  };
}
