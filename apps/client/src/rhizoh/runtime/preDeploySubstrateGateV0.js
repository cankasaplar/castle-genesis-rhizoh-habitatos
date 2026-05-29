/**
 * Pre-deploy substrate gate — metrics + soak helpers (no ROS / federation execution).
 */

import { createInitialStudioKernelState } from "../../studio/store/initialState.ts";
import { resolveBootRealitySealContinuityV0, BOOT_REALITY_DECISION_V0 } from "./realitySealBootContinuityV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "./realitySealDiskV0.js";
import { enqueueWorldRuntimeStreamFrameV0, resetWorldRuntimeDaemonStateV0, getWorldRuntimeDaemonStateV0 } from "./worldRuntimeDaemonQueueV0.js";
import { WAL_STREAM_FRAME_KIND_V0 } from "./worldAuthorityStreamIngressV0.js";
import { processPeerWalConvergenceV0, PEER_WAL_SCENARIO_V0 } from "./peerWalConvergenceWireV0.js";
import { evaluateSealerScheduleV0 } from "./realitySealerScheduleV0.js";
import { pokeRealitySealerScheduleOnKernelV0 } from "./realitySealerLiveWiringV0.js";
import { createDefaultRealitySealLayerStateV0 } from "./realitySealingCoreV0.js";

export const PRE_DEPLOY_SUBSTRATE_GATE_SCHEMA_V0 = "castle.rhizoh.pre_deploy_substrate_gate.v0";

/** Features that must NOT ship before substrate stabilizes. */
export const PRE_DEPLOY_BLOCKED_FEATURE_FLAGS_V0 = Object.freeze([
  "VITE_ROS_EXECUTION_RUNTIME",
  "VITE_FEDERATION_LAW_NEGOTIATION",
  "VITE_CROSS_CASTLE_TOPOLOGY_MERGE",
  "VITE_GLOBAL_SPATIAL_CONSENSUS"
]);

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {{ nowMs?: number }} [opts]
 */
export function collectSealCadenceMetricsV0(seal, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const s = createDefaultRealitySealLayerStateV0(seal);
  const sched = evaluateSealerScheduleV0(s, nowMs, {});
  const winMs = Math.max(s.budget.windowMs, 1);
  const sealsPerSec = s.budget.sealsInWindow / (winMs / 1000);
  return {
    schema: PRE_DEPLOY_SUBSTRATE_GATE_SCHEMA_V0,
    ts: nowMs,
    realityEpoch: s.realityEpoch,
    queueDepth: s.sealQueue.length,
    sealsInWindow: s.budget.sealsInWindow,
    maxSealsPerWindow: s.budget.maxSealsPerWindow,
    sealsPerSec,
    scheduleReason: sched.reason,
    shouldDrain: sched.shouldDrain,
    inflationStatus: sched.inflationStatus,
    coalesceHoldUntilMs: s.scheduler.coalesceHoldUntilMs,
    lastDrainAtMs: s.scheduler.lastDrainAtMs
  };
}

/**
 * WAL queue overflow soak — returns drop count under flood.
 *
 * @param {number} frameCount
 */
export function walQueueOverflowSoakV0(frameCount = 80) {
  resetWorldRuntimeDaemonStateV0();
  let accepted = 0;
  let dropped = 0;
  for (let i = 0; i < frameCount; i++) {
    const r = enqueueWorldRuntimeStreamFrameV0({
      streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM,
      frame: {
        frameId: `soak:ob:${i}`,
        roomScope: "room:soak",
        delta: { discs: [{ x: i, z: i, r: 0.5 }] },
        signed: true
      }
    });
    if (r.accepted) accepted += 1;
    else dropped += 1;
  }
  const bp = getWorldRuntimeDaemonStateV0().backpressure;
  return {
    frameCount,
    accepted,
    dropped,
    queueDepth: bp.depth,
    paused: bp.paused,
    droppedFrames: bp.droppedFrames
  };
}

/**
 * Peer convergence spam — many feeds same castleId.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {number} count
 */
