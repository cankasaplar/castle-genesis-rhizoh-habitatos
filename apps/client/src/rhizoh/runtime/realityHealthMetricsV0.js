/**
 * Reality health metrics — post-deploy observability for sealer cadence + peer convergence.
 *
 * Counters only; no execution authority. Exposed via __rhizoh.debug().realityHealth.
 */

import { createDefaultRealitySealLayerStateV0 } from "./realitySealingCoreV0.js";
import { evaluateSealerScheduleV0 } from "./realitySealerScheduleV0.js";
import { getWorldRuntimeDaemonStateV0 } from "./worldRuntimeDaemonQueueV0.js";
import { collectSealCadenceMetricsV0 } from "./preDeploySubstrateGateV0.js";
import { buildSubstrateAuthorityProfileSnapshotV0 } from "./substrateAuthorityProfileV0.js";

export const REALITY_HEALTH_METRICS_SCHEMA_V0 = "castle.rhizoh.reality_health_metrics.v0";

const counters = {
  drainPasses: 0,
  epochBumps: 0,
  schedulePokes: 0,
  inflationHoldCount: 0,
  inflationCriticalHoldCount: 0,
  quarantineEvents: 0,
  replayMismatchEvents: 0,
  unsignedRejectEvents: 0,
  walQueuePressurePeak: 0,
  lastDrainAtMs: 0,
  lastDrainLatencyMs: 0,
  lastDrainLatencyMaxMs: 0,
  drainLatencySumMs: 0,
  drainLatencySamples: 0,
  lastEpoch: 0,
  sessionStartedAtMs: Date.now()
};

/**
 * @param {Partial<typeof counters>} delta
 */
export function recordRealityHealthMetricV0(delta) {
  if (!delta || typeof delta !== "object") return;
  for (const [k, v] of Object.entries(delta)) {
    if (!(k in counters)) continue;
    if (typeof counters[k] === "number" && typeof v === "number") {
      if (k === "walQueuePressurePeak") {
        counters[k] = Math.max(counters[k], v);
      } else {
        counters[k] += v;
      }
    }
  }
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {{ drained?: boolean, sealed?: number, scheduleReason?: string, inflationStatus?: string }} tick
 */
export function observeSealerTickMetricsV0(seal, tick = {}) {
  const pokeAtMs = Number(tick.pokeAtMs) || Date.now();
  recordRealityHealthMetricV0({ schedulePokes: 1 });
  const s = createDefaultRealitySealLayerStateV0(seal);
  const depth = s.sealQueue.length;
  recordRealityHealthMetricV0({ walQueuePressurePeak: depth });

  if (tick.drained || (tick.sealed ?? 0) > 0) {
    const nowMs = Date.now();
    const latencyMs = Math.max(0, nowMs - pokeAtMs);
    recordRealityHealthMetricV0({ drainPasses: 1, lastDrainAtMs: nowMs });
    counters.lastDrainLatencyMs = latencyMs;
    counters.lastDrainLatencyMaxMs = Math.max(counters.lastDrainLatencyMaxMs, latencyMs);
    counters.drainLatencySumMs += latencyMs;
    counters.drainLatencySamples += 1;
  }
  const epoch = s.realityEpoch;
  if (epoch > counters.lastEpoch) {
    recordRealityHealthMetricV0({ epochBumps: epoch - counters.lastEpoch });
    counters.lastEpoch = epoch;
  }

  const infl = tick.inflationStatus ?? evaluateSealerScheduleV0(s, Date.now()).inflationStatus;
  if (infl === "warn" && tick.scheduleReason === "inflation_critical_hold") {
    recordRealityHealthMetricV0({ inflationHoldCount: 1 });
  }
  if (infl === "critical") {
    recordRealityHealthMetricV0({ inflationCriticalHoldCount: 1 });
  }
  if (tick.scheduleReason === "inflation_critical_hold") {
    recordRealityHealthMetricV0({ inflationHoldCount: 1 });
  }
}

/**
 * @param {{ scenario?: string, disposition?: string }} record
 */
export function observePeerWalConvergenceMetricsV0(record) {
  const scenario = String(record?.scenario || "");
  if (record?.disposition === "quarantine") {
    recordRealityHealthMetricV0({ quarantineEvents: 1 });
  }
  if (scenario === "replay_mismatch") {
    recordRealityHealthMetricV0({ replayMismatchEvents: 1 });
  }
  if (scenario === "unsigned") {
    recordRealityHealthMetricV0({ unsignedRejectEvents: 1 });
  }
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} [seal]
 * @returns {Record<string, unknown>}
 */
export function buildRealityHealthMetricsSnapshotV0(seal) {
  const nowMs = Date.now();
  const sessionSec = Math.max((nowMs - counters.sessionStartedAtMs) / 1000, 0.001);
  const cadence = seal ? collectSealCadenceMetricsV0(seal, { nowMs }) : null;
  const daemon = getWorldRuntimeDaemonStateV0();
  const pc = daemon.peerConvergence ?? {};
  const quarantineCount = Object.keys(pc.quarantineByCastleId ?? {}).length;
  const acceptedCount = Object.keys(pc.acceptedByCastleId ?? {}).length;

  return {
    schema: REALITY_HEALTH_METRICS_SCHEMA_V0,
    ts: nowMs,
    sessionSec,
    counters: { ...counters },
    rates: {
      drainPassesPerMin: (counters.drainPasses / sessionSec) * 60,
      epochBumpsPerMin: (counters.epochBumps / sessionSec) * 60,
      avgDrainLatencyMs:
        counters.drainLatencySamples > 0 ? counters.drainLatencySumMs / counters.drainLatencySamples : 0
    },
    drainLatency: {
      lastMs: counters.lastDrainLatencyMs,
      maxMs: counters.lastDrainLatencyMaxMs,
      avgMs:
        counters.drainLatencySamples > 0 ? counters.drainLatencySumMs / counters.drainLatencySamples : 0,
      samples: counters.drainLatencySamples
    },
    sealCadence: cadence,
    queuePressure: {
      currentDepth: cadence?.queueDepth ?? 0,
      peakDepth: counters.walQueuePressurePeak,
      sealsPerSec: cadence?.sealsPerSec ?? 0,
      inflationStatus: cadence?.inflationStatus ?? "ok"
    },
    peerConvergence: {
      quarantineCount,
      acceptedCount,
      quarantineEventsTotal: counters.quarantineEvents,
      replayMismatchTotal: counters.replayMismatchEvents,
      unsignedRejectTotal: counters.unsignedRejectEvents
    },
    authorityProfile: buildSubstrateAuthorityProfileSnapshotV0()
  };
}

/** @internal test reset */
export function resetRealityHealthMetricsForTestV0() {
  for (const k of Object.keys(counters)) {
    if (k === "sessionStartedAtMs") counters[k] = Date.now();
    else if (typeof counters[k] === "number") counters[k] = 0;
  }
  counters.lastEpoch = 0;
  counters.lastDrainAtMs = 0;
  counters.lastDrainLatencyMs = 0;
  counters.lastDrainLatencyMaxMs = 0;
  counters.drainLatencySumMs = 0;
  counters.drainLatencySamples = 0;
}
