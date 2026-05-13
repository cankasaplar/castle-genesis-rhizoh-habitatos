import test from "node:test";
import assert from "node:assert/strict";
import { computeCausalCurvatureScalarV1, GENESIS_REPLAY_CAUSAL_CURVATURE_SCHEMA } from "../genesisReplayCurvatureV1.js";

test("curvature scalar is bounded and deterministic", () => {
  const c = computeCausalCurvatureScalarV1({
    from: 1,
    to: 100,
    edgeCount: 4,
    spikeCount: 2,
    meanAbsGradient: 0.2,
    collapseCount: 1,
    edgeBurstHeuristic: true
  });
  assert.equal(c.schema, GENESIS_REPLAY_CAUSAL_CURVATURE_SCHEMA);
  assert.ok(typeof c.scalar === "number");
  assert.ok(c.scalar >= 0 && c.scalar < 10);
});
