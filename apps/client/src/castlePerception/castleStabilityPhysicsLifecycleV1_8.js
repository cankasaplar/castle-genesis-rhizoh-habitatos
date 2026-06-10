/**
 * Castle Stability Physics Lifecycle v1.8 — decay, re-normalization, persistence, sync.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_8.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import {
  getDefaultPhysicsProfileV1_7,
  getUserPhysicsProfileV1_7,
  MODALITY_V1_7,
  replacePhysicsProfileV1_7,
  TIME_BUCKET_V1_7,
  updatePhysicsProfileV1_7
} from "./castleStabilityMemoryGraphV1_7.js";
import { appendLearningTraceV1_8, LEARNING_TRACE_KIND_V1_8 } from "./castleStabilityLearningTraceV1_8.js";
import { mergePhysicsProfilesV1_9 } from "./castlePhysicsMergeV1_9.js";

export const CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8 = "castle.stability_physics_lifecycle.v1.8";

const DECAY_IDLE_MS_V1_8 = 20 * 60 * 1000;
const DECAY_RATE_V1_8 = 0.08;
const MAX_DEVIATION_V1_8 = 0.28;
const RENORMALIZE_PULL_V1_8 = 0.15;
const STORAGE_KEY_PREFIX_V1_8 = "castle.stability_physics.v1.8";

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function pullTowardV1_8(current, target, rate) {
  return Number((current + (target - current) * rate).toFixed(4));
}

function deviceIdV1_8() {
  if (typeof window === "undefined") return "node_runtime";
  window.__castle = window.__castle || {};
  if (!window.__castle.deviceId) {
    window.__castle.deviceId = `dev_${Math.random().toString(36).slice(2, 10)}`;
  }
  return window.__castle.deviceId;
}

function storageKeyV1_8(ownerId) {
  return `${STORAGE_KEY_PREFIX_V1_8}:${String(ownerId)}`;
}

function decayCurveV1_8(current, defaults, rate) {
  const next = Object.create(null);
  for (const key of Object.keys(defaults)) {
    next[key] = pullTowardV1_8(current[key] ?? defaults[key], defaults[key], rate);
  }
  return Object.freeze(next);
}

function decayModalityGraphV1_8(current, defaults, rate) {
  const next = Object.create(null);
  for (const modality of Object.keys(defaults)) {
    const c = current[modality] || defaults[modality];
    const d = defaults[modality];
    next[modality] = Object.freeze({
      focusBias: pullTowardV1_8(c.focusBias, d.focusBias, rate),
      speechPriority: pullTowardV1_8(c.speechPriority, d.speechPriority, rate),
      memoryPriority: pullTowardV1_8(c.memoryPriority, d.memoryPriority, rate),
      phaseIndex: pullTowardV1_8(c.phaseIndex, d.phaseIndex, rate)
    });
  }
  return Object.freeze(next);
}

export function applyPhysicsDecayV1_8(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  const profile = getUserPhysicsProfileV1_7(key);
  const defaults = getDefaultPhysicsProfileV1_7(key);
  const lastActive = profile.lastActiveAtMs ?? profile.lastDecayAtMs ?? atMs;
  const idleMs = atMs - lastActive;

  if (profile.observationCount === 0 || idleMs < DECAY_IDLE_MS_V1_8) {
    return Object.freeze({
      schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
      decayApplied: false,
      idleMs,
      reason: "not_stale"
    });
  }

  const updated = updatePhysicsProfileV1_7(key, (current) =>
    Object.freeze({
      ...current,
      stabilityPreferenceCurve: decayCurveV1_8(
        current.stabilityPreferenceCurve,
        defaults.stabilityPreferenceCurve,
        DECAY_RATE_V1_8
      ),
      interruptionToleranceMap: decayCurveV1_8(
        current.interruptionToleranceMap,
        defaults.interruptionToleranceMap,
        DECAY_RATE_V1_8
      ),
      modalityBiasGraph: decayModalityGraphV1_8(
        current.modalityBiasGraph,
        defaults.modalityBiasGraph,
        DECAY_RATE_V1_8
      ),
      contextSwitchLatencyProfile: Object.freeze({
        ...current.contextSwitchLatencyProfile,
        overrideRate: pullTowardV1_8(current.contextSwitchLatencyProfile.overrideRate, 0, DECAY_RATE_V1_8)
      }),
      lastDecayAtMs: atMs
    })
  );

  const trace = appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.DECAY,
    reason: "stale_physics_decay_toward_defaults",
    source: "lifecycle",
    deltas: Object.freeze({ idleMs, decayRate: DECAY_RATE_V1_8 })
  });

  logVoiceInfoV0("STABILITY_PHYSICS_DECAY", {
    ownerId: key,
    idleMs,
    decayRate: DECAY_RATE_V1_8,
    observationCount: updated.observationCount
  });

  return Object.freeze({
    schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
    decayApplied: true,
    idleMs,
    trace,
    profile: updated
  });
}

export function renormalizePhysicsProfileV1_8(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  const profile = getUserPhysicsProfileV1_7(key);
  const defaults = getDefaultPhysicsProfileV1_7(key);

  if (profile.observationCount === 0) {
    return Object.freeze({
      schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
      renormalized: false,
      reason: "no_observations"
    });
  }

  let maxDeviation = 0;
  for (const modality of Object.values(MODALITY_V1_7)) {
    const c = profile.modalityBiasGraph[modality];
    const d = defaults.modalityBiasGraph[modality];
    if (!c || !d) continue;
    maxDeviation = Math.max(
      maxDeviation,
      Math.abs(c.speechPriority - d.speechPriority),
      Math.abs(c.phaseIndex - d.phaseIndex)
    );
  }

  if (maxDeviation <= MAX_DEVIATION_V1_8) {
    return Object.freeze({
      schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
      renormalized: false,
      maxDeviation,
      reason: "within_bounds"
    });
  }

  const updated = updatePhysicsProfileV1_7(key, (current) =>
    Object.freeze({
      ...current,
      modalityBiasGraph: decayModalityGraphV1_8(
        current.modalityBiasGraph,
        defaults.modalityBiasGraph,
        RENORMALIZE_PULL_V1_8
      ),
      interruptionToleranceMap: decayCurveV1_8(
        current.interruptionToleranceMap,
        defaults.interruptionToleranceMap,
        RENORMALIZE_PULL_V1_8
      )
    })
  );

  const trace = appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.RENORMALIZE,
    reason: "overfit_guard_pull_toward_defaults",
    source: "lifecycle",
    deltas: Object.freeze({ maxDeviation, pullRate: RENORMALIZE_PULL_V1_8 })
  });

  return Object.freeze({
    schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
    renormalized: true,
    maxDeviation,
    trace,
    profile: updated
  });
}

export function exportPhysicsLifecycleV1_8(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  const profile = getUserPhysicsProfileV1_7(key);
  const envelope = Object.freeze({
    schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
    envelopeVersion: 1,
    ownerId: key,
    deviceId: deviceIdV1_8(),
    exportedAtMs: atMs,
    profile: Object.freeze({
      stabilityPreferenceCurve: profile.stabilityPreferenceCurve,
      interruptionToleranceMap: profile.interruptionToleranceMap,
      modalityBiasGraph: profile.modalityBiasGraph,
      contextSwitchLatencyProfile: profile.contextSwitchLatencyProfile,
      observationCount: profile.observationCount,
      personalityPhysicsActive: profile.personalityPhysicsActive,
      lastActiveAtMs: profile.lastActiveAtMs,
      lastDecayAtMs: profile.lastDecayAtMs
    })
  });

  appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.SYNC_EXPORT,
    reason: "cross_device_physics_export",
    source: "lifecycle",
    deltas: Object.freeze({ observationCount: profile.observationCount })
  });

  return envelope;
}

export function importPhysicsLifecycleV1_8(ownerId, envelope, options = {}) {
  const key = String(ownerId);
  const atMs = Number(options.atMs) || Date.now();
  if (!envelope?.profile) {
    return Object.freeze({
      schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
      imported: false,
      reason: "invalid_envelope"
    });
  }

  const local = getUserPhysicsProfileV1_7(key);
  const remote = envelope.profile;
  const merge = options.merge !== false;

  let mergedProfile;
  if (merge && local.observationCount > 0) {
    const merged = mergePhysicsProfilesV1_9(local, remote, { atMs });
    mergedProfile = updatePhysicsProfileV1_7(key, () => merged.profile);
  } else {
    mergedProfile = replacePhysicsProfileV1_7(key, {
      ...getDefaultPhysicsProfileV1_7(key),
      ...remote,
      ownerId: key,
      personalityPhysicsActive: true,
      lastActiveAtMs: atMs
    });
  }

  const trace = appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.SYNC_IMPORT,
    reason: merge ? "cross_device_physics_merge" : "cross_device_physics_replace",
    source: envelope.deviceId || "remote",
    deltas: Object.freeze({
      remoteObservationCount: remote.observationCount || 0,
      localObservationCount: local.observationCount
    })
  });

  persistPhysicsLifecycleV1_8(key, atMs);

  return Object.freeze({
    schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
    imported: true,
    merge,
    trace,
    profile: mergedProfile
  });
}

export function persistPhysicsLifecycleV1_8(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  if (typeof localStorage === "undefined") {
    return Object.freeze({ persisted: false, reason: "no_storage" });
  }

  try {
    const envelope = exportPhysicsLifecycleV1_8(key, atMs);
    localStorage.setItem(storageKeyV1_8(key), JSON.stringify(envelope));
    appendLearningTraceV1_8(key, {
      atMs,
      kind: LEARNING_TRACE_KIND_V1_8.PERSIST,
      reason: "lifecycle_local_persistence",
      source: "localStorage",
      deltas: Object.freeze({ deviceId: envelope.deviceId })
    });
    return Object.freeze({ persisted: true, ownerId: key });
  } catch {
    return Object.freeze({ persisted: false, reason: "storage_error" });
  }
}

export function loadPhysicsLifecycleV1_8(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  if (typeof localStorage === "undefined") {
    return Object.freeze({ loaded: false, reason: "no_storage" });
  }

  try {
    const raw = localStorage.getItem(storageKeyV1_8(key));
    if (!raw) return Object.freeze({ loaded: false, reason: "missing" });
    const envelope = JSON.parse(raw);
    const result = importPhysicsLifecycleV1_8(key, envelope, { merge: false, atMs });
    return Object.freeze({ loaded: true, ...result });
  } catch {
    return Object.freeze({ loaded: false, reason: "parse_error" });
  }
}

export function runPhysicsLifecycleMaintenanceV1_8(ownerId, atMs = Date.now()) {
  const decay = applyPhysicsDecayV1_8(ownerId, atMs);
  const renormalize = renormalizePhysicsProfileV1_8(ownerId, atMs);
  return Object.freeze({
    schema: CASTLE_STABILITY_PHYSICS_LIFECYCLE_SCHEMA_V1_8,
    decay,
    renormalize
  });
}

/** @internal vitest */
export function __clearPhysicsLifecycleStorageForTestV1_8() {
  if (typeof localStorage === "undefined") return;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX_V1_8)) localStorage.removeItem(key);
  }
}
