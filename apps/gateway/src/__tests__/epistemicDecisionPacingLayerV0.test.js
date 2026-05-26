import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0,
  QUEUE_SATURATION_TIER_V0,
  assertEdplExecutionBoundariesV0,
  buildEpistemicDecisionPacingLayerV0,
  resolveTemporaryStaticPostureWindowsV0
} from "../ops/epistemicDecisionPacingLayerV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "../ops/actionContextResolutionLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("epistemicDecisionPacingLayerV0", () => {
  it("scores queue_saturation_index with operational tiers", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-edpl-saturation" });
    const sat = n.epistemicDecisionPacing?.operatorPacingControl?.queueSaturation;
    assert.ok(sat?.queueSaturationIndex >= 0 && sat?.queueSaturationIndex <= 1);
    assert.ok(Object.values(QUEUE_SATURATION_TIER_V0).includes(sat?.tier));
    assert.ok(sat?.operatorProcessingLatency);
  });

  it("temporary_static_posture_windows exclude deploy_agent", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-edpl-windows" });
    const w = resolveTemporaryStaticPostureWindowsV0(n);
    assert.equal(w.notCertaintyZone, true);
    assert.ok(!w.windows.some((x) => x.actionId === "deploy_agent"));
    for (const win of w.windows) {
      assert.equal(win.grantsExecutionApproval, false);
      assert.equal(win.rawUncertaintyStreamRemainsOpen, true);
    }
  });

  it("EDPL never grants execution_approval; forbidden actions ACRL-blocked", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-edpl-boundary" });
    assert.equal(n.epistemicDecisionPacing?.grantsExecutionApproval, false);
    const boundaries = assertEdplExecutionBoundariesV0(n);
    assert.equal(boundaries.valid, true, boundaries.violations?.join("; "));

    for (const actionId of EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0) {
      const matrix = n.actionContextResolution?.executionEligibilityMatrix?.find(
        (m) => m.actionId === actionId
      );
      assert.ok(matrix, `missing matrix for ${actionId}`);
      for (const cell of Object.values(matrix.matrix)) {
        assert.notEqual(cell.eligibility, EXECUTION_ELIGIBILITY_V0.OK);
      }
    }
  });

  it("pacing control does not hide uncertainty on export", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-edpl-export" });
    assert.equal(n.epistemicDecisionPacing?.schema, "rhizoh.epistemic_decision_pacing.v0");
    assert.ok(
      (n.decisionLatencyGovernance?.humanDecisionPacket?.uncertaintyEnvelope?.itemCount ?? 0) >= 2
    );
    assert.ok(n.epistemicDecisionPacing?.operatorPacingControl?.pacingFrequencyLimit);
    assert.ok(n.epistemicDecisionPacing?.authorityHierarchy?.edpl);
  });
});
