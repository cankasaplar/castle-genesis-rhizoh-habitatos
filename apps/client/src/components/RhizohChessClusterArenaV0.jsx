import React, { memo, useEffect, useMemo, useState } from "react";
import {
  CHESS_CLUSTER_MOVE_EVENT_V0,
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_TICK_EVENT_V0,
  CHESS_CLUSTER_GAME_END_EVENT_V0,
  listChessClusterSlotsV0,
  isChessGameClusterRunningV0
} from "../rhizoh/runtime/chessGameClusterV0.js";
import { readChessCivilizationV0 } from "../rhizoh/runtime/chessCivilizationV0.js";
import { publishChessClusterArenaOpenV0 } from "../rhizoh/runtime/chessEngineContentionGateV0.js";
import { resolveChessClusterTimeControlV0 } from "../rhizoh/runtime/chessClusterSimulationPolicyV0.js";
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
import {
  formatClusterEndReasonLabelV0,
  formatEngineDisplayLabelV0,
  getChessObservatoryHeroCopyV0,
  resolveClusterSlotRoleCopyV0
} from "../rhizoh/runtime/chessClusterObservatoryCopyV0.js";
import { formatChessOutcomeLabelV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import { RhizohChessBoardV0 } from "./RhizohChessBoardV0.jsx";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";

function boardRowsFromFen(fen) {
  try {
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
  } catch {
    return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  }
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
  pieceBold,
  pieceStyleId,
  roleCopy
}) {
  if (!slot) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-black/40 text-xs text-white/40">
        —
      </div>
    );
  }

  const rows = boardRowsFromFen(slot.fen);
  const lastMove = slot.lastMove || null;
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
          ) : roleCopy ? (
            <span className="ml-1 rounded bg-white/10 px-1 py-px text-[7px] font-semibold uppercase text-white/55">
              {roleCopy.tag}
            </span>
          ) : null}
        </span>
        <span className="truncate text-right">{white.label} vs {black.label}</span>
      </div>
      {roleCopy ? (
        <p className="mb-1 line-clamp-2 text-[8px] leading-tight text-white/40" title={roleCopy.observes}>
          {roleCopy.role}
        </p>
      ) : null}

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

      <RhizohChessBoardV0
        rows={rows}
        boardColors={boardColors}
        pieceStyleId={pieceStyleId}
        pieceBold={pieceBold}
        lastMove={lastMove}
        sizeClass="w-full"
        showCoords={false}
        interactive={false}
        borderClass={
          featured
            ? "border border-cyan-400/50 shadow-[0_0_12px_rgba(0,204,255,0.2)]"
            : "border border-white/10"
        }
      />

      <div className="mt-1.5 flex justify-between text-[9px] text-white/50">
        <span>ply {slot.ply}</span>
        <span>{slot.turn === "w" ? (tr ? "beyaz" : "white") : tr ? "siyah" : "black"}</span>
        {slot.criticalEventCount > 0 ? (
          <span className="text-amber-300">⚠ {slot.criticalEventCount}</span>
        ) : slot.endReason ? (
          <span className="text-white/40">
            {formatClusterEndReasonLabelV0(slot.endReason, slot.ply, tr)}
          </span>
        ) : (
          <span>{slot.status}</span>
        )}
      </div>
    </div>
  );
});

function GameEndBannerV0({ banner, tr, onDismiss }) {
  if (!banner) return null;
  const endLabel = formatClusterEndReasonLabelV0(banner.endReason, banner.ply, tr);
  const outcomeLabel = formatChessOutcomeLabelV0(banner.outcome, tr);
  return (
    <div className="mb-2 rounded-lg border border-amber-400/45 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-50">
      <p className="font-semibold">
        #{banner.slotId + 1} · {outcomeLabel}
      </p>
      <p className="mt-0.5 text-[10px] text-amber-100/80">
        {endLabel} · {banner.moveCount} {tr ? "hamle" : "moves"}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-1 text-[9px] text-amber-200/70 underline hover:text-amber-100"
      >
        {tr ? "Tamam" : "Dismiss"}
      </button>
    </div>
  );
}

