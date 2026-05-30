#!/usr/bin/env node
/**
 * Verify stress response taxonomy coverage + conflict resolution before Phase 3.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  verifyStressTaxonomyCoverageV0,
  verifyStressConflictResolutionV0,
  classifyStressResponseV0,
  STRESS_CLASS_V0,
  RESPONSE_ACTION_V0
} from "../apps/gateway/src/ops/stressResponseTaxonomyV0.js";
import { verifyResolutionStabilityEnvelopeV0 } from "../apps/gateway/src/ops/resolutionStabilityEnvelopeV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const coverage = verifyStressTaxonomyCoverageV0();
const conflicts = verifyStressConflictResolutionV0();
const samples = [
  classifyStressResponseV0({ code: "phased_rollout_capacity" }),
  classifyStressResponseV0({ code: "prompt_abuse_detected" }),
  classifyStressResponseV0({ code: "cost_hard_limit" }),
  classifyStressResponseV0({ driftSuspected: true }),
  classifyStressResponseV0({ providerHttpStatus: 503 }),
  classifyStressResponseV0({ codes: ["prompt_abuse_detected", "cost_hard_limit"] }),
  classifyStressResponseV0({ codes: ["phased_rollout_capacity", "behavioral_drift_suspected"] })
];

const stability = verifyResolutionStabilityEnvelopeV0();
const pass = coverage.pass && conflicts.pass && stability.pass;
const report = {
  schema: "rhizoh.stress_taxonomy.verify.v0",
  atMs: new Date().toISOString(),
  matrix: {
    [STRESS_CLASS_V0.OVERLOAD]: RESPONSE_ACTION_V0.DEGRADE,
    [STRESS_CLASS_V0.ATTACK]: RESPONSE_ACTION_V0.ISOLATE,
    [STRESS_CLASS_V0.COST_SPIKE]: RESPONSE_ACTION_V0.THROTTLE,
    [STRESS_CLASS_V0.DRIFT]: RESPONSE_ACTION_V0.FLAG,
    [STRESS_CLASS_V0.OUTAGE]: RESPONSE_ACTION_V0.FALLBACK
  },
  coverage,
  conflictResolution: conflicts,
  resolutionStability: stability,
  samples,
  phase3Gate: pass
    ? "cognition_stack_ready_for_phase3"
    : "hold_fix_taxonomy_or_stability_gaps"
};

const outPath = join(outDir, "stress_response_taxonomy_verify_LATEST.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({ ok: pass, outPath, phase3Gate: report.phase3Gate }, null, 2));
process.exit(pass ? 0 : 1);
