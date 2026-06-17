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
  listChessTimeControlsV0,
  readChessArenaSessionV0,
  resolveChessTimeControlV0,
  saveChessArenaSessionV0
} from "../rhizoh/runtime/chessArenaSessionV0.js";

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
  const learning = getChessArenaLearningFeedV0();
  const season = CHESS_ARENA_CURRENT_SEASON_V0;
  const timeControls = listChessTimeControlsV0();
  const [timeControlId, setTimeControlId] = useState(() => readChessArenaSessionV0().timeControlId);

  useEffect(() => {
    const onStorage = () => setTimeControlId(readChessArenaSessionV0().timeControlId);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeTc = resolveChessTimeControlV0(timeControlId);

  const onTimeControlChange = (id) => {
    saveChessArenaSessionV0({ timeControlId: id });
    setTimeControlId(id);
  };

  const openCluster = () => {
    window.dispatchEvent(new CustomEvent(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
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
            {CHESS_ARENA_QUICK_MATCH_V0.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onStartMatch(row.mode)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-left transition hover:border-emerald-400/45 hover:bg-emerald-500/10"
              >
                <p className="text-[12px] font-semibold text-white">{tr ? row.labelTr : row.labelEn}</p>
                <p className="mt-0.5 text-[10px] text-white/45">{tr ? row.descTr : row.descEn}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={openCluster}
            className="mt-3 w-full rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-3 py-2.5 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            {tr ? "8 Board Observatory · MultiPV öğrenme" : "8 Board Observatory · MultiPV learning"}
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
          <div className="rounded-xl border border-white/10 bg-black/35 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
              {tr ? "Canlı öğrenme" : "Live learning"}
            </p>
            <p className="mt-1 text-[11px] text-white/70">
              tick {learning.clusterTick} ·{" "}
              {learning.clusterRunning ? (tr ? "cluster aktif" : "cluster on") : "cluster off"}
              {learning.spectatorPly != null ? ` · #1 ply ${learning.spectatorPly}` : ""}
            </p>
            {learning.spectatorMode ? (
              <p className="mt-0.5 text-[9px] text-cyan-300/75">
                {learning.spectatorMode}
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
                {tr ? "Henüz policy_diff yok — cluster veya maç sonrası dolar." : "No policy_diff yet — fills after cluster or match."}
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
                    {fx.status === "next" ? (
                      <button
                        type="button"
                        onClick={() =>
                          fx.mode === "cluster" ? openCluster() : onStartMatch(fx.mode)
                        }
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
