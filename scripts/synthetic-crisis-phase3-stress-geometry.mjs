#!/usr/bin/env node
/**
 * Phase 3 — Stress geometry drill (entropy vectors, drift heatmap, BCS).
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runStressGeometryPhase3V0 } from "../apps/gateway/src/ops/stressGeometryV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

let baseline = null;
const baselinePath = join(outDir, "behavioral_drift_baseline_LATEST.json");
if (existsSync(baselinePath)) {
  try {
    baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch {
    baseline = null;
  }
}

const report = runStressGeometryPhase3V0({ baseline });
const stamp = new Date().toISOString().slice(0, 10);
const outPath = join(outDir, `synthetic_crisis_phase3_stress_geometry_${stamp}.json`);
const latestPath = join(outDir, "synthetic_crisis_phase3_stress_geometry_LATEST.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      ok: report.phase3Gate === "execution_consistent_under_entropy",
      outPath,
      latestPath,
      phase3Gate: report.phase3Gate,
      phase3Outcome: report.phase3Outcome,
      phase3Artifact: report.phase3Artifact,
      bcs: report.behavioralConsistencyScore.bcs,
      mcs: report.modelCompletenessScore.mcs,
      meanExecutionDrift: report.executionDriftHeatmap.perception.meanExecutionDrift,
      entropySpan: report.entropyVectorSpace.expansion.span
    },
    null,
    2
  )
);
process.exit(report.phase3Gate === "execution_consistent_under_entropy" ? 0 : 1);
