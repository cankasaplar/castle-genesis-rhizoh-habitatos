/**
 * ReplayEngine — rebuild codex state from snapshot + event tail.
 */

import { reduceCodexEventV0, createInitialCodexStateV0, foldCodexEventsV0 } from "./codexReducerV0.js";
import { listSimulationEventsV0 } from "../storage/EventStoreV0.js";
import { loadLatestCodexSnapshotV0, maybeSnapshotCodexStateV0 } from "../storage/SnapshotStoreV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_REPLAY_ENGINE_SCHEMA_V0 = "castle.rhizoh.replay_engine.v0";

/** @type {object | null} */
let codexStateCacheV0 = null;

export function readCodexStateV0() {
  return codexStateCacheV0 || createInitialCodexStateV0();
}

/**
 * @param {object} state
 */
export function publishCodexStateV0(state) {
  codexStateCacheV0 = state;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.codexState = Object.freeze({ readOnly: true, ...state });
  }
  return state;
}

/**
 * @param {object} event
 * @param {object} state
 */
export async function applyCodexEventLiveV0(event, state) {
  const base = state && typeof state === "object" ? state : createInitialCodexStateV0();
  const next = reduceCodexEventV0(base, event);
  publishCodexStateV0(next);
  if (event?.seq) {
    await maybeSnapshotCodexStateV0(event.seq, next);
  }
  return next;
}

/**
 * Rebuild STATE = f(EVENTS) from latest snapshot + tail.
 */
export async function rebuildCodexStateV0() {
  if (!canPersistUserTopologyN12V0()) {
    const initial = createInitialCodexStateV0();
    publishCodexStateV0(initial);
    return Object.freeze({ ok: false, reason: "n12_topology_denied", state: initial });
  }

  const snapOut = await loadLatestCodexSnapshotV0();
  const offset = snapOut.snapshot?.eventOffset ?? 0;
  const baseState = snapOut.snapshot?.state
    ? foldCodexEventsV0([], snapOut.snapshot.state)
    : createInitialCodexStateV0();

  const eventsOut = await listSimulationEventsV0(offset);
  const state = foldCodexEventsV0(eventsOut.events || [], baseState);
  publishCodexStateV0(state);

  logCastleLifecycleV0("codex_replay_rebuild", {
    snapshotOffset: offset,
    tailEvents: eventsOut.events?.length || 0,
    cycleLayer: state.cycleLayer,
    totalGhosts: state.totalGhosts
  });

  return Object.freeze({
    ok: true,
    state,
    snapshotOffset: offset,
    replayed: eventsOut.events?.length || 0
  });
}

/** @internal vitest */
export function __resetCodexStateCacheForTestV0() {
  codexStateCacheV0 = null;
}
