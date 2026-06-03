#!/usr/bin/env node
/**
 * Continuity smoke v0 — CI/local gate for deploy-ready presence + observability.
 * Runs vitest on continuity stack; prints release checklist summary.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const tests = [
  "src/rhizoh/runtime/__tests__/rhizohContinuityObservabilityV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohDeployReadyPresenceV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohContinuityIntegrityScoreV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohTemporalDriftGuardV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohT0FirstFrameBootstrapV0.test.js"
].join(" ");

const r = spawnSync(`npx vitest run ${tests}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- Continuity smoke checklist (browser prod) ---");
console.log("0-1s:  window.__rhizoh.continuityFirstPaint.ok");
console.log("0-3s:  window.__rhizoh.continuityObservability.cssi.stable");
console.log("      window.__rhizoh.continuityObservability.user_felt_presence_score01");
console.log("10s:   window.__rhizoh.continuityObservability.first_contact_success");
console.log("voice: window.__rhizoh.continuityObservability.voice_entry_success_rate01");
console.log("drift: window.__rhizoh.continuityObservability.continuity_integrity_drift_heatmap");
console.log("MCO:   OFF (observe-only layer only)\n");

process.exit(r.status === 0 ? 0 : 1);
