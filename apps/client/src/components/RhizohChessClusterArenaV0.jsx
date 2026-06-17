import React, { memo, useEffect, useState } from "react";
import {
  CHESS_CLUSTER_MOVE_EVENT_V0,
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_TICK_EVENT_V0,
  listChessClusterSlotsV0,
  isChessGameClusterRunningV0
} from "../rhizoh/runtime/chessGameClusterV0.js";
import {
  CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0,
  getChessStockfishEngineStatusV0
} from "../rhizoh/runtime/chessStockfishEngineV0.js";
import { createChessArenaGameV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import { useChessArenaDisplaySettingsV0 } from "../hooks/useChessArenaDisplaySettingsV0.js";
import { resolveChessClusterAgentPolicyV0 } from "../rhizoh/runtime/chessClusterAgentPolicyV0.js";
import {
  CHESS_LEARNING_MONITOR_EVENT_V0,
  CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
  getChessLearningMonitorSnapshotV0,
  startChessLearningMeasurementV0
} from "../rhizoh/runtime/chessLearningMonitorV0.js";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";

function boardRowsFromFen(fen) {
  const chess = createChessArenaGameV0({ fen });
  const board = chess.chess.board();
  const rows = [];
  for (let r = 0; r < 8; r += 1) {
    const row = [];
    for (let c = 0; c < 8; c += 1) {
      const cell = board[r][c];
      if (!cell) {
        row.push(null);
        continue;
      }
      const key = `${cell.color}${String(cell.type).toUpperCase()}`;
      row.push({
        color: cell.color,
        glyph: PIECE_UNICODE_V0[key] || "?"
      });
    }
    rows.push(row);
  }
  return rows;
}

function ClockRowV0({ label, clock, active, tr }) {
  return (
    <div
      className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[9px] ${
        active ? "bg-cyan-500/20 text-cyan-50" : "bg-black/30 text-white/55"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="font-mono tabular-nums text-[10px]">{clock || "—"}</span>
      {active ? <span className="text-[8px] text-cyan-200/90">{tr ? "●" : "●"}</span> : null}
    </div>
  );
}

const LiveCameraBoardV0 = memo(function LiveCameraBoardV0({
  slot,
  highlight,
  featured,
  tr,
  boardColors,
  pieceBold
}) {
  if (!slot) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-black/40 text-xs text-white/40">
        —
      </div>
    );
  }

  const rows = boardRowsFromFen(slot.fen);
  const white = resolveChessClusterAgentPolicyV0(slot.whiteAgent);
  const black = resolveChessClusterAgentPolicyV0(slot.blackAgent);
  const turnW = slot.turn === "w";

  return (
    <div
      className={`flex flex-col rounded-lg border bg-black/50 p-2 ${
        featured
          ? "border-cyan-400/80 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
          : highlight
            ? "border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
            : "border-white/15"
      }`}
      data-chess-cluster-slot={slot.slotId}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1 text-[9px] text-white/70">
        <span className="font-bold text-white/90">
          #{slot.slotId + 1}
          {featured ? (
            <span className="ml-1 rounded bg-cyan-500/25 px-1 py-px text-[8px] font-black uppercase text-cyan-100">
              LIVE
            </span>
          ) : null}
        </span>
        <span className="truncate text-right">{white.label} vs {black.label}</span>
      </div>

      <div className="mb-1 grid grid-cols-2 gap-1">
        <ClockRowV0
          label={white.label}
          clock={slot.clock?.whiteClock}
          active={turnW && slot.status === "active"}
          tr={tr}
        />
        <ClockRowV0
          label={black.label}
          clock={slot.clock?.blackClock}
          active={!turnW && slot.status === "active"}
          tr={tr}
        />
      </div>

      <div className="grid flex-1 grid-cols-8 gap-px overflow-hidden rounded-md border border-black/40">
        {rows.map((row, ri) =>
          row.map((cell, ci) => {
            const dark = (ri + ci) % 2 === 1;
            const bg = dark ? boardColors.dark : boardColors.light;
            return (
              <div
                key={`${ri}-${ci}`}
                className="flex aspect-square items-center justify-center"
                style={{ background: bg }}
              >
                {cell ? (
                  <span
                    className={`select-none leading-none ${
                      pieceBold ? "font-black" : "font-semibold"
                    } ${
                      featured
                        ? "text-[clamp(0.65rem,2.8vw,1.15rem)]"
                        : "text-[clamp(0.55rem,2.2vw,0.95rem)]"
                    } ${cell.color === "w" ? "text-white" : "text-black"}`}
                    style={
                      cell.color === "b"
                        ? { textShadow: "0 0 1px #fff, 0 1px 0 #fff" }
                        : { textShadow: "0 1px 2px rgba(0,0,0,0.55)" }
                    }
                  >
                    {cell.glyph}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[9px] text-white/50">
        <span>ply {slot.ply}</span>
        <span>{slot.turn === "w" ? (tr ? "beyaz" : "white") : tr ? "siyah" : "black"}</span>
        {slot.criticalEventCount > 0 ? (
          <span className="text-amber-300">⚠ {slot.criticalEventCount}</span>
        ) : (
          <span>{slot.endReason === "timeout" ? (tr ? "süre" : "flag") : slot.status}</span>
        )}
      </div>
    </div>
  );
});

function LearningStripV0({ monitor, router, tr, timeControlLabel }) {
  const recentMoves = monitor?.recentMoves || [];
  const lastMove = recentMoves[recentMoves.length - 1];
  const m = monitor?.measurement;

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-950/25 px-3 py-2 text-[10px] text-white/75">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-violet-200/90">{tr ? "Öğrenme ölçümü" : "Learning measure"}</span>
        <span>
          {tr ? "Motor" : "Engine"}: <span className="font-mono">{monitor?.engineStatus || "—"}</span>
        </span>
        <span>
          {tr ? "hamle" : "moves"}: {m?.movesMeasured ?? 0} · SF {m?.stockfishMovesMeasured ?? 0}
        </span>
        <span>
          policy_diff: {m?.policyDiffsMeasured ?? 0}
          {m?.alignmentRate != null ? ` · align ${Math.round(m.alignmentRate * 100)}%` : ""}
        </span>
        <span>
          router: {router?.activeGames ?? 0}/{router?.gameCount ?? 8} · {timeControlLabel || "—"}
        </span>
        <span>mem {monitor?.memoryNodeCount ?? 0}</span>
        <span>tick {monitor?.clusterTick ?? 0}</span>
        <span>
          #{CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 + 1} ply {monitor?.spectator?.ply ?? 0}
        </span>
        {lastMove ? (
          <span className="font-mono text-cyan-200/90">
            {tr ? "son" : "last"}: {lastMove.san} ({lastMove.engine})
          </span>
        ) : (
          <span className="text-white/40">{tr ? "hamle bekleniyor" : "awaiting moves"}</span>
        )}
      </div>
    </div>
  );
}

/**
 * 8-camera Chess Cluster Arena — readable live boards + Rhizoh vs Stockfish featured slot.
 */
export const RhizohChessClusterArenaV0 = memo(function RhizohChessClusterArenaV0({
  open,
  onClose,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const { boardColors, pieceBold, timeControl } = useChessArenaDisplaySettingsV0();
  const [slots, setSlots] = useState(() => listChessClusterSlotsV0());
  const [highlightSlot, setHighlightSlot] = useState(null);
  const [tickCount, setTickCount] = useState(0);
  const [teacherStatus, setTeacherStatus] = useState(() => getChessStockfishEngineStatusV0());
  const [routerSnap, setRouterSnap] = useState(() => window.__rhizoh?.chessGameRouter || null);
  const [monitor, setMonitor] = useState(() => getChessLearningMonitorSnapshotV0("ui_mount"));

  useEffect(() => {
    if (!open) return undefined;
    startChessLearningMeasurementV0();
    const refresh = () => {
      setSlots(listChessClusterSlotsV0());
      setTeacherStatus(getChessStockfishEngineStatusV0());
      setRouterSnap(window.__rhizoh?.chessGameRouter || null);
      setMonitor(getChessLearningMonitorSnapshotV0("poll"));
      setTickCount(window.__rhizoh?.chessGameCluster?.tickCount ?? 0);
    };
    const onEngineStatus = (ev) => {
      if (ev?.detail?.status) setTeacherStatus(ev.detail.status);
      refresh();
    };
    const onTick = () => refresh();
    const onMove = (ev) => {
      const slotId = ev?.detail?.slot?.slotId;
      if (slotId != null) {
        setHighlightSlot(slotId);
        window.setTimeout(() => setHighlightSlot(null), 700);
      }
      refresh();
    };
    const onMonitor = (ev) => {
      if (ev?.detail) setMonitor(ev.detail);
      else refresh();
    };
    window.addEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
    window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
    window.addEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, onMonitor);
    window.addEventListener(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, onEngineStatus);
    refresh();
    const poll = window.setInterval(refresh, 500);
    return () => {
      window.removeEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
      window.removeEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
      window.removeEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, onMonitor);
      window.removeEventListener(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, onEngineStatus);
      window.clearInterval(poll);
    };
  }, [open]);

  if (!open) return null;

  const padded = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 }, (_, i) => slots[i] || null);
  const teacherLabel =
    teacherStatus === "stockfish_wasm"
      ? tr
        ? "Stockfish WASM ✓"
        : "Stockfish WASM ✓"
      : teacherStatus === "stockfish_compiling" || teacherStatus === "stockfish_initializing"
        ? tr
          ? `WASM derleniyor (${Math.round((window.__rhizoh?.chessStockfishEngine?.compileElapsedMs || 0) / 1000)}s)`
          : `WASM compiling (${Math.round((window.__rhizoh?.chessStockfishEngine?.compileElapsedMs || 0) / 1000)}s)`
        : teacherStatus === "heuristic_fallback"
          ? tr
            ? "heuristic (yeniden dene)"
            : "heuristic (retry)"
          : tr
            ? "heuristic"
            : "heuristic";

  return (
    <div className="fixed inset-0 z-[340] flex items-center justify-center bg-black/90 p-1 backdrop-blur-sm sm:p-3">
      <div className="flex max-h-[98vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0a0f14] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2 sm:px-4 sm:py-3">
          <div>
            <h2 className="text-sm font-semibold text-white sm:text-base">
              {tr ? "8 Canlı Kamera · Chess Cluster" : "8 Live Cameras · Chess Cluster"}
            </h2>
            <p className="text-[10px] text-white/45 sm:text-[11px]">
              {tr
                ? `#1 Rhizoh AI vs Stockfish · tahta: ${timeControl.labelTr} · ${boardColors.label || "classic"}`
                : `#1 Rhizoh AI vs Stockfish · ${timeControl.labelEn} · ${boardColors.label || "classic"}`}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
            onClick={onClose}
          >
            {tr ? "Kapat" : "Close"}
          </button>
        </header>

        <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-4">
          <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/55">
            <span>
              tick {tickCount} · {isChessGameClusterRunningV0() ? (tr ? "sim aktif" : "sim on") : "sim off"}
            </span>
            <span>
              {tr ? "router" : "router"}: {routerSnap?.activeGames ?? 0}/{CHESS_CLUSTER_SLOT_COUNT_V0}{" "}
              {tr ? "oyun" : "games"}
            </span>
            <span>{tr ? "öğretmen" : "teacher"}: {teacherLabel}</span>
            <span>{timeControl.labelTr || padded[0]?.clock?.timeControlId || "—"}</span>
          </div>
          <LearningStripV0
            monitor={monitor}
            router={routerSnap}
            tr={tr}
            timeControlLabel={tr ? timeControl.labelTr : timeControl.labelEn}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {padded.map((slot, i) => (
              <LiveCameraBoardV0
                key={i}
                slot={slot}
                featured={i === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0}
                highlight={highlightSlot === i}
                tr={tr}
                boardColors={boardColors}
                pieceBold={pieceBold}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
