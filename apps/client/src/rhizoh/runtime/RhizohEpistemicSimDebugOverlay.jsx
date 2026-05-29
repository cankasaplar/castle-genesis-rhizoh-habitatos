import React, { useEffect, useState } from "react";
import { getEpistemicSimResearchSnapshotV0 } from "./epistemicSimResearchStoreV0.js";
import { EPISTEMIC_EVENT_CLASS_V0, getEpistemicEventTraceV0 } from "./epistemicEventBusV0.js";
import { recordManifoldNavObserverTelemetryV0 } from "./epistemicObserverTelemetryV0.js";
import { getReplayFeedbackAnalysisReportV0 } from "./replayFeedbackAnalysisStoreV0.js";
import { getEpistemicCompressionSignatureV0 } from "./epistemicCompressionSignatureStoreV0.js";
import { getCrossNodeCausalResonanceReportV0 } from "./sovereign/crossNodeResonanceWireV0.js";
import {
  isEpistemicSimResearchEnabledV0,
  navigateEpistemicSimManifoldV0,
  startEpistemicSimResearchWireV0
} from "./epistemicSimResearchWireV0.js";

/**
 * Phase 9.4.1 — Epistemic simulation debug overlay (research wire).
 */
export function RhizohEpistemicSimDebugOverlay() {
  const on = isEpistemicSimResearchEnabledV0();
  const [snap, setSnap] = useState(
    /** @type {ReturnType<typeof getEpistemicSimResearchSnapshotV0>} */ (null)
  );

  useEffect(() => {
    if (!on) return undefined;
    const stop = startEpistemicSimResearchWireV0();
    const id = setInterval(() => {
      setSnap(getEpistemicSimResearchSnapshotV0());
    }, 200);
    return () => {
      clearInterval(id);
      stop();
    };
  }, [on]);

  if (!on || !snap) return null;

  const nodes = ["node:barcelona", "node:istanbul"];
  const lastObserver = [...getEpistemicEventTraceV0()]
    .reverse()
    .find((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER);
  const replayReport = getReplayFeedbackAnalysisReportV0();
  const compressionSig = getEpistemicCompressionSignatureV0();
  const resonance = getCrossNodeCausalResonanceReportV0();

  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-[202] max-w-[14rem] rounded border border-violet-500/30 bg-black/85 px-2 py-1.5 font-mono text-[8px] leading-snug normal-case text-violet-100/90">
      <div className="text-[7px] uppercase tracking-wide text-violet-400/90">
        epistemic sim (9.4.5 signature)
      </div>
      <div>frame: {snap.frame}</div>
      <div>splitBrain: {snap.epistemicSplitBrainScore.toFixed(3)}</div>
      <div>coherence grad: {snap.coherenceGradient.toFixed(3)}</div>
      <div>focus: {snap.focusNodeId?.replace("node:", "") ?? "-"}</div>
      <div>executor: {snap.executorNodeId?.replace("node:", "") ?? "-"}</div>
      <div>terrain dm: {snap.terrainMaxOffsetMeters.toFixed(1)}</div>
      <div>causality: {snap.causalityTraceCount} traces</div>
      <div>concurrent: {String(snap.allowConcurrentExecution)}</div>
      {snap.navigationPhysics ? (
        <>
          <div>moveCost: {snap.navigationPhysics.movementCost.toFixed(2)}</div>
          <div>pathΔ: {snap.navigationPhysics.pathDistortion.toFixed(2)}</div>
          <div>moveScale: {snap.navigationPhysics.moveScale.toFixed(2)}</div>
        </>
      ) : null}
      {snap.physicsEvents?.length ? (
        <div className="mt-0.5 text-violet-300/80">
          evt: {snap.physicsEvents[snap.physicsEvents.length - 1]?.kind}
        </div>
      ) : null}
      <div className="text-violet-400/70">
        bus trace: {getEpistemicEventTraceV0().length}
        {snap.eventBusSeqHead ? ` · seq ${snap.eventBusSeqHead}` : ""}
      </div>
      {lastObserver?.observerAction ? (
        <div className="text-violet-300/60">obs: {lastObserver.observerAction.action}</div>
      ) : null}
      {replayReport?.summary?.dominantPattern ? (
        <div className="text-violet-200/50">
          pattern: {replayReport.summary.dominantPattern}
        </div>
      ) : null}
      {compressionSig?.composedSignature ? (
        <div className="truncate text-violet-200/40" title={compressionSig.composedSignature}>
          sig: {compressionSig.composedSignature.slice(0, 20)}…
        </div>
      ) : null}
      {resonance?.dominantPair ? (
        <div className="text-violet-300/50">resonance: {resonance.dominantPair}</div>
      ) : null}
      {resonance?.pairs?.[0]?.temporalInterferenceScore != null ? (
        <div className="text-violet-300/40">
          temporal: {resonance.pairs[0].temporalInterferenceScore.toFixed(2)}
        </div>
      ) : null}
      {resonance?.entanglementGuard?.riskLevel ? (
        <div className="text-zinc-500">
          entangle risk: {resonance.entanglementGuard.riskLevel} (blocked)
        </div>
      ) : null}
      <div className="mt-1 flex gap-1 pointer-events-auto">
        {nodes.map((n) => (
          <button
            key={n}
            type="button"
            className="rounded border border-violet-400/40 px-1 py-0.5 text-[7px] text-violet-200 hover:bg-violet-500/20"
            onClick={() => {
              recordManifoldNavObserverTelemetryV0(n);
              navigateEpistemicSimManifoldV0(n);
            }}
          >
            nav {n.replace("node:", "")}
          </button>
        ))}
      </div>
    </div>
  );
}
