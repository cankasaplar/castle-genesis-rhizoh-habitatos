import React, { memo, useEffect, useState } from "react";
import {
  CHESS_CLUSTER_MOVE_EVENT_V0,
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_TICK_EVENT_V0,
  listChessClusterSlotsV0,
  isChessGameClusterRunningV0
} from "../rhizoh/runtime/chessGameClusterV0.js";
import { getChessStockfishEngineStatusV0 } from "../rhizoh/runtime/chessStockfishEngineV0.js";
import { resolveChessClusterAgentPolicyV0 } from "../rhizoh/runtime/chessClusterAgentPolicyV0.js";
import { createChessArenaGameV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import {
  CHESS_LEARNING_MONITOR_EVENT_V0,
  CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
  getChessLearningMonitorSnapshotV0
} from "../rhizoh/runtime/chessLearningMonitorV0.js";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";

function boardRowsFromFen(fen, cellClass = "h-3 w-3 sm:h-4 sm:w-4") {
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
        type: cell.type,
        glyph: PIECE_UNICODE_V0[key] || "?",
        cellClass
      });
    }
    rows.push(row);
  }
  return rows;
}

function ClockRowV0({ label, clock, active, tr }) {
  return (
    <div
      className={`flex items-center justify-between rounded px-2 py-1 text-[10px] ${
        active ? "bg-cyan-500/15 text-cyan-100" : "bg-slate-900/60 text-slate-400"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="font-mono tabular-nums">{clock || "—"}</span>
      {active ? <span className="text-[9px] text-cyan-300/80">{tr ? "sırada" : "on clock"}</span> : null}
    </div>
  );
}

const CameraSlotV0 = memo(function CameraSlotV0({ slot, highlight, tr, compact = false }) {
  if (!slot) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-950/80 p-2 text-xs text-slate-500">
        —
      </div>
    );
  }

  const rows = boardRowsFromFen(
    slot.fen,
    compact ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"
  );
  const white = resolveChessClusterAgentPolicyV0(slot.whiteAgent);
  const black = resolveChessClusterAgentPolicyV0(slot.blackAgent);
  const turnW = slot.turn === "w";

  return (
    <div
      className={`rounded-lg border p-2 ${
        highlight
          ? "border-cyan-400/70 bg-cyan-950/30 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          : "border-slate-700/60 bg-slate-950/80"
      }`}
      data-chess-cluster-slot={slot.slotId}
    >
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>#{slot.slotId + 1}</span>
        <span className="truncate">{white.label} vs {black.label}</span>
        <span>⚡{slot.attentionWeight?.toFixed?.(1) || "1.0"}</span>
      </div>
      <div className="mb-1 space-y-0.5">
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
      <div className="grid grid-cols-8 gap-px rounded bg-slate-800/80 p-0.5">
        {rows.map((row, ri) =>
          row.map((cell, ci) => {
            const dark = (ri + ci) % 2 === 1;
            return (
              <div
                key={`${ri}-${ci}`}
                className={`flex items-center justify-center text-[9px] leading-none sm:text-[10px] ${cell?.cellClass || ""} ${
                  dark ? "bg-slate-700/90" : "bg-slate-600/40"
                }`}
              >
                <span className={cell?.color === "w" ? "text-slate-100" : "text-slate-900"}>
                  {cell?.glyph || ""}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>ply {slot.ply}</span>
        <span>{slot.turn === "w" ? "…w" : "…b"}</span>
        {slot.criticalEventCount > 0 ? (
          <span className="text-amber-400">⚠ {slot.criticalEventCount}</span>
        ) : (
          <span>{slot.endReason === "timeout" ? (tr ? "süre" : "flag") : slot.status}</span>
        )}
      </div>
    </div>
  );
});

function LearningMonitorPanelV0({ monitor, tr }) {
  const spectator = monitor?.spectator;
  const recentMoves = monitor?.recentMoves || [];
  const recentDiffs = monitor?.recentPolicyDiffs || [];

  return (
    <section className="rounded-lg border border-violet-500/35 bg-violet-950/20 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-300/70">
        {tr ? "Öğrenme izleyici" : "Learning monitor"}
      </p>
      <div className="mt-2 grid gap-2 text-[10px] text-slate-300 sm:grid-cols-2">
        <div>
          <p className="text-slate-500">{tr ? "Motor" : "Engine"}</p>
          <p className="font-mono text-[11px]">{monitor?.engineStatus || "—"}</p>
          <p className="text-[9px] text-slate-500">
            tick {monitor?.clusterTick ?? 0} · mem {monitor?.memoryNodeCount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-slate-500">{tr ? "İzlenen maç" : "Featured match"}</p>
          <p className="text-[11px]">
            {spectator?.modeLabel || "Rhizoh AI vs Stockfish"} · ply {spectator?.ply ?? 0}
          </p>
          <p className="text-[9px] text-slate-500">
            {spectator?.clock?.whiteClock} / {spectator?.clock?.blackClock}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase text-slate-500">
            {tr ? "Son hamleler" : "Recent moves"}
          </p>
          <ul className="max-h-24 space-y-0.5 overflow-y-auto">
            {recentMoves.length ? (
              recentMoves
                .slice()
                .reverse()
                .slice(0, 8)
                .map((m, i) => (
                  <li key={`${m.atMs}-${i}`} className="font-mono text-[9px] text-cyan-200/85">
                    #{m.slotId + 1} {m.san} · {m.engine}
                    {m.critical ? " ⚠" : ""}
                  </li>
                ))
            ) : (
              <li className="text-[9px] text-slate-500">{tr ? "Henüz hamle yok" : "No moves yet"}</li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase text-slate-500">policy_diff</p>
          <ul className="max-h-24 space-y-0.5 overflow-y-auto">
            {recentDiffs.length ? (
              recentDiffs
                .slice()
                .reverse()
                .slice(0, 6)
                .map((d, i) => (
                  <li key={`${d.atMs || i}-${i}`} className="text-[9px] text-violet-200/85">
                    {d.summary || d.kind || "diff"} · slot {d.slotId ?? "?"}
                  </li>
                ))
            ) : (
              <li className="text-[9px] text-slate-500">
                {tr ? "Öğrenme farkı bekleniyor" : "Awaiting policy diff"}
              </li>
            )}
          </ul>
        </div>
      </div>
      <p className="mt-2 font-mono text-[8px] text-slate-600">
        window.__rhizoh.chessLearningMonitor
      </p>
    </section>
  );
}

/**
 * 8-camera Chess Cluster Arena — featured Rhizoh vs Stockfish + learning monitor.
 */
export const RhizohChessClusterArenaV0 = memo(function RhizohChessClusterArenaV0({
  open,
  onClose,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [slots, setSlots] = useState(() => listChessClusterSlotsV0());
  const [highlightSlot, setHighlightSlot] = useState(null);
  const [tickCount, setTickCount] = useState(0);
  const [teacherStatus, setTeacherStatus] = useState(() => getChessStockfishEngineStatusV0());
  const [monitor, setMonitor] = useState(() => getChessLearningMonitorSnapshotV0("ui_mount"));

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => {
      setSlots(listChessClusterSlotsV0());
      setTeacherStatus(getChessStockfishEngineStatusV0());
      setMonitor(getChessLearningMonitorSnapshotV0("poll"));
    };
    const onTick = () => {
      setTickCount((n) => n + 1);
      refresh();
    };
    const onMove = (ev) => {
      const slotId = ev?.detail?.slot?.slotId;
      if (slotId != null) {
        setHighlightSlot(slotId);
        window.setTimeout(() => setHighlightSlot(null), 600);
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
    refresh();
    const poll = window.setInterval(refresh, 800);
    return () => {
      window.removeEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
      window.removeEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
      window.removeEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, onMonitor);
      window.clearInterval(poll);
    };
  }, [open]);

  if (!open) return null;

  const featured = slots[CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0] || null;
  const others = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 - 1 }, (_, i) => slots[i + 1] || null);

  return (
    <div className="fixed inset-0 z-[340] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
              {tr ? "Chess Cluster · Rhizoh AI vs Stockfish" : "Chess Cluster · Rhizoh AI vs Stockfish"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {tr
                ? "Slot 1 izleme tahtası · 7 paralel sim · zaman limiti + öğrenme izleyici"
                : "Slot 1 featured board · 7 parallel sims · clocks + learning monitor"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
            onClick={onClose}
          >
            {tr ? "Kapat" : "Close"}
          </button>
        </header>
        <div className="overflow-y-auto p-3 sm:p-4">
          <div className="mb-3 text-[11px] text-slate-500">
            tick {tickCount} · {isChessGameClusterRunningV0() ? (tr ? "sim aktif" : "sim on") : "sim off"} ·{" "}
            {teacherStatus === "stockfish_wasm"
              ? tr
                ? "öğretmen: Stockfish WASM"
                : "teacher: Stockfish WASM"
              : teacherStatus === "stockfish_compiling"
                ? tr
                  ? "öğretmen: WASM derleniyor"
                  : "teacher: WASM compiling"
                : tr
                  ? "öğretmen: heuristic"
                  : "teacher: heuristic"}{" "}
            · {featured?.clock?.timeControlId || "—"}
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">
                {tr ? "İzleme tahtası (#1)" : "Spectator board (#1)"}
              </p>
              <CameraSlotV0
                slot={featured}
                highlight={highlightSlot === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0}
                tr={tr}
                compact={false}
              />
            </div>
            <LearningMonitorPanelV0 monitor={monitor} tr={tr} />
          </div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {tr ? "Diğer masalar (#2–8)" : "Other boards (#2–8)"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {others.map((slot, i) => (
              <CameraSlotV0
                key={i + 1}
                slot={slot}
                highlight={highlightSlot === i + 1}
                tr={tr}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
