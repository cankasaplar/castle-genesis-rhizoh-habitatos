#!/usr/bin/env node
/**
 * Render / production authority surface audit — misconfiguration risk, not code defects.
 *
 * Usage:
 *   node scripts/renderProductionAuthorityAudit.mjs
 *   node scripts/renderProductionAuthorityAudit.mjs --strict
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const ok = [];

function pass(msg) {
  ok.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}
function fail(msg) {
  errors.push(msg);
}

function parseEnv(text) {
  const out = {};
  if (!text) return out;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function loadEnv(relPaths) {
  for (const rel of relPaths) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      return { rel, env: parseEnv(fs.readFileSync(full, "utf8")) };
    }
  }
  return { rel: null, env: {} };
}

function shannonEntropyBits(str) {
  if (!str) return 0;
  const freq = new Map();
  for (const c of str) freq.set(c, (freq.get(c) || 0) + 1);
  let bits = 0;
  const len = str.length;
  for (const n of freq.values()) {
    const p = n / len;
    bits -= p * Math.log2(p);
  }
  return bits * len;
}

function auditSecretEntropy(name, value, minBits = 96) {
  const v = String(value || "").trim();
  if (!v) {
    if (strict) fail(`${name}: empty`);
    else warn(`${name}: empty`);
    return;
  }
  const bits = shannonEntropyBits(v);
  if (v.length < 24) {
    fail(`${name}: too short (${v.length} chars, want >=24)`);
  } else if (bits < minBits) {
    warn(`${name}: low entropy estimate (${Math.round(bits)} bits, want ~${minBits}+)`);
  } else {
    pass(`${name}: length/entropy OK`);
  }
  const weak = new Set([
    "castle_dev_token_2026",
    "dev_local_secret",
    "changeme",
    "password",
    "test",
    "your-token-here"
  ]);
  if (weak.has(v.toLowerCase()) || /^castle_dev_/i.test(v)) {
    fail(`${name}: known weak / dev template value — rotate before production`);
  }
}

function auditTokenIsolation(gw, client) {
  const gt = String(gw.CASTLE_GATEWAY_TOKEN || "").trim();
  const jwt = String(gw.CASTLE_JWT_SECRET || "").trim();
  const store = String(gw.CASTLE_STORE_SECRET || "").trim();
  const seal = String(gw.CASTLE_EPISTEMIC_SEAL_SECRET || "").trim();
  const viteTok = String(client.VITE_GATEWAY_TOKEN || "").trim();

  if (gt && jwt && gt === jwt) {
    fail("token isolation: CASTLE_GATEWAY_TOKEN must not equal CASTLE_JWT_SECRET");
  } else if (gt && jwt) {
    pass("token isolation: gateway token != JWT secret");
  }

  if (gt && store && gt === store) {
    warn("token isolation: CASTLE_GATEWAY_TOKEN equals CASTLE_STORE_SECRET — prefer distinct secrets");
  }
  if (gt && seal && gt === seal && seal.length > 0) {
    warn("token isolation: CASTLE_GATEWAY_TOKEN equals CASTLE_EPISTEMIC_SEAL_SECRET — prefer distinct");
  }

  if (viteTok && gt && viteTok !== gt) {
    fail("client/gateway: VITE_GATEWAY_TOKEN != CASTLE_GATEWAY_TOKEN (when both set locally)");
  } else if (viteTok && gt) {
    pass("client/gateway: shared transport token aligned");
  }
}

function auditWsOriginRestrictions(env) {
  const origins = String(env.CASTLE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cors = String(env.CASTLE_HTTP_CORS_ORIGIN || "").trim();

  if (origins.length === 0 && !cors) {
    fail("WS/HTTP CORS: CASTLE_ALLOWED_ORIGINS and CASTLE_HTTP_CORS_ORIGIN both empty in production posture");
  } else {
    pass(`WS CORS: ${origins.length} allowed origin(s)`);
  }

  if (cors === "*") {
    warn("WS/HTTP CORS: CASTLE_HTTP_CORS_ORIGIN=* — avoid in production");
  }
  for (const o of origins) {
    if (/localhost|127\.0\.0\.1/i.test(o) && strict) {
      warn(`WS CORS: localhost in ALLOWED_ORIGINS (${o}) — remove for strict production`);
    }
  }
}

function auditFirebaseAdminScope(env) {
  const email = String(env.FIREBASE_CLIENT_EMAIL || "").trim();
  if (!email) {
    if (strict && env.CASTLE_REQUIRE_AUTH === "true") {
      warn("firebase: FIREBASE_CLIENT_EMAIL unset — prefer dedicated gateway service account");
    }
    return;
  }
  pass(`firebase: service account configured (${email.slice(0, 24)}…)`);
  if (!/@.*\.iam\.gserviceaccount\.com$/i.test(email)) {
    warn("firebase: client email does not look like a service account — verify least-privilege IAM");
  }
  if (String(env.FIREBASE_PRIVATE_KEY || "").includes("BEGIN PRIVATE KEY") === false && env.FIREBASE_PRIVATE_KEY) {
    warn("firebase: FIREBASE_PRIVATE_KEY may be malformed (missing PEM header)");
  }
}

function auditRotationHygiene(env) {
  const rotatedAt = String(env.CASTLE_SECRETS_ROTATED_AT || env.CASTLE_GATEWAY_TOKEN_ROTATED_AT || "").trim();
  if (!rotatedAt) {
    warn("rotation: set CASTLE_SECRETS_ROTATED_AT (ISO date) in Render for operational traceability");
  } else {
    const ageMs = Date.now() - Date.parse(rotatedAt);
    if (!Number.isFinite(ageMs)) {
      warn("rotation: CASTLE_SECRETS_ROTATED_AT is not a valid ISO date");
    } else {
      const days = ageMs / (86400 * 1000);
      pass(`rotation: last declared ${Math.round(days)}d ago`);
      if (days > 90) warn("rotation: secrets older than 90d — schedule CASTLE_GATEWAY_TOKEN rotation");
    }
  }
}

function auditRenderYaml() {
  const p = path.join(root, "render.yaml");
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  const authBlock = raw.match(/- key: CASTLE_REQUIRE_AUTH[\s\S]*?value:\s*"?([^"\n]+)"?/i);
  if (authBlock && authBlock[1].trim().toLowerCase() === "false") {
    warn("render.yaml: CASTLE_REQUIRE_AUTH=false — set true before production substrate deploy");
  } else if (authBlock && authBlock[1].trim().toLowerCase() === "true") {
    pass("render.yaml: CASTLE_REQUIRE_AUTH=true");
  }
  if (!/CASTLE_REQUIRE_WAL_PEER_AUTH/i.test(raw)) {
    warn("render.yaml: add CASTLE_REQUIRE_WAL_PEER_AUTH=true and CASTLE_REJECT_UNSIGNED_WAL=true");
  }
  if (/castle_dev_token/i.test(raw)) {
    fail("render.yaml: contains dev token literal — remove from IaC");
  }
}

console.log("\n=== Render / production authority audit ===\n");

const gatewayEnv = loadEnv(["apps/gateway/.env", "apps/gateway/.env.local", "apps/gateway/.env.production.example"]);
const clientEnv = loadEnv([
  "apps/client/.env.production",
  "apps/client/.env.production.local",
  "apps/client/.env.production.example"
]);
const env = { ...gatewayEnv.env, ...clientEnv.env, ...process.env };

const isProd =
  String(env.NODE_ENV || "").toLowerCase() === "production" ||
  String(env.CASTLE_DEPLOY_ENV || "").toLowerCase() === "production";

auditSecretEntropy("CASTLE_GATEWAY_TOKEN", env.CASTLE_GATEWAY_TOKEN);
auditSecretEntropy("CASTLE_JWT_SECRET", env.CASTLE_JWT_SECRET, 128);
auditSecretEntropy("CASTLE_STORE_SECRET", env.CASTLE_STORE_SECRET, 96);
auditTokenIsolation(env, clientEnv.env);
auditWsOriginRestrictions(env);
auditFirebaseAdminScope(env);
auditRotationHygiene(env);
auditRenderYaml();

const devAnon = env.CASTLE_ALLOW_DEV_ANON === "true";
const devUid = env.CASTLE_ALLOW_DEV_HTTP_UID === "true";
if (devAnon || devUid) {
  if (isProd || strict) fail("dev bypass: CASTLE_ALLOW_DEV_ANON or CASTLE_ALLOW_DEV_HTTP_UID is true");
  else warn("dev bypass: enabled in loaded env (OK for local dev only)");
} else {
  pass("dev bypass: disabled");
}

if (env.CASTLE_REQUIRE_AUTH !== "true" && (isProd || strict)) {
  warn("auth: CASTLE_REQUIRE_AUTH is not true — WS identity verifier bypass risk");
} else if (env.CASTLE_REQUIRE_AUTH === "true") {
  pass("auth: CASTLE_REQUIRE_AUTH=true");
}

const hasFirebase =
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;
const hasJwt = String(env.CASTLE_JWT_SECRET || "").trim().length >= 16;
if (!hasFirebase && !hasJwt) {
  if (strict || isProd) fail("identity: no Firebase Admin or CASTLE_JWT_SECRET");
  else warn("identity: no verifier in loaded env — set in Render panel before deploy");
} else {
  if (hasFirebase) pass("identity: Firebase Admin path");
  if (hasJwt) pass("identity: JWT secret path");
}

if (env.CASTLE_REQUIRE_WAL_PEER_AUTH === "false" && (isProd || strict)) {
  warn("WAL: CASTLE_REQUIRE_WAL_PEER_AUTH=false in production posture");
}
if (env.CASTLE_REJECT_UNSIGNED_WAL === "false" && (isProd || strict)) {
  warn("WAL: CASTLE_REJECT_UNSIGNED_WAL=false — unsigned ingress not blocked at relay");
}

console.log("\n--- PASS ---");
ok.forEach((m) => console.log("  ✓", m));
if (warnings.length) {
  console.log("\n--- WARN ---");
  warnings.forEach((m) => console.log("  !", m));
}
if (errors.length) {
  console.log("\n--- FAIL ---");
  errors.forEach((m) => console.log("  ✗", m));
  console.log("\nFix authority surface before production deploy.\n");
  process.exit(1);
}

console.log("\nAuthority surface audit OK (review warnings for Render panel).\n");
process.exit(0);
