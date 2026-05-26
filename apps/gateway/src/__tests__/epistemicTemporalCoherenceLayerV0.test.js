import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ETCL_INVARIANT_V0,
  buildEpistemicTemporalCoherenceLayerV0,
  validateDelayedTruthRuleV0,
  validateTemporalAlignmentInvariantV0
} from "../ops/epistemicTemporalCoherenceLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("epistemicTemporalCoherenceLayerV0", () => {
  it("temporal alignment: decision packet references state(t)", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-etcl-align" });
    const align = validateTemporalAlignmentInvariantV0(n);
    assert.equal(align.id, ETCL_INVARIANT_V0.TEMPORAL_ALIGNMENT);
    assert.equal(align.valid, true);
    assert.ok(align.anchor?.narrativeFingerprintDigest);
  });

  it("delayed truth: time passage does not close uncertainty", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-etcl-delayed" });
    const rule = validateDelayedTruthRuleV0(n);
    assert.equal(rule.id, ETCL_INVARIANT_V0.DELAYED_TRUTH);
    assert.equal(rule.valid, true);
    assert.equal(rule.uncertaintyRemainsOpen, true);
  });

  it("export includes all three ETCL invariants", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-etcl-export" });
    const etcl = n.epistemicTemporalCoherence;
    assert.equal(etcl?.schema, "rhizoh.epistemic_temporal_coherence.v0");
    assert.ok(etcl.invariants?.temporalAlignment);
    assert.ok(etcl.invariants?.crossWindowContradictionGuard);
    assert.ok(etcl.invariants?.delayedTruthRule);
    assert.equal(etcl.allInvariantsValid, true);
  });
});
