/**
 * Production Rhythm Stress Test v0 — pre-deploy final gate.
 * Load sim: heartbeat jitter graph · SCR→WAL→ICL drift trace · pet continuity · studio consistency.
 * @see docs/RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md
 */

import { buildT0UnifiedPresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "./rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0 } from "./rhizohStudioExecutionLoopV0.js";
import { ORGANISM_HEARTBEAT_GRID_MS_V0 } from "./rhizohOrganismHeartbeatV0.js";
import { ORGANISM_JITTER_TOLERANCE_MS_V0 } from "./rhizohOrganismStabilizationV0.js";
import { ICL_DRIFT_CLASS_V0 } from "./rhizohIdentityConsistencyLayerV0.js";
import { PERCEPTION_DRIFT_CLASS_V0 } from "./rhizohCastleCoherenceHardeningV0.js";

export const PRODUCTION_RHYTHM_STRESS_SCHEMA_V0 =
  "castle.rhizoh.production_rhythm_stress.v0";

export const RHIZOH_PRODUCTION_RHYTHM_STRESS_EVENT_V0 =
  "rhizoh:production-rhythm-stress-v0";

/** ~10 min at 1 tick/heartbeat (compressed wall clock in CI). */
export const PRODUCTION_STRESS_DEFAULT_TICKS_V0 = 600;

/** ~30 min load profile. */
export const PRODUCTION_STRESS_EXTENDED_TICKS_V0 = 1800;

/** @type {ReturnType<typeof runProductionRhythmStressTestV0> | null} */
let lastStressReport = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

function percentileV0(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/**
 * @param {{
 *   ticks?: number,
 *   startMs?: number,
 *   tickIntervalMs?: number,
 *   cognitive?: object,
 *   presence?: object
 * }} [opts]
 */
export function runProductionRhythmStressTestV0(opts = {}) {
  const ticks = Math.max(1, Number(opts.ticks) || PRODUCTION_STRESS_DEFAULT_TICKS_V0);
  const gridMs = Number(opts.tickIntervalMs) || ORGANISM_HEARTBEAT_GRID_MS_V0;
  const startMs = Number(opts.startMs) || 1_700_000_200_000;
  const cognitive =
    opts.cognitive ??
    readRhizohV0().cognitiveAttention ?? {
      attention_inertia: {
        mcib: { causes: [{ id: "stress" }], superposition01: 0.18 },
        ccf: { experiential_now_id: "en_stress", collapse_mode: "singular" }
      }
    };
  const presence =
    opts.presence ??
    readRhizohV0().presenceState ?? {
      rhizoh_is_present: true,
      rhizoh_attention: "focused"
    };

  /** @type {object[]} */
  const jitterGraph = [];
  /** @type {object[]} */
  const driftTrace = [];
  /** @type {object[]} */
  const petContinuity = [];
  /** @type {object[]} */
  const studioTicks = [];

  let jitterFailures = 0;
  let iclDriftEvents = 0;
  let perceptionDriftEvents = 0;
  let studioFailures = 0;
  let petLockMisses = 0;
  let petTicks = 0;
  let coherenceSplits = 0;
  let lastCoherence = null;
  let identityForkEvents = 0;

  const startedAt = Date.now();

  for (let i = 0; i < ticks; i += 1) {
    const nowMs = startMs + i * gridMs;
    const frame = buildT0UnifiedPresenceFrameV0(
      {
        rhizoh_is_present: true,
        silence_form: i % 7 === 0 ? "listening" : "present",
        rhizoh_attention: i % 11 === 0 ? "idle" : "focused"
      },
      {
        orbModulation: { breathe: true, intensity01: 0.55 + (i % 10) * 0.04 },
        transitionFeel: {}
      },
      null,
      nowMs
    );

    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.presenceFrame = frame;
      window.__rhizoh.presenceState = presence;
      window.__rhizoh.cognitiveAttention = cognitive;
    }

    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true, intensity01: frame.breathe01 } },
      cognitive,
      nowMs
    });

    const run = runStudioExecutionLoopV0({ ecc, frame, cognitive, resl: { orbModulation: {} } });
    const rh = readRhizohV0();

    const stab = rh.organismStabilization;
    const jitter = stab?.rhythm?.max_jitter_ms ?? 0;
    const jitterOk = jitter <= ORGANISM_JITTER_TOLERANCE_MS_V0;
    if (!jitterOk) jitterFailures += 1;

    jitterGraph.push(
      Object.freeze({
        tick: i,
        at_ms: nowMs,
        heartbeat_index: stab?.heartbeat?.heartbeat_index ?? null,
        jitter_ms: jitter,
        ok: jitterOk
      })
    );

    const iclDrift = rh.castleCoherenceHardening?.perception?.drift_class;
    const iclReport = rh.worldIdentityConsistency;
    const iclOk =
      (iclReport?.ok !== false && iclDrift !== PERCEPTION_DRIFT_CLASS_V0.IDENTITY_BREAK) ||
      (!iclReport && iclDrift !== PERCEPTION_DRIFT_CLASS_V0.FORK_RISK);

    if (
      iclDrift === PERCEPTION_DRIFT_CLASS_V0.IDENTITY_BREAK ||
      iclDrift === ICL_DRIFT_CLASS_V0.IDENTITY_BREAK
    ) {
      iclDriftEvents += 1;
    }
    if (iclDrift === PERCEPTION_DRIFT_CLASS_V0.FORK_RISK) {
      identityForkEvents += 1;
    }
    if (
      iclDrift &&
      iclDrift !== PERCEPTION_DRIFT_CLASS_V0.NONE &&
      iclDrift !== PERCEPTION_DRIFT_CLASS_V0.CASTLE_SURFACE_SPLIT
    ) {
      perceptionDriftEvents += 1;
    }

    driftTrace.push(
      Object.freeze({
        tick: i,
        scr_coherence_id: frame.coherenceId,
        wal_entry_id: run?.wal_entry_id || null,
        episode_seq: run?.episode_seq ?? null,
        icl_ok: iclOk,
        perception_drift_class: iclDrift || "none",
        castle_lock_ok: rh.castleCoherenceLock?.ok !== false,
        organism_ok: stab?.ok === true
      })
    );

    const coherence = frame.coherenceId;
    if (lastCoherence && coherence && lastCoherence !== coherence) {
      coherenceSplits += 1;
    }
    lastCoherence = coherence;

    const pet = rh.petCitizen;
    if (pet?.inhabited) {
      petTicks += 1;
      const locked = Boolean(pet.motion_frame_lock);
      if (!locked) petLockMisses += 1;
      petContinuity.push(
        Object.freeze({
          tick: i,
          seq: pet.seq ?? null,
          locked,
          heartbeat_index: pet.motion_frame_lock?.heartbeat_index ?? null
        })
      );
    }

    const studioOk = Boolean(run?.wal_entry_id && stab?.ok === true);
    if (!studioOk) studioFailures += 1;

    studioTicks.push(
      Object.freeze({
        tick: i,
        ok: studioOk,
        wal_entry_id: run?.wal_entry_id || null,
        rhythm_ok: rh.organismRhythm?.ok === true
      })
    );
  }

  const jitterValues = jitterGraph.map((g) => g.jitter_ms);
  const jitterP95 = percentileV0(jitterValues, 95);
  const jitterMax = jitterValues.length ? Math.max(...jitterValues) : 0;
  const studioOkRate = ticks > 0 ? (ticks - studioFailures) / ticks : 0;
  const petLockRate = petTicks > 0 ? (petTicks - petLockMisses) / petTicks : 1;

  const gate = Object.freeze({
    jitter_p95_ok: jitterP95 <= ORGANISM_JITTER_TOLERANCE_MS_V0,
    jitter_max_ok: jitterMax <= ORGANISM_JITTER_TOLERANCE_MS_V0 * 2,
    icl_drift_ok: iclDriftEvents === 0,
    perception_drift_ok: perceptionDriftEvents <= Math.max(1, Math.floor(ticks * 0.01)),
    studio_ok_rate_ok: studioOkRate >= 0.99,
    pet_lock_ok: petLockRate >= 0.99,
    identity_fork_ok: identityForkEvents === 0
  });

  const ok = Object.values(gate).every((v) => v === true);

  const simDurationMs = ticks * gridMs;
  const simDurationMin = simDurationMs / 60_000;

  const report = Object.freeze({
    schema: PRODUCTION_RHYTHM_STRESS_SCHEMA_V0,
    atMs: Date.now(),
    wall_duration_ms: Date.now() - startedAt,
    sim_duration_ms: simDurationMs,
    sim_duration_min: simDurationMin,
    ticks,
    tick_interval_ms: gridMs,
    jitter_graph: Object.freeze(jitterGraph.slice(-120)),
    drift_trace: Object.freeze(driftTrace.slice(-120)),
    pet_continuity: Object.freeze(petContinuity.slice(-64)),
    studio_ticks: Object.freeze(studioTicks.slice(-64)),
    summary: Object.freeze({
      jitter_p95_ms: jitterP95,
      jitter_max_ms: jitterMax,
      jitter_failures: jitterFailures,
      icl_drift_events: iclDriftEvents,
      perception_drift_events: perceptionDriftEvents,
      studio_ok_rate: studioOkRate,
      pet_lock_rate: petLockRate,
      pet_ticks: petTicks,
      coherence_splits: coherenceSplits,
      identity_fork_events: identityForkEvents
    }),
    gate,
    ok,
    deploy_ready: ok
  });

  lastStressReport = report;
  publishProductionRhythmStressReportV0(report);
  return report;
}

/**
 * @param {ReturnType<typeof runProductionRhythmStressTestV0>} report
 */
function publishProductionRhythmStressReportV0(report) {
  if (typeof window === "undefined" || !report) return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.productionRhythmStressTest = report;
  window.__rhizoh.productionRhythmStress = report;
  window.__rhizoh.deployRhythmGate = Object.freeze({
    ok: report.ok,
    deploy_ready: report.deploy_ready,
    atMs: report.atMs
  });
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_PRODUCTION_RHYTHM_STRESS_EVENT_V0, {
        detail: Object.freeze({ report })
      })
    );
  } catch {
    /* noop */
  }
}

export function readProductionRhythmStressReportV0() {
  return (
    lastStressReport ||
    (typeof window !== "undefined" ? window.__rhizoh?.productionRhythmStressTest : null) ||
    null
  );
}

export function resetRhizohProductionRhythmStressForTestV0() {
  lastStressReport = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.productionRhythmStressTest;
    delete window.__rhizoh.productionRhythmStress;
    delete window.__rhizoh.deployRhythmGate;
  }
}
