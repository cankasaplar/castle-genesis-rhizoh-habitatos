import { createClient } from "redis";

const TTL_SEC = Number(process.env.TRACE_TTL_SEC || 86400);
const USE_REDIS = String(process.env.TRACE_REGISTRY_REDIS || "true").toLowerCase() === "true";
const mem = new Map();
let redisPromise = null;

async function getRedis() {
  if (!USE_REDIS) return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const c = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
      c.on("error", () => {});
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

function memUpsert(traceId, updater) {
  const cur = mem.get(traceId) || { traceId, spans: [], status: "ok" };
  const next = updater(cur);
  mem.set(traceId, next);
  return next;
}

export async function appendTraceSpan(input) {
  const traceId = String(input?.traceId || "");
  if (!traceId) return;
  const span = {
    spanId: String(input?.spanId || ""),
    parentSpanId: input?.parentSpanId ? String(input.parentSpanId) : undefined,
    service: String(input?.service || "gateway"),
    phase: String(input?.phase || "unknown"),
    latencyMs: Number(input?.latencyMs || 0),
    ts: Date.now()
  };
  const client = await getRedis();
  if (client) {
    const key = `trace:${traceId}`;
    const raw = await client.get(key);
    const cur = raw ? JSON.parse(raw) : { traceId, spans: [], status: "ok" };
    const next = {
      ...cur,
      traceId,
      sessionId: input?.sessionId ? String(input.sessionId) : cur.sessionId,
      eventId: input?.eventId ? String(input.eventId) : cur.eventId,
      causalNodeId: input?.causalNodeId ? String(input.causalNodeId) : cur.causalNodeId,
      spans: [...(cur.spans || []), span].slice(-256),
      status: cur.status || "ok"
    };
    await client.set(key, JSON.stringify(next), { EX: TTL_SEC });
    if (next.sessionId) {
      const idx = `trace:index:session:${next.sessionId}`;
      await client.sAdd(idx, traceId);
      await client.expire(idx, TTL_SEC);
    }
    return;
  }
  memUpsert(traceId, (cur) => ({
    ...cur,
    sessionId: input?.sessionId ? String(input.sessionId) : cur.sessionId,
    eventId: input?.eventId ? String(input.eventId) : cur.eventId,
    causalNodeId: input?.causalNodeId ? String(input.causalNodeId) : cur.causalNodeId,
    spans: [...(cur.spans || []), span].slice(-256)
  }));
}

export async function upsertTraceStatus(traceId, status) {
  if (!traceId) return;
  const client = await getRedis();
  if (client) {
    const key = `trace:${traceId}`;
    const raw = await client.get(key);
    const cur = raw ? JSON.parse(raw) : { traceId, spans: [] };
    await client.set(key, JSON.stringify({ ...cur, status: String(status || "ok") }), { EX: TTL_SEC });
    return;
  }
  memUpsert(traceId, (cur) => ({ ...cur, status: String(status || "ok") }));
}

export async function getTraceById(traceId) {
  const id = String(traceId || "");
  if (!id) return null;
  const client = await getRedis();
  if (client) {
    const raw = await client.get(`trace:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  return mem.get(id) || null;
}

export async function listTracesBySession(sessionId) {
  const sid = String(sessionId || "");
  if (!sid) return [];
  const client = await getRedis();
  if (client) {
    const idx = `trace:index:session:${sid}`;
    const ids = await client.sMembers(idx);
    const out = [];
    for (const id of ids) {
      const t = await getTraceById(id);
      if (t) out.push(t);
    }
    return out;
  }
  const out = [];
  for (const t of mem.values()) if (String(t.sessionId || "") === sid) out.push(t);
  return out;
}
