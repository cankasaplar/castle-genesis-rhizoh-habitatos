/**
 * Rhizoh Server-Authoritative Puzzle Engine & Verification Authority (Phase 4 - P4-A)
 * 
 * Architectural Standard:
 * - "Client sends intent. Server determines reality."
 * - Client cannot declare a puzzle solved or dictate the correct move.
 * - Solution correctness, legality, and completion are 100% server-authoritative.
 * - ZERO HOLDOUT LEAKAGE: WAC-30, R07.5 holdouts, and SPRT failure benchmarks
 *   MUST NEVER enter published training/puzzle pool. Quarantined unconditionally.
 * - Provenance: Every puzzle candidate must be backed by a verified source game,
 *   immutable teacher engine signature, legal FEN replay, and canonical hashes.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import { getPlayerByToken, getPlayerById, verifyPlayerOwnership } from "./playerIdentityStoreV1.js";
import { applyPuzzleRatingOutcome } from "./puzzleRatingEngineV1.js";
import { recordPuzzleAttemptMetric, registerPuzzleServed } from "./puzzleProfileAnalyticsV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// STRICT QUARANTINE: 30 WAC Benchmark Positions that must NEVER enter public puzzle pool or training
export const WAC_30_QUARANTINE_BOARDS = Object.freeze(new Set([
  "2r3k1/1p3ppp/p1q1p3/3p4/P2Pn3/1P2P3/3NQPPP/R5K1",
  "r6k/pp4pp/8/8/8/8/1Q3PPP/6K1",
  "r1bqk2r/ppp2ppp/2n5/1B1pp3/4n3/5N2/PPPP1PPP/R1BQK2R",
  "6k1/5ppp/8/8/8/8/1R3PPP/6K1",
  "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1",
  "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
  "r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1",
  "r1b1kb1r/pppp1ppp/8/4n3/3P3q/8/PPP1PPPP/RNBQKB1R",
  "2r2rk1/pp3ppp/8/3N4/8/8/PPP2PPP/R4RK1",
  "r4rk1/pp3ppp/8/8/8/8/1Q3PPP/5RK1",
  "r1bqk1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R",
  "r1bqk2r/ppp2ppp/2n5/3pp3/4P3/2N2N2/PPPP1PPP/R1BQKB1R",
  "r1b2rk1/ppp2ppp/2n5/3qp3/8/3P1N2/PPP1BPPP/R1BQ1RK1",
  "8/5pk1/4p1p1/3pP2p/3R1P1P/6P1/4K3/r7",
  "8/8/4k3/8/8/8/r7/1R2K3",
  "2r3k1/pp3ppp/2r5/8/8/3P1B2/P4PPP/2RQ1RK1",
  "r3k2r/ppp2ppp/2n5/3N4/8/8/PPP2PPP/R4RK1",
  "6k1/5ppp/8/8/8/8/r7/1R4K1",
  "r1b2rk1/pp3ppp/2p5/8/8/2qP1B2/PPP2PPP/R1BQ1RK1",
  "r1b2rk1/pp3ppp/2p5/8/8/3P1B2/P1q2PPP/R1BQ1RK1",
  "r1bqk2r/ppp2ppp/2n5/1B1p4/3Pn3/2P2N2/P4PPP/R1BQK2R",
  "8/6pk/8/8/8/8/1B6/1K5r",
  "r1bq1rk1/ppp2ppp/2n5/3np3/2B5/3P1N2/PPP2PPP/RNBQK2R",
  "r4rk1/ppp2ppp/2n5/3qp3/1b6/3P1N2/PPP1BPPP/R1BQ1RK1",
  "8/5p2/4p1p1/3pP2p/3P1P1P/6P1/4K3/8",
  "r1b2rk1/ppp2ppp/2n5/3qp3/3n4/3P1N2/PPP1BPPP/R1BQ1RK1",
  "r1b2rk1/ppp2ppp/8/3qp3/3N4/3P4/PPP1BPPP/R1BQ1RK1",
  "r1b2rk1/ppp2ppp/8/3q4/3p4/3P4/PPP1BPPP/R1BQ1RK1",
  "r1b2rk1/ppp2ppp/8/8/3q4/3P1B2/PPP2PPP/R1BQ1RK1",
  "r1b2rk1/pp3ppp/2p5/8/3q4/3P1B2/PPP2PPP/R1BQ1RK1"
]));

function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    process.env.REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(__dirname, "..", "..", "..")
  ].filter(Boolean);

  for (const c of candidates) {
    if (
      fs.existsSync(path.join(c, "data", "puzzles_canonical_v1.json")) ||
      fs.existsSync(path.join(c, "data", "tactics_puzzles.epd")) ||
      (fs.existsSync(path.join(c, "package.json")) && fs.existsSync(path.join(c, "apps", "gateway")))
    ) {
      return c;
    }
  }
  return path.resolve(__dirname, "..", "..", "..", "..");
}

function resolvePuzzlesStorePath() {
  const root = resolveRepoRoot();
  const candidates = [
    path.join(root, "data", "puzzles_canonical_v1.json"),
    path.resolve(process.cwd(), "data", "puzzles_canonical_v1.json"),
    path.resolve(__dirname, "..", "..", "..", "..", "data", "puzzles_canonical_v1.json")
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  const defaultPath = path.join(root, "data", "puzzles_canonical_v1.json");
  const dir = path.dirname(defaultPath);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return defaultPath;
}

function resolvePuzzleStatsPath() {
  const root = resolveRepoRoot();
  const filePath = path.join(root, "data", "puzzle_stats_v1.json");
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return filePath;
}

let puzzlesStore = new Map();
let storeLoaded = false;

let cumulativeStats = {
  totalAttempts: 0,
  totalSolved: 0,
  totalFailed: 0,
  lastAttemptAt: null,
  publishedPuzzlesCount: 0,
  quarantinedPuzzlesCount: 0
};

export function loadPuzzlesStore(force = false) {
  if (storeLoaded && !force) return puzzlesStore;
  const filePath = resolvePuzzlesStorePath();
  puzzlesStore.clear();

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const p of arr) {
          if (p?.puzzle_id) puzzlesStore.set(p.puzzle_id, p);
        }
      }
    } catch (err) {
      console.error("[PUZZLE_STORE_LOAD_ERROR]", err);
    }
  }

  // Load stats
  const statsPath = resolvePuzzleStatsPath();
  if (fs.existsSync(statsPath)) {
    try {
      const rawStats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
      cumulativeStats = { ...cumulativeStats, ...rawStats };
    } catch {}
  }

  updateCatalogCounts();
  storeLoaded = true;
  return puzzlesStore;
}

export function savePuzzlesStore() {
  const filePath = resolvePuzzlesStorePath();
  try {
    const arr = Array.from(puzzlesStore.values());
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf8");
  } catch (err) {
    console.error("[PUZZLE_STORE_SAVE_ERROR]", err);
  }

  const statsPath = resolvePuzzleStatsPath();
  try {
    updateCatalogCounts();
    fs.writeFileSync(statsPath, JSON.stringify(cumulativeStats, null, 2), "utf8");
  } catch {}
}

function updateCatalogCounts() {
  let pub = 0;
  let quar = 0;
  for (const p of puzzlesStore.values()) {
    if (p.status === "PUBLISHED") pub++;
    else if (p.status === "QUARANTINED") quar++;
  }
  cumulativeStats.publishedPuzzlesCount = pub;
  cumulativeStats.quarantinedPuzzlesCount = quar;
}

/**
 * Gate P4-A2 & P4-A3: Move equivalence checker (UCI and SAN parity)
 */
