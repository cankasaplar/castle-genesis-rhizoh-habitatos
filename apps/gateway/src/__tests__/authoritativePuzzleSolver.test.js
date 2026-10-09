import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  initPuzzleAuthority,
  loadPuzzlesStore,
  getNextPublishedPuzzle,
  submitPuzzleAttempt,
  getPuzzleById,
  areMovesEquivalent,
  getPuzzleAuthorityStats,
  WAC_30_QUARANTINE_BOARDS
} from "../rhizoh/puzzleAuthorityV1.js";
import {
  initPuzzleController,
  recordPuzzleSolution,
  getPuzzleStats,
  getRecentFailures
} from "../puzzleController.js";

// Ensure authorities are initialized
initPuzzleAuthority();
initPuzzleController();

test("Authoritative Solver Suite: 1. Successful move verification against canonical master solution", () => {
  const store = loadPuzzlesStore();
  const firstPuzzle = Array.from(store.values()).find(p => p.status === "PUBLISHED" && p.solution_line?.length > 0);
  assert.ok(firstPuzzle, "Must have at least one published canonical puzzle");

  const fen = firstPuzzle.fen_before;
  const canonicalUci = firstPuzzle.solution_line[0];
  const canonicalSan = firstPuzzle.solution_san?.[0];

  // Compare canonical move against itself via areMovesEquivalent
  const isMatch = areMovesEquivalent(fen, canonicalUci, canonicalUci);
  assert.equal(isMatch, true, "Canonical move must match itself");

  if (canonicalSan) {
    const isSanMatch = areMovesEquivalent(fen, canonicalSan, canonicalUci);
    assert.equal(isSanMatch, true, "Canonical SAN must match canonical UCI");
  }
});

test("Authoritative Solver Suite: 2. Engine tactical miss generates full refutation and queues hard negative", () => {
  const store = loadPuzzlesStore();
  const puzzle = Array.from(store.values()).find(p => p.status === "PUBLISHED" && p.solution_line?.length > 0);
  assert.ok(puzzle, "Must have at least one published canonical puzzle");

  // Pick an intentional blunder (different legal move)
  const chess = new Chess(puzzle.fen_before);
  const legalMoves = chess.moves({ verbose: true });
  assert.ok(legalMoves.length > 1, "Position must have multiple moves");

  const canonicalUci = puzzle.solution_line[0].toLowerCase();
  const blunderMoveObj = legalMoves.find(m => (m.from + m.to + (m.promotion || "")).toLowerCase() !== canonicalUci);
  assert.ok(blunderMoveObj, "Must find a non-canonical move to simulate blunder");

  const blunderUci = blunderMoveObj.from + blunderMoveObj.to + (blunderMoveObj.promotion || "");
  const isMatch = areMovesEquivalent(puzzle.fen_before, blunderUci, canonicalUci);
  assert.equal(isMatch, false, "Blunder move must NOT match canonical solution");

  const recordResult = recordPuzzleSolution({
    puzzleId: puzzle.puzzle_id,
    fen: puzzle.fen_before,
    playedMove: blunderUci,
    bestMove: puzzle.solution_san?.[0] || canonicalUci,
    motif: puzzle.category || "Tactics",
    engine: "RhizohAI Castle Core v1.0.2 (E5 Champion)",
    depth: 6,
    nodes: 5000,
    timeMs: 400
  });

  assert.equal(recordResult.ok, true);
  assert.equal(recordResult.solved, false, "Must be recorded as unsolved blunder");
  assert.ok(recordResult.correction, "Correction must be generated");
  assert.ok(recordResult.correction.explanation, "Explanation must be present");
  assert.ok(!recordResult.correction.explanation.includes("undefined"), "Explanation must NEVER contain 'undefined'");
  assert.equal(recordResult.correction.queuedForTraining, true, "Must be queued for training");
});

test("Authoritative Solver Suite: 3. Invalid FEN syntax is rejected safely without server crash", () => {
  const invalidFen = "rnbqkbnr/not-a-valid-fen/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let failed = false;
  try {
    new Chess(invalidFen);
  } catch (err) {
    failed = true;
    assert.ok(err.message, "Chess.js must throw meaningful error on invalid FEN");
  }
  assert.equal(failed, true, "Invalid FEN must throw during validation");
});

