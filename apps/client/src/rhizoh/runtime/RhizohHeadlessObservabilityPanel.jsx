import React, { useEffect, useState } from "react";
import { buildRealityHealthMetricsSnapshotV0 } from "./realityHealthMetricsV0.js";
import { buildRealitySealerRuntimeSnapshotV0 } from "./realitySealerRuntimeV0.js";
import { getStudioKernelState } from "../../studio/store/studioStore";

const REFRESH_MS = 5000;

/**
 * Zero WebGL soak UI — substrate metrics only (Faz 1).
 *
 * @param {{ gatewayPhase?: string }} props
 */
export default function RhizohHeadlessObservabilityPanel({ gatewayPhase = "" }) {
  const [snap, setSnap] = useState(() => buildSnapshot());

  useEffect(() => {
    const id = window.setInterval(() => setSnap(buildSnapshot()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-[#010103] text-[#0f0] font-mono p-5 normal-case select-text"
      data-rhizoh-headless="1"
    >
      <h1 className="text-lg font-bold tracking-wide text-cyan-300 mb-1">
        [RHIZOH SUBSTRATE OBSERVABILITY LIVE]
      </h1>
      <p className="text-[11px] text-white/50 mb-4">
        Headless mode — Apex/Cesium dormant. Gateway: {gatewayPhase || "—"} · refresh {REFRESH_MS / 1000}s
      </p>
      <pre className="text-[10px] leading-relaxed overflow-auto max-h-[85vh] border border-emerald-900/40 rounded-lg p-4 bg-black/80">
        {JSON.stringify(snap, null, 2)}
      </pre>
    </div>
  );
}

function buildSnapshot() {
  const seal = getStudioKernelState().realitySeal;
  return {
    ts: Date.now(),
    realityHealth: buildRealityHealthMetricsSnapshotV0(seal),
    realitySealerRuntime: buildRealitySealerRuntimeSnapshotV0(seal)
  };
}
