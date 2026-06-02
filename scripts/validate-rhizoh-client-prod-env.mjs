#!/usr/bin/env node
/**
 * Fail fast before `vite build` if rhizoh.com production env cannot bake gateway transport.
 * Vite inlines import.meta.env at compile time — runtime fixes cannot add VITE_GATEWAY_TOKEN.
 *
 * Local: reads apps/client/.env.production (see setup-rhizoh-t0-production.ps1).
 * CI: GitHub Actions secrets via process.env (no committed .env.production).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "apps", "client", ".env.production");

const isCi =
  process.env.CI === "true" ||
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.GITHUB_ACTIONS === "1";

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

function readProcessViteEnv() {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("VITE_") || value == null) continue;
    const v = String(value).trim();
    if (v) out[key] = v;
  }
  return out;
}

function loadMergedProdEnv() {
  const fromProcess = readProcessViteEnv();
  const fromFile = existsSync(envPath) ? parseEnvFile(readFileSync(envPath, "utf8")) : {};
  if (isCi) {
    return { ...fromFile, ...fromProcess };
  }
  return { ...fromProcess, ...fromFile };
}

const env = loadMergedProdEnv();
const hasEnvFile = existsSync(envPath);

if (!hasEnvFile && !isCi) {
  const hasInline =
    String(env.VITE_GATEWAY_TOKEN || "").trim().length >= 8 &&
    Boolean(String(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || env.VITE_LIVE_GATEWAY_BASE || "").trim());
  if (!hasInline) {
    console.error(
      "[rhizoh-prod-env] Missing apps/client/.env.production — run:\n" +
        "  powershell -File scripts/setup-rhizoh-t0-production.ps1"
    );
    process.exit(1);
  }
}

const token = String(env.VITE_GATEWAY_TOKEN || "").trim();
const gatewayUrl = String(env.VITE_GATEWAY_URL || "").trim().replace(/\/$/, "");
const llm = String(
  env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || (gatewayUrl ? `${gatewayUrl}/rhizoh/llm` : "")
).trim();
const live = String(env.VITE_LIVE_GATEWAY_BASE || gatewayUrl || "").trim();
const errors = [];

if (token.length < 8) {
  errors.push(
    isCi
      ? "VITE_GATEWAY_TOKEN missing or too short in CI secrets (must match Render CASTLE_GATEWAY_TOKEN)"
      : "VITE_GATEWAY_TOKEN missing or too short (must match Render CASTLE_GATEWAY_TOKEN)"
  );
}
if (!llm && !live) {
  errors.push(
    isCi
      ? "VITE_GATEWAY_HTTP or VITE_LIVE_GATEWAY_BASE required in GitHub Actions secrets"
      : "VITE_GATEWAY_HTTP or VITE_LIVE_GATEWAY_BASE required"
  );
}
if (/localhost|127\.0\.0\.1/i.test(`${llm} ${live}`)) {
  errors.push("production gateway URL must not point at localhost");
}

if (errors.length) {
  console.error("[rhizoh-prod-env] Production build blocked:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  console.error(
    "[rhizoh-prod-env] diag:",
    JSON.stringify({
      isCi,
      hasEnvFile,
      tokenLen: token.length,
      hasGatewayHttp: Boolean(llm),
      hasLiveBase: Boolean(live),
      hasGatewayUrl: Boolean(gatewayUrl),
      viteGatewayKeys: Object.keys(readProcessViteEnv()).filter((k) => /GATEWAY|RHIZOH_LLM|LIVE_GATEWAY/i.test(k))
    })
  );
  if (isCi) {
    console.error(
      "[rhizoh-prod-env] CI hint: Repository secrets → Settings → Secrets → Actions:\n" +
        "  VITE_GATEWAY_TOKEN (≥8 chars, same as Render CASTLE_GATEWAY_TOKEN)\n" +
        "  VITE_GATEWAY_HTTP or VITE_RHIZOH_LLM_HTTP or VITE_GATEWAY_URL or VITE_LIVE_GATEWAY_BASE"
    );
  }
  process.exit(1);
}

const source = isCi ? (hasEnvFile ? "ci+file" : "ci-secrets") : "file";
console.log(
  `[rhizoh-prod-env] OK (${source}) — gateway token len=${token.length}, llm host configured (baked at vite build)`
);
