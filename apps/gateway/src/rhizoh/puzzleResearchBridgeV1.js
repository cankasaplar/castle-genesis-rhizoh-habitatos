/**
 * Rhizoh Phase 4 - P4-E: Research Bridge
 * 
 * Bridges verified human puzzle behavior into clean, auditable Research Candidates.
 * 
 * Core Invariants:
 * 1. P4-E CAN NEVER modify E5 Champion binary, A50 NNUE weights, WAC-30 holdout, or promotion gates.
 * 2. 3 Data Channels:
 *    - Channel A: Human Decision (first move intent separate from retries)
 *    - Channel B: Human Error Anatomy (server-classified error taxonomy)
 *    - Channel C: Outcome & Difficulty Context
 * 3. Privacy Firewall: ZERO raw player_id, tokens, or PII. Pseudonymous subject ID only.
 * 4. Holdout Firewall: Zero WAC-30 / benchmark leakage.
 * 5. Destination Isolation: Writes strictly to data/research_candidates/
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import {
  getPuzzleById,
  WAC_30_QUARANTINE_BOARDS,
  computePuzzleCatalogManifest
} from "./puzzleAuthorityV1.js";
import { verifyPlayerOwnership, getPlayerById, getPlayerByToken } from "./playerIdentityStoreV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_DATASET_VERSION = "rhizoh_research_dataset_v1.0";
export const CANONICAL_TEACHER_SHA = "00ccc8c47e1b6d74ccd2e2e5fb394cb7075b8f772a4f8e1d8962c6603d30d269";
export const CANONICAL_MODEL_SHA = "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c";

const RESEARCH_PSEUDONYM_SALT = "rhz_research_salt_v1_9a2f7c4e8b1d";

function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(process.cwd(), ".."),
    process.cwd(),
    "/home/castle/castle"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "data", "event_ledger.jsonl"))) {
      return c;
    }
  }
  return process.platform === "win32" ? path.resolve(__dirname, "..", "..", "..", "..") : "/home/castle/castle";
}

function resolveResearchDir() {
  const root = resolveRepoRoot();
  const dir = path.join(root, "data", "research_candidates");
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return dir;
}

function resolveCandidatesFile() {
  return path.join(resolveResearchDir(), "research_candidates_v1.jsonl");
}

function resolveManifestFile() {
  return path.join(resolveResearchDir(), "research_dataset_manifest_v1.json");
}

// In-memory candidate registry (indexed by candidate_id and attempt_id)
const researchCandidatesStore = new Map();
const seenAttempts = new Set();
let storeLoaded = false;

/**
 * Gate E13: Privacy Firewall
 * Derives a deterministic pseudonymous research subject ID without PII
 */
export function derivePseudonymousSubjectId(playerId) {
  if (!playerId || typeof playerId !== "string") {
    return "sub_anonymous";
  }
  const hmac = crypto.createHmac("sha256", RESEARCH_PSEUDONYM_SALT);
  hmac.update(playerId.trim());
  return "rhz_sub_" + hmac.digest("hex").slice(0, 16);
}

/**
 * Gate E5 & E4: Holdout Quarantine Check
 */
export function isPositionQuarantined(fen) {
  if (!fen || typeof fen !== "string") return false;
  const boardKey = fen.trim().split(" ")[0];
  return WAC_30_QUARANTINE_BOARDS.has(boardKey);
}

/**
 * Gate E11 & Channel B: Server-Authoritative Human Error Anatomy Classifier
 */
