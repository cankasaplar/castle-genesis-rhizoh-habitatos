import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { buildHubLiveContextHref } from "./genesisHubQueryContextV1.js";

/**
 * Academy → Hub canlı bağlam (deterministik query; çıkarım yok).
 * @param {{ anchorId?: string, eventType?: string, lastSeq?: number | null, windowN?: number, children?: React.ReactNode }} props
 */
export function AcademyHubContextLink({ anchorId, eventType, lastSeq, windowN = 20, children }) {
  const to = useMemo(() => {
    const anchor = String(anchorId || "").trim() || undefined;
    const et = String(eventType || "").trim() || undefined;
    const base = { anchor, eventType: et, window: windowN };
    if (lastSeq == null || !Number.isFinite(Number(lastSeq))) {
      return buildHubLiveContextHref(base);
    }
    const smax = Math.floor(Number(lastSeq));
    const smin = Math.max(1, smax - windowN + 1);
    return buildHubLiveContextHref({ ...base, seqMin: smin, seqMax: smax });
  }, [anchorId, eventType, lastSeq, windowN]);

  return (
    <Link
      to={to}
      className="inline-flex items-center rounded border border-emerald-400/30 bg-emerald-950/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-100/90 hover:border-emerald-300/50 hover:text-emerald-50"
    >
      {children || "Hub · canlı bağlam"}
    </Link>
  );
}