function LiveMatchPreflightV0({ tr, teacherStatus, featuredPly, onOpenLobby }) {
  const engineReady = teacherStatus === "stockfish_wasm";
  const matchWarm = featuredPly >= 4;
  if (engineReady && matchWarm) return null;
  return (
    <div className="mb-2 rounded-lg border border-white/15 bg-black/50 px-3 py-3 text-[11px] text-white/70">
      <p className="font-semibold text-white/90">
        {tr ? "Canlı maç hazırlanıyor" : "Live match warming up"}
      </p>
      <ul className="mt-2 space-y-1 text-[10px]">
        <li>{engineReady ? "✓" : "○"} Stockfish WASM</li>
        <li>
          {matchWarm ? "✓" : "○"} {tr ? "Ana tahta en az 4 hamle" : "Featured board ≥ 4 moves"} (ply {featuredPly})
        </li>
      </ul>
      <p className="mt-2 text-[9px] text-white/45">
        {tr
          ? "Henüz hazır değiliz — önce lobiden maç seç veya 8 kamera izleme moduna geç."
          : "Not ready yet — pick a match from lobby or watch the 8-camera grid."}
      </p>
      <button
        type="button"
        onClick={onOpenLobby}
        className="mt-2 rounded border border-cyan-400/40 px-2 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/15"
      >
        {tr ? "Chess lobisini aç" : "Open chess lobby"}
      </button>
    </div>
  );
}

