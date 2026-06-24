import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  getGoArenaEngineSnapshotV0,
  GO_ARENA_MOVE_EVENT_V0,
  listGoArenaStonesV0
} from "../rhizoh/runtime/goArenaEngineV0.js";
import { ingestGoLearningDemoMoveAsyncV0 } from "../rhizoh/runtime/goLearningDemoIngestV0.js";
import {
  getGoLearningTubeSnapshotV0,
  wireGoLearningMediaTubeV0
} from "../rhizoh/runtime/goLearningMediaTubeWireV0.js";
import {
  getGoKataGoBridgeSnapshotV0,
  GO_KATAGO_GTP_STATUS_EVENT_V0
} from "../rhizoh/runtime/goKataGoGtpBridgeV0.js";
import { buildRhizohGoLearningReportV0 } from "../rhizoh/runtime/rhizohGoLearningReportV0.js";
import { GO_LEARNING_BATCH_EVENT_V0 } from "../rhizoh/runtime/goLearningBatchV0.js";
import { RhizohArenaLearningStripV0 } from "./RhizohArenaLearningStripV0.jsx";

/**
 * Go cluster arena v0 — board + stones + spacetime learning wire (media tube embed).
 * RESEARCH-ONLY — not rules-complete; KataGo sidecar optional via env.
 */
