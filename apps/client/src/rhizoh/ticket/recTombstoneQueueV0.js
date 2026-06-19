/**
 * REC Tombstone Queue V0 — deferred soft compression at REC cycle only.
 *
 * Tombstone ≠ immediate delete. Queue holds candidates until SYSTEM_RECONCILE batch.
 * interpretationOnly · nonExecutive · same epistemic level as SYSTEM_RECONCILE
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md § Hybrid model
 */

export const REC_TOMBSTONE_QUEUE_SCHEMA_V0 = "castle.rhizoh.rec_tombstone_queue.v0";

/** @type {object[]} */
const pendingCompressionQueueV0 = [];
/** @type {object[]} */
const recCycleHistoryV0 = [];

/**
 * Enqueue mutation record for deferred REC-cycle soft compression.
 * Live index path MUST NOT tombstone or compress — only queue.
 * @param {object} record — MutationRecord v2
 */
export function enqueueDeferredCompressionV0(record) {
  if (!record?.mutationId) return null;
  const entry = Object.freeze({
    schema: REC_TOMBSTONE_QUEUE_SCHEMA_V0,
    mutationId: record.mutationId,
    ticketId: record.ticketId,
    status: record.status,
    epoch: record.epoch,
    reasonCategory: record?.reason?.category,
    enqueuedAt: new Date().toISOString(),
    interpretationOnly: true,
    nonExecutive: true,
    _record: record
  });
  pendingCompressionQueueV0.push(entry);
  return entry;
}

/**
 * Drain pending queue for REC-cycle batch processing.
 * Caller (SYSTEM_RECONCILE) runs compression — queue does not mutate trace truth.
 */
export function drainPendingCompressionBatchV0() {
  const batch = pendingCompressionQueueV0.map((e) => e._record).filter(Boolean);
  const processedIds = new Set(batch.map((r) => r.mutationId));
  for (let i = pendingCompressionQueueV0.length - 1; i >= 0; i--) {
    if (processedIds.has(pendingCompressionQueueV0[i].mutationId)) {
      pendingCompressionQueueV0.splice(i, 1);
    }
  }
  return Object.freeze(batch);
}

/**
 * @param {{
 *   epochId: string,
 *   processedCount: number,
 *   residueCount: number
 * }} summary
 */
export function recordRecCycleCompletionV0(summary) {
  const cycleRecord = Object.freeze({
    schema: REC_TOMBSTONE_QUEUE_SCHEMA_V0,
    epochId: String(summary.epochId || "rec_soft"),
    processedCount: summary.processedCount,
    residueCount: summary.residueCount,
    completedAt: new Date().toISOString(),
    interpretationOnly: true,
    nonExecutive: true
  });
  recCycleHistoryV0.push(cycleRecord);
  return cycleRecord;
}

export function listPendingCompressionQueueV0(limit = 100) {
  return pendingCompressionQueueV0.slice(-limit).map((e) =>
    Object.freeze({
      mutationId: e.mutationId,
      ticketId: e.ticketId,
      status: e.status,
      epoch: e.epoch,
      reasonCategory: e.reasonCategory,
      enqueuedAt: e.enqueuedAt
    })
  );
}

export function getPendingCompressionCountV0() {
  return pendingCompressionQueueV0.length;
}

export function listRecCycleHistoryV0(limit = 20) {
  return recCycleHistoryV0.slice(-limit);
}

/** Test only. */
export function clearRecTombstoneQueueForTestV0() {
  pendingCompressionQueueV0.length = 0;
  recCycleHistoryV0.length = 0;
}
