/**
 * Codex snapshot store — replay acceleration (load snapshot + replay tail events).
 */

import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import {
  idbSimGetV0,
  idbSimPutV0,
  SIM_STORE_SNAPSHOTS_V0,
  withRhizohSimulationDbV0
} from "./rhizohSimulationDbV0.js";

export const RHIZOH_SNAPSHOT_STORE_SCHEMA_V0 = "castle.rhizoh.snapshot_store.v0";
export const RHIZOH_SNAPSHOT_INTERVAL_EVENTS_V0 = 1000;

/**
 * @param {number} eventOffset
 * @param {object} state
 */
export async function saveCodexSnapshotV0(eventOffset, state) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const offset = Math.max(0, Number(eventOffset) || 0);
  const record = Object.freeze({
    schema: RHIZOH_SNAPSHOT_STORE_SCHEMA_V0,
    eventOffset: offset,
    state: state && typeof state === "object" ? JSON.parse(JSON.stringify(state)) : {},
    createdAtMs: Date.now()
  });

  return withRhizohSimulationDbV0(async (db) => {
    await idbSimPutV0(db, SIM_STORE_SNAPSHOTS_V0, record);
    return Object.freeze({ ok: true, snapshot: record });
  });
}

export async function loadLatestCodexSnapshotV0() {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied", snapshot: null });
  }
  return withRhizohSimulationDbV0(async (db) => {
    const tx = db.transaction(SIM_STORE_SNAPSHOTS_V0, "readonly");
    const all = await new Promise((resolve, reject) => {
      const req = tx.objectStore(SIM_STORE_SNAPSHOTS_V0).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    if (!all.length) return Object.freeze({ ok: true, snapshot: null });
    const snapshot = all.sort((a, b) => Number(b.eventOffset) - Number(a.eventOffset))[0];
    return Object.freeze({ ok: true, snapshot });
  });
}

/**
 * @param {number} eventSeq
 * @param {object} state
 */
export async function maybeSnapshotCodexStateV0(eventSeq, state) {
  const seq = Number(eventSeq);
  if (!Number.isFinite(seq) || seq <= 0 || seq % RHIZOH_SNAPSHOT_INTERVAL_EVENTS_V0 !== 0) {
    return Object.freeze({ ok: true, skipped: true });
  }
  return saveCodexSnapshotV0(seq, state);
}
