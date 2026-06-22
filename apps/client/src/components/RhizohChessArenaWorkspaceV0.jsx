import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import {
  CHESS_GAME_MODE_V0,
  createChessArenaGameV0,
  createCastleToCastleChessMatchV0,
  formatChessOutcomeLabelV0
} from "../rhizoh/runtime/chessArenaEngineV0.js";
import {
  createChessGameFromTruthProjectionV0,
  isChessRealitySyncActiveV0,
  proposeChessRealityMoveV0,
  subscribeChessRealitySyncV0
} from "../rhizoh/runtime/chessRealitySyncAdapterV0.js";
import { pickArenaAutoplayMoveV0 } from "../rhizoh/runtime/chessArenaAutoplayPickV0.js";
import {
  getChessTeacherStatusV0,
  getChessTeacherDetailV0,
  pickChessArenaMoveViaTeacherV0,
  resetChessTeacherV0,
  CHESS_TEACHER_STATUS_EVENT_V0
} from "../rhizoh/runtime/chessTeacherInterfaceV0.js";
import { getStockfishArenaMoveV0, awaitChessStockfishEngineReadyV0 } from "../rhizoh/runtime/chessStockfishEngineV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0
} from "../rhizoh/runtime/chessEngineTaskQueueV0.js";
import { pickRhizohChessMoveV0 } from "../rhizoh/runtime/rhizohChessPlayerV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "../rhizoh/runtime/chessStockfishPresetsV0.js";
import {
  shouldDeferArenaPrewarmV0,
  shouldDeferArenaEngineWorkV0,
  isChessArenaWorkspaceOpenV0,
  publishChessArenaWorkspaceOpenV0,
  prioritizeArenaEngineForMoveV0,
  releaseBroadcastForArenaPlayV0,
  RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0
} from "../rhizoh/runtime/chessEngineContentionGateV0.js";
import {
  archiveChessArenaMatchV0,
  enrichChessArenaArchiveEntryV0,
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
import {
  CHESS_POLICY_MODE_V0,
  getChessPolicyProfileV0,
  readChessPolicyModeV0,
  saveChessPolicyModeV0
} from "../rhizoh/runtime/chessPolicyModeV0.js";
import {
  getChessHistoricalMindV0,
  listChessHistoricalMindsV0,
  readChessHistoricalMindIdV0,
  saveChessHistoricalMindIdV0
} from "../rhizoh/runtime/chessHistoricalMindV0.js";
import { readChessLearningWeightsV0 } from "../rhizoh/runtime/chessLearningWeightsV0.js";
import { readChessCivilizationV0 } from "../rhizoh/runtime/chessCivilizationV0.js";
import {
  formatChessMoveListPgnV0,
  normalizeChessMovesToSanV0
} from "../rhizoh/runtime/chessMoveSanV0.js";
import {
  CHESS_ARENA_SESSION_EVENT_V0,
  listChessOpponentPresetsV0,
  listChessTimeControlsV0,
  readChessArenaSessionV0,
  resolveChessOpponentPresetV0,
  resolveChessTimeControlV0,
  saveChessArenaSessionV0
} from "../rhizoh/runtime/chessArenaSessionV0.js";
import { logChessMovePlayedV0, logChessRegretSealedV0 } from "../rhizoh/runtime/chessArenaTelemetryV0.js";
import {
  attachRhizohUgeEngineHookV0,
  detachRhizohUgeEngineHookV0
} from "../rhizoh/runtime/rhizohUgeEngineHookV0.js";
import { speakChessMoveV0 } from "../rhizoh/runtime/chessMoveVoiceV0.js";
import { sealChessEndgameAnalysisV0 } from "../rhizoh/runtime/chessEndgameSealV0.js";
import {
  readChessLearningSessionV0,
  saveChessLearningSessionV0,
  sealChessLearningSessionV0,
  listChessLearningSessionPresetsV0,
  resolveChessLearningSessionPresetV0
} from "../rhizoh/runtime/chessLearningSessionV0.js";
import { CHESS_VARIANT_ID_V0, resolveChessVariantV0 } from "../rhizoh/runtime/chessVariantRegistryV0.js";
import {
  CHESS_ARENA_THEME_EVENT_V0,
  CHESS_BOARD_THEME_V0,
  CHESS_PIECE_STYLE_V0,
  readChessArenaThemeV0,
  resolveChessBoardColorsV0,
  saveChessArenaThemeV0
} from "../rhizoh/runtime/chessArenaThemeV0.js";
import { RhizohChessBoardV0 } from "./RhizohChessBoardV0.jsx";
import { ChessSplitMoveListV0 } from "./ChessSplitMoveListV0.jsx";
import { ChessLiveMatchFlankV0 } from "./ChessLiveMatchFlankV0.jsx";
import { RhizohChessOfflineStudiesPanelV0 } from "./RhizohChessOfflineStudiesPanelV0.jsx";
import { buildMatchMovesWithFenV0 } from "../rhizoh/runtime/chessMatchReplayV0.js";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";
import { RhizohChessArenaLobbyV0 } from "./RhizohChessArenaLobbyV0.jsx";
import { PIECE_UNICODE_V0 } from "./RhizohCastleLibraryPanelV0.jsx";
import { resolveChessLegalMoveUciV0 } from "../rhizoh/runtime/chessArenaMoveResolveV0.js";

const MODE_OPTIONS_V0 = [
  CHESS_GAME_MODE_V0.BLITZ,
  CHESS_GAME_MODE_V0.DAILY,
  CHESS_GAME_MODE_V0.AI_HUMAN,
  CHESS_GAME_MODE_V0.HUMAN_HUMAN,
  CHESS_GAME_MODE_V0.AI_AI,
  CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH,
  CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH
];

function boardRowsFromFen(fen) {
  try {
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
  } catch {
    return Object.freeze(
      Array.from({ length: 8 }, () => Object.freeze(Array.from({ length: 8 }, () => null)))
    );
  }
}

const MODE_LABELS_TR_V0 = Object.freeze({
  [CHESS_GAME_MODE_V0.BLITZ]: "Blitz (insan vs insan)",
  [CHESS_GAME_MODE_V0.DAILY]: "Günlük",
  [CHESS_GAME_MODE_V0.AI_HUMAN]: "Stockfish vs insan",
  [CHESS_GAME_MODE_V0.HUMAN_HUMAN]: "İnsan vs insan",
  [CHESS_GAME_MODE_V0.AI_AI]: "Stockfish vs Stockfish",
  [CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH]: "Rhizoh AI vs Stockfish",
  [CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH]: "Fox+Octo · Rhizoh AI"
});

const MODE_LABELS_EN_V0 = Object.freeze({
  [CHESS_GAME_MODE_V0.BLITZ]: "Blitz (human vs human)",
  [CHESS_GAME_MODE_V0.DAILY]: "Daily",
  [CHESS_GAME_MODE_V0.AI_HUMAN]: "Stockfish vs human",
  [CHESS_GAME_MODE_V0.HUMAN_HUMAN]: "Human vs human",
  [CHESS_GAME_MODE_V0.AI_AI]: "Stockfish vs Stockfish",
  [CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH]: "Rhizoh AI vs Stockfish",
  [CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH]: "Fox+Octo · Rhizoh AI"
});

const DEFAULT_CLOCK_MS_V0 = 3 * 60 * 1000;

function initialClocksFromSessionV0(session = readChessArenaSessionV0()) {
  const tc = resolveChessTimeControlV0(session.timeControlId);
  return Object.freeze({ white: tc.initialMs, black: tc.initialMs, incrementMs: tc.incrementMs });
}

function formatChessClockV0(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Resolve SAN/UCI hints to legal UCI before mutating game state. */
function tryResolvedChessMoveV0(game, moveHint) {
  const uci = resolveChessLegalMoveUciV0(game, moveHint);
  if (!uci) return Object.freeze({ ok: false, reason: "illegal_move" });
  return game.tryMove(uci);
}

function ChessPlayerBarV0({ name, clockMs, active, align = "left", tr, lastMoveSan = null }) {
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
        {lastMoveSan ? (
          <p className="font-mono text-[10px] font-semibold text-emerald-200/90">{lastMoveSan}</p>
        ) : null}
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
  const [arenaFallbackMode, setArenaFallbackMode] = useState(false);
  const [thinkingActorV0, setThinkingActorV0] = useState(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [tick, setTick] = useState(0);
  const [whiteClockMs, setWhiteClockMs] = useState(() => initialClocksFromSessionV0().white);
  const [blackClockMs, setBlackClockMs] = useState(() => initialClocksFromSessionV0().black);
  const [boardTheme, setBoardTheme] = useState(() => readChessArenaThemeV0());
  const [engineStatus, setEngineStatus] = useState(() => getChessTeacherStatusV0());
  const [engineDetail, setEngineDetail] = useState(() => getChessTeacherDetailV0().engine);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveTick, setArchiveTick] = useState(0);
  const [expandedArchiveId, setExpandedArchiveId] = useState(null);
  const [archiveReplayPlyV0, setArchiveReplayPlyV0] = useState(0);
  const [lastFinishedMatchV0, setLastFinishedMatchV0] = useState(null);
  const [gameEpoch, setGameEpoch] = useState(0);
  const [policyMode, setPolicyMode] = useState(() => readChessPolicyModeV0());
  const [mindId, setMindId] = useState(() => readChessHistoricalMindIdV0());
  const [arenaSession, setArenaSession] = useState(() => readChessArenaSessionV0());
  const [lastRegretV0, setLastRegretV0] = useState(null);
  const [lastLearningV0, setLastLearningV0] = useState(null);
  const [learningSessionV0, setLearningSessionV0] = useState(() => readChessLearningSessionV0());
  const learningPresetsV0 = useMemo(() => listChessLearningSessionPresetsV0(), []);
  const [arenaPhase, setArenaPhase] = useState(() =>
    autoPlay || initialMode ? "playing" : "lobby"
  );
  const [lastMoveHighlightV0, setLastMoveHighlightV0] = useState(null);
  const [clockStartedV0, setClockStartedV0] = useState(false);
  const [rhizohArenaColorV0, setRhizohArenaColorV0] = useState("w");
  const [rhizohMatchCountV0, setRhizohMatchCountV0] = useState(0);
  const [forcedOutcomeV0, setForcedOutcomeV0] = useState(null);

  const timeControlV0 = useMemo(
    () => resolveChessTimeControlV0(arenaSession.timeControlId),
    [arenaSession.timeControlId]
  );
  const opponentPresetV0 = useMemo(
    () => resolveChessOpponentPresetV0(arenaSession.opponentPresetId),
    [arenaSession.opponentPresetId]
  );
  const timeControlsV0 = useMemo(() => listChessTimeControlsV0(), []);
  const opponentPresetsV0 = useMemo(() => listChessOpponentPresetsV0(), []);

  const boardColors = useMemo(
    () => resolveChessBoardColorsV0(boardTheme.boardThemeId),
    [boardTheme.boardThemeId]
  );
  const pieceBold = boardTheme.pieceStyleId === CHESS_PIECE_STYLE_V0.bold;
  const rhizohPlaysWhiteV0 =
    mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? rhizohArenaColorV0 === "w" : mode !== CHESS_GAME_MODE_V0.AI_HUMAN;
  const boardOrientationV0 =
    mode === CHESS_GAME_MODE_V0.AI_HUMAN ? "white" : rhizohPlaysWhiteV0 ? "white" : "black";

  const fen = game.fen();
  const rows = useMemo(() => boardRowsFromFen(fen), [fen, tick]);
  const outcome = forcedOutcomeV0 || game.outcome();
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
      return Object.freeze({
        white: rhizohPlaysWhiteV0 ? "Rhizoh AI" : "Stockfish",
        black: rhizohPlaysWhiteV0 ? "Stockfish" : "Rhizoh AI"
      });
    }
    if (mode === CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH) {
      const variant = resolveChessVariantV0(CHESS_VARIANT_ID_V0.TEAM_PET_VS_RHIZOH);
      return Object.freeze({
        white: tr ? "Fox + Octo" : "Fox + Octo",
        black: tr ? "Rhizoh AI" : "Rhizoh AI"
      });
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
  }, [c2cMatch, mode, peerCastle, rhizohPlaysWhiteV0, tr]);

  const playerLastMovesV0 = useMemo(() => {
    const history = game.moveHistory || [];
    if (!history.length) return Object.freeze({ white: null, black: null });
    let white = null;
    let black = null;
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const row = history[i];
      if (row.color === "w" && !white) white = row.san;
      if (row.color === "b" && !black) black = row.san;
      if (white && black) break;
    }
    return Object.freeze({ white, black });
  }, [game.moveHistory, tick]);

  const refreshEngineStatusV0 = useCallback(() => {
    setEngineStatus(getChessTeacherStatusV0());
    setEngineDetail(getChessTeacherDetailV0().engine);
  }, []);

  const retryStockfishEngineV0 = useCallback(() => {
    resetChessTeacherV0();
    refreshEngineStatusV0();
    const runWarmup = () => {
      if (shouldDeferArenaPrewarmV0()) {
        setTimeout(runWarmup, 800);
        return;
      }
      prioritizeArenaEngineForMoveV0();
      void getStockfishArenaMoveV0("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", {
        ...CHESS_STOCKFISH_PRESET_V0.WARMUP,
        queuePriority: CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH,
        queueKind: CHESS_ENGINE_TASK_KIND_V0.PREWARM,
        queueLabel: "arena_warmup"
      }).finally(refreshEngineStatusV0);
    };
    void awaitChessStockfishEngineReadyV0().finally(runWarmup);
  }, [refreshEngineStatusV0]);

  useEffect(() => {
    publishChessArenaWorkspaceOpenV0(Boolean(open));
    if (open) {
      window.dispatchEvent(new CustomEvent(RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0));
    }
    return () => publishChessArenaWorkspaceOpenV0(false);
  }, [open]);

  useEffect(() => {
    if (!open || !isChessRealitySyncActiveV0()) return;
    if (mode === CHESS_GAME_MODE_V0.HUMAN_HUMAN) return;
    setMode(CHESS_GAME_MODE_V0.HUMAN_HUMAN);
    setGame(createChessGameFromTruthProjectionV0({ mode: CHESS_GAME_MODE_V0.HUMAN_HUMAN }));
    setArenaPhase("playing");
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    return subscribeChessRealitySyncV0((detail) => {
      const fen = detail?.projection?.fen;
      if (!fen) return;
      const renderMode = isChessRealitySyncActiveV0()
        ? CHESS_GAME_MODE_V0.HUMAN_HUMAN
        : resolvedInitialMode || mode;
      setGame(createChessGameFromTruthProjectionV0({ mode: renderMode }));
      setTick((n) => n + 1);
      setStatus(
        detail?.source === "match_state"
          ? `sync · ${detail.projection.lastSan || "state"} · seq ${detail.projection.serverSeq}`
          : "reality sync active"
      );
    });
  }, [open, mode, resolvedInitialMode]);

  useEffect(() => {
    if (!open) return;
    const onEngineStatus = (ev) => {
      const detail = ev?.detail;
      if (!detail?.status) return;
      setEngineStatus(detail.status);
      setEngineDetail(detail);
    };
    window.addEventListener(CHESS_TEACHER_STATUS_EVENT_V0, onEngineStatus);
    const runWarmup = () => {
      if (shouldDeferArenaPrewarmV0()) {
        setTimeout(runWarmup, 800);
        return;
      }
      prioritizeArenaEngineForMoveV0();
      void getStockfishArenaMoveV0("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", {
        ...CHESS_STOCKFISH_PRESET_V0.WARMUP,
        queuePriority: CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH,
        queueKind: CHESS_ENGINE_TASK_KIND_V0.PREWARM,
        queueLabel: "arena_warmup"
      }).finally(refreshEngineStatusV0);
    };
    void awaitChessStockfishEngineReadyV0().finally(() => {
      runWarmup();
      refreshEngineStatusV0();
    });
    return () => window.removeEventListener(CHESS_TEACHER_STATUS_EVENT_V0, onEngineStatus);
  }, [open, refreshEngineStatusV0]);

  useEffect(() => {
    if (!open) return undefined;
    const onTheme = (ev) => setBoardTheme(ev?.detail || readChessArenaThemeV0());
    const onSession = (ev) => {
      const next = ev?.detail || readChessArenaSessionV0();
      setArenaSession(next);
      const clocks = initialClocksFromSessionV0(next);
      setWhiteClockMs(clocks.white);
      setBlackClockMs(clocks.black);
    };
    const onStorage = () => {
      setBoardTheme(readChessArenaThemeV0());
      const next = readChessArenaSessionV0();
      setArenaSession(next);
      const clocks = initialClocksFromSessionV0(next);
      setWhiteClockMs(clocks.white);
      setBlackClockMs(clocks.black);
    };
    window.addEventListener(CHESS_ARENA_THEME_EVENT_V0, onTheme);
    window.addEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHESS_ARENA_THEME_EVENT_V0, onTheme);
      window.removeEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
      window.removeEventListener("storage", onStorage);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    attachRhizohUgeEngineHookV0({ matchId: c2cMatch?.matchId || `arena_${Date.now().toString(36)}` });
    return () => {
      detachRhizohUgeEngineHookV0();
    };
  }, [open, c2cMatch?.matchId]);

  useEffect(() => {
    if (!open || !initialMode) return;
    setMode(initialMode);
    setGame(createChessArenaGameV0({ mode: initialMode }));
    setGameEpoch((e) => e + 1);
    setMatchResult(null);
    setStatus("");
    setArenaPhase("playing");
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || outcome) return undefined;
    if (aiBusy || !clockStartedV0) return undefined;
    const needsTeacher =
      mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH || mode === CHESS_GAME_MODE_V0.AI_AI;
    const teacherReady = engineStatus === "stockfish_wasm";
    const hasMoves = (game.moveHistory?.length || 0) > 0;
    if (needsTeacher && !teacherReady && !hasMoves) return undefined;
    const id = window.setInterval(() => {
      if (activeColor === "w") {
        setWhiteClockMs((ms) => Math.max(0, ms - 1000));
      } else {
        setBlackClockMs((ms) => Math.max(0, ms - 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, outcome, activeColor, engineStatus, mode, game, tick, aiBusy, clockStartedV0]);

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
      const result = game.tryMove(detail.payload.move);
      if (result.ok && result.move?.from && result.move?.to) {
        setClockStartedV0(true);
        setLastMoveHighlightV0(
          Object.freeze({ from: result.move.from, to: result.move.to })
        );
      }
      setTick((n) => n + 1);
      setStatus(tr ? `Uzak hamle: ${detail.payload.move}` : `Remote move: ${detail.payload.move}`);
    };
    window.addEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2c);
    return () => window.removeEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2c);
  }, [open, c2cMatch, game, tr]);

  const civilization = useMemo(() => readChessCivilizationV0(), [matchResult, tick]);
  const matchArchiveV0 = useMemo(() => listChessArenaArchiveV0(5), [archiveTick, matchResult]);

  const expandedArchiveRowV0 = useMemo(
    () => matchArchiveV0.find((row) => row.id === expandedArchiveId) || null,
    [matchArchiveV0, expandedArchiveId]
  );

  const archiveReplayRowsV0 = useMemo(() => {
    if (!expandedArchiveRowV0?.moves?.length) return null;
    const trace = buildMatchMovesWithFenV0(expandedArchiveRowV0.moves);
    const row = trace[Math.min(archiveReplayPlyV0, trace.length - 1)];
    if (!row?.after) return null;
    return boardRowsFromFen(row.after);
  }, [expandedArchiveRowV0, archiveReplayPlyV0]);

  const learningWeightsV0 = useMemo(() => readChessLearningWeightsV0(), [matchResult, lastLearningV0]);
  const historicalMindsV0 = useMemo(() => listChessHistoricalMindsV0(), []);
  const activeMindV0 = useMemo(() => getChessHistoricalMindV0(mindId), [mindId]);

  const movePgnV0 = useMemo(
    () => formatChessMoveListPgnV0(game.moveHistory || []),
    [game.moveHistory, tick]
  );

  const persistFinishedMatchV0 = useCallback(
    (outcomeVal, engineLabel = getChessTeacherStatusV0(), extra = {}) => {
      const sanMoves = normalizeChessMovesToSanV0(game.moveHistory || []);
      if (!sanMoves.length) {
        setStatus(tr ? "Hamle oynanmadı — maç arşive yazılmadı." : "No moves played — match not archived.");
        return null;
      }
      const entry = archiveChessArenaMatchV0({
        matchId: c2cMatch?.matchId || `chess_${Date.now().toString(36)}`,
        mode,
        outcome: String(outcomeVal || "unknown"),
        moves: sanMoves,
        fen: game.fen(),
        white: opponentsV0.white,
        black: opponentsV0.black,
        engine: engineLabel,
        policyMode: extra.policyMode || policyMode,
        regret: extra.regret || null,
        evalTrace: extra.evalTrace || null,
        mindId: extra.mindId || mindId,
        learning: extra.learning || null
      });
      if (entry) {
        setLastFinishedMatchV0(entry);
        setExpandedArchiveId(entry.id);
      }
      setArchiveTick((n) => n + 1);
      return entry;
    },
    [c2cMatch?.matchId, game, mode, opponentsV0, policyMode, mindId, tr]
  );

  const flagHandledRef = useRef(false);
  const aiMoveMutexRef = useRef(false);
  const aiAutoLoopGenRef = useRef(0);
  const gameRef = useRef(game);
  const policyModeRef = useRef(policyMode);
  const mindIdRef = useRef(mindId);
  const opponentPresetRef = useRef(opponentPresetV0.preset);
  const c2cMatchRef = useRef(c2cMatch);
  const persistFinishedMatchRef = useRef(null);
  const runMatchLearningRef = useRef(null);

  gameRef.current = game;
  policyModeRef.current = policyMode;
  mindIdRef.current = mindId;
  opponentPresetRef.current = opponentPresetV0.preset;
  c2cMatchRef.current = c2cMatch;

  const runMatchLearningV0 = useCallback(
    async (outcomeVal, matchRow, extra = {}) => {
      const draw = outcomeVal === "draw" || outcomeVal === "stalemate";
      const won = !draw && outcomeVal === "white_wins";
      const moves = normalizeChessMovesToSanV0(game.moveHistory || []);
      if (!moves.length) return;
      setAnalysisBusy(true);
      try {
        const result = await runChessIntelligencePipelineV0({
          moves,
          localColor:
            mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH
              ? rhizohArenaColorV0
              : mode === CHESS_GAME_MODE_V0.AI_HUMAN
                ? "w"
                : "w",
          opponentCastleId:
            extra.opponentCastleId || matchRow?.castleB || peerCastle?.uid || "stockfish",
          matchId: matchRow?.matchId || extra.archiveId || `local_${Date.now().toString(36)}`,
          outcome: outcomeVal,
          won,
          draw,
          locale: uiLocale,
          policyMode,
          mindId,
          runLearningLoop:
            mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ||
            mode === CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH ||
            mode === CHESS_GAME_MODE_V0.AI_HUMAN
        });
        setMatchResult(result);
        if (result.learningLoop) {
          setLastLearningV0(result.learningLoop);
          setLastRegretV0(result.learningLoop.regret);
          if (extra.archiveId) {
            enrichChessArenaArchiveEntryV0(extra.archiveId, {
              regret: result.learningLoop.regret,
              evalTrace: result.learningLoop.regret?.evalTrace,
              learning: {
                weightsAfter: result.learningLoop.weightsAfter,
                weightDelta: result.learningLoop.weightDelta,
                liveMetrics: result.learningLoop.liveMetrics
              }
            });
            setArchiveTick((n) => n + 1);
          }
          if (result.learningLoop.regret) {
            logChessRegretSealedV0(result.learningLoop.regret);
            sealChessEndgameAnalysisV0({
              matchId: extra.archiveId || matchRow?.matchId,
              outcome: outcomeVal,
              moves,
              regret: result.learningLoop.regret,
              evalTrace: result.learningLoop.regret?.evalTrace,
              phase: result.observation?.phase || "endgame"
            });
            if (learningSessionV0.recordMedia) {
              sealChessLearningSessionV0({
                matchId: extra.archiveId || matchRow?.matchId,
                outcome: outcomeVal,
                moves,
                presetId: learningSessionV0.presetId,
                variantId: learningSessionV0.variantId,
                learningStyle: learningSessionV0.learningStyle
              });
            }
          }
          if (result.learningLoop.regret?.forcedWinIgnored) {
            setStatus(
              tr
                ? `Öğrenme: zorunlu kazanış kaçırıldı — agresyon +${Math.round(result.learningLoop.weightDelta.aggressionBias * 100)}%`
                : `Learning: forced win ignored — aggression +${Math.round(result.learningLoop.weightDelta.aggressionBias * 100)}%`
            );
          }
        }
        if (!result.learningLoop?.regret?.forcedWinIgnored) {
          setStatus(
            tr
              ? `Rhizoh öğretmeni: ${result.lesson.title}`
              : `Rhizoh teacher: ${result.lesson.title}`
          );
        }
      } catch {
        setStatus(tr ? "Analiz tamamlanamadı." : "Analysis failed.");
      } finally {
        setAnalysisBusy(false);
      }
    },
    [
      game,
      mode,
      peerCastle?.uid,
      tr,
      uiLocale,
      policyMode,
      mindId,
      learningSessionV0,
      rhizohArenaColorV0
    ]
  );

  persistFinishedMatchRef.current = persistFinishedMatchV0;
  runMatchLearningRef.current = runMatchLearningV0;

  const pickAutoplayMoveWithFallbackV0 = useCallback(
    async ({ rhizohTurnNow, teacherOnline, activeMode }) =>
      pickArenaAutoplayMoveV0({
        game: gameRef.current,
        rhizohTurnNow,
        teacherOnline,
        activeMode,
        policyMode: policyModeRef.current,
        mindId: mindIdRef.current,
        opponentPreset: opponentPresetRef.current
      }),
    []
  );

  const finishMatchOnTimeFlagV0 = useCallback(
    (flagOutcome) => {
      if (outcome || flagHandledRef.current) return;
      if (!(game.moveHistory?.length > 0)) {
        setStatus(tr ? "Süre sayacı ilk hamleden sonra başlar." : "Clock starts after the first move.");
        setWhiteClockMs(initialClocksFromSessionV0().white);
        setBlackClockMs(initialClocksFromSessionV0().black);
        return;
      }
      flagHandledRef.current = true;
      setForcedOutcomeV0(flagOutcome);
      const label = formatChessOutcomeLabelV0(flagOutcome, tr);
      setStatus(tr ? `Süre doldu — ${label}` : `Time flag — ${label}`);
      const archiveEntry = persistFinishedMatchV0(flagOutcome, engineStatus, { mindId });
      void runMatchLearningV0(flagOutcome, c2cMatch, {
        opponentCastleId:
          mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? "teacher_stockfish" : "stockfish",
        archiveId: archiveEntry?.id
      });
    },
    [outcome, tr, persistFinishedMatchV0, engineStatus, mindId, runMatchLearningV0, c2cMatch, mode]
  );

  useEffect(() => {
    if (!open || outcome || game.isGameOver()) return;
    if (activeColor === "w" && whiteClockMs <= 0) {
      finishMatchOnTimeFlagV0("black_wins");
    } else if (activeColor === "b" && blackClockMs <= 0) {
      finishMatchOnTimeFlagV0("white_wins");
    }
  }, [
    open,
    outcome,
    game,
    activeColor,
    whiteClockMs,
    blackClockMs,
    finishMatchOnTimeFlagV0
  ]);

  const resetGame = useCallback(
    (nextMode = mode, opts = {}) => {
      const g = createChessArenaGameV0({ mode: nextMode });
      setGame(g);
      setMode(nextMode);
      setC2cMatch(null);
      setMoveInput("");
      setSelectedSquare(null);
      setMatchResult(null);
      setLastFinishedMatchV0(null);
      setExpandedArchiveId(null);
      setLastRegretV0(null);
      setLastLearningV0(null);
      const clocks = initialClocksFromSessionV0();
      setWhiteClockMs(clocks.white);
      setBlackClockMs(clocks.black);
      setStatus(tr ? "Yeni oyun." : "New game.");
      setLastMoveHighlightV0(null);
      if (!opts.preserveRhizohColor) {
        setRhizohArenaColorV0("w");
      }
      setClockStartedV0(false);
      setForcedOutcomeV0(null);
      setArenaFallbackMode(false);
      setGameEpoch((n) => n + 1);
      flagHandledRef.current = false;
    },
    [mode, tr]
  );

  const startMatchFromLobbyV0 = useCallback(
    (matchOpts) => {
      const nextMode = typeof matchOpts === "string" ? matchOpts : matchOpts?.mode;
      if (matchOpts && typeof matchOpts === "object") {
        if (matchOpts.opponentPresetId) {
          const session = saveChessArenaSessionV0({ opponentPresetId: matchOpts.opponentPresetId });
          setArenaSession(session);
        }
        if (matchOpts.policyMode) {
          const pm = saveChessPolicyModeV0(matchOpts.policyMode);
          setPolicyMode(pm);
        }
      }
      releaseBroadcastForArenaPlayV0();
      let preserveRhizohColor = false;
      if (nextMode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
        const color = rhizohMatchCountV0 % 2 === 0 ? "w" : "b";
        setRhizohArenaColorV0(color);
        setRhizohMatchCountV0((n) => n + 1);
        preserveRhizohColor = true;
      }
      resetGame(nextMode, { preserveRhizohColor });
      setArenaPhase("playing");
      setStatus(tr ? "Maç hazır — iyi şanslar." : "Match ready — good luck.");
    },
    [resetGame, tr, rhizohMatchCountV0]
  );

  useEffect(() => {
    if (!open) return;
    if (peerCastle?.uid) {
      setArenaPhase("playing");
      return;
    }
    if (!autoPlay && !initialMode) {
      setArenaPhase("lobby");
    }
  }, [open, peerCastle?.uid, autoPlay, initialMode]);

  const applyClockIncrementV0 = useCallback(
    (moverColor) => {
      if (timeControlV0.incrementMs <= 0) return;
      if (moverColor === "w") {
        setWhiteClockMs((ms) => ms + timeControlV0.incrementMs);
      } else {
        setBlackClockMs((ms) => ms + timeControlV0.incrementMs);
      }
    },
    [timeControlV0.incrementMs]
  );

  const applyMove = useCallback(
    async (move) => {
      if (forcedOutcomeV0 || outcome || flagHandledRef.current) return false;

      if (isChessRealitySyncActiveV0()) {
        const out = await proposeChessRealityMoveV0({
          move,
          playerId: arenaSession?.playerId || "chess_reality_player"
        });
        if (!out.ok) {
          setStatus(tr ? `Geçersiz hamle: ${move}` : `Illegal move: ${move}`);
          return false;
        }
        setStatus(
          tr
            ? `Önerildi: ${out.validatedSan} (sunucu onayı bekleniyor)`
            : `Proposed: ${out.validatedSan} (awaiting server commit)`
        );
        return true;
      }

      const moverColor = game.turn();
      const fenBefore = game.fen();
      const result = game.tryMove(move);
      if (!result.ok) {
        setStatus(tr ? `Geçersiz hamle: ${move}` : `Illegal move: ${move}`);
        return false;
      }
      setClockStartedV0(true);
      applyClockIncrementV0(moverColor);
      setTick((n) => n + 1);
      if (result.move?.from && result.move?.to) {
        setLastMoveHighlightV0(
          Object.freeze({ from: result.move.from, to: result.move.to })
        );
      }
      logChessMovePlayedV0({
        san: result.move.san,
        color: moverColor,
        fenBefore,
        fen: game.fen(),
        engine: "human",
        policyMode,
        matchId: c2cMatch?.matchId || null
      });
      if (arenaSession.voiceMoves && mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
        speakChessMoveV0({ san: result.move.san, color: moverColor, locale: uiLocale });
      }
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
        const archiveEntry = persistFinishedMatchV0(outcomeVal, engineStatus, { mindId });
        void runMatchLearningV0(outcomeVal, c2cMatch, { archiveId: archiveEntry?.id });
        return true;
      }

      const autoAiModes = [CHESS_GAME_MODE_V0.AI_AI, CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH];
      const humanAiModes = [CHESS_GAME_MODE_V0.AI_HUMAN, CHESS_GAME_MODE_V0.AI_AI];
      const rhizohTurn =
        mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && game.turn() === rhizohArenaColorV0;
      const stockfishBlack = humanAiModes.includes(mode) && game.turn() === "b";
      const stockfishTurn = stockfishBlack || (mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && !rhizohTurn);

      if (
        !autoAiModes.includes(mode) &&
        (stockfishTurn || rhizohTurn) &&
        !game.isGameOver()
      ) {
        if (aiMoveMutexRef.current) return true;
        aiMoveMutexRef.current = true;
        setThinkingActorV0(rhizohTurn ? "rhizoh" : "stockfish");
        setAiBusy(true);
        let aiPick = null;
        try {
          const pick = await pickArenaAutoplayMoveV0({
            game,
            rhizohTurnNow: rhizohTurn,
            teacherOnline: getChessTeacherStatusV0() === "stockfish_wasm",
            activeMode: mode,
            policyMode,
            mindId,
            opponentPreset: opponentPresetV0.preset
          });
          setArenaFallbackMode(Boolean(pick?.fallbackMode));
          aiPick = pick;
        } catch {
          aiPick = null;
        }
        setAiBusy(false);
        setThinkingActorV0(null);
        setEngineStatus(getChessTeacherStatusV0());
        const aiMove = typeof aiPick === "string" ? aiPick : aiPick?.move;
        if (!aiMove) {
          aiMoveMutexRef.current = false;
          setStatus(
            tr
              ? "Motor meşgul — tekrar deneniyor (cluster arka planda)"
              : "Engine busy — retrying (cluster in background)"
          );
          return true;
        }
        if (aiMove) {
          const fenBeforeAi = game.fen();
          const aiResult = tryResolvedChessMoveV0(game, aiMove);
          if (aiResult.ok) {
            setClockStartedV0(true);
            const aiMoverColor = game.turn() === "w" ? "b" : "w";
            applyClockIncrementV0(aiMoverColor);
            setTick((n) => n + 1);
            if (aiResult.move?.from && aiResult.move?.to) {
              setLastMoveHighlightV0(
                Object.freeze({ from: aiResult.move.from, to: aiResult.move.to })
              );
            }
            const engineLabel =
              aiPick?.engine === "stockfish_wasm"
                ? "Stockfish"
                : aiPick?.engine?.startsWith("rhizoh")
                  ? "Rhizoh AI"
                  : tr
                    ? "Yedek motor"
                    : "Fallback engine";
            setStatus((s) => `${s} · ${engineLabel}: ${aiResult.move.san}`);
            logChessMovePlayedV0({
              san: aiResult.move.san,
              color: game.turn() === "w" ? "b" : "w",
              fenBefore: fenBeforeAi,
              fen: game.fen(),
              engine: aiPick?.engine || engineLabel,
              policyMode: aiPick?.policyMode || policyMode,
              matchId: c2cMatch?.matchId || null
            });
            if (arenaSession.voiceMoves) {
              speakChessMoveV0({
                san: aiResult.move.san,
                color: game.turn(),
                locale: uiLocale,
                engine: aiPick?.engine
              });
            }
            if (aiResult.outcome) {
              const archiveEntry = persistFinishedMatchV0(
                aiResult.outcome,
                aiPick?.engine || engineStatus,
                { policyMode: aiPick?.policyMode || policyMode, mindId }
              );
              void runMatchLearningV0(aiResult.outcome, c2cMatch, { archiveId: archiveEntry?.id });
            }
          } else {
            setStatus(
              tr ? `Geçersiz AI hamlesi atlandı: ${aiMove}` : `Skipped illegal AI move: ${aiMove}`
            );
          }
          aiMoveMutexRef.current = false;
        }
      }
      return true;
    },
    [
      game,
      mode,
      tr,
      c2cMatch,
      runMatchLearningV0,
      persistFinishedMatchV0,
      engineStatus,
      policyMode,
      mindId,
      arenaSession.voiceMoves,
      timeControlV0.incrementMs,
      opponentPresetV0.preset,
      uiLocale,
      rhizohArenaColorV0,
      applyClockIncrementV0,
      forcedOutcomeV0,
      outcome
    ]
  );

  useEffect(() => {
    if (
      !open ||
      arenaPhase !== "playing" ||
      (mode !== CHESS_GAME_MODE_V0.AI_AI && mode !== CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH)
    ) {
      return undefined;
    }
    let alive = true;
    const loopGen = aiAutoLoopGenRef.current + 1;
    aiAutoLoopGenRef.current = loopGen;

    void (async () => {
      releaseBroadcastForArenaPlayV0();
      let teacherOnline = getChessTeacherStatusV0() === "stockfish_wasm";
      setStatus(
        teacherOnline
          ? tr
            ? "Maç başlıyor…"
            : "Match starting…"
          : tr
            ? "Yedek motor ile başlıyor — Stockfish hazır olunca güçlenir"
            : "Starting on fallback — upgrades when Stockfish is ready"
      );

      while (
        alive &&
        loopGen === aiAutoLoopGenRef.current &&
        !gameRef.current.isGameOver() &&
        !flagHandledRef.current
      ) {
        const gameNow = gameRef.current;
        if (!teacherOnline && getChessTeacherStatusV0() === "stockfish_wasm") {
          teacherOnline = true;
          setStatus(tr ? "Stockfish hazır — güçlü mod aktif" : "Stockfish ready — strong mode on");
        }
        const deferArenaEngine =
          !isChessArenaWorkspaceOpenV0() && shouldDeferArenaEngineWorkV0();
        if (deferArenaEngine) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
          if (!alive || loopGen !== aiAutoLoopGenRef.current || gameRef.current.isGameOver()) break;
        }
        if (aiMoveMutexRef.current) {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
          continue;
        }
        const rhizohTurnNow =
          mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && gameNow.turn() === rhizohArenaColorV0;
        setThinkingActorV0(
          mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH
            ? rhizohTurnNow
              ? "rhizoh"
              : "stockfish"
            : "stockfish"
        );
        aiMoveMutexRef.current = true;
        setAiBusy(true);
        let pick = null;
        try {
          pick = await pickAutoplayMoveWithFallbackV0({
            rhizohTurnNow,
            teacherOnline,
            activeMode: mode
          });
          setArenaFallbackMode(Boolean(pick?.fallbackMode));
        } catch {
          pick = null;
        }
        setAiBusy(false);
        setThinkingActorV0(null);
        if (!alive || loopGen !== aiAutoLoopGenRef.current || gameRef.current.isGameOver()) {
          aiMoveMutexRef.current = false;
          break;
        }
        const aiMove = pick?.move;
        if (!aiMove) {
          aiMoveMutexRef.current = false;
          await new Promise((resolve) => window.setTimeout(resolve, 800));
          continue;
        }
        const fenBeforeAi = gameRef.current.fen();
        const aiResult = tryResolvedChessMoveV0(gameRef.current, aiMove);
        if (!aiResult.ok) {
          aiMoveMutexRef.current = false;
          setStatus(
            tr ? `Geçersiz AI hamlesi atlandı: ${aiMove}` : `Skipped illegal AI move: ${aiMove}`
          );
          await new Promise((resolve) => window.setTimeout(resolve, 400));
          continue;
        }
        setClockStartedV0(true);
        const aiMoverColor = gameRef.current.turn() === "w" ? "b" : "w";
        applyClockIncrementV0(aiMoverColor);
        setTick((n) => n + 1);
        setGame(gameRef.current);
        if (aiResult.move?.from && aiResult.move?.to) {
          setLastMoveHighlightV0(
            Object.freeze({ from: aiResult.move.from, to: aiResult.move.to })
          );
        }
        const engineLabel =
          pick?.engine === "stockfish_wasm"
            ? "Stockfish"
            : pick?.engine?.startsWith("rhizoh")
              ? "Rhizoh AI"
              : tr
                ? "Yedek motor"
                : "Fallback";
        setStatus(`${engineLabel}: ${aiResult.move.san}`);
        logChessMovePlayedV0({
          san: aiResult.move.san,
          color: gameRef.current.turn() === "w" ? "b" : "w",
          fenBefore: fenBeforeAi,
          fen: gameRef.current.fen(),
          engine: pick?.engine || engineLabel,
          policyMode: pick?.policyMode || policyModeRef.current,
          matchId: c2cMatchRef.current?.matchId || null
        });
        if (aiResult.outcome) {
          const label = formatChessOutcomeLabelV0(aiResult.outcome, tr);
          setStatus(
            mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH
              ? tr
                ? `Maç bitti — ${label}`
                : `Match finished — ${label}`
              : tr
                ? `AI vs AI bitti — ${label}`
                : `AI vs AI finished — ${label}`
          );
          const archiveEntry = persistFinishedMatchRef.current?.(aiResult.outcome, pick?.engine || getChessTeacherStatusV0(), {
            policyMode: pick?.policyMode || policyModeRef.current,
            mindId: mindIdRef.current
          });
          void runMatchLearningRef.current?.(aiResult.outcome, c2cMatchRef.current, {
            opponentCastleId: mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? "teacher_stockfish" : "stockfish",
            archiveId: archiveEntry?.id
          });
          aiMoveMutexRef.current = false;
          break;
        }
        aiMoveMutexRef.current = false;
        await new Promise((resolve) => {
          window.setTimeout(resolve, arenaSession.aiMoveDelayMs || 450);
        });
      }
    })();

    return () => {
      alive = false;
      aiMoveMutexRef.current = false;
      setAiBusy(false);
      setThinkingActorV0(null);
    };
  }, [
    open,
    arenaPhase,
    mode,
    gameEpoch,
    tr,
    rhizohArenaColorV0,
    arenaSession.aiMoveDelayMs,
    pickAutoplayMoveWithFallbackV0,
    applyClockIncrementV0
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
    <div
      className="fixed inset-0 z-[450] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-3"
      data-rhizoh-v11-surface-modal="1"
    >
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-400/35 bg-[#050a08] shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300/70">Chess Arena</p>
            <h2 className="mt-1 text-sm font-black text-emerald-100">{node?.label || "CHESS"}</h2>
            <div className="mt-1">
              <RhizohTowerLiveStatusBadgeV0 towerId="chess_arena" uiLocale={uiLocale} compact />
            </div>
          </div>
          <div className="flex items-start gap-2">
            {arenaPhase !== "lobby" ? (
              <button
                type="button"
                onClick={() => setArenaPhase("lobby")}
                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70 hover:text-white"
              >
                {tr ? "← Lobi" : "← Lobby"}
              </button>
            ) : null}
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
                <option value={CHESS_PIECE_STYLE_V0.fide}>FIDE</option>
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
              <label className="text-[9px] text-white/50">
                {tr ? "Rhizoh politikası" : "Rhizoh policy"}
              </label>
              <select
                value={policyMode}
                onChange={(e) => {
                  const next = saveChessPolicyModeV0(e.target.value);
                  setPolicyMode(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                <option value={CHESS_POLICY_MODE_V0.AGGRESSIVE}>
                  {tr ? "Agresif — kazanmayı önceler" : "Aggressive — win-prioritized"}
                </option>
                <option value={CHESS_POLICY_MODE_V0.BALANCED}>
                  {tr ? "Dengeli" : "Balanced"}
                </option>
                <option value={CHESS_POLICY_MODE_V0.SAFE}>
                  {tr ? "Güvenli — kayıptan kaçınır" : "Safe — loss-avoidance"}
                </option>
              </select>
              <label className="text-[9px] text-white/50">
                {tr ? "Öğrenme seansı" : "Learning session"}
              </label>
              <select
                value={learningSessionV0.presetId}
                onChange={(e) => {
                  const next = saveChessLearningSessionV0({ presetId: e.target.value });
                  setLearningSessionV0(next);
                  const preset = resolveChessLearningSessionPresetV0(next.presetId);
                  const session = saveChessArenaSessionV0({
                    timeControlId: preset.timeControlId,
                    opponentPresetId: preset.opponentPresetId,
                    voiceMoves: preset.voiceMoves
                  });
                  setArenaSession(session);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {learningPresetsV0.map((p) => (
                  <option key={p.id} value={p.id}>
                    {tr ? p.labelTr : p.labelEn}
                  </option>
                ))}
              </select>
              <label className="text-[9px] text-white/50">{tr ? "Zaman kontrolü" : "Time control"}</label>
              <select
                value={arenaSession.timeControlId}
                onChange={(e) => {
                  const next = saveChessArenaSessionV0({ timeControlId: e.target.value });
                  setArenaSession(next);
                  const clocks = initialClocksFromSessionV0(next);
                  setWhiteClockMs(clocks.white);
                  setBlackClockMs(clocks.black);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {timeControlsV0.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tr ? tc.labelTr : tc.labelEn}
                  </option>
                ))}
              </select>
              <label className="text-[9px] text-white/50">
                {tr ? "Rakip motoru" : "Opponent engine"}
              </label>
              <select
                value={arenaSession.opponentPresetId}
                onChange={(e) => {
                  const next = saveChessArenaSessionV0({ opponentPresetId: e.target.value });
                  setArenaSession(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {opponentPresetsV0.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {tr ? preset.labelTr : preset.labelEn}
                  </option>
                ))}
              </select>
              <label className="text-[9px] text-white/50">
                {tr ? "Hamle seslendirme" : "Move voice"}
              </label>
              <select
                value={arenaSession.voiceMoves ? "on" : "off"}
                onChange={(e) => {
                  const next = saveChessArenaSessionV0({ voiceMoves: e.target.value === "on" });
                  setArenaSession(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                <option value="on">{tr ? "Açık" : "On"}</option>
                <option value="off">{tr ? "Kapalı" : "Off"}</option>
              </select>
              <label className="text-[9px] text-white/50">
                {tr ? "Tarihsel zihin" : "Historical mind"}
              </label>
              <select
                value={mindId}
                onChange={(e) => {
                  const next = saveChessHistoricalMindIdV0(e.target.value);
                  setMindId(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {historicalMindsV0.map((mind) => (
                  <option key={mind.id} value={mind.id}>
                    {tr ? mind.labelTr : mind.labelEn}
                  </option>
                ))}
              </select>
              {mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? (
                <p className="col-span-2 text-[8px] text-amber-200/70">
                  {tr
                    ? `${activeMindV0.styleTr} · öğrenme: win=${learningWeightsV0.winForcingWeight.toFixed(2)} risk=${learningWeightsV0.riskPenaltyWeight.toFixed(2)} agg=${learningWeightsV0.aggressionBias.toFixed(2)}`
                    : `${activeMindV0.styleEn} · learning: win=${learningWeightsV0.winForcingWeight.toFixed(2)} risk=${learningWeightsV0.riskPenaltyWeight.toFixed(2)} agg=${learningWeightsV0.aggressionBias.toFixed(2)}`}
                </p>
              ) : null}
              {mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH ? (
                <p className="col-span-2 text-[8px] text-white/40">
                  {tr
                    ? `Aktif politika: ${getChessPolicyProfileV0(policyMode).labelTr} · maç sonrası öğrenme döngüsü arşive yazılır`
                    : `Active policy: ${getChessPolicyProfileV0(policyMode).labelEn} · post-match learning loop saved to archive`}
                </p>
              ) : null}
              <label className="text-[9px] text-white/50">
                {tr ? "Zaman kontrolü" : "Time control"}
              </label>
              <select
                value={arenaSession.timeControlId}
                onChange={(e) => {
                  const next = saveChessArenaSessionV0({ timeControlId: e.target.value });
                  setArenaSession(next);
                  const clocks = initialClocksFromSessionV0(next);
                  setWhiteClockMs(clocks.white);
                  setBlackClockMs(clocks.black);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {timeControlsV0.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tr ? tc.labelTr : tc.labelEn}
                  </option>
                ))}
              </select>
              <label className="text-[9px] text-white/50">
                {tr ? "Stockfish gücü" : "Stockfish strength"}
              </label>
              <select
                value={arenaSession.opponentPresetId}
                onChange={(e) => {
                  const next = saveChessArenaSessionV0({ opponentPresetId: e.target.value });
                  setArenaSession(next);
                }}
                className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              >
                {opponentPresetsV0.map((op) => (
                  <option key={op.id} value={op.id}>
                    {tr ? op.labelTr : op.labelEn}
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

        {arenaPhase === "lobby" ? (
          <RhizohChessArenaLobbyV0
            tr={tr}
            engineStatus={engineStatus}
            engineDetail={engineDetail}
            onStartMatch={startMatchFromLobbyV0}
            onOpenArchive={() => setArenaPhase("archive")}
            onRetryEngine={retryStockfishEngineV0}
          />
        ) : null}

        {arenaPhase === "archive" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {tr ? "Maç arşivi" : "Match archive"}
              </h3>
              <button
                type="button"
                onClick={() => setArenaPhase("lobby")}
                className="text-[11px] text-cyan-300 hover:text-cyan-200"
              >
                {tr ? "← Lobiye dön" : "← Back to lobby"}
              </button>
            </div>
            {matchArchiveV0.length ? (
              <ul className="space-y-2">
                {listChessArenaArchiveV0(20).map((row) => (
                  <li
                    key={row.id}
                    className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-white/70"
                  >
                    <span className="font-semibold text-white">
                      {formatChessOutcomeLabelV0(row.outcome, tr)}
                    </span>
                    <span className="text-white/45">
                      {" "}
                      · {row.white} vs {row.black} · {row.moves?.length || 0}{" "}
                      {tr ? "hamle" : "moves"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-white/45">
                {tr ? "Arşiv boş — lobiden yeni oyun başlat." : "Archive empty — start a game from lobby."}
              </p>
            )}
          </div>
        ) : null}

        {arenaPhase === "playing" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto p-3">
            <ChessLiveMatchFlankV0
              moves={(game.moveHistory || []).map((m) => ({ san: m.san, color: m.color }))}
              tr={tr}
              rhizohColor={rhizohArenaColorV0}
              whiteName={opponentsV0.white}
              blackName={opponentsV0.black}
              whiteClockMs={whiteClockMs}
              blackClockMs={blackClockMs}
              whiteActive={activeColor === "w" && !outcome}
              blackActive={activeColor === "b" && !outcome}
            >
              <RhizohChessBoardV0
                rows={rows}
                boardColors={boardColors}
                pieceStyleId={boardTheme.pieceStyleId}
                pieceBold={pieceBold}
                lastMove={lastMoveHighlightV0}
                selectedSquare={selectedSquare}
                onSquareClick={onSquareClick}
                orientation={boardOrientationV0}
                sizeClass="w-[min(100%,min(92vw,50dvh))]"
                borderClass="border-2 border-cyan-500/45 shadow-[0_0_28px_rgba(0,204,255,0.15)]"
              />
            </ChessLiveMatchFlankV0>
            <div className="flex w-full max-w-5xl justify-between gap-2 sm:hidden">
              <ChessPlayerBarV0
                name={opponentsV0.white}
                clockMs={whiteClockMs}
                active={activeColor === "w" && !outcome}
                align="left"
                tr={tr}
                lastMoveSan={playerLastMovesV0.white}
              />
              <ChessPlayerBarV0
                name={opponentsV0.black}
                clockMs={blackClockMs}
                active={activeColor === "b" && !outcome}
                align="right"
                tr={tr}
                lastMoveSan={playerLastMovesV0.black}
              />
            </div>
            <p className="text-[9px] text-white/40">
              {engineStatus === "stockfish_wasm"
                ? tr
                  ? "Motor: Stockfish 16 NNUE (WASM)"
                  : "Engine: Stockfish 16 NNUE (WASM)"
                : engineStatus === "heuristic_fallback"
                  ? tr
                    ? "Motor: Stockfish yüklenemedi — öğretmen kapalı, yedek AI aktif"
                    : "Engine: Stockfish unavailable — teacher offline, fallback active"
                  : engineStatus === "stockfish_compiling"
                    ? tr
                      ? "Motor: WASM derleniyor… (ilk açılış 30–60 sn sürebilir)"
                      : "Engine: compiling WASM… (first load may take 30–60s)"
                    : tr
                      ? "Motor: başlatılıyor…"
                      : "Engine: starting…"}
            </p>
            {engineStatus === "heuristic_fallback" ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-2 py-2 text-[10px] text-amber-100">
                <p>
                  {tr
                    ? "Stockfish WASM yüklenmeden öğrenme ve güçlü AI maçları geçersizdir. Önce öğretmeni ayağa kaldır."
                    : "Learning and strong AI matches are invalid until Stockfish WASM loads. Restore the teacher first."}
                </p>
                {engineDetail?.initError ? (
                  <p className="mt-1 font-mono text-[9px] text-amber-200/80">{engineDetail.initError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={retryStockfishEngineV0}
                  className="mt-2 rounded border border-amber-400/50 px-2 py-1 text-[10px] font-semibold text-amber-50 hover:bg-amber-500/20"
                >
                  {tr ? "Stockfish'i yeniden dene" : "Retry Stockfish"}
                </button>
              </div>
            ) : null}
            {aiBusy ? (
              <p className="text-[10px] text-amber-200">
                {engineStatus === "stockfish_compiling"
                  ? tr
                    ? "Stockfish WASM derleniyor…"
                    : "Compiling Stockfish WASM…"
                  : thinkingActorV0 === "rhizoh"
                    ? tr
                      ? "Rhizoh düşünüyor…"
                      : "Rhizoh thinking…"
                    : engineStatus === "heuristic_fallback"
                      ? tr
                        ? "Yedek motor hamle seçiyor…"
                        : "Fallback engine choosing move…"
                      : tr
                        ? "Stockfish düşünüyor…"
                        : "Stockfish thinking…"}
              </p>
            ) : null}
            {analysisBusy ? (
              <p className="text-[10px] text-cyan-200">
                {tr ? "Gözlem → Analiz → Öğren → Öğret…" : "Observe → Analyze → Learn → Teach…"}
              </p>
            ) : null}
            {arenaFallbackMode ? (
              <p className="rounded border border-amber-500/35 bg-amber-950/25 px-2 py-1 text-center text-[10px] text-amber-200">
                {tr
                  ? "Yedek sezgisel motor — Stockfish kuyruğu meşgul"
                  : "Heuristic fallback — Stockfish queue busy"}
              </p>
            ) : null}
            <p className="text-center text-[10px] text-white/55">{status}</p>
            {mode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH && (game.moveHistory?.length || 0) > 0 ? (
              <div className="w-full max-w-md">
                <ChessSplitMoveListV0
                  moves={(game.moveHistory || []).map((m) => ({
                    san: m.san,
                    color: m.color
                  }))}
                  rhizohColor={rhizohArenaColorV0}
                  tr={tr}
                  compact
                />
              </div>
            ) : movePgnV0 ? (
              <p className="max-w-md break-words text-center font-mono text-[9px] leading-relaxed text-white/45">
                {movePgnV0}
              </p>
            ) : null}
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
                <span className="block text-[8px] font-normal text-white/40">
                  {tr
                    ? "Yerel öğrenme puanı — FIDE/resmi sıralama değil"
                    : "Local training rating — not an official FIDE rank"}
                </span>
              </p>
            ) : null}
            {lastFinishedMatchV0 ? (
              <div className="w-full max-w-md rounded-xl border border-amber-400/40 bg-amber-950/30 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-200/90">
                  {tr ? "Son maç" : "Last match"}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-amber-50">
                  {formatChessOutcomeLabelV0(lastFinishedMatchV0.outcome, tr)}
                </p>
                <p className="mt-1 text-[9px] text-white/55">
                  {lastFinishedMatchV0.white} vs {lastFinishedMatchV0.black} ·{" "}
                  {lastFinishedMatchV0.moves?.length || 0} {tr ? "hamle" : "moves"} ·{" "}
                  {lastFinishedMatchV0.engine}
                  {lastFinishedMatchV0.policyMode
                    ? ` · ${tr ? "Politika" : "Policy"}: ${lastFinishedMatchV0.policyMode}`
                    : ""}
                </p>
                {lastRegretV0?.topRegret || lastRegretV0?.forcedWinIgnored ? (
                  <div className="mt-2 rounded border border-rose-400/30 bg-rose-950/25 px-2 py-1.5">
                    <p className="text-[8px] font-semibold uppercase tracking-wider text-rose-200/90">
                      {tr ? "Öğrenme analizi" : "Learning analysis"}
                    </p>
                    {lastRegretV0.forcedWinIgnored ? (
                      <p className="mt-0.5 text-[9px] font-semibold text-rose-100">
                        FORCED_WIN_DETECTED · BUT_NOT_TAKEN
                      </p>
                    ) : null}
                    {lastRegretV0.topRegret ? (
                      <p className="mt-0.5 text-[9px] text-rose-100/85">
                        {lastRegretV0.topRegret.san} · {lastRegretV0.topRegret.swingCp}cp ·{" "}
                        {tr ? "önerilen" : "best"}: {lastRegretV0.topRegret.bestMove}
                      </p>
                    ) : null}
                    {lastLearningV0?.liveMetrics ? (
                      <p className="mt-0.5 text-[8px] text-rose-200/65">
                        {tr ? "Doğruluk" : "Accuracy"}: {lastLearningV0.liveMetrics.accuracy}% ·{" "}
                        {tr ? "Risk" : "Risk"}: {lastLearningV0.liveMetrics.riskIndex} ·{" "}
                        {tr ? "Momentum" : "Momentum"}: {lastLearningV0.liveMetrics.momentum}
                      </p>
                    ) : null}
                    {lastFinishedMatchV0.evalTrace?.length || lastRegretV0?.evalTrace?.length ? (
                      <ul className="mt-1 space-y-0.5 text-[8px] text-white/50">
                        {(lastFinishedMatchV0.evalTrace || lastRegretV0?.evalTrace || [])
                          .slice(0, 8)
                          .map((t) => (
                            <li key={`last-trace-${t.moveNumber}-${t.san}`}>
                              {t.moveNumber}. {t.san} · cp {t.beforeCp} → swing {t.swingCp}
                              {t.bestMove ? ` · ${tr ? "en iyi" : "best"}: ${t.bestMove}` : ""}
                            </li>
                          ))}
                      </ul>
                    ) : null}
                    {lastLearningV0?.weightDelta?.aggressionBias > 0 ? (
                      <p className="mt-0.5 text-[8px] text-emerald-200/75">
                        {tr
                          ? `Ağırlık güncellendi: agresyon +${(lastLearningV0.weightDelta.aggressionBias * 100).toFixed(0)}%`
                          : `Weights updated: aggression +${(lastLearningV0.weightDelta.aggressionBias * 100).toFixed(0)}%`}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {lastFinishedMatchV0.moves?.length ? (
                  <p className="mt-1.5 break-all font-mono text-[8px] leading-relaxed text-white/45">
                    {formatChessMoveListPgnV0(lastFinishedMatchV0.moves)}
                  </p>
                ) : null}
                <p className="mt-1 text-[8px] text-white/35">
                  {tr
                    ? "Tam kayıt aşağıdaki Arşiv listesinde — localStorage"
                    : "Full row saved below in Archive — localStorage"}
                </p>
              </div>
            ) : null}
            {outcome ? (
              <p className="text-[11px] font-semibold text-amber-200">
                {tr ? "Sonuç:" : "Outcome:"} {formatChessOutcomeLabelV0(outcome, tr)}
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
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedArchiveId((id) => {
                            if (id === row.id) return null;
                            setArchiveReplayPlyV0(Math.max(0, (row.moves?.length || 1) - 1));
                            return row.id;
                          })
                        }
                        className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-left hover:border-cyan-400/30"
                      >
                        <span className="font-semibold text-white/75">
                          {formatChessOutcomeLabelV0(row.outcome, tr)}
                        </span>
                        <span className="text-white/45">
                          {" "}
                          · {row.moves?.length || 0} {tr ? "hamle" : "moves"}
                        </span>
                      </button>
                      {expandedArchiveId === row.id && row.moves?.length ? (
                        <div className="mt-1 space-y-1 rounded bg-black/40 px-2 py-1">
                          {archiveReplayRowsV0 ? (
                            <div className="mb-2">
                              <RhizohChessBoardV0
                                rows={archiveReplayRowsV0}
                                boardColors={boardColors}
                                pieceStyleId={boardTheme.pieceStyleId}
                                pieceBold={pieceBold}
                                interactive={false}
                                sizeClass="mx-auto w-full max-w-[10rem]"
                              />
                              <div className="mt-1 flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="rounded border border-white/15 px-1.5 py-0.5 text-[8px]"
                                  onClick={() => setArchiveReplayPlyV0((p) => Math.max(0, p - 1))}
                                >
                                  ◀
                                </button>
                                <span className="font-mono text-[8px] text-white/50">
                                  {archiveReplayPlyV0 + 1}/{row.moves.length}
                                </span>
                                <button
                                  type="button"
                                  className="rounded border border-white/15 px-1.5 py-0.5 text-[8px]"
                                  onClick={() =>
                                    setArchiveReplayPlyV0((p) =>
                                      Math.min((row.moves?.length || 1) - 1, p + 1)
                                    )
                                  }
                                >
                                  ▶
                                </button>
                              </div>
                            </div>
                          ) : null}
                          <p className="break-all font-mono text-[8px] text-white/50">
                            {formatChessMoveListPgnV0(row.moves)}
                          </p>
                          {row.regret?.topRegret ? (
                            <p className="text-[8px] text-rose-200/80">
                              {tr ? "Pişmanlık" : "Regret"}: {row.regret.topRegret.san} (
                              {row.regret.topRegret.swingCp}cp)
                            </p>
                          ) : null}
                          {row.evalTrace?.length ? (
                            <ul className="text-[7px] text-white/40">
                              {row.evalTrace.slice(0, 6).map((t) => (
                                <li key={`${row.id}-t-${t.moveNumber}`}>
                                  {t.moveNumber}. {t.san} · cp {t.beforeCp} → swing {t.swingCp}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
        </div>
        ) : null}
      </div>
    </div>
  );
});
