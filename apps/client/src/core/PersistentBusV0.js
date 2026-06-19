/**
 * PersistentBus — emit → persist → dispatch chain.
 */

import { emitCodexBusV0 } from "./CodexBusV0.js";
import { CODEX_EVENT_TYPE_V0, normalizeCodexEventTypeV0 } from "./codexReducerV0.js";
import { applyCodexEventLiveV0, readCodexStateV0 } from "./ReplayEngineV0.js";
import { pushSimulationEventV0 } from "../storage/EventStoreV0.js";
import { addGhostV0, archiveGhostV0 } from "../storage/GhostStoreV0.js";
import { incrementEdgeWeightV0 } from "../storage/EdgeStoreV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { enqueueRhizohPwaSyncV0 } from "../pwa/rhizohPwaSyncManagerV0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import {
  bridgeCodexGhostToTruthTraceV0,
  publishCodexGhostTruthBridgeRegistryV0
} from "../rhizoh/runtime/codexGhostTruthTraceBridgeV0.js";

export const RHIZOH_PERSISTENT_BUS_SCHEMA_V0 = "castle.rhizoh.persistent_bus.v0";

/**
 * @param {string} type
 * @param {object} [payload]
 */
export async function persistentCodexEmitV0(type, payload = {}) {
  const eventType = String(type || "").trim();
  if (!eventType) return Object.freeze({ ok: false, reason: "empty_type" });
  const normalizedType = normalizeCodexEventTypeV0(eventType);

  const cycle = readCodexStateV0().cycleLayer || 0;
  const seed = readCodexStateV0().seed || 0;
  let persisted = false;
  let event = null;

  if (canPersistUserTopologyN12V0()) {
    const pushOut = await pushSimulationEventV0(eventType, payload, {
      cycle,
      localLayer: cycle,
      localSeed: seed
    });
    if (pushOut.ok) {
      persisted = true;
      event = pushOut.event;
      if (event?.syncStatus === "PENDING_SYNC") {
        enqueueRhizohPwaSyncV0({ type: eventType, payload, id: event.id });
      }
      await applyPersistedSideEffectsV0(normalizedType, payload, event, cycle);
      await applyCodexEventLiveV0(event, readCodexStateV0());
    }
  } else {
    const synthetic = Object.freeze({
      type: eventType,
      payload,
      seq: 0,
      cycle,
      ts: Date.now()
    });
    await applyCodexEventLiveV0(synthetic, readCodexStateV0());
  }

  const dispatch = emitCodexBusV0(eventType, payload, {
    persisted,
    seq: event?.seq ?? null,
    cycle
  });

  logCastleLifecycleV0("persistent_codex_emit", {
    type: eventType,
    persisted,
    seq: event?.seq ?? null
  });

  bridgeCodexGhostToTruthTraceV0(eventType, payload, {
    persisted,
    seq: event?.seq ?? null,
    cycle
  });
  publishCodexGhostTruthBridgeRegistryV0();

  return Object.freeze({
    ok: true,
    persisted,
    event,
    dispatch
  });
}

/**
 * @param {string} type
 * @param {object} payload
 * @param {object} event
 * @param {number} cycle
 */
async function applyPersistedSideEffectsV0(type, payload, event, cycle) {
  if (type === CODEX_EVENT_TYPE_V0.GHOST_DISPATCH) {
    const ghostOut = await addGhostV0({
      id: payload.id || `ghost_${event.seq}`,
      type: payload.type,
      origin: payload.origin,
      destination: payload.destination,
      cycleLayer: payload.cycleLayer ?? cycle,
      preference: payload.preference,
      entropy: payload.entropy
    });
    if (payload.origin && payload.destination) {
      await incrementEdgeWeightV0(payload.origin, payload.destination, 1);
    }
    return ghostOut;
  }

  if (type === CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED) {
    return archiveGhostV0(payload.id || payload.ghostId);
  }

  if (type === CODEX_EVENT_TYPE_V0.AWAKEN) {
    const pin = String(payload.pin || payload.continent || "");
    const prev = String(payload.previousPin || payload.previousContinent || "");
    if (pin && prev) {
      await incrementEdgeWeightV0(prev, pin, 1);
    }
    return null;
  }

  return null;
}

/** Convenience wrappers */
export const PersistentCodexBusV0 = Object.freeze({
  emit: persistentCodexEmitV0,
  AWAKEN: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.AWAKEN, payload),
  GHOST_DISPATCH: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.GHOST_DISPATCH, payload),
  GHOST_ARCHIVED: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED, payload),
  /** Prototype aliases */
  GHOST_SPAWN: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.GHOST_SPAWN, payload),
  GHOST_DEATH: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.GHOST_DEATH, payload),
  DIMENSIONAL_COLLAPSE: (payload) => persistentCodexEmitV0(CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE, payload)
});
