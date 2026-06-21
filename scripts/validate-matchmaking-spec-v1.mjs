#!/usr/bin/env node
/**
 * Matchmaking Core Spec v1 — doc/schema/runtime boundary checks.
 * Run: npm run ops:validate-matchmaking-spec-v1
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
const schemas = join(docs, "schemas");
const runtime = join(root, "apps/client/src/rhizoh/runtime");
const protocol = join(root, "packages/protocol/src/index.js");

const REQUIRED_DOCS = [
  "RHIZOH_MATCHMAKING_CORE_SPEC_V1.md",
  "RHIZOH_DAILY_MATCH_SCHEMA_V1.md",
  "RHIZOH_SEDIMENT_WEIGHT_KERNEL_V1.md"
];

const REQUIRED_SCHEMAS = [
  "rhizoh-match-beacon-v1.schema.json",
  "rhizoh-match-session-v1.schema.json",
  "rhizoh-matchmaking-ws-envelope-v1.schema.json"
];

const RUNTIME_FILES = [
  "matchmakingConsoleV0.js",
  "matchmakingBeaconRegistryV0.js",
  "matchmakingEngineV0.js",
  "matchSessionLifecycleV0.js",
  "matchmakingCodexBridgeV0.js"
];

let failed = false;

for (const doc of REQUIRED_DOCS) {
  const abs = join(docs, doc);
  if (!existsSync(abs)) {
    console.error(`matchmaking-spec-v1: missing doc ${doc}`);
    failed = true;
    continue;
  }
  const text = readFileSync(abs, "utf8");
  if (!text.includes("RESEARCH-ONLY")) {
    console.error(`matchmaking-spec-v1: ${doc} must declare RESEARCH-ONLY`);
    failed = true;
  }
}

for (const schema of REQUIRED_SCHEMAS) {
  if (!existsSync(join(schemas, schema))) {
    console.error(`matchmaking-spec-v1: missing schema ${schema}`);
    failed = true;
  }
}

for (const file of RUNTIME_FILES) {
  const abs = join(runtime, file);
  const text = readFileSync(abs, "utf8");
  if (!text.includes("shadowRehearsal: true") && !text.includes("shadowRehearsal")) {
    console.error(`matchmaking-spec-v1: ${file} must declare shadow rehearsal`);
    failed = true;
  }
  if (!text.includes("interpretationOnly: true") && !text.includes("interpretationOnly")) {
    console.error(`matchmaking-spec-v1: ${file} must declare interpretationOnly`);
    failed = true;
  }
  if (text.includes("publishCausalMapLayerV0") || text.includes("appendIdentityEventV0")) {
    console.error(`matchmaking-spec-v1: forbidden sink in ${file}`);
    failed = true;
  }
}

const lifecycleText = readFileSync(join(runtime, "matchSessionLifecycleV0.js"), "utf8");
if (!lifecycleText.includes("isLegalSessionTransitionV0")) {
  console.error("matchmaking-spec-v1: lifecycle must enforce legal transitions");
  failed = true;
}

const engineText = readFileSync(join(runtime, "matchmakingEngineV0.js"), "utf8");
if (!engineText.includes("MATCH_PAIR_THRESHOLD_V0") || !engineText.includes("MATCH_AI_FALLBACK_MS_V0")) {
  console.error("matchmaking-spec-v1: engine must define pair threshold and AI fallback");
  failed = true;
}

const codexText = readFileSync(join(runtime, "matchmakingCodexBridgeV0.js"), "utf8");
if (!codexText.includes("influencesExecution: false") || !codexText.includes("match_finished_event")) {
  console.error("matchmaking-spec-v1: CODEX bridge must be non-executive snapshot only");
  failed = true;
}

const protocolText = readFileSync(protocol, "utf8");
if (!protocolText.includes("MATCH_BEACON_EMIT") || !protocolText.includes("MATCH_FINISHED")) {
  console.error("matchmaking-spec-v1: protocol must declare MATCH_* WS messages");
  failed = true;
}

if (failed) process.exit(1);
console.log("validate-matchmaking-spec-v1: OK");
