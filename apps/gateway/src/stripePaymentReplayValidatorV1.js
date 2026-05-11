/**
 * Stripe webhook — idempotent işleme (aynı event.id tekrarı) ve isteğe bağlı yaş tavanı.
 * Kalıcı depo yok; süreç içi LRU. Çoklu instance için Firestore/redis gerekir (ileride).
 */

/** @type {Map<string, true>} */
const seen = new Map();
/** @type {string[]} */
const order = [];

const DEFAULT_CAP = 8000;

function cap() {
  const n = Number(process.env.CASTLE_STRIPE_REPLAY_CACHE_MAX || DEFAULT_CAP);
  return Number.isFinite(n) && n > 100 ? Math.min(50_000, Math.floor(n)) : DEFAULT_CAP;
}

/**
 * @param {string} eventId
 * @param {number} [eventCreatedUnix] Stripe Event.created
 * @returns {{ duplicate: boolean, skippedAge?: boolean, reason?: string }}
 */
export function rememberStripeEventOrSkip(eventId, eventCreatedUnix) {
  const id = String(eventId || "").trim();
  if (!id) return { duplicate: false };

  const maxAgeSec = Number(process.env.CASTLE_STRIPE_WEBHOOK_MAX_EVENT_AGE_SEC || 0);
  if (maxAgeSec > 0 && eventCreatedUnix != null) {
    const created = Number(eventCreatedUnix);
    if (Number.isFinite(created)) {
      const age = Math.floor(Date.now() / 1000) - created;
      if (age > maxAgeSec) return { duplicate: false, skippedAge: true, reason: "event_too_old" };
      if (age < -120) return { duplicate: false, skippedAge: true, reason: "event_future_skew" };
    }
  }

  if (seen.has(id)) return { duplicate: true };

  seen.set(id, true);
  order.push(id);
  const max = cap();
  while (order.length > max) {
    const old = order.shift();
    if (old) seen.delete(old);
  }
  return { duplicate: false };
}

/** Test / sıcak yeniden yükleme */
export function clearStripeReplayCacheForTests() {
  seen.clear();
  order.length = 0;
}
