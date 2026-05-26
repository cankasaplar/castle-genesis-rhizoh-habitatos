import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LATENCY_TIER_V0,
  buildDecisionLatencyGovernanceLayerV0,
  resolveFastPathEligibilityV0,
  scoreDecisionLatencyInflationV0
} from "../ops/decisionLatencyGovernanceLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("decisionLatencyGovernanceLayerV0", () => {
  it("measures five-step decision chain ending at human", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dlgl-chain" });
    const dlgl = n.decisionLatencyGovernance;
    assert.equal(dlgl.decisionChain.depth, 5);
    assert.ok(dlgl.decisionChain.steps.includes("human_final_owner"));
  });

  it("fast path never implies can_execute", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dlgl-fast" });
    const fast = resolveFastPathEligibilityV0(n);
    assert.equal(n.interpretationSafetyContract.can_execute, false);
    if (fast.eligible) {
      assert.ok(fast.preserves.includes("cab_negations"));
    }
  });

  it("human packet includes ack SLA and primary action", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dlgl-packet" });
    const pkt = n.decisionLatencyGovernance?.humanDecisionPacket;
    assert.ok(pkt?.ackSlaMinutes >= 1);
    assert.ok(pkt?.primaryActionId);
    assert.ok(pkt?.bundle?.headline);
    assert.ok(
      [LATENCY_TIER_V0.IMMEDIATE_HUMAN_PACKET, LATENCY_TIER_V0.STANDARD_REVIEW, LATENCY_TIER_V0.DEFERRED_ESCALATION].includes(
        n.decisionLatencyGovernance?.latencyTier
      )
    );
  });

  it("latency inflation score is bounded 0-1", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dlgl-score" });
    const s = scoreDecisionLatencyInflationV0(n);
    assert.ok(s.score >= 0 && s.score <= 1);
    assert.equal(n.decisionLatencyGovernance?.schema, "rhizoh.decision_latency_governance.v0");
  });
});