export function classifyHumanError({ fenBefore, humanMoveUci, canonicalMoveUci }) {
  const chess = new Chess(fenBefore);

  let from = humanMoveUci.slice(0, 2);
  let to = humanMoveUci.slice(2, 4);
  let promo = humanMoveUci.length > 4 ? humanMoveUci[4] : undefined;

  let moveObj;
  try {
    moveObj = chess.move({ from, to, promotion: promo });
  } catch {
    return {
      error_type: "TACTICAL_BLINDNESS",
      detail: "Illegal or unparseable attempt on board."
    };
  }

  // Canonical move analysis
  const chessCanonical = new Chess(fenBefore);
  let cFrom = canonicalMoveUci.slice(0, 2);
  let cTo = canonicalMoveUci.slice(2, 4);
  let cPromo = canonicalMoveUci.length > 4 ? canonicalMoveUci[4] : undefined;
  let canonicalMoveObj = null;
  try {
    canonicalMoveObj = chessCanonical.move({ from: cFrom, to: cTo, promotion: cPromo });
  } catch {}

  const canonicalGivesCheck = chessCanonical.inCheck();
  const canonicalGivesMate = chessCanonical.isCheckmate();
  const humanGivesCheck = chess.inCheck();

  // 1. Missed Check / Missed Mate
  if (canonicalGivesMate && !humanGivesCheck) {
    return {
      error_type: "MISSED_MATE",
      detail: "Failed to play the forcing checkmate line."
    };
  }
  if (canonicalGivesCheck && !humanGivesCheck) {
    return {
      error_type: "MISSED_CHECK",
      detail: "Failed to identify the critical forcing checking move."
    };
  }

  // 2. Wrong Capture
  if (moveObj.captured && canonicalMoveObj && canonicalMoveObj.captured) {
    if (moveObj.to !== canonicalMoveObj.to) {
      return {
        error_type: "WRONG_CAPTURE",
        detail: `Captured piece on ${moveObj.to} instead of tactical target on ${canonicalMoveObj.to}.`
      };
    }
  }

  // 3. Blunder Hanging Piece: Moved piece into immediate capture with no compensation
  const oppMoves = chess.moves({ verbose: true });
  const isTargetHanging = oppMoves.some(m => m.to === to && m.captured);
  if (isTargetHanging && !moveObj.captured) {
    return {
      error_type: "BLUNDER_HANGING_PIECE",
      detail: `Moved ${moveObj.piece.toUpperCase()} to ${to} where it can be captured with negative swing.`
    };
  }

  // 4. Defensive Resource Missed: Opponent has severe threat that human didn't address
  const chessOrig = new Chess(fenBefore);
  // Flip turn to see opponent's immediate threats
  const tokens = fenBefore.split(" ");
  tokens[1] = tokens[1] === "w" ? "b" : "w";
  tokens[3] = "-"; // clear en passant
  try {
    const oppThreatChess = new Chess(tokens.join(" "));
    const oppCaptures = oppThreatChess.moves({ verbose: true }).filter(m => m.captured === "q" || m.san.includes("#"));
    if (oppCaptures.length > 0 && !humanGivesCheck) {
      return {
        error_type: "DEFENSIVE_RESOURCE_MISSED",
        detail: "Ignored critical opponent mating threat or queen capture."
      };
    }
  } catch {}

  // 5. Premature Attack: Attacked without tactical support
  if (moveObj.piece === "q" || moveObj.piece === "r") {
    return {
      error_type: "PREMATURE_ATTACK",
      detail: "Premature piece activity lacking necessary tactical support."
    };
  }

  // Default tactical classification
  return {
    error_type: "TACTICAL_BLINDNESS",
    detail: "Failed to perceive the tactical refutation and decisive advantage."
  };
}

/**
 * Gate E15 & E16: Load and persist research candidates
 */
export function loadResearchCandidates(force = false) {
  if (storeLoaded && !force) return researchCandidatesStore;
  const filePath = resolveCandidatesFile();
  researchCandidatesStore.clear();
  seenAttempts.clear();

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec?.candidate_id) {
            researchCandidatesStore.set(rec.candidate_id, rec);
            if (rec.source_attempt_id) seenAttempts.add(rec.source_attempt_id);
          }
        } catch {}
      }
    } catch (err) {
      console.error("[RESEARCH_BRIDGE_LOAD_ERROR]", err);
    }
  }
  storeLoaded = true;
  return researchCandidatesStore;
}

function appendResearchCandidateToFile(candidate) {
  try {
    const filePath = resolveCandidatesFile();
    fs.appendFileSync(filePath, JSON.stringify(candidate) + "\n", "utf8");
  } catch (err) {
    console.error("[RESEARCH_CANDIDATE_APPEND_ERROR]", err);
  }
}

/**
 * Gate E1 to E13: Ingest a verified human attempt into the Research Candidate dataset
 */
