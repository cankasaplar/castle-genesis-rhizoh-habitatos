/**
 * Reflex turn telemetry — adaptive micro-language learning (no LLM).
 */

export const RHIZOH_REFLEX_TURN_LOG_SCHEMA_V0 = "castle.rhizoh.reflex_turn_log.v0";
const STORAGE_KEY_V0 = "rhizoh.reflex_turn_log.v0";
const MAX_LOG_V0 = 64;

/**
 * @param {{
 *   intent: string,
 *   response: string,
 *   latencyMs: number,
 *   source?: string,
 *   layer?: string,
 *   traceId?: string | null,
 *   channel?: string,
 *   successScore?: number,
 *   userReaction?: string,
 *   responseEffectiveness?: Record<string, unknown>
 * }} row
 */
export function logRhizohReflexTurnV0(row) {
  const entry = Object.freeze({
    schema: RHIZOH_REFLEX_TURN_LOG_SCHEMA_V0,
    intent: String(row.intent || ""),
    response: String(row.response || "").slice(0, 280),
    latencyMs: Math.max(0, Math.floor(Number(row.latencyMs) || 0)),
    source: String(row.source || ""),
    layer: String(row.layer || "reflex"),
    traceId: row.traceId ? String(row.traceId) : null,
    channel: String(row.channel || "voice"),
    successScore: Math.max(0, Math.min(1, Number(row.successScore) || 0.8)),
    userReaction: String(row.userReaction || "none"),
    responseEffectiveness:
      row.responseEffectiveness && typeof row.responseEffectiveness === "object"
        ? Object.freeze({ ...row.responseEffectiveness })
        : Object.freeze({ pending: true }),
    atMs: Date.now()
  });

  if (typeof window === "undefined") return entry;
  try {
    const prev = JSON.parse(window.localStorage.getItem(STORAGE_KEY_V0) || "[]");
    const arr = Array.isArray(prev) ? prev : [];
    arr.push(entry);
    window.localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(arr.slice(-MAX_LOG_V0)));
    window.__CASTLE_RHIZOH_REFLEX_TURN_LOG__ = entry;
  } catch {
    /* quota */
  }
  return entry;
}

/** @internal test */
export function clearReflexTurnLogForTestV0() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V0);
      delete window.__CASTLE_RHIZOH_REFLEX_TURN_LOG__;
    } catch {
      /* noop */
    }
  }
}
