import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import {
  Brain,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ArrowLeft,
  Flame,
  Activity,
  History
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

export function RhizohPuzzleLab({ onBackToOverview }) {
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [solveState, setSolveState] = useState("idle"); // 'idle' | 'solving' | 'solved' | 'failed'
  const [engineMoveInfo, setEngineMoveInfo] = useState(null);
  const [stats, setStats] = useState({
    totalAttempted: 0,
    totalSolved: 0,
    totalFailed: 0,
    accuracyPct: 0,
    failuresInQueue: 0,
    datasetPoolSize: 9500
  });
  const [recentFailures, setRecentFailures] = useState([]);
  const [mode, setMode] = useState("auto"); // 'auto' (Rhizoh solves) | 'interactive' (user tries)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoSpeedMs, setAutoSpeedMs] = useState(1800);
  const [statusMessage, setStatusMessage] = useState("Taktik laboratuvarı hazır.");

  const autoTimerRef = useRef(null);

  // Load stats and next puzzle on mount
  useEffect(() => {
    fetchStatsAndHistory();
    fetchNextPuzzle();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const candidateBaseUrls = [
    "/api/gatewayProxy",
    "",
    "http://localhost:8090"
  ];

  const fetchWithFallback = async (endpoint, options = {}) => {
    for (const base of candidateBaseUrls) {
      try {
        const fullUrl = `${base}${endpoint}`;
        const res = await fetch(fullUrl, options);
        if (res.ok) return await res.json();
      } catch {}
    }
    return null;
  };

  const fetchStatsAndHistory = async () => {
    const data = await fetchWithFallback("/api/chess/puzzle/history");
    if (data?.ok) {
      if (data.stats) setStats(data.stats);
      if (data.failures) setRecentFailures(data.failures);
    }
  };

  const loadPuzzleIntoBoard = (puzzle) => {
    try {
      const g = new Chess(puzzle.fen);
      setGame(g);
      setCurrentPuzzle(puzzle);
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      setSolveState("idle");
      setEngineMoveInfo(null);
      setStatusMessage(`${puzzle.motif || "Taktik"} pozisyonu yüklendi. Sıra: ${g.turn() === "w" ? "Beyaz" : "Siyah"}`);
    } catch (err) {
      console.error("Failed to load puzzle FEN:", err);
    }
  };

  const fetchNextPuzzle = async (requestedId = null) => {
    setStatusMessage("Yeni puzzle yükleniyor...");
    const url = requestedId ? `/api/chess/puzzle/next?id=${encodeURIComponent(requestedId)}` : "/api/chess/puzzle/next";
    const data = await fetchWithFallback(url);
    if (data?.ok && data.puzzle) {
      loadPuzzleIntoBoard(data.puzzle);
    } else {
      // Fallback puzzle if server unreachable
      const fallback = {
        id: "Fallback.001",
        fen: "2r3k1/1p3ppp/p1q1p3/3p4/P2Pn3/1P2P3/3NQPPP/R5K1 b - - 0 1",
        bestMove: "c6c1",
        bestMoveSan: "Qc1+",
        bestMoveUci: "c6c1",
        motif: "BackRankSacrifice"
      };
      loadPuzzleIntoBoard(fallback);
    }
  };

  // Autonomous Engine Solver
  const triggerEngineSolve = async () => {
    if (!currentPuzzle || solveState === "solving") return;
    setSolveState("solving");
    setStatusMessage("Rhizoh HCE 22.0 pozisyonu inceliyor (400ms arama)...");

    const solvePayload = {
      puzzleId: currentPuzzle.id,
      fen: currentPuzzle.fen,
      bestMove: currentPuzzle.bestMoveSan || currentPuzzle.bestMove,
      motif: currentPuzzle.motif || "Tactics",
      movetime: 400
    };

    const data = await fetchWithFallback("/api/chess/puzzle/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(solvePayload)
    });

    if (data?.ok) {
      setEngineMoveInfo(data);
      if (data.stats) setStats(data.stats);

      // Play the engine's move on the board
      if (data.engineMove) {
        try {
          const moveFrom = data.engineMove.slice(0, 2);
          const moveTo = data.engineMove.slice(2, 4);
          const promo = data.engineMove.length > 4 ? data.engineMove[4] : undefined;
          const clonedGame = new Chess(game.fen());
          const played = clonedGame.move({ from: moveFrom, to: moveTo, promotion: promo });
          if (played) {
            setGame(clonedGame);
            setLastMove({ from: moveFrom, to: moveTo });
          }
        } catch {}
      }

      if (data.solved) {
        setSolveState("solved");
        setStatusMessage(`✅ Rhizoh taktiği doğru çözdü: ${data.engineMove}`);
      } else {
        setSolveState("failed");
        setStatusMessage(`❌ Rhizoh taktiği kaçırdı! Oynanan: ${data.engineMove || "Yok"} | Beklenen: ${data.expectedBestMove}`);
        fetchStatsAndHistory(); // Refresh failure list
      }
    } else {
      setSolveState("failed");
      setStatusMessage("Sunucu çözümü yanıtlamadı.");
    }
  };

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      return;
    }

    if (solveState === "idle" && currentPuzzle) {
      autoTimerRef.current = setTimeout(() => {
        triggerEngineSolve();
      }, 500);
    } else if (solveState === "solved" || solveState === "failed") {
      autoTimerRef.current = setTimeout(() => {
        fetchNextPuzzle();
      }, autoSpeedMs);
    }
  }, [isAutoPlaying, solveState, currentPuzzle, autoSpeedMs]);

  // Interactive User Move Handling
  const handleSquareClick = (sq) => {
    if (mode !== "interactive" || solveState === "solving") return;

    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      try {
        const clonedGame = new Chess(game.fen());
        const move = clonedGame.move({ from: selectedSquare, to: sq, promotion: "q" });
        if (move) {
          setGame(clonedGame);
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          setValidMoves([]);

          // Compare user move with bestMove
          const userUci = move.from + move.to + (move.promotion || "");
          const isCorrect = (
            userUci.toLowerCase() === (currentPuzzle?.bestMoveUci || "").toLowerCase() ||
            move.san.toLowerCase() === (currentPuzzle?.bestMoveSan || "").toLowerCase()
          );

          if (isCorrect) {
            setSolveState("solved");
            setStatusMessage(`🎉 Harika! Doğru taktik hamleyi buldun: ${move.san}`);
          } else {
            setSolveState("failed");
            setStatusMessage(`❌ Yanlış hamle! Senin hamlen: ${move.san} | Doğru hamle: ${currentPuzzle?.bestMoveSan || currentPuzzle?.bestMove}`);
          }
          return;
        }
      } catch {}
    }

    // Select piece
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq, verbose: true });
      setValidMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const renderBoard = () => {
    const rows = [8, 7, 6, 5, 4, 3, 2, 1];
    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          width: "100%",
          maxWidth: 480,
          aspectRatio: "1/1",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)",
          background: "#1e293b",
          userSelect: "none"
        }}
      >
        {rows.map((r, rIdx) =>
          cols.map((c, cIdx) => {
            const sq = `${c}${r}`;
            const piece = game.get(sq);
            const isDark = (rIdx + cIdx) % 2 === 1;
            const isSelected = selectedSquare === sq;
            const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isValidDest = validMoves.includes(sq);

            let bg = isDark ? "#475569" : "#94a3b8";
            if (isSelected) bg = "#3b82f6";
            else if (isLastMove) bg = isDark ? "#334155" : "#64748b";

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
                  cursor: mode === "interactive" ? "pointer" : "default",
                  transition: "background 0.12s ease"
                }}
              >
                {/* Board Notation */}
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
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px" }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 20px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: 16,
          marginBottom: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBackToOverview}
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
            <ArrowLeft size={14} /> Genel Bakışa Dön
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#38bdf8",
                boxShadow: "0 0 10px #38bdf8"
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
              Rhizoh Taktik & Kendini Düzeltme Laboratuvarı
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)"
              }}
            >
              HCE 22.0 Golden Baseline
            </span>
          </div>
        </div>

        {/* Mode Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => {
              setMode("auto");
              setIsAutoPlaying(false);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: mode === "auto" ? "#3b82f6" : "rgba(255,255,255,0.05)",
              color: mode === "auto" ? "#ffffff" : "#94a3b8",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              cursor: "pointer"
            }}
          >
            🤖 Rhizoh Çözsün
          </button>
          <button
            onClick={() => {
              setMode("interactive");
              setIsAutoPlaying(false);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: mode === "interactive" ? "#8b5cf6" : "rgba(255,255,255,0.05)",
              color: mode === "interactive" ? "#ffffff" : "#94a3b8",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              cursor: "pointer"
            }}
          >
            ♟️ Önce Sen Dene
          </button>
        </div>
      </div>

      {/* Main Layout: Board + Control Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 24
        }}
      >
        {/* Left Column: Board and Status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {renderBoard()}

          {/* Status Alert Banner */}
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              padding: "12px 16px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              fontWeight: 600,
              background:
                solveState === "solved"
                  ? "rgba(16, 185, 129, 0.15)"
                  : solveState === "failed"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(15, 23, 42, 0.6)",
              border: `1px solid ${
                solveState === "solved"
                  ? "rgba(16, 185, 129, 0.3)"
                  : solveState === "failed"
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(148, 163, 184, 0.15)"
              }`,
              color:
                solveState === "solved"
                  ? "#34d399"
                  : solveState === "failed"
                  ? "#f87171"
                  : "#94a3b8"
            }}
          >
            {solveState === "solved" ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : solveState === "failed" ? (
              <AlertTriangle size={18} color="#ef4444" />
            ) : (
              <Activity size={18} color="#38bdf8" />
            )}
            <span style={{ flex: 1 }}>{statusMessage}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480 }}>
            {mode === "auto" ? (
              <>
                <button
                  onClick={triggerEngineSolve}
                  disabled={solveState === "solving"}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#ffffff",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: solveState === "solving" ? "not-allowed" : "pointer"
                  }}
                >
                  <Cpu size={15} /> {solveState === "solving" ? "Hesaplanıyor..." : "Rhizoh Çözsün"}
                </button>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    background: isAutoPlaying ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    color: isAutoPlaying ? "#f87171" : "#34d399",
                    border: `1px solid ${isAutoPlaying ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isAutoPlaying ? <Pause size={15} /> : <Play size={15} />}
                  {isAutoPlaying ? "Durdur" : "Otomatik Akış"}
                </button>
              </>
            ) : (
              <button
                onClick={() => loadPuzzleIntoBoard(currentPuzzle)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#f8fafc",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  cursor: "pointer"
                }}
              >
                <RotateCcw size={15} /> Pozisyonu Sıfırla
              </button>
            )}

            <button
              onClick={() => fetchNextPuzzle()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#f8fafc",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid rgba(148, 163, 184, 0.2)",
                cursor: "pointer"
              }}
            >
              <SkipForward size={15} /> Sonraki Puzzle
            </button>
          </div>
        </div>

        {/* Right Column: Puzzle Metadata, Engine Telemetry & Learning Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Active Learning Overview Card */}
          <div
            style={{
              padding: "18px 20px",
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Brain size={18} color="#38bdf8" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
                  Aktif Öğrenme & Hata Madenciliği
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: "rgba(234, 179, 8, 0.15)",
                  color: "#facc15",
                  fontWeight: 700
                }}
              >
                Track B Besleyici
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Rhizoh, WAC 30 benchmark'ı dışındaki 9.500 puzzle'lık bağımsız taktik havuzundan pozisyon çözer.
              Modelin <strong>yanlış çözdüğü</strong> pozisyonlar anında <strong>hedefli eğitim havuzuna</strong> kaydedilir.
              Ay başı Hetzner GPU altyapısında eğitilecek yeni NNUE modeli, bu "en zor kaçırılan" örnekler üzerinden eğitilip yeniden test edilecektir.
            </p>
          </div>

          {/* Stats Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10
            }}
          >
            <div
              style={{
                padding: "14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: 12,
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Denenen</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{stats.totalAttempted}</div>
            </div>
            <div
              style={{
                padding: "14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: 12,
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Taktik Başarısı</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{stats.accuracyPct}%</div>
            </div>
            <div
              style={{
                padding: "14px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>Eğitim Havuzuna (Kaçırılan)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{stats.totalFailed}</div>
            </div>
          </div>

          {/* Current Puzzle Info Card */}
          {currentPuzzle && (
            <div
              style={{
                padding: "16px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: 14
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{currentPuzzle.id}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#c084fc",
                    border: "1px solid rgba(139, 92, 246, 0.3)"
                  }}
                >
                  Motif: {currentPuzzle.motif}
                </span>
              </div>

              {engineMoveInfo && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(148, 163, 184, 0.1)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Derinlik</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{engineMoveInfo.depth} ply</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Düğüm (Nodes)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{engineMoveInfo.nodes?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Hız (NPS)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{engineMoveInfo.nps?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Arama Süresi</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{engineMoveInfo.searchTimeMs}ms</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hard Negative Mining: Missed Positions Queue */}
          <div
            style={{
              padding: "16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              borderRadius: 14,
              flex: 1
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={15} color="#ef4444" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                  Eğitime Aktarılan Kaçırılmış Pozisyonlar ({recentFailures.length})
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Tıkla & Tekrar Dene</span>
            </div>

            {recentFailures.length === 0 ? (
              <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: "16px 0" }}>
                Henüz kaçırılan pozisyon kaydedilmedi.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {recentFailures.map((fail, idx) => (
                  <div
                    key={fail.puzzleId || idx}
                    onClick={() => {
                      loadPuzzleIntoBoard({
                        id: fail.puzzleId,
                        fen: fail.fen,
                        bestMove: fail.bestMove,
                        motif: fail.motif
                      });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 8,
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc" }}>
                        {fail.puzzleId} <span style={{ color: "#c084fc", fontSize: 11 }}>({fail.motif})</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        Oynanan: <span style={{ color: "#f87171" }}>{fail.playedMove || "none"}</span> | Doğru: <span style={{ color: "#34d399" }}>{fail.bestMove}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171"
                      }}
                    >
                      5x Öncelik
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
