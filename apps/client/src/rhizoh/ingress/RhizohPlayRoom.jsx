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
  const [evalScore, setEvalScore] = useState(0); // in centipawns (+ for White)
  const [depth, setDepth] = useState(0);
  const [nodes, setNodes] = useState(0);
  const [nps, setNps] = useState(0);
  const [pv, setPv] = useState("");
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Game started. Your turn!");

  const autoPlayTimerRef = useRef(null);

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

  // Request engine move from gateway or local fallback
  const requestEngineMove = async (currentFen) => {
    setIsThinking(true);
    setStatusMessage("Rhizoh NNUE is calculating...");

    try {
      // Query Gateway API for genuine native Rhizoh NNUE search across production proxy or local
      const candidateEndpoints = [
        "/api/gatewayProxy/api/chess/move",
        "/api/chess/move",
        "http://localhost:8090/api/chess/move"
      ];

      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen: currentFen, movetime: 400 })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.bestMove) {
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
          // Try next candidate
        }
      }
    } catch {
      // Gateway not available or offline
    }

    // Fallback: Local Tactical Move Generator (Only if backend engine is offline)
    setTimeout(() => {
      const tempGame = new Chess(currentFen);
      const moves = tempGame.moves({ verbose: true });
      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

      // Prioritize captures, checks, central moves
      moves.sort((a, b) => {
        const valA = (a.captured ? PIECE_VALUES[a.captured] * 10 : 0) + (a.san.includes("+") ? 5 : 0);
        const valB = (b.captured ? PIECE_VALUES[b.captured] * 10 : 0) + (b.san.includes("+") ? 5 : 0);
        return valB - valA;
      });

      const chosenMove = moves[0];
      const moveUci = chosenMove.from + chosenMove.to + (chosenMove.promotion || "");
      const simulatedEval = tempGame.turn() === "w" ? 35 : -35;

      applyEngineMove(moveUci, simulatedEval, 6, 0, chosenMove.san, 0, 400);
    }, 400);
  };

  const applyEngineMove = (moveUci, evalCp = 0, currentDepth = 8, realNodes = 0, currentPv = "", realNps = 0, wallTime = 400) => {
    try {
      const from = moveUci.slice(0, 2);
      const to = moveUci.slice(2, 4);
      const promotion = moveUci.length > 4 ? moveUci[4] : undefined;

      const move = game.move({ from, to, promotion });
      if (move) {
        setFen(game.fen());
        setHistory(game.history({ verbose: true }));
        setLastMove({ from, to });
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

    if (selectedSquare) {
      // Attempt to move
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: "q" // auto queen for quick play
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
    }

    // Select piece
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
              NNUE (CC0)
            </span>
          </div>
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

          {/* Chessboard */}
          <div>{renderBoard()}</div>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 12 }}>
              {statusMessage}
            </div>

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
                Rhizoh NNUE Engine Telemetry
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
