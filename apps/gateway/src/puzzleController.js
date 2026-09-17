import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate tactics_puzzles.epd
const candidateEpdPaths = [
  path.join(__dirname, "..", "..", "..", "data", "tactics_puzzles.epd"),
  path.join(__dirname, "..", "data", "tactics_puzzles.epd"),
  path.join(process.cwd(), "data", "tactics_puzzles.epd"),
  path.join(process.cwd(), "apps", "gateway", "data", "tactics_puzzles.epd"),
  path.join("/opt", "castle", "data", "tactics_puzzles.epd")
];

const candidateFailuresPaths = [
  path.join(__dirname, "..", "..", "..", "data", "puzzle_failures.json"),
  path.join(__dirname, "..", "data", "puzzle_failures.json"),
  path.join(process.cwd(), "data", "puzzle_failures.json"),
  path.join(process.cwd(), "apps", "gateway", "data", "puzzle_failures.json"),
  path.join("/opt", "castle", "data", "puzzle_failures.json")
];

let puzzlesCache = [];
let currentIndex = 0;
let failuresCache = [];
let stats = {
  totalAttempted: 0,
  totalSolved: 0,
  totalFailed: 0,
  lastUpdated: new Date().toISOString()
};

function resolveEpdPath() {
  for (const p of candidateEpdPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveFailuresPath() {
  for (const p of candidateFailuresPaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidateFailuresPaths[0];
}

export function areMovesEquivalent(fen, moveA, moveB) {
  if (!moveA || !moveB) return false;
  const a = String(moveA).trim();
  const b = String(moveB).trim();
  if (a.toLowerCase() === b.toLowerCase()) return true;

  try {
    const parseToUci = (m) => {
      const chess = new Chess(fen);
      const isUciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m);
      if (isUciPattern) {
        const from = m.slice(0, 2).toLowerCase();
        const to = m.slice(2, 4).toLowerCase();
        const promotion = m.length > 4 ? m[4].toLowerCase() : undefined;
        const res = chess.move({ from, to, promotion });
        if (res) return res.from + res.to + (res.promotion || "");
      } else {
        const res = chess.move(m);
        if (res) return res.from + res.to + (res.promotion || "");
      }
      return m.toLowerCase();
    };

    const uciA = parseToUci(a);
    const uciB = parseToUci(b);
    return Boolean(uciA && uciB && uciA === uciB);
  } catch {
    return false;
  }
}

function enrichPuzzleMoves(puzzle) {
  if (!puzzle || puzzle.bestMoveUci) return puzzle;
  puzzle.bestMoveSan = puzzle.bestMove;
  puzzle.bestMoveUci = "";
  try {
    const c = new Chess(puzzle.fen);
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(puzzle.bestMove)) {
      const from = puzzle.bestMove.slice(0, 2).toLowerCase();
      const to = puzzle.bestMove.slice(2, 4).toLowerCase();
      const promo = puzzle.bestMove.length > 4 ? puzzle.bestMove[4].toLowerCase() : undefined;
      const res = c.move({ from, to, promotion: promo });
      if (res) {
        puzzle.bestMoveUci = res.from + res.to + (res.promotion || "");
        puzzle.bestMoveSan = res.san;
      }
    } else {
      const res = c.move(puzzle.bestMove);
      if (res) {
        puzzle.bestMoveUci = res.from + res.to + (res.promotion || "");
        puzzle.bestMoveSan = res.san;
      }
    }
  } catch {}
  return puzzle;
}

// Built-in curated fallback puzzles if EPD is not on server
const FALLBACK_PUZZLES = [
  { id: "Fallback.001", fen: "2r3k1/1p3ppp/p1q1p3/3p4/P2Pn3/1P2P3/3NQPPP/R5K1 b - - 0 1", bestMove: "c6c1", motif: "BackRankSacrifice" },
  { id: "Fallback.002", fen: "r1bqk2r/ppp2ppp/2n5/1B1pp3/4n3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", bestMove: "d2d3", motif: "KnightForkDisarm" },
  { id: "Fallback.003", fen: "6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1", bestMove: "b2b8", motif: "BackRankMate" },
  { id: "Fallback.004", fen: "r1b1kb1r/pppp1ppp/8/4n3/3P3q/8/PPP1PPPP/RNBQKB1R w KQkq - 0 1", bestMove: "d4e5", motif: "PinAndWin" },
  { id: "Fallback.005", fen: "2r2rk1/pp3ppp/8/3N4/8/8/PPP2PPP/R4RK1 w - - 0 1", bestMove: "d5e7", motif: "RoyalFork" },
  { id: "Fallback.006", fen: "r4rk1/pp3ppp/8/8/8/8/1Q3PPP/5RK1 w - - 0 1", bestMove: "b2b7", motif: "DeflectionQueen" },
  { id: "Fallback.007", fen: "8/8/4k3/8/8/8/r7/1R2K3 w - - 0 1", bestMove: "b1b6", motif: "RookSkewer" },
  { id: "Fallback.008", fen: "r1b2rk1/ppp2ppp/2n5/3qp3/8/3P1N2/PPP1BPPP/R1BQ1RK1 b - - 0 1", bestMove: "c6d4", motif: "RemovalOfDefender" },
  { id: "Fallback.009", fen: "r1b2rk1/ppp2ppp/8/3q4/3p4/3P4/PPP1BPPP/R1BQ1RK1 w - - 0 1", bestMove: "e2f3", motif: "BishopPin" },
  { id: "Fallback.010", fen: "8/6pk/8/8/8/8/1B6/1K5r w - - 0 1", bestMove: "b1c2", motif: "BishopEscape" }
];

export function initPuzzleController() {
  const epdFile = resolveEpdPath();
  if (epdFile) {
    try {
      console.log("[PUZZLE_INIT] Loading puzzles from:", epdFile);
      const content = fs.readFileSync(epdFile, "utf8");
      const lines = content.split("\n");
      const loaded = [];
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        // An EPD line: <FEN> bm <BEST_MOVE>; id "<ID>"; c0 "<MOTIF>";
        const bmMatch = line.match(/\s+bm\s+([^;]+);/);
        if (!bmMatch) continue;

        const bestMove = bmMatch[1].trim();
        const fen = line.substring(0, line.indexOf(" bm ")).trim();

        // Validate FEN ranks: position part must have exactly 7 slashes (8 ranks)
        const posPart = fen.split(" ")[0] || "";
        const rankCount = (posPart.match(/\//g) || []).length + 1;
        if (rankCount !== 8) continue;

        let id = `Puzzle_${loaded.length + 1}`;
        let motif = "Tactics";

        const idMatch = line.match(/\bid\s+"([^"]+)";/);
        if (idMatch) id = idMatch[1].trim();

        const c0Match = line.match(/\bc0\s+"([^"]+)";/);
        if (c0Match) motif = c0Match[1].trim();

        if (fen && bestMove) {
          loaded.push({ id, fen, bestMove, motif });
        }
      }
      puzzlesCache = loaded.length > 0 ? loaded : FALLBACK_PUZZLES;
      console.log(`[PUZZLE_INIT] Successfully loaded ${puzzlesCache.length} tactical puzzles.`);
    } catch (err) {
      console.warn("[PUZZLE_INIT] Failed reading EPD, using fallback list:", err.message);
      puzzlesCache = FALLBACK_PUZZLES;
    }
  } else {
    console.log("[PUZZLE_INIT] EPD file not found, using embedded fallback puzzles.");
    puzzlesCache = FALLBACK_PUZZLES;
  }

  // Load existing failures
  const failuresFile = resolveFailuresPath();
  if (fs.existsSync(failuresFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(failuresFile, "utf8"));
      if (Array.isArray(data)) {
        failuresCache = data;
        stats.totalFailed = failuresCache.length;
      }
    } catch {}
  }
}

