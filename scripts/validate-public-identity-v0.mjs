#!/usr/bin/env node
/**
 * Validate public identity artifacts (.well-known JSON + rhizoh/*.md mirrors).
 * Run: npm run ops:validate-public-identity-v0
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(root, "apps/client/public");

const REQUIRED = Object.freeze([
  ".well-known/rhizoh-identity.json",
  ".well-known/rhizoh-causal-snapshot.json",
  "rhizoh/system-overview.md",
  "rhizoh/protocol-v0.md",
  "rhizoh/identity-manifest-v0.md",
  "rhizoh/epistemic-identity-spec.md",
  "rhizoh/honest-baseline-charter-v1.md"
]);

const IDENTITY_REQUIRED_KEYS = [
  "schema",
  "name",
  "version",
  "constitutional_anchor",
  "identity",
  "capabilities",
  "status",
  "interpretationOnly",
  "nonExecutive"
];

const SNAPSHOT_REQUIRED_KEYS = ["schema", "summary", "interpretationOnly"];

let failed = false;

function fail(msg) {
  console.error(`validate-public-identity-v0: ${msg}`);
  failed = true;
}

for (const rel of REQUIRED) {
  const abs = join(publicRoot, rel);
  if (!existsSync(abs)) {
    fail(`missing ${rel}`);
  }
}

function loadJson(rel) {
  const abs = join(publicRoot, rel);
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    fail(`${rel}: invalid JSON — ${e.message}`);
    return null;
  }
}

const identity = loadJson(".well-known/rhizoh-identity.json");
if (identity) {
  for (const key of IDENTITY_REQUIRED_KEYS) {
    if (!(key in identity)) fail(`rhizoh-identity.json missing key: ${key}`);
  }
  if (identity.status?.mutation_access !== false) {
    fail("rhizoh-identity.json status.mutation_access must be false");
  }
  if (identity.constitutional_anchor !== "Observation ≠ Execution") {
    fail("rhizoh-identity.json constitutional_anchor mismatch");
  }
  if (!String(identity.identity?.bootstrapReference?.epistemicIdentityId || "").startsWith("epi_id_")) {
    fail("rhizoh-identity.json identity.bootstrapReference.epistemicIdentityId invalid");
  }
}

const snapshot = loadJson(".well-known/rhizoh-causal-snapshot.json");
if (snapshot) {
  for (const key of SNAPSHOT_REQUIRED_KEYS) {
    if (!(key in snapshot)) fail(`rhizoh-causal-snapshot.json missing key: ${key}`);
  }
  if (snapshot.summary?.fullRawPublished === true) {
    fail("rhizoh-causal-snapshot.json must not publish full raw");
  }
}

if (failed) {
  process.exit(1);
}

console.log("validate-public-identity-v0: OK");
console.log(`  artifacts: ${REQUIRED.length} present`);
console.log(`  identity schema: ${identity?.schema}`);
console.log(`  bootstrap epi_id: ${identity?.identity?.bootstrapReference?.epistemicIdentityId}`);