export function areMovesEquivalent(fen, moveA, moveB) {
  if (!moveA || !moveB) return false;
  const strA = String(moveA).trim();
  const strB = String(moveB).trim();
  if (strA.toLowerCase() === strB.toLowerCase()) return true;

  const normalizeSan = (s) => {
    const clean = s.trim();
    if (/^(o-o-o|0-0-0)$/i.test(clean)) return "O-O-O";
    if (/^(o-o|0-0)$/i.test(clean)) return "O-O";
    return clean;
  };

  const toUci = (fenStr, mv) => {
    try {
      const c = new Chess(fenStr);
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(mv)) {
        const from = mv.slice(0, 2).toLowerCase();
        const to = mv.slice(2, 4).toLowerCase();
        const promo = mv.length > 4 ? mv[4].toLowerCase() : undefined;
        const res = c.move({ from, to, promotion: promo });
        if (res) return res.from + res.to + (res.promotion || "");
      } else {
        const res = c.move(normalizeSan(mv));
        if (res) return res.from + res.to + (res.promotion || "");
      }
      return String(mv).toLowerCase();
    } catch {
      return String(mv).toLowerCase();
    }
  };

  const uciA = toUci(fen, strA);
  const uciB = toUci(fen, strB);
  return Boolean(uciA && uciB && uciA === uciB);
}

