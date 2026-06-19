/**
 * REC Deferred Intent Queue V0 — intents wait for next core epoch (06:44 / 18:44).
 *
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_REALITY_TRANSITION_ENGINE_V1.md §6
 */

export const REC_DEFERRED_INTENT_SCHEMA_V0 = "castle.rhizoh.rec_deferred_intent.v0";

export const DEFERRED_INTENT_STATUS_V0 = Object.freeze({
  PENDING: "pending",
  REPLAYED: "replayed",
  EXPIRED: "expired",
  CANCELLED: "cancelled"
});

/** @type {Map<string, object>} */
const queueV0 = new Map();

let deferSeqV0 = 0;

/**
 * @param {{
 *   intent: { intentId: string, ticketId: string, transitionType: string, intentEpoch?: string },
 *   validation?: { valid: boolean, reasons?: string[] },
 *   deferReason?: string,
 *   targetRecEpoch?: string,
 *   enqueuedAtMs?: number
 * }} input
 */
export function enqueueDeferredIntentV0(input) {
  const intent = input.intent;
  const intentId = String(intent?.intentId || "");
  if (!intentId) {
    throw new Error("rec_deferred_intent: intentId required");
  }
  const entry = Object.freeze({
    schema: REC_DEFERRED_INTENT_SCHEMA_V0,
    queueId: `defer_${++deferSeqV0}`,
    intentId,
    ticketId: String(intent.ticketId || ""),
    transitionType: String(intent.transitionType || ""),
    intentEpoch: String(intent.intentEpoch || ""),
    targetRecEpoch: String(input.targetRecEpoch || intent.intentEpoch || ""),
    deferReason: String(input.deferReason || "epoch_closed"),
    validationSnapshot: input.validation
      ? Object.freeze({
          valid: input.validation.valid === true,
          reasons: Object.freeze([...(input.validation.reasons || [])])
        })
      : null,
    status: DEFERRED_INTENT_STATUS_V0.PENDING,
    enqueuedAt: new Date(input.enqueuedAtMs ?? Date.now()).toISOString(),
    interpretationOnly: true,
    nonExecutive: true
  });
  queueV0.set(intentId, entry);
  return entry;
}

/**
 * @param {string} recEpochId — e.g. rec_2026_06_19_0644
 * @param {number} [limit]
 */
export function dequeueDeferredIntentsForRecV0(recEpochId, limit = 50) {
  const target = String(recEpochId || "");
  const out = [];
  for (const entry of queueV0.values()) {
    if (entry.status !== DEFERRED_INTENT_STATUS_V0.PENDING) continue;
    if (target && entry.targetRecEpoch && entry.targetRecEpoch !== target) continue;
    out.push(entry);
    queueV0.set(entry.intentId, Object.freeze({ ...entry, status: DEFERRED_INTENT_STATUS_V0.REPLAYED }));
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * @param {string} intentId
 */
export function getDeferredIntentV0(intentId) {
  return queueV0.get(String(intentId || "")) ?? null;
}

export function listPendingDeferredIntentsV0() {
  return [...queueV0.values()].filter((e) => e.status === DEFERRED_INTENT_STATUS_V0.PENDING);
}

/** Test only. */
export function clearDeferredIntentQueueForTestV0() {
  queueV0.clear();
  deferSeqV0 = 0;
}
