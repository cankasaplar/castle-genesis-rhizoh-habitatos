/**
 * Production Deployment Runbook v0 — pre-deploy gates, safe activation, rollback, monitoring.
 * Deploy = first sustained real-world coherence test of the system organism.
 * @see docs/RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md
 */

import {
  deriveOrganismHeartbeatV0,
  ORGANISM_HEARTBEAT_GRID_MS_V0
} from "./rhizohOrganismHeartbeatV0.js";
import { ORGANISM_JITTER_TOLERANCE_MS_V0 } from "./rhizohOrganismStabilizationV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import {
  initRhizohWorldWalPersistenceV0,
  persistWorldWalEntryV0,
  readWalPersistenceStatusV0
} from "./rhizohWorldWalPersistenceV0.js";
import {
  foldWorldWalEntryHashV0,
  publishWorldIdentityV0,
  readWorldIdentityV0
} from "./rhizohWorldIdentityV0.js";
import { WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import {
  replaceWorldActionLogFromEntriesV0,
  listWorldActionLogEntriesV0,
  getLastWorldActionLogEntryV0
} from "./rhizohWorldActionLogV0.js";
import {
  runWorldIdentityConsistencyHarnessAsyncV0,
  readLastIdentityConsistencyReportV0,
  snapshotLiveWorldForConsistencyV0,
  ICL_DRIFT_CLASS_V0
} from "./rhizohIdentityConsistencyLayerV0.js";
import { PERCEPTION_DRIFT_CLASS_V0 } from "./rhizohCastleCoherenceHardeningV0.js";
import { tickMultiInhabitantCoPresenceV0 } from "./rhizohMultiInhabitantCoPresenceV0.js";
import { readProductionRhythmStressReportV0 } from "./rhizohProductionRhythmStressTestV0.js";

export const PRODUCTION_DEPLOY_RUNBOOK_SCHEMA_V0 =
  "castle.rhizoh.production_deployment_runbook.v0";

export const RHIZOH_PRODUCTION_DEPLOY_EVENT_V0 = "rhizoh:production-deploy-v0";

export const DEPLOY_ANOMALY_V0 = Object.freeze({
  A1_IDENTITY_FRACTURE: "A1_identity_fracture",
  A2_RHYTHM_DECAY: "A2_rhythm_decay",
  A3_PERCEPTION_BLEED: "A3_perception_bleed",
  A4_CASTLE_SPLIT: "A4_castle_split",
  A5_WAL_DESYNC: "A5_wal_desync"
});

export const DEPLOY_SEVERITY_V0 = Object.freeze({
  SEV0: "SEV0",
  SEV1: "SEV1",
  SEV2: "SEV2",
  SEV3: "SEV3"
});

export const DEPLOY_ANOMALY_TIER_V0 = Object.freeze({
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info"
});

export const POST_DEPLOY_OBSERVATION_MS_V0 = 60_000;

/** Max heartbeat phase drift (0–1 scale) for pre-deploy gate. */
export const DEPLOY_HEARTBEAT_PHASE_DRIFT_MAX_V0 = 0.08;

/** Rhythm decay threshold (ms) for live anomaly A2. */
export const DEPLOY_RHYTHM_DECAY_JITTER_MS_V0 = 120;

/** Rhythm decay phase threshold for live anomaly A2. */
export const DEPLOY_RHYTHM_DECAY_PHASE_V0 = 0.2;

/** @type {ReturnType<typeof setInterval> | null} */
let heartbeatTimer = null;

/** @type {number | null} */
let lastHeartbeatPhase01 = null;

/** @type {ReturnType<typeof setInterval> | null} */
let postDeployObserverTimer = null;

/** @type {object[]} */
let postDeploySamples = [];

/** @type {number | null} */
let postDeployStartedAtMs = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

function publishDeployStateV0(patch) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.productionDeploy = Object.freeze({
    ...(window.__rhizoh.productionDeploy || {}),
    ...patch,
    atMs: Date.now()
  });
}

/**
 * Sync WAL persistence + ICL harness before gate evaluation (browser / staging).
 * @param {{ persistLastWal?: boolean }} [opts]
 */
export async function refreshIdentityConsistencyForDeployGateV0(opts = {}) {
  if (opts.persistLastWal !== false) {
    const entry = getLastWorldActionLogEntryV0();
    if (entry?.entry_id) {
      await persistWorldWalEntryV0(entry);
    }
  }
  const live = snapshotLiveWorldForConsistencyV0();
  return runWorldIdentityConsistencyHarnessAsyncV0({
    liveSnapshot: live,
    restoreLive: true
  });
}

/**
 * Prime rhythm stress + ICL alignment for pre-deploy gate bundle.
 * @param {{ stressTicks?: number, startMs?: number }} [opts]
 */
export async function primeProductionDeployReadinessV0(opts = {}) {
  const { runProductionRhythmStressTestV0 } = await import(
    "./rhizohProductionRhythmStressTestV0.js"
  );
  runProductionRhythmStressTestV0({
    ticks: opts.stressTicks ?? 48,
    startMs: opts.startMs ?? 1_700_000_200_000
  });
  await refreshIdentityConsistencyForDeployGateV0();
  return evaluatePreDeployGatesV0();
}

