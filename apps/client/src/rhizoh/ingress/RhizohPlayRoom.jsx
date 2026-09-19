import React, { useState, useEffect, useRef, useMemo } from "react";
import { Chess } from "chess.js";
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
  Zap
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
  const [engineSpeedMs, setEngineSpeedMs] = useState(600); // 400ms (Fast) | 800ms (Standard) | 1400ms (Deep)
  const [evalScore, setEvalScore] = useState(0); // in centipawns (+ for White)
  const [depth, setDepth] = useState(0);
  const [nodes, setNodes] = useState(0);
  const [nps, setNps] = useState(0);
  const [pv, setPv] = useState("");
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Game started. Your turn!");
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [wakeAttempt, setWakeAttempt] = useState(0);
  const [wakeElapsedSec, setWakeElapsedSec] = useState(0);

  const autoPlayTimerRef = useRef(null);
  const wakeTimerRef = useRef(null);

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

  // Request engine move from gateway with transparent retry and ZERO fake moves
  const requestEngineMove = async (currentFen) => {
    setIsThinking(true);
    setIsWakingUp(false);
    setWakeAttempt(0);
    setWakeElapsedSec(0);
    clearInterval(wakeTimerRef.current);

    const startTime = Date.now();

    // Extract complete move history in UCI format to enable engine repetition avoidance
    const uciMoves = game.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ""));

    const candidateEndpoints = [
      "https://castle-genesis-rhizoh-habitatos.onrender.com/api/chess/move",
      "/api/gatewayProxy/api/chess/move",
      "/api/chess/move",
      "http://localhost:8090/api/chess/move"
    ];

    const maxRetries = 8;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setWakeAttempt(attempt);

      if (attempt === 1) {
        setStatusMessage(`Rhizoh HCE calculating (${engineSpeedMs}ms, depth ~7p)...`);
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
          const timeoutId = setTimeout(() => controller.abort(), 16000);

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: currentFen,
              moves: uciMoves,
              movetime: engineSpeedMs
            }),
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
                data.wallTimeMs
              );
              return;
            }
          }
        } catch {
          // Endpoint timed out or unreachable, try next candidate or retry
        }
      }
    }

    // Absolutely NO fake moves! The board state is preserved honestly.
    clearInterval(wakeTimerRef.current);
    setIsWakingUp(false);
    setIsThinking(false);
    setStatusMessage("⚠️ Rhizoh Engine Gateway Unreachable. Please ensure the backend is active and retry.");
  };

  const applyEngineMove = (moveUci, evalCp = 0, currentDepth = 8, realNodes = 0, currentPv = "", realNps = 0, wallTime = 400) => {
    try {
      let move = null;
      if (typeof moveUci === "string") {
        const clean = moveUci.trim();
        // Try standard UCI (e.g. e2e4, e7e8q, e1g1)
        if (clean.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(clean)) {
          const from = clean.slice(0, 2);
          const to = clean.slice(2, 4);
          const promotion = clean.length > 4 ? clean[4].toLowerCase() : undefined;
          try {
            move = game.move({ from, to, ...(promotion ? { promotion } : {}) });
          } catch {}
        }
        // Fallback: try as SAN string (e.g. O-O, Nf3)
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
      setStatusMessage(`Checkmate! ${winner} wins.`);
      setIsAutoPlaying(false);
    } else if (game.isDraw()) {
      setStatusMessage("Game drawn (Stalemate / 3-fold repetition / 50-move rule).");
      setIsAutoPlaying(false);
    } else if (game.inCheck()) {
      setStatusMessage("Check!");
    } else {
      setStatusMessage(game.turn() === playerColor ? "Your turn!" : "Rhizoh is thinking...");
    }
  };

  // Handle human click move
  const handleSquareClick = (square) => {
    if (isThinking || game.isGameOver()) return;
    if (gameMode === "human_vs_rhizoh" && game.turn() !== playerColor) return;

    const piece = game.get(square);

    // 1. If clicking the already selected piece, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // 2. If clicking another piece of the player's own color, switch selection seamlessly
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }).map((m) => m.to);
      setValidMoves(moves);
      return;
    }

    // 3. If a piece was selected and clicking a destination square
    if (selectedSquare) {
      if (validMoves.includes(square)) {
        try {
          const selectedPiece = game.get(selectedSquare);
          const isPromotion = selectedPiece?.type === "p" && (square.endsWith("8") || square.endsWith("1"));

          const move = game.move({
            from: selectedSquare,
            to: square,
            ...(isPromotion ? { promotion: "q" } : {})
          });

          if (move) {
            const nextFen = game.fen();
            setFen(nextFen);
            setHistory(game.history({ verbose: true }));
            setLastMove({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setValidMoves([]);
            checkGameOver();

            // Trigger Rhizoh response
            if (!game.isGameOver() && gameMode === "human_vs_rhizoh") {
              requestEngineMove(nextFen);
            }
            return;
          }
        } catch (err) {
          console.warn("Move execution error:", err);
        }
      }

      // If clicked destination is invalid or move was illegal, safely reset selection without throwing
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Auto-play loop for Exhibition matches
  useEffect(() => {
    if (gameMode === "exhibition" && isAutoPlaying && !game.isGameOver() && !isThinking) {
      autoPlayTimerRef.current = setTimeout(() => {
        requestEngineMove(game.fen());
      }, 500);
    }
    return () => clearTimeout(autoPlayTimerRef.current);
  }, [gameMode, isAutoPlaying, fen, isThinking]);

  // Restart game
  const resetGame = (newPlayerColor = playerColor) => {
    clearTimeout(autoPlayTimerRef.current);
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    setIsAutoPlaying(false);
    setEvalScore(15);
    setPlayerColor(newPlayerColor);
    setOrientation(newPlayerColor);
    setStatusMessage("New game started. Good luck!");

    if (gameMode === "human_vs_rhizoh" && newPlayerColor === "b") {
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

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 20px",
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: 16,
          marginBottom: 24
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBackToMetrics}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 10,
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ← Back to Overview
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
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

        {/* Depth / Speed & Mode Controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Depth / Thinking Speed */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginRight: 4 }}>Depth:</span>
            {[
              { label: "Fast (~5p)", ms: 400 },
              { label: "Standard (~7p)", ms: 800 },
              { label: "Deep (~9p)", ms: 1400 }
            ].map(lvl => (
              <button
                key={lvl.ms}
                onClick={() => setEngineSpeedMs(lvl.ms)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: engineSpeedMs === lvl.ms ? 700 : 500,
                  background: engineSpeedMs === lvl.ms ? "rgba(56, 189, 248, 0.2)" : "transparent",
                  color: engineSpeedMs === lvl.ms ? "#38bdf8" : "#94a3b8",
                  border: engineSpeedMs === lvl.ms ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                  cursor: "pointer"
                }}
              >
                {lvl.label}
              </button>
            ))}
          </div>

        {/* Mode Selector */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setGameMode("human_vs_rhizoh");
              setIsAutoPlaying(false);
            }}
            style={{
              padding: "7px 12px",
              background: gameMode === "human_vs_rhizoh" ? "#38bdf8" : "rgba(255,255,255,0.05)",
              color: gameMode === "human_vs_rhizoh" ? "#020617" : "#cbd5e1",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 8,
              fontSize: 12,
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
            }}
            style={{
              padding: "7px 12px",
              background: gameMode === "exhibition" ? "#818cf8" : "rgba(255,255,255,0.05)",
              color: gameMode === "exhibition" ? "#020617" : "#cbd5e1",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Exhibition Match
          </button>
        </div>
      </div>
    </div>

      {/* Main Play Area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
        {/* Left Column: Board + Eval Bar */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
          {/* Vertical Eval Bar */}
          <div
            style={{
              width: 24,
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
          </div>
        </div>

        {/* Right Column: Telemetry & Controls */}
        <div style={{ minWidth: 320, maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status Panel */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Game Status
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: evalScore >= 0 ? "#38bdf8" : "#f87171"
                }}
              >
                Eval: {evalScore > 0 ? `+${(evalScore / 100).toFixed(2)}` : (evalScore / 100).toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isWakingUp ? "#f59e0b" : "#f8fafc", marginBottom: isWakingUp ? 6 : 12 }}>
              {statusMessage}
            </div>

            {/* Cold-Start Progress Bar */}
            {isWakingUp && (
              <div style={{ marginBottom: 12, background: "rgba(255,255,255,0.04)", padding: 8, borderRadius: 8, border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#f59e0b", marginBottom: 4 }}>
                  <span>Waking Cloud Container...</span>
                  <span style={{ fontWeight: 700 }}>{wakeAttempt}/8 ({wakeElapsedSec}s)</span>
                </div>
                <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(wakeAttempt / 8) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #f59e0b, #38bdf8)",
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Manual Retry Button if Unreachable */}
            {statusMessage.includes("Unreachable") && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => requestEngineMove(game.fen())}
                  style={{
                    padding: "6px 14px",
                    background: "#38bdf8",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <RotateCcw size={13} />
                  Retry Engine Connection
                </button>
              </div>
            )}

            {/* Material Balance Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#94a3b8" }}>
              <span>White: {materialBalance.balance > 0 ? `+${materialBalance.balance}` : "0"}</span>
              <span>Black: {materialBalance.balance < 0 ? `+${Math.abs(materialBalance.balance)}` : "0"}</span>
            </div>
          </div>

          {/* Engine Real-time Telemetry Panel */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Cpu size={14} color="#38bdf8" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Rhizoh HCE Engine Telemetry
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>SEARCH DEPTH</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>{depth > 0 ? `${depth} plies` : "—"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>POSITION NODES</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>{nodes > 0 ? nodes.toLocaleString() : "—"}</div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>PRINCIPAL VARIATION (PV)</div>
                {nps > 0 && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>{nps.toLocaleString()} NPS</div>}
              </div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#38bdf8" }}>{pv || "(waiting for move...)"}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={() => resetGame("w")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 10,
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={14} /> New as White
            </button>
            <button
              onClick={() => resetGame("b")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 10,
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={14} /> New as Black
            </button>
            <button
              onClick={() => setOrientation((prev) => (prev === "w" ? "b" : "w"))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 10,
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <ArrowLeftRight size={14} /> Flip Board
            </button>
            <button
              onClick={copyPgn}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px",
                background: copiedPgn ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.06)",
                border: copiedPgn ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(148,163,184,0.2)",
                borderRadius: 10,
                color: copiedPgn ? "#34d399" : "#f8fafc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {copiedPgn ? <Check size={14} /> : <Copy size={14} />} {copiedPgn ? "Copied!" : "Copy PGN"}
            </button>
          </div>

          {/* Voice Narration Hook Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 12,
              fontSize: 11,
              color: "#a5b4fc"
            }}
          >
            <Volume2 size={16} />
            <span>Games are indexed for automated post-match voice commentary.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
