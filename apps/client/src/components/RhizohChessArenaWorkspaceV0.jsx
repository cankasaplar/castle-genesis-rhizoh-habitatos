import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  CHESS_GAME_MODE_V0,
  createChessArenaGameV0,
  createCastleToCastleChessMatchV0,
  pickChessArenaAiMoveV0
} from "../rhizoh/runtime/chessArenaEngineV0.js";
import { parseChessVoiceMoveV0 } from "../rhizoh/runtime/chessVoiceMoveParserV0.js";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";

const MODE_OPTIONS_V0 = [
  CHESS_GAME_MODE_V0.BLITZ,
  CHESS_GAME_MODE_V0.DAILY,
  CHESS_GAME_MODE_V0.AI_HUMAN,
  CHESS_GAME_MODE_V0.HUMAN_HUMAN,
  CHESS_GAME_MODE_V0.AI_AI
];

function boardRowsFromFen(fen) {
  const chess = createChessArenaGameV0({ fen });
  const board = chess.chess.board();
  const rows = [];
  for (let r = 7; r >= 0; r -= 1) {
    const row = [];
    for (let c = 0; c < 8; c += 1) {
      const cell = board[r][c];
      row.push(
        cell
          ? Object.freeze({
              color: cell.color,
              type: cell.type,
              square: String.fromCharCode(97 + c) + String(r + 1),
              glyph: PIECE_UNICODE_V0[`${cell.color}${cell.type.toUpperCase()}`] || "?"
            })
          : null
      );
    }
    rows.push(Object.freeze(row));
  }
  return Object.freeze(rows);
}

/**
 * Chess Arena workspace — real rules, modes, voice moves, castle-to-castle scaffold.
 */
