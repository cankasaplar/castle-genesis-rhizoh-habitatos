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
  "visitorEpistemicFingerprintV0.js",
  "epistemicReturnFieldV0.js",
  "epistemicPinSemanticRegistryV0.js",
  "epistemicResonanceFieldV0.js",
  "epistemicSeparationProofV0.js",
  "exportJsonSafeV0.js",
  "founderCohortAggregateV0.js",
  "invitationStudyExportV0.js",
  "narrativeProjectionEngineV0.js",
  "observerEpistemicLensV0.js",
  "narrativePlaneProjectionV0.js",
  "meaningResonanceLedgerV0.js",
  "narrativeBridgeValidationV0.js",
  "narrativeBridgeV0.js",
  "epistemicInvocationGuardV0.js"
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

if (!readFileSync(join(HOOK_DIR, "epistemicReturnFieldV0.js"), "utf8").includes("memory: false")) {
  console.error("observer-trace-boundary: epistemicReturnField must declare memory: false");
  failed = true;
}

if (!readFileSync(join(HOOK_DIR, "epistemicResonanceFieldV0.js"), "utf8").includes("measurementOnly: true")) {
  console.error("observer-trace-boundary: epistemicResonanceField must declare measurementOnly: true");
  failed = true;
}

if (!readFileSync(join(HOOK_DIR, "epistemicResonanceFieldV0.js"), "utf8").includes("influencesNarrative: false")) {
  console.error("observer-trace-boundary: epistemicResonanceField must not influence narrative");
  failed = true;
}

const ledgerText = readFileSync(join(HOOK_DIR, "meaningResonanceLedgerV0.js"), "utf8");
if (!ledgerText.includes("assertsStructure: false") || !ledgerText.includes("learns: false")) {
  console.error("observer-trace-boundary: meaningResonanceLedger must not assert structure or learn");
  failed = true;
}
if (!ledgerText.includes("influencesCausalGraph: false")) {
  console.error("observer-trace-boundary: meaningResonanceLedger must not influence causal graph");
  failed = true;
}

const bridgeText = readFileSync(join(HOOK_DIR, "narrativeBridgeV0.js"), "utf8");
if (bridgeText.includes("appendIdentityEventV0") || bridgeText.includes("publishCausalMapLayerV0")) {
  console.error("observer-trace-boundary: narrativeBridge must not write causal/identity sinks");
  failed = true;
}
if (!bridgeText.includes("meaningEmergesAgencyNever: true")) {
  console.error("observer-trace-boundary: narrativeBridge must declare meaningEmergesAgencyNever");
  failed = true;
}

const guardText = readFileSync(join(HOOK_DIR, "epistemicInvocationGuardV0.js"), "utf8");
if (!guardText.includes("bridge_and_ledger_consume_only_never_observe")) {
  console.error("observer-trace-boundary: epistemicInvocationGuard must enforce consume-only rule");
  failed = true;
}

if (!readFileSync(join(HOOK_DIR, "observerReadOnlyHookV0.js"), "utf8").includes("invocation_asymmetry")) {
  console.error("observer-trace-boundary: observe must block invocation_asymmetry during consume-only pass");
  failed = true;
}

if (failed) process.exit(1);
console.log("validate-observer-trace-boundary-v0: OK");
