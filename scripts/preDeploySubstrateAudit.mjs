#!/usr/bin/env node
/**
 * Pre-deploy substrate audit — env, gateway auth posture, Firebase production path.
 * Does NOT enable ROS execution / federation law / cross-castle topology / global spatial consensus.
 *
 * Usage:
 *   node scripts/preDeploySubstrateAudit.mjs
 *   node scripts/preDeploySubstrateAudit.mjs --strict
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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

const SUBSTRATE_FLAGS = [
  "VITE_WORLD_RUNTIME_DAEMON",
  "VITE_PEER_WAL_CONVERGENCE",
  "VITE_WAL_GEOMETRY_INGRESS",
  "VITE_REALITY_SEAL_PERSIST",
  "VITE_REALITY_SEAL_HEARTBEAT",
  "VITE_GATEWAY_WS",
  "VITE_GATEWAY_HTTP",
  "VITE_GATEWAY_TOKEN"
];

const BLOCKED_FLAGS = [
  "VITE_ROS_EXECUTION_RUNTIME",
  "VITE_FEDERATION_LAW_NEGOTIATION",
  "VITE_CROSS_CASTLE_TOPOLOGY_MERGE",
  "VITE_GLOBAL_SPATIAL_CONSENSUS"
];

function auditClientEnv(env) {
  if (!String(env.VITE_GATEWAY_WS || env.VITE_GATEWAY_WS_URL || "").trim() && strict) {
    fail("client: VITE_GATEWAY_WS missing (peer convergence + social WAL need WS)");
  } else if (!String(env.VITE_GATEWAY_WS || "").trim()) {
    warn("client: VITE_GATEWAY_WS not set — WS substrate disabled");
  } else {
    pass("client: gateway WS configured");
  }

  for (const f of SUBSTRATE_FLAGS) {
    if (String(env[f] || "").trim() === "1") pass(`client: ${f}=1`);
  }

  for (const f of BLOCKED_FLAGS) {
    if (String(env[f] || "").trim() === "1") {
      fail(`client: ${f}=1 must NOT ship before substrate stable`);
    }
  }

  if (String(env.VITE_REALITY_SEAL_PERSIST || "") === "1" && strict) {
    pass("client: reality seal persist enabled — run corruption tests in CI");
  }
}

function auditGatewayAuth(env) {
  const hasFirebaseAdmin =
    String(env.FIREBASE_PROJECT_ID || "").trim() &&
    String(env.FIREBASE_CLIENT_EMAIL || "").trim() &&
    String(env.FIREBASE_PRIVATE_KEY || "").trim();
  const hasJwtSecret = String(env.CASTLE_JWT_SECRET || env.JWT_SECRET || "").trim().length >= 16;
  const hasGatewayToken = String(env.CASTLE_GATEWAY_TOKEN || "").trim().length >= 16;
  const hasIdentityVerifier = hasFirebaseAdmin || hasJwtSecret;

  if (!hasIdentityVerifier && !hasGatewayToken) {
    fail("gateway: no authority path — set Firebase Admin or CASTLE_JWT_SECRET (identity) and CASTLE_GATEWAY_TOKEN (transport)");
  } else {
    if (hasFirebaseAdmin) pass("gateway: Firebase Admin (primary identity path)");
    if (hasJwtSecret) pass("gateway: CASTLE_JWT_SECRET identity fallback");
    if (hasGatewayToken) pass("gateway: CASTLE_GATEWAY_TOKEN transport gate");
  }

  if (strict && !hasIdentityVerifier) {
    fail("gateway: strict deploy requires Firebase Admin or CASTLE_JWT_SECRET — token-only WS is not sufficient");
  } else if (!hasIdentityVerifier && hasGatewayToken) {
    warn("gateway: CASTLE_GATEWAY_TOKEN without identity verifier — unsigned WAL ingress risk at relay");
  }

  if (strict && env.CASTLE_REQUIRE_AUTH !== "true") {
    warn("gateway: CASTLE_REQUIRE_AUTH should be true in strict production deploy");
  }
  if (strict && env.CASTLE_REQUIRE_WAL_PEER_AUTH === "false") {
    warn("gateway: CASTLE_REQUIRE_WAL_PEER_AUTH=false weakens unsigned WAL closure");
  }
  if (hasIdentityVerifier && env.CASTLE_REQUIRE_WAL_PEER_AUTH !== "false") {
    pass("gateway: WAL peer auth path available (reject unsigned at relay when production defaults apply)");
  }
}

function auditClientAuthorityProfile(env) {
  const profile = String(env.VITE_CASTLE_AUTHORITY_PROFILE || env.VITE_ENV || "").trim().toLowerCase();
  if (!profile && strict) {
    warn("client: VITE_CASTLE_AUTHORITY_PROFILE unset — defaults to MODE (set production explicitly)");
  } else if (profile) {
    pass(`client: authority profile declared (${profile})`);
  }
  if (strict && profile && profile !== "production" && profile !== "prod") {
    warn("client: strict deploy expects VITE_CASTLE_AUTHORITY_PROFILE=production");
  }
}

function auditFirebaseProductionPaths() {
  const clientProd = loadEnv(["apps/client/.env.production", "apps/client/.env.production.local"]);
  const env = clientProd.env;
  const hasConfig =
    (String(env.VITE_FIREBASE_CONFIG || "").trim() && env.VITE_FIREBASE_CONFIG !== "{}") ||
    (String(env.VITE_FIREBASE_API_KEY || "").trim() && String(env.VITE_FIREBASE_PROJECT_ID || "").trim());

  if (!hasConfig) {
    fail("firebase: production client env missing VITE_FIREBASE_CONFIG or API_KEY+PROJECT_ID");
  } else {
    pass(`firebase: production config present (${clientProd.rel})`);
  }

  const rulesPath = path.join(root, "firestore.rules");
  if (!fs.existsSync(rulesPath)) {
    warn("firebase: firestore.rules not found at repo root");
  } else {
    pass("firebase: firestore.rules exists");
  }

  const hostingPath = path.join(root, "firebase.json");
  if (fs.existsSync(hostingPath)) {
    pass("firebase: firebase.json exists");
  }
}

function runVitestPreDeploy() {
  const r = spawnSync(
    "npx",
    ["vitest", "run", "src/rhizoh/runtime/__tests__/preDeploySubstrateGateV0.test.js"],
    {
      cwd: path.join(root, "apps/client"),
      shell: true,
      encoding: "utf8"
    }
  );
  if (r.status !== 0) {
    fail("substrate gate tests failed (preDeploySubstrateGateV0.test.js)");
    if (r.stdout) console.error(r.stdout.slice(-4000));
    if (r.stderr) console.error(r.stderr.slice(-2000));
  } else {
    pass("substrate gate vitest suite passed");
  }
}

console.log("\n=== Pre-deploy substrate audit ===\n");

const clientEnv = loadEnv([
  "apps/client/.env.production",
  "apps/client/.env.production.local",
  "apps/client/.env.local",
  "apps/client/.env.example"
]);
const gatewayEnv = loadEnv(["apps/gateway/.env", "apps/gateway/.env.local", "apps/gateway/.env.example"]);

auditClientEnv({ ...clientEnv.env, ...process.env });
auditClientAuthorityProfile({ ...clientEnv.env, ...process.env });
auditGatewayAuth({ ...gatewayEnv.env, ...process.env });
auditFirebaseProductionPaths();
runVitestPreDeploy();

console.log("\n--- PASS ---");
ok.forEach((m) => console.log("  ✓", m));
if (warnings.length) {
  console.log("\n--- WARN ---");
  warnings.forEach((m) => console.log("  !", m));
}
if (errors.length) {
  console.log("\n--- FAIL ---");
  errors.forEach((m) => console.log("  ✗", m));
  console.log("\nDo NOT deploy until substrate gate passes.\n");
  console.log("Out of scope for this deploy (substrate still stabilizing):");
  console.log("  • full ROS execution");
  console.log("  • autonomous federation law negotiation");
  console.log("  • cross-castle live topology merge");
  console.log("  • global spatial consensus\n");
  process.exit(1);
}

console.log("\nSubstrate audit OK. Remember: no ROS/federation/topology-consensus in this deploy.\n");
process.exit(0);