export const RhizohChessArenaWorkspaceV0 = memo(function RhizohChessArenaWorkspaceV0({
  open,
  onClose,
  uiLocale = "en",
  node = null
}) {
  const tr = uiLocale === "tr";
  const [mode, setMode] = useState(CHESS_GAME_MODE_V0.BLITZ);
  const [game, setGame] = useState(() => createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.BLITZ }));
  const [c2cMatch, setC2cMatch] = useState(null);
  const [moveInput, setMoveInput] = useState("");
  const [status, setStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState(null);

  const fen = game.fen();
  const rows = useMemo(() => boardRowsFromFen(fen), [fen]);
  const outcome = game.outcome();

  const resetGame = useCallback(
    (nextMode = mode) => {
      const g = createChessArenaGameV0({ mode: nextMode });
      setGame(g);
      setC2cMatch(null);
      setMoveInput("");
      setSelectedSquare(null);
      setStatus(tr ? "Yeni oyun." : "New game.");
    },
    [mode, tr]
  );

  useEffect(() => {
    if (!open) return;
    resetGame(mode);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyMove = useCallback(
    (move) => {
      const result = game.tryMove(move);
      if (!result.ok) {
        setStatus(tr ? `Geçersiz hamle: ${move}` : `Illegal move: ${move}`);
        return false;
      }
      setStatus(`${result.move.san} · ${game.turn() === "w" ? (tr ? "Beyaz" : "White") : tr ? "Siyah" : "Black"}`);
      if (result.outcome) {
        setStatus(
          result.outcome === "draw" || result.outcome === "stalemate"
            ? tr
              ? "Berabere."
              : "Draw."
            : tr
              ? "Mat — oyun bitti."
              : "Checkmate — game over."
        );
        return true;
      }

      const aiModes = [CHESS_GAME_MODE_V0.AI_HUMAN, CHESS_GAME_MODE_V0.AI_AI];
      if (aiModes.includes(mode) && !game.isGameOver()) {
        const aiMove = pickChessArenaAiMoveV0(game);
        if (aiMove) {
          const aiResult = game.tryMove(aiMove);
          if (aiResult.ok) {
            setStatus((s) => `${s} · AI: ${aiResult.move.san}`);
          }
        }
      }
      return true;
    },
    [game, mode, tr]
  );

  const onSquareClick = useCallback(
    (square) => {
      if (game.isGameOver()) return;
      if (!selectedSquare) {
        setSelectedSquare(square);
        return;
      }
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const uci = `${selectedSquare}${square}`;
      const ok = applyMove(uci);
      if (!ok) {
        const sanTry = applyMove(square);
        if (!sanTry) setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    [applyMove, game, selectedSquare]
  );

  const onVoiceMove = useCallback(() => {
    const parsed = parseChessVoiceMoveV0(moveInput);
    if (!parsed.move) {
      setStatus(tr ? "Sesli hamle anlaşılamadı." : "Voice move not recognized.");
      return;
    }
    applyMove(parsed.move);
    setMoveInput("");
  }, [applyMove, moveInput, tr]);

  const startC2c = useCallback(() => {
    const match = createCastleToCastleChessMatchV0({
      castleA: tr ? "benim_kalem" : "my_castle",
      castleB: node?.id || "peer_castle",
      mode
    });
    setC2cMatch(match);
    setGame(match.game);
    setStatus(tr ? "Kale-kale maçı başladı." : "Castle-to-castle match started.");
  }, [mode, node?.id, tr]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex h-[min(92vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-400/35 bg-[#050a08] shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300/70">Chess Arena</p>
            <h2 className="mt-1 text-sm font-black text-emerald-100">{node?.label || "CHESS"}</h2>
            <p className="mt-1 text-[10px] text-white/50">
              {tr ? "Gerçek satranç kuralları · sesli hamle · kale-kale modu" : "Real chess rules · voice moves · castle-to-castle"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[1fr_280px]">
          <div className="flex min-h-0 flex-col items-center justify-center gap-2">
            <div className="inline-grid grid-cols-8 overflow-hidden rounded-lg border border-emerald-500/30">
              {rows.map((row, ri) =>
                row.map((cell, ci) => {
                  const dark = (ri + ci) % 2 === 1;
                  const sq = cell?.square || String.fromCharCode(97 + ci) + String(8 - ri);
                  const selected = selectedSquare === sq;
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      onClick={() => onSquareClick(sq)}
                      className={`flex h-10 w-10 items-center justify-center text-xl sm:h-12 sm:w-12 ${
                        selected ? "ring-2 ring-cyan-300 ring-inset" : ""
                      } ${dark ? "bg-emerald-950/80" : "bg-emerald-800/35"}`}
                    >
                      {cell?.glyph || ""}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-center text-[10px] text-white/55">{status}</p>
            {outcome ? (
              <p className="text-[11px] font-semibold text-amber-200">{tr ? "Sonuç:" : "Outcome:"} {outcome}</p>
            ) : null}
          </div>

          <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              {tr ? "Oyun modu" : "Game mode"}
            </label>
            <select
              value={mode}
              onChange={(e) => {
                const next = e.target.value;
                setMode(next);
                resetGame(next);
              }}
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
            >
              {MODE_OPTIONS_V0.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => resetGame(mode)}
              className="rounded-lg border border-white/20 px-2 py-1.5 text-[10px] text-white/80"
            >
              {tr ? "Yeni oyun" : "New game"}
            </button>
            <button
              type="button"
              onClick={startC2c}
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-[10px] text-cyan-100"
            >
              {tr ? "Kale ↔ Kale maçı" : "Castle ↔ Castle match"}
            </button>
            {c2cMatch ? (
              <p className="text-[9px] text-white/45">
                {c2cMatch.castleA} vs {c2cMatch.castleB}
              </p>
            ) : null}

            <label className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/55">
              {tr ? "Hamle / sesli komut" : "Move / voice command"}
            </label>
            <input
              value={moveInput}
              onChange={(e) => setMoveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (parseChessVoiceMoveV0(moveInput).move) onVoiceMove();
                  else applyMove(moveInput.trim());
                  setMoveInput("");
                }
              }}
              placeholder={tr ? "e4, Nf3, at f3…" : "e4, Nf3, knight f3…"}
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
            />
            <button
              type="button"
              onClick={onVoiceMove}
              className="rounded-lg border border-emerald-400/45 bg-emerald-500/15 px-2 py-1.5 text-[10px] font-semibold text-emerald-100"
            >
              {tr ? "Sesli hamle uygula" : "Apply voice move"}
            </button>

            <p className="mt-2 text-[9px] leading-relaxed text-white/40">
              FEN: <span className="break-all text-white/55">{fen}</span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
});