/**
 * @param {object} [opts]
 */
export function evaluateRhythmStabilityGateV0(opts = {}) {
  const rh = readRhizohV0();
  const stress = opts.stressReport || rh.productionRhythmStressTest || readProductionRhythmStressReportV0();
  const deployGate = rh.deployRhythmGate;
  const summary = stress?.summary || {};
  const jitterValues = (stress?.jitter_graph || []).map((g) => g.jitter_ms);
  const jitterAvg =
    jitterValues.length > 0
      ? jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length
      : rh.organismRhythm?.max_jitter_ms ?? 0;

  const heartbeat = rh.organismHeartbeat;
  const phase01 = Number(heartbeat?.phase01);
  let phaseDrift = 0;
  if (Number.isFinite(lastHeartbeatPhase01) && Number.isFinite(phase01)) {
    phaseDrift = Math.abs(phase01 - lastHeartbeatPhase01);
  }
  if (Number.isFinite(phase01)) lastHeartbeatPhase01 = phase01;

  const petLockRate = summary.pet_lock_rate ?? 1;
  const studioOkRate = summary.studio_ok_rate ?? (rh.organismRhythm?.ok ? 1 : 0);
  const jitterMs =
    summary.jitter_max_ms ?? rh.organismRhythm?.max_jitter_ms ?? jitterAvg;
  const icl = readLastIdentityConsistencyReportV0();
  const iclIdentityOk = icl?.equivalence?.identity_ok === true;
  const walChainOk = icl?.equivalence?.chain_ok === true;

  const ok =
    (deployGate?.deploy_ready === true || stress?.deploy_ready === true) &&
    jitterMs <= ORGANISM_JITTER_TOLERANCE_MS_V0 &&
    phaseDrift < DEPLOY_HEARTBEAT_PHASE_DRIFT_MAX_V0 &&
    petLockRate >= 0.99 &&
    studioOkRate >= 0.99 &&
    iclIdentityOk &&
    walChainOk;

  return Object.freeze({
    ok,
    deploy_ready: deployGate?.deploy_ready === true || stress?.deploy_ready === true,
    jitter_ms: jitterMs,
    jitter_avg_ms: jitterAvg,
    heartbeat_phase_drift: phaseDrift,
    pet_continuity: petLockRate,
    pet_motion_lock_rate: petLockRate,
    studio_tick_ok: studioOkRate,
    studio_loop_consistency: studioOkRate,
    icl_identity_ok: iclIdentityOk,
    wal_chain_ok: walChainOk
  });
}

/**
 * @param {object} [opts]
 */
export function evaluateIdentityConsistencyGateV0(opts = {}) {
  const icl = opts.iclReport || readLastIdentityConsistencyReportV0();
  const eq = icl?.equivalence;

  const ok =
    eq?.same_world === true &&
    eq?.chain_ok === true &&
    eq?.identity_ok === true &&
    eq?.live_matches_wal === true &&
    eq?.replay_matches_wal === true;

  return Object.freeze({
    ok,
    same_world: eq?.same_world === true,
    chain_ok: eq?.chain_ok === true,
    identity_ok: eq?.identity_ok === true,
    live_matches_wal: eq?.live_matches_wal === true,
    replay_matches_wal: eq?.replay_matches_wal === true,
    drift_class: icl?.drift?.drift_class || null
  });
}

/**
 * SCR + Castle projection lock gate.
 * @param {object} [opts]
 */
export function evaluateCoherenceGateV0(opts = {}) {
  const rh = readRhizohV0();
  const lock = opts.lock || rh.castleCoherenceLock;
  const hardening = opts.hardening || rh.castleCoherenceHardening;
  const drift = lock?.perception_drift_class || hardening?.perception?.drift_class || "none";
  const projectionLocked =
    lock?.projection_locked === true ||
    lock?.perception_locked === true ||
    hardening?.lock?.perception_locked === true;

  const forkRisk = drift === PERCEPTION_DRIFT_CLASS_V0.FORK_RISK;
  const agentBleed = drift === PERCEPTION_DRIFT_CLASS_V0.AGENT_PROJECTION_BLEED;
  const surfaceSplit = drift === PERCEPTION_DRIFT_CLASS_V0.CASTLE_SURFACE_SPLIT;

  return Object.freeze({
    ok: projectionLocked && !forkRisk && !surfaceSplit,
    projection_locked: projectionLocked,
    fork_risk: forkRisk,
    agent_projection_bleed: agentBleed,
    castle_surface_split: surfaceSplit,
    perception_drift_class: drift,
    lock_ok: lock?.ok !== false
  });
}

/**
 * Agent / Pet / SCR boundary safety gate.
 * @param {object} [opts]
 */
export function evaluateSafetyBoundaryGateV0(opts = {}) {
  const rh = readRhizohV0();
  const coPresence = opts.coPresence || rh.coPresence;
  const pet = rh.petCitizen;
  const agents = (coPresence?.inhabitants || []).filter((i) => i.kind === "agent");

  const agentOrigination = agents.some(
    (a) => a.originate_world_state === true || a.mcib_origin === true
  );
  const scrBypass =
    agents.some((a) => a.scr_bypass === true) ||
    rh.scrBypass === true ||
    rh.scr_bypass === true;
  const petOwnsState = pet?.owns_state === true;

  return Object.freeze({
    ok: !agentOrigination && !scrBypass && !petOwnsState,
    agent_origination: agentOrigination,
    scr_bypass: scrBypass,
    pet_owns_state: petOwnsState
  });
}

