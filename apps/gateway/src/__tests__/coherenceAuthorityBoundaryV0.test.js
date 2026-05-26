import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COHERENCE_NEGATION_V0,
  buildCoherenceAuthorityBoundaryV0,
  validateEclAuthorityBindingV0
} from "../ops/coherenceAuthorityBoundaryV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("coherenceAuthorityBoundaryV0", () => {
  it("enforces all three coherence negations", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-cab-test" });
    const cab = n.coherenceAuthorityBoundary;
    assert.equal(cab.negations[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_EXECUTABLE_TRUTH], true);
    assert.equal(cab.negations[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_POLICY_OVERRIDE], true);
    assert.equal(cab.negations[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_REALITY_CLAIM], true);
  });

  it("ECL binding stays valid when narrative non-executable", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-cab-bind" });
    const binding = validateEclAuthorityBindingV0(n);
    assert.equal(binding.valid, true);
    assert.equal(binding.eclDoesNotUpgradeExecution, true);
    assert.equal(n.interpretationSafetyContract.can_execute, false);
  });

  it("export includes CAB disclaimers and drift monitoring", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-cab-export" });
    assert.equal(n.coherenceAuthorityBoundary?.schema, "rhizoh.coherence_authority_boundary.v0");
    assert.ok(n.coherenceAuthorityBoundary?.disclaimers?.mandatoryBanner?.tr);
    assert.equal(n.coherenceAuthorityBoundary?.contract?.can_execute, false);
    assert.equal(n.coherenceAuthorityBoundary?.nonBinding, true);
  });
});
