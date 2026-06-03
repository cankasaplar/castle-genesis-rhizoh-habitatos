#!/usr/bin/env node
/**
 * Organism Stabilization v0 — rhythm + jitter CI gate.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const tests = [
  "src/rhizoh/runtime/__tests__/rhizohOrganismStabilizationV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohCastleCoherenceHardeningV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohMultiInhabitantCoPresenceV0.test.js"
].join(" ");

const r = spawnSync(`npx vitest run ${tests}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- Organism rhythm (browser prod) ---");
console.log("window.__rhizoh.organismRhythm.ok");
console.log("window.__rhizoh.organismStabilization.rhythm.max_jitter_ms");
console.log("window.__rhizoh.petCitizen.motion_frame_lock");
console.log("window.__rhizoh.perceptualContinuitySmooth.breathe01_smooth\n");

process.exit(r.status === 0 ? 0 : 1);
