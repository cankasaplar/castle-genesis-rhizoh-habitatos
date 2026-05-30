import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAppliedSystemsLayerV0 } from "../ops/appliedSystemsLayerV0.js";
import {
  assertResearchCannotTouchProductionV0,
  buildResearchGovernanceLayerV0
} from "../ops/researchGovernanceLayerV0.js";
import { evaluateRoboticsGroundingV0, STATE_SOURCE_V0 } from "../ops/roboticsGroundingSafetyLayerV0.js";
import { buildSpiralMMOGameKernelV0, getRhizohToSpiralMappingV0 } from "../ops/spiralMMOGameKernelV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("appliedSystemsLayerV0", () => {
  it("research cannot touch GCL limits", () => {
    assert.throws(() => assertResearchCannotTouchProductionV0("GCL_LIMITS"), /cannot_touch/);
  });

  it("research mode is audit_only", () => {
    const r = buildResearchGovernanceLayerV0({ institutionId: "uni-test" });
    assert.equal(r.outputType, "audit_only");
    assert.equal(r.mayDriveProductionDecision, false);
  });

  it("robotics blocks actuation without sensor verified", () => {
    const g = evaluateRoboticsGroundingV0(
      { source: STATE_SOURCE_V0.MODEL_INFERRED, sensorFusionOk: false },
      { fromModel: true }
    );
    assert.equal(g.blockActuation, true);
    assert.equal(g.epistemicDrift.hallucinationAsEpistemicError, true);
  });

  it("spiral maps propagation to rumor", () => {
    const m = getRhizohToSpiralMappingV0();
    assert.equal(m.propagation_simulation.spiralMechanic, "rumor_viral_event");
  });

  it("full narrative includes appliedSystemsLayer", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-asl-test" });
    assert.ok(n.appliedSystemsLayer?.researchGovernance);
    assert.ok(n.appliedSystemsLayer?.roboticsGrounding);
    assert.ok(n.appliedSystemsLayer?.spiralMMOGameKernel);
    assert.equal(n.appliedSystemsLayer.dualRhizoh.research.mayDriveProductionDecision, false);
  });

  it("spiral compiles rumors from propagation paths", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-spiral-test" });
    const k = buildSpiralMMOGameKernelV0(n);
    assert.ok(k.gameLayer.rumors.length >= 1);
    assert.equal(k.feedsExecution, false);
  });
});
