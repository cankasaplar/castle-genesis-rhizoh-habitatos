#!/usr/bin/env node
/**
 * T0 interface live readiness — gateway health + env checklist (no browser).
 * Usage: node scripts/verify-t0-live-readiness.mjs [--gateway https://...]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lock = JSON.parse(readFileSync(join(__dirname, "t0-interface-lock.v1.json"), "utf8"));

const args = process.argv.slice(2);
let gatewayBase =
  process.env.VITE_LIVE_GATEWAY_BASE ||
  process.env.GATEWAY_BASE ||
  "https://castle-genesis-rhizoh-habitatos.onrender.com";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--gateway" && args[i + 1]) {
    gatewayBase = args[i + 1];
    i++;
  }
}

gatewayBase = gatewayBase.replace(/\/$/, "");

const checks = [
  { path: "/health/live", label: "health/live" },
  { path: "/health/ready", label: "health/ready" },
  { path: "/deps", label: "deps" }
];

let failed = 0;

console.log("T0 interface lock:", lock.shortCommit, lock.tag);
console.log("Gateway:", gatewayBase);
console.log("");

for (const { path, label } of checks) {
  const url = `${gatewayBase}${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
    const ok = res.ok;
    console.log(`${ok ? "OK" : "FAIL"} ${label} (${res.status}) ${url}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`FAIL ${label} ${url} — ${err.message}`);
    failed++;
  }
}

console.log("");
console.log("--- Live UI checklist (manual / rhizoh.com) ---");
const manual = [
  "Ingress: legal preamble → cohort → Castle shell loads (not text-only genesis)",
  "Map: Cesium / globe visible full-screen",
  "Bottom bar: World / Hall / Green Room / Broadcast / Studio / Profile",
  "Halo: capability wheel opens (RhizohCapabilityHaloV1)",
  "Gateway: WS connected (no localhost:8090 unless -Local)",
  "Agent HUD + swarm GPU visible when surface active",
  "Hall / Studio drawer panels open without console errors",
  "Research nodes (Kadikoy/Barcelona): OFF unless explicit VITE_SATELLITE_NODE_REGISTRY_V0=1"
];
manual.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("");
console.log("Worktree:");
console.log(`  powershell -File scripts/run-t0-interface-worktree.ps1`);
console.log(`  cd ${lock.worktreePath}`);
console.log(`  npm install && powershell -File scripts/setup-rhizoh-t0-dev.ps1`);
console.log(`  npm run dev -w apps/client`);

process.exit(failed > 0 ? 1 : 0);
