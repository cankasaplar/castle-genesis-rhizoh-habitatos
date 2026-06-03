#!/usr/bin/env node
/**
 * World Identity Consistency Harness v0 — ICL gate (live vs WAL vs replay).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const tests = [
  "src/rhizoh/runtime/__tests__/rhizohIdentityConsistencyLayerV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohWorldWalPersistenceB2V0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohWorldReplayV0.test.js"
].join(" ");

const r = spawnSync(`npx vitest run ${tests}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- ICL harness (browser prod) ---");
console.log("window.__rhizoh.worldIdentityConsistency.ok");
console.log("window.__rhizoh.worldIdentityConsistency.equivalence.same_world");
console.log("window.__rhizoh.worldIdentityConsistency.drift.drift_class");
console.log("await import('./rhizohIdentityConsistencyLayerV0.js').runWorldIdentityConsistencyHarnessAsyncV0()\n");

process.exit(r.status === 0 ? 0 : 1);
