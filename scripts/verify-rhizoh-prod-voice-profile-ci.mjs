#!/usr/bin/env node
/**
 * Fail CI if spatial-main .env.production lacks voice v3 + Serencebey profile keys.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "client", ".env.production");

const REQUIRED = [
  ["VITE_RHIZOH_VOICE_ENGINE_V3", "1"],
  ["VITE_RHIZOH_VOICE_WITNESS_SHADOW", "1"],
  ["VITE_RHIZOH_VOICE_ENV_PROFILE", "1"],
  ["VITE_RHIZOH_FAST_SPEECH_MODE", "1"],
  ["VITE_RHIZOH_VOICE_INGEST_STRICT", "1"],
  ["VITE_RHIZOH_ORIGIN_SEED_LABEL", "Serencebey Castle"],
  ["VITE_WORLD_LAYER", "1"]
];

if (!existsSync(envPath)) {
  console.error("[rhizoh-prod-voice-verify] Missing apps/client/.env.production");
  process.exit(1);
}

const text = readFileSync(envPath, "utf8");
/** @type {Record<string, string>} */
const env = {};
for (const line of text.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const missing = [];
for (const [key, expected] of REQUIRED) {
  if (env[key] !== expected) missing.push(`${key}=${env[key] ?? "(absent)"} expected ${expected}`);
}

if (missing.length) {
  console.error("[rhizoh-prod-voice-verify] Production voice profile incomplete:\n" + missing.map((m) => `  - ${m}`).join("\n"));
  process.exit(1);
}

console.log("[rhizoh-prod-voice-verify] OK — voice v3 + Serencebey spatial-main profile present");
