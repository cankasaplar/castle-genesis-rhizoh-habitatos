import React, { useMemo, useState } from "react";
import {
  buildCohortInvitePackV0,
  exportCohortInvitePackV0,
  getActiveCohortReviewerFromUrlV0,
  isCohortReviewSessionV0
} from "../rhizoh/cohort/cohortInvitePackV0.js";
import {
  advanceFridayPromptStepV0,
  getFridayPromptRunnerStateV0
} from "../rhizoh/cohort/cohortFridayPromptRunnerV0.js";

/**
 * Cohort reviewer strip — snapshot export, replay URL, Friday prompt script.
 * Visible when ?cohort=review or VITE_RHIZOH_COHORT_INSPECT=1.
 */
export function RhizohCohortInspectStrip() {
  const active = isCohortReviewSessionV0();
  const reviewer = getActiveCohortReviewerFromUrlV0() || "metehan";
  const [friday, setFriday] = useState(() => getFridayPromptRunnerStateV0());
  const [exportStatus, setExportStatus] = useState("");

  const packPreview = useMemo(
    () => buildCohortInvitePackV0({ reviewerId: reviewer }),
    [reviewer, exportStatus, friday.stepIndex]
  );

  if (!active) return null;

  return (
    <div className="mx-1 mb-2 rounded-xl border border-violet-400/30 bg-violet-950/25 px-3 py-2 normal-case text-[9px] text-violet-100/90">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="font-bold tracking-[0.12em] uppercase text-violet-200">
          Cohort inspect · {reviewer}
        </span>
        <button
          type="button"
          className="rounded border border-violet-300/40 px-2 py-0.5 hover:bg-violet-400/10"
          onClick={async () => {
            const pack = buildCohortInvitePackV0({ reviewerId: reviewer });
            const out = await exportCohortInvitePackV0(pack);
            setExportStatus(out.ok ? `exported:${out.method}` : "export_failed");
          }}
        >
          Snapshot export
        </button>
      </div>
      {packPreview.replay.url ? (
        <p className="mb-1 break-all">
          Replay:{" "}
          <a className="text-cyan-200 underline" href={packPreview.replay.url} target="_blank" rel="noreferrer">
            seq {packPreview.replay.fromSeq}–{packPreview.replay.toSeq}
          </a>
        </p>
      ) : null}
      {friday.current ? (
        <div className="mt-1 rounded border border-white/10 bg-black/30 p-2">
          <div className="text-[8px] text-white/50 mb-1">
            Friday {friday.stepIndex + 1}/{friday.total}
          </div>
          <div className="font-semibold text-white/90">{friday.current.prompt}</div>
          <div className="text-[8px] text-white/55 mt-1">Observe: {friday.current.observe.join(", ")}</div>
          <button
            type="button"
            className="mt-2 rounded border border-emerald-400/40 px-2 py-0.5 text-emerald-100 hover:bg-emerald-400/10"
            onClick={() => {
              setFriday(advanceFridayPromptStepV0());
            }}
          >
            Sonraki adım
          </button>
        </div>
      ) : (
        <p className="text-emerald-200/80">Friday script tamamlandı.</p>
      )}
      {exportStatus ? <p className="mt-1 text-[8px] text-white/45">{exportStatus}</p> : null}
    </div>
  );
}
