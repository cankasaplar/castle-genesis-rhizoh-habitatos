#!/usr/bin/env node
/**
 * Phase 3 Controlled Divergence Instrumentation Runtime harness.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runPhase3ExecutionSpecHarnessV0 } from "../apps/gateway/src/ops/phase3HarnessExportV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const report = runPhase3ExecutionSpecHarnessV0();
const stamp = new Date().toISOString().slice(0, 10);
const outPath = join(outDir, `phase3_execution_runtime_${stamp}.json`);
const latestPath = join(outDir, "phase3_execution_runtime_LATEST.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      ok: report.phase3ExecutionGate === "phase3_runtime_spec_pass",
      outPath,
      latestPath,
      firewall: report.firewall?.rule,
      phase3ExecutionGate: report.phase3ExecutionGate,
      phase3dObservationGate: report.phase3dObservationGate,
      scenarios: report.phase3Control.scenarios.map((s) => ({ id: s.id, mode: s.mode, D: s.divergence })),
      behaviorDynamics: report.phase3Observation.behaviorDynamics,
      trajectoryClass:
        report.phase3Observation.operabilityPhaseTrajectories?.executionOrder?.dynamics?.classification,
      primaryAttractor:
        report.phase3Observation.phase3DAttractorIntelligence?.primaryAttractor?.attractorId,
      primaryEjector:
        report.phase3Observation.phase3DAttractorIntelligence?.stressorExitAnalysis?.primaryEjector,
      perturbationSummary:
        report.phase3Observation.phase3DAttractorIntelligence?.perturbationSensitivityMap?.summary,
      proposalQueueStats: report.phase3Observation.proposalQueue?.stats
    },
    null,
    2
  )
);
process.exit(report.phase3ExecutionGate === "phase3_runtime_spec_pass" ? 0 : 1);
