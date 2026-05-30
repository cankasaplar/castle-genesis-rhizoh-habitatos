import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildHumanDecisionOpsRunbookV0,
  routeDecisionOwnerV0
} from "../ops/humanDecisionOpsRunbookV0.js";
import { DECISION_TIER_V0 } from "../ops/humanDecisionScalingV0.js";

describe("humanDecisionOpsRunbookV0", () => {
  it("routes platform tier with 15m ack SLA", () => {
    const rb = buildHumanDecisionOpsRunbookV0({ dau: 15_000 });
    assert.equal(rb.tier, DECISION_TIER_V0.PLATFORM_GOVERNANCE);
    assert.equal(rb.sla.ackMinutes, 15);
    assert.equal(rb.routing.routeId, "rhizoh.ops.platform_governance");
  });

  it("runbook steps non-empty for team queue", () => {
    const routed = routeDecisionOwnerV0(DECISION_TIER_V0.TEAM_QUEUE);
    assert.ok(routed.requiredRoles?.length);
    const rb = buildHumanDecisionOpsRunbookV0({ dau: 2000, tenantCount: 5 });
    assert.ok(rb.runbookSteps.length >= 3);
  });
});
