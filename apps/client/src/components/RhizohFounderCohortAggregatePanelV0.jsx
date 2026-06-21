import React, { useEffect, useState } from "react";
import {
  buildFounderCohortAggregateV0,
  exportFounderCohortAggregateV0,
  isFounderOpsSessionV0
} from "../rhizoh/ingress/founderCohortAggregateV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * Founder cohort aggregate — local rollup + export (invitation study / paper evidence).
 * Visible: ?founder=1 · ?cohort=review · VITE_RHIZOH_FOUNDER_PANEL=1
 */
export function RhizohFounderCohortAggregatePanelV0({ remoteCastleCount = 0 }) {
  const [active] = useState(() => isFounderOpsSessionV0());
  const [agg, setAgg] = useState(null);
  const [status, setStatus] = useState("");
  const tr = readUiLocaleV0() === "tr";

  useEffect(() => {
    if (!active) return undefined;
    const tick = () =>
      setAgg(buildFounderCohortAggregateV0({ locale: readUiLocaleV0(), remoteCastleCount }));
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [active, remoteCastleCount]);

  if (!active || !agg) return null;

  return (
    <div className="mx-1 mb-2 rounded-xl border border-amber-400/35 bg-amber-950/20 px-3 py-2 normal-case text-[9px] text-amber-50/90">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold uppercase tracking-[0.12em] text-amber-200">
          {tr ? "Founder kohort" : "Founder cohort"}
        </span>
        <button
          type="button"
          className="rounded border border-amber-300/40 px-2 py-0.5 hover:bg-amber-400/10"
          onClick={async () => {
            const out = await exportFounderCohortAggregateV0({ remoteCastleCount });
            setStatus(out.ok ? `exported:${out.method}` : "export_failed");
          }}
        >
          {tr ? "Dışa aktar" : "Export JSON"}
        </button>
      </div>
      <p>
        {tr ? "Kohort" : "Cohort"}: {agg.inviteCohort || "—"} · {tr ? "Peer kale" : "Peer castles"}:{" "}
        {agg.peerCastlesOnline}
      </p>
      <p>
        {tr ? "Gözlem" : "Observer"}: {agg.observer.traceCount} events · {tr ? "Tanıma" : "Recognition"}:{" "}
        {agg.observer.recognition}
      </p>
      <p>
        {tr ? "Ayrım kanıtı" : "Separation proof"}:{" "}
        {agg.separationProof.holds ? (tr ? "geçerli" : "holds") : (tr ? "eksik" : "incomplete")}
      </p>
      <p className="text-[8px] text-white/45 mt-1">
        {tr
          ? "Çoklu davetli aggregate sunucu gerektirir — her oturumdan JSON export topla."
          : "Multi-invitee aggregate needs server — collect JSON export per session."}
      </p>
      {status ? <p className="mt-1 text-[8px] text-white/45">{status}</p> : null}
    </div>
  );
}
