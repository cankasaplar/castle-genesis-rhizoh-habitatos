import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import { computePolyglotHash } from "./polyglotHash.js";
import { computeCastleZobristHash } from "./castleHasher.js";

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

const candidateLossMemoryPaths = [
  path.join(__dirname, "..", "..", "..", "data", "loss_miner_memory.json"),
  path.join(__dirname, "..", "data", "loss_miner_memory.json"),
  path.join(process.cwd(), "data", "loss_miner_memory.json"),
  path.join(process.cwd(), "apps", "gateway", "data", "loss_miner_memory.json"),
  path.join("/opt", "castle", "data", "loss_miner_memory.json")
];

function resolveLossMemoryPath() {
  for (const p of candidateLossMemoryPaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidateLossMemoryPaths[0];
}

function recordBlunderHash(fen, playedMove) {
  try {
    if (!fen || !playedMove || playedMove === "none") return;
    const c = new Chess(fen);
    const clean = playedMove.trim();
    let moveRes = null;
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(clean)) {
      const from = clean.slice(0, 2).toLowerCase();
      const to = clean.slice(2, 4).toLowerCase();
      const promotion = clean.length > 4 ? clean[4].toLowerCase() : undefined;
      moveRes = c.move({ from, to, promotion });
    } else {
      let san = clean;
      if (/^(o-o-o|0-0-0)$/i.test(san)) san = "O-O-O";
      else if (/^(o-o|0-0)$/i.test(san)) san = "O-O";
      moveRes = c.move(san);
    }
    if (moveRes) {
      const blunderFen = c.fen();
      const polyHashStr = computePolyglotHash(blunderFen).toString();
      const zobristHashStr = computeCastleZobristHash(blunderFen).toString();
      const writtenPaths = new Set();
      for (const lossFile of candidateLossMemoryPaths) {
        try {
          const dir = path.dirname(lossFile);
          if (fs.existsSync(dir) || lossFile === candidateLossMemoryPaths[0]) {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const resolved = path.resolve(lossFile);
            if (writtenPaths.has(resolved)) continue;
            writtenPaths.add(resolved);

            let existing = "";
            if (fs.existsSync(resolved)) existing = fs.readFileSync(resolved, "utf8");
            const lines = new Set(existing.split("\n").map(l => l.trim()).filter(Boolean));
            let changed = false;
            if (!lines.has(zobristHashStr)) {
              lines.add(zobristHashStr);
              changed = true;
            }
            if (!lines.has(polyHashStr)) {
              lines.add(polyHashStr);
              changed = true;
            }
            if (changed) {
              fs.writeFileSync(resolved, Array.from(lines).join("\n") + "\n", "utf8");
              console.log(`[LOSS_MINER_INGEST] Recorded blunder hashes zobrist:${zobristHashStr}, polyglot:${polyHashStr} to ${resolved}`);
            }
          }
        } catch (err) {
          console.warn("[LOSS_MINER_WRITE_WARN]", lossFile, err.message);
        }
      }
    }
  } catch (err) {
    console.warn("[LOSS_MINER_RECORD_ERROR]", err.message);
  }
}