/**
 * @deprecated use evaluateCoherenceGateV0
 */
export function evaluateCoherenceHardeningGateV0(opts = {}) {
  const gate = evaluateCoherenceGateV0(opts);
  return Object.freeze({
    ok: gate.ok,
    fork_risk: gate.fork_risk,
    agent_projection_bleed: gate.agent_projection_bleed,
    castle_surface_split: gate.castle_surface_split,
    perception_drift_class: gate.perception_drift_class,
    lock_ok: gate.lock_ok
  });
}

/**
 * @param {object} [opts]
 */
export function evaluateOrganismStabilityGateV0(opts = {}) {
  const rh = readRhizohV0();
  const rhythm = opts.rhythm || rh.organismRhythm;
  const stab = rh.organismStabilization;

  const maxJitter = rhythm?.max_jitter_ms ?? stab?.rhythm?.max_jitter_ms ?? 0;
  const ok = rhythm?.ok === true && maxJitter <= ORGANISM_JITTER_TOLERANCE_MS_V0;

  return Object.freeze({
    ok,
    max_jitter_ms: maxJitter,
    cross_layer_drift_stable: stab?.rhythm?.ok !== false,
    heartbeat_alignment_stable: Boolean(rhythm?.heartbeat_index != null)
  });
}

/**
 * Pre-deploy hard-stop gates (all required).
 * @param {object} [opts]
 */
export function evaluatePreDeployGatesV0(opts = {}) {
  const rhythm = evaluateRhythmStabilityGateV0(opts);
  const identity = evaluateIdentityConsistencyGateV0(opts);
  const coherence = evaluateCoherenceGateV0(opts);
  const safety = evaluateSafetyBoundaryGateV0(opts);
  const organism = evaluateOrganismStabilityGateV0(opts);

  const ok = rhythm.ok && identity.ok && coherence.ok && safety.ok && organism.ok;

  const report = Object.freeze({
    schema: PRODUCTION_DEPLOY_RUNBOOK_SCHEMA_V0,
    atMs: Date.now(),
    deploy_ready: ok,
    ok,
    deploy_forbidden: !identity.ok,
    gates: Object.freeze({
      rhythm_gate: rhythm,
      identity_gate: identity,
      coherence_gate: coherence,
      safety_gate: safety,
      organism_stability: organism,
      rhythm_stability: rhythm,
      identity_consistency: identity,
      coherence_hardening: coherence
    })
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.preDeployGates = report;
    window.__rhizoh.deployRhythmGate = Object.freeze({
      ...(window.__rhizoh.deployRhythmGate || {}),
      ok: rhythm.deploy_ready,
      deploy_ready: ok,
      pre_deploy_all_gates: ok,
      atMs: report.atMs
    });
  }

  return report;
}

/**
 * Lock world_id · chain_head · active coherence at deploy boundary.
 */
export function captureWorldIdentitySnapshotV0() {
  const identity = readWorldIdentityV0();
  const frame = readLastT0PresenceFrameV0();
  const rh = readRhizohV0();

  const snapshot = Object.freeze({
    schema: "castle.rhizoh.production_identity_snapshot.v0",
    atMs: Date.now(),
    world_identity_id: identity?.world_identity_id || null,
    chain_head_hash: identity?.chain_head_hash || null,
    active_coherence_id: frame?.coherenceId || rh.worldEpisode?.coherence_id || null,
    identity_version: identity?.identity_version ?? null,
    last_entry_id: identity?.last_entry_id || rh.worldEpisode?.wal_entry_id || null,
    last_episode_seq: identity?.last_episode_seq ?? rh.worldEpisode?.current_seq ?? null
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.productionDeployIdentitySnapshot = snapshot;
    window.__rhizoh.lastValidIdentitySnapshot = snapshot;
  }

  return snapshot;
}

export function readLastValidIdentitySnapshotV0() {
  const rh = readRhizohV0();
  return rh.lastValidIdentitySnapshot || rh.productionDeployIdentitySnapshot || null;
}

/**
 * @param {{ mode?: string, interval?: boolean }} [opts]
 */
export function startOrganismHeartbeatV0(opts = {}) {
  const mode = opts.mode || "production";
  const frame = readLastT0PresenceFrameV0();
  const heartbeat = deriveOrganismHeartbeatV0(frame);

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.organismHeartbeat = heartbeat;
  }

  stopOrganismHeartbeatV0();
  if (mode === "production" && opts.interval !== false) {
    heartbeatTimer = setInterval(() => {
      const hb = deriveOrganismHeartbeatV0(readLastT0PresenceFrameV0());
      if (typeof window !== "undefined") {
        window.__rhizoh.organismHeartbeat = hb;
      }
    }, ORGANISM_HEARTBEAT_GRID_MS_V0);
  }

  publishDeployStateV0({
    mode,
    heartbeat_active: true,
    heartbeat_mode: mode,
    grid_ms: ORGANISM_HEARTBEAT_GRID_MS_V0
  });

  return heartbeat;
}

export function stopOrganismHeartbeatV0() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  publishDeployStateV0({ heartbeat_active: false });
}

