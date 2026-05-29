/**
 * Authoritative client world-observation ingress → genesis continuity hub.
 * Flow: world event → POST → publishGenesisContinuityEvent → SSE / replay / archive.
 */

import crypto from "node:crypto";
import {
  getGenesisContinuitySeq,
  publishGenesisContinuityEvent
} from "./genesisContinuityStreamHubV0.js";

export const GENESIS_WORLD_OBSERVATION_INGRESS_SCHEMA = "castle.genesis.world_observation_ingress.v0";

const CLIENT_OBSERVATION_SCHEMA = "castle.world_observation.v0";
const ALLOWED_TYPES = new Set(["world.tick", "agent.spoke"]);
const MAX_BODY_BYTES = 8 * 1024;
const MAX_PAYLOAD_KEYS = 24;
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_PER_CLIENT = 48;

/** @type {Map<string, { count: number, resetAt: number }>} */
const rateByClient = new Map();

function clampClientId(raw) {
  const s = String(raw || "anonymous").trim().slice(0, 96);
  return s || "anonymous";
}

function rateOk(clientId) {
  const now = Date.now();
  let row = rateByClient.get(clientId);
  if (!row || now > row.resetAt) {
    row = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateByClient.set(clientId, row);
  }
  if (row.count >= RATE_MAX_PER_CLIENT) return false;
  row.count += 1;
  return true;
}

function sanitizePayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  /** @type {Record<string, unknown>} */
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (n >= MAX_PAYLOAD_KEYS) break;
    const key = String(k).slice(0, 64);
    if (!key || key === "via" || key === "seq") continue;
    if (v == null) {
      out[key] = v;
    } else if (typeof v === "string") {
      out[key] = v.slice(0, 512);
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    } else if (typeof v === "boolean") {
      out[key] = v;
    }
    n += 1;
  }
  return out;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, type: string, atMs: number, payload: Record<string, unknown> } | { ok: false, error: string }}
 */
export function validateGenesisWorldObservationIngressBodyV0(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }
  const schema = String(/** @type {Record<string, unknown>} */ (body).schema || "").trim();
  if (schema && schema !== CLIENT_OBSERVATION_SCHEMA && schema !== GENESIS_WORLD_OBSERVATION_INGRESS_SCHEMA) {
    return { ok: false, error: "schema_mismatch" };
  }
  const type = String(/** @type {Record<string, unknown>} */ (body).type || "").trim().slice(0, 64);
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, error: "type_not_allowed", allowed: [...ALLOWED_TYPES] };
  }
  const atMsRaw = /** @type {Record<string, unknown>} */ (body).atMs;
  const atMs = atMsRaw != null ? Math.floor(Number(atMsRaw)) : Date.now();
  if (!Number.isFinite(atMs) || atMs <= 0) {
    return { ok: false, error: "invalid_atMs" };
  }
  const payload = sanitizePayload(/** @type {Record<string, unknown>} */ (body).payload);
  const probe = JSON.stringify({ type, atMs, payload });
  if (Buffer.byteLength(probe, "utf8") > MAX_BODY_BYTES) {
    return { ok: false, error: "payload_too_large" };
  }
  return { ok: true, type, atMs, payload };
}

function buildEventId(clientId, type, atMs, payload) {
  const digest = crypto
    .createHash("sha256")
    .update(`${clientId}|${type}|${atMs}|${JSON.stringify(payload)}`)
    .digest("hex")
    .slice(0, 16);
  return `wo:${digest}`;
}

/**
 * @param {unknown} body
 * @param {{ clientId?: string }} meta
 */
export function ingestGenesisWorldObservationV0(body, meta = {}) {
  const v = validateGenesisWorldObservationIngressBodyV0(body);
  if (!v.ok) return { ok: false, error: v.error, ...(v.allowed ? { allowed: v.allowed } : {}) };

  const clientId = clampClientId(meta.clientId);
  if (!rateOk(clientId)) {
    return { ok: false, error: "rate_limited" };
  }

  const eventId = buildEventId(clientId, v.type, v.atMs, v.payload);
  publishGenesisContinuityEvent({
    type: "WorldObservation",
    id: eventId,
    payload: {
      observationType: v.type,
      observationSchema: CLIENT_OBSERVATION_SCHEMA,
      clientAtMs: v.atMs,
      clientId,
      ...v.payload
    }
  });

  return {
    ok: true,
    schema: GENESIS_WORLD_OBSERVATION_INGRESS_SCHEMA,
    seq: getGenesisContinuitySeq(),
    eventId,
    observationType: v.type
  };
}

/** @public Tests */
export function resetGenesisWorldObservationIngressForTestsV0() {
  rateByClient.clear();
}
