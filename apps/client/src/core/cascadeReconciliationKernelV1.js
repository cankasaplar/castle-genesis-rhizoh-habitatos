/**
 * Cascade Reconciliation Kernel v1 — temporal graph layer replay (not simple replay).
 * Event → Temporal Graph → Layer Replay → State Lattice → UI
 */

import { foldCodexEventsV0 } from "./codexReducerV0.js";
import { foldSimulationWorldEventsV0 } from "./replayWorldReducerV0.js";
import { hashTickSeedV1, deviceNeutralClockV1 } from "./deviceNeutralClockV1.js";
import { deriveDeterministicLayerSeedV0 } from "./simulationDeviceParityV0.js";

export const RHIZOH_CASCADE_RECONCILIATION_SCHEMA_V1 = "castle.rhizoh.cascade_reconciliation.v1";
export const RHIZOH_CASCADE_PHASE_V1 = Object.freeze({
  VOID_FILL: "VOID_FILL",
  LAYER_REPLAY: "LAYER_REPLAY",
  STATE_ALIGN: "STATE_ALIGN"
});

/**
 * Replay one temporal layer at a tick boundary.
 * @param {object[]} events
 * @param {number} tickSeed
 * @param {number} tick
 */
export function replayLayerV1(events, tickSeed, tick) {
  const layerSeed = deriveDeterministicLayerSeedV0(tickSeed, tick);
  const codexState = foldCodexEventsV0(events);
  const world = foldSimulationWorldEventsV0(events);
  return Object.freeze({
    tick,
    seed: layerSeed,
    codexState: Object.freeze({ ...codexState, seed: layerSeed, cycleLayer: tick }),
    world: Object.freeze({ ...world, seed: layerSeed, cycleLayer: tick })
  });
}

/**
 * @param {object[]} events
 * @param {number} lastSyncTick
 * @param {number} currentTick
 * @param {number} seed
 * @param {number} [localOffset]
 */
export function reconcileCatchUpV1(events, lastSyncTick, currentTick, seed, localOffset = 0) {
  const fromTick = Math.max(0, Number(lastSyncTick) || 0);
  const toTick = Math.max(fromTick, deviceNeutralClockV1(currentTick, localOffset));
  const missingTicks = Math.max(0, toTick - fromTick);
  const layers = [];

  for (let t = 0; t < missingTicks; t++) {
    const tickIndex = fromTick + t + 1;
    const tickSeed = hashTickSeedV1(seed, tickIndex);
    layers.push(replayLayerV1(events, tickSeed, tickIndex));
  }

  const finalState = layers.length ? layers[layers.length - 1] : replayLayerV1(events, seed, fromTick);

  return Object.freeze({
    schema: RHIZOH_CASCADE_RECONCILIATION_SCHEMA_V1,
    finalState,
    cascade: Object.freeze(layers),
    parity: true,
    fromTick,
    toTick,
    missingTicks
  });
}

/**
 * 3-phase catch-up plan for UI + reconciliation orchestration.
 */
export function buildCatchUpPhasesV1(reconcileOut) {
  return Object.freeze([
    Object.freeze({
      phase: RHIZOH_CASCADE_PHASE_V1.VOID_FILL,
      label: "VOID FILL",
      detail: "Offline gap interpolation"
    }),
    Object.freeze({
      phase: RHIZOH_CASCADE_PHASE_V1.LAYER_REPLAY,
      label: "LAYER REPLAY",
      detail: `L${reconcileOut.fromTick} → L${reconcileOut.toTick}`,
      steps: reconcileOut.missingTicks
    }),
    Object.freeze({
      phase: RHIZOH_CASCADE_PHASE_V1.STATE_ALIGN,
      label: "STATE ALIGN",
      detail: "Canonical tick lock"
    })
  ]);
}
