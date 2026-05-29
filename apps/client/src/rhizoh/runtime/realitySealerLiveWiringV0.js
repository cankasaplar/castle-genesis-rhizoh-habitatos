/**
 * Live sealer wiring — ontological rhythm, NOT frame rhythm.
 *
 * **Do not** call from rAF, every frame, or every coherence pass.
 *
 * Primary: WAL ingress poke after `submitWorldAuthoritySealCandidateV0`.
 * Secondary: 2s watchdog when queue non-empty + schedule eligible.
 * Fallback: low-frequency app heartbeat (optional env).
 */

import { evaluateSealerScheduleV0 } from "./realitySealerScheduleV0.js";
import { tickRealitySealerOnKernelV0 } from "./realitySealerRuntimeV0.js";
import { submitWorldAuthoritySealCandidateV0, KIND_TO_COMMIT_CLASS } from "./submitWorldAuthoritySealCandidateV0.js";
import { observeSealerTickMetricsV0 } from "./realityHealthMetricsV0.js";

export const REALITY_SEALER_LIVE_WIRING_SCHEMA_V0 = "castle.rhizoh.reality_sealer_live_wiring.v0";

export const REALITY_SEALER_WATCHDOG_INTERVAL_MS_V0 = 2000;

export const REALITY_SEALER_HEARTBEAT_INTERVAL_MS_V0 = 8000;

function heartbeatEnabled() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_REALITY_SEAL_HEARTBEAT === "1";
  } catch {
    return false;
  }
}

/**
 * Lightweight schedule poke — drains only when cadence / thresholds / WAL sealing ingress allow.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{
 *   nowMs?: number,
 *   trigger?: string,
 *   walIngressSealing?: boolean,
 *   persist?: boolean,
 *   forceDrain?: boolean
 * }} [opts]
 */
export function pokeRealitySealerScheduleOnKernelV0(getState, setState, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const kernel = getState();
  const schedule = evaluateSealerScheduleV0(kernel.realitySeal, nowMs, {
    forceDrain: opts.forceDrain,
    walIngressSealing: opts.walIngressSealing
  });

  const pokeAtMs = nowMs;

  if (!schedule.shouldDrain && opts.forceDrain !== true) {
    observeSealerTickMetricsV0(kernel.realitySeal, {
      drained: false,
      pokeAtMs,
      scheduleReason: schedule.reason,
      inflationStatus: schedule.inflationStatus
    });
    return {
      poked: true,
      drained: false,
      trigger: opts.trigger ?? "poke",
      scheduleReason: schedule.reason,
      inflationStatus: schedule.inflationStatus,
      queueLen: schedule.queueLen,
      seal: kernel.realitySeal
    };
  }

  const tick = tickRealitySealerOnKernelV0(getState, setState, {
    nowMs,
    persist: opts.persist,
    forceDrain: opts.forceDrain,
    walIngressSealing: opts.walIngressSealing
  });

  observeSealerTickMetricsV0(tick.seal ?? getState().realitySeal, {
    drained: tick.sealed > 0,
    sealed: tick.sealed,
    pokeAtMs,
    scheduleReason: tick.scheduleReason ?? schedule.reason,
    inflationStatus: tick.inflationStatus
  });

  return {
    poked: true,
    drained: tick.sealed > 0,
    trigger: opts.trigger ?? "poke",
    scheduleReason: tick.scheduleReason ?? schedule.reason,
    ...tick
  };
}

/**
 * WAL ingress + primary poke (preferred entry for world diffs).
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {import("./submitWorldAuthoritySealCandidateV0.js").WalWorldDiffV0} walDiff
 * @param {{ nowMs?: number, persist?: boolean, autoRejectUnsigned?: boolean }} [opts]
 */
export function submitWorldAuthoritySealCandidateOnKernelV0(getState, setState, walDiff, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const kernel = getState();
  const epochBefore = kernel.realitySeal.realityEpoch;
  const ingress = submitWorldAuthoritySealCandidateV0(kernel.realitySeal, walDiff, {
    ...opts,
    drain: false
  });
  if (!ingress.ok) {
    return ingress;
  }

  const commitClassId = KIND_TO_COMMIT_CLASS[String(walDiff?.kind || "")] ?? "high_rate_substrate";
  const walIngressSealing =
    commitClassId === "sealing_world_geometry" || commitClassId === "sealing_topology_mandate";

  setState({ ...kernel, realitySeal: ingress.seal });

  const poke = pokeRealitySealerScheduleOnKernelV0(getState, setState, {
    nowMs,
    trigger: "wal_ingress",
    walIngressSealing,
    persist: opts.persist,
    forceDrain: opts.forceDrain
  });

  const epochAfter = getState().realitySeal.realityEpoch;
  return {
    ...ingress,
    seal: getState().realitySeal,
    poke,
    walEpochAuthority: {
      walWroteEpochDirectly: false,
      epochBefore,
      epochAfter,
      epochAdvancedBySealerDrain: poke.sealed > 0 && epochAfter > epochBefore
    }
  };
}

/**
 * 2s watchdog — queue non-empty; schedule must still approve drain (no force).
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ intervalMs?: number, persist?: boolean }} [opts]
 * @returns {() => void}
 */
export function installRealitySealerWatchdogV0(getState, setState, opts = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const intervalMs = Number(opts.intervalMs) || REALITY_SEALER_WATCHDOG_INTERVAL_MS_V0;
  const id = window.setInterval(() => {
    const q = getState().realitySeal?.sealQueue?.length ?? 0;
    if (q === 0) return;
    pokeRealitySealerScheduleOnKernelV0(getState, setState, {
      trigger: "watchdog_2s",
      persist: opts.persist
    });
  }, intervalMs);
  return () => window.clearInterval(id);
}

/**
 * Optional low-frequency heartbeat fallback (env-gated).
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ intervalMs?: number, persist?: boolean }} [opts]
 * @returns {() => void}
 */
export function installRealitySealerAppHeartbeatV0(getState, setState, opts = {}) {
  if (!heartbeatEnabled() || typeof window === "undefined") {
    return () => {};
  }
  const intervalMs = Number(opts.intervalMs) || REALITY_SEALER_HEARTBEAT_INTERVAL_MS_V0;
  const id = window.setInterval(() => {
    const q = getState().realitySeal?.sealQueue?.length ?? 0;
    if (q === 0) return;
    pokeRealitySealerScheduleOnKernelV0(getState, setState, {
      trigger: "app_heartbeat",
      persist: opts.persist
    });
  }, intervalMs);
  return () => window.clearInterval(id);
}

/**
 * Mount once at app boot — watchdog + optional heartbeat. NOT rAF.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 */
export function installRealitySealerLiveWiringV0(getState, setState) {
  const stopWatchdog = installRealitySealerWatchdogV0(getState, setState);
  const stopHeartbeat = installRealitySealerAppHeartbeatV0(getState, setState);
  return () => {
    stopWatchdog();
    stopHeartbeat();
  };
}