export const RhizohGoClusterArenaV0 = memo(function RhizohGoClusterArenaV0({
  open = true,
  embedMode = false,
  broadcastMode = false,
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [arena, setArena] = useState(() => getGoArenaEngineSnapshotV0());
  const [stones, setStones] = useState(() => listGoArenaStonesV0());
  const [wire, setWire] = useState(() => getGoLearningTubeSnapshotV0({ locale: uiLocale }));
  const [kataGo, setKataGo] = useState(() => getGoKataGoBridgeSnapshotV0());
  const [report, setReport] = useState(() => buildRhizohGoLearningReportV0());

  const refreshAll = useCallback(() => {
    setArena(getGoArenaEngineSnapshotV0());
    setStones(listGoArenaStonesV0());
    setWire(getGoLearningTubeSnapshotV0({ locale: uiLocale }));
    setKataGo(getGoKataGoBridgeSnapshotV0());
    setReport(buildRhizohGoLearningReportV0());
  }, [uiLocale]);

  useEffect(() => {
    if (!open) return undefined;
    const onMove = () => refreshAll();
    const onKata = () => setKataGo(getGoKataGoBridgeSnapshotV0());
    const onBatch = () => refreshAll();
    window.addEventListener(GO_ARENA_MOVE_EVENT_V0, onMove);
    window.addEventListener(GO_KATAGO_GTP_STATUS_EVENT_V0, onKata);
    window.addEventListener(GO_LEARNING_BATCH_EVENT_V0, onBatch);
    void wireGoLearningMediaTubeV0({ locale: uiLocale, force: true, demoMove: true }).then(() => {
      refreshAll();
    });
    return () => {
      window.removeEventListener(GO_ARENA_MOVE_EVENT_V0, onMove);
      window.removeEventListener(GO_KATAGO_GTP_STATUS_EVENT_V0, onKata);
      window.removeEventListener(GO_LEARNING_BATCH_EVENT_V0, onBatch);
    };
  }, [open, uiLocale, refreshAll]);

  const stoneMap = useMemo(() => {
    const map = new Map();
    for (const s of stones) {
      map.set(`${s.x},${s.y}`, s.color);
    }
    return map;
  }, [stones]);

  const grid = useMemo(() => {
    const size = arena.boardSize || 19;
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => Object.freeze({ x, y }))
    );
  }, [arena.boardSize]);

  const onDemoMove = useCallback(() => {
    const snap = getGoArenaEngineSnapshotV0();
    void ingestGoLearningDemoMoveAsyncV0({
      x: 3 + (snap.moveCount % 10),
      y: 3 + Math.floor(snap.moveCount / 10),
      locale: uiLocale
    }).then(refreshAll);
  }, [uiLocale, refreshAll]);

  useEffect(() => {
    if (!open || !broadcastMode) return undefined;
    const id = window.setInterval(() => {
      onDemoMove();
    }, 2800);
    return () => window.clearInterval(id);
  }, [open, broadcastMode, onDemoMove]);

  const alignmentPct =
    report.movesSeen > 0
      ? `${Math.round((report.gateAccepted / report.movesSeen) * 100)}%`
      : "—";
  const teacherLabel =
    kataGo.configured && kataGo.status === "ready"
      ? "KataGo"
      : kataGo.configured
        ? kataGo.status
        : tr
          ? "demo (KataGo yok)"
          : "demo (no KataGo)";
  const lastStone = stones[stones.length - 1];
  const lastMoveLabel = lastStone
    ? `${lastStone.color}@${lastStone.x},${lastStone.y}`
    : null;

  if (!open) return null;

  const boardMaxClass = broadcastMode
    ? "aspect-square h-full max-h-full w-auto max-w-full"
    : embedMode
      ? "w-full max-w-[min(100%,52dvh)]"
      : "w-full max-w-[min(100%,42dvh)]";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${embedMode ? "gap-1 p-1" : "gap-2 p-4"} ${
        broadcastMode ? "h-full overflow-hidden p-1" : ""
      }`}
      data-testid="rhizoh-go-cluster-arena-v0"
      data-broadcast-mode={broadcastMode ? "1" : "0"}
    >
      {!broadcastMode ? (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-300">
            {tr ? "Go Öğrenme · Uzay-Zaman" : "Go Learning · Spacetime"}
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
          game="go"
          movesMeasured={report.movesSeen}
          teacherLabel={teacherLabel}
          alignmentPct={alignmentPct}
          batchesFlushed={report.batchesFlushed}
          batchPending={report.batchPending}
          gateAccepted={report.gateAccepted}
          gateRejected={report.gateRejected}
          lastMoveLabel={lastMoveLabel}
          compact={broadcastMode}
        />
      </div>

      <div className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${broadcastMode ? "p-0.5" : "py-1"}`}>
        <div
          className={`relative grid aspect-square ${boardMaxClass} grid-cols-[repeat(19,minmax(0,1fr))] gap-px rounded-xl border border-sky-500/20 bg-[#1a3d2e] p-1 shadow-[inset_0_0_24px_rgba(0,0,0,0.4)]`}
        >
          {grid.flatMap((row) =>
            row.map((cell) => {
              const stone = stoneMap.get(`${cell.x},${cell.y}`);
              return (
                <button
                  key={`${cell.x}-${cell.y}`}
                  type="button"
                  onClick={() => {
                    void ingestGoLearningDemoMoveAsyncV0({
                      x: cell.x,
                      y: cell.y,
                      locale: uiLocale
                    }).then(refreshAll);
                  }}
                  className="relative aspect-square rounded-sm bg-emerald-900/30 hover:bg-sky-500/15"
                  aria-label={`${cell.x},${cell.y}${stone ? ` ${stone}` : ""}`}
                >
                  {stone ? (
                    <span
                      className={`pointer-events-none absolute inset-[12%] rounded-full shadow-md ${
                        stone === "B"
                          ? "bg-gradient-to-br from-zinc-700 to-black ring-1 ring-white/20"
                          : "bg-gradient-to-br from-white to-zinc-300 ring-1 ring-black/30"
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
            className="shrink-0 self-center rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sky-200"
          >
            {tr ? "Demo hamle + öğrenme" : "Demo move + learn"}
          </button>

          <div className="shrink-0 rounded-xl border border-sky-500/15 bg-black/25 p-3 text-[9px] text-sky-100/80 normal-case">
            <p className="font-semibold text-sky-300/90">
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
