#!/usr/bin/env node
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-ecl-gate-ci" });
const ecl = n.epistemicCoherence;

if (!ecl?.schema) {
  console.error("ECL_GATE_FAIL: missing epistemicCoherence");
  process.exit(1);
}

const ux = ecl.uxCompression;
const scoreOk = typeof ecl.systemCoherence?.score === "number";
const binding = ecl.architecture?.ecl === "coherent_system_truth";
const fragmentationDocumented = ecl.contextFragmentationRisk?.mitigatedBy != null;

const payload = {
  gate: "rhizoh.epistemic_coherence_gate.v0",
  ranAt: new Date().toISOString(),
  verdict: ecl.systemCoherence?.verdict,
  coherenceScore: ecl.systemCoherence?.score,
  contradictionCount: ecl.crossLayerContradictions?.count,
  uxSurfacePresent: Boolean(ux?.schema),
  passed: scoreOk && binding && fragmentationDocumented && Boolean(ux?.operatorDecision)
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
