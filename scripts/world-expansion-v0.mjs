#!/usr/bin/env node
/**
 * World Expansion Layer v0.1 — post-deploy evolution stack tests.
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const client = join(root, "apps/client");
const testFile = "src/rhizoh/runtime/__tests__/rhizohWorldExpansionLayerV0.test.js";

const r = spawnSync(`npx vitest run ${testFile}`, {
  cwd: client,
  shell: true,
  stdio: "inherit",
  encoding: "utf8"
});

console.log("\n--- World Expansion Layer v0.1 ---");
console.log("window.__rhizoh.petEvolution");
console.log("window.__rhizoh.studioLiveEditor");
console.log("window.__rhizoh.castleGraph");
console.log("window.__rhizoh.hotReloadRuntime");
console.log("window.__rhizoh.scrDistributedMesh");
console.log("window.__rhizoh.worldExpansionLayer");
console.log("await primeWorldExpansionLayerV0()\n");

process.exit(r.status === 0 ? 0 : 1);
