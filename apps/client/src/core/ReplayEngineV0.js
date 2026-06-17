/**
 * ReplayEngine v1 — rebuild codex + simulation world from snapshot + event tail.
 * ENGINE ↔ EVENTS ↔ DB ↔ REPLAY ↔ ENGINE
 */

import { reduceCodexEventV0, createInitialCodexStateV0, foldCodexEventsV0 } from "./codexReducerV0.js";
import {
  createInitialSimulationWorldV0,
  foldSimulationWorldEventsV0
} from "./replayWorldReducerV0.js";
import { attachFoldedPatternsToCodexStateV0 } from "./semanticEventFoldV0.js";
import { listSimulationEventsV0 } from "../storage/EventStoreV0.js";
import { loadLatestCodexSnapshotV0, maybeSnapshotCodexStateV0 } from "../storage/SnapshotStoreV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_REPLAY_ENGINE_SCHEMA_V0 = "castle.rhizoh.replay_engine.v0";
export const RHIZOH_SIMULATION_WORLD_REBUILT_EVENT_V0 = "rhizoh:simulation-world-rebuilt-v0";

/** @type {object | null} */
let codexStateCacheV0 = null;
/** @type {object | null} */
let simulationWorldCacheV0 = null;

export function readCodexStateV0() {
  return codexStateCacheV0 || createInitialCodexStateV0();
}

export function readSimulationWorldV0() {
  return simulationWorldCacheV0 || createInitialSimulationWorldV0();
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
 * @param {object} world
 * @param {{ source?: string, resumeSpiral?: boolean }} [meta]
 */
export function publishSimulationWorldV0(world, meta = {}) {
  simulationWorldCacheV0 = world;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.simulationWorld = Object.freeze({ readOnly: true, ...world });
    window.dispatchEvent(
      new CustomEvent(RHIZOH_SIMULATION_WORLD_REBUILT_EVENT_V0, {
        detail: Object.freeze({
          world,
          source: meta.source || "unknown",
          resumeSpiral: meta.resumeSpiral === true
        })
      })
    );
  }
  return world;
}

/**
 * @param {object} event
 * @param {object} state
 */
export async function applyCodexEventLiveV0(event, state) {
  const base = state && typeof state === "object" ? state : createInitialCodexStateV0();
  const next = reduceCodexEventV0(base, event);
  publishCodexStateV0(next);

  const worldBase = readSimulationWorldV0();
  const worldNext = foldSimulationWorldEventsV0([event], worldBase);
  publishSimulationWorldV0(worldNext, { source: "live_codex" });

  if (event?.seq) {
    await maybeSnapshotCodexStateV0(event.seq, next);
  }
  return next;
}

/**
 * Deterministic fold: same event stream → identical codex + world state.
 * @param {object[]} events
 * @param {object} [snapState]
 */
export function reconstructFromEventsV0(events, snapState) {
  const baseCodex = snapState ? foldCodexEventsV0([], snapState) : createInitialCodexStateV0();
  const codexState = attachFoldedPatternsToCodexStateV0(foldCodexEventsV0(events, baseCodex), events);
  const world = foldSimulationWorldEventsV0(events, createInitialSimulationWorldV0());
  return Object.freeze({ codexState, world });
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
  const confirmed = (eventsOut.events || []).filter((e) => e.syncStatus !== "PENDING_SYNC");
  const state = attachFoldedPatternsToCodexStateV0(foldCodexEventsV0(confirmed, baseState), confirmed);
  publishCodexStateV0(state);

  logCastleLifecycleV0("codex_replay_rebuild", {
    snapshotOffset: offset,
    tailEvents: confirmed.length,
    cycleLayer: state.cycleLayer,
    totalGhosts: state.totalGhosts
  });

  return Object.freeze({
    ok: true,
    state,
    snapshotOffset: offset,
    replayed: confirmed.length
  });
}

/**
 * Rebuild simulation world (ghosts, gates, collapse) from full confirmed event log.
 */
export async function rebuildSimulationWorldV0() {
  if (!canPersistUserTopologyN12V0()) {
    const initial = createInitialSimulationWorldV0();
    publishSimulationWorldV0(initial, { source: "initial" });
    return Object.freeze({ ok: false, reason: "n12_topology_denied", world: initial });
  }

  const eventsOut = await listSimulationEventsV0(0);
  const confirmed = (eventsOut.events || []).filter((e) => e.syncStatus !== "PENDING_SYNC");
  const { codexState, world } = reconstructFromEventsV0(confirmed);
  publishCodexStateV0(codexState);
  publishSimulationWorldV0(world, { source: "persistence_rebuild" });

  logCastleLifecycleV0("simulation_world_rebuild", {
    eventCount: confirmed.length,
    activeGhosts: world.activeGhosts.length,
    cycleLayer: world.cycleLayer,
    seed: world.seed,
    patternCount: codexState.behaviorPatterns?.length || 0
  });

  return Object.freeze({
    ok: true,
    world,
    codexState,
    replayed: confirmed.length,
    shouldResume: world.activeGhosts.length > 0 || (codexState.cycleLayer || 0) > 0
  });
}

/**
 * Full replay loop — codex + world in one pass.
 */
export async function rebuildSimulationFromEventsV0() {
  const codexOut = await rebuildCodexStateV0();
  const worldOut = await rebuildSimulationWorldV0();
  return Object.freeze({
    ok: codexOut.ok && worldOut.ok,
    codex: codexOut,
    world: worldOut
  });
}

/** @internal vitest */
export function __resetCodexStateCacheForTestV0() {
  codexStateCacheV0 = null;
  simulationWorldCacheV0 = null;
}