function LearningStripV0({ monitor, activeSlotCount, tr, timeControlLabel, sessionGamesEnded, lastGameEnd, showTech }) {
  const recentMoves = monitor?.recentMoves || [];
  const lastMove = recentMoves[recentMoves.length - 1];
  const m = monitor?.measurement;
  const alignPct =
    m?.alignmentRate != null ? `${Math.round(m.alignmentRate * 100)}%` : "—";
  const lastEndLabel = lastGameEnd
    ? formatClusterEndReasonLabelV0(lastGameEnd.endReason, lastGameEnd.ply, tr)
    : null;

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-950/25 px-3 py-2 text-[10px] text-white/75">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-violet-200/90">
          {tr ? "Öğrenme durumu" : "Learning status"}
        </span>
        <span>
          {tr ? "ölçülen hamle" : "moves measured"}: {m?.movesMeasured ?? 0}
        </span>
        <span>
          Stockfish: {m?.stockfishMovesMeasured ?? 0}
        </span>
        <span>
          {tr ? "uyum" : "align"}: {alignPct}
        </span>
        <span>
          {tr ? "biten maç" : "games ended"}: {sessionGamesEnded}
        </span>
        {lastEndLabel ? (
          <span className="text-amber-200/80">
            {tr ? "son bitiş" : "last end"}: {lastEndLabel}
          </span>
        ) : null}
        {lastMove ? (
          <span className="font-mono text-cyan-200/90">
            {tr ? "son hamle" : "last move"}: {lastMove.san} ({formatEngineDisplayLabelV0(lastMove.engine, tr)})
          </span>
        ) : (
          <span className="text-white/40">{tr ? "hamle bekleniyor" : "awaiting moves"}</span>
        )}
      </div>
      {showTech ? (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-violet-500/20 pt-1.5 text-[9px] text-white/40">
          <span>
            {tr ? "Motor" : "Engine"}: {monitor?.engineStatus || "—"}
          </span>
          <span>policy_diff: {m?.policyDiffsMeasured ?? 0}</span>
          <span>
            {tr ? "aktif slot" : "active slots"}: {activeSlotCount}/{CHESS_CLUSTER_SLOT_COUNT_V0}
          </span>
          <span>{timeControlLabel || "—"}</span>
          <span>mem {monitor?.memoryNodeCount ?? 0}</span>
          <span>tick {monitor?.clusterTick ?? 0}</span>
          <span>
            #{CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 + 1} ply {monitor?.spectator?.ply ?? 0}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function FeaturedMatchBroadcastV0({
  slot,
  monitor,
  tr,
  boardColors,
  pieceBold,
  pieceStyleId,
  civilization,
  sessionGamesEnded,
  heroCopy,
  roleCopy,
  lastGameEnd
}) {
  if (!slot) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/40">
        —
      </div>
    );
  }

  const rows = boardRowsFromFen(slot.fen);
  const white = resolveChessClusterAgentPolicyV0(slot.whiteAgent);
  const black = resolveChessClusterAgentPolicyV0(slot.blackAgent);
  const turnW = slot.turn === "w";
  const slotMoves = (monitor?.recentMoves || []).filter(
    (m) => m.slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0
  );
  const lastMove = slot.lastMove || slotMoves[slotMoves.length - 1] || null;
  const lastEndLabel = lastGameEnd
    ? formatClusterEndReasonLabelV0(lastGameEnd.endReason, lastGameEnd.ply, tr)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-3 py-2">
          <p className="text-[11px] font-semibold text-cyan-100">{heroCopy?.title}</p>
          <p className="mt-0.5 text-[10px] text-white/50">{heroCopy?.subtitle}</p>
          {roleCopy ? (
            <p className="mt-1 text-[9px] text-violet-200/75">{roleCopy.observes}</p>
          ) : null}
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/70">
          <span className="font-semibold text-cyan-100">
            LIVE · {white.label} vs {black.label}
          </span>
          <span className="font-mono text-[10px] text-white/45">{slot.matchId}</span>
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2 max-w-md">
          <ClockRowV0
            label={`${white.label} · ELO ${civilization?.elo ?? "—"}`}
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
        <RhizohChessBoardV0
          rows={rows}
          boardColors={boardColors}
          pieceStyleId={pieceStyleId}
          pieceBold={pieceBold}
          lastMove={lastMove}
          sizeClass="mx-auto w-full max-w-[min(100%,min(72vw,52dvh))]"
          interactive={false}
          borderClass="border-2 border-cyan-400/50 shadow-[0_0_24px_rgba(0,204,255,0.2)]"
        />
        <p className="mt-2 text-center text-[10px] text-white/45">
          ply {slot.ply} · {tr ? "oturum maç" : "session games"}: {sessionGamesEnded}
          {lastEndLabel ? ` · ${tr ? "son bitiş" : "last end"}: ${lastEndLabel}` : ""}
        </p>
        <p className="mt-1 text-center text-[9px] text-white/35">{heroCopy?.learningNote}</p>
      </div>
      <div className="flex w-full shrink-0 flex-col rounded-lg border border-white/10 bg-black/40 p-3 lg:w-56">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-200/80">
          {tr ? "Canlı hamleler" : "Live moves"}
        </p>
        <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-[10px] text-cyan-100/90">
          {slotMoves.length ? (
            slotMoves
              .slice(-12)
              .reverse()
              .map((m, i) => (
                <li key={`${m.san}-${i}`}>
                  {m.san}{" "}
                  <span className="text-white/35">({formatEngineDisplayLabelV0(m.engine, tr)})</span>
                </li>
              ))
          ) : (
            <li className="text-white/35">{tr ? "hamle bekleniyor" : "awaiting moves"}</li>
          )}
        </ul>
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
  const { boardColors, pieceBold, pieceStyleId } = useChessArenaDisplaySettingsV0();
  const [clusterTimeControlId, setClusterTimeControlId] = useState(
    () => window.__rhizoh?.chessGameCluster?.timeControlId || null
  );
  const clusterTimeControl = useMemo(
    () => resolveChessClusterTimeControlV0(clusterTimeControlId),
    [clusterTimeControlId]
  );
  const [slots, setSlots] = useState(() => listChessClusterSlotsV0());
  const activeSlotCount = slots.filter((s) => s?.status === "active").length;
  const [highlightSlot, setHighlightSlot] = useState(null);
  const [tickCount, setTickCount] = useState(0);
  const [teacherStatus, setTeacherStatus] = useState(() => getChessStockfishEngineStatusV0());
  const [routerSnap, setRouterSnap] = useState(() => window.__rhizoh?.chessGameRouter || null);
  const [monitor, setMonitor] = useState(() => getChessLearningMonitorSnapshotV0("ui_mount"));
  const [viewMode, setViewMode] = useState("featured");
  const [showTechStrip, setShowTechStrip] = useState(false);
  const [sessionGamesEnded, setSessionGamesEnded] = useState(
    () => Number(window.__rhizoh?.chessGameCluster?.sessionGamesEnded) || 0
  );
  const [lastGameEnd, setLastGameEnd] = useState(
    () => window.__rhizoh?.chessGameCluster?.lastGameEnd || null
  );
  const [gameEndBanner, setGameEndBanner] = useState(null);
  const civilization = useMemo(() => readChessCivilizationV0(), [monitor, tickCount]);
  const heroCopy = useMemo(() => getChessObservatoryHeroCopyV0(tr), [tr]);
  const featuredRoleCopy = useMemo(
    () => resolveClusterSlotRoleCopyV0(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0, tr),
    [tr]
  );

  const openChessLobby = () => {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
        detail: Object.freeze({
          source: "cluster_arena",
          node: Object.freeze({
            id: "chess_arena",
            type: "zone",
            label: "CHESS",
            name: tr ? "Rhizoh Chess Lobby" : "Rhizoh Chess Lobby",
            color: "#22d3ee"
          })
        })
      })
    );
    onClose?.();
  };

  useEffect(() => {
    publishChessClusterArenaOpenV0(Boolean(open));
    return () => publishChessClusterArenaOpenV0(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    startChessLearningMeasurementV0();
    const refresh = () => {
      setSlots(listChessClusterSlotsV0());
      setTeacherStatus(getChessStockfishEngineStatusV0());
      setRouterSnap(window.__rhizoh?.chessGameRouter || null);
      setMonitor(getChessLearningMonitorSnapshotV0("poll"));
      setTickCount(window.__rhizoh?.chessGameCluster?.tickCount ?? 0);
      setClusterTimeControlId(window.__rhizoh?.chessGameCluster?.timeControlId || null);
      setSessionGamesEnded(Number(window.__rhizoh?.chessGameCluster?.sessionGamesEnded) || 0);
      setLastGameEnd(window.__rhizoh?.chessGameCluster?.lastGameEnd || null);
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
    const onGameEnd = (ev) => {
      const detail = ev?.detail;
      const ended = detail?.slot;
      if (ended) {
        setGameEndBanner(
          Object.freeze({
            slotId: ended.slotId,
            outcome: detail.outcome,
            endReason: detail.endReason,
            ply: ended.ply,
            moveCount: detail.moves?.length ?? ended.moveCount ?? ended.ply ?? 0
          })
        );
        window.setTimeout(() => setGameEndBanner(null), 6000);
      }
      refresh();
    };
    window.addEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
    window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
    window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, onGameEnd);
    window.addEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, onMonitor);
    window.addEventListener(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, onEngineStatus);
    refresh();
    const poll = window.setInterval(refresh, 500);
    return () => {
      window.removeEventListener(CHESS_CLUSTER_TICK_EVENT_V0, onTick);
      window.removeEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, onMove);
      window.removeEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, onGameEnd);
      window.removeEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, onMonitor);
      window.removeEventListener(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, onEngineStatus);
      window.clearInterval(poll);
    };
  }, [open]);

  if (!open) return null;

  const padded = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 }, (_, i) => slots[i] || null);
  const featuredSlot = padded[CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0];
  const liveMatchReady =
    teacherStatus === "stockfish_wasm" && (featuredSlot?.ply ?? 0) >= 4;
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
              {heroCopy.title}
            </h2>
            <p className="text-[10px] text-white/45 sm:text-[11px]">
              {heroCopy.subtitle}
              {" · "}
              {tr ? clusterTimeControl.labelTr : clusterTimeControl.labelEn}
              {" · "}
              {boardColors.label || "classic"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChessLobby}
              className="hidden rounded-md border border-white/20 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10 sm:inline"
            >
              {tr ? "Lobi" : "Lobby"}
            </button>
            <div className="flex rounded-md border border-white/15 p-0.5 text-[10px]">
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${viewMode === "featured" ? "bg-cyan-500/25 text-cyan-50" : "text-white/50"}`}
                onClick={() => setViewMode("featured")}
              >
                {heroCopy.ctaLive}
              </button>
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${viewMode === "grid" ? "bg-white/15 text-white" : "text-white/50"}`}
                onClick={() => setViewMode("grid")}
              >
                {heroCopy.ctaGrid}
              </button>
            </div>
            <button
              type="button"
              className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              onClick={onClose}
            >
              {tr ? "Kapat" : "Close"}
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-4">
          <GameEndBannerV0
            banner={gameEndBanner}
            tr={tr}
            onDismiss={() => setGameEndBanner(null)}
          />
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/55">
            <span>
              {isChessGameClusterRunningV0() ? (tr ? "● yayın aktif" : "● broadcast on") : tr ? "○ yayın kapalı" : "○ broadcast off"}
            </span>
            <span>
              {tr ? "aktif kamera" : "active cameras"}: {activeSlotCount}/{CHESS_CLUSTER_SLOT_COUNT_V0}
            </span>
            <span>{tr ? "öğretmen" : "teacher"}: {teacherLabel}</span>
            {civilization?.elo != null ? (
              <span className="text-cyan-200/80">Rhizoh ELO {civilization.elo}</span>
            ) : null}
            <button
              type="button"
              className="text-[9px] text-white/35 underline decoration-white/20 hover:text-white/55"
              onClick={() => setShowTechStrip((v) => !v)}
            >
              {showTechStrip
                ? tr
                  ? "teknik detayı gizle"
                  : "hide tech details"
                : tr
                  ? "teknik detay"
                  : "tech details"}
            </button>
          </div>
          {showTechStrip ? (
            <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-white/35">
              <span>tick {tickCount}</span>
              <span>
                {tr ? "motor kuyruğu" : "engine queue"}: {routerSnap?.queuedOps ?? 0}
              </span>
              <span>{tr ? clusterTimeControl.labelTr : clusterTimeControl.labelEn}</span>
              <span>{tr ? "saat ply≥1" : "clock after move 1"}</span>
            </div>
          ) : null}
          <LearningStripV0
            monitor={monitor}
            activeSlotCount={activeSlotCount}
            tr={tr}
            timeControlLabel={tr ? clusterTimeControl.labelTr : clusterTimeControl.labelEn}
            sessionGamesEnded={sessionGamesEnded}
            lastGameEnd={lastGameEnd}
            showTech={showTechStrip}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {viewMode === "featured" ? (
            <>
              <LiveMatchPreflightV0
                tr={tr}
                teacherStatus={teacherStatus}
                featuredPly={featuredSlot?.ply ?? 0}
                onOpenLobby={openChessLobby}
              />
              {liveMatchReady ? (
                <FeaturedMatchBroadcastV0
                  slot={featuredSlot}
                  monitor={monitor}
                  tr={tr}
                  boardColors={boardColors}
                  pieceBold={pieceBold}
                  pieceStyleId={pieceStyleId}
                  civilization={civilization}
                  sessionGamesEnded={sessionGamesEnded}
                  heroCopy={heroCopy}
                  roleCopy={featuredRoleCopy}
                  lastGameEnd={lastGameEnd}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-sm text-white/45">
                  <p>{tr ? "Canlı maç henüz hazır değil." : "Live match not ready yet."}</p>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className="rounded border border-white/20 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
                  >
                    {tr ? "8 kamera izle" : "Watch 8 cameras"}
                  </button>
                </div>
              )}
            </>
          ) : (
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
                  pieceStyleId={pieceStyleId}
                  roleCopy={resolveClusterSlotRoleCopyV0(i, tr)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
