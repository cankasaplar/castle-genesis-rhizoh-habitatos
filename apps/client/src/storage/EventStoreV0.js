/**
 * Event store — append-only simulation event log (STATE = f(EVENTS)).
 */

import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import {
  idbSimGetAllByIndexV0,
  idbSimPutV0,
  nextSimulationEventSeqV0,
  SIM_STORE_EVENTS_V0,
  withRhizohSimulationDbV0
} from "./rhizohSimulationDbV0.js";

export const RHIZOH_EVENT_STORE_SCHEMA_V0 = "castle.rhizoh.event_store.v0";

/**
 * @param {string} type
 * @param {object} [payload]
 * @param {{ cycle?: number, ts?: number, syncStatus?: string, localLayer?: number, localSeed?: number }} [opts]
 */
export async function pushSimulationEventV0(type, payload = {}, opts = {}) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const eventType = String(type || "").trim();
  if (!eventType) return Object.freeze({ ok: false, reason: "empty_type" });

  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const syncStatus =
    opts.syncStatus === "PENDING_SYNC" || (offline && opts.syncStatus !== "CONFIRMED")
      ? "PENDING_SYNC"
      : "CONFIRMED";

  return withRhizohSimulationDbV0(async (db) => {
    const seq = await nextSimulationEventSeqV0(db);
    const ts = Number(opts.ts) || Date.now();
    const cycle = Math.max(0, Number(opts.cycle) || 0);
    const record = Object.freeze({
      schema: RHIZOH_EVENT_STORE_SCHEMA_V0,
      id: `evt_${seq}`,
      seq,
      type: eventType,
      payload: payload && typeof payload === "object" ? Object.freeze({ ...payload }) : null,
      ts,
      cycle,
      syncStatus,
      localLayer: Number(opts.localLayer) || cycle,
      localSeed: Number.isFinite(Number(opts.localSeed)) ? Number(opts.localSeed) : null
    });
    await idbSimPutV0(db, SIM_STORE_EVENTS_V0, record);
    return Object.freeze({ ok: true, event: record });
  });
}

/**
 * @param {number} [afterSeq]
 */
export async function listSimulationEventsV0(afterSeq = 0) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied", events: [] });
  }
  const minSeq = Math.max(0, Number(afterSeq) || 0);
  return withRhizohSimulationDbV0(async (db) => {
    const all = await idbSimGetAllByIndexV0(db, SIM_STORE_EVENTS_V0, "seq");
    const events = all
      .filter((e) => Number(e?.seq) > minSeq)
      .sort((a, b) => Number(a.seq) - Number(b.seq));
    return Object.freeze({ ok: true, events: Object.freeze(events) });
  });
}

export async function countSimulationEventsV0() {
  if (!canPersistUserTopologyN12V0()) return 0;
  const out = await listSimulationEventsV0(0);
  return out.ok ? out.events.length : 0;
}

/**
 * @param {number} [afterSeq]
 */
export async function listPendingSyncEventsV0(afterSeq = 0) {
  const out = await listSimulationEventsV0(afterSeq);
  if (!out.ok) return out;
  const events = out.events.filter((e) => e.syncStatus === "PENDING_SYNC");
  return Object.freeze({ ok: true, events: Object.freeze(events) });
}
