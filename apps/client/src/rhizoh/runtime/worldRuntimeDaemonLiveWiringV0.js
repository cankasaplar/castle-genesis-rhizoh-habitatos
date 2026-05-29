/**
 * Mount Sprint C world runtime daemon — interval-driven, NOT rAF.
 *
 * Env: `VITE_WORLD_RUNTIME_DAEMON=1`
 */

import { tickWorldRuntimeDaemonV0, attachDaemonSnapshotToKernelV0 } from "./worldRuntimeDaemonV0.js";
import {
  WORLD_RUNTIME_DAEMON_DEFAULTS_V0,
  isWorldRuntimeDaemonEnabledV0,
  resetWorldRuntimeDaemonStateV0,
  getWorldRuntimeDaemonStateV0
} from "./worldRuntimeDaemonQueueV0.js";

export const WORLD_RUNTIME_DAEMON_LIVE_WIRING_SCHEMA_V0 =
  "castle.rhizoh.world_runtime_daemon_live_wiring.v0";

export const WORLD_RUNTIME_DAEMON_TICK_MS_V0 = WORLD_RUNTIME_DAEMON_DEFAULTS_V0.tickIntervalMs;

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 */
export function installWorldRuntimeDaemonLiveWiringV0(getState, setState) {
  if (!isWorldRuntimeDaemonEnabledV0()) {
    return () => {};
  }

  const daemon = getWorldRuntimeDaemonStateV0();
  daemon.running = true;

  const id = window.setInterval(() => {
    const tick = tickWorldRuntimeDaemonV0(getState, setState, { nowMs: Date.now() });
    if (tick.processed > 0 || tick.queueDepth > 0) {
      setState(attachDaemonSnapshotToKernelV0(getState()));
    }
  }, WORLD_RUNTIME_DAEMON_TICK_MS_V0);

  return () => {
    window.clearInterval(id);
    daemon.running = false;
    resetWorldRuntimeDaemonStateV0();
  };
}