const candidateStatsPaths = [
  path.join(__dirname, "..", "..", "..", "data", "puzzle_stats.json"),
  path.join(__dirname, "..", "data", "puzzle_stats.json"),
  path.join(process.cwd(), "data", "puzzle_stats.json"),
  path.join(process.cwd(), "apps", "gateway", "data", "puzzle_stats.json"),
  path.join("/opt", "castle", "data", "puzzle_stats.json")
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

function resolveStatsPath() {
  for (const p of candidateStatsPaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidateStatsPaths[0];
}

export function areMovesEquivalent(fen, moveA, moveB) {
  if (!moveA || !moveB) return false;
  let a = String(moveA).trim();
  let b = String(moveB).trim();
  if (a.toLowerCase() === b.toLowerCase()) return true;

  // Safe castling normalization: normalize both o-o and 0-0 variations
  const normalizeSan = (s) => {
    const clean = s.trim();
    if (/^(o-o-o|0-0-0)$/i.test(clean)) return "O-O-O";
    if (/^(o-o|0-0)$/i.test(clean)) return "O-O";
    return clean;
  };
  a = normalizeSan(a);
  b = normalizeSan(b);

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
        const normalized = normalizeSan(m);
        const res = chess.move(normalized);
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
    const cleanMove = puzzle.bestMove.trim();
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(cleanMove)) {
      const from = cleanMove.slice(0, 2).toLowerCase();
      const to = cleanMove.slice(2, 4).toLowerCase();
      const promo = cleanMove.length > 4 ? cleanMove[4].toLowerCase() : undefined;
      const res = c.move({ from, to, promotion: promo });
      if (res) {
        puzzle.bestMoveUci = res.from + res.to + (res.promotion || "");
        puzzle.bestMoveSan = res.san;
      }
    } else {
      let san = cleanMove;
      if (/^(o-o-o|0-0-0)$/i.test(san)) san = "O-O-O";
      else if (/^(o-o|0-0)$/i.test(san)) san = "O-O";
      const res = c.move(san);
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

  // Load persistent stats
  const statsFile = resolveStatsPath();
  if (statsFile && fs.existsSync(statsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(statsFile, "utf8"));
      if (typeof data?.totalAttempted === "number") {
        stats.totalAttempted = data.totalAttempted;
        stats.totalSolved = data.totalSolved || 0;
        stats.totalFailed = data.totalFailed || 0;
        stats.lastUpdated = data.lastUpdated || new Date().toISOString();
        console.log("[PUZZLE_INIT] Loaded persistent puzzle stats:", stats);
      }
    } catch (err) {
      console.warn("[PUZZLE_INIT] Failed loading puzzle stats:", err.message);
    }
  }

  // Load existing failures
  const failuresFile = resolveFailuresPath();
  if (fs.existsSync(failuresFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(failuresFile, "utf8"));
      if (Array.isArray(data)) {
        // Deduplicate loaded failures by puzzleId keeping most recent
        const seen = new Map();
        for (const item of data) {
          if (item?.puzzleId) seen.set(item.puzzleId, item);
        }
        failuresCache = Array.from(seen.values());
        if (stats.totalAttempted === 0 && failuresCache.length > 0) {
          stats.totalFailed = failuresCache.length;
          stats.totalAttempted = failuresCache.length;
        }
      }
    } catch {}
  }
}

const sessionCursors = new Map();

function cleanStaleSessions() {
  const now = Date.now();
  for (const [sid, item] of sessionCursors.entries()) {
    if (now - item.lastActive > 3600000) {
      sessionCursors.delete(sid);
    }
  }
}

export function generateTacticalRefutation(fen, playedMove, bestMove, motif) {
  try {
    const cPlayed = new Chess(fen);
    const cBest = new Chess(fen);
    let playedSan = playedMove || "none";
    let playedUci = playedMove || "";
    let bestSan = bestMove || "";
    let bestUci = bestMove || "";

    const parseMoveOnBoard = (board, m) => {
      if (!m) return { san: "none", uci: "" };
      let str = String(m).trim();
      if (/^(o-o-o|0-0-0)$/i.test(str)) str = "O-O-O";
      else if (/^(o-o|0-0)$/i.test(str)) str = "O-O";

      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(str)) {
        const from = str.slice(0, 2).toLowerCase();
        const to = str.slice(2, 4).toLowerCase();
        const promo = str.length > 4 ? str[4].toLowerCase() : undefined;
        const res = board.move({ from, to, promotion: promo });
        if (res) return { san: res.san, uci: res.from + res.to + (res.promotion || "") };
      } else {
        const res = board.move(str);
        if (res) return { san: res.san, uci: res.from + res.to + (res.promotion || "") };
      }
      return { san: str, uci: str };
    };

    if (playedMove) {
      const r = parseMoveOnBoard(cPlayed, playedMove);
      playedSan = r.san;
      playedUci = r.uci;
    }
    if (bestMove) {
      const r = parseMoveOnBoard(cBest, bestMove);
      bestSan = r.san;
      bestUci = r.uci;
    }

    let explanation = "";
    if (bestSan.includes("#")) {
      explanation = `Rhizoh chose ${playedSan}, overlooking immediate forced checkmate via ${bestSan}.`;
    } else if (bestSan.includes("+")) {
      explanation = `Rhizoh played ${playedSan}, missing a decisive checking combination with ${bestSan}.`;
    } else if (motif) {
      explanation = `Tactical oversight in ${motif}: Rhizoh played ${playedSan}, failing to execute ${bestSan}.`;
    } else {
      explanation = `Rhizoh played ${playedSan}, conceding tactical advantage compared to master move ${bestSan}.`;
    }

    return {
      playedSan,
      playedUci,
      bestSan,
      bestUci,
      motif: motif || "Tactics",
      explanation,
      refutationCategory: bestSan.includes("#") ? "MissedForcedMate" : (bestSan.includes("+") ? "MissedDecisiveCheck" : "SuboptimalMaterialLoss"),
      queuedForTraining: true
    };
  } catch (err) {
    return {
      playedSan: playedMove,
      playedUci: playedMove,
      bestSan: bestMove,
      bestUci: bestMove,
      motif: motif || "Tactics",
      explanation: `Tactical difference: ${bestMove} required instead of ${playedMove}.`,
      refutationCategory: "GeneralTacticsMiss",
      queuedForTraining: true
    };
  }
}

