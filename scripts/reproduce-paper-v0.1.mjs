#!/usr/bin/env node
/**
 * Rhizoh Paper v0.1 — single reproducibility entry point.
 * Runs spec validation + documents browser harness commands.
 *
 * Usage:
 *   node scripts/reproduce-paper-v0.1.mjs
 *   node scripts/reproduce-paper-v0.1.mjs --ci-only
 *
 * Browser (after client boot on rhizoh.com or local):
 *   await window.__rhizoh.matchmaking.verifyProduction({ reset: true })
 *   await window.__rhizoh.matchmaking.verifyAuthorityBoundary({ reset: true })
 *   await window.__rhizoh.matchmaking.verifyDriftInjection({ reset: true })
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ciOnly = process.argv.includes("--ci-only");

const steps = [
  {
    name: "matchmaking-spec-v1",
    cmd: "npm",
    args: ["run", "ops:validate-matchmaking-spec-v1"]
  }
];

if (!ciOnly) {
  steps.push({
    name: "client-truth-kernel-tests",
    cmd: "npm",
    args: ["run", "test", "-w", "apps/client", "--", "--run", "src/rhizoh/runtime/__tests__/matchmakingTruthKernelV0.test.js"]
  });
  steps.push({
    name: "client-authority-boundary-tests",
    cmd: "npm",
    args: ["run", "test", "-w", "apps/client", "--", "--run", "src/rhizoh/runtime/__tests__/matchmakingTruthAuthorityBoundaryV0.test.js"]
  });
}

console.log("[reproduce-paper-v0.1] Rhizoh preprint reproducibility harness");
console.log(`[reproduce-paper-v0.1] repo root: ${root}`);
console.log("");

let failed = 0;
for (const step of steps) {
  process.stdout.write(`→ ${step.name} ... `);
  const res = spawnSync(step.cmd, step.args, { cwd: root, stdio: "pipe", encoding: "utf8" });
  if (res.status === 0) {
    console.log("ok");
  } else {
    failed += 1;
    console.log("FAIL");
    if (res.stderr) process.stderr.write(res.stderr);
    if (res.stdout) process.stderr.write(res.stdout);
  }
}

console.log("");
console.log("Browser harness (manual — requires running client):");
console.log("  await window.__rhizoh.matchmaking.verifyProduction({ reset: true })");
console.log("  await window.__rhizoh.matchmaking.verifyAuthorityBoundary({ reset: true })");
console.log("  await window.__rhizoh.matchmaking.verifyDriftInjection({ reset: true })");
console.log("  window.__rhizoh.matchmaking.truthStatus()");
console.log("");
console.log("Expected: ok=true, clientIsCommitAuthority=false, produced === replayed");
console.log("Paper: docs/academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md");

process.exit(failed > 0 ? 1 : 0);
