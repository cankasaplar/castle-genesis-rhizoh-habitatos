import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  getCheckersArenaEngineSnapshotV0,
  CHECKERS_ARENA_MOVE_EVENT_V0,
  listCheckersArenaPiecesV0
} from "../rhizoh/runtime/checkersArenaEngineV0.js";
import { ingestCheckersLearningDemoMoveV0 } from "../rhizoh/runtime/checkersLearningDemoIngestV0.js";
import {
  getCheckersLearningTubeSnapshotV0,
  wireCheckersLearningMediaTubeV0
} from "../rhizoh/runtime/checkersLearningMediaTubeWireV0.js";
import { buildRhizohCheckersLearningReportV0 } from "../rhizoh/runtime/rhizohCheckersLearningReportV0.js";
import { CHECKERS_LEARNING_BATCH_EVENT_V0 } from "../rhizoh/runtime/checkersLearningBatchV0.js";
import { RhizohArenaLearningStripV0 } from "./RhizohArenaLearningStripV0.jsx";

/**
 * Checkers cluster arena v0 — board + pieces + spacetime learning wire (media tube embed).
 * RESEARCH-ONLY — not rules-complete.
 */
export const RhizohCheckersClusterArenaV0 = memo(function RhizohCheckersClusterArenaV0({
  open = true,
  embedMode = false,
  broadcastMode = false,
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [arena, setArena] = useState(() => getCheckersArenaEngineSnapshotV0());
  const [pieces, setPieces] = useState(() => listCheckersArenaPiecesV0());
  const [wire, setWire] = useState(() => getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));
  const [report, setReport] = useState(() => buildRhizohCheckersLearningReportV0());

  const refreshAll = useCallback(() => {
    setArena(getCheckersArenaEngineSnapshotV0());
    setPieces(listCheckersArenaPiecesV0());
    setWire(getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));
    setReport(buildRhizohCheckersLearningReportV0());
  }, [uiLocale]);

  useEffect(() => {
    if (!open) return undefined;
    const onMove = () => refreshAll();
    const onBatch = () => refreshAll();
    window.addEventListener(CHECKERS_ARENA_MOVE_EVENT_V0, onMove);
    window.addEventListener(CHECKERS_LEARNING_BATCH_EVENT_V0, onBatch);
    void wireCheckersLearningMediaTubeV0({ locale: uiLocale, force: true, demoMove: true }).then(() => {
      refreshAll();
    });
    return () => {
      window.removeEventListener(CHECKERS_ARENA_MOVE_EVENT_V0, onMove);
      window.removeEventListener(CHECKERS_LEARNING_BATCH_EVENT_V0, onBatch);
    };
  }, [open, uiLocale, refreshAll]);

  const pieceMap = useMemo(() => {
    const map = new Map();
    for (const p of pieces) {
      map.set(`${p.x},${p.y}`, p.color);
    }
    return map;
  }, [pieces]);

  const grid = useMemo(() => {
    const size = arena.boardSize || 8;
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => Object.freeze({ x, y }))
    );
  }, [arena.boardSize]);

  const onDemoMove = useCallback(() => {
    const snap = getCheckersArenaEngineSnapshotV0();
    ingestCheckersLearningDemoMoveV0({
      x: 2 + (snap.moveCount % 4),
      y: 2 + Math.floor(snap.moveCount / 4),
      confidence: 0.8,
      locale: uiLocale
    });
    refreshAll();
  }, [uiLocale, refreshAll]);

  useEffect(() => {
    if (!open || !broadcastMode) return undefined;
    const id = window.setInterval(() => {
      onDemoMove();
    }, 2600);
    return () => window.clearInterval(id);
  }, [open, broadcastMode, onDemoMove]);

  const alignmentPct =
    report.movesSeen > 0
      ? `${Math.round((report.gateAccepted / report.movesSeen) * 100)}%`
      : "—";
  const teacherLabel = tr ? "heuristic demo" : "heuristic demo";
  const lastPiece = pieces[pieces.length - 1];
  const lastMoveLabel = lastPiece
    ? `${lastPiece.color}@${lastPiece.x},${lastPiece.y}`
    : null;

  if (!open) return null;

  const boardMaxClass = broadcastMode
    ? "h-full w-full max-w-none"
    : embedMode
      ? "w-full max-w-[min(100%,52dvh)]"
      : "w-full max-w-[min(100%,42dvh)]";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-2 ${embedMode ? "p-1" : "p-4"} ${
        broadcastMode ? "h-full overflow-hidden" : ""
      }`}
      data-testid="rhizoh-checkers-cluster-arena-v0"
      data-broadcast-mode={broadcastMode ? "1" : "0"}
    >
      {!broadcastMode ? (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-pink-300">
            {tr ? "Dama Öğrenme · Uzay-Zaman" : "Checkers Learning · Spacetime"}
          </p>
          {!embedMode && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70"
            >
              {tr ? "Kapat" : "Close"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="shrink-0">
        <RhizohArenaLearningStripV0
          tr={tr}
          game="checkers"
          movesMeasured={report.movesSeen}
          teacherLabel={teacherLabel}
          alignmentPct={alignmentPct}
          batchesFlushed={report.batchesFlushed}
          batchPending={report.batchPending}
          gateAccepted={report.gateAccepted}
          gateRejected={report.gateRejected}
          lastMoveLabel={lastMoveLabel}
        />
      </div>

      <div className={`flex min-h-0 flex-1 items-center justify-center ${broadcastMode ? "p-0" : "py-1"}`}>
        <div
          className={`grid aspect-square ${boardMaxClass} grid-cols-[repeat(8,minmax(0,1fr))] gap-px rounded-xl border border-pink-500/20 bg-pink-950/30 p-1`}
        >
          {grid.flatMap((row, y) =>
            row.map((cell) => {
              const dark = (cell.x + cell.y) % 2 === 1;
              const piece = pieceMap.get(`${cell.x},${cell.y}`);
              return (
                <button
                  key={`${cell.x}-${cell.y}`}
                  type="button"
                  disabled={!dark}
                  onClick={() => {
                    if (!dark) return;
                    ingestCheckersLearningDemoMoveV0({
                      x: cell.x,
                      y: cell.y,
                      confidence: 0.75,
                      locale: uiLocale
                    });
                    refreshAll();
                  }}
                  className={`relative aspect-square rounded-sm ${
                    dark ? "bg-rose-900/50 hover:bg-pink-500/25" : "bg-amber-950/30"
                  }`}
                  aria-label={`${cell.x},${cell.y}${piece ? ` ${piece}` : ""}`}
                >
                  {piece ? (
                    <span
                      className={`pointer-events-none absolute inset-[14%] rounded-full shadow-md ${
                        piece === "R"
                          ? "bg-gradient-to-br from-red-500 to-red-900 ring-2 ring-red-300/40"
                          : "bg-gradient-to-br from-zinc-300 to-zinc-600 ring-2 ring-white/30"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {!broadcastMode ? (
        <>
          <button
            type="button"
            onClick={onDemoMove}
            className="shrink-0 self-center rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-pink-200"
          >
            {tr ? "Demo hamle + öğrenme" : "Demo move + learn"}
          </button>

          <div className="shrink-0 rounded-xl border border-pink-500/15 bg-black/25 p-3 text-[9px] text-pink-100/80 normal-case">
            <p className="font-semibold text-pink-300/90">
              {tr ? "Mekân · zaman zarfı" : "Space · time envelope"}
            </p>
            <p className="mt-1">
              {wire.spacetime?.worldAnchor?.nodeId} → {wire.spacetime?.worldAnchor?.channelId}
            </p>
            <p className="mt-1 text-white/50">
              {wire.spacetime?.causalSpaceId} · trail #{wire.spacetime?.temporalTrailSeq ?? "—"}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
});
