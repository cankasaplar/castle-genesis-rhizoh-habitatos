import test from "node:test";
import assert from "node:assert/strict";
import { shannon3BinOverlapEntropyBits, computeEntropyGradientFieldV1 } from "../genesisReplayEntropyGradientV1.js";

test("shannon3BinOverlapEntropyBits is 0 for empty union", () => {
  assert.equal(shannon3BinOverlapEntropyBits(new Set(), new Set()), 0);
});

test("shannon3BinOverlapEntropyBits full overlap single seq", () => {
  const s = new Set([5]);
  const h = shannon3BinOverlapEntropyBits(s, s);
  assert.ok(h === 0);
});

test("computeEntropyGradientFieldV1 produces gradient length bins-1", () => {
  const ring = [{ seq: 1 }, { seq: 2 }];
  const arch = [{ seq: 3 }];
  const f = computeEntropyGradientFieldV1(1, 10, 4, ring, arch);
  assert.equal(f.entropyField.length <= 4, true);
  assert.equal(f.gradient.length, Math.max(0, f.entropyField.length - 1));
});
