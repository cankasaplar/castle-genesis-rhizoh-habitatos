/**
 * Sprint A — Canonical Sealer Runtime (substrate completion).
 *
 * Owns the **scheduled drain loop**, epoch bump policy gate, budget enforcement surface,
 * replay witness export, and optional disk persistence for `realitySeal`.
 *
 * **Invariant:** Only this runtime path (via `realitySealingCoreV0` drain) advances `realityEpoch`.
 *
 * Env: `VITE_REALITY_SEAL_PERSIST=1` — localStorage persist after successful drain ticks.
 */

import {
  assessEpochInflationV0,
  buildRealitySealingCoreSnapshotV0,
  createDefaultRealitySealLayerStateV0,
  drainRealitySealQueueV0,
  replaySealAuditTrailV0
} from "./realitySealingCoreV0.js";
import { CANONICAL_REALITY_AUTHORITY_INVARIANT_V0 } from "./realitySealingCoreV0.js";
import {
  evaluateSealerScheduleV0,
  sortSealQueueByPriorityV0,
  stampSchedulerAfterDrainV0
} from "./realitySealerScheduleV0.js";
import { resolveBootRealitySealFromDiskV0 } from "./realitySealBootContinuityV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "./realitySealDiskV0.js";
import { maybeApplyPostSealBridgeOnKernelV0 } from "./postSealSimulationBridgeV0.js";
import { maybeRecordDrainContinuitySegmentV0 } from "./substrateContinuityHarnessV0.js";

export { REALITY_SEAL_DISK_KEY_V0 };

export const REALITY_SEALER_RUNTIME_SCHEMA_V0 = "castle.rhizoh.reality_sealer_runtime.v0";

/** When inflation is critical, sealing-class bumps are held (queue retained). */
export const EPOCH_BUMP_POLICY_V0 = Object.freeze({
  id: "sparse_seal_under_inflation_guard",
  holdOnCriticalInflation: true,
  holdOnWarnInflation: false
});

function persistEnabled() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_REALITY_SEAL_PERSIST === "1";
  } catch {
    return false;
  }
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {{ dEpochPerSec: number, sealsPerSec: number }}
 */
export function measureEpochRatesV0(seal) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  const winSec = Math.max(s.budget.windowMs / 1000, 0.001);
  const rate = s.budget.sealsInWindow / winSec;
  return { dEpochPerSec: rate, sealsPerSec: rate };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {"ok" | "warn" | "critical"}
 */
export function evaluateEpochBumpPolicyV0(seal) {
  return assessEpochInflationV0(Date.now(), measureEpochRatesV0(seal));
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {Record<string, unknown>}
 */
export function buildRealitySealReplayWitnessV0(seal) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  const replay = replaySealAuditTrailV0(s.auditTrail);
  return {
    schema: REALITY_SEALER_RUNTIME_SCHEMA_V0,
    invariant: CANONICAL_REALITY_AUTHORITY_INVARIANT_V0,
    ts: Date.now(),
    realityEpoch: s.realityEpoch,
    sealHashHead: s.sealHashHead,
    auditDepth: s.auditTrail.length,
    replayOk: replay.ok,
    replayCode: replay.ok ? null : replay.code,
    replayIndex: replay.ok ? null : replay.index,
    tailAudit: s.auditTrail.slice(-4),
    rates: measureEpochRatesV0(s),
    inflationStatus: evaluateEpochBumpPolicyV0(s)
  };
}

/**
 * Canonical sealer tick — schedule gate, priority sort, drain unless held.
 *
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {{ nowMs?: number, forceDrain?: boolean, maxDrainPasses?: number, walIngressSealing?: boolean }} [opts]
 */
