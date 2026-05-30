#!/usr/bin/env node
/**
 * Passive production coherence check — observe only, no fixes.
 * @see docs/RHIZOH_LOW_RISK_ZONE_OPERATIONS_V1.0.md
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const vitestSuites = [
  "src/rhizoh/ingress/__tests__/ingress_router.test.js",
  "src/rhizoh/ingress/__tests__/rhizohIngressFlowV0.test.js",
  "src/rhizoh/ingress/__tests__/goLiveCohortSimulationV0.test.js",
  "src/rhizoh/runtime/__tests__/epistemicAuditBundleV0.test.js",
  "src/rhizoh/runtime/__tests__/worldRuntimeDaemonV0.test.js"
];

const checks = [];

for (const suite of vitestSuites) {
  const r = spawnSync("npm", ["run", "test", "-w", "apps/client", "--", suite], {
    cwd: root,
    encoding: "utf8",
    shell: true
  });
  checks.push({
    id: suite,
    ok: r.status === 0,
    exitCode: r.status,
    note: r.status === 0 ? "pass" : (r.stderr || r.stdout || "").slice(-400)
  });
}

let cohortDecision = null;
try {
  const url = pathToFileURL(
    join(root, "apps/client/src/rhizoh/ingress/goLiveCohortSimulationV0.js")
  ).href;
  const { runGoLiveCohortSimulationV0, buildGoLiveCohortExportBundleV0 } = await import(url);
  const run = runGoLiveCohortSimulationV0({ nodeCount: 10, seed: 1 });
  cohortDecision = buildGoLiveCohortExportBundleV0(run).decision;
  checks.push({ id: "go_live_cohort_sim_inline", ok: true, decision: cohortDecision });
} catch (e) {
  checks.push({ id: "go_live_cohort_sim_inline", ok: false, error: String(e?.message || e) });
}

const report = {
  schema: "castle.rhizoh.passive_coherence_check.v1",
  generatedAt: new Date().toISOString(),
  mode: "observe_only",
  legalFreezeRef: "LEGAL_FREEZE_SPEC_V1.0",
  allOk: checks.every((c) => c.ok),
  checks
};

const outPath = join(outDir, "passive_coherence_check_v1.0.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({ ok: report.allOk, path: outPath, checks: checks.length }, null, 2));
process.exit(report.allOk ? 0 : 1);