export function ingestResearchCandidate({
  puzzleId,
  attemptId,
  move,
  token = null,
  playerId = null,
  isTest = false,
  source = null,
  solveTimeSeconds = null,
  attemptNumber = 1
}) {
  loadResearchCandidates();

  // Gate E3: Test & Reality Audit Firewall
  if (isTest || source === "reality_audit" || source === "REALITY_AUDIT_TEST") {
    return {
      ok: false,
      status: 403,
      error: "TEST_ATTEMPT_REJECTED",
      message: "Test and audit attempts are strictly forbidden from polluting the Research Dataset."
    };
  }

  // Gate E1: Must be a published puzzle in Canonical Catalog
  if (!puzzleId) {
    return { ok: false, status: 400, error: "PUZZLE_ID_REQUIRED", message: "puzzleId is required." };
  }
  const puzzle = getPuzzleById(puzzleId, true);
  if (!puzzle) {
    return { ok: false, status: 404, error: "PUZZLE_NOT_FOUND", message: "Puzzle " + puzzleId + " not found." };
  }
  if (puzzle.status !== "PUBLISHED") {
    return {
      ok: false,
      status: 403,
      error: "PUZZLE_NOT_PUBLISHED",
      message: "Only PUBLISHED canonical puzzles may generate research candidates."
    };
  }

  // Gate E4 & E5: Holdout / Quarantine Firewall
  if (puzzle.quarantined || puzzle.status === "QUARANTINED" || isPositionQuarantined(puzzle.fen_before)) {
    return {
      ok: false,
      status: 403,
      error: "HOLDOUT_QUARANTINE_VETO",
      message: "Holdout leakage veto: Quarantined benchmark puzzle cannot enter research dataset."
    };
  }

  // Gate E6: Player identity & ownership verification
  let resolvedPlayer = null;
  if (token) {
    resolvedPlayer = getPlayerByToken(token);
    if (!resolvedPlayer) {
      return { ok: false, status: 401, error: "INVALID_PLAYER_TOKEN", message: "Provided player token is invalid." };
    }
    if (playerId && resolvedPlayer.player_id !== playerId) {
      const isOwner = verifyPlayerOwnership(token, playerId);
      if (!isOwner) {
        return { ok: false, status: 403, error: "PLAYER_OWNERSHIP_VIOLATION", message: "Token does not own requested playerId." };
      }
    }
  } else if (playerId) {
    resolvedPlayer = getPlayerById(playerId);
  }

  if (!resolvedPlayer) {
    return { ok: false, status: 400, error: "PLAYER_IDENTITY_REQUIRED", message: "Verified player identity is required." };
  }

  // Gate E12: Duplicate Candidate Rejection
  const rawAttemptId = attemptId || `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (seenAttempts.has(rawAttemptId)) {
    return {
      ok: false,
      status: 409,
      error: "DUPLICATE_RESEARCH_CANDIDATE",
      attempt_id: rawAttemptId,
      message: "Research candidate for this attempt already ingested."
    };
  }

  // Gate E7: Canonical FEN Validation
  let chessInstance;
  try {
    chessInstance = new Chess(puzzle.fen_before);
  } catch (err) {
    return { ok: false, status: 500, error: "CORRUPTED_PUZZLE_FEN", detail: err.message };
  }

  // Gate E10: Human Move Legality Validation
  const rawMove = String(move || "").trim();
  if (!rawMove) {
    return { ok: false, status: 400, error: "MOVE_REQUIRED", message: "Proposed move is required." };
  }

  let moveResult = null;
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
    return { ok: false, status: 400, error: "ILLEGAL_HUMAN_MOVE", detail: err.message, proposal: rawMove };
  }

  if (!moveResult) {
    return { ok: false, status: 400, error: "ILLEGAL_HUMAN_MOVE", proposal: rawMove };
  }

  const humanMoveUci = moveResult.from + moveResult.to + (moveResult.promotion || "");
  const canonicalMoveUci = puzzle.solution_line[0];

  // Gate E8: Canonical Solution Comparison
  const isFirstMoveCorrect = humanMoveUci.toLowerCase() === canonicalMoveUci.toLowerCase();
  const isSolved = isFirstMoveCorrect && (puzzle.solution_line.length <= 1);

  // Gate E13: Privacy Firewall - pseudonymous subject ID
  const researchSubjectId = derivePseudonymousSubjectId(resolvedPlayer.player_id);

  // Channel A: Human Decision Record
  const posHash = puzzle.position_hash || crypto.createHash("sha256").update(puzzle.fen_before.trim(), "utf8").digest("hex");
  const channelA = {
    position_hash: posHash,
    research_subject_id: researchSubjectId,
    puzzle_id: puzzle.puzzle_id,
    first_move: humanMoveUci,
    first_move_san: moveResult.san,
    canonical_move: canonicalMoveUci,
    canonical_move_san: puzzle.solution_san?.[0] || "",
    first_move_correct: isFirstMoveCorrect,
    puzzle_rating: puzzle.difficulty_features?.rating_estimate || 1400,
    player_puzzle_rating: resolvedPlayer.puzzle_rating || 1500
  };

  // Channel B: Human Error Anatomy Record (if incorrect)
  let channelB = null;
  if (!isFirstMoveCorrect) {
    const errorAnalysis = classifyHumanError({
      fenBefore: puzzle.fen_before,
      humanMoveUci,
      canonicalMoveUci
    });
    channelB = {
      error_type: errorAnalysis.error_type,
      detail: errorAnalysis.detail,
      blunder_uci: humanMoveUci,
      blunder_san: moveResult.san,
      canonical_uci: canonicalMoveUci,
      canonical_san: puzzle.solution_san?.[0] || ""
    };
  }

  // Channel C: Outcome & Difficulty Context
  const channelC = {
    solved: isSolved,
    first_move_correct: isFirstMoveCorrect,
    attempt_number: Number(attemptNumber) || 1,
    solve_time_seconds: typeof solveTimeSeconds === "number" ? solveTimeSeconds : null,
    player_puzzle_rating: resolvedPlayer.puzzle_rating || 1500,
    puzzle_rating: puzzle.difficulty_features?.rating_estimate || 1400,
    rating_delta: isSolved ? 12 : -10,
    category: puzzle.category || "TACTICAL",
    motifs: puzzle.difficulty_features?.motifs || [],
    branching_factor: new Chess(puzzle.fen_before).moves().length,
    tactical_swing_cp: puzzle.difficulty_features?.tactical_swing_cp || 300,
    advantage_cp: puzzle.difficulty_features?.advantage_cp || 350
  };

  // Deterministic Candidate ID: rhz_rcand_<hash>
  const catalogManifest = computePuzzleCatalogManifest();
  const signatureInput = [
    puzzle.puzzle_id,
    posHash,
    humanMoveUci,
    researchSubjectId,
    rawAttemptId
  ].join(":");
  const candidateId = "rhz_rcand_" + crypto.createHash("sha256").update(signatureInput).digest("hex").slice(0, 16);

  const candidateRecord = {
    candidate_id: candidateId,
    dataset_version: CANONICAL_DATASET_VERSION,
    source_game_id: puzzle.source_game_id || "curated_archive",
    source_puzzle_id: puzzle.puzzle_id,
    source_attempt_id: rawAttemptId,
    position_hash: posHash,
    solution_hash: puzzle.solution_hash,
    research_subject_id: researchSubjectId,
    teacher_engine_sha: puzzle.teacher_engine_sha || CANONICAL_TEACHER_SHA,
    model_sha: puzzle.model_sha || CANONICAL_MODEL_SHA,
    puzzle_catalog_manifest_sha: catalogManifest.manifest_hash,
    timestamp: new Date().toISOString(),
    channel_a: channelA,
    channel_b: channelB,
    channel_c: channelC,
    verified_human_action: true
  };

  researchCandidatesStore.set(candidateId, candidateRecord);
  seenAttempts.add(rawAttemptId);
  appendResearchCandidateToFile(candidateRecord);

  // Update dataset manifest
  updateResearchDatasetManifest();

  return {
    ok: true,
    candidate_id: candidateId,
    research_subject_id: researchSubjectId,
    outcome: isFirstMoveCorrect ? "CORRECT" : "INCORRECT",
    error_type: channelB?.error_type || null,
    first_move_correct: isFirstMoveCorrect,
    candidate: candidateRecord
  };
}

/**
 * Gate E15: Recompute deterministic research dataset manifest
 */
export function updateResearchDatasetManifest() {
  loadResearchCandidates();
  const allCandidates = Array.from(researchCandidatesStore.values());
  const subjects = new Set(allCandidates.map(c => c.research_subject_id));

  let solved = 0;
  let firstMoveCorrect = 0;
  for (const c of allCandidates) {
    if (c.channel_c?.solved) solved++;
    if (c.channel_a?.first_move_correct) firstMoveCorrect++;
  }

  const accuracy = allCandidates.length > 0
    ? Number(((firstMoveCorrect / allCandidates.length) * 100).toFixed(1))
    : 0;

  // Compute dataset deterministic hash
  const sortedIds = allCandidates.map(c => c.candidate_id).sort();
  const datasetHash = crypto.createHash("sha256").update(sortedIds.join(","), "utf8").digest("hex");

  const manifest = {
    algorithm: "rhizoh_research_dataset_manifest_v1.0",
    dataset_version: CANONICAL_DATASET_VERSION,
    total_candidates: allCandidates.length,
    unique_subjects_count: subjects.size,
    total_solved: solved,
    total_failed: allCandidates.length - solved,
    first_move_accuracy_pct: accuracy,
    dataset_hash: datasetHash,
    teacher_engine_sha: CANONICAL_TEACHER_SHA,
    model_sha: CANONICAL_MODEL_SHA,
    last_updated: new Date().toISOString()
  };

  try {
    fs.writeFileSync(resolveManifestFile(), JSON.stringify(manifest, null, 2), "utf8");
  } catch {}

  return manifest;
}

export function listResearchCandidates(limit = 100) {
  loadResearchCandidates();
  const arr = Array.from(researchCandidatesStore.values());
  return arr.slice(-limit);
}

export function getResearchCandidateById(candidateId) {
  loadResearchCandidates();
  return researchCandidatesStore.get(candidateId) || null;
}

export function getResearchDatasetManifest() {
  const filePath = resolveManifestFile();
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {}
  }
  return updateResearchDatasetManifest();
}

export function clearResearchCandidates() {
  researchCandidatesStore.clear();
  seenAttempts.clear();
  try {
    const file = resolveCandidatesFile();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
  updateResearchDatasetManifest();
}
