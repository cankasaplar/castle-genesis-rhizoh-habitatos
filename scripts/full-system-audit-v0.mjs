#!/usr/bin/env node
/**
 * Full system test audit v0 — peripheral / experimental cleanup lane.
 * NOT a production deploy gate. Does not block world deploy.
 * @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md § Test tiers
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("Rhizoh Full System Audit v0 (non-blocking cleanup lane)\n");
console.log("Scope: voice engine v3 · whisper · transcribe transport · experimental adapters");
console.log("Deploy gates: npm run ops:deploy-test-phase-v0\n");

const r = spawnSync("npm run test:all", {
  cwd: root,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

if (r.status !== 0) {
  console.error("\n--- Full system audit: FAIL (non-blocking for world deploy) ---");
  console.error("Triage peripheral failures separately from deploy gates.\n");
  process.exit(r.status || 1);
}

console.log("\n--- Full system audit: PASS ---\n");