/**
 * @param {object} [ctx]
 */
export function enableCastleCoPresenceSurfaceV0(ctx = {}) {
  tickMultiInhabitantCoPresenceV0(ctx);
  publishDeployStateV0({
    co_presence_surface_enabled: true,
    co_presence_ok: readRhizohV0().coPresence?.ok !== false
  });
  return readRhizohV0().coPresence || null;
}

/**
 * @param {{ mode?: string }} [opts]
 */
export async function startWorldWalPersistenceV0(opts = {}) {
  const mode = opts.mode || "append-only";
  await initRhizohWorldWalPersistenceV0();
  const status = readWalPersistenceStatusV0();
  publishDeployStateV0({
    wal_persistence_enabled: true,
    wal_mode: mode,
    wal_durable: status.durable === true
  });
  return status;
}

export function freezeWorldWriteV0(reason = "manual_freeze") {
  if (typeof window === "undefined") return Object.freeze({ frozen: false });
  window.__rhizoh = window.__rhizoh || {};
  const state = Object.freeze({
    frozen: true,
    reason: String(reason || "manual_freeze"),
    atMs: Date.now()
  });
  window.__rhizoh.worldWriteFreeze = state;
  publishDeployStateV0({ writes_frozen: true, freeze_reason: state.reason });
  return state;
}

export function unfreezeWorldWriteV0() {
  if (typeof window === "undefined") return Object.freeze({ frozen: false });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldWriteFreeze = Object.freeze({ frozen: false, atMs: Date.now() });
  publishDeployStateV0({ writes_frozen: false });
  return window.__rhizoh.worldWriteFreeze;
}

export function isWorldWriteFrozenV0() {
  return readRhizohV0().worldWriteFreeze?.frozen === true;
}

/**
 * Restore hot WAL ring to last valid chain head (rollback).
 * @param {{ chain_head_hash?: string, last_entry_id?: string } | null} [snapshot]
 */
export async function restoreWorldFromWalSnapshotV0(snapshot) {
  const snap = snapshot || readLastValidIdentitySnapshotV0();
  if (!snap?.chain_head_hash) {
    return Object.freeze({ ok: false, code: "snapshot_missing" });
  }

  freezeWorldWriteV0("rollback_restore");

  const targetHead = snap.chain_head_hash;
  const targetEntryId = snap.last_entry_id || null;

  let entries = listWorldActionLogEntriesV0(256);
  if (!entries.length) {
    const { listRecentWorldWalEntriesFromIdbV0 } = await import("./rhizohWorldActionLogIdbV0.js");
    entries = await listRecentWorldWalEntriesFromIdbV0(256);
  }

  const sorted = [...entries].sort((a, b) => a.episode_seq - b.episode_seq);
  /** @type {typeof sorted} */
  const restored = [];
  let head = WAL_HASH_CHAIN_GENESIS_V0;

  for (const entry of sorted) {
    head = foldWorldWalEntryHashV0(entry, head);
    restored.push(
      Object.freeze({
        ...entry,
        identity_link: Object.freeze({
          chain_head_hash: head,
          world_identity_id: snap.world_identity_id,
          identity_version: snap.identity_version
        })
      })
    );
    if (head === targetHead || (targetEntryId && entry.entry_id === targetEntryId)) {
      break;
    }
  }

  if (!restored.length || head !== targetHead) {
    return Object.freeze({ ok: false, code: "chain_restore_mismatch", head, targetHead });
  }

  const last = restored[restored.length - 1];
  replaceWorldActionLogFromEntriesV0(restored, {
    last_entry_id: last.entry_id,
    last_episode_seq: last.episode_seq,
    chain_head_hash: targetHead,
    world_identity_id: snap.world_identity_id,
    identity_version: snap.identity_version
  });

  publishWorldIdentityV0(
    Object.freeze({
      schema: "castle.rhizoh.world_identity.v0",
      world_identity_id: snap.world_identity_id,
      identity_version: snap.identity_version ?? restored.length,
      chain_head_hash: targetHead,
      last_entry_id: last.entry_id,
      last_episode_seq: last.episode_seq,
      last_coherence_id: snap.active_coherence_id,
      experiential_now_id: null,
      atMs: Date.now()
    })
  );

  return Object.freeze({
    ok: true,
    code: "restored",
    entry_count: restored.length,
    chain_head_hash: targetHead,
    last_entry_id: last.entry_id,
    restored_at_ms: last.atMs
  });
}

/**
 * Restore world state at a stable timestamp (logical rollback anchor).
 * @param {number} lastStableMs
 */