export function peerConvergenceSpamSoakV0(getState, count = 50) {
  resetWorldRuntimeDaemonStateV0();
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(
      processPeerWalConvergenceV0(
        {
          history: [
            {
              diffId: `spam:ob:${i}`,
              kind: "obstacle_delta",
              lamport: i,
              castleId: "castle:spammer",
              signed: true,
              payload: { discs: [{ x: i * 0.1, z: 1, r: 0.5 }] }
            }
          ],
          signed: true,
          observedAtMs: Date.now()
        },
        { castleId: "castle:spammer", getState, nowMs: Date.now() }
      )
    );
  }
  const pc = getWorldRuntimeDaemonStateV0().peerConvergence ?? {};
  return {
    count,
    quarantine: Object.keys(pc.quarantineByCastleId ?? {}).length,
    accepted: Object.keys(pc.acceptedByCastleId ?? {}).length,
    lastDisposition: results[results.length - 1]?.disposition,
    debugEvents: (pc.debugEvents ?? []).length
  };
}

/**
 * Simulate watchdog pokes under coalesce hold (starvation guard).
 */
export function sealerWatchdogStarvationProbeV0(getState, setState, opts = {}) {
  let state = createInitialStudioKernelState();
  const get = getState ?? (() => state);
  const set =
    setState ??
    ((n) => {
      state = n;
    });

  const nowMs = Number(opts.nowMs) || Date.now();
  const seal = createDefaultRealitySealLayerStateV0(get().realitySeal, { nowMs });
  seal.scheduler.lastDrainAtMs = nowMs;
  seal.scheduler.coalesceHoldUntilMs = nowMs + 60_000;
  seal.sealQueue = [
    {
      candidateId: "wal:starve:1",
      source: "wal",
      commitClassId: "noise_or_duplicate",
      payloadHash: "hstarve0001",
      enqueuedAtMs: nowMs,
      leaseOk: true
    }
  ];
  set({ ...get(), realitySeal: seal });

  const pokes = [];
  for (let i = 0; i < (opts.pokeCount ?? 5); i++) {
    pokes.push(
      pokeRealitySealerScheduleOnKernelV0(get, set, {
        nowMs: nowMs + i * 100,
        trigger: "watchdog_2s"
      })
    );
  }
  const drained = pokes.filter((p) => p.drained).length;
  return {
    pokeCount: pokes.length,
    drained,
    queueLen: get().realitySeal.sealQueue.length,
    coalesceHoldUntilMs: get().realitySeal.scheduler.coalesceHoldUntilMs,
    starvationObserved: drained === 0 && get().realitySeal.sealQueue.length > 0
  };
}

/**
 * Replay disk corruption scenarios.
 *
 * @param {string} raw
 */
export function probeReplayPersistenceCorruptionV0(raw) {
  /** @type {{ ok: boolean, code?: string, payload?: unknown }} */
  let payload;
  if (!raw || typeof raw !== "string") {
    payload = { ok: false, code: "disk_empty" };
  } else {
    try {
      payload = { ok: true, payload: JSON.parse(raw) };
    } catch {
      payload = { ok: false, code: "disk_json_corrupt" };
    }
  }
  const decision = resolveBootRealitySealContinuityV0(payload, Date.now());
  return {
    payloadCode: payload.ok ? "ok" : payload.code,
    decision: decision.decision,
    issues: decision.issues ?? []
  };
}

/**
 * Attempt recovery when peer was quarantined for stale but feed is fresh again.
 *
 * @param {string} castleId
 * @param {import("./peerWalConvergenceWireV0.js").WalPeerFeedV0} freshFeed
 * @param {{ getState: () => import("../../studio/types/rskOntology.js").StudioKernelState }} ctx
 */
export function attemptPeerQuarantineRecoveryV0(castleId, freshFeed, ctx) {
  const daemon = getWorldRuntimeDaemonStateV0();
  const id = String(castleId || "").slice(0, 64);
  const prior = daemon.peerConvergence?.quarantineByCastleId?.[id];
  if (!prior) {
    return { recovered: false, reason: "not_quarantined" };
  }
  const r = processPeerWalConvergenceV0(freshFeed, {
    castleId: id,
    getState: ctx.getState,
    nowMs: Date.now()
  });
  const recovered = r.disposition === "accept";
  return {
    recovered,
    priorScenario: prior.scenario,
    disposition: r.disposition,
    scenario: r.scenario
  };
}

/**
 * @param {Record<string, string>} env
 */
export function auditSubstrateFeatureFlagsV0(env = {}) {
  const e = env && typeof env === "object" ? env : {};
  const blocked = [];
  for (const key of PRE_DEPLOY_BLOCKED_FEATURE_FLAGS_V0) {
    if (String(e[key] || "").trim() === "1") blocked.push(key);
  }
  return { blocked, ok: blocked.length === 0 };
}

export { BOOT_REALITY_DECISION_V0, PEER_WAL_SCENARIO_V0, REALITY_SEAL_DISK_KEY_V0 };
