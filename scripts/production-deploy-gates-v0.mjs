#!/usr/bin/env node
/**
 * Production Deployment Runbook v0 — pre-deploy gate bundle (CI).
 * @see docs/RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const suites = [
  "src/rhizoh/runtime/__tests__/rhizohProductionRhythmStressTestV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohProductionDeploymentRunbookV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohWorldBootstrapV0.test.js"
].join(" ");

const r = spawnSync(`npx vitest run ${suites}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- Production Deployment Runbook v0 (pre-deploy gates) ---");
console.log("1. Rhythm:  window.__rhizoh.deployRhythmGate.deploy_ready");
console.log("2. ICL:     window.__rhizoh.worldIdentityConsistency.equivalence.same_world");
console.log("3. Castle:  window.__rhizoh.castleCoherenceLock.ok");
console.log("4. Organism: window.__rhizoh.organismRhythm.ok");
console.log("Combined:   evaluatePreDeployGatesV0() → window.__rhizoh.preDeployGates");
console.log("Deploy:     await executeProductionDeploymentV0(...)");
console.log("Rollback:   await executeProductionRollbackV0()");
console.log("Monitor:    window.__rhizoh.liveMonitor");
console.log("Success:    evaluateDeploySuccessConditionV0()");
console.log("Post-60s:   startPostDeployObservationV0()");
console.log("Emergency:  enableEmergencyModeV0()");
console.log("Restore:    restoreWorldStateAtMsV0(lastStableMs)\n");

process.exit(r.status === 0 ? 0 : 1);
