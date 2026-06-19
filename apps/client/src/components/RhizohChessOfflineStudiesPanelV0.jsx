import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { buildChessHistoryBrainReportV0 } from "../rhizoh/runtime/chessHistoryBrainReportV0.js";
import { listChessEndgameSealsV0 } from "../rhizoh/runtime/chessEndgameSealV0.js";
import {
  buildChessOfflineBatchTrainerReportV0,
  runChessOfflineBatchTrainerV0
} from "../rhizoh/runtime/chessOfflineBatchTrainerV0.js";
import { listChessMemoryGamesV0 } from "../rhizoh/runtime/chessMemoryStoreV0.js";
import { buildMatchMovesWithFenV0 } from "../rhizoh/runtime/chessMatchReplayV0.js";
import { RhizohChessBoardV0 } from "./RhizohChessBoardV0.jsx";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";
import { createChessArenaGameV0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import { useChessArenaDisplaySettingsV0 } from "../hooks/useChessArenaDisplaySettingsV0.js";

function boardRowsFromFen(fen) {
  try {
    const chess = createChessArenaGameV0({ fen });
    const board = chess.chess.board();
    const rows = [];
    for (let r = 0; r < 8; r += 1) {
      const row = [];
      for (let c = 0; c < 8; c += 1) {
        const cell = board[r][c];
        row.push(
          cell
            ? Object.freeze({
                color: cell.color,
                type: cell.type,
                square: String.fromCharCode(97 + c) + String(8 - r),
                glyph: PIECE_UNICODE_V0[`${cell.color}${cell.type.toUpperCase()}`] || "?"
              })
            : null
        );
      }
      rows.push(Object.freeze(row));
    }
    return Object.freeze(rows);
  } catch {
    return Object.freeze(
      Array.from({ length: 8 }, () => Object.freeze(Array.from({ length: 8 }, () => null)))
    );
  }
}

/**
 * Offline corpus, endgame seals, and batch trainer — visible Rhizoh study shelf.
 */
export const RhizohChessOfflineStudiesPanelV0 = memo(function RhizohChessOfflineStudiesPanelV0({
  tr = false,
  compact = false
}) {
  const { boardColors, pieceBold, pieceStyleId } = useChessArenaDisplaySettingsV0();
  const [brain, setBrain] = useState(() => buildChessHistoryBrainReportV0());
  const [trainer, setTrainer] = useState(() => buildChessOfflineBatchTrainerReportV0());
  const [endgameSeals, setEndgameSeals] = useState(() => listChessEndgameSealsV0(8));
  const [busy, setBusy] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [replayPly, setReplayPly] = useState(0);

  const masterGames = useMemo(() => listChessMemoryGamesV0(12), [brain]);

  const refresh = useCallback(() => {
    setBrain(buildChessHistoryBrainReportV0());
    setTrainer(buildChessOfflineBatchTrainerReportV0());
    setEndgameSeals(listChessEndgameSealsV0(8));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedGame = useMemo(
    () => masterGames.find((g) => g.id === selectedGameId) || null,
    [masterGames, selectedGameId]
  );

  const replayRows = useMemo(() => {
    if (!selectedGame?.moves?.length) return null;
    const trace = buildMatchMovesWithFenV0(selectedGame.moves);
    const row = trace[Math.min(replayPly, trace.length - 1)];
    if (!row?.after) return null;
    return boardRowsFromFen(row.after);
  }, [selectedGame, replayPly]);

  const runTrainer = async () => {
    setBusy(true);
    try {
      await runChessOfflineBatchTrainerV0({ force: true });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-violet-500/25 bg-violet-950/20 ${
        compact ? "p-2" : "p-3"
      }`}
      data-rhizoh-chess-offline-studies
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-violet-200/90">
          {tr ? "Rhizoh offline çalışmalar" : "Rhizoh offline studies"}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runTrainer()}
          className="rounded border border-violet-400/35 bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-100 disabled:opacity-50"
        >
          {busy
            ? tr
              ? "Çalışıyor…"
              : "Running…"
            : tr
              ? "Batch eğitim çalıştır"
              : "Run batch trainer"}
        </button>
      </div>

      <div className="grid gap-2 text-[9px] text-white/65 sm:grid-cols-2">
        <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
          <p className="font-semibold text-white/80">{tr ? "Korpus" : "Corpus"}</p>
          <p>
            {brain.corpusGamesLoaded} {tr ? "oyun" : "games"} ·{" "}
            {brain.batchTrainer?.runCount || trainer.runCount || 0}{" "}
            {tr ? "batch koşusu" : "batch runs"}
          </p>
          <p className="text-white/45">
            {tr ? "Son doğruluk" : "Last accuracy"}:{" "}
            {trainer.lastAccuracy != null ? `${Math.round(trainer.lastAccuracy * 100)}%` : "—"}
          </p>
        </div>
        <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
          <p className="font-semibold text-white/80">{tr ? "Ağırlık matrisi" : "Weight matrix"}</p>
          <p>
            win={brain.intelligenceEvolution?.weightMatrix?.winForcingWeight?.toFixed?.(2) ?? "—"} ·
            agg={brain.intelligenceEvolution?.weightMatrix?.aggressionBias?.toFixed?.(2) ?? "—"}
          </p>
          <p className="text-white/45">
            {tr ? "Öğrenilen maç" : "Matches learned"}:{" "}
            {brain.intelligenceEvolution?.weightMatrix?.matchesLearned ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-1 text-[9px] font-semibold text-white/70">
          {tr ? "Usta maçları (korpus)" : "Master games (corpus)"}
        </p>
        {masterGames.length ? (
          <ul className="max-h-28 space-y-1 overflow-y-auto">
            {masterGames.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGameId((id) => (id === game.id ? null : game.id));
                    setReplayPly(0);
                  }}
                  className={`w-full rounded border px-2 py-1 text-left ${
                    selectedGameId === game.id
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-white/10 bg-black/25"
                  }`}
                >
                  <span className="text-white/85">
                    {game.white} vs {game.black}
                  </span>
                  <span className="text-white/45">
                    {" "}
                    · {game.result || "*"} · {game.moves?.length || 0}{" "}
                    {tr ? "hamle" : "moves"}
                  </span>
                  {game.patterns?.openingBucket ? (
                    <span className="block text-[8px] text-violet-200/65">
                      {game.patterns.openingBucket}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[9px] text-white/40">
            {tr ? "Korpus henüz yüklenmedi." : "Corpus not loaded yet."}
          </p>
        )}
      </div>

      {selectedGame && replayRows ? (
        <div className="mt-2 rounded border border-cyan-400/25 bg-black/35 p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[9px] font-semibold text-cyan-100">
              {selectedGame.white} vs {selectedGame.black}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded border border-white/15 px-1.5 py-0.5 text-[8px]"
                onClick={() => setReplayPly((p) => Math.max(0, p - 1))}
              >
                ◀
              </button>
              <span className="font-mono text-[8px] text-white/55">
                {replayPly + 1}/{selectedGame.moves.length}
              </span>
              <button
                type="button"
                className="rounded border border-white/15 px-1.5 py-0.5 text-[8px]"
                onClick={() =>
                  setReplayPly((p) => Math.min((selectedGame.moves?.length || 1) - 1, p + 1))
                }
              >
                ▶
              </button>
            </div>
          </div>
          <RhizohChessBoardV0
            rows={replayRows}
            boardColors={boardColors}
            pieceStyleId={pieceStyleId}
            pieceBold={pieceBold}
            interactive={false}
            sizeClass="mx-auto w-full max-w-[12rem]"
          />
          <p className="mt-1 font-mono text-[8px] text-white/45">
            {selectedGame.moves.slice(0, replayPly + 1).join(" ")}
          </p>
        </div>
      ) : null}

      <div className="mt-2">
        <p className="mb-1 text-[9px] font-semibold text-white/70">
          {tr ? "Oyun sonu mühürleri" : "Endgame seals"}
        </p>
        {endgameSeals.length ? (
          <ul className="max-h-20 space-y-1 overflow-y-auto text-[8px] text-white/55">
            {endgameSeals.map((seal) => (
              <li key={seal.id} className="rounded border border-white/10 bg-black/25 px-2 py-1">
                <span className="text-white/75">{seal.outcome}</span>
                <span className="text-white/40">
                  {" "}
                  · {seal.moves?.length || 0} {tr ? "hamle" : "moves"}
                  {seal.regret?.topRegret
                    ? ` · ${seal.regret.topRegret.san} (${seal.regret.topRegret.swingCp}cp)`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[9px] text-white/40">
            {tr
              ? "Henüz mühür yok — Rhizoh vs Stockfish maçları sonrası oluşur."
              : "No seals yet — created after Rhizoh vs Stockfish matches."}
          </p>
        )}
      </div>
    </div>
  );
});
