/**
 * Rhizoh PWA sync manager v0 — offline queue stub (Background Sync in later phase).
 * N12: queue accepts items only when topology grant is active.
 */

import { canPersistUserTopologyN12V0 } from "./rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_PWA_SYNC_MANAGER_SCHEMA_V0 = "rhizoh.pwa_sync_manager.v0";
export const RHIZOH_PWA_SYNC_EVENT_V0 = "rhizoh:pwa-sync-v0";

/** @type {object[]} */
let pendingQueueV0 = [];
let initializedV0 = false;

/**
 * @param {{ type?: string, payload?: object, id?: string }} item
 */
export function enqueueRhizohPwaSyncV0(item = {}) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const row = Object.freeze({
    schema: RHIZOH_PWA_SYNC_MANAGER_SCHEMA_V0,
    id: String(item.id || `sync_${Date.now().toString(36)}`),
    type: String(item.type || "ghost_event"),
    payload: item.payload && typeof item.payload === "object" ? Object.freeze({ ...item.payload }) : null,
    atMs: Date.now()
  });
  pendingQueueV0.push(row);
  if (pendingQueueV0.length > 64) pendingQueueV0 = pendingQueueV0.slice(-64);
  publishRhizohPwaSyncSnapshotV0();
  return Object.freeze({ ok: true, item: row, queueLength: pendingQueueV0.length });
}

export function getRhizohPwaSyncQueueSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_PWA_SYNC_MANAGER_SCHEMA_V0,
    count: pendingQueueV0.length,
    pending: Object.freeze(pendingQueueV0.slice())
  });
}

function publishRhizohPwaSyncSnapshotV0() {
  const snap = getRhizohPwaSyncQueueSnapshotV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.pwaSync = snap;
    window.dispatchEvent(new CustomEvent(RHIZOH_PWA_SYNC_EVENT_V0, { detail: snap }));
  }
  return snap;
}

/**
 * Flush queue when online — stub: observability only until gateway sync wire lands.
 */
export async function flushRhizohPwaSyncQueueV0() {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied", flushed: 0 });
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return Object.freeze({ ok: false, reason: "offline", flushed: 0, remaining: pendingQueueV0.length });
  }
  const count = pendingQueueV0.length;
  if (!count) return Object.freeze({ ok: true, flushed: 0, remaining: 0 });
  logCastleLifecycleV0("pwa_sync_flush_stub", { count });
  pendingQueueV0 = [];
  publishRhizohPwaSyncSnapshotV0();
  return Object.freeze({ ok: true, flushed: count, remaining: 0 });
}

export function initRhizohPwaSyncManagerV0() {
  if (initializedV0 || typeof window === "undefined") return;
  initializedV0 = true;
  window.addEventListener("online", () => {
    void flushRhizohPwaSyncQueueV0();
  });
  publishRhizohPwaSyncSnapshotV0();
}

/** @internal vitest */
export function __resetRhizohPwaSyncManagerForTestV0() {
  pendingQueueV0 = [];
  initializedV0 = false;
}
