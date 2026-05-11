/**
 * FER-1 — Live broadcast worker skeleton.
 * Hedef: domain_event / witness → broadcast_index → dış embed (YouTube) → Observe.
 * Şu an: yalnızca işlev imzası ve boş işleyici — gerçek API köprüsü sonraki PR.
 *
 * Normatif: docs/RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md · docs/RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md
 */

/** @param {{ broadcastId: string, embedUrl?: string, status: string }} patch */
export async function upsertBroadcastIndexStub(_db, patch) {
  void patch;
  return { ok: false, reason: "broadcast_worker_not_implemented" };
}

/** @param {{ eventId: string }} witness */
export async function ingestWitnessStub(_db, witness) {
  void witness;
  return { ok: false, reason: "witness_ingest_not_implemented" };
}
