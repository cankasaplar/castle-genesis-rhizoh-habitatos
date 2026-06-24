import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  getGoArenaEngineSnapshotV0,
  GO_ARENA_MOVE_EVENT_V0
} from "../rhizoh/runtime/goArenaEngineV0.js";
import { ingestGoLearningDemoMoveV0 } from "../rhizoh/runtime/goLearningDemoIngestV0.js";
import {
  getGoLearningTubeSnapshotV0,
  wireGoLearningMediaTubeV0
} from "../rhizoh/runtime/goLearningMediaTubeWireV0.js";

/**
 * Go cluster arena v0 — minimal board + spacetime learning wire (media tube embed).
 * RESEARCH-ONLY — not rules-complete; KataGo bridge is future work.
 */
export const RhizohGoClusterArenaV0 = memo(function RhizohGoClusterArenaV0({
  open = true,
  embedMode = false,
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [arena, setArena] = useState(() => getGoArenaEngineSnapshotV0());
  const [wire, setWire] = useState(() => getGoLearningTubeSnapshotV0({ locale: uiLocale }));

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => setArena(getGoArenaEngineSnapshotV0());
    window.addEventListener(GO_ARENA_MOVE_EVENT_V0, refresh);
    void wireGoLearningMediaTubeV0({ locale: uiLocale, force: true }).then(() => {
      setWire(getGoLearningTubeSnapshotV0({ locale: uiLocale }));
    });
    return () => window.removeEventListener(GO_ARENA_MOVE_EVENT_V0, refresh);
  }, [open, uiLocale]);

  const grid = useMemo(() => {
    const size = arena.boardSize || 19;
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => Object.freeze({ x, y }))
    );
  }, [arena.boardSize]);

  const onDemoMove = useCallback(() => {
    const snap = getGoArenaEngineSnapshotV0();
    ingestGoLearningDemoMoveV0({
      x: 3 + (snap.moveCount % 10),
      y: 3 + Math.floor(snap.moveCount / 10),
      confidence: 0.8,
      locale: uiLocale
    });
    setArena(getGoArenaEngineSnapshotV0());
    setWire(getGoLearningTubeSnapshotV0({ locale: uiLocale }));
  }, [uiLocale]);

  if (!open) return null;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 ${embedMode ? "p-2" : "p-4"}`}
      data-testid="rhizoh-go-cluster-arena-v0"
    >
      <div className="flex items-center justify-between gap-2">
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

      <p className="text-[10px] text-white/65 normal-case">
        {tr
          ? `Hamle: ${arena.moveCount} · batch bekleyen: ${wire.batchPending} · faz: ${wire.spacetime?.observationWindow?.phaseId || "?"}`
          : `Moves: ${arena.moveCount} · batch pending: ${wire.batchPending} · phase: ${wire.spacetime?.observationWindow?.phaseId || "?"}`}
      </p>

      <div className="mx-auto grid aspect-square w-full max-w-[280px] grid-cols-[repeat(19,minmax(0,1fr))] gap-px rounded-xl border border-sky-500/20 bg-sky-950/30 p-1">
        {grid.flatMap((row) =>
          row.map((cell) => (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              onClick={() => {
                ingestGoLearningDemoMoveV0({ x: cell.x, y: cell.y, confidence: 0.75, locale: uiLocale });
                setArena(getGoArenaEngineSnapshotV0());
                setWire(getGoLearningTubeSnapshotV0({ locale: uiLocale }));
              }}
              className="aspect-square rounded-sm bg-emerald-950/20 hover:bg-sky-500/20"
              aria-label={`${cell.x},${cell.y}`}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onDemoMove}
        className="self-center rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sky-200"
      >
        {tr ? "Demo hamle + öğrenme" : "Demo move + learn"}
      </button>

      <div className="rounded-xl border border-sky-500/15 bg-black/25 p-3 text-[9px] text-sky-100/80 normal-case">
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
    </div>
  );
});
