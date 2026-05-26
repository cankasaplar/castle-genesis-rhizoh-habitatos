import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INTERPRETATION_SAFETY_CONTRACT_V0,
  buildAntiActionBoundariesV0,
  partitionStateLayersV0,
  assertInterpretationSafetyContractV0
} from "../ops/interpretationSafetyContractV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("interpretationSafetyContractV0", () => {
  it("contract forbids execute and self_modify", () => {
    assert.equal(INTERPRETATION_SAFETY_CONTRACT_V0.can_execute, false);
    assert.equal(INTERPRETATION_SAFETY_CONTRACT_V0.can_self_modify, false);
    assert.equal(INTERPRETATION_SAFETY_CONTRACT_V0.authority_level, "non_binding");
    assert.equal(assertInterpretationSafetyContractV0(), true);
  });

  it("policy layer is non-binding with prohibitions", () => {
    const validation = {
      trustPosture: "narrative_hypothesis_only",
      confidenceDecomposition: { composite: { overtrustRisk: "high" } },
      divergence: { validated: false }
    };
    const layers = partitionStateLayersV0(
      { gcl: { health: { ok: true } }, rollout: { limit: 200, activeTurns: 0 }, lifecycle: {} },
      { health: "stressed", pressure: "high", risk: "saturation", confidence: 0.9 },
      { suggestedActions: [{ id: "x", executable: false }], headline: "Rhizoh: stressed" },
      validation
    );
    assert.equal(layers.raw.layer, "raw");
    assert.equal(layers.derived.layer, "derived");
    assert.equal(layers.derived.notDecision, true);
    assert.equal(layers.policy.layer, "policy");
    assert.equal(layers.policy.binding, false);
    assert.ok(layers.policy.prohibitedActions.length >= 5);
    assert.equal(layers.policy.antiActionBoundaries.contract.can_execute, false);
  });

  it("buildUnifiedStateNarrative includes stateLayers and governance", async () => {
    const n = await buildUnifiedStateNarrativeV0({ platformScope: true });
    assert.ok(n.stateLayers.raw);
    assert.ok(n.stateLayers.derived);
    assert.ok(n.stateLayers.policy);
    assert.equal(n.governance.narrativeIsNotDecisionLayer, true);
    assert.equal(n.interpretationSafetyContract.decision_owner, "human_or_external_ops");
  });
});