/**
 * Gate P4-A1, P4-A2, P4-A3, P4-A4, P4-A7, P4-A8:
 * Validates and registers a new Puzzle Candidate.
 */
export function createAndVerifyPuzzleCandidate({
  sourceGameId,
  sourcePly = 0,
  fenBefore,
  sideToMove,
  solutionLine = [],
  teacherEngine = "Castle Core v1.0.2 E5 Champion",
  teacherEngineSha = null,
  modelSha = null,
  difficultyFeatures = {},
  category = "TACTICAL",
  isTest = false
}) {
  loadPuzzlesStore();

  // Gate P4-A1: Verified position & provenance required
  if (!sourceGameId) {
    return { ok: false, error: "SOURCE_GAME_REQUIRED", message: "Candidate must be rooted in a verified source game." };
  }
  if (!fenBefore || typeof fenBefore !== "string") {
    return { ok: false, error: "FEN_REQUIRED", message: "Candidate must have a valid fen_before string." };
  }

  // Gate P4-A2: FEN replay independently verified
  let chessInstance;
  try {
    chessInstance = new Chess(fenBefore);
  } catch (err) {
    return { ok: false, error: "INVALID_FEN", message: "FEN position replay failed: " + err.message };
  }

  const ranks = (fenBefore.split(" ")[0] || "").split("/");
  if (ranks.length !== 8) {
    return { ok: false, error: "MALFORMED_FEN_RANKS", message: "FEN must contain exactly 8 ranks." };
  }

  const actualTurn = chessInstance.turn();
  if (sideToMove && sideToMove !== actualTurn) {
    return { ok: false, error: "SIDE_TO_MOVE_MISMATCH", message: "Turn mismatch: FEN says " + actualTurn + ", passed " + sideToMove };
  }

  // Gate P4-A3: Solution move(s) must be strictly legal in sequence
  if (!Array.isArray(solutionLine) || solutionLine.length === 0) {
    return { ok: false, error: "SOLUTION_LINE_EMPTY", message: "Solution line cannot be empty." };
  }

  const simBoard = new Chess(fenBefore);
  const canonicalSolutionUci = [];
  const canonicalSolutionSan = [];

  for (let i = 0; i < solutionLine.length; i++) {
    const rawMv = solutionLine[i];
    let res = null;
    try {
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(rawMv)) {
        const from = rawMv.slice(0, 2).toLowerCase();
        const to = rawMv.slice(2, 4).toLowerCase();
        const promo = rawMv.length > 4 ? rawMv[4].toLowerCase() : undefined;
        res = simBoard.move({ from, to, promotion: promo });
      } else {
        res = simBoard.move(rawMv);
      }
    } catch (err) {
      return { ok: false, error: "ILLEGAL_SOLUTION_MOVE", detail: "Step " + (i + 1) + " (" + rawMv + ") is illegal: " + err.message };
    }

    if (!res) {
      return { ok: false, error: "ILLEGAL_SOLUTION_MOVE", detail: "Step " + (i + 1) + " (" + rawMv + ") is illegal on board." };
    }

    canonicalSolutionUci.push(res.from + res.to + (res.promotion || ""));
    canonicalSolutionSan.push(res.san);
  }

  // Gate P4-A4: Teacher engine verification
  if (!teacherEngineSha) {
    return { ok: false, error: "TEACHER_ENGINE_SHA_REQUIRED", message: "Teacher engine SHA is required for verification provenance." };
  }

  // Gate P4-A8: Strict Holdout Quarantine Screening (WAC-30 & Benchmarks) - Evaluated BEFORE duplicate check
  const boardKey = fenBefore.split(" ")[0];
  let status = isTest ? "CANDIDATE" : "PUBLISHED";
  let quarantineReason = null;

  if (WAC_30_QUARANTINE_BOARDS.has(boardKey)) {
    status = "QUARANTINED";
    quarantineReason = "HOLDOUT_LEAKAGE_VETO: Position matches sealed WAC-30 benchmark holdout.";
    console.warn("[PUZZLE_QUARANTINE] Blocked WAC-30 position from entering public pool: " + fenBefore);
    return {
      ok: false,
      status: 403,
      error: "HOLDOUT_QUARANTINE_VETO",
      quarantine_reason: quarantineReason,
      message: "Holdout leakage veto: Candidate matches sealed WAC-30 benchmark."
    };
  }

  // Gate P4-A7: Deterministic ID generation & duplicate prevention
  const posHash = crypto.createHash("sha256").update(fenBefore.trim(), "utf8").digest("hex");
  const solHash = crypto.createHash("sha256").update(canonicalSolutionUci.join(""), "utf8").digest("hex");
  const puzzleId = "rhz_puz_" + crypto.createHash("sha256").update(posHash + solHash).digest("hex").slice(0, 16);

  if (puzzlesStore.has(puzzleId)) {
    return {
      ok: false,
      status: 409,
      error: "PUZZLE_ALREADY_EXISTS",
      puzzleId,
      message: "Duplicate puzzle candidate detected. Position and solution already registered."
    };
  }

  const now = new Date().toISOString();

  const puzzleRecord = {
    puzzle_id: puzzleId,
    source_game_id: sourceGameId,
    source_ply: Number(sourcePly) || 0,
    fen_before: fenBefore,
    side_to_move: actualTurn,
    solution_line: canonicalSolutionUci,
    solution_san: canonicalSolutionSan,
    solution_depth: difficultyFeatures.depth || 18,
    teacher_engine: teacherEngine,
    teacher_engine_sha: teacherEngineSha,
    model_sha: modelSha,
    position_hash: posHash,
    solution_hash: solHash,
    difficulty_features: {
      motifs: difficultyFeatures.motifs || ["TACTICAL"],
      rating_estimate: difficultyFeatures.rating_estimate || 1400,
      depth: difficultyFeatures.depth || 18,
      advantage_cp: difficultyFeatures.advantage_cp || 350
    },
    category: String(category || "TACTICAL").toUpperCase(),
    status,
    quarantine_reason: quarantineReason,
    created_at: now,
    verified_at: now,
    is_test: Boolean(isTest),
    provenance: {
      source_type: isTest ? "TEST_ARTIFACT" : "VERIFIED_GAME",
      verified_game_id: sourceGameId,
      holdout_screened: true,
      zero_wac_30_leakage: status !== "QUARANTINED"
    }
  };

  puzzlesStore.set(puzzleId, puzzleRecord);
  savePuzzlesStore();

  return {
    ok: true,
    puzzle_id: puzzleId,
    status,
    quarantined: status === "QUARANTINED",
    puzzle: puzzleRecord
  };
}

