import React, { useState, useEffect, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import {
  ShieldCheck,
  Binary,
  Copy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Activity,
  Award,
  Hash,
  Clock,
  Terminal,
  ExternalLink,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock
} from "lucide-react";

const CHRONICLE_001_PGN = `[Event "Rhizoh Production Match (Italian Game Giuoco Piano)"]
[Site "Rhizoh Production Cluster (Hetzner CPX21)"]
[Date "2026.10.08"]
[Round "1"]
[White "Rhizoh Castle Core (E5 Champion)"]
[Black "Castle Core v1.0.2 Baseline"]
[Result "1/2-1/2"]
[FEN "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"]
[SetUp "1"]
[TimeControl "0.1s/move"]
[Opening "Italian Game Giuoco Piano"]
[Termination "max_moves_reached"]
[PlyCount "50"]

4. O-O { +0.34/7 } 4... Nf6 { -0.26/8 } 5. Nc3 { +0.39/8 } 5... d6 { -0.27/8 } 6. Bb5 { +0.39/7 } 6... Bg4 { -0.08/7 } 7. d3 { +0.04/7 } 7... O-O { +0.46/7 } 8. Bxc6 { -0.35/7 } 8... bxc6 { +0.47/7 } 9. h3 { -0.37/8 } 9... Bxf3 { +0.39/8 } 10. Qxf3 { -0.27/6 } 10... Rb8 { +0.30/7 } 11. Rb1 { -0.04/7 } 11... Bd4 { +0.06/6 } 12. Bg5 { +0.06/6 } 12... Bxc3 { -0.23/6 } 13. bxc3 { +0.53/9 } 13... Rxb1 { -0.50/10 } 14. Rxb1 { +0.53/9 } 14... d5 { -0.60/8 } 15. c4 { +0.47/9 } 15... d4 { -0.34/8 } 16. a3 { +0.44/8 } 16... Qe7 { -0.26/8 } 17. Rb3 { +0.45/8 } 17... a5 { -0.15/8 } 18. a4 { +0.29/8 } 18... Kh8 { -0.30/8 } 19. Kh2 { +0.43/7 } 19... Qe6 { -0.17/8 } 20. c3 { +0.25/8 } 20... Nd7 { +0.33/8 } 21. cxd4 { -0.40/8 } 21... exd4 { +0.12/9 } 22. Qg3 { -0.24/7 } 22... f5 { +0.35/8 } 23. Qxc7 { -0.17/8 } 23... fxe4 { +0.11/9 } 24. dxe4 { +0.01/8 } 24... Rxf2 { +0.12/8 } 25. Qxd7 { +3.55/9 } 25... Qe5+ { -2.38/7 } 26. Rg3 { +2.80/9 } 26... Rf8 { -2.88/8 } 27. Bf4 { +2.67/8 } 27... Qf6 { -2.61/8 } 28. Bc7 { +3.53/8 } 28... Rf7 { -3.39/8 } 1/2-1/2`;

const DEFAULT_CHRONICLE_ENTRIES = [
  {
    id: "41e6772e-dfcb-4ec9-b7d0-ab8d191d54e2",
    chronicle_number: "#001",
    category: "MILESTONE",
    title: "First Autonomous Production Game",
    date: "2026-10-08",
    white: "Rhizoh Castle Core (E5 Champion)",
    black: "Castle Core v1.0.2 Baseline",
    opening: "Italian Game Giuoco Piano",
    result: "1/2-1/2",
    termination: "max_moves_reached",
    classification: "50-ply production validation match",
    plies: 50,
    time_control: "0.1s/move",
    engine_sha256: "09fc452beb1d95298ea3550df563d16de54f7d312ed2481d78bd0ac0fc08dac0",
    model_sha256: "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c",
    pgn_sha256: "528e9222272054a75f5583a5e93a2c0a7f9be29a39c98177a06b2eef4715825a",
    start_fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    pgn: CHRONICLE_001_PGN,
    has_replay: true,
    description: "The historical foundation game of Rhizoh on bare-metal Hetzner CPX21 cluster. 50 plies played autonomously with bit-for-bit parity, logged to Event Ledger and sealed."
  },
  {
    id: "chronicle-human-protocol",
    chronicle_number: "#000-HP",
    category: "MILESTONE",
    title: "First Human vs Rhizoh Match Protocol",
    date: "2026-10-08",
    white: "Human Challenger",
    black: "Rhizoh Castle Core (E5 Champion)",
    opening: "Openings Suite (CC0)",
    result: "Protocol Defined",
    termination: "governance_sealed",
    classification: "Interactive Human Play Ingress with Research Isolation Protocol",
    plies: 0,
    time_control: "blitz_3_0",
    engine_sha256: "00ccc8c47e1b6d74ccd2e2e5fb394cb7075b8f772a4f8e1d8962c6603d30d269",
    model_sha256: "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c",
    has_replay: false,
    description: "Production lifecycle protocol for human games. User games are cryptographically sealed as Research Candidates and pass through quality filters before lab dataset ingestion. Production champion remains immutable."
  },
  {
    id: "milestone-hetzner-deploy",
    chronicle_number: "#000-D",
    category: "DEPLOYMENT",
    title: "Hetzner CPX21 Cluster Deployment & Acceptance",
    date: "2026-10-08",
    description: "Production core E5/A50 deployed to Hetzner bare-metal cluster. 17/17 acceptance gates verified. Reality Seal verified with 503 injection. Nginx TLS reverse proxy established for rhizoh.com.",
    classification: "INFRASTRUCTURE_DEPLOYMENT",
    engine_sha256: "09fc452beb1d95298ea3550df563d16de54f7d312ed2481d78bd0ac0fc08dac0",
    model_sha256: "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c",
    has_replay: false
  },
  {
    id: "sprt-r07-3-vs-e5",
    chronicle_number: "#000-S",
    category: "SPRT",
    title: "SPRT Gauntlet R07.3 vs E5 Baseline",
    date: "2026-10-06",
    description: "400 games SPRT. Score 44.12%, LLR -1.7207. Promotion denied; E5 champion retained under 2-stage statistical gate.",
    classification: "LAB_VALIDATION_GATE",
    has_replay: false
  },
  {
    id: "milestone-a50-golden-seal",
    chronicle_number: "#000-M",
    category: "MILESTONE",
    title: "A50 Golden Baseline NNUE Architecture Sealed",
    date: "2026-10-04",
    description: "HalfKP architecture verified. Pearson correlation r=+0.4648, WAC median 21.0/30 (peak 23/30). Replaces ungrounded experimental weights with zero search-control drift.",
    classification: "CHAMPION_SEAL",
    model_sha256: "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c",
    has_replay: false
  },
  {
    id: "promotion-hardened-gate",
    chronicle_number: "#000-P",
    category: "PROMOTION",
    title: "Hardened Two-Stage Statistical Promotion Gate",
    date: "2026-10-05",
    description: "Enforces a strict two-stage statistical promotion pipeline (Stage A 50-game pre-screen, Stage B 200-game Wald SPRT) with a zero-tolerance hard-veto on Search-Control evaluation drift (<= 10.0 cp).",
    classification: "GOVERNANCE_PROTOCOL",
    has_replay: false
  },
  {
    id: "training-micro-motif-framework",
    chronicle_number: "#000-T",
    category: "TRAINING",
    title: "Bounded Micro-Motif Learning Framework",
    date: "2026-10-05",
    description: "CPU-only training framework for narrow NNUE candidates targeting single motif families (e.g., Knight Forks) with strict delta-weight clamping (q <= 1.0) and clean background anchoring.",
    classification: "NNUE_TRAINING_METHODOLOGY",
    has_replay: false
  },
  {
    id: "puzzle-tactical-benchmark",
    chronicle_number: "#000-Z",
    category: "PUZZLE",
    title: "Tactical Benchmark Resolution (WAC 21.0 / 30 Standard)",
    date: "2026-10-03",
    description: "Canonical 5-run tactical benchmark on Win at Chess (WAC 30) suite. Verified 70.0% resolution floor with zero search instability across core combinations.",
    classification: "TACTICAL_BENCHMARK",
    has_replay: false
  },
  {
    id: "failure-r07-5c-forensics",
    chronicle_number: "#000-F",
    category: "FAILURE",
    title: "Causal Forensics: Black Early Defense Swings (R07.5-C)",
    date: "2026-10-07",
    description: "Autopsy of 8 severe tactical horizon swings identified in early Black defenses (Italian Giuoco Piano & Pirc Defense). Quarantined in Lab dataset to prevent production leakage.",
    classification: "CAUSAL_ERROR_ANALYSIS",
    has_replay: false
  },
  {
    id: "analysis-positional-vs-tactical",
    chronicle_number: "#000-A",
    category: "ANALYSIS",
    title: "Positional Static Evaluation vs Dynamic Horizon Analysis",
    date: "2026-10-03",
    description: "Evaluation sensitivity matrix analysis comparing naive material balance correlation against deep alpha-beta singular extension lookahead.",
    classification: "SEARCH_THEORY_ANALYSIS",
    has_replay: false
  },
  {
    id: "tournament-canonical-gauntlet",
    chronicle_number: "#000-G",
    category: "TOURNAMENT",
    title: "Multi-Engine Gauntlet: Leorik 3.2.1 Benchmark Matches",
    date: "2026-10-07",
    description: "100-game paired opening gauntlet vs Leorik 3.2.1 under strict 300ms movetime controls. Established statistical baseline anchor for all candidate evaluations.",
    classification: "OFFICIAL_GAUNTLET",
    has_replay: false
  },
  {
    id: "news-world-launch",
    chronicle_number: "#000-N",
    category: "NEWS_EVENT",
    title: "Phase 1: Rhizoh World Activation",
    date: "2026-10-08",
    description: "Phase 0 infrastructure verified and sealed. Rhizoh transitions from an engine experiment to an autonomous living world with verified public history, interactive play, and cryptographic ledger.",
    classification: "WORLD_LIFECYCLE_EVENT",
    has_replay: false
  }
];

const CATEGORIES = [
  { id: "ALL", label: "All Events" },
  { id: "GAME", label: "⚔️ Games" },
  { id: "PUZZLE", label: "🧩 Puzzles" },
  { id: "ANALYSIS", label: "📊 Analysis" },
  { id: "TRAINING", label: "🧠 Training" },
  { id: "SPRT", label: "🔬 SPRT Gates" },
  { id: "PROMOTION", label: "🛡️ Promotion" },
  { id: "DEPLOYMENT", label: "🚀 Deployment" },
  { id: "FAILURE", label: "⚠️ Failure Mining" },
  { id: "MILESTONE", label: "🏆 Milestones" },
  { id: "TOURNAMENT", label: "🏟️ Tournament" },
  { id: "NEWS_EVENT", label: "📢 News & Events" }
];

const PIECE_SYMBOLS = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔"
};

