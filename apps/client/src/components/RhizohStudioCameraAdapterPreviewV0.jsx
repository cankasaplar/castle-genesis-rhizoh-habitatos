import React, { memo } from "react";
import { STUDIO_OBSERVATION_ADAPTER_KIND_V0 } from "../rhizoh/runtime/rhizohStudioObservationAdapterRegistryV0.js";

const PIECE_GLYPH_V0 = Object.freeze({
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟"
});

/**
 * Per-camera visual consumer — renders adapter frame inside dashboard tile.
 * RESEARCH-ONLY · interpretation only.
 */
export const RhizohStudioCameraAdapterPreviewV0 = memo(function RhizohStudioCameraAdapterPreviewV0({
  frame,
  tr = false
}) {
  if (!frame?.consumerReady) {
    return (
      <p className="mt-1 text-[7px] text-white/35">
        {tr ? "adapter bekleniyor" : "adapter pending"}
      </p>
    );
  }

  switch (frame.kind) {
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.VISUAL_ARENA:
      return <ChessVisualPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.FEED_ARENA:
      return <GoFeedPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.SPARSE_ARENA:
      return <SparseArenaPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.CLIMATE:
      return <ClimatePreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.GRAPH:
      return <MemoryGraphPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.UNION_DIGEST:
      return <AcademyUnionPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.LIVE_FEED:
      return <LiveFeedPreview frame={frame} tr={tr} />;
    case STUDIO_OBSERVATION_ADAPTER_KIND_V0.HELD_PLACEHOLDER:
      return <HeldPlaceholderPreview frame={frame} tr={tr} />;
    default:
      return null;
  }
});

