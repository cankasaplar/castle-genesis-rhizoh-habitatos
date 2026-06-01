import React from "react";

/**
 * Flow continuity thread — orientation · drift · since-last-visit · return (FCL v0).
 */
export function RhizohFlowContinuityStripV0({ flow, onReturn, className = "" }) {
  if (!flow?.flow_line) return null;

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      data-rhizoh-flow-continuity="1"
      data-entry-mode={flow.entry?.entry_mode}
      data-can-return={flow.can_return ? "1" : "0"}
    >
      {flow.orientation_line ? (
        <p className="text-[8px] font-medium text-teal-100/75 normal-case tracking-wide">
          {flow.orientation_line}
        </p>
      ) : null}
      {flow.since_last_visit_line ? (
        <p className="text-[8px] text-white/45 normal-case">{flow.since_last_visit_line}</p>
      ) : null}
      {flow.drift_line ? (
        <p className="text-[8px] text-amber-100/60 normal-case">{flow.drift_line}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[8px] font-medium text-white/50 normal-case tracking-wide">
          {flow.flow_line}
        </p>
        {flow.can_return && flow.return_line ? (
          <button
            type="button"
            onClick={() => onReturn?.(flow.return_surface, flow.return_intent)}
            className="rounded-md border border-white/12 bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold text-teal-100/85 normal-case hover:bg-white/10"
          >
            {flow.return_line}
          </button>
        ) : (
          <span className="text-[7px] text-white/30 normal-case">{flow.rhythm_line}</span>
        )}
      </div>
    </div>
  );
}
