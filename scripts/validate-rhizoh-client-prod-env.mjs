#!/usr/bin/env node
/**
 * Fail fast before `vite build` if rhizoh.com production env cannot bake gateway transport.
 * Vite inlines import.meta.env at compile time — runtime fixes cannot add VITE_GATEWAY_TOKEN.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "apps", "client", ".env.production");

function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error(
    "[rhizoh-prod-env] Missing apps/client/.env.production — run:\n" +
      "  powershell -File scripts/setup-rhizoh-t0-production.ps1"
  );
  process.exit(1);
}

const env = parseEnvFile(readFileSync(envPath, "utf8"));
const token = String(env.VITE_GATEWAY_TOKEN || "").trim();
const llm = String(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "").trim();
const live = String(env.VITE_LIVE_GATEWAY_BASE || "").trim();
const errors = [];

if (token.length < 8) {
  errors.push("VITE_GATEWAY_TOKEN missing or too short (must match Render CASTLE_GATEWAY_TOKEN)");
}
if (!llm && !live) {
  errors.push("VITE_GATEWAY_HTTP or VITE_LIVE_GATEWAY_BASE required");
}
if (/localhost|127\.0\.0\.1/i.test(`${llm} ${live}`)) {
  errors.push("production gateway URL must not point at localhost");
}

if (errors.length) {
  console.error("[rhizoh-prod-env] Production build blocked:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(
  `[rhizoh-prod-env] OK — gateway token len=${token.length}, llm host configured (baked at vite build)`
);
