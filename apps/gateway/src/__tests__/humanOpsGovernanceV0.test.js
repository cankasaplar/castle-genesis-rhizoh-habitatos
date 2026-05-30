import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHumanDecisionScalingV0, DECISION_TIER_V0 } from "../ops/humanDecisionScalingV0.js";
import { runNarrativeMisreadSimulationV0 } from "../ops/narrativeMisreadSimulationV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("humanOpsGovernanceV0", () => {
  it("escalates decision tier at 10k DAU", () => {
    const s = buildHumanDecisionScalingV0({ dau: 12_000, tenantCount: 1 });
    assert.equal(s.tier, DECISION_TIER_V0.PLATFORM_GOVERNANCE);
  });

  it("unified narrative includes humanOps and productReadiness", async () => {
    const n = await buildUnifiedStateNarrativeV0({ dau: 500, tenantCount: 2, platformScope: true });
    assert.ok(n.humanOps?.humanDecisionScaling);
    assert.ok(n.humanOps?.narrativeUiSafety);
    assert.ok(n.humanOps?.misreadSimulation);
    assert.ok(n.productReadiness?.answerToIsItSafe);
  });

  it("misread simulation lists scenarios", async () => {
    const n = await buildUnifiedStateNarrativeV0({ platformScope: true });
    const sim = runNarrativeMisreadSimulationV0(n);
    assert.ok(sim.scenarioCount >= 5);
    assert.equal(sim.highResidualCount, 0, sim.tabletopVerdict);
  });

  it("includes ops runbook and ux contract", async () => {
    const n = await buildUnifiedStateNarrativeV0({ dau: 12_000, platformScope: true });
    assert.ok(n.humanOps?.humanDecisionOpsRunbook?.routing?.routeId);
    assert.ok(n.interpretationUxContract?.narrativeNeverVisuallyDominant);
  });
});
