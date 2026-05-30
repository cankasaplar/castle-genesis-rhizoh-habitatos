import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_DOMAIN_V0,
  ACTION_PERMISSION_V0,
  buildActionSemanticGovernanceLayerV0,
  resolveActionSemanticsV0,
  scoreCrossDomainActionRiskV0
} from "../ops/actionSemanticGovernanceLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("actionSemanticGovernanceLayerV0", () => {
  it("deploy_agent has distinct meanings per domain", () => {
    const r = resolveActionSemanticsV0("deploy_agent", ACTION_DOMAIN_V0.ROBOTICS);
    const g = resolveActionSemanticsV0("deploy_agent", ACTION_DOMAIN_V0.GOVERNANCE);
    const s = resolveActionSemanticsV0("deploy_agent", ACTION_DOMAIN_V0.SPIRAL_MMO);
    assert.equal(r.meaning, "physical_robot_activation");
    assert.equal(g.meaning, "workload_scaling_signal");
    assert.equal(s.meaning, "npc_spawn_world_event");
    assert.notEqual(r.meaning, g.meaning);
  });

  it("apply_narrative_suggested_action is prohibited everywhere", () => {
    for (const d of Object.values(ACTION_DOMAIN_V0)) {
      const x = resolveActionSemanticsV0("apply_narrative_suggested_action", d);
      assert.equal(x.permission, ACTION_PERMISSION_V0.PROHIBITED);
    }
  });

  it("cross domain risk elevated for high risk actions", () => {
    const sc = scoreCrossDomainActionRiskV0("deploy_agent");
    assert.ok(sc.score >= 0.5);
    assert.equal(sc.silentFailureClass, "multi_domain_action_semantic_drift");
  });

  it("narrative export includes ASGL and closed loop status", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-asgl-test" });
    assert.ok(n.actionSemanticGovernance?.evaluatedSuggestedActions?.length >= 1);
    assert.equal(n.actionSemanticGovernance.epistemicFeedbackLoop.loopClosed, true);
    assert.equal(n.interpretationSafetyContract.can_execute, false);
    assert.equal(
      n.actionSemanticGovernance.epistemicFeedbackLoop.risks.authorityCollapse.mitigated,
      true
    );
  });
});
