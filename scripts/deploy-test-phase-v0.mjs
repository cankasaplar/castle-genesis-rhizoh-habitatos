#!/usr/bin/env node
/**
 * Rhizoh Deploy + Test Phase v0 — post architecture-lock gate bundle.
 * @see docs/RHIZOH_DEPLOY_TEST_PHASE_V0.md
 * @see docs/RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md
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

console.log("Rhizoh Deploy + Test Phase v0 (World OS v0.2 lock)\n");

runStep("npm run ops:production-rhythm-stress-v0", "Gate: rhythm stress");
runStep("npm run ops:world-identity-consistency-v0", "Gate: ICL harness");
runStep("npm run ops:castle-coherence-hardening-v0", "Gate: castle coherence");
runStep("npm run ops:production-deploy-gates-v0", "Gate: deploy runbook");
runStep("npm run ops:world-expansion-v0", "Gate: world expansion layer");
runStep("npm run build:ci -w apps/client", "Build: world runtime (CI)");
runStep("node scripts/materialize-world-artifacts-v0.mjs", "Artifacts: materialize");
runStep("node scripts/verify-world-artifacts-v0.mjs", "Artifacts: verify");
runStep("node scripts/bootstrap-world-v0.mjs --skip-gates", "Bootstrap: world runtime");
runStep("node scripts/post-deploy-monitor-v0.mjs --compressed", "Monitor: 60s window (compressed)");

console.log("\n--- Rhizoh Deploy + Test Phase v0: ALL GATES PASS ---");
console.log("Architecture: World OS v0.2 LOCKED (CORE · WORLD · PRODUCT)");
console.log("Next: Render (rhizoh-core) → Firebase → Edge (rhizoh.com) → manual product smoke\n");
