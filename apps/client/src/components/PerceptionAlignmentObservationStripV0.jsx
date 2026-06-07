import React, { memo } from "react";
import {
  summarizePerceptionAlignmentDriftV0,
  summarizePerceptionAlignmentLensesV0
} from "../castleFlight/perceptionAlignmentSnapshotV0.js";

const RISK_CLASS_V0 = Object.freeze({
  low: "text-emerald-300/90 border-emerald-400/25",
  medium: "text-amber-200/90 border-amber-400/35",
  high: "text-rose-200/90 border-rose-400/40"
});

/**
 * T0 shell observation strip — mirror only (no control, no influence).
 * @param {{ snapshot: object | null, className?: string }} props
 */
export const PerceptionAlignmentObservationStripV0 = memo(function PerceptionAlignmentObservationStripV0({
  snapshot,
  className = ""
}) {
  const contract = snapshot?.contract;
  if (!contract) return null;

  const lenses = summarizePerceptionAlignmentLensesV0(contract);
  const drift = summarizePerceptionAlignmentDriftV0(contract.alignment);
  const riskClass = RISK_CLASS_V0[drift.risk] || RISK_CLASS_V0.low;

  return (
    <div
      className={`pointer-events-none select-none rounded-lg border bg-black/55 px-2.5 py-1.5 font-mono text-[8px] normal-case leading-snug backdrop-blur-sm ${riskClass} ${className}`}
      data-rhizoh-perception-alignment-strip="1"
      data-alignment-risk={drift.risk}
      data-alignment-guardrail={drift.guardrailActive ? "1" : "0"}
      aria-hidden
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 uppercase tracking-[0.14em] text-white/45">
        <span>Align</span>
        <span className={riskClass.split(" ")[0]}>risk:{drift.risk}</span>
        {drift.blockFalseCorrelation ? <span>guard:false-corr</span> : null}
        {drift.primaryCode ? <span title={drift.primaryCode}>Δ:{drift.primaryCode}</span> : null}
      </div>
      <div className="mt-1 grid gap-0.5 text-white/72">
        <div>
          <span className="text-cyan-300/75">Octo</span> {lenses.octo}
        </div>
        <div>
          <span className="text-sky-300/75">Cesium</span> {lenses.cesium}
        </div>
        <div>
          <span className="text-violet-300/75">Habitat</span> {lenses.habitat}
        </div>
      </div>
      {drift.explanationCount > 0 ? (
        <div className="mt-1 text-white/40">
          drift trace: {drift.explanationCount} · observational · no causality
        </div>
      ) : null}
    </div>
  );
});
