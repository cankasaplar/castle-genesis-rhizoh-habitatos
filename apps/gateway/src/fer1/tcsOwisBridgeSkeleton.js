/**
 * FER-1 — TCS ↔ Firebase ↔ OWIS bridge (skeleton).
 * Sorumluluk: client ayna (`rhizoh_client_sync`) ile event stream (`rhizoh_events/*/items`)
 * arasında tutarlı correlationId üretimi; gateway canonical merge (ileride).
 *
 * Normatif: docs/RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md · docs/RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md
 */

/** @param {{ productSurface?: string, path?: string, tcsPhase?: string|null }} tcs */
export function buildCorrelationIdFromTcs(tcs) {
  const surface = String(tcs?.productSurface || "unknown");
  const phase = tcs?.tcsPhase ? String(tcs.tcsPhase) : "steady";
  return `tcs:${surface}:${phase}:${Date.now().toString(36)}`;
}

/** @param {{ owisPhase: string, correlationId: string }} owis */
export function buildObserveEventStub(owis) {
  return {
    type: "observe_skeleton_ready_v1",
    source: "gateway",
    schemaVersion: 1,
    correlationId: String(owis.correlationId || ""),
    actorUid: "SYSTEM",
    primaryClaimCount: 0,
    owisPhase: String(owis.owisPhase || "W1")
  };
}