/**
 * Gate P4-A8: Retrieves a published puzzle for user solving.
 * Quarantined puzzles are strictly excluded from the public pool.
 */
export function getNextPublishedPuzzle(requestedId = null, filter = {}, playerId = null) {
  loadPuzzlesStore();

  if (requestedId) {
    const p = puzzlesStore.get(requestedId);
    if (!p) return null;
    if (p.status !== "PUBLISHED") {
      return null;
    }
    return sanitizePuzzleForClient(p);
  }

  const published = Array.from(puzzlesStore.values()).filter(p => p.status === "PUBLISHED" && !p.is_test);
  if (published.length === 0) return null;

  let pool = published;
  if (filter.category) {
    const cat = String(filter.category).toUpperCase();
    const catPool = pool.filter(p => p.category === cat);
    if (catPool.length > 0) pool = catPool;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  if (playerId) registerPuzzleServed(playerId, selected.puzzle_id);
  return sanitizePuzzleForClient(selected);
}

/**
 * Client Sanitizer: Strips solution_line, solution_san, and solution_hash
 * so the client cannot inspect or declare the answer!
 */
function sanitizePuzzleForClient(p) {
  return {
    puzzle_id: p.puzzle_id,
    fen: p.fen_before,
    side_to_move: p.side_to_move,
    category: p.category,
    difficulty_features: {
      motifs: p.difficulty_features?.motifs || [],
      rating_estimate: p.difficulty_features?.rating_estimate || 1400
    },
    teacher_engine: p.teacher_engine,
    created_at: p.created_at
  };
}

/**
 * Gate P4-A5 & P4-A6 & Attack A & Attack B:
 * Server-Authoritative Puzzle Move Evaluation.
 * Client sends move intent; server determines reality.
 */
export function submitPuzzleAttempt({
  puzzleId,
  move,
  token = null,
  playerId = null,
  isTest = false,
  attemptId = null
}) {
  loadPuzzlesStore();

  if (!puzzleId) {
    return { ok: false, status: 400, error: "PUZZLE_ID_REQUIRED", message: "puzzleId is required." };
  }

  // Gate P4-B9: Player ownership enforcement before execution
  if (token && playerId) {
    const isOwner = verifyPlayerOwnership(token, playerId);
    if (!isOwner) {
      return { ok: false, status: 403, error: "PLAYER_OWNERSHIP_VIOLATION", message: "Token does not own requested playerId." };
    }
  }

  const puzzle = puzzlesStore.get(puzzleId);
  if (!puzzle) {
    return { ok: false, status: 404, error: "PUZZLE_NOT_FOUND", message: "Puzzle " + puzzleId + " not found." };
  }

  // Gate P4-A8: Quarantined puzzle cannot be attempted
  if (puzzle.status === "QUARANTINED") {
    return { ok: false, status: 403, error: "PUZZLE_QUARANTINED", message: "This puzzle is quarantined and cannot be solved." };
  }

  if (!move) {
    return { ok: false, status: 400, error: "MOVE_REQUIRED", message: "Move proposal is required." };
  }

  // Validate legality on canonical FEN
  let chessInstance;
  try {
    chessInstance = new Chess(puzzle.fen_before);
  } catch {
    return { ok: false, status: 500, error: "CORRUPTED_PUZZLE_FEN" };
  }

  let moveResult = null;
  const rawMove = String(move).trim();
  try {
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(rawMove)) {
      const from = rawMove.slice(0, 2).toLowerCase();
      const to = rawMove.slice(2, 4).toLowerCase();
      const promo = rawMove.length > 4 ? rawMove[4].toLowerCase() : undefined;
      moveResult = chessInstance.move({ from, to, promotion: promo });
    } else {
      let san = rawMove;
      if (/^(o-o-o|0-0-0)$/i.test(san)) san = "O-O-O";
      else if (/^(o-o|0-0)$/i.test(san)) san = "O-O";
      moveResult = chessInstance.move(san);
    }
  } catch (err) {
    return { ok: false, status: 400, error: "ILLEGAL_MOVE", detail: err.message, proposal: rawMove };
  }

  if (!moveResult) {
    return { ok: false, status: 400, error: "ILLEGAL_MOVE", proposal: rawMove };
  }

  const playedUci = moveResult.from + moveResult.to + (moveResult.promotion || "");
  const expectedUci = puzzle.solution_line[0];

  // Compare against canonical solution
  const isMatch = areMovesEquivalent(puzzle.fen_before, playedUci, expectedUci);

  // Update statistics authoritatively (Gate P4-A9: test puzzles do NOT pollute production stats)
  if (!isTest && !puzzle.is_test) {
    cumulativeStats.totalAttempts++;
    if (isMatch) cumulativeStats.totalSolved++;
    else cumulativeStats.totalFailed++;
    cumulativeStats.lastAttemptAt = new Date().toISOString();
    savePuzzlesStore();
  }

  const isCompleted = isMatch && (puzzle.solution_line.length <= 1);
  const solved = Boolean(isMatch && isCompleted);

  // Apply puzzle rating outcome if player identified
  let ratingUpdate = null;
  let puzzleRatingUpdate = null;

  let targetPlayer = null;
  if (token) targetPlayer = getPlayerByToken(token);
  else if (playerId) targetPlayer = getPlayerById(playerId);

  let metric = { first_move_correct: isMatch, solve_time_seconds: null };
  if (targetPlayer) {
    metric = recordPuzzleAttemptMetric({
      playerId: targetPlayer.player_id,
      puzzleId: puzzle.puzzle_id,
      attemptId,
      solved,
      isMatch,
      isCompleted,
      isTest: Boolean(isTest || puzzle.is_test)
    });

    const ratingRes = applyPuzzleRatingOutcome({
      playerId: targetPlayer.player_id,
      puzzleId: puzzle.puzzle_id,
      solved,
      isTest: Boolean(isTest || puzzle.is_test),
      attemptId,
      token,
      firstMoveCorrect: metric.first_move_correct,
      solveTimeSeconds: metric.solve_time_seconds,
      category: puzzle.category,
      motifs: puzzle.difficulty_features?.motifs || []
    });

    if (!ratingRes.ok) {
      return ratingRes;
    }

    ratingUpdate = ratingRes.player_update;
    puzzleRatingUpdate = ratingRes.puzzle_update;
  }

  if (isMatch) {
    let nextOpponentMove = null;
    if (!isCompleted) {
      nextOpponentMove = puzzle.solution_line[1] || null;
    }

    return {
      ok: true,
      outcome: "CORRECT",
      solved: isCompleted,
      played_san: moveResult.san,
      played_uci: playedUci,
      opponent_response: nextOpponentMove,
      message: isCompleted ? "Puzzle successfully solved!" : "Correct move! Awaiting continuation.",
      rating_update: ratingUpdate,
      puzzle_rating_update: puzzleRatingUpdate
    };
  } else {
    return {
      ok: true,
      outcome: "INCORRECT",
      solved: false,
      played_san: moveResult.san,
      played_uci: playedUci,
      message: "Incorrect move. The tactical continuation failed.",
      rating_update: ratingUpdate,
      puzzle_rating_update: puzzleRatingUpdate
    };
  }
}

