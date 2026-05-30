#!/usr/bin/env node
/**
 * Exposure behavior boundaries — feedback loop, authority phrases, misunderstanding catalog.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runPhase3ExecutionSpecHarnessV0 } from "../apps/gateway/src/ops/phase3HarnessExportV0.js";
import { runExposureBehaviorBoundaryHarnessV0 } from "../apps/gateway/src/ops/phase3ExposureBehaviorBoundariesV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const harness = runPhase3ExecutionSpecHarnessV0();
const report = runExposureBehaviorBoundaryHarnessV0(harness);
const stamp = new Date().toISOString().slice(0, 10);
const outPath = join(outDir, `phase3_exposure_behavior_boundaries_${stamp}.json`);
const latestPath = join(outDir, "phase3_exposure_behavior_boundaries_LATEST.json");

writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      ok: report.pass === "exposure_behavior_boundaries_pass",
      outPath,
      latestPath,
      pass: report.pass,
      openRisks: report.openRisks,
      misunderstandingCount: report.misunderstandingScenarios.length
    },
    null,
    2
  )
);

process.exit(report.pass === "exposure_behavior_boundaries_pass" ? 0 : 1);
