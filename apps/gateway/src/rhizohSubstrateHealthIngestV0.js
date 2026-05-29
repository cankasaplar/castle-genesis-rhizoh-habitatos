/**
 * Client substrate health ingest — operational signal, not execution authority.
 */

import { recordClientSubstrateHealthV0 } from "./infra/substrateOperationalMetrics.js";

export const RHIZOH_SUBSTRATE_HEALTH_INGEST_SCHEMA_V0 = "castle.rhizoh.substrate_health_ingest.v0";

const MAX_BODY_BYTES = 24 * 1024;

/**
 * @param {unknown} body
 * @returns {{ ok: boolean, code?: string, reason?: string, snapshot?: Record<string, unknown> }}
 */
export function validateClientSubstrateHealthBodyV0(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, code: "invalid_body", reason: "JSON object required." };
  }
  const snap = body.realityHealth ?? body.snapshot ?? body;
  if (!snap || typeof snap !== "object") {
    return { ok: false, code: "missing_snapshot", reason: "realityHealth snapshot required." };
  }
  const schema = String(snap.schema || "");
  if (schema && !schema.includes("reality_health")) {
    return { ok: false, code: "schema_mismatch", reason: "Unexpected snapshot schema." };
  }
  const probe = JSON.stringify(snap);
  if (Buffer.byteLength(probe, "utf8") > MAX_BODY_BYTES) {
    return { ok: false, code: "payload_too_large", reason: "Snapshot exceeds size limit." };
  }
  return { ok: true, snapshot: /** @type {Record<string, unknown>} */ (snap) };
}

/**
 * @param {unknown} body
 * @param {{ clientId?: string, uid?: string }} meta
 */
export function ingestClientSubstrateHealthV0(body, meta = {}) {
  const v = validateClientSubstrateHealthBodyV0(body);
  if (!v.ok) return { ok: false, code: v.code, reason: v.reason };
  recordClientSubstrateHealthV0(v.snapshot, meta);
  return { ok: true, schema: RHIZOH_SUBSTRATE_HEALTH_INGEST_SCHEMA_V0, ts: Date.now() };
}