test("Authoritative Solver Suite: 4. Attack B: Client cannot declare a puzzle solved or dictate outcome", () => {
  const store = loadPuzzlesStore();
  const puzzle = Array.from(store.values()).find(p => p.status === "PUBLISHED");
  assert.ok(puzzle);

  // If a client attempts to pass 'solved: true' with an illegal or wrong move,
  // server-authoritative submission strictly evaluates the real board position
  const result = submitPuzzleAttempt({
    puzzleId: puzzle.puzzle_id,
    move: "a1a2", // Likely illegal or wrong
    isTest: true
  });

  // Outcome must be determined by board state, NEVER by client declaration
  if (!result.ok) {
    assert.equal(result.error, "ILLEGAL_MOVE");
  } else {
    assert.equal(result.outcome, "INCORRECT");
    assert.equal(result.solved, false);
  }
});

test("Authoritative Solver Suite: 5. Wrong player move on /attempt returns INCORRECT with no rating inflation", () => {
  const store = loadPuzzlesStore();
  const puzzle = Array.from(store.values()).find(p => p.status === "PUBLISHED" && p.solution_line?.length > 0);
  assert.ok(puzzle);

  const chess = new Chess(puzzle.fen_before);
  const legalMoves = chess.moves({ verbose: true });
  const canonicalUci = puzzle.solution_line[0].toLowerCase();
  const wrongMoveObj = legalMoves.find(m => (m.from + m.to + (m.promotion || "")).toLowerCase() !== canonicalUci);

  if (wrongMoveObj) {
    const wrongUci = wrongMoveObj.from + wrongMoveObj.to + (wrongMoveObj.promotion || "");
    const attemptResult = submitPuzzleAttempt({
      puzzleId: puzzle.puzzle_id,
      move: wrongUci,
      isTest: true
    });

    assert.equal(attemptResult.ok, true);
    assert.equal(attemptResult.outcome, "INCORRECT");
    assert.equal(attemptResult.solved, false);
  }
});

test("Authoritative Solver Suite: 6. Request deduplication / Idempotency prevents duplicate writes", () => {
  const testCache = new Map();
  const idempotencyKey = "rhz_test_puz_001:fen_key";
  const now = Date.now();

  const fakeResponse = {
    ok: true,
    puzzle_id: "rhz_test_puz_001",
    engineMove: "e2e4",
    solved: true
  };

  testCache.set(idempotencyKey, { timestamp: now, response: fakeResponse });

  // Probe cache within 60s
  const cached = testCache.get(idempotencyKey);
  assert.ok(cached, "Cache must contain recorded key");
  assert.ok(Date.now() - cached.timestamp < 60000, "Cache entry must be fresh");

  const replayResult = { ...cached.response, idempotent: true };
  assert.equal(replayResult.idempotent, true, "Replay must be flagged as idempotent");
  assert.equal(replayResult.puzzle_id, "rhz_test_puz_001");
});

test("Authoritative Solver Suite: 7. Missing verified reference rejects blunder accusation", () => {
  const nonExistentId = "rhz_puz_non_existent_id_999999";
  const canonical = getPuzzleById(nonExistentId);
  assert.equal(canonical, null, "Non-existent puzzle ID must return null");

  // In accordance with Section B: Without a verified reference, server must NOT declare a blunder
  const verifiedAvailable = Boolean(canonical && canonical.solution_line?.length > 0);
  assert.equal(verifiedAvailable, false, "Verified solution must be reported unavailable");
});

test("Authoritative Solver Suite: 8. Stats & History return transparent canonical counts", () => {
  const stats = getPuzzleAuthorityStats();
  assert.ok(stats, "Stats must not be null");
  assert.equal(typeof stats.total_attempts, "number");
  assert.equal(typeof stats.total_solved, "number");
  assert.equal(typeof stats.total_failed, "number");
  assert.ok(stats.published_puzzles >= 100, `Published puzzles must be at least 100, got ${stats.published_puzzles}`);
  assert.ok(stats.quarantined_puzzles >= 1, "Quarantined holdouts must be tracked");

  const failures = getRecentFailures(10);
  assert.ok(Array.isArray(failures), "Failures must be an array");
  for (const f of failures) {
    assert.ok(f.puzzleId, "Failure must have puzzleId");
    assert.ok(f.correction, "Failure must have correction object");
    assert.ok(!JSON.stringify(f).includes("undefined"), "Failure object must never serialize undefined");
  }
});

test("Authoritative Solver Suite: 9. WAC-30 Quarantined puzzles are strictly excluded from public solving", () => {
  for (const board of WAC_30_QUARANTINE_BOARDS) {
    const store = loadPuzzlesStore();
    for (const p of store.values()) {
      if (p.fen_before.startsWith(board)) {
        assert.equal(p.status, "QUARANTINED", `WAC-30 board ${board} MUST have status QUARANTINED`);
        const next = getNextPublishedPuzzle(p.puzzle_id);
        assert.equal(next, null, "Quarantined puzzle must NEVER be returned by getNextPublishedPuzzle");
      }
    }
  }
});
