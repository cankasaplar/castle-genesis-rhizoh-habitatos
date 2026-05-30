#!/usr/bin/env node
/**
 * Capture behavioral drift baseline before Phase 3.
 * Usage: npm run ops:behavioral-drift-baseline
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { captureBehavioralDriftBaselineV0 } from "../apps/gateway/src/ops/behavioralDriftBaselineV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const baseline = captureBehavioralDriftBaselineV0();
const stamp = new Date().toISOString().slice(0, 10);
const outPath = join(outDir, `behavioral_drift_baseline_${stamp}.json`);
const latestPath = join(outDir, "behavioral_drift_baseline_LATEST.json");
writeFileSync(outPath, JSON.stringify(baseline, null, 2), "utf8");
writeFileSync(latestPath, JSON.stringify(baseline, null, 2), "utf8");

function loadLatestPhase2Gate() {
  const direct = join(outDir, "synthetic_crisis_phase2_LATEST.json");
  if (existsSync(direct)) {
    try {
      return JSON.parse(readFileSync(direct, "utf8")).phase3Gate;
    } catch {
      return null;
    }
  }
  const files = readdirSync(outDir)
    .filter((f) => f.startsWith("synthetic_crisis_phase2_") && f.endsWith(".json"))
    .sort();
  if (!files.length) return null;
  try {
    return JSON.parse(readFileSync(join(outDir, files[files.length - 1]), "utf8")).phase3Gate;
  } catch {
    return null;
  }
}

const p2Gate = loadLatestPhase2Gate();
let phase3Recommendation = "may_proceed_phase3_economic_drill";
if (p2Gate !== "may_proceed_controlled") {
  phase3Recommendation = p2Gate == null ? "hold_run_phase2_first" : "hold_phase2_not_green";
}

console.log(
  JSON.stringify(
    {
      ok: true,
      outPath,
      latestPath,
      digest: baseline.digest,
      operationalTrust: baseline.operationalTrust,
      phase3Recommendation,
      distinction: "controlled_exposure ≠ global_readiness"
    },
    null,
    2
  )
);
