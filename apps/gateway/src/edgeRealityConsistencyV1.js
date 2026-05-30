/**
 * vNext-Edge Reality Consistency Layer
 * - env drift özeti (gizli değer yok)
 * - gateway truth fingerprint (sözleşme + sürüm + güvenli bayraklar)
 * - runtime vs test parity: CASTLE_REALITY_CONTRACT_LOCK_SHA256 ile kilit doğrulama
 */

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REALITY_CONTRACT_LOCK } from "./realityContractLockV1.js";
import { buildGatewaySubstrateAuthoritySnapshotV0 } from "./gatewaySubstrateAuthorityV0.js";
import { buildSubstrateOperationalSnapshotV0 } from "./infra/substrateOperationalMetrics.js";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function hashRealityContractLock() {
  return crypto.createHash("sha256").update(stableStringify(REALITY_CONTRACT_LOCK)).digest("hex");
}

/**
 * Üretim kısıtları: eksik veya tutarsız env (değer içeriği loglanmaz).
 */
export function computeEnvDriftReport() {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (process.env.CASTLE_REQUIRE_FIREBASE_PERSIST === "true") {
    if (!String(process.env.FIREBASE_PROJECT_ID || "").trim()) errors.push("firebase_project_id_required");
    if (!String(process.env.FIREBASE_CLIENT_EMAIL || "").trim()) errors.push("firebase_client_email_required");
    if (!String(process.env.FIREBASE_PRIVATE_KEY || "").trim()) errors.push("firebase_private_key_required");
  }

  if (String(process.env.STRIPE_WEBHOOK_SECRET || "").trim()) {
    if (!String(process.env.STRIPE_SECRET_KEY || "").trim()) {
      warnings.push("stripe_webhook_set_without_stripe_secret_key_checkout_disabled");
    }
    if (process.env.CASTLE_REQUIRE_FIREBASE_PERSIST !== "true") {
      warnings.push("stripe_webhook_firebase_persist_not_required_membership_writes_need_firebase");
    }
  }

  if (String(process.env.CASTLE_GATEWAY_TOKEN || "").trim().length < 16 && process.env.CASTLE_REQUIRE_AUTH === "true") {
    warnings.push("castle_gateway_token_short_or_empty_with_require_auth");
  }

  const jwt = String(process.env.CASTLE_JWT_SECRET || "").trim();
  const firebaseOk =
    String(process.env.FIREBASE_PROJECT_ID || "").trim() &&
    String(process.env.FIREBASE_CLIENT_EMAIL || "").trim() &&
    String(process.env.FIREBASE_PRIVATE_KEY || "").trim();
  const gatewayToken = String(process.env.CASTLE_GATEWAY_TOKEN || "").trim();
  if (!firebaseOk && !jwt && process.env.CASTLE_REQUIRE_AUTH === "true") {
    errors.push("auth_required_but_no_firebase_admin_or_jwt_secret");
  }
  if (
    process.env.NODE_ENV === "production" &&
    !firebaseOk &&
    !jwt &&
    gatewayToken.length >= 16 &&
    process.env.CASTLE_REQUIRE_AUTH !== "true"
  ) {
    warnings.push("production_gateway_token_only_no_identity_verifier");
  }
  if (process.env.NODE_ENV === "production" && process.env.CASTLE_REJECT_UNSIGNED_WAL !== "false") {
    if (process.env.CASTLE_REQUIRE_WAL_PEER_AUTH === "false") {
      warnings.push("production_unsigned_wal_peer_auth_disabled");
    }
  }

  if (process.env.CASTLE_OTEL_ENABLED === "1" && !String(process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "").trim()) {
    warnings.push("otel_enabled_without_otel_exporter_otlp_endpoint");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checkedAtMs: Date.now()
  };
}

/**
 * İstemci / test paketleriyle hizalama: kilidi hash’le; isteğe bağlı env ile doğrula.
 */
export function verifyRealityContractLockParity() {
  const expected = String(process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256 || "")
    .trim()
    .toLowerCase();
  const actual = hashRealityContractLock();
  if (!expected) {
    return { ok: true, skipped: true, lockSha256: actual };
  }
  return {
    ok: actual === expected,
    skipped: false,
    lockSha256: actual,
    expectedSha256: expected
  };
}

/**
 * Dağıtım kimliği — sırlar dahil değil.
 */
export function computeGatewayTruthFingerprint() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  let gatewayPackageVersion = "0.0.0";
  try {
    const raw = readFileSync(path.join(dir, "..", "package.json"), "utf8");
    gatewayPackageVersion = String(JSON.parse(raw).version || gatewayPackageVersion);
  } catch {
    /* noop */
  }

  const lockSha256 = hashRealityContractLock();
  const runtimeFlags = {
    requireFirebasePersist: process.env.CASTLE_REQUIRE_FIREBASE_PERSIST === "true",
    requireAuth: process.env.CASTLE_REQUIRE_AUTH === "true",
    stripeWebhookConfigured: Boolean(String(process.env.STRIPE_WEBHOOK_SECRET || "").trim()),
    stripeCheckoutConfigured: Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim()),
    maintenance: process.env.CASTLE_GATEWAY_MAINTENANCE === "true",
    otelEnabled: process.env.CASTLE_OTEL_ENABLED === "1"
  };

  const body = stableStringify({
    lockSha256,
    gatewayPackageVersion,
    node: process.version,
    runtimeFlags
  });
  const fingerprintSha256 = crypto.createHash("sha256").update(body).digest("hex");

  return {
    fingerprintSha256,
    lockSha256,
    gatewayPackageVersion,
    node: process.version,
    runtimeFlags,
    contractLock: REALITY_CONTRACT_LOCK
  };
}

export function buildRealityHealthPayload() {
  const drift = computeEnvDriftReport();
  const parity = verifyRealityContractLockParity();
  const fingerprint = computeGatewayTruthFingerprint();
  const overallOk = drift.ok && Boolean(parity.ok);

  return {
    ok: overallOk,
    service: "castle-gateway",
    layer: REALITY_CONTRACT_LOCK.layer,
    drift,
    parity,
    substrateAuthority: buildGatewaySubstrateAuthoritySnapshotV0(),
    substrateOperational: buildSubstrateOperationalSnapshotV0(),
    fingerprint: {
      fingerprintSha256: fingerprint.fingerprintSha256,
      lockSha256: fingerprint.lockSha256,
      gatewayPackageVersion: fingerprint.gatewayPackageVersion,
      node: fingerprint.node,
      runtimeFlags: fingerprint.runtimeFlags
    },
    ts: Date.now()
  };
}
