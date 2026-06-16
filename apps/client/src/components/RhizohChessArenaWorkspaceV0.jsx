import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import {
  CHESS_GAME_MODE_V0,
  createChessArenaGameV0,
  createCastleToCastleChessMatchV0
} from "../rhizoh/runtime/chessArenaEngineV0.js";
import { getChessStockfishEngineStatusV0, getStockfishArenaMoveV0, pickChessArenaEngineMoveV0 } from "../rhizoh/runtime/chessStockfishEngineV0.js";
import { pickRhizohChessMoveV0 } from "../rhizoh/runtime/rhizohChessPlayerV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "../rhizoh/runtime/chessStockfishPresetsV0.js";
import {
  archiveChessArenaMatchV0,
  listChessArenaArchiveV0
} from "../rhizoh/runtime/chessArenaMatchArchiveV0.js";
import { parseChessVoiceMoveV0 } from "../rhizoh/runtime/chessVoiceMoveParserV0.js";
import {
  CASTLE_C2C_MESSAGE_TYPE_V0,
  CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0,
  sendCastleChessMoveV0,
  sendCastleSyncPingV0
} from "../castleSocial/castleC2cRealtimeBusV0.js";
import { runChessIntelligencePipelineV0 } from "../rhizoh/runtime/chessLearningBridgeV0.js";
import { listRhizohOpeningBookV0 } from "../rhizoh/runtime/rhizohOpeningBookV0.js";
import { readChessCivilizationV0 } from "../rhizoh/runtime/chessCivilizationV0.js";
import {
  CHESS_BOARD_THEME_V0,
  CHESS_PIECE_STYLE_V0,
  readChessArenaThemeV0,
  resolveChessBoardColorsV0,
  saveChessArenaThemeV0
} from "../rhizoh/runtime/chessArenaThemeV0.js";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";

const MODE_OPTIONS_V0 = [
  CHESS_GAME_MODE_V0.BLITZ,
  CHESS_GAME_MODE_V0.DAILY,
  CHESS_GAME_MODE_V0.AI_HUMAN,
  CHESS_GAME_MODE_V0.HUMAN_HUMAN,
  CHESS_GAME_MODE_V0.AI_AI,
  CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH
];

function boardRowsFromFen(fen) {
  const chess = createChessArenaGameV0({ fen });
  const board = chess.chess.board();
  const rows = [];
  // Rank 8 at top, rank 1 at bottom — white plays from bottom (standard UI).
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
}

const MODE_LABELS_TR_V0 = Object.freeze({
  [CHESS_GAME_MODE_V0.BLITZ]: "Blitz (insan vs insan)",
  [CHESS_GAME_MODE_V0.DAILY]: "Günlük",
  [CHESS_GAME_MODE_V0.AI_HUMAN]: "Stockfish vs insan",
  [CHESS_GAME_MODE_V0.HUMAN_HUMAN]: "İnsan vs insan",
  [CHESS_GAME_MODE_V0.AI_AI]: "Stockfish vs Stockfish",
  [CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH]: "Rhizoh AI vs Stockfish"
});

const MODE_LABELS_EN_V0 = Object.freeze({
  [CHESS_GAME_MODE_V0.BLITZ]: "Blitz (human vs human)",
  [CHESS_GAME_MODE_V0.DAILY]: "Daily",
  [CHESS_GAME_MODE_V0.AI_HUMAN]: "Stockfish vs human",
  [CHESS_GAME_MODE_V0.HUMAN_HUMAN]: "Human vs human",
  [CHESS_GAME_MODE_V0.AI_AI]: "Stockfish vs Stockfish",
  [CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH]: "Rhizoh AI vs Stockfish"
});

const DEFAULT_CLOCK_MS_V0 = 10 * 60 * 1000;