export function getNextPuzzle(requestedId, options = {}) {
  if (puzzlesCache.length === 0) {
    initPuzzleController();
  }
  let puzzle = null;
  if (requestedId) {
    puzzle = puzzlesCache.find(p => p.id === requestedId);
    if (puzzle) return enrichPuzzleMoves(puzzle);
  }

  const { sessionId, random, motif } = options;
  let pool = puzzlesCache;
  if (motif) {
    const filtered = puzzlesCache.filter(p => p.motif && p.motif.toLowerCase() === motif.toLowerCase());
    if (filtered.length > 0) pool = filtered;
  }

  if (sessionId) {
    cleanStaleSessions();
    let sess = sessionCursors.get(sessionId);
    if (!sess) {
      sess = {
        cursor: Math.floor(Math.random() * pool.length),
        seenIds: new Set(),
        lastActive: Date.now()
      };
      sessionCursors.set(sessionId, sess);
    }
    sess.lastActive = Date.now();

    if (random) {
      const unseen = pool.filter(p => !sess.seenIds.has(p.id));
      const pickList = unseen.length > 0 ? unseen : pool;
      puzzle = pickList[Math.floor(Math.random() * pickList.length)];
    } else {
      puzzle = pool[sess.cursor % pool.length];
      sess.cursor = (sess.cursor + 1) % pool.length;
    }

    if (puzzle) {
      sess.seenIds.add(puzzle.id);
      if (sess.seenIds.size > 300) {
        const arr = Array.from(sess.seenIds);
        sess.seenIds = new Set(arr.slice(-100));
      }
      return enrichPuzzleMoves(puzzle);
    }
  }

  if (random) {
    puzzle = pool[Math.floor(Math.random() * pool.length)];
    return enrichPuzzleMoves(puzzle);
  }

  puzzle = pool[currentIndex % pool.length];
  currentIndex = (currentIndex + 1) % pool.length;
  return enrichPuzzleMoves(puzzle);
}

export function recordPuzzleSolution({ puzzleId, fen, playedMove, bestMove, motif, engine, depth, nodes, timeMs }) {
  stats.totalAttempted += 1;
  stats.latestMotif = motif || "Tactics";
  stats.latestPuzzleId = puzzleId;
  stats.latestAttemptedAt = new Date().toISOString();
  const isCorrect = areMovesEquivalent(fen, playedMove, bestMove);
  stats.latestSolved = isCorrect;
  let correction = null;
  
  if (isCorrect) {
    stats.totalSolved += 1;
  } else {
    stats.totalFailed += 1;
    correction = generateTacticalRefutation(fen, playedMove, bestMove, motif);
    // Ingest blunder move into live Loss Memory to refute recurrence on replay
    recordBlunderHash(fen, playedMove);

    // Track B Quality Guard: Strict deduplication by puzzleId
    const existingIdx = failuresCache.findIndex(f => f.puzzleId === puzzleId);
    const existing = existingIdx !== -1 ? failuresCache[existingIdx] : null;

    const failureRecord = {
      puzzleId: puzzleId || `Fail_${Date.now()}`,
      fen: fen || "",
      playedMove: playedMove || "none",
      bestMove: bestMove || "",
      motif: motif || "GeneralTactics",
      engine: engine || "Rhizoh HCE 22.0",
      depth: Number(depth) || 0,
      nodes: Number(nodes) || 0,
      timeMs: Number(timeMs) || 0,
      correction,
      attemptCount: (existing?.attemptCount || 0) + 1,
      firstRecordedAt: existing?.firstRecordedAt || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      trainingPriority: Math.min(25, (existing?.trainingPriority || 5) + 5) // Incremental priority for recurring misses
    };

    if (existingIdx !== -1) {
      failuresCache.splice(existingIdx, 1);
    }
    failuresCache.push(failureRecord);

    if (failuresCache.length > 250) {
      failuresCache.shift();
    }

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

  // Persist cumulative stats to disk
  try {
    const statsFile = resolveStatsPath();
    const sDir = path.dirname(statsFile);
    if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
    fs.writeFile(statsFile, JSON.stringify(stats, null, 2), "utf8", () => {});
  } catch (err) {
    console.warn("[PUZZLE_STATS_PERSIST_ERROR]", err.message);
  }

  return {
    ok: true,
    solved: isCorrect,
    playedMove,
    bestMove,
    correction,
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
    latestMotif: stats.latestMotif || "Tactics",
    latestPuzzleId: stats.latestPuzzleId || null,
    latestSolved: stats.latestSolved ?? null,
    latestAttemptedAt: stats.latestAttemptedAt || stats.lastUpdated,
    lastUpdated: stats.lastUpdated
  };
}

export function getRecentFailures(limit = 10) {
  return failuresCache.slice(-limit).reverse();
}
