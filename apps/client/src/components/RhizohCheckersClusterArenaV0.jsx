import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  getCheckersArenaEngineSnapshotV0,
  CHECKERS_ARENA_MOVE_EVENT_V0
} from "../rhizoh/runtime/checkersArenaEngineV0.js";
import { ingestCheckersLearningDemoMoveV0 } from "../rhizoh/runtime/checkersLearningDemoIngestV0.js";
import {
  getCheckersLearningTubeSnapshotV0,
  wireCheckersLearningMediaTubeV0
} from "../rhizoh/runtime/checkersLearningMediaTubeWireV0.js";

/**
 * Checkers cluster arena v0 — minimal 8×8 board + spacetime learning wire (media tube embed).
 * RESEARCH-ONLY — not rules-complete.
 */
export const RhizohCheckersClusterArenaV0 = memo(function RhizohCheckersClusterArenaV0({
  open = true,
  embedMode = false,
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [arena, setArena] = useState(() => getCheckersArenaEngineSnapshotV0());
  const [wire, setWire] = useState(() => getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => setArena(getCheckersArenaEngineSnapshotV0());
    window.addEventListener(CHECKERS_ARENA_MOVE_EVENT_V0, refresh);
    void wireCheckersLearningMediaTubeV0({ locale: uiLocale, force: true }).then(() => {
      setWire(getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));
    });
    return () => window.removeEventListener(CHECKERS_ARENA_MOVE_EVENT_V0, refresh);
  }, [open, uiLocale]);

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
    setArena(getCheckersArenaEngineSnapshotV0());
    setWire(getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));
  }, [uiLocale]);

  if (!open) return null;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 ${embedMode ? "p-2" : "p-4"}`}
      data-testid="rhizoh-checkers-cluster-arena-v0"
    >
      <div className="flex items-center justify-between gap-2">
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

      <p className="text-[10px] text-white/65 normal-case">
        {tr
          ? `Hamle: ${arena.moveCount} · batch bekleyen: ${wire.batchPending} · faz: ${wire.spacetime?.observationWindow?.phaseId || "?"}`
          : `Moves: ${arena.moveCount} · batch pending: ${wire.batchPending} · phase: ${wire.spacetime?.observationWindow?.phaseId || "?"}`}
      </p>

      <div className="mx-auto grid aspect-square w-full max-w-[280px] grid-cols-[repeat(8,minmax(0,1fr))] gap-px rounded-xl border border-pink-500/20 bg-pink-950/30 p-1">
        {grid.flatMap((row, y) =>
          row.map((cell) => (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              onClick={() => {
                ingestCheckersLearningDemoMoveV0({
                  x: cell.x,
                  y: cell.y,
                  confidence: 0.75,
                  locale: uiLocale
                });
                setArena(getCheckersArenaEngineSnapshotV0());
                setWire(getCheckersLearningTubeSnapshotV0({ locale: uiLocale }));
              }}
              className={`aspect-square rounded-sm hover:bg-pink-500/25 ${
                (cell.x + cell.y) % 2 === 0 ? "bg-rose-950/40" : "bg-pink-950/20"
              }`}
              aria-label={`${cell.x},${cell.y}`}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onDemoMove}
        className="self-center rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-pink-200"
      >
        {tr ? "Demo hamle + öğrenme" : "Demo move + learn"}
      </button>

      <div className="rounded-xl border border-pink-500/15 bg-black/25 p-3 text-[9px] text-pink-100/80 normal-case">
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
    </div>
  );
});