function formatChessClockV0(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ChessPlayerBarV0({ name, clockMs, active, align = "left", tr }) {
  return (
    <div
      className={`flex w-full max-w-[min(100%,30rem)] items-center gap-2 ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      <div
        className={`rounded-lg border px-2 py-1 ${
          active ? "border-cyan-300/55 bg-cyan-500/15" : "border-white/10 bg-black/35"
        }`}
      >
        <p className="text-[10px] font-semibold text-white/85">{name}</p>
        <p className={`font-mono text-sm font-bold ${active ? "text-cyan-100" : "text-white/70"}`}>
          {formatChessClockV0(clockMs)}
        </p>
        {active ? (
          <p className="text-[8px] uppercase tracking-wider text-cyan-200/70">
            {tr ? "Hamlede" : "On clock"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Chess Arena workspace — real rules, modes, voice moves, castle-to-castle scaffold.
 */
export const RhizohChessArenaWorkspaceV0 = memo(function RhizohChessArenaWorkspaceV0({
  open,
  onClose,
  uiLocale = "en",
  node = null,
  peerCastle = null,
  initialMode = null,
  autoPlay = false
}) {
  const tr = uiLocale === "tr";
  const resolvedInitialMode = initialMode || CHESS_GAME_MODE_V0.AI_HUMAN;
  const [mode, setMode] = useState(resolvedInitialMode);
  const [game, setGame] = useState(() =>
    createChessArenaGameV0({ mode: resolvedInitialMode })
  );
  const [c2cMatch, setC2cMatch] = useState(null);
  const [moveInput, setMoveInput] = useState("");
  const [status, setStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [tick, setTick] = useState(0);
  const [whiteClockMs, setWhiteClockMs] = useState(DEFAULT_CLOCK_MS_V0);
  const [blackClockMs, setBlackClockMs] = useState(DEFAULT_CLOCK_MS_V0);
  const [boardTheme, setBoardTheme] = useState(() => readChessArenaThemeV0());
  const [engineStatus, setEngineStatus] = useState(() => getChessStockfishEngineStatusV0());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveTick, setArchiveTick] = useState(0);
  const [gameEpoch, setGameEpoch] = useState(0);

  const boardColors = useMemo(
    () => resolveChessBoardColorsV0(boardTheme.boardThemeId),
    [boardTheme.boardThemeId]
  );
  const pieceBold = boardTheme.pieceStyleId === CHESS_PIECE_STYLE_V0.bold;

  const fen = game.fen();
  const rows = useMemo(() => boardRowsFromFen(fen), [fen, tick]);
  const outcome = game.outcome();
  const activeColor = game.turn();

  const opponentsV0 = useMemo(() => {
    if (c2cMatch || peerCastle?.uid) {
      const peerName =
        peerCastle?.displayName ||
        c2cMatch?.castleB ||
        (tr ? "Rakip kale" : "Peer castle");
      return Object.freeze({
        white: tr ? "Sen · Beyaz" : "You · White",
        black: String(peerName)
      });
    }
    if (mode === CHESS_GAME_MODE_V0.AI_AI) {
      return Object.freeze({ white: "Stockfish A", black: "Stockfish B" });
    }
    if (mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
      return Object.freeze({ white: "Rhizoh AI", black: "Stockfish" });
    }
    if (mode === CHESS_GAME_MODE_V0.AI_HUMAN) {
      return Object.freeze({
        white: tr ? "Sen · Beyaz" : "You · White",
        black: "Stockfish"
      });
    }
    return Object.freeze({
      white: tr ? "Beyaz" : "White",
      black: tr ? "Siyah" : "Black"
    });
  }, [c2cMatch, mode, peerCastle, tr]);

  useEffect(() => {
    if (!open) return;
    void getStockfishArenaMoveV0("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", {
      ...CHESS_STOCKFISH_PRESET_V0.WARMUP
    }).finally(() => setEngineStatus(getChessStockfishEngineStatusV0()));
  }, [open]);

  useEffect(() => {
    if (!open || !initialMode) return;
    setMode(initialMode);
    setGame(createChessArenaGameV0({ mode: initialMode }));
    setGameEpoch((e) => e + 1);
    setMatchResult(null);
    setStatus("");
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || outcome) return undefined;
    const id = window.setInterval(() => {
      if (activeColor === "w") {
        setWhiteClockMs((ms) => Math.max(0, ms - 1000));
      } else {
        setBlackClockMs((ms) => Math.max(0, ms - 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, outcome, activeColor]);

  useEffect(() => {
    if (!open || !peerCastle?.uid) return;
    const match = createCastleToCastleChessMatchV0({
      mode: CHESS_GAME_MODE_V0.HUMAN_HUMAN,
      castleA: "local_castle",
      castleB: String(peerCastle.uid)
    });
    setC2cMatch(match);
    setMode(CHESS_GAME_MODE_V0.HUMAN_HUMAN);
    setStatus(
      tr
        ? `Meydan okuma: ${peerCastle.displayName || peerCastle.uid.slice(0, 8)}`
        : `Challenge: ${peerCastle.displayName || peerCastle.uid.slice(0, 8)}`
    );
  }, [open, peerCastle, tr]);

  useEffect(() => {
    if (!open) return undefined;
    const onC2c = (ev) => {
      const detail = ev?.detail;
      if (detail?.type !== CASTLE_C2C_MESSAGE_TYPE_V0.CHESS_MOVE || !detail?.payload?.move) return;
      if (c2cMatch && detail.payload.matchId && detail.payload.matchId !== c2cMatch.matchId) return;
      game.tryMove(detail.payload.move);
      setTick((n) => n + 1);
      setStatus(tr ? `Uzak hamle: ${detail.payload.move}` : `Remote move: ${detail.payload.move}`);
    };
    window.addEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2c);
    return () => window.removeEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2c);
  }, [open, c2cMatch, game, tr]);

  const civilization = useMemo(() => readChessCivilizationV0(), [matchResult, tick]);
  const matchArchiveV0 = useMemo(() => listChessArenaArchiveV0(5), [archiveTick, matchResult]);

  const persistFinishedMatchV0 = useCallback(
    (outcomeVal, engineLabel = engineStatus) => {
      archiveChessArenaMatchV0({
        matchId: c2cMatch?.matchId || `chess_${Date.now().toString(36)}`,
        mode,
        outcome: String(outcomeVal || "unknown"),
        moves: game.moveHistory?.slice() || [],
        fen: game.fen(),
        white: opponentsV0.white,
        black: opponentsV0.black,
        engine: engineLabel
      });
      setArchiveTick((n) => n + 1);
    },
    [c2cMatch?.matchId, engineStatus, game, mode, opponentsV0]
  );

  const runMatchLearningV0 = useCallback(
    async (outcomeVal, matchRow, extra = {}) => {
      const draw = outcomeVal === "draw" || outcomeVal === "stalemate";
      const won = !draw && outcomeVal === "white_wins";
      const moves = game.moveHistory?.length ? game.moveHistory : [];
      if (!moves.length) return;
      setAnalysisBusy(true);
      try {
        const result = await runChessIntelligencePipelineV0({
          moves,
          localColor: mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? "w" : "w",
          opponentCastleId:
            extra.opponentCastleId || matchRow?.castleB || peerCastle?.uid || "stockfish",
          matchId: matchRow?.matchId || `local_${Date.now().toString(36)}`,
          outcome: outcomeVal,
          won,
          draw,
          locale: uiLocale
        });
        setMatchResult(result);
        setStatus(
          tr
            ? `Rhizoh öğretmeni: ${result.lesson.title}`
            : `Rhizoh teacher: ${result.lesson.title}`
        );
      } catch {
        setStatus(tr ? "Analiz tamamlanamadı." : "Analysis failed.");
      } finally {
        setAnalysisBusy(false);
      }
    },
    [game, mode, peerCastle?.uid, tr, uiLocale]
  );

  const resetGame = useCallback(
    (nextMode = mode) => {
      const g = createChessArenaGameV0({ mode: nextMode });
      setGame(g);
      setC2cMatch(null);
      setMoveInput("");
      setSelectedSquare(null);
      setMatchResult(null);
      setWhiteClockMs(DEFAULT_CLOCK_MS_V0);
      setBlackClockMs(DEFAULT_CLOCK_MS_V0);
      setStatus(tr ? "Yeni oyun." : "New game.");
      setGameEpoch((n) => n + 1);
    },
    [mode, tr]
  );

  useEffect(() => {
    if (!open) return;
    if (peerCastle?.uid) return;
    resetGame(CHESS_GAME_MODE_V0.AI_HUMAN);
  }, [open, peerCastle?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyMove = useCallback(
    async (move) => {
      const result = game.tryMove(move);
      if (!result.ok) {
        setStatus(tr ? `Geçersiz hamle: ${move}` : `Illegal move: ${move}`);
        return false;
      }
      setTick((n) => n + 1);
      setStatus(`${result.move.san} · ${game.turn() === "w" ? (tr ? "Beyaz" : "White") : tr ? "Siyah" : "Black"}`);
      if (c2cMatch) {
        sendCastleChessMoveV0({
          matchId: c2cMatch.matchId,
          move: result.move.san,
          fen: game.fen(),
          peerUid: c2cMatch.castleB
        });
      }
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
        const outcomeVal = result.outcome || game.outcome();
        void runMatchLearningV0(outcomeVal, c2cMatch);
        persistFinishedMatchV0(outcomeVal, engineStatus);
        return true;
      }

      const aiModes = [CHESS_GAME_MODE_V0.AI_HUMAN, CHESS_GAME_MODE_V0.AI_AI];
      const rhizohBlack = mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && game.turn() === "b";
      const stockfishBlack = aiModes.includes(mode) && game.turn() === "b";
      const rhizohWhite = mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && game.turn() === "w";

      if ((stockfishBlack || rhizohBlack || rhizohWhite) && !game.isGameOver()) {
        setAiBusy(true);
        let aiPick = null;
        try {
          if (rhizohBlack || rhizohWhite) {
            aiPick = await pickRhizohChessMoveV0(game);
          } else {
            aiPick = await pickChessArenaEngineMoveV0(game, { useStockfish: true, preset: "ARENA" });
          }
        } catch {
          aiPick = null;
        }
        setAiBusy(false);
        setEngineStatus(getChessStockfishEngineStatusV0());
        const aiMove = typeof aiPick === "string" ? aiPick : aiPick?.move;
        if (aiMove) {
          const aiResult = game.tryMove(aiMove);
          if (aiResult.ok) {
            setTick((n) => n + 1);
            const engineLabel =
              aiPick?.engine === "stockfish_wasm"
                ? "Stockfish"
                : aiPick?.engine?.startsWith("rhizoh")
                  ? "Rhizoh AI"
                  : tr
                    ? "Yedek motor"
                    : "Fallback engine";
            setStatus((s) => `${s} · ${engineLabel}: ${aiResult.move.san}`);
            if (aiResult.outcome) {
              void runMatchLearningV0(aiResult.outcome, c2cMatch);
              persistFinishedMatchV0(aiResult.outcome, aiPick?.engine || engineStatus);
            }
          }
        }
      }
      return true;
    },
    [game, mode, tr, c2cMatch, runMatchLearningV0, persistFinishedMatchV0, engineStatus]
  );

  useEffect(() => {
    if (!open || (mode !== CHESS_GAME_MODE_V0.AI_AI && mode !== CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH)) {
      return undefined;
    }
    let alive = true;

    void (async () => {
      while (alive && !game.isGameOver()) {
        setAiBusy(true);
        let pick = null;
        try {
          if (mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
            pick =
              game.turn() === "w"
                ? await pickRhizohChessMoveV0(game)
                : await pickChessArenaEngineMoveV0(game, { useStockfish: true, preset: "STRONG" });
          } else {
            pick = await pickChessArenaEngineMoveV0(game, { useStockfish: true, preset: "ARENA" });
          }
        } catch {
          pick = null;
        }
        setAiBusy(false);
        setEngineStatus(getChessStockfishEngineStatusV0());
        if (!alive || game.isGameOver()) break;
        const aiMove = pick?.move;
        if (!aiMove) break;
        const aiResult = game.tryMove(aiMove);
        if (!aiResult.ok) break;
        setTick((n) => n + 1);
        const engineLabel =
          pick?.engine === "stockfish_wasm"
            ? "Stockfish"
            : pick?.engine?.startsWith("rhizoh")
              ? "Rhizoh AI"
              : tr
                ? "Yedek motor"
                : "Fallback";
        setStatus(`${engineLabel}: ${aiResult.move.san}`);
        if (aiResult.outcome) {
          setStatus(
            mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH
              ? tr
                ? `Rhizoh vs Stockfish bitti — ${aiResult.outcome}`
                : `Rhizoh vs Stockfish finished — ${aiResult.outcome}`
              : tr
                ? `AI vs AI bitti — ${aiResult.outcome}`
                : `AI vs AI finished — ${aiResult.outcome}`
          );
          void runMatchLearningV0(aiResult.outcome, c2cMatch, {
            opponentCastleId: mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? "teacher_stockfish" : "stockfish"
          });
          persistFinishedMatchV0(aiResult.outcome, pick?.engine || engineStatus);
          break;
        }
        await new Promise((resolve) => {
          window.setTimeout(resolve, 750);
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    open,
    mode,
    gameEpoch,
    game,
    tr,
    c2cMatch,
    runMatchLearningV0,
    persistFinishedMatchV0,
    engineStatus
  ]);

  const onSquareClick = useCallback(
    async (square) => {
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
      const ok = await applyMove(uci);
      if (!ok) {
        const sanTry = await applyMove(square);
        if (!sanTry) setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    [applyMove, game, selectedSquare]
  );

  const onVoiceMove = useCallback(async () => {
    const parsed = parseChessVoiceMoveV0(moveInput);
    if (!parsed.move) {
      setStatus(tr ? "Sesli hamle anlaşılamadı." : "Voice move not recognized.");
      return;
    }
    await applyMove(parsed.move);
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
    sendCastleSyncPingV0(node?.id || "peer_castle");
    setStatus(tr ? "Kale-kale maçı başladı." : "Castle-to-castle match started.");
  }, [mode, node?.id, tr]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-3">
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-400/35 bg-[#050a08] shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300/70">Chess Arena</p>
            <h2 className="mt-1 text-sm font-black text-emerald-100">{node?.label || "CHESS"}</h2>
            <div className="mt-1">
              <RhizohTowerLiveStatusBadgeV0 towerId="chess_arena" uiLocale={uiLocale} compact />
            </div>
            <p className="mt-1 text-[10px] text-white/50">
              {tr ? "Gerçek satranç kuralları · sesli hamle · kale-kale modu" : "Real chess rules · voice moves · castle-to-castle"}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className={`rounded-lg border p-2 ${
                settingsOpen
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                  : "border-white/15 text-white/60 hover:text-white"
              }`}
              aria-label={tr ? "Ayarlar" : "Settings"}
              title={tr ? "Ayarlar" : "Settings"}
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
            >
              ×
            </button>
          </div>
        </header>

        {settingsOpen ? (
          <div className="mx-3 mb-2 rounded-xl border border-white/10 bg-black/85 p-3 shadow-xl sm:mx-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/80">
              {tr ? "Arena ayarları" : "Arena settings"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[9px] text-white/50">{tr ? "Tahta teması" : "Board theme"}</label>
              <select
                value={boardTheme.boardThemeId}
                onChange={(e) => {
                  const next = saveChessArenaThemeV0({ boardThemeId: e.target.value });
                  setBoardTheme(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {Object.entries(CHESS_BOARD_THEME_V0).map(([id, theme]) => (
                  <option key={id} value={id}>
                    {theme.label}
                  </option>
                ))}
              </select>
              <label className="text-[9px] text-white/50">{tr ? "Taş stili" : "Piece style"}</label>
              <select
                value={boardTheme.pieceStyleId}
                onChange={(e) => {
                  const next = saveChessArenaThemeV0({ pieceStyleId: e.target.value });
                  setBoardTheme(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                <option value={CHESS_PIECE_STYLE_V0.unicode}>{tr ? "Unicode" : "Unicode"}</option>
                <option value={CHESS_PIECE_STYLE_V0.bold}>{tr ? "Kalın" : "Bold"}</option>
              </select>
              <label className="text-[9px] text-white/50">{tr ? "Oyun modu" : "Game mode"}</label>
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
                    {tr ? MODE_LABELS_TR_V0[m] || m : MODE_LABELS_EN_V0[m] || m}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => resetGame(mode)}
                className="rounded-lg border border-white/20 px-2 py-1 text-[10px] text-white/80"
              >
                {tr ? "Yeni oyun" : "New game"}
              </button>
              <button
                type="button"
                onClick={startC2c}
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-100"
              >
                {tr ? "Kale ↔ Kale" : "Castle ↔ Castle"}
              </button>
            </div>
            <label className="mt-2 block text-[9px] text-white/50">
              {tr ? "Hamle / sesli komut" : "Move / voice"}
            </label>
            <input
              value={moveInput}
              onChange={(e) => setMoveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (parseChessVoiceMoveV0(moveInput).move) void onVoiceMove();
                  else void applyMove(moveInput.trim());
                  setMoveInput("");
                }
              }}
              placeholder={tr ? "e4, Nf3…" : "e4, Nf3…"}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
            />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto p-3">
            <ChessPlayerBarV0
              name={opponentsV0.black}
              clockMs={blackClockMs}
              active={activeColor === "b" && !outcome}
              align="right"
              tr={tr}
            />
            <div className="my-2 flex w-[min(100%,min(88vw,46vh))] shrink-0 flex-col items-center gap-1">
              <div className="flex w-full items-stretch gap-1">
                <div className="grid shrink-0 grid-rows-8 text-[8px] font-semibold text-white/50 sm:text-[9px]">
                  {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
                    <span key={rank} className="flex items-center justify-center pr-0.5">
                      {rank}
                    </span>
                  ))}
                </div>
                <div className="aspect-square min-w-0 flex-1">
                  <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-visible rounded-lg border-2 border-emerald-600/50 shadow-lg shadow-black/40">
                    {rows.map((row, ri) =>
                      row.map((cell, ci) => {
                        const dark = (ri + ci) % 2 === 1;
                        const rank = 8 - ri;
                        const sq = cell?.square || `${String.fromCharCode(97 + ci)}${rank}`;
                        const selected = selectedSquare === sq;
                        const isWhitePiece = cell?.color === "w";
                        return (
                          <button
                            key={`${ri}-${ci}`}
                            type="button"
                            onClick={() => onSquareClick(sq)}
                            style={{ background: dark ? boardColors.dark : boardColors.light }}
                            className={`flex items-center justify-center text-[clamp(1rem,4.2vmin,1.75rem)] sm:text-2xl ${
                              selected ? "ring-2 ring-cyan-300 ring-inset z-10" : ""
                            } ${pieceBold ? "font-black" : ""}`}
                          >
                            <span
                              className={
                                isWhitePiece
                                  ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                                  : "text-neutral-950 drop-shadow-[0_0_2px_rgba(255,255,255,0.75)]"
                              }
                            >
                              {cell?.glyph || ""}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="grid w-full grid-cols-8 gap-0 pl-4 text-center text-[8px] font-semibold text-white/45 sm:pl-5 sm:text-[9px]">
                {"abcdefgh".split("").map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
            </div>
            <ChessPlayerBarV0
              name={opponentsV0.white}
              clockMs={whiteClockMs}
              active={activeColor === "w" && !outcome}
              align="left"
              tr={tr}
            />
            <p className="text-[9px] text-white/40">
              {engineStatus === "stockfish_wasm"
                ? tr
                  ? "Motor: Stockfish 16 NNUE (WASM)"
                  : "Engine: Stockfish 16 NNUE (WASM)"
                : engineStatus === "heuristic_fallback"
                  ? tr
                    ? "Motor: Stockfish yüklenemedi — basit yedek AI"
                    : "Engine: Stockfish unavailable — simple fallback AI"
                  : tr
                    ? "Motor: başlatılıyor…"
                    : "Engine: starting…"}
            </p>
            {aiBusy ? (
              <p className="text-[10px] text-amber-200">{tr ? "Stockfish düşünüyor…" : "Stockfish thinking…"}</p>
            ) : null}
            {analysisBusy ? (
              <p className="text-[10px] text-cyan-200">
                {tr ? "Gözlem → Analiz → Öğren → Öğret…" : "Observe → Analyze → Learn → Teach…"}
              </p>
            ) : null}
            <p className="text-center text-[10px] text-white/55">{status}</p>
            {matchResult?.lesson ? (
              <div className="max-w-md rounded-lg border border-cyan-400/25 bg-cyan-500/5 px-3 py-2 text-[10px] text-white/80">
                <p className="font-bold text-cyan-100">{matchResult.lesson.title}</p>
                <p className="mt-1 text-white/60">{matchResult.lesson.body}</p>
                {matchResult.lesson.alternative ? (
                  <p className="mt-1 text-emerald-200">
                    {tr ? "Alternatif:" : "Alternative:"} {matchResult.lesson.alternative}
                  </p>
                ) : null}
              </div>
            ) : null}
            {civilization?.elo ? (
              <p className="text-[10px] text-amber-100/80">
                {tr ? "Kale ELO:" : "Castle ELO:"} {civilization.elo}
              </p>
            ) : null}
            {outcome ? (
              <p className="text-[11px] font-semibold text-amber-200">
                {tr ? "Sonuç:" : "Outcome:"} {outcome}
              </p>
            ) : null}
            {matchArchiveV0.length ? (
              <div className="mt-2 w-full max-w-md rounded-lg border border-white/10 bg-black/35 p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                  {tr ? "Arşiv (son maçlar)" : "Archive (recent)"}
                </p>
                <ul className="mt-1 space-y-1">
                  {matchArchiveV0.map((row) => (
                    <li key={row.id} className="text-[9px] text-white/55">
                      {row.white} vs {row.black} · {row.outcome} · {row.moves?.length || 0}{" "}
                      {tr ? "hamle" : "moves"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
        </div>
      </div>
    </div>
  );
});
