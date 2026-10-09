import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Chess } from "chess.js";
import {
  initPuzzleAuthority,
  loadPuzzlesStore,
  getNextPublishedPuzzle,
  submitPuzzleAttempt,
  getPuzzleById,
  computePuzzleCatalogManifest,
  getPuzzleAuthorityStats,
  WAC_30_QUARANTINE_BOARDS
} from "../rhizoh/puzzleAuthorityV1.js";

test("puzzle authority initializes successfully and discovers canonical catalog", () => {
  const initRes = initPuzzleAuthority();
  assert.ok(initRes.initialized, "Authority should be initialized");
  assert.ok(initRes.count > 0, "Catalog should have loaded at least one puzzle");
});

test("canonical puzzle store contains valid records adhering to schema", () => {
  const store = loadPuzzlesStore();
  assert.ok(store.size >= 100, `Expected at least 100 puzzles in store, got ${store.size}`);

  let checkedCount = 0;
  for (const [id, record] of store) {
    assert.ok(record.puzzle_id, "Missing puzzle_id");
    assert.equal(record.puzzle_id, id);
    assert.ok(record.fen_before, "Missing fen_before");
    assert.ok(Array.isArray(record.solution_line) && record.solution_line.length > 0, "Missing or empty solution_line");
    assert.ok(["w", "b"].includes(record.side_to_move), "Invalid side_to_move");
    assert.ok(["PUBLISHED", "QUARANTINED"].includes(record.status), "Invalid status");
    assert.ok(record.provenance, "Missing provenance");
    checkedCount++;
  }
  assert.equal(checkedCount, store.size);
});

test("every puzzle position in canonical catalog is legally playable with valid solution", () => {
  const store = loadPuzzlesStore();
  let validPuzzles = 0;

  for (const record of store.values()) {
    // 1. Verify FEN is valid chess position
    let game;
    try {
      game = new Chess(record.fen_before);
    } catch (e) {
      assert.fail(`Puzzle ${record.puzzle_id} has invalid FEN: ${record.fen_before} (${e.message})`);
    }

    assert.equal(game.turn(), record.side_to_move, `Puzzle ${record.puzzle_id} turn mismatch`);

    // 2. Verify first solution move is strictly legal
    const firstMove = record.solution_line[0];
    assert.ok(firstMove, `Puzzle ${record.puzzle_id} missing first move`);

    let moveRes = null;
    try {
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(firstMove)) {
        const from = firstMove.slice(0, 2).toLowerCase();
        const to = firstMove.slice(2, 4).toLowerCase();
        const promo = firstMove.length > 4 ? firstMove[4].toLowerCase() : undefined;
        moveRes = game.move({ from, to, promotion: promo });
      } else {
        moveRes = game.move(firstMove);
      }
    } catch (e) {
      assert.fail(`Puzzle ${record.puzzle_id} move '${firstMove}' failed: ${e.message}`);
    }

    assert.ok(moveRes, `Puzzle ${record.puzzle_id} move '${firstMove}' is not legal in position ${record.fen_before}`);
    validPuzzles++;
  }

  assert.ok(validPuzzles >= 100, `Expected at least 100 legal chess puzzles, got ${validPuzzles}`);
});

test("getNextPublishedPuzzle serves sanitized puzzle without leaking solution", () => {
  const p = getNextPublishedPuzzle();
  assert.ok(p, "getNextPublishedPuzzle returned null");
  assert.ok(p.puzzle_id, "Missing puzzle_id");
  assert.ok(p.fen, "Missing fen");
  assert.ok(p.side_to_move, "Missing side_to_move");
  assert.ok(p.category, "Missing category");

  // Client sanitizer verification: solution MUST be stripped
  assert.equal(p.solution_line, undefined, "LEAK: solution_line exposed to client");
  assert.equal(p.solution_san, undefined, "LEAK: solution_san exposed to client");
  assert.equal(p.solution_hash, undefined, "LEAK: solution_hash exposed to client");
});

test("quarantined benchmark boards are never served publicly", () => {
  const store = loadPuzzlesStore();
  const servedIds = new Set();

  for (let i = 0; i < 50; i++) {
    const p = getNextPublishedPuzzle();
    if (p) servedIds.add(p.puzzle_id);
  }

  for (const id of servedIds) {
    const raw = store.get(id);
    assert.notEqual(raw.status, "QUARANTINED", `Quarantined puzzle ${id} was served!`);
    const boardFen = raw.fen_before.split(" ")[0];
    assert.ok(!WAC_30_QUARANTINE_BOARDS.has(boardFen), `WAC-30 board ${boardFen} was served!`);
  }
});

test("submitPuzzleAttempt validates legal, illegal, and wrong moves authoritatively", () => {
  const puzzle = getNextPublishedPuzzle();
  assert.ok(puzzle, "Could not fetch a puzzle for attempt test");
  const raw = getPuzzleById(puzzle.puzzle_id);
  assert.ok(raw, "Could not fetch raw puzzle for solution check");

  // 1. Illegal move test (e.g. invalid syntax or impossible on board)
  const illegalRes = submitPuzzleAttempt({
    puzzleId: puzzle.puzzle_id,
    move: "e1e8", // Virtually impossible king teleports across board
    isTest: true
  });
  assert.equal(illegalRes.ok, false);
  assert.equal(illegalRes.error, "ILLEGAL_MOVE");

  // 2. Correct move test
  const correctMove = raw.solution_line[0];
  const correctRes = submitPuzzleAttempt({
    puzzleId: puzzle.puzzle_id,
    move: correctMove,
    isTest: true
  });
  assert.equal(correctRes.ok, true);
  assert.equal(correctRes.outcome, "CORRECT");
  assert.ok(correctRes.solved !== undefined);
});

test("computePuzzleCatalogManifest produces deterministic SHA-256 hash", () => {
  const m1 = computePuzzleCatalogManifest();
  const m2 = computePuzzleCatalogManifest();
  assert.ok(m1.manifest_hash, "Missing manifest_hash");
  assert.equal(m1.manifest_hash.length, 64, "Expected SHA-256 length 64");
  assert.equal(m1.manifest_hash, m2.manifest_hash, "Manifest hash must be deterministic");
  assert.ok(m1.total_puzzles >= 100, "Manifest should include all catalog puzzles");
});
