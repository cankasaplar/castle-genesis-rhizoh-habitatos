import crypto from "node:crypto";

function uid(prefix) {
  return `${prefix}:${crypto.randomBytes(8).toString("hex")}`;
}

export function createInfraEventEnvelope(input) {
  const now = Date.now();
  const payload = input?.payload ?? {};
  const sessionId = String(input?.sessionId || "session:anon");
  const causalBranchId = String(input?.causalBranchId || "branch:main");
  const type = String(input?.type || "unknown");
  const eventId = String(input?.eventId || uid("evt"));
  const idempotencyKey =
    input?.idempotencyKey ||
    crypto.createHash("sha256").update(`${sessionId}|${causalBranchId}|${type}|${JSON.stringify(payload)}`).digest("hex");
  return {
    eventId,
    sessionId,
    causalBranchId,
    timestamp: Number(input?.timestamp || now),
    idempotencyKey: String(idempotencyKey),
    attempt: Math.max(1, Number(input?.attempt || 1)),
    ...(input?.lastError ? { lastError: String(input.lastError) } : {}),
    ...(input?.nextRetryAt ? { nextRetryAt: Number(input.nextRetryAt) } : {}),
    type,
    payload,
    meta: {
      source: input?.meta?.source === "direct" ? "direct" : "gateway",
      traceId: String(input?.meta?.traceId || uid("trc")),
      spanId: String(input?.meta?.spanId || uid("spn")),
      ...(input?.meta?.parentSpanId ? { parentSpanId: String(input.meta.parentSpanId) } : {})
    }
  };
}