export function getNextPuzzle(requestedId) {
  if (puzzlesCache.length === 0) {
    initPuzzleController();
  }
  let puzzle = null;
  if (requestedId) {
    puzzle = puzzlesCache.find(p => p.id === requestedId);
  }
  if (!puzzle) {
    puzzle = puzzlesCache[currentIndex % puzzlesCache.length];
    currentIndex = (currentIndex + 1) % puzzlesCache.length;
  }
  return enrichPuzzleMoves(puzzle);
}

export function recordPuzzleSolution({ puzzleId, fen, playedMove, bestMove, motif, engine, depth, nodes, timeMs }) {
  stats.totalAttempted += 1;
  const isCorrect = areMovesEquivalent(fen, playedMove, bestMove);
  
  if (isCorrect) {
    stats.totalSolved += 1;
  } else {
    stats.totalFailed += 1;
    const failureRecord = {
      puzzleId: puzzleId || `Fail_${Date.now()}`,
      fen: fen || "",
      playedMove: playedMove || "",
      bestMove: bestMove || "",
      motif: motif || "GeneralTactics",
      engine: engine || "Rhizoh HCE 22.0",
      depth: Number(depth) || 0,
      nodes: Number(nodes) || 0,
      timeMs: Number(timeMs) || 0,
      recordedAt: new Date().toISOString(),
      trainingPriority: 5 // High priority for Track B hard-negative training
    };
    failuresCache.push(failureRecord);

    // Keep memory cache bounded
    if (failuresCache.length > 5000) {
      failuresCache.shift();
    }

    // Persist to disk asynchronously
    try {
      const failuresFile = resolveFailuresPath();
      const dir = path.dirname(failuresFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(failuresFile, JSON.stringify(failuresCache.slice(-500), null, 2), "utf8", () => {});
    } catch (err) {
      console.warn("[PUZZLE_PERSIST_ERROR]", err.message);
    }
  }

  stats.lastUpdated = new Date().toISOString();
  return {
    ok: true,
    solved: isCorrect,
    playedMove,
    bestMove,
    stats: getPuzzleStats()
  };
}

export function getPuzzleStats() {
  const accuracy = stats.totalAttempted > 0 
    ? ((stats.totalSolved / stats.totalAttempted) * 100).toFixed(1)
    : "0.0";
  return {
    totalAttempted: stats.totalAttempted,
    totalSolved: stats.totalSolved,
    totalFailed: stats.totalFailed,
    accuracyPct: Number(accuracy),
    failuresInQueue: failuresCache.length,
    datasetPoolSize: puzzlesCache.length,
    lastUpdated: stats.lastUpdated
  };
}

export function getRecentFailures(limit = 10) {
  return failuresCache.slice(-limit).reverse();
}
