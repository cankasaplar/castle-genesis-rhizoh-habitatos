#!/usr/bin/env node
/**
 * Synthetic Crisis Week — Phase 2: Observability Integrity
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runSyntheticCrisisPhase2V0 } from "../apps/gateway/src/ops/syntheticCrisisHarnessPhase2V0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const report = runSyntheticCrisisPhase2V0();
const stamp = new Date().toISOString().slice(0, 10);
const outPath = join(outDir, `synthetic_crisis_phase2_${stamp}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
writeFileSync(join(outDir, "synthetic_crisis_phase2_LATEST.json"), JSON.stringify(report, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      ok: report.summary.failed === 0,
      outPath,
      summary: report.summary,
      phase3Gate: report.phase3Gate
    },
    null,
    2
  )
);
process.exit(report.summary.failed === 0 ? 0 : 1);
