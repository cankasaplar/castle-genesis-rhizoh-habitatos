#!/usr/bin/env node
import { ETCL_INVARIANT_V0 } from "./epistemicTemporalCoherenceLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-etcl-gate-ci" });
const etcl = n.epistemicTemporalCoherence;

if (!etcl?.schema) {
  console.error("ETCL_GATE_FAIL: missing epistemicTemporalCoherence");
  process.exit(1);
}

const align = etcl.invariants?.temporalAlignment;
const cross = etcl.invariants?.crossWindowContradictionGuard;
const delayed = etcl.invariants?.delayedTruthRule;

const payload = {
  gate: "rhizoh.epistemic_temporal_coherence_gate.v0",
  ranAt: new Date().toISOString(),
  allInvariantsValid: etcl.allInvariantsValid,
  temporalAlignment: align?.valid,
  crossWindowGuard: cross?.valid,
  delayedTruth: delayed?.valid,
  reconciliationRequired: cross?.reconciliation?.required,
  passed:
    align?.valid === true &&
    cross?.valid === true &&
    delayed?.valid === true &&
    align?.id === ETCL_INVARIANT_V0.TEMPORAL_ALIGNMENT &&
    cross?.id === ETCL_INVARIANT_V0.CROSS_WINDOW_CONTRADICTION &&
    delayed?.id === ETCL_INVARIANT_V0.DELAYED_TRUTH
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