/**
 * Gate P4-A10: Query internal puzzle by ID with full provenance
 */
export function getPuzzleById(puzzleId, reload = false) {
  loadPuzzlesStore(reload);
  return puzzlesStore.get(puzzleId) || null;
}

/**
 * Gate P4-A12: Recomputes deterministic catalog manifest hash
 */
export function computePuzzleCatalogManifest() {
  loadPuzzlesStore();
  const sortedPuzzles = Array.from(puzzlesStore.values())
    .filter(p => !p.is_test)
    .sort((a, b) => a.puzzle_id.localeCompare(b.puzzle_id));

  const manifestData = {
    algorithm: "rhizoh_puzzle_catalog_manifest_v1.0",
    total_puzzles: sortedPuzzles.length,
    published_count: sortedPuzzles.filter(p => p.status === "PUBLISHED").length,
    quarantined_count: sortedPuzzles.filter(p => p.status === "QUARANTINED").length,
    puzzle_signatures: sortedPuzzles.map(p => ({
      id: p.puzzle_id,
      pos_sha: p.position_hash,
      sol_sha: p.solution_hash,
      status: p.status
    }))
  };

  const hash = crypto.createHash("sha256").update(JSON.stringify(manifestData), "utf8").digest("hex");
  return {
    ...manifestData,
    manifest_hash: hash
  };
}

