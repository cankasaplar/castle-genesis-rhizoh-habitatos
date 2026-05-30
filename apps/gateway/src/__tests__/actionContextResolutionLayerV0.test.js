import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ACTION_DOMAIN_V0 } from "../ops/actionSemanticGovernanceLayerV0.js";
import {
  EXECUTION_ELIGIBILITY_V0,
  buildContextFingerprintV0,
  resolveExecutionEligibilityV0
} from "../ops/actionContextResolutionLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("actionContextResolutionLayerV0", () => {
  it("deploy_agent matrix: robotics blocked by default ops context, spiral blocked, governance review", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-acrl-test" });
    const fp = buildContextFingerprintV0(n);
    const matrix = resolveExecutionEligibilityV0("deploy_agent", fp);

    assert.equal(
      matrix.matrix[ACTION_DOMAIN_V0.SPIRAL_MMO].eligibility,
      EXECUTION_ELIGIBILITY_V0.BLOCKED
    );
    assert.equal(
      matrix.matrix[ACTION_DOMAIN_V0.GOVERNANCE].eligibility,
      EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED
    );
    assert.equal(
      matrix.matrix[ACTION_DOMAIN_V0.ROBOTICS].eligibility,
      EXECUTION_ELIGIBILITY_V0.BLOCKED
    );
  });

  it("deploy_agent robotics OK when actuation eligible fingerprint", () => {
    const fp = buildContextFingerprintV0({
      tenantScope: { tenantBound: true, tenantId: "t1" },
      signalsSummary: { coordinationSim: false },
      appliedSystemsLayer: {
        roboticsGrounding: { sensorVerified: true, blockActuation: false }
      },
      interpretationSafetyContract: { can_execute: false }
    });
    const matrix = resolveExecutionEligibilityV0("deploy_agent", fp);
    assert.equal(
      matrix.matrix[ACTION_DOMAIN_V0.ROBOTICS].eligibility,
      EXECUTION_ELIGIBILITY_V0.OK
    );
  });

  it("apply_narrative_suggested_action blocked in all domains", () => {
    const fp = buildContextFingerprintV0({
      tenantScope: { tenantBound: true },
      interpretationSafetyContract: { can_execute: false }
    });
    const matrix = resolveExecutionEligibilityV0("apply_narrative_suggested_action", fp);
    for (const d of Object.values(ACTION_DOMAIN_V0)) {
      assert.equal(matrix.matrix[d].eligibility, EXECUTION_ELIGIBILITY_V0.BLOCKED);
    }
  });

  it("narrative export includes ACRL with deploy_agent example", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-acrl-export" });
    assert.equal(n.actionContextResolution?.schema, "rhizoh.action_context_resolution.v0");
    assert.ok(n.actionContextResolution?.contextFingerprint?.fingerprintHash);
    assert.equal(
      n.actionContextResolution?.actionOverloadingRisk?.deployAgentExample?.spiral_mmo,
      EXECUTION_ELIGIBILITY_V0.BLOCKED
    );
    assert.equal(
      n.actionContextResolution?.actionOverloadingRisk?.deployAgentExample?.governance,
      EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED
    );
    assert.equal(n.actionContextResolution?.nonExecutable, true);
  });
});
