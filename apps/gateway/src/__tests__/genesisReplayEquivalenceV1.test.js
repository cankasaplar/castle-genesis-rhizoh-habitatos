import test from "node:test";
import assert from "node:assert/strict";
import { compareGenesisReplayEquivalenceV1 } from "../genesisReplayEquivalenceV1.js";

test("equivalence rejects invalid band 1", async () => {
  const o = await compareGenesisReplayEquivalenceV1({ from1: 0, to1: 5, from2: 1, to2: 2 });
  assert.equal(o.ok, false);
  assert.equal(o.side, 1);
});
