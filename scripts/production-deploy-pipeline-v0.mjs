#!/usr/bin/env node
/**
 * Production Deploy Pipeline v0 — CI build + ops gate bundle.
 * @see docs/RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md §2.2
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} cmd @param {string} label */
function runStep(cmd, label) {
  console.log(`\n>>> ${label}`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`\nFAIL: ${label}`);
    process.exit(r.status || 1);
  }
}

runStep("npm run build", "build");
runStep("npm run ops:production-rhythm-stress-v0", "rhythm stress gate");
runStep("npm run ops:world-identity-consistency-v0", "ICL harness");
runStep("npm run ops:castle-coherence-hardening-v0", "castle coherence");
runStep("npm run ops:production-deploy-gates-v0", "deploy runbook gates");

console.log("\n--- Production Deploy Pipeline v0: ALL DEPLOY GATES PASS ---");
console.log("Peripheral audit (optional): npm run ops:full-system-audit-v0");
console.log("Next: Firebase → Render → Edge → 60s observation window\n");
