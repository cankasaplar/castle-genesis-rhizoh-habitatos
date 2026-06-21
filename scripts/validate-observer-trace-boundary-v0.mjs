#!/usr/bin/env node
/**
 * Observer trace hard boundary — must not wire into identity/causal/learning sinks.
 * Run: npm run ops:validate-observer-trace-boundary-v0
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOOK_DIR = join(root, "apps/client/src/rhizoh/ingress");
const HOOK_FILES = [
  "observerReadOnlyHookV0.js",
  "visitorEpistemicTraceV0.js",
  "observerEpistemicLensV0.js",
  "narrativePlaneProjectionV0.js"
];

const FORBIDDEN_IN_HOOK = [
  "appendIdentityEventV0",
  "touchIdentityLifecycleV0",
  "buildCausalMapLayerV0(",
  "publishCausalMapLayerV0",
  "recordBundleFingerprintEvolutionV0"
];

let failed = false;

for (const file of HOOK_FILES) {
  const abs = join(HOOK_DIR, file);
  const text = readFileSync(abs, "utf8");
  for (const needle of FORBIDDEN_IN_HOOK) {
    if (text.includes(needle)) {
      console.error(`observer-trace-boundary: forbidden ${needle} in ${file}`);
      failed = true;
    }
  }
}

if (!readFileSync(join(HOOK_DIR, "observerReadOnlyHookV0.js"), "utf8").includes("influencesCausalGraph: false")) {
  console.error("observer-trace-boundary: missing influencesCausalGraph guard in observerReadOnlyHookV0.js");
  failed = true;
}

if (failed) process.exit(1);
console.log("validate-observer-trace-boundary-v0: OK");
