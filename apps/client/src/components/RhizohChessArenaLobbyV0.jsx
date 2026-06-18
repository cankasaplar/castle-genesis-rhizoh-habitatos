import React, { memo, useEffect, useState } from "react";
import {
  CHESS_ARENA_CURRENT_SEASON_V0,
  CHESS_ARENA_FIXTURES_V0,
  CHESS_ARENA_QUICK_MATCH_V0,
  getChessArenaLearningFeedV0,
  listChessArenaArchivePreviewV0
} from "../rhizoh/runtime/chessArenaLobbyV0.js";
import { formatChessOutcomeLabelV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import { RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 } from "../rhizoh/runtime/chessGameClusterV0.js";
import {
  listChessOpponentPresetsV0,
  listChessTimeControlsV0,
  readChessArenaSessionV0,
  resolveChessOpponentPresetV0,
  resolveChessTimeControlV0,
  saveChessArenaSessionV0,
  CHESS_ARENA_SESSION_EVENT_V0
} from "../rhizoh/runtime/chessArenaSessionV0.js";
import {
  CHESS_BOARD_THEME_V0,
  CHESS_PIECE_STYLE_V0,
  saveChessArenaThemeV0,
  CHESS_ARENA_THEME_EVENT_V0
} from "../rhizoh/runtime/chessArenaThemeV0.js";
import {
  CHESS_LEARNING_MONITOR_EVENT_V0,
  getChessLearningMonitorSnapshotV0,
  startChessLearningMeasurementV0
} from "../rhizoh/runtime/chessLearningMonitorV0.js";
import { useChessArenaDisplaySettingsV0 } from "../hooks/useChessArenaDisplaySettingsV0.js";
import {
  CHESS_POLICY_MODE_V0,
  readChessPolicyModeV0,
  saveChessPolicyModeV0
} from "../rhizoh/runtime/chessPolicyModeV0.js";
import { getChessObservatoryHeroCopyV0 } from "../rhizoh/runtime/chessClusterObservatoryCopyV0.js";

function EngineStatusChipV0({ engineStatus, engineDetail, tr }) {
  const label =
    engineStatus === "stockfish_wasm"
      ? tr
        ? "Motor: Stockfish WASM ✓"
        : "Engine: Stockfish WASM ✓"
      : engineStatus === "stockfish_compiling"
        ? tr
          ? "Motor: WASM derleniyor…"
          : "Engine: compiling WASM…"
        : engineStatus === "heuristic_fallback"
          ? tr
            ? "Motor: yedek (heuristic)"
            : "Engine: fallback (heuristic)"
          : tr
            ? "Motor: başlatılıyor…"
            : "Engine: starting…";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-[10px] ${
        engineStatus === "stockfish_wasm"
          ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100"
          : "border-amber-500/35 bg-amber-950/30 text-amber-100"
      }`}
    >
      <p className="font-semibold">{label}</p>
      {engineDetail?.spawnPolicy ? (
        <p className="mt-0.5 font-mono text-[9px] opacity-80">
          {engineDetail.spawnPolicy} · {engineDetail.workerStrategy || "blob"}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Chess Arena lobby — match prep before board; gateway to 8-board observatory.
 */
export const RhizohChessArenaLobbyV0 = memo(function RhizohChessArenaLobbyV0({
  tr,
  engineStatus,
  engineDetail,
  onStartMatch,
  onOpenArchive,
  onRetryEngine
}) {
  const archive = listChessArenaArchivePreviewV0(4);
  const season = CHESS_ARENA_CURRENT_SEASON_V0;
  const timeControls = listChessTimeControlsV0();
  const opponentPresets = listChessOpponentPresetsV0();
  const { theme: boardTheme, boardColors, pieceBold } = useChessArenaDisplaySettingsV0();
  const [learning, setLearning] = useState(() => getChessArenaLearningFeedV0());
  const [timeControlId, setTimeControlId] = useState(() => readChessArenaSessionV0().timeControlId);
  const [opponentPresetId, setOpponentPresetId] = useState(
    () => readChessArenaSessionV0().opponentPresetId
  );
  const [policyMode, setPolicyMode] = useState(() => readChessPolicyModeV0());
  const [selectedMatchId, setSelectedMatchId] = useState(CHESS_ARENA_QUICK_MATCH_V0[0]?.id || null);

  const selectedQuick = CHESS_ARENA_QUICK_MATCH_V0.find((m) => m.id === selectedMatchId) || null;
  const activeOpponent = resolveChessOpponentPresetV0(opponentPresetId);
  const heroCopy = getChessObservatoryHeroCopyV0(tr);

  useEffect(() => {
    const refreshLearning = () => setLearning(getChessArenaLearningFeedV0());
    const onSession = (ev) => {
      const id = ev?.detail?.timeControlId;
      if (id) setTimeControlId(id);
      refreshLearning();
    };
    const onStorage = () => {
      setTimeControlId(readChessArenaSessionV0().timeControlId);
      refreshLearning();
    };
    window.addEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
    window.addEventListener(CHESS_ARENA_THEME_EVENT_V0, refreshLearning);
    window.addEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, refreshLearning);
    window.addEventListener("storage", onStorage);
    refreshLearning();
    return () => {
      window.removeEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
      window.removeEventListener(CHESS_ARENA_THEME_EVENT_V0, refreshLearning);
      window.removeEventListener(CHESS_LEARNING_MONITOR_EVENT_V0, refreshLearning);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const activeTc = resolveChessTimeControlV0(timeControlId);

  const onTimeControlChange = (id) => {
    saveChessArenaSessionV0({ timeControlId: id });
    setTimeControlId(id);
  };

  const onOpponentChange = (id) => {
    saveChessArenaSessionV0({ opponentPresetId: id });
    setOpponentPresetId(id);
  };

  const selectQuickMatch = (row) => {
    setSelectedMatchId(row.id);
    if (row.defaultOpponentPresetId) {
      onOpponentChange(row.defaultOpponentPresetId);
    }
  };

  const launchSelectedMatch = () => {
    if (!selectedQuick) return;
    saveChessPolicyModeV0(policyMode);
    onStartMatch({
      mode: selectedQuick.mode,
      opponentPresetId,
      policyMode
    });
  };

  const launchFixture = (fx) => {
    if (fx.mode === "cluster") {
      openCluster();
      return;
    }
    if (fx.defaultOpponentPresetId) onOpponentChange(fx.defaultOpponentPresetId);
    onStartMatch({
      mode: fx.mode,
      opponentPresetId: fx.defaultOpponentPresetId || opponentPresetId,
      policyMode
    });
  };

  const openCluster = () => {
    startChessLearningMeasurementV0();
    window.dispatchEvent(new CustomEvent(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
      <section className="rounded-xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 to-violet-950/25 p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300/70">
          {tr ? "Rhizoh Chess Observatory" : "Rhizoh Chess Observatory"}
        </p>
        <h2 className="mt-1 text-lg font-bold text-cyan-50">{heroCopy.title}</h2>
        <p className="mt-1 max-w-xl text-[11px] text-white/55">{heroCopy.lobbyDesc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCluster}
            className="rounded-lg border border-cyan-400/55 bg-cyan-500/20 px-4 py-2.5 text-[12px] font-bold text-cyan-50 hover:bg-cyan-500/30"
          >
            {heroCopy.lobbyCta}
          </button>
          {learning.clusterRunning ? (
            <span className="flex items-center rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-[10px] text-emerald-200/90">
              ● {tr ? "Yayın aktif" : "Broadcast live"} · tick {learning.clusterTick}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[9px] text-white/35">{heroCopy.learningNote}</p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/70">
            {tr ? "Maç hazırlığı" : "Match preparation"}
          </p>
          <h3 className="mt-1 text-base font-bold text-emerald-50">
            {tr ? "Yeni oyun başlat" : "Start a new game"}
          </h3>
          <p className="mt-1 text-[11px] text-white/50">
            {tr
              ? "Mod seç → tek tıkla tahtaya geç. Zaman kontrolü cluster + arena için ortak."
              : "Pick a mode → one tap to board. Time control applies to cluster + arena."}
          </p>
          <div className="mt-3">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
              {tr ? "Zaman kontrolü" : "Time control"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {timeControls.map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => onTimeControlChange(tc.id)}
                  className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold transition ${
                    timeControlId === tc.id
                      ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-100"
                      : "border-white/10 bg-black/30 text-white/55 hover:border-white/25"
                  }`}
                >
                  {tr ? tc.labelTr : tc.labelEn}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-white/35">
              {tr ? "Aktif" : "Active"}: {tr ? activeTc.labelTr : activeTc.labelEn}
              {activeTc.incrementMs > 0 ? ` (+${activeTc.incrementMs / 1000}s)` : ""}
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
                {tr ? "Tahta teması" : "Board theme"}
              </p>
              <select
                value={boardTheme.boardThemeId}
                onChange={(e) => saveChessArenaThemeV0({ boardThemeId: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {Object.entries(CHESS_BOARD_THEME_V0).map(([id, row]) => (
                  <option key={id} value={id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
                {tr ? "Taş stili" : "Piece style"}
              </p>
              <select
                value={boardTheme.pieceStyleId}
                onChange={(e) => saveChessArenaThemeV0({ pieceStyleId: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                <option value={CHESS_PIECE_STYLE_V0.unicode}>Unicode</option>
                <option value={CHESS_PIECE_STYLE_V0.bold}>{tr ? "Kalın" : "Bold"}</option>
              </select>
            </div>
          </div>
          <div
            className="mt-2 grid grid-cols-8 gap-px overflow-hidden rounded-md border border-white/10 p-1"
            style={{ background: boardColors.dark }}
            aria-hidden
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const dark = i % 2 === 1;
              return (
                <div
                  key={i}
                  className={`aspect-square ${pieceBold ? "font-black" : "font-semibold"} text-[10px] flex items-center justify-center`}
                  style={{ background: dark ? boardColors.dark : boardColors.light, color: dark ? "#fff8" : "#0008" }}
                >
                  {i === 0 ? "♔" : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
                {tr ? "Rakip gücü" : "Opponent strength"}
              </p>
              <select
                value={opponentPresetId}
                onChange={(e) => onOpponentChange(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {opponentPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {tr ? p.labelTr : p.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
                {tr ? "Rhizoh politikası" : "Rhizoh policy"}
              </p>
              <select
                value={policyMode}
                onChange={(e) => setPolicyMode(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                <option value={CHESS_POLICY_MODE_V0.AGGRESSIVE}>
                  {tr ? "Agresif" : "Aggressive"}
                </option>
                <option value={CHESS_POLICY_MODE_V0.BALANCED}>{tr ? "Dengeli" : "Balanced"}</option>
                <option value={CHESS_POLICY_MODE_V0.SAFE}>{tr ? "Güvenli" : "Safe"}</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-white/40">
            {tr ? "Seçili rakip" : "Selected opponent"}: {tr ? activeOpponent.labelTr : activeOpponent.labelEn}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CHESS_ARENA_QUICK_MATCH_V0.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => selectQuickMatch(row)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  selectedMatchId === row.id
                    ? "border-emerald-400/65 bg-emerald-500/15"
                    : "border-white/10 bg-black/40 hover:border-emerald-400/45 hover:bg-emerald-500/10"
                }`}
              >
                <p className="text-[12px] font-semibold text-white">{tr ? row.labelTr : row.labelEn}</p>
                <p className="mt-0.5 text-[10px] text-white/45">{tr ? row.descTr : row.descEn}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={launchSelectedMatch}
            disabled={!selectedQuick}
            className="mt-3 w-full rounded-lg border border-emerald-400/55 bg-emerald-500/20 px-3 py-2.5 text-[12px] font-bold text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-40"
          >
            {selectedQuick
              ? tr
                ? `Maçı başlat · ${selectedQuick.labelTr}`
                : `Start match · ${selectedQuick.labelEn}`
              : tr
                ? "Maç seç"
                : "Select a match"}
          </button>
          <button
            type="button"
            onClick={openCluster}
            className="mt-3 w-full rounded-lg border border-cyan-400/35 bg-cyan-500/5 px-3 py-2 text-[11px] font-semibold text-cyan-200/80 hover:bg-cyan-500/15"
          >
            {tr ? "Gözlem kameralarını aç" : "Open trace cameras"}
          </button>
        </section>

        <section className="flex flex-col gap-2">
          <EngineStatusChipV0 engineStatus={engineStatus} engineDetail={engineDetail} tr={tr} />
          {engineStatus === "heuristic_fallback" ? (
            <button
              type="button"
              onClick={onRetryEngine}
              className="rounded-lg border border-amber-400/40 px-3 py-2 text-[11px] font-semibold text-amber-50 hover:bg-amber-500/15"
            >
              {tr ? "Stockfish'i yeniden dene" : "Retry Stockfish"}
            </button>
          ) : null}
          <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-200/70">
              {tr ? "Rhizoh öğreniyor mu?" : "Is Rhizoh learning?"}
            </p>
            {learning.rhizohElo != null ? (
              <p className="mt-1 text-xl font-bold text-cyan-100">
                ELO {learning.rhizohElo}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-white/70">
              {learning.movesMeasured ?? 0} {tr ? "ölçülen hamle" : "moves measured"}
              {learning.stockfishMovesMeasured != null ? ` · Stockfish ${learning.stockfishMovesMeasured}` : ""}
              {learning.sessionGamesEnded != null ? ` · ${learning.sessionGamesEnded} ${tr ? "biten maç" : "games ended"}` : ""}
            </p>
            {learning.lastGameEndLabel ? (
              <p className="mt-1 text-[10px] text-amber-200/80">
                {tr ? "Son bitiş" : "Last end"}: {learning.lastGameEndLabel}
              </p>
            ) : null}
            {learning.policyDiffsMeasured != null ? (
              <p className="mt-0.5 text-[9px] text-violet-200/80">
                {tr ? "Stockfish ile uyum" : "Stockfish alignment"}:{" "}
                {learning.alignmentRate != null
                  ? `${Math.round(learning.alignmentRate * 100)}%`
                  : "—"}
                {" · "}policy_diff {learning.policyDiffsMeasured}
              </p>
            ) : null}
            {learning.spectatorMode ? (
              <p className="mt-0.5 text-[9px] text-cyan-300/75">
                {tr ? "Canlı kamera" : "Live camera"}: {learning.spectatorMode}
                {learning.spectatorClock ? ` · ${learning.spectatorClock}` : ""}
              </p>
            ) : null}
            {learning.policyDiffs.length ? (
              <ul className="mt-2 space-y-1">
                {learning.policyDiffs.map((n) => (
                  <li key={n.id} className="text-[9px] text-cyan-200/80">
                    {n.summary || n.kind}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[10px] text-white/40">
                {tr
                  ? "Maçlar oynandıkça policy_diff ve ELO burada görünür."
                  : "policy_diff and ELO appear here as matches play."}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {tr ? "Sezon & fikstür" : "Season & fixtures"}
            </p>
            <span className="text-[10px] text-emerald-300/80">
              {tr ? season.labelTr : season.labelEn} · {tr ? "Tur" : "Round"} {season.round}/
              {season.totalRounds}
            </span>
          </div>
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="text-white/40">
                <th className="pb-1 pr-2">#</th>
                <th className="pb-1 pr-2">{tr ? "Maç" : "Match"}</th>
                <th className="pb-1">{tr ? "Durum" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {CHESS_ARENA_FIXTURES_V0.map((fx) => (
                <tr key={fx.id} className="border-t border-white/5 text-white/70">
                  <td className="py-1.5 pr-2 text-white/45">R{fx.round}</td>
                  <td className="py-1.5 pr-2">
                    {tr ? fx.whiteTr : fx.whiteEn} vs {tr ? fx.blackTr : fx.blackEn}
                  </td>
                  <td className="py-1.5">
                    {fx.status === "playable" || fx.status === "next" ? (
                      <button
                        type="button"
                        onClick={() => launchFixture(fx)}
                        className="rounded border border-emerald-400/40 px-1.5 py-0.5 text-[9px] text-emerald-200"
                      >
                        {tr ? "Oyna" : "Play"}
                      </button>
                    ) : (
                      <span className="text-white/35">{fx.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {tr ? "Arşiv" : "Archive"}
            </p>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-[10px] text-cyan-300/80 hover:text-cyan-200"
            >
              {tr ? "Tümü" : "View all"}
            </button>
          </div>
          {archive.length ? (
            <ul className="space-y-1.5">
              {archive.map((row) => (
                <li
                  key={row.id}
                  className="rounded border border-white/8 bg-black/25 px-2 py-1.5 text-[10px] text-white/65"
                >
                  <span className="font-semibold text-white/85">
                    {formatChessOutcomeLabelV0(row.outcome, tr)}
                  </span>
                  <span className="text-white/40">
                    {" "}
                    · {row.moves?.length || 0} {tr ? "hamle" : "moves"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-white/40">
              {tr ? "Henüz arşivlenmiş maç yok." : "No archived matches yet."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
});
