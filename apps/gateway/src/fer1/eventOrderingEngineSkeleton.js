/**
 * FER-1 — Event ordering + replay determinism (closure patch §4.2).
 * Hedef: correlationId içinde (veya yanında) nedensel sıra; projection tek yazım noktası.
 */

/**
 * @param {{ stream: string, correlationId: string, occurredAtMs?: number, eventId: string }} ev
 * @returns {string} Sıralama için bileşik anahtar (lexicographic replay için).
 */
export function orderingKeyFromEvent(ev) {
  const t = ev.occurredAtMs ?? 0;
  return `${ev.stream}\0${ev.correlationId}\0${String(t).padStart(16, "0")}\0${ev.eventId}`;
}

/**
 * Deterministik replay: aynı iki event için sıra.
 * @param {{ stream: string, correlationId: string, occurredAtMs?: number, eventId: string }} a
 * @param {{ stream: string, correlationId: string, occurredAtMs?: number, eventId: string }} b
 */
export function compareEventsForReplay(a, b) {
  const ka = orderingKeyFromEvent(a);
  const kb = orderingKeyFromEvent(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

/**
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function projectStreamChunkStub(_db, _params) {
  return { ok: false, reason: "projection_not_implemented" };
}
