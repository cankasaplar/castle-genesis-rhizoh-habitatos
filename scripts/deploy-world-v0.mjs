#!/usr/bin/env node
/**
 * Rhizoh Production Automation Layer v0 — single command world deployment orchestrator.
 * @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");
const skipInfra = dryRun || process.argv.includes("--skip-infra");

if (process.env.FULL_TESTS === "1" || process.argv.includes("--full-tests")) {
  console.warn(
    "WARN: FULL_TESTS is not part of production deploy (peripheral suite — non-blocking).\n" +
      "      Use: npm run ops:full-system-audit-v0\n"
  );
}

/** @param {string} cmd @param {string} label */
function runStep(cmd, label) {
  console.log(`\n>>> ${label}`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`\nFAIL: ${label}`);
    process.exit(r.status || 1);
  }
}

/** @param {string} cmd @param {string} label */
function runOptional(cmd, label) {
  console.log(`\n>>> ${label}${dryRun ? " (dry-run skip)" : ""}`);
  if (dryRun) return;
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    console.warn(`WARN: ${label} failed (exit ${r.status}) — continue or rollback manually`);
  }
}

console.log("Rhizoh Production Automation Layer starting...\n");

runStep("npm run ops:production-rhythm-stress-v0", "CI gate: rhythm stress");
runStep("npm run ops:world-identity-consistency-v0", "CI gate: ICL");
runStep("npm run ops:castle-coherence-hardening-v0", "CI gate: castle coherence");
runStep("npm run ops:production-deploy-gates-v0", "CI gate: deploy runbook bundle");
runStep("npm run build:ci -w apps/client", "Build world runtime (CI)");
runStep("node scripts/materialize-world-artifacts-v0.mjs", "Materialize world artifacts");
runStep("node scripts/verify-world-artifacts-v0.mjs", "Verify world artifacts");

if (!skipInfra) {
  runOptional("render deploy service rhizoh-core", "Deploy Render (rhizoh-core)");
  runOptional("npm run firebase:deploy:hosting", "Deploy Firebase (Studio UI)");
  runOptional("vercel deploy --prod", "Deploy Edge (rhizoh.com)");
}

runStep("node scripts/bootstrap-world-v0.mjs --skip-gates", "Bootstrap world runtime");
runStep("node scripts/post-deploy-monitor-v0.mjs --compressed", "Post-deploy stability (compressed)");

console.log("\nRhizoh world deployment complete.\n");
