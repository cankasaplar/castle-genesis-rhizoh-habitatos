import React, { memo, useEffect, useState } from "react";
import {
  CHESS_CLUSTER_MOVE_EVENT_V0,
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_TICK_EVENT_V0,
  listChessClusterSlotsV0,
  isChessGameClusterRunningV0
} from "../rhizoh/runtime/chessGameClusterV0.js";
import { resolveChessClusterAgentPolicyV0 } from "../rhizoh/runtime/chessClusterAgentPolicyV0.js";
import { createChessArenaGameV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
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
      row.push({ color: cell.color, type: cell.type, glyph: PIECE_UNICODE_V0[key] || "?" });
    }
    rows.push(row);
  }
  return rows;
}

const CameraSlotV0 = memo(function CameraSlotV0({ slot, highlight }) {
  if (!slot) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-950/80 p-2 text-xs text-slate-500">
        —
      </div>
    );
  }

  const rows = boardRowsFromFen(slot.fen);
  const white = resolveChessClusterAgentPolicyV0(slot.whiteAgent);
  const black = resolveChessClusterAgentPolicyV0(slot.blackAgent);

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
      <div className="grid grid-cols-8 gap-px rounded bg-slate-800/80 p-0.5">
        {rows.map((row, ri) =>
          row.map((cell, ci) => {
            const dark = (ri + ci) % 2 === 1;
            return (
              <div
                key={`${ri}-${ci}`}
                className={`flex h-3 w-3 items-center justify-center text-[9px] leading-none sm:h-4 sm:w-4 sm:text-[10px] ${
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
          <span>{slot.status}</span>
        )}
      </div>
    </div>
  );
});

/**
 * 8-camera Chess Cluster Arena — visualization layer over simulation cluster.
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

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => setSlots(listChessClusterSlotsV0());
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
    window.addEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
    window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
    refresh();
    const poll = window.setInterval(refresh, 800);
    return () => {
      window.removeEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
      window.removeEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
      window.clearInterval(poll);
    };
  }, [open]);

  if (!open) return null;

  const padded = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 }, (_, i) => slots[i] || null);

  return (
    <div className="fixed inset-0 z-[340] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
              {tr ? "Chess Cluster · 8 kamera" : "Chess Cluster · 8 cameras"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {tr
                ? "Rhizoh izler — Stockfish oynar · öğrenme spatial bağımsız"
                : "Rhizoh observes — Stockfish plays · learning spatial-independent"}
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
          <div className="mb-2 text-[11px] text-slate-500">
            tick {tickCount} · {isChessGameClusterRunningV0() ? (tr ? "sim aktif" : "sim on") : "sim off"} ·{" "}
            {tr ? "canlı replay" : "live replay"}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {padded.map((slot, i) => (
              <CameraSlotV0 key={i} slot={slot} highlight={highlightSlot === i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
