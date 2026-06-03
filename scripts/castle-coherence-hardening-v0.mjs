#!/usr/bin/env node
/**
 * Castle Coherence Hardening v0 — perception drift + agent boundary CI gate.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const client = join(root, "apps/client");

const tests = [
  "src/rhizoh/runtime/__tests__/rhizohCastleCoherenceHardeningV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohMultiInhabitantCoPresenceV0.test.js",
  "src/rhizoh/runtime/__tests__/rhizohIdentityConsistencyLayerV0.test.js"
].join(" ");

const r = spawnSync(`npx vitest run ${tests}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- Castle coherence (browser prod) ---");
console.log("window.__rhizoh.castleCoherenceLock.ok");
console.log("window.__rhizoh.castleCoherenceHardening.perception.drift_class");
console.log("window.__rhizoh.agentCognitionBoundary.ok");
console.log("window.__rhizoh.studioPerceptualLock.ok\n");

process.exit(r.status === 0 ? 0 : 1);
