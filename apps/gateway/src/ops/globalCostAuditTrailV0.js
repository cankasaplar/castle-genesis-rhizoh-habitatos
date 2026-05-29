/**
 * GCL accounting stream v0 — append-only audit (not debug log).
 * Redis LIST when cluster mode; in-memory ring only when memory fallback explicitly allowed.
 */

import { createClient } from "redis";

export const GCL_AUDIT_EVENT_SCHEMA_V0 = "rhizoh.gcl.audit_event.v0";

export const GCL_AUDIT_EVENT_KIND_V0 = Object.freeze({
  ASSESS_PRE: "assess_pre",
  ASSESS_DENY: "assess_deny",
  RECORD_POST: "record_post",
  RECORD_FAIL: "record_fail",
  DRIFT_DETECTED: "drift_detected",
  DRIFT_ENFORCED: "drift_enforced",
  LEDGER_UNAVAILABLE: "ledger_unavailable",
  PROVIDER_RECONCILE: "provider_reconcile"
});

const MEMORY_RING_MAX = 512;
/** @type {object[]} */
const memoryRing = [];

let auditRedisPromise = null;

function auditRedisUrl() {
  return String(process.env.REDIS_URL || "").trim() || "redis://127.0.0.1:6379";
}

function auditKeyPrefix() {
  return String(process.env.CASTLE_GCL_REDIS_PREFIX || "castle:gcl:v1");
}

async function getAuditRedisClient() {
  if (!auditRedisPromise) {
    auditRedisPromise = (async () => {
      const connectTimeout = Math.min(
        5000,
        Math.max(200, Math.floor(Number(process.env.CASTLE_GCL_REDIS_CONNECT_MS) || 800))
      );
      const c = createClient({
        url: auditRedisUrl(),
        socket: { connectTimeout, reconnectStrategy: false }
      });
      try {
        await c.connect();
        return c;
      } catch {
        auditRedisPromise = null;
        return null;
      }
    })();
  }
  return auditRedisPromise;
}

function auditListKey(day) {
  return `${auditKeyPrefix()}:audit:day:${day}`;
}

/**
 * @param {string} kind GCL_AUDIT_EVENT_KIND_V0
 * @param {{ ledgerMode?: string, allowMemoryFallback?: boolean, [key: string]: unknown }} [opts]
 */
export async function appendGclAuditEventV0(kind, opts = {}) {
  const day = new Date().toISOString().slice(0, 10);
  const ledgerMode = String(opts.ledgerMode || "unknown");
  const allowMemoryFallback = opts.allowMemoryFallback === true;
  const { ledgerMode: _lm, allowMemoryFallback: _amf, ...payload } = opts;
  const entry = Object.freeze({
    schema: GCL_AUDIT_EVENT_SCHEMA_V0,
    kind: String(kind),
    atMs: Date.now(),
    day,
    ledgerMode,
    ...payload
  });

  if (ledgerMode === "cluster") {
    const client = await getAuditRedisClient();
    if (client) {
      try {
        const key = auditListKey(day);
        await client.rPush(key, JSON.stringify(entry));
        await client.lTrim(key, -4096, -1);
        await client.expire(key, 96 * 3600);
        return { ok: true, sink: "redis", entry };
      } catch {
        return { ok: false, sink: "redis_error", entry, reason: "audit_push_failed" };
      }
    }
    return { ok: false, sink: "none", entry, reason: "audit_redis_unavailable" };
  }

  if (!allowMemoryFallback) {
    return { ok: false, sink: "none", entry, reason: "audit_memory_forbidden" };
  }

  memoryRing.push(entry);
  if (memoryRing.length > MEMORY_RING_MAX) memoryRing.shift();
  return { ok: true, sink: "memory_ring", entry };
}

/**
 * @param {number} [limit]
 * @param {{ ledgerMode?: string }} [opts]
 */
export async function listGclAuditEventsV0(limit = 64, opts = {}) {
  const day = new Date().toISOString().slice(0, 10);
  const cap = Math.min(256, Math.max(1, Math.floor(limit) || 64));
  if (opts.ledgerMode === "cluster") {
    const client = await getAuditRedisClient();
    if (client) {
      try {
        const raw = await client.lRange(auditListKey(day), -cap, -1);
        return raw.map((s) => {
          try {
            return JSON.parse(s);
          } catch {
            return { parseError: true, raw: s };
          }
        });
      } catch {
        return [];
      }
    }
    return [];
  }
  return memoryRing.slice(-cap);
}

export function resetGclAuditTrailV0() {
  memoryRing.length = 0;
  auditRedisPromise = null;
}