export function runCanonicalRealitySealerTickV0(seal, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  let s = createDefaultRealitySealLayerStateV0(seal, { nowMs });
  const schedule = evaluateSealerScheduleV0(s, nowMs, {
    forceDrain: opts.forceDrain,
    walIngressSealing: opts.walIngressSealing
  });
  s = { ...s, scheduler: schedule.scheduler };

  const inflationStatus = schedule.inflationStatus;
  const shouldDrain = opts.forceDrain === true || schedule.shouldDrain;

  let processed = 0;
  let sealed = 0;
  let passes = 0;
  const maxPasses = Math.max(1, Math.floor(Number(opts.maxDrainPasses) || 1));

  if (shouldDrain && s.sealQueue.length > 0) {
    s = { ...s, sealQueue: sortSealQueueByPriorityV0(s.sealQueue) };
    while (passes < maxPasses && s.sealQueue.length > 0) {
      const r = drainRealitySealQueueV0(s, nowMs);
      s = r.seal;
      processed += r.processed;
      sealed += r.sealed;
      passes += 1;
      const postInflation = evaluateEpochBumpPolicyV0(s);
      if (postInflation === "critical" && EPOCH_BUMP_POLICY_V0.holdOnCriticalInflation) {
        break;
      }
      const nextSched = evaluateSealerScheduleV0(s, nowMs, { forceDrain: false });
      if (!nextSched.shouldDrain) break;
      s = { ...s, scheduler: nextSched.scheduler };
    }
  }

  s = {
    ...s,
    scheduler: stampSchedulerAfterDrainV0(s, nowMs, sealed > 0)
  };

  const witness = buildRealitySealReplayWitnessV0(s);
  return {
    seal: s,
    processed,
    sealed,
    passes,
    policyHold: !shouldDrain && s.sealQueue.length > 0,
    inflationStatus,
    scheduleReason: schedule.reason,
    witness
  };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {{ ok: boolean, reason?: string }}
 */
export function persistRealitySealV0(seal) {
  if (!persistEnabled()) return { ok: false, reason: "persist_disabled" };
  if (typeof window === "undefined" || !window.localStorage) {
    return { ok: false, reason: "no_local_storage" };
  }
  const s = createDefaultRealitySealLayerStateV0(seal);
  const witness = buildRealitySealReplayWitnessV0(s);
  const payload = {
    schema: REALITY_SEAL_DISK_KEY_V0,
    savedAtMs: Date.now(),
    realitySeal: {
      realityEpoch: s.realityEpoch,
      sealHashHead: s.sealHashHead,
      auditTrail: s.auditTrail,
      budget: s.budget,
      streamSeq: s.streamSeq,
      intentSeq: s.intentSeq,
      sealQueue: s.sealQueue,
      scheduler: s.scheduler
    },
    witness
  };
  try {
    window.localStorage.setItem(REALITY_SEAL_DISK_KEY_V0, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, reason: "write_failed" };
  }
}

/**
 * @returns {import("../../studio/types/rskOntology.js").RealitySealLayerState | null}
 */
export function hydrateRealitySealFromDiskV0() {
  const boot = resolveBootRealitySealFromDiskV0();
  return boot.seal;
}

/**
 * Studio kernel adapter — single write path for `realitySeal` after sealer drain.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ nowMs?: number, persist?: boolean, forceDrain?: boolean, walIngressSealing?: boolean }} [opts]
 */
export function tickRealitySealerOnKernelV0(getState, setState, opts = {}) {
  const kernel = getState();
  const tick = runCanonicalRealitySealerTickV0(kernel.realitySeal, {
    nowMs: opts.nowMs,
    forceDrain: opts.forceDrain,
    walIngressSealing: opts.walIngressSealing,
    maxDrainPasses: opts.maxDrainPasses
  });
  if (tick.seal !== kernel.realitySeal) {
    setState({ ...kernel, realitySeal: tick.seal });
  }
  let persisted = false;
  if (opts.persist === true && tick.sealed > 0) {
    const p = persistRealitySealV0(tick.seal);
    persisted = p.ok;
  }

  let postSeal = { applied: false };
  if (tick.sealed > 0) {
    postSeal = maybeApplyPostSealBridgeOnKernelV0(getState, setState, {
      sealed: tick.sealed,
      seal: getState().realitySeal,
      roomScope: opts.roomScope
    });
    maybeRecordDrainContinuitySegmentV0({
      sealed: tick.sealed,
      seal: getState().realitySeal,
      witness: tick.witness
    });
    import("./continuity/temporalOntologicalWatchdogV0.js")
      .then((m) => m.maybeRunOntologicalWatchdogAfterSealerDrainV0?.())
      .catch(() => {});
  }

  return { ...tick, persisted, postSeal };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {Record<string, unknown>}
 */
export function buildRealitySealerRuntimeSnapshotV0(seal) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  const schedule = evaluateSealerScheduleV0(s, Date.now());
  return {
    schema: REALITY_SEALER_RUNTIME_SCHEMA_V0,
    invariant: CANONICAL_REALITY_AUTHORITY_INVARIANT_V0,
    epochBumpPolicy: EPOCH_BUMP_POLICY_V0,
    ts: Date.now(),
    schedule,
    core: buildRealitySealingCoreSnapshotV0(s),
    witness: buildRealitySealReplayWitnessV0(s),
    persistEnabled: persistEnabled()
  };
}