/** @param {{ frame: object, tr: boolean }} props */
function ChessVisualPreview({ frame, tr }) {
  const moves = frame.recentMoves || [];
  return (
    <div className="mt-1.5 space-y-1">
      {frame.fen ? (
        <div className="grid grid-cols-8 gap-px rounded border border-white/10 bg-black/40 p-0.5">
          {fenToMiniCells(frame.fen).map((cell, i) => (
            <span
              key={i}
              className={`flex h-2.5 w-2.5 items-center justify-center text-[6px] leading-none ${
                cell.dark ? "bg-white/10" : "bg-white/5"
              }`}
            >
              {cell.glyph}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-0.5">
        {moves.length > 0 ? (
          moves.map((san, i) => (
            <span
              key={`${san}-${i}`}
              className="rounded border border-emerald-400/30 bg-emerald-500/10 px-1 py-px font-mono text-[7px] text-emerald-100"
            >
              {san}
            </span>
          ))
        ) : (
          <span className="text-[7px] text-white/35">
            {tr ? "hamle bekleniyor" : "awaiting moves"}
          </span>
        )}
      </div>
      {frame.clusterRunning ? (
        <p className="text-[7px] text-emerald-200/80">
          {tr ? "cluster canlı" : "cluster live"} · ply {frame.ply ?? 0}
        </p>
      ) : null}
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function GoFeedPreview({ frame, tr }) {
  return (
    <div className="mt-1.5 rounded border border-white/8 bg-black/30 px-1.5 py-1">
      <p className="font-mono text-[8px] text-cyan-100/90">
        {frame.movesSeen} {tr ? "hamle" : "moves"} · {frame.stoneCount ?? 0}{" "}
        {tr ? "taş" : "stones"}
      </p>
      <p className="text-[7px] text-white/40">
        {frame.activeColor ? `${frame.activeColor} turn` : tr ? "besleme hazır" : "feed ready"}
      </p>
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function SparseArenaPreview({ frame, tr }) {
  return (
    <p className="mt-1.5 text-[7px] text-white/45">
      {frame.movesSeen > 0
        ? `${frame.movesSeen} ${tr ? "hamle izlendi" : "moves observed"}`
        : tr
          ? "seyrek kamera · oturum bekleniyor"
          : "sparse camera · awaiting session"}
    </p>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function ClimatePreview({ frame, tr }) {
  const share =
    frame.dayAShare01 != null ? `${Math.round(frame.dayAShare01 * 100)}%` : "—";
  return (
    <div className="mt-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-400/60"
          style={{ width: frame.dayAShare01 != null ? `${frame.dayAShare01 * 100}%` : "12%" }}
        />
      </div>
      <p className="mt-1 text-[7px] text-violet-100/80">
        {frame.climateLabel || (tr ? "farklılaşmamış" : "undifferentiated")} · Day A {share}
      </p>
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function MemoryGraphPreview({ frame, tr }) {
  const nodes = frame.nodes || [];
  return (
    <div className="mt-1.5 flex flex-wrap gap-0.5">
      {nodes.length > 0 ? (
        nodes.map((node) => (
          <span
            key={node.id}
            className="max-w-[5.5rem] truncate rounded border border-violet-400/25 bg-violet-500/10 px-1 py-px text-[7px] text-violet-100"
            title={node.title}
          >
            {node.source}
          </span>
        ))
      ) : (
        <span className="text-[7px] text-white/35">
          {tr ? "graf boş · demo tohumu dene" : "graph empty · try demo seed"}
        </span>
      )}
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function AcademyUnionPreview({ frame, tr }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-px text-[7px] font-mono text-cyan-100">
        {frame.unionLabel || "—"}
      </span>
      <span className="text-[7px] text-white/45">
        {frame.armedDisciplineCount ?? 0}/3 {tr ? "disiplin" : "disciplines"}
      </span>
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function LiveFeedPreview({ frame, tr }) {
  const chips = frame.recentChips || [];
  if (frame.feedEmpty) {
    return (
      <div className="mt-1.5 space-y-1">
        <p className="rounded border border-dashed border-white/15 px-1.5 py-1 text-[7px] text-white/40">
          {tr ? "besleme boş · gateway anahtarı gerek" : "feed empty · gateway keys required"}
        </p>
        <p className="text-[7px] text-amber-200/70">
          {tr ? "wireWorldSportsTube()" : "wireWorldSportsTube()"}
        </p>
      </div>
    );
  }
  return (
    <div className="mt-1.5 space-y-1">
      <p className="font-mono text-[8px] text-amber-100/90">
        {frame.liveMatchCount} live · {frame.pinCount} pins
      </p>
      <div className="flex flex-wrap gap-0.5">
        {chips.map((chip, i) => (
          <span
            key={`${chip.label}-${i}`}
            className="max-w-[5rem] truncate rounded border border-amber-400/30 bg-amber-500/10 px-1 py-px text-[7px] text-amber-100"
            title={chip.label}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** @param {{ frame: object, tr: boolean }} props */
function HeldPlaceholderPreview({ frame, tr }) {
  return (
    <p className="mt-1.5 rounded border border-amber-400/20 bg-amber-500/5 px-1.5 py-1 text-[7px] text-amber-100/75">
      {tr ? "legal hold · Cesium kapalı" : "legal hold · Cesium off"}
      {frame.phase ? ` · ${frame.phase}` : ""}
    </p>
  );
}

/**
 * @param {string} fen
 * @returns {{ glyph: string, dark: boolean }[]}
 */
function fenToMiniCells(fen) {
  const board = String(fen || "").split(" ")[0];
  if (!board) return [];
  const cells = [];
  for (const ch of board) {
    if (ch === "/") continue;
    if (/\d/.test(ch)) {
      const n = Number(ch);
      for (let i = 0; i < n; i += 1) {
        cells.push({ glyph: "", dark: cells.length % 2 === 1 });
      }
      continue;
    }
    const color = ch === ch.toUpperCase() ? "w" : "b";
    const type = ch.toUpperCase();
    const key = `${color}${type}`;
    cells.push({ glyph: PIECE_GLYPH_V0[key] || "", dark: cells.length % 2 === 1 });
  }
  return cells.slice(0, 64);
}
