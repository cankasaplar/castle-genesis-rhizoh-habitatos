import React from "react";
import { Link } from "react-router-dom";
import { academyHashHref } from "./genesisSemanticBridgeV1.js";

/**
 * @param {{ anchorId: string, compact?: boolean }} props
 */
export function ExplainAcademyLink({ anchorId, compact = true }) {
  const id = String(anchorId || "").trim();
  if (!id) return null;
  const to = academyHashHref(id);
  return (
    <Link
      to={to}
      className="shrink-0 rounded border border-violet-400/25 bg-violet-950/30 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-violet-200/90 hover:border-violet-300/50 hover:text-violet-50"
      title={`Academy: #${id}`}
    >
      {compact ? "?" : "Academy"}
    </Link>
  );
}