export async function restoreWorldStateAtMsV0(lastStableMs) {
  const targetMs = Number(lastStableMs);
  if (!Number.isFinite(targetMs)) {
    return Object.freeze({ ok: false, code: "invalid_timestamp" });
  }

  let entries = listWorldActionLogEntriesV0(256);
  if (!entries.length) {
    const { listRecentWorldWalEntriesFromIdbV0 } = await import("./rhizohWorldActionLogIdbV0.js");
    entries = await listRecentWorldWalEntriesFromIdbV0(256);
  }

  const sorted = [...entries].sort((a, b) => a.episode_seq - b.episode_seq);
  let anchor = sorted[0] || null;
  for (const entry of sorted) {
    if (Number(entry.atMs) <= targetMs) anchor = entry;
    else break;
  }

  if (!anchor) {
    return Object.freeze({ ok: false, code: "anchor_not_found", lastStableMs: targetMs });
  }

  let head = WAL_HASH_CHAIN_GENESIS_V0;
  const restored = [];
  for (const entry of sorted) {
    head = foldWorldWalEntryHashV0(entry, head);
    restored.push(entry);
    if (entry.entry_id === anchor.entry_id) break;
  }

  const identity = readWorldIdentityV0();
  const snapshot = Object.freeze({
    schema: "castle.rhizoh.production_identity_snapshot.v0",
    atMs: Date.now(),
    world_identity_id: identity?.world_identity_id || null,
    chain_head_hash: head,
    active_coherence_id: anchor.t0_frame?.coherenceId || anchor.stream_coherence_id || null,
    identity_version: restored.length,
    last_entry_id: anchor.entry_id,
    last_episode_seq: anchor.episode_seq,
    restored_at_ms: targetMs
  });

  return restoreWorldFromWalSnapshotV0(snapshot);
}

export function enableEmergencyModeV0(reason = "manual") {
  if (typeof window === "undefined") return Object.freeze({ active: false });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.emergencyMode = true;
  publishDeployStateV0({
    emergency_mode: true,
    emergency_reason: String(reason),
    castle_projection_enabled: false,
    scr_ticks_frozen: true,
    studio_read_only: true,
    pet_static: true
  });
  freezeWorldWriteV0("emergency_mode");
  stopOrganismHeartbeatV0();
  return Object.freeze({ active: true, reason, atMs: Date.now() });
}

export function disableEmergencyModeV0() {
  if (typeof window === "undefined") return Object.freeze({ active: false });
  window.__rhizoh.emergencyMode = false;
  publishDeployStateV0({
    emergency_mode: false,
    scr_ticks_frozen: false,
    studio_read_only: false,
    pet_static: false
  });
  return Object.freeze({ active: false, atMs: Date.now() });
}

/**
 * Final deploy success condition snapshot.
 */
