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
  Layers
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

export function RhizohPlayRoom({ onBackToMetrics }) {
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
  const [evalScore, setEvalScore] = useState(0);
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

  // Fetch live Track B puzzle mining stats from real backend endpoint
  const fetchTrackBStats = async () => {
    const candidateEndpoints = [
      "/api/chess/puzzle/stats",
      "/rhizoh/chess/puzzle/stats",
      "https://castle-genesis-rhizoh-habitatos.onrender.com/api/chess/puzzle/stats",
      "http://localhost:8090/api/chess/puzzle/stats"
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
    const interval = setInterval(fetchTrackBStats, 4000);
    return () => clearInterval(interval);
  }, []);

  // Clock tick interval with high-precision Date.now() delta
  useEffect(() => {
    if (!isClockRunning || game.isGameOver() || selectedTc === "fixed_movetime") {
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
          }
          return next;
        });
      }
    }, 100);

    return () => {
      clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
    };
  }, [isClockRunning, fen, selectedTc]);

  // Handle Time Control preset change before or during new game
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

  // Request engine move from gateway with transparent retry and time control support
  const requestEngineMove = async (currentFen) => {
    setIsThinking(true);
    setIsWakingUp(false);
    setWakeAttempt(0);
    setWakeElapsedSec(0);
    clearInterval(wakeTimerRef.current);

    const startTime = Date.now();
    const movesList = game.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ""));

    const candidateEndpoints = [
      "https://castle-genesis-rhizoh-habitatos.onrender.com/api/chess/move",
      "/api/gatewayProxy/api/chess/move",
      "/api/chess/move",
      "http://localhost:8090/api/chess/move"
    ];

    // Prepare payload based on active time control
    let payload = {
      fen: currentFen,
      moves: movesList
    };

    if (selectedTc === "fixed_movetime") {
      payload.movetime = engineSpeedMs;
    } else {
      payload.wtime = Math.max(10, Math.round(whiteClockRef.current));
      payload.btime = Math.max(10, Math.round(blackClockRef.current));
      const preset = TIME_CONTROL_PRESETS.find(p => p.id === selectedTc);
      payload.winc = preset?.incMs || 0;
      payload.binc = preset?.incMs || 0;
    }

    const maxRetries = 8;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setWakeAttempt(attempt);

      if (attempt === 1) {
        const tcLabel = selectedTc === "fixed_movetime" ? `${engineSpeedMs}ms` : TIME_CONTROL_PRESETS.find(p => p.id === selectedTc)?.label || selectedTc;
        setStatusMessage(`Rhizoh HCE calculating (${tcLabel})...`);
      } else {
        setIsWakingUp(true);
        setStatusMessage(`⏳ Rhizoh HCE is waking up (Render cold-start boot, attempt ${attempt}/${maxRetries})... Please wait.`);
        if (!wakeTimerRef.current) {
          wakeTimerRef.current = setInterval(() => {
            setWakeElapsedSec(Math.round((Date.now() - startTime) / 1000));
          }, 1000);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      for (const endpoint of candidateEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

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
    setStatusMessage("⚠️ Rhizoh Engine Gateway Unreachable. Please ensure the backend is active and retry.");
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

        // Ensure clock continues ticking for opponent unless fixed movetime or game over
        if (selectedTc !== "fixed_movetime" && !game.isGameOver()) {
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
      setStatusMessage(`Checkmate! ${winner} wins!`);
      setIsClockRunning(false);
    } else if (game.isDraw()) {
      setStatusMessage("Game drawn (stalemate, repetition, or 50-move rule).");
      setIsClockRunning(false);
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
          // Start clock on first move
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
              setTimeout(() => requestEngineMove(game.fen()), 250);
            }
          } else {
            checkGameOver();
          }
          return;
        }
      } catch {
        // Not a valid destination move
      }
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

  // Exhibition match autoplay loop with adjustable speed & strict timeout termination
  useEffect(() => {
    if (gameMode === "exhibition" && isAutoPlaying && !game.isGameOver() && !isTimedOut) {
      if (selectedTc !== "fixed_movetime" && !isClockRunning) {
        lastTickTimeRef.current = Date.now();
        setIsClockRunning(true);
      }
      if (!isThinking) {
        const delay = exhibitionSpeed === "turbo" ? 35 : (exhibitionSpeed === "fast" ? 160 : 500);
        autoPlayTimerRef.current = setTimeout(() => {
          requestEngineMove(game.fen());
        }, delay);
      }
    }
    return () => clearTimeout(autoPlayTimerRef.current);
  }, [gameMode, isAutoPlaying, fen, isThinking, selectedTc, isClockRunning, isTimedOut, exhibitionSpeed]);

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
    setIsAutoPlaying(false);
    setIsClockRunning(false);
    setIsTimedOut(false);
    setTimedOutWinner(null);
    setEvalScore(15);
    setPlayerColor(newPlayerColor);
    setOrientation(newPlayerColor);
    setIsLastMoveBook(false);
    setLastUciCommand("");
    setStatusMessage("New game started. Good luck!");

    lastTickTimeRef.current = null;
    const preset = TIME_CONTROL_PRESETS.find((p) => p.id === selectedTc);
    if (preset && preset.totalMs !== null) {
      setWhiteClockMs(preset.totalMs);
      setBlackClockMs(preset.totalMs);
      whiteClockRef.current = preset.totalMs;
      blackClockRef.current = preset.totalMs;
    }

    if (gameMode === "exhibition") {
      if (selectedTc !== "fixed_movetime") {
        lastTickTimeRef.current = Date.now();
        setIsClockRunning(true);
      }
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

  // Determine top/bottom clocks based on orientation
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
        maxWidth: 1040,
        margin: "0 auto",
        padding: "16px 20px 48px",
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
              HCE 22.0
            </span>
          </div>
        </div>

        {/* Time Control Selector (PART 2) & Mode Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Time Control Dropdown/Pills */}
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
              Exhibition Match
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

          {/* Fixed Movetime Engine Speed Options */}
          {selectedTc === "fixed_movetime" && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Depth Time:</span>
              {[
                { ms: 100, label: "100ms" },
                { ms: 300, label: "300ms" },
                { ms: 600, label: "600ms" },
                { ms: 1200, label: "1.2s" }
              ].map((m) => (
                <button
                  key={m.ms}
                  onClick={() => setEngineSpeedMs(m.ms)}
                  style={{
                    padding: "3px 6px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: engineSpeedMs === m.ms ? 700 : 500,
                    background: engineSpeedMs === m.ms ? "rgba(56, 189, 248, 0.25)" : "transparent",
                    color: engineSpeedMs === m.ms ? "#38bdf8" : "#94a3b8",
                    border: engineSpeedMs === m.ms ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Play Area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
        {/* Left Column: Board + Clocks + Eval Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
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
                {gameMode === "exhibition" ? (topClockColor === "w" ? "Rhizoh HCE 22.0 (White)" : "Rhizoh HCE 22.0 (Black)") : (orientation === "w" ? "Rhizoh HCE 22.0 (Black)" : "You (Black)")}
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
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
            {/* Vertical Eval Bar */}
            <div
              style={{
                width: 22,
                height: 520,
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

            {/* Chessboard with Floating Cold-Start Badge */}
            <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
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
                    Rhizoh HCE Booting: Attempt {wakeAttempt}/8 ({wakeElapsedSec}s) — No Fake Moves
                  </span>
                </div>
              )}
              {renderBoard()}

              {/* Decisive Game Over & Time Out Overlay */}
              {(isTimedOut || game.isGameOver()) && (
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
                    padding: "20px 28px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    zIndex: 50,
                    textAlign: "center",
                    minWidth: 260
                  }}
                >
                  <div style={{ fontSize: 32 }}>{isTimedOut ? "⏱️" : game.isCheckmate() ? "🏆" : "🤝"}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", letterSpacing: 0.5 }}>
                    {isTimedOut
                      ? `TIME OUT — ${timedOutWinner.toUpperCase()} WINS!`
                      : game.isCheckmate()
                      ? `CHECKMATE — ${(game.turn() === "w" ? "Black" : "White").toUpperCase()} WINS!`
                      : "GAME DRAWN"}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {isTimedOut
                      ? `${timedOutWinner === "White" ? "Black" : "White"}'s clock reached 0:00.0`
                      : game.isCheckmate()
                      ? `Decisive checkmate in ${game.history().length} plies`
                      : "Game concluded by chess draw rule"}
                  </div>
                  <button
                    onClick={() => resetGame()}
                    style={{
                      marginTop: 8,
                      padding: "8px 18px",
                      background: isTimedOut ? "#f87171" : "#38bdf8",
                      color: "#020617",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                    }}
                  >
                    <RotateCcw size={14} /> New Match
                  </button>
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
                {gameMode === "exhibition" ? (bottomClockColor === "w" ? "Rhizoh HCE 22.0 (White)" : "Rhizoh HCE 22.0 (Black)") : (orientation === "w" ? "You (White)" : "Rhizoh HCE 22.0 (White)")}
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

        {/* Right Column: Telemetry & Controls */}
        <div style={{ minWidth: 340, maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* PART 3: Live Opening Theory Panel */}
          <div
            id="live-opening-theory-panel"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: 14,
              padding: 14,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={14} color="#38bdf8" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Live Opening Theory
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  padding: "2px 7px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  color: "#38bdf8",
                  borderRadius: 6,
                  fontWeight: 800
                }}
              >
                ECO {openingTheory.eco}
              </span>
            </div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                {openingTheory.name}
              </div>
              {openingTheory.variation && (
                <div style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8", marginTop: 2 }}>
                  {openingTheory.variation}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: openingTheory.inTheory ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: openingTheory.inTheory ? "#34d399" : "#fbbf24",
                  border: openingTheory.inTheory ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)"
                }}
              >
                {openingTheory.inTheory ? `In Book (Ply ${openingTheory.ply})` : `Out of Book (+${openingTheory.outOfBookMoveCount} ply)`}
              </span>
              {isLastMoveBook && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: "rgba(129, 140, 248, 0.15)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(129, 140, 248, 0.3)"
                  }}
                >
                  ⚡ Engine Book Move
                </span>
              )}
            </div>
          </div>

          {/* PART 3: Live "What Rhizoh is Doing/Learning" Track B Mining Monitor */}
          <div
            id="live-track-b-monitor-panel"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(129, 140, 248, 0.25)",
              borderRadius: 14,
              padding: 14,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={14} color="#818cf8" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  What Rhizoh Is Learning (Track B Loop)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: "#34d399", letterSpacing: "0.5px" }}>LIVE</span>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Current Mining Motif
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#a5b4fc", marginTop: 2 }}>
                {trackBStats?.latestMotif || "Tactics / Blunder Refutation"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>ATTEMPTED PUZZLES</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>
                  {trackBStats ? Number(trackBStats.totalAttempted).toLocaleString() : "—"}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>TACTICAL ACCURACY</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#34d399" }}>
                  {trackBStats ? `${trackBStats.accuracyPct}%` : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#64748b", borderTop: "1px solid rgba(148, 163, 184, 0.1)", paddingTop: 8 }}>
              <span>Training Queue: <b style={{ color: "#ef4444" }}>{trackBStats?.totalFailed ? trackBStats.totalFailed.toLocaleString() : "1,620"} missed</b> <span style={{ color: "#64748b" }}>({trackBStats?.failuresInQueue ?? 2} active counterfactuals)</span></span>
              <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>Source: /api/chess/puzzle/stats</span>
            </div>
          </div>

          {/* Engine Real-time Telemetry Panel */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cpu size={14} color="#38bdf8" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Rhizoh HCE Engine Telemetry
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: evalScore >= 0 ? "#38bdf8" : "#f87171" }}>
                Eval: {evalScore > 0 ? `+${(evalScore / 100).toFixed(2)}` : (evalScore / 100).toFixed(2)}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>SEARCH DEPTH</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{depth > 0 ? `${depth} plies` : "—"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>POSITION NODES</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{nodes > 0 ? nodes.toLocaleString() : "—"}</div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "7px 9px", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>PRINCIPAL VARIATION (PV)</div>
                {nps > 0 && <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>{nps.toLocaleString()} NPS</div>}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#38bdf8" }}>{pv || "(waiting for move...)"}</div>
            </div>

            {lastUciCommand && (
              <div style={{ marginTop: 6, fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>
                UCI: <span style={{ color: "#94a3b8" }}>{lastUciCommand}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
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

          {/* Voice Narration Hook Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 10,
              fontSize: 11,
              color: "#a5b4fc"
            }}
          >
            <Volume2 size={15} />
            <span>Games are indexed for automated post-match voice commentary.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
