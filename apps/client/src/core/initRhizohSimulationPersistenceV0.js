/**
 * Boot hook — rebuild codex state from event log when topology N12 grant is active.
 */

import { rebuildSimulationFromEventsV0 } from "./ReplayEngineV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_SIMULATION_PERSISTENCE_SCHEMA_V0 = "castle.rhizoh.simulation_persistence.v0";

let initDoneV0 = false;

/**
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<object>}
 */
export async function initRhizohSimulationPersistenceV0(opts = {}) {
  const force = opts.force === true;
  if (initDoneV0 && !force) {
    const mode = typeof window !== "undefined" ? window.__rhizoh?.simulationPersistence?.mode : null;
    if (mode === "event_sourced" || !canPersistUserTopologyN12V0()) {
      return Object.freeze({ ok: true, skipped: true, reason: "already_init" });
    }
  }
  initDoneV0 = true;

  if (!canPersistUserTopologyN12V0()) {
    logCastleLifecycleV0("sim_persistence_init", { mode: "memory_only", reason: "n12_topology_denied" });
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.simulationPersistence = Object.freeze({
        schema: RHIZOH_SIMULATION_PERSISTENCE_SCHEMA_V0,
        mode: "memory_only"
      });
    }
    return Object.freeze({ ok: true, mode: "memory_only" });
  }

  const rebuilt = await rebuildSimulationFromEventsV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.simulationPersistence = Object.freeze({
      schema: RHIZOH_SIMULATION_PERSISTENCE_SCHEMA_V0,
      mode: "event_sourced",
      replayed: rebuilt.world?.replayed ?? rebuilt.codex?.replayed ?? 0,
      snapshotOffset: rebuilt.codex?.snapshotOffset ?? 0,
      shouldResume: rebuilt.world?.shouldResume === true,
      activeGhosts: rebuilt.world?.world?.activeGhosts?.length ?? 0
    });
  }

  logCastleLifecycleV0("sim_persistence_init", {
    mode: "event_sourced",
    replayed: rebuilt.world?.replayed ?? 0,
    snapshotOffset: rebuilt.codex?.snapshotOffset ?? 0,
    shouldResume: rebuilt.world?.shouldResume === true
  });

  return Object.freeze({ ok: true, mode: "event_sourced", rebuilt });
}

/** @internal vitest */
export function __resetRhizohSimulationPersistenceInitForTestV0() {
  initDoneV0 = false;
}
