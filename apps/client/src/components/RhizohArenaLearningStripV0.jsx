import React, { memo } from "react";

/**
 * Shared learning status strip for Go / Checkers cluster arenas (chess parity).
 * RESEARCH-ONLY — interpretation only.
 */
export const RhizohArenaLearningStripV0 = memo(function RhizohArenaLearningStripV0({
  tr = false,
  game = "go",
  movesMeasured = 0,
  teacherLabel = "—",
  alignmentPct = "—",
  batchesFlushed = 0,
  batchPending = 0,
  gateAccepted = 0,
  gateRejected = 0,
  lastMoveLabel = null,
  activeCameras = 1,
  cameraTotal = 1
}) {
  const gameLabel = game === "checkers" ? (tr ? "Dama" : "Checkers") : "Go";

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-950/25 px-3 py-2 text-[10px] text-white/75">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-violet-200/90">
          {tr ? "Öğrenme durumu" : "Learning status"}
        </span>
        <span>
          {tr ? "ölçülen hamle" : "moves measured"}: {movesMeasured}
        </span>
        <span>
          {tr ? "öğretmen" : "teacher"}: {teacherLabel}
        </span>
        <span>
          {tr ? "uyum" : "align"}: {alignmentPct}
        </span>
        <span>
          {tr ? "batch" : "batch"}: {batchesFlushed}
          {batchPending > 0 ? ` (+${batchPending})` : ""}
        </span>
        <span>
          {tr ? "kabul" : "accepted"}: {gateAccepted}
          {gateRejected > 0 ? ` · ${tr ? "red" : "rej"}: ${gateRejected}` : ""}
        </span>
        {cameraTotal > 1 ? (
          <span>
            {tr ? "kamera" : "cameras"}: {activeCameras}/{cameraTotal}
          </span>
        ) : null}
        {lastMoveLabel ? (
          <span className="font-mono text-cyan-200/90">
            {tr ? "son hamle" : "last move"}: {lastMoveLabel}
          </span>
        ) : (
          <span className="text-white/40">{tr ? "hamle bekleniyor" : "awaiting moves"}</span>
        )}
      </div>
      <p className="mt-1 text-[9px] text-white/35">
        {gameLabel} · {tr ? "yalnızca gözlem" : "observation only"}
      </p>
    </div>
  );
});
