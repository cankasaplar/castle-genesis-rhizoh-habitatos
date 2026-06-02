#!/usr/bin/env node
/**
 * Cohort runtime freeze gate — language kernel + command graph + replay + attacks.
 * Usage: node scripts/run-cohort-runtime-freeze-v0.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "apps", "client");

const patterns = [
  "src/rhizoh/runtime/__tests__/rhizohOutputLanguagePolicyV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohFinalLanguageCommitV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohVoiceCommandRouterV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohLocalCommandFuzzV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohHybridLeakageAttackSuiteV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohExecutionGraphReplayEngineV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohCommandExecutionGraphV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohCohortRuntimeSnapshotV0.test.js"
];

const r = spawnSync("npx", ["vitest", "run", ...patterns], {
  cwd: clientDir,
  stdio: "inherit",
  shell: true
});

if (r.status !== 0) {
  console.error("[cohort-runtime-freeze] FAILED");
  process.exit(r.status || 1);
}
console.log("[cohort-runtime-freeze] OK — execution kernel + replay + attack suite");