export function RhizohChronicleViewer({ onPlayRhizoh }) {
  const [entries, setEntries] = useState(DEFAULT_CHRONICLE_ENTRIES);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGame, setSelectedGame] = useState(DEFAULT_CHRONICLE_ENTRIES[0]);
  const [currentPlyIndex, setCurrentPlyIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedSha, setCopiedSha] = useState("");
  const playTimerRef = useRef(null);

  // Fetch live chronicle entries from Hetzner Gateway
  useEffect(() => {
    let isMounted = true;
    const fetchChronicle = async () => {
      const endpoints = [
        "/api/chess/chronicle",
        "/rhizoh/chess/chronicle"
      ];
      for (const ep of endpoints) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 3000);
          const res = await fetch(ep, { signal: ctrl.signal });
          clearTimeout(t);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.chronicle && Array.isArray(data.chronicle)) {
              // Merge with local rich PGN for #001
              const merged = data.chronicle.map((item) => {
                if (item.id === "41e6772e-dfcb-4ec9-b7d0-ab8d191d54e2") {
                  return { ...item, pgn: CHRONICLE_001_PGN, start_fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" };
                }
                return item;
              });
              setEntries(merged);
            }
            return;
          }
        } catch {}
      }
    };
    fetchChronicle();
    return () => { isMounted = false; };
  }, []);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === "ALL") return entries;
    return entries.filter((e) => e.category === selectedCategory);
  }, [entries, selectedCategory]);

  // Parse moves and evaluations for selected game
  const parsedGame = useMemo(() => {
    const startFen = selectedGame?.start_fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    if (!selectedGame || !selectedGame.pgn) return { positions: [startFen], moves: [] };

    try {
      const chess = new Chess(startFen);
      const positions = [startFen];
      const moves = [];

      const movePattern = /(\d+)\.\s+([A-Za-z0-9+#=-]+)(?:\s+\{\s*([+-]?\d+(?:\.\d+)?)\/(\d+)\s*\})?(?:\s+([A-Za-z0-9+#=-]+)(?:\s+\{\s*([+-]?\d+(?:\.\d+)?)\/(\d+)\s*\})?)?/g;
      
      let match;
      while ((match = movePattern.exec(selectedGame.pgn)) !== null) {
        const moveNum = match[1];
        const whiteMove = match[2];
        const whiteEval = match[3] ? `${match[3]}/d${match[4]}` : null;
        const blackMove = match[5];
        const blackEval = match[6] ? `${match[6]}/d${match[7]}` : null;

        if (whiteMove && !["1/2-1/2", "1-0", "0-1", "*"].includes(whiteMove)) {
          try {
            const m = chess.move(whiteMove);
            if (m) {
              positions.push(chess.fen());
              moves.push({
                ply: moves.length + 1,
                moveNumber: moveNum,
                color: "w",
                san: whiteMove,
                eval: whiteEval,
                from: m.from,
                to: m.to
              });
            }
          } catch {}
        }

        if (blackMove && !["1/2-1/2", "1-0", "0-1", "*"].includes(blackMove)) {
          try {
            const m = chess.move(blackMove);
            if (m) {
              positions.push(chess.fen());
              moves.push({
                ply: moves.length + 1,
                moveNumber: moveNum,
                color: "b",
                san: blackMove,
                eval: blackEval,
                from: m.from,
                to: m.to
              });
            }
          } catch {}
        }
      }

      return { positions, moves };
    } catch {
      return { positions: [startFen], moves: [] };
    }
  }, [selectedGame]);

  const currentFen = parsedGame.positions[currentPlyIndex] || selectedGame?.start_fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const currentBoard = useMemo(() => {
    try {
      const c = new Chess(currentFen);
      return c.board();
    } catch {
      return [];
    }
  }, [currentFen]);

  const activeMove = currentPlyIndex > 0 ? parsedGame.moves[currentPlyIndex - 1] : null;

  // Auto-play replay timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentPlyIndex((prev) => {
          if (prev >= parsedGame.positions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    } else {
      clearInterval(playTimerRef.current);
    }
    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, parsedGame.positions.length]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(label);
    setTimeout(() => setCopiedSha(""), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Top Banner / Milestone Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          borderRadius: 20,
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Cryptographic Chronicle
            </span>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800
              }}
            >
              Verified Living History
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#f8fafc" }}>
            {selectedGame?.chronicle_number} — {selectedGame?.title}
          </h2>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
            Recorded on Hetzner Production Core · Cryptographically Sealed into Event Ledger
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selectedGame?.pgn && (
            <button
              onClick={() => handleCopy(selectedGame.pgn, "PGN")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 12,
                color: "#cbd5e1",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {copiedSha === "PGN" ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              {copiedSha === "PGN" ? "PGN Copied!" : "Copy PGN"}
            </button>
          )}

          {onPlayRhizoh && (
            <button
              onClick={onPlayRhizoh}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
                border: "none",
                borderRadius: 12,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.35)"
              }}
            >
              <Play size={16} /> Play Rhizoh Live
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: "7px 14px",
              borderRadius: 10,
              background: selectedCategory === cat.id ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.04)",
              border: selectedCategory === cat.id ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(148, 163, 184, 0.12)",
              color: selectedCategory === cat.id ? "#38bdf8" : "#94a3b8",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Chronicle Replay & Entry List */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 460px) 1fr", gap: 32, alignItems: "start" }}>
        {/* Left Column: Replay Chess Board or Event Summary Card */}
        {selectedGame?.has_replay && selectedGame?.pgn ? (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            {/* Board Header / Player Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Black</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{selectedGame.black}</div>
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "rgba(0, 0, 0, 0.4)",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#e2e8f0"
                }}
              >
                {selectedGame.result}
              </div>
            </div>

            {/* Chess Board Grid */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gridTemplateRows: "repeat(8, 1fr)",
                border: "2px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)"
              }}
            >
              {currentBoard.map((row, rIdx) =>
                row.map((square, cIdx) => {
                  const isLight = (rIdx + cIdx) % 2 === 0;
                  const file = String.fromCharCode(97 + cIdx);
                  const rank = 8 - rIdx;
                  const squareName = `${file}${rank}`;
                  const isMoveFrom = activeMove && activeMove.from === squareName;
                  const isMoveTo = activeMove && activeMove.to === squareName;

                  return (
                    <div
                      key={squareName}
                      style={{
                        background: isMoveTo
                          ? "rgba(56, 189, 248, 0.45)"
                          : isMoveFrom
                          ? "rgba(56, 189, 248, 0.25)"
                          : isLight
                          ? "#cbd5e1"
                          : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        fontSize: "clamp(22px, 3.8vw, 34px)",
                        userSelect: "none"
                      }}
                    >
                      {square && (
                        <span
                          style={{
                            color: square.color === "w" ? "#ffffff" : "#0f172a",
                            textShadow: square.color === "w"
                              ? "0 2px 4px rgba(0,0,0,0.8), 0 0 1px #000"
                              : "0 2px 4px rgba(255,255,255,0.4)"
                          }}
                        >
                          {PIECE_SYMBOLS[square.color === "w" ? square.type.toUpperCase() : square.type]}
                        </span>
                      )}

                      {/* Coordinates */}
                      {cIdx === 0 && (
                        <span style={{ position: "absolute", top: 2, left: 4, fontSize: 10, fontWeight: 700, color: isLight ? "#64748b" : "#94a3b8" }}>
                          {rank}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span style={{ position: "absolute", bottom: 2, right: 4, fontSize: 10, fontWeight: 700, color: isLight ? "#64748b" : "#94a3b8" }}>
                          {file}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* White Player Label */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600 }}>White</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{selectedGame.white}</div>
              </div>
              {activeMove && activeMove.eval && (
                <span
                  style={{
                    background: activeMove.eval.startsWith("+")
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(244, 63, 94, 0.2)",
                    color: activeMove.eval.startsWith("+") ? "#34d399" : "#fb7185",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  {activeMove.eval}
                </span>
              )}
            </div>

            {/* Replay Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid rgba(148, 163, 184, 0.15)"
              }}
            >
              <button
                onClick={() => setCurrentPlyIndex(0)}
                disabled={currentPlyIndex === 0}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  cursor: currentPlyIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentPlyIndex === 0 ? 0.4 : 1
                }}
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={() => setCurrentPlyIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPlyIndex === 0}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "#e2e8f0",
                  cursor: currentPlyIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentPlyIndex === 0 ? 0.4 : 1
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: isPlaying ? "#f43f5e" : "#38bdf8",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={() => setCurrentPlyIndex((prev) => Math.min(parsedGame.positions.length - 1, prev + 1))}
                disabled={currentPlyIndex >= parsedGame.positions.length - 1}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "#e2e8f0",
                  cursor: currentPlyIndex >= parsedGame.positions.length - 1 ? "not-allowed" : "pointer",
                  opacity: currentPlyIndex >= parsedGame.positions.length - 1 ? 0.4 : 1
                }}
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setCurrentPlyIndex(parsedGame.positions.length - 1)}
                disabled={currentPlyIndex >= parsedGame.positions.length - 1}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  cursor: currentPlyIndex >= parsedGame.positions.length - 1 ? "not-allowed" : "pointer",
                  opacity: currentPlyIndex >= parsedGame.positions.length - 1 ? 0.4 : 1
                }}
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
              Ply {currentPlyIndex} of {parsedGame.moves.length}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 20,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Award size={22} color="#f59e0b" />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                {selectedGame?.title}
              </h3>
            </div>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 }}>
              {selectedGame?.description || "Archived autonomous event recorded into the permanent Event Ledger."}
            </p>
            <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: 14, borderRadius: 10, fontSize: 12, color: "#94a3b8" }}>
              <div><strong>Category:</strong> {selectedGame?.category}</div>
              <div><strong>Date:</strong> {selectedGame?.date}</div>
              <div><strong>Classification:</strong> {selectedGame?.classification}</div>
            </div>
          </div>
        )}

        {/* Right Column: Event List & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>
            Chronicle Archive ({filteredEntries.length} events)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredEntries.map((item) => {
              const isSelected = selectedGame?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedGame(item);
                    setCurrentPlyIndex(0);
                    setIsPlaying(false);
                  }}
                  style={{
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(15, 23, 42, 0.65)",
                    border: isSelected ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(148, 163, 184, 0.12)",
                    borderRadius: 14,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 900, color: "#38bdf8", fontSize: 13, fontFamily: "monospace" }}>
                        {item.chronicle_number}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: item.category === "MILESTONE"
                            ? "rgba(168, 85, 247, 0.2)"
                            : item.category === "GAME"
                            ? "rgba(56, 189, 248, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                          color: item.category === "MILESTONE"
                            ? "#c084fc"
                            : item.category === "GAME"
                            ? "#38bdf8"
                            : "#fbbf24"
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{item.date}</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f8fafc", marginBottom: 4 }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {item.classification} {item.result ? `· Result: ${item.result}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