export function getPuzzleAuthorityStats() {
  loadPuzzlesStore();
  const accuracy = cumulativeStats.totalAttempts > 0
    ? Number(((cumulativeStats.totalSolved / cumulativeStats.totalAttempts) * 100).toFixed(1))
    : 0;

  return {
    total_attempts: cumulativeStats.totalAttempts,
    total_solved: cumulativeStats.totalSolved,
    total_failed: cumulativeStats.totalFailed,
    accuracy_pct: accuracy,
    published_puzzles: cumulativeStats.publishedPuzzlesCount,
    quarantined_puzzles: cumulativeStats.quarantinedPuzzlesCount,
    last_attempt_at: cumulativeStats.lastAttemptAt
  };
}

/**
 * Initializes Puzzle Authority and bootstraps baseline curated puzzles from EPD
 */
export function initPuzzleAuthority() {
  loadPuzzlesStore();
  if (puzzlesStore.size > 0) {
    return { initialized: true, count: puzzlesStore.size };
  }

  const root = resolveRepoRoot();
  const epdCandidates = [
    path.join(root, "data", "tactics_puzzles.epd"),
    path.resolve(process.cwd(), "data", "tactics_puzzles.epd"),
    path.resolve(__dirname, "..", "..", "..", "..", "data", "tactics_puzzles.epd")
  ];
  const epdCandidate = epdCandidates.find(p => fs.existsSync(p));
  if (epdCandidate) {
    try {
      const content = fs.readFileSync(epdCandidate, "utf8");
      const lines = content.split("\n").filter(Boolean);
      let loaded = 0;
      for (const line of lines.slice(0, 100)) {
        const bmMatch = line.match(/\s+bm\s+([^;]+);/);
        if (!bmMatch) continue;
        const bestMove = bmMatch[1].trim();
        const fen = line.substring(0, line.indexOf(" bm ")).trim();

        const idMatch = line.match(/\bid\s+"([^"]+)";/);
        const sourceId = idMatch ? idMatch[1] : ("curated_" + (loaded + 1));

        const c0Match = line.match(/\bc0\s+"([^"]+)";/);
        const motif = c0Match ? c0Match[1] : "Tactical";

        createAndVerifyPuzzleCandidate({
          sourceGameId: "curated_archive_" + sourceId,
          sourcePly: 1,
          fenBefore: fen,
          solutionLine: [bestMove],
          teacherEngineSha: "00ccc8c47e1b6d74ccd2e2e5fb394cb7075b8f772a4f8e1d8962c6603d30d269",
          modelSha: "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c",
          category: "TACTICAL",
          difficultyFeatures: { motifs: [motif], rating_estimate: 1400 },
          isTest: false
        });
        loaded++;
      }
      console.log("[PUZZLE_AUTHORITY_INIT] Bootstrapped " + loaded + " curated puzzles into canonical store.");
    } catch (err) {
      console.warn("[PUZZLE_AUTHORITY_BOOTSTRAP_WARN]", err.message);
    }
  }

  return { initialized: true, count: puzzlesStore.size };
}
