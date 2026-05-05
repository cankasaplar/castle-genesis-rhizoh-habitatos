import { createClient } from "redis";

const seen = new Map();
const TTL_MS = Number(process.env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000);
const REDIS_TTL_SEC = Number(process.env.IDEMPOTENCY_TTL_SEC || 86400);
const USE_REDIS = String(process.env.IDEMPOTENCY_REDIS || "true").toLowerCase() === "true";
let redisPromise = null;

async function getRedisClient() {
  if (!USE_REDIS) return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const c = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
      c.on("error", () => {
        /* fallback to in-memory */
      });
      try {
        await c.connect();
        return c;
      } catch {
        return null;
      }
    })();
  }
  return redisPromise;
}

export function isDuplicate(idempotencyKey) {
  if (!idempotencyKey) return false;
  const ts = seen.get(idempotencyKey);
  if (!ts) return false;
  if (Date.now() - ts > TTL_MS) {
    seen.delete(idempotencyKey);
    return false;
  }
  return true;
}

export function markSeen(idempotencyKey) {
  if (!idempotencyKey) return;
  seen.set(idempotencyKey, Date.now());
}

export async function reserveIdempotency(idempotencyKey) {
  if (!idempotencyKey) return true;
  const client = await getRedisClient();
  if (client) {
    try {
      const key = `idempotency:${idempotencyKey}`;
      const ok = await client.set(key, String(Date.now()), { NX: true, EX: REDIS_TTL_SEC });
      if (ok === "OK") return true;
      return false;
    } catch {
      /* fallback below */
    }
  }
  if (isDuplicate(idempotencyKey)) return false;
  markSeen(idempotencyKey);
  return true;
}
