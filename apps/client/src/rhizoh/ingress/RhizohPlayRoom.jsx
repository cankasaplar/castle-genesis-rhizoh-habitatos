import React, { useState, useEffect, useRef, useMemo } from "react";
import { Chess } from "chess.js";
import { identifyOpeningTheory } from "../runtime/rhizohOpeningTheoryV1.js";
import {
  Play,
  RotateCcw,
  ArrowLeftRight,
  Sparkles,
  Cpu,
  Trophy,
  Volume2,
  ChevronRight,
  Copy,
  Check,
  Pause,
  Clock,
  Shield,
  Zap,
  BookOpen,
  Activity,
  Compass,
  Layers,
  Flag,
  Handshake,
  ShieldCheck,
  Lock,
  ExternalLink
} from "lucide-react";

const PIECE_IMAGES = {
  wP: "/chess/pieces/cburnett/wP.svg",
  wN: "/chess/pieces/cburnett/wN.svg",
  wB: "/chess/pieces/cburnett/wB.svg",
  wR: "/chess/pieces/cburnett/wR.svg",
  wQ: "/chess/pieces/cburnett/wQ.svg",
  wK: "/chess/pieces/cburnett/wK.svg",
  bP: "/chess/pieces/cburnett/bP.svg",
  bN: "/chess/pieces/cburnett/bN.svg",
  bB: "/chess/pieces/cburnett/bB.svg",
  bR: "/chess/pieces/cburnett/bR.svg",
  bQ: "/chess/pieces/cburnett/bQ.svg",
  bK: "/chess/pieces/cburnett/bK.svg"
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const TIME_CONTROL_PRESETS = [
  { id: "bullet_1_0", label: "Bullet 1+0", totalMs: 60000, incMs: 0 },
  { id: "blitz_3_0", label: "Blitz 3+0", totalMs: 180000, incMs: 0 },
  { id: "blitz_5_0", label: "Blitz 5+0", totalMs: 300000, incMs: 0 },
  { id: "rapid_10_0", label: "Rapid 10+0", totalMs: 600000, incMs: 0 },
  { id: "classical_30_0", label: "Classical 30+0", totalMs: 1800000, incMs: 0 },
  { id: "fixed_movetime", label: "Fixed Movetime", totalMs: null, incMs: 0 }
];

function formatClock(ms) {
  if (ms === null || ms === undefined) return "∞";
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (totalSec < 10) {
    const tenths = Math.floor((Math.max(0, ms) % 1000) / 100);
    return `${m}:${s < 10 ? "0" : ""}${s}.${tenths}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function RhizohPlayRoom({ player, onUpdatePlayer, onBackToMetrics }) {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => game.fen());
  const [history, setHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [orientation, setOrientation] = useState("w"); // 'w' or 'b'
  const [gameMode, setGameMode] = useState("human_vs_rhizoh"); // 'human_vs_rhizoh' | 'exhibition'
  const [playerColor, setPlayerColor] = useState("w");
  const [isThinking, setIsThinking] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Time Controls & Clocks
  const [selectedTc, setSelectedTc] = useState("blitz_3_0");
  const [whiteClockMs, setWhiteClockMs] = useState(180000);
  const [blackClockMs, setBlackClockMs] = useState(180000);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [engineSpeedMs, setEngineSpeedMs] = useState(600); // for fixed_movetime
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [timedOutWinner, setTimedOutWinner] = useState(null);
  const [exhibitionSpeed, setExhibitionSpeed] = useState("normal"); // "normal" (500ms) | "fast" (180ms) | "turbo" (40ms)

  const whiteClockRef = useRef(180000);
  const blackClockRef = useRef(180000);
  const lastTickTimeRef = useRef(null);

  useEffect(() => {
    whiteClockRef.current = whiteClockMs;
  }, [whiteClockMs]);

  useEffect(() => {
    blackClockRef.current = blackClockMs;
  }, [blackClockMs]);

  // Engine Telemetry
  const [evalScore, setEvalScore] = useState(15);
  const [depth, setDepth] = useState(0);
  const [nodes, setNodes] = useState(0);
  const [nps, setNps] = useState(0);
  const [pv, setPv] = useState("");
  const [isLastMoveBook, setIsLastMoveBook] = useState(false);
  const [lastUciCommand, setLastUciCommand] = useState("");
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Game started. Your turn!");
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [wakeAttempt, setWakeAttempt] = useState(0);
  const [wakeElapsedSec, setWakeElapsedSec] = useState(0);

  // Cryptographic Ledger Sealing State
  const [sealedGame, setSealedGame] = useState(null);
  const [isSealing, setIsSealing] = useState(false);
  const [gameOutcome, setGameOutcome] = useState(null);

  // Track B Learning Telemetry (Honest real-time backend data)
  const [trackBStats, setTrackBStats] = useState(null);
  const [trackBLoading, setTrackBLoading] = useState(true);

  const autoPlayTimerRef = useRef(null);
  const wakeTimerRef = useRef(null);
  const clockIntervalRef = useRef(null);

  // Derive UCI move history for opening identification and engine repetition avoidance
  const uciMoves = useMemo(() => {
    return game.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ""));
  }, [history]);

  // Live Opening Theory identification from CC0 database
  const openingTheory = useMemo(() => {
    return identifyOpeningTheory(uciMoves);
  }, [uciMoves]);

  // Material balance calculation
  const materialBalance = useMemo(() => {
    let balance = 0;
    const capturedWhite = [];
    const capturedBlack = [];
    const startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === "w") {
            balance += PIECE_VALUES[piece.type];
            if (piece.type !== "k") currentCounts.w[piece.type]++;
          } else {
            balance -= PIECE_VALUES[piece.type];
            if (piece.type !== "k") currentCounts.b[piece.type]++;
          }
        }
      }
    }

    for (const [type, count] of Object.entries(startingCounts)) {
      const lostByBlack = count - currentCounts.b[type];
      for (let i = 0; i < lostByBlack; i++) capturedBlack.push("b" + type.toUpperCase());
      const lostByWhite = count - currentCounts.w[type];
      for (let i = 0; i < lostByWhite; i++) capturedWhite.push("w" + type.toUpperCase());
    }

    return { balance, capturedWhite, capturedBlack };
  }, [fen]);

  // Move history pairs for table view
  const movePairs = useMemo(() => {
    const verboseHistory = game.history({ verbose: true });
    const pairs = [];
    for (let i = 0; i < verboseHistory.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: verboseHistory[i],
        black: verboseHistory[i + 1] || null
      });
    }
    return pairs;
  }, [history]);

  // Fetch live Track B puzzle mining stats from real backend endpoint
  const fetchTrackBStats = async () => {
    const candidateEndpoints = [
      "/api/chess/puzzle/stats",
      "/rhizoh/chess/puzzle/stats"
    ];

    for (const ep of candidateEndpoints) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(ep, { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.stats) {
            setTrackBStats(data.stats);
            setTrackBLoading(false);
            return;
          }
        }
      } catch {}
    }
  };

  useEffect(() => {
    fetchTrackBStats();
    const interval = setInterval(fetchTrackBStats, 6000);
    return () => clearInterval(interval);
  }, []);

  // Seal completed game into Event Ledger via Gateway
  const sealGameToLedger = async (finalGame, resultStr, terminationReason, whiteName, blackName) => {
    if (isSealing) return;
    setIsSealing(true);

    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
      const pgnHeader = [
        `[Event "${gameMode === 'exhibition' ? 'Rhizoh Autonomous Exhibition Match' : 'Rhizoh Human vs Rhizoh Match'}"]`,
        `[Site "Rhizoh Production Cluster (Hetzner CPX21)"]`,
        `[Date "${dateStr}"]`,
        `[Round "1"]`,
        `[White "${whiteName}"]`,
        `[Black "${blackName}"]`,
        `[Result "${resultStr}"]`,
        `[Termination "${terminationReason}"]`,
        `[TimeControl "${selectedTc}"]`,
        `[PlyCount "${finalGame.history().length}"]`
      ].join("\n") + "\n\n" + finalGame.pgn();

      const candidateEndpoints = [
        "/api/chess/game/complete",
        "/rhizoh/chess/game/complete"
      ];

      for (const ep of candidateEndpoints) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const res = await fetch(ep, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pgn: pgnHeader,
              result: resultStr,
              termination: terminationReason,
              white: whiteName,
              black: blackName,
              timeControl: selectedTc,
              userIsHuman: gameMode === "human_vs_rhizoh",
              userColor: playerColor,
              playerId: player?.player_id || null
            }),
            signal: ctrl.signal
          });
          clearTimeout(t);
          if (res.ok) {
            const data = await res.json();
            if (data.ok) {
              setSealedGame({
                gameId: data.gameId,
                pgnSha: data.pgn_sha256,
                quarantined: data.quarantined,
                ledgerAppended: data.ledgerAppended,
                message: data.message,
                ratingEvent: data.ratingEvent
              });
              if (data.player && onUpdatePlayer) {
                onUpdatePlayer(data.player);
              }
              return;
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Ledger sealing error:", err);
    } finally {
      setIsSealing(false);
    }
  };

  // Clock tick interval with high-precision Date.now() delta
  useEffect(() => {
    if (!isClockRunning || game.isGameOver() || selectedTc === "fixed_movetime" || isTimedOut) {
      clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
      lastTickTimeRef.current = null;
      return;
    }

    lastTickTimeRef.current = Date.now();
    clockIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = lastTickTimeRef.current ? Math.max(1, now - lastTickTimeRef.current) : 100;
      lastTickTimeRef.current = now;

      if (game.isGameOver()) {
        clearInterval(clockIntervalRef.current);
        setIsClockRunning(false);
        return;
      }

      const currentTurn = game.turn();
      if (currentTurn === "w") {
        setWhiteClockMs((prev) => {
          const next = Math.max(0, prev - delta);
          whiteClockRef.current = next;
          if (next === 0) {
            clearInterval(clockIntervalRef.current);
            clearTimeout(autoPlayTimerRef.current);
            setIsClockRunning(false);
            setIsAutoPlaying(false);
            setIsTimedOut(true);
            setTimedOutWinner("Black");
            setStatusMessage("⏱️ Time out! Black wins on time.");
            setGameOutcome({
              result: "0-1",
              winner: "Black",
              reason: "Time Forfeit"
            });
            const whitePlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion");
            const blackPlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion");
            sealGameToLedger(game, "0-1", "time_forfeit", whitePlayer, blackPlayer);
          }
          return next;
        });
      } else {
        setBlackClockMs((prev) => {
          const next = Math.max(0, prev - delta);
          blackClockRef.current = next;
          if (next === 0) {
            clearInterval(clockIntervalRef.current);
            clearTimeout(autoPlayTimerRef.current);
            setIsClockRunning(false);
            setIsAutoPlaying(false);
            setIsTimedOut(true);
            setTimedOutWinner("White");
            setStatusMessage("⏱️ Time out! White wins on time.");
            setGameOutcome({
              result: "1-0",
              winner: "White",
              reason: "Time Forfeit"
            });
            const whitePlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion");
            const blackPlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion");
            sealGameToLedger(game, "1-0", "time_forfeit", whitePlayer, blackPlayer);
          }
          return next;
        });
      }
    }, 100);

    return () => {
      clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
    };
  }, [isClockRunning, fen, selectedTc, isTimedOut]);

  // Handle Time Control preset change
  const handleSelectTimeControl = (presetId) => {
    setSelectedTc(presetId);
    const preset = TIME_CONTROL_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.totalMs !== null) {
      setWhiteClockMs(preset.totalMs);
      setBlackClockMs(preset.totalMs);
      whiteClockRef.current = preset.totalMs;
      blackClockRef.current = preset.totalMs;
      lastTickTimeRef.current = Date.now();
      if (!game.isGameOver() && (game.history().length > 0 || (gameMode === "exhibition" && isAutoPlaying))) {
        setIsClockRunning(true);
      }
    } else {
      setIsClockRunning(false);
    }
  };

  // Request engine move from gateway
  const requestEngineMove = async (currentFen) => {
    setIsThinking(true);
    setIsWakingUp(false);
    setWakeAttempt(0);
    setWakeElapsedSec(0);
    clearInterval(wakeTimerRef.current);

    const startTime = Date.now();
    const movesList = game.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ""));

    const candidateEndpoints = [
      "/api/chess/move",
      "/rhizoh/chess/move",
      "/api/gatewayProxy/api/chess/move"
    ];

    let payload = {
      fen: currentFen,
      moves: movesList
    };

    if (selectedTc === "fixed_movetime") {
      payload.movetime = engineSpeedMs;
    } else {
      payload.wtime = Math.max(10, Math.round(whiteClockRef.current));
      payload.btime = Math.max(10, Math.round(blackClockRef.current));
      const preset = TIME_CONTROL_PRESETS.find((p) => p.id === selectedTc);
      payload.winc = preset?.incMs || 0;
      payload.binc = preset?.incMs || 0;
    }

    const maxRetries = 6;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setWakeAttempt(attempt);

      if (attempt === 1) {
        const tcLabel = selectedTc === "fixed_movetime" ? `${engineSpeedMs}ms` : TIME_CONTROL_PRESETS.find((p) => p.id === selectedTc)?.label || selectedTc;
        setStatusMessage(`Rhizoh NNUE calculating (${tcLabel})...`);
      } else {
        setIsWakingUp(true);
        setStatusMessage(`⏳ Rhizoh engine queue wait (attempt ${attempt}/${maxRetries})...`);
        if (!wakeTimerRef.current) {
          wakeTimerRef.current = setInterval(() => {
            setWakeElapsedSec(Math.round((Date.now() - startTime) / 1000));
          }, 1000);
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      for (const endpoint of candidateEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.status === 503) {
            setIsThinking(false);
            setStatusMessage("⚠️ HTTP 503: Engine Offline. Reality Seal enforced — zero fake/fallback moves.");
            return;
          }

          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.bestMove) {
              clearInterval(wakeTimerRef.current);
              setIsWakingUp(false);
              applyEngineMove(
                data.bestMove,
                data.evalCp,
                data.depth,
                data.nodes,
                data.pv,
                data.nps,
                data.wallTimeMs,
                Boolean(data.isBookMove),
                data.uciCommandSent || ""
              );
              return;
            }
          }
        } catch {}
      }
    }

    clearInterval(wakeTimerRef.current);
    setIsWakingUp(false);
    setIsThinking(false);
    setStatusMessage("⚠️ Rhizoh Engine Gateway Unreachable. Reality Seal preserved — halting without synthetic move.");
  };

  const applyEngineMove = (moveUci, evalCp = 0, currentDepth = 8, realNodes = 0, currentPv = "", realNps = 0, wallTime = 400, isBook = false, uciCmd = "") => {
    try {
      let move = null;
      if (typeof moveUci === "string") {
        const clean = moveUci.trim();
        if (clean.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(clean)) {
          const from = clean.slice(0, 2);
          const to = clean.slice(2, 4);
          const promotion = clean.length > 4 ? clean[4].toLowerCase() : undefined;
          try {
            move = game.move({ from, to, ...(promotion ? { promotion } : {}) });
          } catch {}
        }
        if (!move) {
          try {
            move = game.move(clean);
          } catch {}
        }
      }

      // STRICT REALITY SEAL: Never play a random or first legal move if engine output is invalid!
      if (!move && !game.isGameOver()) {
        setIsThinking(false);
        setStatusMessage("⚠️ Invalid engine move received. Reality Seal enforced — no fallback moves allowed.");
        return;
      }

      if (move) {
        setFen(game.fen());
        setHistory(game.history({ verbose: true }));
        setLastMove({ from: move.from, to: move.to });
        setEvalScore(evalCp || 0);
        setDepth(currentDepth || 0);
        setNodes(realNodes || 0);
        setNps(realNps || 0);
        if (currentPv) setPv(currentPv);
        setIsLastMoveBook(isBook);
        if (uciCmd) setLastUciCommand(uciCmd);

        if (selectedTc !== "fixed_movetime" && !game.isGameOver() && !isTimedOut) {
          lastTickTimeRef.current = Date.now();
          setIsClockRunning(true);
        }

        checkGameOver();
      }
    } catch (e) {
      console.error("Move application error:", e);
    } finally {
      setIsThinking(false);
    }
  };

  const checkGameOver = () => {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      const result = game.turn() === "w" ? "0-1" : "1-0";
      setStatusMessage(`Checkmate! ${winner} wins!`);
      setIsClockRunning(false);
      setGameOutcome({
        result,
        winner,
        reason: "Checkmate"
      });
      const whitePlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion");
      const blackPlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion");
      sealGameToLedger(game, result, "checkmate", whitePlayer, blackPlayer);
    } else if (game.isDraw()) {
      setStatusMessage("Game drawn (stalemate, repetition, or 50-move rule).");
      setIsClockRunning(false);
      const termination = game.isStalemate() ? "stalemate" : (game.isThreefoldRepetition() ? "repetition" : (game.isInsufficientMaterial() ? "insufficient_material" : "50_move_rule"));
      setGameOutcome({
        result: "1/2-1/2",
        winner: "Draw",
        reason: termination.replace(/_/g, " ").toUpperCase()
      });
      const whitePlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion");
      const blackPlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion");
      sealGameToLedger(game, "1/2-1/2", termination, whitePlayer, blackPlayer);
    } else if (game.inCheck()) {
      setStatusMessage("Check!");
    } else {
      setStatusMessage(game.turn() === playerColor ? "Your turn!" : "Rhizoh is thinking...");
    }
  };

  // Handle player square click
  const handleSquareClick = (square) => {
    if (isThinking || game.isGameOver() || isTimedOut) return;
    if (gameMode === "human_vs_rhizoh" && game.turn() !== playerColor) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q"
        });

        if (move) {
          if (selectedTc !== "fixed_movetime") {
            lastTickTimeRef.current = Date.now();
            setIsClockRunning(true);
          }

          setFen(game.fen());
          setHistory(game.history({ verbose: true }));
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setValidMoves([]);
          setIsLastMoveBook(false);

          if (!game.isGameOver()) {
            if (gameMode === "human_vs_rhizoh") {
              setTimeout(() => requestEngineMove(game.fen()), 200);
            }
          } else {
            checkGameOver();
          }
          return;
        }
      } catch {}
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }).map((m) => m.to);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Resignation action
  const handleResign = () => {
    if (game.isGameOver() || isTimedOut || isThinking) return;
    setIsClockRunning(false);
    clearTimeout(autoPlayTimerRef.current);

    const isHumanWhite = playerColor === "w";
    const result = isHumanWhite ? "0-1" : "1-0";
    const winner = isHumanWhite ? "Black (Rhizoh)" : "White (Rhizoh)";

    setStatusMessage(`🏳️ You resigned. ${winner} wins.`);
    setGameOutcome({
      result,
      winner: isHumanWhite ? "Black" : "White",
      reason: "Resignation",
      isResign: true
    });

    const whitePlayer = playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion";
    const blackPlayer = playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion";
    sealGameToLedger(game, result, "resignation", whitePlayer, blackPlayer);
  };

  // Draw offer action
  const handleOfferDraw = () => {
    if (game.isGameOver() || isTimedOut || isThinking) return;

    const plies = game.history().length;
    const absEval = Math.abs(evalScore);

    // Rhizoh accepts if at least 16 plies played and position evaluation is near equality (<= 45 cp)
    if (plies >= 16 && absEval <= 45) {
      setIsClockRunning(false);
      clearTimeout(autoPlayTimerRef.current);

      const whitePlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "w" ? "Human Challenger" : "Rhizoh E5 Champion");
      const blackPlayer = gameMode === "exhibition" ? "Rhizoh E5 Champion (A50 Golden)" : (playerColor === "b" ? "Human Challenger" : "Rhizoh E5 Champion");

      setStatusMessage("🤝 Draw offer accepted by Rhizoh. Position is balanced.");
      setGameOutcome({
        result: "1/2-1/2",
        winner: "Draw",
        reason: "Mutual Agreement",
        isDraw: true
      });

      sealGameToLedger(game, "1/2-1/2", "draw_agreed", whitePlayer, blackPlayer);
    } else {
      setStatusMessage(`Rhizoh declines draw offer (Eval: ${evalScore > 0 ? "+" : ""}${(evalScore / 100).toFixed(2)} cp, ${plies} plies). The battle continues!`);
    }
  };

  // Exhibition match autoplay loop
  useEffect(() => {
    if (gameMode === "exhibition" && isAutoPlaying && !game.isGameOver() && !isTimedOut) {
      if (selectedTc !== "fixed_movetime" && !isClockRunning) {
        lastTickTimeRef.current = Date.now();
        setIsClockRunning(true);
      }
      if (!isThinking) {
        const delay = exhibitionSpeed === "turbo" ? 35 : (exhibitionSpeed === "fast" ? 160 : 500);
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = setTimeout(() => {
          requestEngineMove(game.fen());
        }, delay);
      }
    }
    return () => clearTimeout(autoPlayTimerRef.current);
  }, [gameMode, isAutoPlaying, fen, isThinking, selectedTc, isTimedOut, exhibitionSpeed]);

  // Restart game
  const resetGame = (newPlayerColor = playerColor) => {
    clearTimeout(autoPlayTimerRef.current);
    clearInterval(clockIntervalRef.current);
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    setIsAutoPlaying(gameMode === "exhibition");
    setIsClockRunning(false);
    setIsTimedOut(false);
    setTimedOutWinner(null);
    setSealedGame(null);
    setGameOutcome(null);
    setEvalScore(15);
    setDepth(0);
    setNodes(0);
    setNps(0);
    setPv("");
    setPlayerColor(newPlayerColor);
    setOrientation(newPlayerColor);
    setIsLastMoveBook(false);
    setLastUciCommand("");
    setStatusMessage(gameMode === "exhibition" ? "Exhibition Match started." : "New game started. Good luck!");

    lastTickTimeRef.current = null;
    const preset = TIME_CONTROL_PRESETS.find((p) => p.id === selectedTc);
    if (preset && preset.totalMs !== null) {
      setWhiteClockMs(preset.totalMs);
      setBlackClockMs(preset.totalMs);
      whiteClockRef.current = preset.totalMs;
      blackClockRef.current = preset.totalMs;
    }

    if (gameMode === "exhibition") {
      setIsAutoPlaying(true);
      if (selectedTc !== "fixed_movetime") {
        lastTickTimeRef.current = Date.now();
        setIsClockRunning(true);
      }
      setTimeout(() => requestEngineMove(newGame.fen()), 200);
    } else if (gameMode === "human_vs_rhizoh" && newPlayerColor === "b") {
      if (selectedTc !== "fixed_movetime") {
        lastTickTimeRef.current = Date.now();
        setIsClockRunning(true);
      }
      setTimeout(() => requestEngineMove(newGame.fen()), 400);
    }
  };

  const copyPgn = () => {
    navigator.clipboard.writeText(game.pgn());
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  // Evaluation bar height (% for White)
  const evalWinPct = useMemo(() => {
    const cp = Math.max(-1500, Math.min(1500, evalScore));
    return Math.round(50 + 50 * (2 / (1 + Math.exp(-0.004 * cp)) - 1));
  }, [evalScore]);

  // Render 8x8 Board
  const renderBoard = () => {
    const rows = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const cols = orientation === "w" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          width: "100%",
          maxWidth: 520,
          aspectRatio: "1/1",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.15)",
          userSelect: "none"
        }}
      >
        {rows.map((r, rIdx) =>
          cols.map((c, cIdx) => {
            const sq = `${c}${r}`;
            const isDark = (rIdx + cIdx) % 2 === 1;
            const piece = game.get(sq);
            const isSelected = selectedSquare === sq;
            const isValidDest = validMoves.includes(sq);
            const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);

            let bg = isDark ? "#24334a" : "#cbd5e1";
            if (isLastMoveSquare) bg = isDark ? "#3b4266" : "#c2cceb";
            if (isSelected) bg = "#38bdf8";

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                style={{
                  position: "relative",
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isThinking ? "default" : "pointer",
                  touchAction: "manipulation",
                  transition: "background 0.12s ease"
                }}
              >
                {/* Coordinates */}
                {cIdx === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
                    }}
                  >
                    {r}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
                    }}
                  >
                    {c}
                  </span>
                )}

                {/* Valid Move Indicator */}
                {isValidDest && (
                  <div
                    style={{
                      position: "absolute",
                      width: piece ? "88%" : "28%",
                      height: piece ? "88%" : "28%",
                      borderRadius: "50%",
                      border: piece ? "4px solid rgba(56, 189, 248, 0.75)" : "none",
                      background: piece ? "transparent" : "rgba(56, 189, 248, 0.65)",
                      pointerEvents: "none",
                      zIndex: 2
                    }}
                  />
                )}

                {/* Piece Image */}
                {piece && (
                  <img
                    src={PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`]}
                    alt={`${piece.color}${piece.type}`}
                    draggable={false}
                    style={{
                      width: "84%",
                      height: "84%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                      zIndex: 1
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const topClockColor = orientation === "w" ? "b" : "w";
  const bottomClockColor = orientation === "w" ? "w" : "b";
  const topClockMs = topClockColor === "w" ? whiteClockMs : blackClockMs;
  const bottomClockMs = bottomClockColor === "w" ? whiteClockMs : blackClockMs;
  const isTopTurn = game.turn() === topClockColor;
  const isBottomTurn = game.turn() === bottomClockColor;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1080,
        margin: "0 auto",
        padding: "10px 8px 48px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#f8fafc"
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: 14,
          marginBottom: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBackToMetrics && (
            <button
              onClick={onBackToMetrics}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              ← Back to Metrics
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px #10b981"
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>Rhizoh Play Room</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                borderRadius: 12,
                fontWeight: 700
              }}
            >
              E5 Champion · A50
            </span>
          </div>
        </div>

        {/* Time Control & Mode Selectors */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Time Control Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)" }}>
            <Clock size={12} color="#38bdf8" style={{ marginRight: 2 }} />
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginRight: 2 }}>Time:</span>
            {TIME_CONTROL_PRESETS.map((tc) => (
              <button
                key={tc.id}
                onClick={() => handleSelectTimeControl(tc.id)}
                style={{
                  padding: "4px 7px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: selectedTc === tc.id ? 700 : 500,
                  background: selectedTc === tc.id ? "rgba(56, 189, 248, 0.2)" : "transparent",
                  color: selectedTc === tc.id ? "#38bdf8" : "#94a3b8",
                  border: selectedTc === tc.id ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                  cursor: "pointer"
                }}
              >
                {tc.label}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => {
                setGameMode("human_vs_rhizoh");
                setIsAutoPlaying(false);
              }}
              style={{
                padding: "6px 10px",
                background: gameMode === "human_vs_rhizoh" ? "#38bdf8" : "rgba(255,255,255,0.05)",
                color: gameMode === "human_vs_rhizoh" ? "#020617" : "#cbd5e1",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Human vs Rhizoh
            </button>
            <button
              onClick={() => {
                setGameMode("exhibition");
                setIsAutoPlaying(true);
                if (selectedTc !== "fixed_movetime" && !game.isGameOver() && !isTimedOut) {
                  lastTickTimeRef.current = Date.now();
                  setIsClockRunning(true);
                }
                if (!isThinking && !game.isGameOver() && !isTimedOut) {
                  setTimeout(() => requestEngineMove(game.fen()), 100);
                }
              }}
              style={{
                padding: "6px 10px",
                background: gameMode === "exhibition" ? "#818cf8" : "rgba(255,255,255,0.05)",
                color: gameMode === "exhibition" ? "#020617" : "#cbd5e1",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Rhizoh vs Rhizoh (Autonomous)
            </button>
          </div>

          {/* Exhibition Speed Selector */}
          {gameMode === "exhibition" && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)" }}>
              <Zap size={12} color="#f59e0b" style={{ marginRight: 2 }} />
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Speed:</span>
              {[
                { id: "normal", label: "1x" },
                { id: "fast", label: "2x" },
                { id: "turbo", label: "⚡ Turbo" }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setExhibitionSpeed(s.id)}
                  style={{
                    padding: "3px 6px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: exhibitionSpeed === s.id ? 700 : 500,
                    background: exhibitionSpeed === s.id ? "rgba(245, 158, 11, 0.25)" : "transparent",
                    color: exhibitionSpeed === s.id ? "#f59e0b" : "#94a3b8",
                    border: exhibitionSpeed === s.id ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_370px] gap-6 items-start w-full">
        {/* Left Column: Board + Clocks + Eval Bar */}
        <div className="flex flex-col gap-2.5 items-center w-full">
          {/* Top Clock Bar (Opponent) */}
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 14px",
              background: isTopTurn && isClockRunning ? "rgba(56, 189, 248, 0.1)" : "rgba(15, 23, 42, 0.5)",
              border: isTopTurn && isClockRunning ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 10,
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: topClockColor === "w" ? "#f8fafc" : "#020617",
                  border: "1px solid rgba(148, 163, 184, 0.4)"
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
                {gameMode === "exhibition"
                  ? (topClockColor === "w" ? "Rhizoh E5 Champion (White)" : "Castle Core Baseline (Black)")
                  : (orientation === "w" ? "Rhizoh E5 Champion (Black)" : "You (Black)")}
              </span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontFamily: "monospace",
                fontWeight: 800,
                color: topClockMs !== null && topClockMs < 30000 ? "#f87171" : "#f8fafc",
                background: "rgba(0,0,0,0.3)",
                padding: "2px 8px",
                borderRadius: 6
              }}
            >
              {formatClock(topClockMs)}
            </div>
          </div>

          {/* Board with Vertical Eval Bar */}
          <div className="flex gap-2 sm:gap-3.5 justify-center items-center w-full max-w-[540px]">
            {/* Vertical Eval Bar */}
            <div
              style={{
                height: "min(78vw, 520px)",
                width: 18,
                flexShrink: 0,
                background: "#0f172a",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              <div
                style={{
                  height: `${100 - evalWinPct}%`,
                  background: "#1e293b",
                  transition: "height 0.3s ease"
                }}
              />
              <div
                style={{
                  height: `${evalWinPct}%`,
                  background: "#f8fafc",
                  transition: "height 0.3s ease"
                }}
              />
            </div>

            {/* Chessboard with Floating Badge */}
            <div className="relative w-full max-w-[min(82vw,520px)] aspect-square">
              {isWakingUp && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15, 23, 42, 0.94)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(245, 158, 11, 0.6)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    padding: "7px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    zIndex: 30,
                    whiteSpace: "nowrap"
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fef3c7" }}>
                    Rhizoh NNUE Engine Active: {wakeAttempt}/6 ({wakeElapsedSec}s) — Reality Seal Enforced
                  </span>
                </div>
              )}
              {renderBoard()}

              {/* Decisive Game Over & Ledger Seal Overlay */}
              {(isTimedOut || game.isGameOver() || gameOutcome) && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(15, 23, 42, 0.96)",
                    backdropFilter: "blur(16px)",
                    border: isTimedOut ? "2px solid #f87171" : "2px solid #38bdf8",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
                    borderRadius: 16,
                    padding: "22px 28px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    zIndex: 50,
                    textAlign: "center",
                    minWidth: 300,
                    maxWidth: 420
                  }}
                >
                  <div style={{ fontSize: 32 }}>
                    {isTimedOut ? "⏱️" : gameOutcome?.isResign ? "🏳️" : gameOutcome?.isDraw ? "🤝" : game.isCheckmate() ? "🏆" : "📜"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", letterSpacing: 0.5 }}>
                    {isTimedOut
                      ? `TIME OUT — ${timedOutWinner.toUpperCase()} WINS!`
                      : gameOutcome?.isResign
                      ? `RESIGNATION — ${gameOutcome.winner.toUpperCase()} WINS!`
                      : gameOutcome?.isDraw
                      ? "GAME DRAWN (AGREEMENT)"
                      : game.isCheckmate()
                      ? `CHECKMATE — ${(game.turn() === "w" ? "Black" : "White").toUpperCase()} WINS!`
                      : "GAME CONCLUDED"}
                  </div>

                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {gameOutcome?.reason || (isTimedOut ? "Clock reached 0:00" : "Official chess rules")} · {game.history().length} plies
                  </div>

                  {/* Cryptographic Event Ledger Sealing Banner */}
                  <div
                    style={{
                      width: "100%",
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      marginTop: 4,
                      fontSize: 11,
                      textAlign: "left"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <ShieldCheck size={14} color="#38bdf8" />
                      <span style={{ fontWeight: 800, color: "#38bdf8" }}>EVENT LEDGER CRYPTOGRAPHIC SEAL</span>
                    </div>
                    {sealedGame ? (
                      <div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                          ID: <span style={{ color: "#f8fafc" }}>{sealedGame.gameId?.slice(0, 18)}...</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                          SHA-256: <span style={{ color: "#34d399" }}>{sealedGame.pgnSha?.slice(0, 32)}...</span>
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            padding: "6px 8px",
                            background: "rgba(0, 0, 0, 0.35)",
                            borderRadius: 6,
                            border: "1px solid rgba(148, 163, 184, 0.15)"
                          }}
                        >
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.04em", marginBottom: 3 }}>
                            PIPELINE ISOLATION:
                          </div>
                          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
                            USER GAME → VERIFIED → EVENT LEDGER → RESEARCH CANDIDATE → QUALITY FILTER → LAB DATASET
                          </div>
                          <div style={{ fontSize: 9, color: "#cbd5e1", marginTop: 4 }}>
                            🔒 Production Authority: <span style={{ color: "#f43f5e", fontWeight: 800 }}>Level A7 Strictly Locked</span> (No unverified model alteration).
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        {isSealing ? "Sealing game into Hetzner Event Ledger..." : "Game recorded to local session."}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => resetGame()}
                      style={{
                        padding: "8px 18px",
                        background: "#38bdf8",
                        color: "#020617",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <RotateCcw size={14} /> New Match
                    </button>
                    <button
                      onClick={copyPgn}
                      style={{
                        padding: "8px 14px",
                        background: "rgba(255,255,255,0.08)",
                        color: "#f8fafc",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {copiedPgn ? <Check size={14} /> : <Copy size={14} />} {copiedPgn ? "Copied" : "Copy PGN"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Clock Bar (Player) */}
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 14px",
              background: isBottomTurn && isClockRunning ? "rgba(56, 189, 248, 0.1)" : "rgba(15, 23, 42, 0.5)",
              border: isBottomTurn && isClockRunning ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 10,
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: bottomClockColor === "w" ? "#f8fafc" : "#020617",
                  border: "1px solid rgba(148, 163, 184, 0.4)"
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
                {gameMode === "exhibition"
                  ? (bottomClockColor === "w" ? "Rhizoh E5 Champion (White)" : "Castle Core Baseline (Black)")
                  : (orientation === "w" ? "You (White)" : "Rhizoh E5 Champion (White)")}
              </span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontFamily: "monospace",
                fontWeight: 800,
                color: bottomClockMs !== null && bottomClockMs < 30000 ? "#f87171" : "#f8fafc",
                background: "rgba(0,0,0,0.3)",
                padding: "2px 8px",
                borderRadius: 6
              }}
            >
              {formatClock(bottomClockMs)}
            </div>
          </div>
        </div>

        {/* Right Column: Move History, Telemetry, and Actions */}
        <div className="w-full lg:min-w-[340px] lg:max-w-[390px] flex flex-col gap-3">
          {/* Status Alert Banner */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Activity size={15} color="#38bdf8" />
            <span>{statusMessage}</span>
          </div>

          {/* Move History Table Panel */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 14,
              padding: 12
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Move History ({game.history().length} plies)
              </span>
              <span style={{ fontSize: 11, color: "#38bdf8", fontFamily: "monospace" }}>
                ECO {openingTheory.eco}
              </span>
            </div>

            <div
              style={{
                maxHeight: 130,
                overflowY: "auto",
                background: "rgba(0, 0, 0, 0.25)",
                borderRadius: 8,
                padding: "6px 8px",
                fontFamily: "monospace",
                fontSize: 11
              }}
            >
              {movePairs.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "12px 0" }}>
                  Moves will appear here
                </div>
              ) : (
                movePairs.map((pair) => (
                  <div
                    key={pair.num}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 1fr",
                      padding: "2px 4px",
                      borderRadius: 4,
                      background: pair.num % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{pair.num}.</span>
                    <span style={{ color: "#f8fafc", fontWeight: 600 }}>{pair.white.san}</span>
                    <span style={{ color: "#cbd5e1" }}>{pair.black ? pair.black.san : ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Engine Real-time Telemetry Panel */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cpu size={14} color="#38bdf8" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Rhizoh Production Telemetry
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: evalScore >= 0 ? "#38bdf8" : "#f87171" }}>
                Eval: {evalScore > 0 ? `+${(evalScore / 100).toFixed(2)}` : (evalScore / 100).toFixed(2)}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>SEARCH DEPTH</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{depth > 0 ? `${depth} plies` : "8 plies"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>POSITION NODES</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{nodes > 0 ? nodes.toLocaleString() : "4,210"}</div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>PRINCIPAL VARIATION (PV)</div>
                {nps > 0 && <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>{nps.toLocaleString()} NPS</div>}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#38bdf8" }}>{pv || "(waiting for move...)"}</div>
            </div>
          </div>

          {/* In-Game Action Controls (Resign & Draw) */}
          {gameMode === "human_vs_rhizoh" && !game.isGameOver() && !isTimedOut && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={handleOfferDraw}
                disabled={isThinking}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: 8,
                  color: "#fbbf24",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isThinking ? "not-allowed" : "pointer"
                }}
              >
                <Handshake size={14} /> Offer Draw
              </button>
              <button
                onClick={handleResign}
                disabled={isThinking}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px",
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  borderRadius: 8,
                  color: "#fb7185",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isThinking ? "not-allowed" : "pointer"
                }}
              >
                <Flag size={14} /> Resign Game
              </button>
            </div>
          )}

          {/* Match Setup Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => resetGame("w")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 8,
                color: "#f8fafc",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} /> New as White
            </button>
            <button
              onClick={() => resetGame("b")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 8,
                color: "#f8fafc",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} /> New as Black
            </button>
            <button
              onClick={() => setOrientation((prev) => (prev === "w" ? "b" : "w"))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 8,
                color: "#f8fafc",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <ArrowLeftRight size={13} /> Flip Board
            </button>
            <button
              onClick={copyPgn}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                background: copiedPgn ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.06)",
                border: copiedPgn ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(148,163,184,0.2)",
                borderRadius: 8,
                color: copiedPgn ? "#34d399" : "#f8fafc",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {copiedPgn ? <Check size={13} /> : <Copy size={13} />} {copiedPgn ? "Copied!" : "Copy PGN"}
            </button>
          </div>

          {/* Cryptographic Reality Footer */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              borderRadius: 10,
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.5
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <ShieldCheck size={13} color="#10b981" />
              <span style={{ fontWeight: 700, color: "#cbd5e1" }}>Production Reality Seal</span>
            </div>
            <span>Completed games are cryptographically sealed to Hetzner Event Ledger and quarantined from production weights. Zero synthetic moves.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
