/**
 * Gateway ingest — istemciden gelen external-loss proxy batch’leri (analytics köprüsü).
 * Üretimde BigQuery / Firestore’a aktarılabilir; şimdilik bellek içi özet ring-buffer.
 */

const batches = [];
const MAX_ROWS = 64;

/**
 * @param {unknown} body
 * @param {{ ip?: string }} meta
 */
export function ingestRhizohExternalLossBatchHttp(body, meta = {}) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = /** @type {Record<string, unknown>} */ (body);
  if (String(b.schemaVersion || "") !== "1.0.0") return { ok: false, error: "schema_version" };
  const events = Array.isArray(b.events) ? b.events : [];
  if (events.length === 0) return { ok: true, accepted: 0, recorded: true };
  if (events.length > 64) return { ok: false, error: "too_many_events" };

  for (const ev of events) {
    if (!ev || typeof ev !== "object") return { ok: false, error: "bad_event_shape" };
    const row = /** @type {Record<string, unknown>} */ (ev);
    if (typeof row.kind !== "string" || row.kind.length === 0 || row.kind.length > 96)
      return { ok: false, error: "bad_event_kind" };
    const ts = Number(row.ts);
    const severity = Number(row.severity);
    if (!Number.isFinite(ts) || ts <= 0) return { ok: false, error: "bad_event_ts" };
    if (!Number.isFinite(severity) || severity < -1.001 || severity > 1.001)
      return { ok: false, error: "bad_event_severity" };
    if (row.meta != null && typeof row.meta !== "object") return { ok: false, error: "bad_event_meta" };
  }

  let neg = 0;
  let pos = 0;
  let sumSeverity = 0;
  for (const ev of events) {
    const row = /** @type {Record<string, unknown>} */ (ev);
    const sev = Number(row.severity);
    sumSeverity += sev;
    if (sev < -0.05) neg += 1;
    else if (sev > 0.05) pos += 1;
  }

  batches.push({
    receivedAtMs: Date.now(),
    ip: String(meta.ip || "").slice(0, 80),
    clientTs: Number(b.clientTs) || 0,
    sessionId: String(b.sessionId || "").slice(0, 128),
    deviceHint: String(b.deviceHint || "").slice(0, 128),
    eventCount: events.length,
    negativeCount: neg,
    positiveCount: pos,
    sumSeverity: Math.round(sumSeverity * 1000) / 1000,
    layerVersion: String(b.layerVersion || "")
  });

  while (batches.length > MAX_ROWS) batches.shift();

  return { ok: true, accepted: events.length, recorded: true };
}

export function getRhizohExternalLossIngestRingTail(n = 8) {
  return batches.slice(-Math.max(1, Math.min(64, n)));
}
