import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeCouncilAnomalyScoreV0,
  runCouncilAnomalyReasoningV0
} from "../council/rhizohEpistemicCouncilAnomalyV0.js";

describe("rhizohEpistemicCouncilAnomalyV0", () => {
  it("runs collect/rank/synthesize with anomaly score", () => {
    const out = runCouncilAnomalyReasoningV0({
      matchId: "cluster_0_x",
      triggers: ["policy_diff_drift", "topology_drift", "stockfish_timeout"],
      conflictGraph: { maxDisagreement: 0.3 },
      memoryGraph: { nodeCount: 40 }
    });
    assert.equal(out.ok, true);
    assert.ok(out.anomalyScore > 0.4);
    assert.equal(out.reasoningChain.length, 3);
    assert.ok(out.lenses.length >= 3);
    assert.equal(out.governance.feedsDriftDetection, false);
  });

  it("computes bounded anomaly score", () => {
    const score = computeCouncilAnomalyScoreV0({
      triggers: ["eval_variance"],
      conflictGraph: { maxDisagreement: 0.9 },
      memoryGraph: { nodeCount: 900 }
    });
    assert.ok(score > 0);
    assert.ok(score <= 1);
  });
});
