import assert from "node:assert/strict";
import test from "node:test";
import { incrementLossMemoryEntry } from "../puzzleController.js";

test("loss memory ingestion increments repeated Castle hashes in Rust format", () => {
  const first = incrementLossMemoryEntry("123 2\n456\n", "123");
  assert.equal(first.count, 3);
  assert.equal(first.content, "123 3\n456 1\n");

  const second = incrementLossMemoryEntry(first.content, "123");
  assert.equal(second.count, 4);
  assert.equal(second.content, "123 4\n456 1\n");
});