import test from "node:test";
import assert from "node:assert/strict";
import { detectPhaseRegimeCriticalityV1, GENESIS_REPLAY_PHASE_TRANSITION_SCHEMA } from "../genesisReplayPhaseTransitionV1.js";

test("phase criticality finds spike near edge", () => {
  const p = detectPhaseRegimeCriticalityV1({
    causalTopology: { edges: [{ atSeq: 10 }, { atSeq: 11 }] },
    stabilityField: {
      stepHint: 4,
      gradient: [
        { seqCenter: 6, deltaH: 0.01 },
        { seqCenter: 8, deltaH: 0.02 },
        { seqCenter: 10, deltaH: 2.5 }
      ]
    },
    from: 1,
    to: 20
  });
  assert.equal(p.schema, GENESIS_REPLAY_PHASE_TRANSITION_SCHEMA);
  assert.ok(p.spikeCount >= 1);
  assert.ok(p.spikes.some((s) => s.nearbyTransitions >= 1));
});