export function evaluateDeploySuccessConditionV0() {
  const rh = readRhizohV0();
  const icl = rh.worldIdentityConsistency;
  const pet = rh.petCitizen;
  const rhythm = rh.organismRhythm;
  const castle = rh.castleCoherenceLock;
  const stress = rh.productionRhythmStressTest;

  const sameWorld = icl?.equivalence?.same_world === true;
  const petInhabited = pet?.inhabited === true;
  const scrStable = rhythm?.ok === true && (rhythm?.max_jitter_ms ?? 0) <= ORGANISM_JITTER_TOLERANCE_MS_V0;
  const walChainOk = icl?.equivalence?.chain_ok === true;
  const castleProjectionLocked =
    castle?.projection_locked === true || castle?.perception_locked === true;
  const studioLoopOk = (stress?.summary?.studio_ok_rate ?? 1) >= 0.99;

  const ok =
    sameWorld &&
    petInhabited &&
    scrStable &&
    walChainOk &&
    castleProjectionLocked &&
    studioLoopOk;

  const report = Object.freeze({
    schema: "castle.rhizoh.deploy_success_condition.v0",
    atMs: Date.now(),
    ok,
    same_world: sameWorld,
    pet_inhabited: petInhabited,
    scr_stable: scrStable,
    wal_chain_ok: walChainOk,
    castle_projection_locked: castleProjectionLocked,
    studio_loop_ok: studioLoopOk
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.deploySuccessCondition = report;
  }

  return report;
}

/**
 * Evaluate 60-second post-deploy observation window (sync snapshot).
 */
export function evaluatePostDeployWindowV0() {
  const elapsed =
    postDeployStartedAtMs != null ? Date.now() - postDeployStartedAtMs : POST_DEPLOY_OBSERVATION_MS_V0;
  const complete = elapsed >= POST_DEPLOY_OBSERVATION_MS_V0;
  const success = evaluateDeploySuccessConditionV0();
  const anomalies = detectProductionAnomaliesV0();
  const heartbeat = readRhizohV0().organismHeartbeat;

  const report = Object.freeze({
    schema: "castle.rhizoh.post_deploy_window.v0",
    atMs: Date.now(),
    elapsed_ms: elapsed,
    window_ms: POST_DEPLOY_OBSERVATION_MS_V0,
    complete,
    stabilized: complete && success.ok && anomalies.ok,
    samples: Object.freeze(postDeploySamples.slice(-64)),
    success,
    anomalies,
    organism_heartbeat_stable: Boolean(heartbeat?.heartbeat_index != null && success.scr_stable)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.postDeployWindow = report;
  }

  return report;
}

/**
 * Start 60s live observation after edge deploy (browser).
 * @param {{ onComplete?: (report: ReturnType<typeof evaluatePostDeployWindowV0>) => void }} [opts]
 */
export function startPostDeployObservationV0(opts = {}) {
  stopPostDeployObservationV0();
  postDeploySamples = [];
  postDeployStartedAtMs = Date.now();

  postDeployObserverTimer = setInterval(() => {
    publishProductionLiveMonitorV0();
    postDeploySamples.push(
      Object.freeze({
        atMs: Date.now(),
        monitor: readProductionLiveMonitorV0()
      })
    );
    const report = evaluatePostDeployWindowV0();
    if (report.complete) {
      stopPostDeployObservationV0();
      if (typeof opts.onComplete === "function") opts.onComplete(report);
    }
  }, 1000);

  publishDeployStateV0({ post_deploy_observation_active: true, post_deploy_started_at_ms: postDeployStartedAtMs });
  return evaluatePostDeployWindowV0();
}

export function stopPostDeployObservationV0() {
  if (postDeployObserverTimer) {
    clearInterval(postDeployObserverTimer);
    postDeployObserverTimer = null;
  }
  publishDeployStateV0({ post_deploy_observation_active: false });
}

/**
 * Core live observability object — SSOT: window.__rhizoh.liveMonitor
 * @param {object} [opts]
 */
export function publishProductionLiveMonitorV0(opts = {}) {
  const rh = readRhizohV0();
  const icl = rh.worldIdentityConsistency;
  const rhythm = rh.organismRhythm;
  const heartbeat = rh.organismHeartbeat;
  const pet = rh.petCitizen;
  const castle = rh.castleCoherenceLock;
  const stress = rh.productionRhythmStressTest;
  const organism = rh.studioProductionOrganism;
  const frame = rh.presenceFrame || readLastT0PresenceFrameV0();

  const monitor = Object.freeze({
    schema: "castle.rhizoh.live_monitor.v0",
    atMs: Date.now(),
    rhythm: Object.freeze({
      phase01: heartbeat?.phase01 ?? null,
      ok: rhythm?.ok === true,
      max_jitter_ms: rhythm?.max_jitter_ms ?? null,
      heartbeat_index: heartbeat?.heartbeat_index ?? rhythm?.heartbeat_index ?? null
    }),
    identity: Object.freeze({
      same_world: icl?.equivalence?.same_world,
      drift_class: icl?.drift?.drift_class || null,
      structural: icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.STRUCTURAL,
      identity_break: icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.IDENTITY_BREAK,
      chain_ok: icl?.equivalence?.chain_ok
    }),
    scr: Object.freeze({
      tick_seq: frame?.tickSeq ?? null,
      coherence_id: frame?.coherenceId ?? null,
      drift_trace: Object.freeze((stress?.drift_trace || []).slice(-16)),
      latency_ms: rhythm?.max_jitter_ms ?? null,
      tick_rate_ok: rhythm?.ok === true
    }),
    pet: Object.freeze({
      inhabited: pet?.inhabited === true,
      continuity: stress?.summary?.pet_lock_rate ?? null,
      motion_frame_lock: Boolean(pet?.motion_frame_lock),
      owns_state: pet?.owns_state === false
    }),
    castle: Object.freeze({
      projection_locked:
        castle?.projection_locked === true || castle?.perception_locked === true,
      castle_surface_split:
        castle?.perception_drift_class === PERCEPTION_DRIFT_CLASS_V0.CASTLE_SURFACE_SPLIT,
      fork_risk: castle?.perception_drift_class === PERCEPTION_DRIFT_CLASS_V0.FORK_RISK
    }),
    studio: Object.freeze({
      loop_ok: Boolean(rh.productionDeploy?.studio_loop_enabled !== false && organism),
      tick_rate_ok: stress?.summary?.studio_ok_rate ?? null,
      production_organism_ok: Boolean(organism?.unity)
    }),
    emergency_mode: rh.emergencyMode === true,
    anomalies: detectProductionAnomaliesV0(opts).anomalies
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.liveMonitor = monitor;
    window.__rhizoh.productionMonitoring = monitor;
  }

  return monitor;
}

export function readProductionLiveMonitorV0() {
  return readRhizohV0().liveMonitor || publishProductionLiveMonitorV0();
}

/**
 * Live monitoring dashboard aggregate (alias of liveMonitor subset).
 */
export function readProductionMonitoringDashboardV0() {
  const monitor = publishProductionLiveMonitorV0();
  const rh = readRhizohV0();
  const wal = rh.worldWalPersistence;

  return Object.freeze({
    schema: "castle.rhizoh.production_monitoring_dashboard.v0",
    atMs: monitor.atMs,
    identity: monitor.identity,
    rhythm: monitor.rhythm,
    inhabitation: Object.freeze({
      ok: rh.coPresence?.ok,
      pet_present: rh.coPresence?.pet_present,
      agent_latency_ms: rh.coPresence?.agent_rhythm?.agents?.[0]?.perception_latency_ms ?? null,
      user_sync_coherence: rh.coPresence?.coherence_id || null
    }),
    castle: monitor.castle,
    wal: Object.freeze({
      persistence: wal?.persistence,
      durable: wal?.durable,
      chain_head_hash: wal?.chain_head_hash,
      live_matches_wal: rh.worldIdentityConsistency?.equivalence?.live_matches_wal
    }),
    live_monitor: monitor
  });
}

/**
 * Detect system-level anomaly signatures A1–A5.
 * @param {object} [opts]
 */
export function detectProductionAnomaliesV0(opts = {}) {
  const rh = readRhizohV0();
  const icl = opts.iclReport || rh.worldIdentityConsistency;
  const rhythm = rh.organismRhythm;
  const castle = rh.castleCoherenceLock || rh.castleCoherenceHardening;
  const stress = rh.productionRhythmStressTest;
  const heartbeat = rh.organismHeartbeat;

  /** @type {object[]} */
  const anomalies = [];

  const drift = castle?.perception_drift_class || castle?.perception?.drift_class;
  const pet = rh.petCitizen;

  const identityBreak =
    icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.IDENTITY_BREAK ||
    icl?.equivalence?.same_world === false;

  if (identityBreak) {
    anomalies.push(
      Object.freeze({
        code: DEPLOY_ANOMALY_V0.A1_IDENTITY_FRACTURE,
        tier: DEPLOY_ANOMALY_TIER_V0.CRITICAL,
        severity: DEPLOY_SEVERITY_V0.SEV0,
        action: "rollback_immediate"
      })
    );
  }

  if (drift === PERCEPTION_DRIFT_CLASS_V0.FORK_RISK) {
    anomalies.push(
      Object.freeze({
        code: "scr_fork_explosion",
        tier: DEPLOY_ANOMALY_TIER_V0.CRITICAL,
        severity: DEPLOY_SEVERITY_V0.SEV0,
        action: "rollback_immediate"
      })
    );
  }

  if (rh.productionDeploy?.active && pet?.inhabited === false) {
    anomalies.push(
      Object.freeze({
        code: "pet_detachment",
        tier: DEPLOY_ANOMALY_TIER_V0.CRITICAL,
        severity: DEPLOY_SEVERITY_V0.SEV0,
        action: "rollback_immediate"
      })
    );
  }

  const identityFork =
    icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.STRUCTURAL ||
    (stress?.summary?.identity_fork_events ?? 0) > 0;

  if (identityFork && !identityBreak) {
    anomalies.push(
      Object.freeze({
        code: "wal_chain_soft_fork",
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV2,
        action: "icl_reverify"
      })
    );
  }

  if ((stress?.summary?.studio_ok_rate ?? 1) < 0.99 && stress?.summary?.studio_ok_rate != null) {
    anomalies.push(
      Object.freeze({
        code: "studio_tick_drift",
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV2,
        action: "studio_loop_resync"
      })
    );
  }

  if (rh.firstPaintLatencyMs > 3000) {
    anomalies.push(
      Object.freeze({
        code: "first_paint_latency",
        tier: DEPLOY_ANOMALY_TIER_V0.INFO,
        severity: DEPLOY_SEVERITY_V0.SEV3,
        action: "observe"
      })
    );
  }

  const critical = anomalies.filter((a) => a.tier === DEPLOY_ANOMALY_TIER_V0.CRITICAL);

  const phase01 = Number(heartbeat?.phase01);
  const phaseDrift =
    Number.isFinite(lastHeartbeatPhase01) && Number.isFinite(phase01)
      ? Math.abs(phase01 - lastHeartbeatPhase01)
      : 0;

  if (
    (rhythm?.max_jitter_ms ?? 0) > DEPLOY_RHYTHM_DECAY_JITTER_MS_V0 ||
    phaseDrift > DEPLOY_RHYTHM_DECAY_PHASE_V0
  ) {
    anomalies.push(
      Object.freeze({
        code: DEPLOY_ANOMALY_V0.A2_RHYTHM_DECAY,
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV1,
        action: "restart_heartbeat_only"
      })
    );
  }

  if (drift === PERCEPTION_DRIFT_CLASS_V0.AGENT_PROJECTION_BLEED) {
    anomalies.push(
      Object.freeze({
        code: DEPLOY_ANOMALY_V0.A3_PERCEPTION_BLEED,
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV2,
        action: "enforce_interpret_only_reset"
      })
    );
  }

  if (drift === PERCEPTION_DRIFT_CLASS_V0.CASTLE_SURFACE_SPLIT) {
    anomalies.push(
      Object.freeze({
        code: DEPLOY_ANOMALY_V0.A4_CASTLE_SPLIT,
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV2,
        action: "freeze_castle_resync_rsbl_scr"
      })
    );
  }

  if (icl?.equivalence?.live_matches_wal === false) {
    anomalies.push(
      Object.freeze({
        code: DEPLOY_ANOMALY_V0.A5_WAL_DESYNC,
        tier: DEPLOY_ANOMALY_TIER_V0.WARNING,
        severity: DEPLOY_SEVERITY_V0.SEV2,
        action: "replay_validation_patch_commits"
      })
    );
  }

  const report = Object.freeze({
    schema: "castle.rhizoh.production_anomaly_report.v0",
    atMs: Date.now(),
    anomalies: Object.freeze(anomalies),
    ok: critical.length === 0,
    critical_count: critical.length,
    highest_severity: critical[0]?.severity || anomalies[0]?.severity || null,
    auto_rollback: critical.length > 0
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.productionAnomalies = report;
  }

  return report;
}

/**
 * Rollback protocol v0.
 * @param {{ snapshot?: object | null, skipIcl?: boolean }} [opts]
 */
export async function executeProductionRollbackV0(opts = {}) {
  const steps = [];

  steps.push(Object.freeze({ step: 1, action: "freeze_writes", result: freezeWorldWriteV0("rollback") }));
  steps.push(Object.freeze({ step: 2, action: "stop_heartbeat", result: stopOrganismHeartbeatV0() }));

  const restore = await restoreWorldFromWalSnapshotV0(opts.snapshot || null);
  steps.push(Object.freeze({ step: 3, action: "restore_wal_snapshot", result: restore }));

  let icl = null;
  if (!opts.skipIcl && restore.ok) {
    icl = await runWorldIdentityConsistencyHarnessAsyncV0({ restoreLive: false });
    steps.push(Object.freeze({ step: 4, action: "reverify_icl", result: icl }));
  }

  publishDeployStateV0({
    rolled_back: true,
    studio_loop_enabled: false,
    co_presence_surface_enabled: false,
    scr_only: true
  });

  steps.push(
    Object.freeze({
      step: 5,
      action: "restart_scr_only",
      result: Object.freeze({ scr_only: true, studio_disabled: true, castle_disabled: true })
    })
  );

  const report = Object.freeze({
    schema: "castle.rhizoh.production_rollback.v0",
    atMs: Date.now(),
    ok: restore.ok && (icl?.ok !== false || opts.skipIcl),
    steps: Object.freeze(steps)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.productionRollback = report;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_PRODUCTION_DEPLOY_EVENT_V0, {
          detail: Object.freeze({ kind: "rollback", report })
        })
      );
    } catch {
      /* noop */
    }
  }

  return report;
}

/**
 * Safe activation order (5 steps). Hard-stops if pre-deploy gates fail.
 * @param {{
 *   skipGateCheck?: boolean,
 *   studioLoopCtx?: object | null,
 *   runStudioLoop?: (ctx: object) => object | null
 * }} [opts]
 */
export async function executeProductionDeploymentV0(opts = {}) {
  if (!opts.skipGateCheck) {
    const gates = evaluatePreDeployGatesV0();
    if (!gates.ok) {
      return Object.freeze({
        ok: false,
        code: "pre_deploy_gate_failed",
        gates
      });
    }
  }

  const steps = [];

  const snapshot = captureWorldIdentitySnapshotV0();
  steps.push(Object.freeze({ step: 1, action: "capture_identity_snapshot", result: snapshot }));

  const heartbeat = startOrganismHeartbeatV0({ mode: "production" });
  steps.push(Object.freeze({ step: 2, action: "start_organism_heartbeat", result: heartbeat }));

  const coPresence = enableCastleCoPresenceSurfaceV0(opts.studioLoopCtx || {});
  steps.push(Object.freeze({ step: 3, action: "enable_co_presence_surface", result: coPresence }));

  let studioRun = null;
  if (typeof opts.runStudioLoop === "function" && opts.studioLoopCtx) {
    studioRun = opts.runStudioLoop({ ...opts.studioLoopCtx, mode: "production" });
  }
  publishDeployStateV0({ studio_loop_enabled: true, studio_mode: "production" });
  steps.push(Object.freeze({ step: 4, action: "enable_studio_loop", result: studioRun }));

  const wal = await startWorldWalPersistenceV0({ mode: "append-only" });
  steps.push(Object.freeze({ step: 5, action: "enable_wal_persistence", result: wal }));

  const report = Object.freeze({
    schema: "castle.rhizoh.production_deployment.v0",
    atMs: Date.now(),
    ok: true,
    identity_snapshot: snapshot,
    steps: Object.freeze(steps)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh.productionDeployment = report;
    window.__rhizoh.productionDeploy = Object.freeze({
      ...(window.__rhizoh.productionDeploy || {}),
      active: true,
      deployed_at_ms: report.atMs
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_PRODUCTION_DEPLOY_EVENT_V0, {
          detail: Object.freeze({ kind: "deploy", report })
        })
      );
    } catch {
      /* noop */
    }
  }

  return report;
}

export function resetRhizohProductionDeploymentRunbookForTestV0() {
  stopOrganismHeartbeatV0();
  stopPostDeployObservationV0();
  lastHeartbeatPhase01 = null;
  postDeploySamples = [];
  postDeployStartedAtMs = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.productionDeploy;
    delete window.__rhizoh.productionDeployIdentitySnapshot;
    delete window.__rhizoh.lastValidIdentitySnapshot;
    delete window.__rhizoh.preDeployGates;
    delete window.__rhizoh.productionDeployment;
    delete window.__rhizoh.productionRollback;
    delete window.__rhizoh.productionAnomalies;
    delete window.__rhizoh.productionMonitoring;
    delete window.__rhizoh.liveMonitor;
    delete window.__rhizoh.emergencyMode;
    delete window.__rhizoh.postDeployWindow;
    delete window.__rhizoh.deploySuccessCondition;
    delete window.__rhizoh.worldWriteFreeze;
  }
}
