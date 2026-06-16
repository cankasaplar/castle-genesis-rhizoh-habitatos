/**
 * Reconciliation engine v0 — local shadow timeline vs canonical authority.
 * Faz 3-B: PENDING_SYNC → CONFIRM | REWRITE | ECHO
 */

import { listSimulationEventsV0 } from "../storage/EventStoreV0.js";
import { withRhizohSimulationDbV0, idbSimGetV0, idbSimPutV0, SIM_STORE_EVENTS_V0 } from "./rhizohSimulationDbV0.js";
import { foldSimulationWorldEventsV0 } from "./replayWorldReducerV0.js";
import { foldCodexEventsV0 } from "./codexReducerV0.js";
import { foldSpawnEventsIntoPatternsV0 } from "./semanticEventFoldV0.js";
import { publishSimulationWorldV0, publishCodexStateV0 } from "./ReplayEngineV0.js";
import { publishOfflineVoidStateV0 } from "./offlineVoidGateV0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_RECONCILIATION_SCHEMA_V0 = "castle.rhizoh.reconciliation.v0";
export const RHIZOH_RECONCILIATION_EVENT_V0 = "rhizoh:reconciliation-v0";

/**
 * @typedef {{ canonicalLayer: number, seed: number, timestamp?: number }} CanonicalAuthorityV0
 */

/**
 * @param {object} localEvent
 * @param {object} canonicalEvent
 */
export function classifyEventReconciliationV0(localEvent, canonicalEvent) {
  if (!canonicalEvent) return "ECHO";
  const localKey = `${localEvent?.type}:${localEvent?.payload?.id || localEvent?.payload?.ghostId || ""}`;
  const canonKey = `${canonicalEvent?.type}:${canonicalEvent?.payload?.id || canonicalEvent?.payload?.ghostId || ""}`;
  if (localKey === canonKey && localEvent?.type === canonicalEvent?.type) return "CONFIRM";
  return "DIVERGENCE";
}

/**
 * @param {CanonicalAuthorityV0} canonical
 * @param {object[]} [pendingEvents]
 */
export async function reconcileWithCanonicalAuthorityV0(canonical, pendingEvents) {
  const layer = Math.max(0, Number(canonical?.canonicalLayer) || 0);
  const seed = Number(canonical?.seed) || 0;
  const pending =
    Array.isArray(pendingEvents) && pendingEvents.length
      ? pendingEvents
      : (await listSimulationEventsV0(0)).events?.filter((e) => e.syncStatus === "PENDING_SYNC") || [];

  const reconciled = [];
  for (const local of pending) {
    const verdict = classifyEventReconciliationV0(local, null);
    await markSimulationEventSyncStatusV0(local.id, verdict === "ECHO" ? "ECHO" : "CONFIRMED");
    reconciled.push(
      Object.freeze({
        localId: local.id,
        type: local.type,
        verdict,
        localLayer: local.localLayer,
        localSeed: local.localSeed
      })
    );
  }

  const allEvents = (await listSimulationEventsV0(0)).events || [];
  const confirmedEvents = allEvents.filter(
    (e) => e.syncStatus !== "PENDING_SYNC" && e.syncStatus !== "ECHO"
  );
  const codexState = foldCodexEventsV0(confirmedEvents);
  const world = foldSimulationWorldEventsV0(confirmedEvents);
  const patterns = foldSpawnEventsIntoPatternsV0(confirmedEvents);

  const snapshot = Object.freeze({
    schema: RHIZOH_RECONCILIATION_SCHEMA_V0,
    layer,
    seed,
    ghosts: world.activeGhosts,
    memoryGraph: patterns.patterns,
    divergenceScore: pending.length ? Math.min(1, pending.length / Math.max(1, allEvents.length)) : 0,
    pendingCount: pending.length,
    reconciled: Object.freeze(reconciled)
  });

  publishCodexStateV0(
    Object.freeze({
      ...codexState,
      cycleLayer: layer || codexState.cycleLayer,
      seed: seed || codexState.seed,
      behaviorPatterns: patterns.patterns
    })
  );
  publishSimulationWorldV0(
    Object.freeze({
      ...world,
      cycleLayer: layer || world.cycleLayer,
      seed: seed || world.seed,
      voidPending: false
    })
  );

  publishOfflineVoidStateV0(false);

  logCastleLifecycleV0("reconciliation_catch_up", {
    layer,
    seed,
    pending: pending.length,
    divergenceScore: snapshot.divergenceScore
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_RECONCILIATION_EVENT_V0, {
        detail: Object.freeze({ snapshot, canonical })
      })
    );
  }

  return Object.freeze({ ok: true, snapshot });
}

/**
 * @param {string} eventId
 * @param {"CONFIRMED"|"PENDING_SYNC"|"ECHO"|"REWRITE"} syncStatus
 */
export async function markSimulationEventSyncStatusV0(eventId, syncStatus) {
  const id = String(eventId || "").trim();
  if (!id) return Object.freeze({ ok: false, reason: "missing_id" });

  return withRhizohSimulationDbV0(async (db) => {
    const existing = await idbSimGetV0(db, SIM_STORE_EVENTS_V0, id);
    if (!existing) return Object.freeze({ ok: false, reason: "not_found" });
    const updated = Object.freeze({ ...existing, syncStatus: String(syncStatus || "CONFIRMED") });
    await idbSimPutV0(db, SIM_STORE_EVENTS_V0, updated);
    return Object.freeze({ ok: true, event: updated });
  });
}
