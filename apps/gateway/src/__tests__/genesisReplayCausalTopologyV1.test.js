import test from "node:test";
import assert from "node:assert/strict";
import { buildRegimeSegmentGraphFromContinuityV1, GENESIS_REPLAY_CAUSAL_TOPOLOGY_SCHEMA } from "../genesisReplayCausalTopologyV1.js";

test("regime graph: one segment same source, transition creates edge", () => {
  const g = buildRegimeSegmentGraphFromContinuityV1([
    { seq: 1, type: "A", _replaySource: "ring" },
    { seq: 2, type: "B", _replaySource: "ring" },
    { seq: 3, type: "C", _replaySource: "archive" }
  ]);
  assert.equal(g.schema, GENESIS_REPLAY_CAUSAL_TOPOLOGY_SCHEMA);
  assert.equal(g.nodeCount, 2);
  assert.equal(g.edgeCount, 1);
  assert.equal(g.edges[0].kind, "regime_transition");
  assert.equal(g.edges[0].atSeq, 3);
});
