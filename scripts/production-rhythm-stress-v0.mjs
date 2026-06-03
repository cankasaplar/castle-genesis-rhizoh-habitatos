#!/usr/bin/env node
/**
 * Production Rhythm Stress Test v0 — pre-deploy final gate.
 * CI: compressed sim (~10 min logical ticks). Browser prod: run extended profile manually.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const extended = process.argv.includes("--extended");
const testFile = "src/rhizoh/runtime/__tests__/rhizohProductionRhythmStressTestV0.test.js";

const r = spawnSync(`npx vitest run ${testFile}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- Production Rhythm Stress (pre-deploy gate) ---");
console.log("Logical sim: ~10 min @ 1 tick/heartbeat (CI compressed)");
if (extended) {
  console.log("Tip: in browser console for ~30 min profile:");
  console.log("  import('./rhizohProductionRhythmStressTestV0.js').then(m =>");
  console.log("    m.runProductionRhythmStressTestV0({ ticks: 1800 }))");
}
console.log("window.__rhizoh.deployRhythmGate.deploy_ready");
console.log("window.__rhizoh.productionRhythmStressTest.summary");
console.log("window.__rhizoh.productionRhythmStressTest.jitter_graph");
console.log("window.__rhizoh.productionRhythmStressTest.drift_trace\n");

process.exit(r.status === 0 ? 0 : 1);
