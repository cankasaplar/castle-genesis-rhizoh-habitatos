/**
 * Castle Physics Lifecycle Cloud v1.9 — portable lifecycle envelope + reconciliation.
 * Cloud is NEVER truth source — only state reconciliation layer.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import {
  getUserPhysicsProfileV1_7,
  replacePhysicsProfileV1_7,
  updatePhysicsProfileV1_7
} from "./castleStabilityMemoryGraphV1_7.js";
import { getLearningTraceV1_8 } from "./castleStabilityLearningTraceV1_8.js";
import { appendLearningTraceV1_8, LEARNING_TRACE_KIND_V1_8 } from "./castleStabilityLearningTraceV1_8.js";
import { mergePhysicsProfilesV1_9 } from "./castlePhysicsMergeV1_9.js";

export const CASTLE_PHYSICS_LIFECYCLE_CLOUD_SCHEMA_V1_9 = "castle.physics_lifecycle_cloud.v1.9";
export const PHYSICS_LIFECYCLE_ENVELOPE_VERSION_V1_9 = "1.9";

const CLOUD_QUEUE_KEY_V1_9 = "castle.physics_lifecycle_cloud_queue.v1.9";
const CLOUD_DEBOUNCE_MS_V1_9 = 900;

/** @type {{ push?: Function, pull?: Function } | null} */
let cloudAdapterV1_9 = null;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const debouncedWriteTimersV1_9 = new Map();

function deviceIdV1_9() {
  if (typeof window === "undefined") return "node_runtime";
  window.__castle = window.__castle || {};
  if (!window.__castle.deviceId) {
    window.__castle.deviceId = `dev_${Math.random().toString(36).slice(2, 10)}`;
  }
  return window.__castle.deviceId;
}

function fnv1aChecksumV1_9(payload) {
  let hash = 2166136261;
  const str = typeof payload === "string" ? payload : JSON.stringify(payload);
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `chk_${(hash >>> 0).toString(16)}`;
}

function readQueueV1_9() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLOUD_QUEUE_KEY_V1_9);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueueV1_9(entries) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CLOUD_QUEUE_KEY_V1_9, JSON.stringify(entries.slice(-8)));
  } catch {
    /* ignore quota */
  }
}

export function registerPhysicsLifecycleCloudAdapterV1_9(adapter = {}) {
  cloudAdapterV1_9 = Object.freeze({
    push: typeof adapter.push === "function" ? adapter.push : null,
    pull: typeof adapter.pull === "function" ? adapter.pull : null
  });
  return cloudAdapterV1_9;
}

export function getPhysicsLifecycleCloudAdapterV1_9() {
  return cloudAdapterV1_9;
}

/**
 * PhysicsLifecycleEnvelopeV1_9 — portable cross-device lifecycle snapshot.
 * @param {string} userId
 * @param {number} [atMs]
 */
export function buildPhysicsLifecycleEnvelopeV1_9(userId, atMs = Date.now()) {
  const key = String(userId);
  const profile = getUserPhysicsProfileV1_7(key);
  const learningTrace = getLearningTraceV1_8(key, 24).entries;
  const physicsProfile = Object.freeze({
    stabilityPreferenceCurve: profile.stabilityPreferenceCurve,
    interruptionToleranceMap: profile.interruptionToleranceMap,
    modalityBiasGraph: profile.modalityBiasGraph,
    contextSwitchLatencyProfile: profile.contextSwitchLatencyProfile,
    driftEvents: profile.driftEvents,
    observationCount: profile.observationCount,
    personalityPhysicsActive: profile.personalityPhysicsActive,
    lastActiveAtMs: profile.lastActiveAtMs,
    lastDecayAtMs: profile.lastDecayAtMs,
    mergeConfidence: profile.mergeConfidence ?? null
  });
  const checksum = fnv1aChecksumV1_9({ physicsProfile, learningTraceIds: learningTrace.map((e) => e.traceId) });

  return Object.freeze({
    schema: CASTLE_PHYSICS_LIFECYCLE_CLOUD_SCHEMA_V1_9,
    userId: key,
    ownerId: key,
    deviceId: deviceIdV1_9(),
    physicsProfile,
    learningTrace: Object.freeze(learningTrace),
    version: PHYSICS_LIFECYCLE_ENVELOPE_VERSION_V1_9,
    checksum,
    timestamp: atMs,
    syncVersion: `${profile.observationCount || 0}:${atMs}`
  });
}

export function reconcilePhysicsStateV1_9(userId, remoteEnvelope, options = {}) {
  const key = String(userId);
  const atMs = Number(options.atMs) || Date.now();
  const merge = options.merge !== false;

  if (!remoteEnvelope?.physicsProfile) {
    return Object.freeze({
      schema: CASTLE_PHYSICS_LIFECYCLE_CLOUD_SCHEMA_V1_9,
      reconciled: false,
      reason: "invalid_envelope"
    });
  }

  const local = getUserPhysicsProfileV1_7(key);
  const remote = remoteEnvelope.physicsProfile;

  let profile;
  let reconciliation = "replace";

  if (merge && local.observationCount > 0) {
    const merged = mergePhysicsProfilesV1_9(local, remote, { atMs });
    profile = updatePhysicsProfileV1_7(key, () => merged.profile);
    reconciliation = merged.reconciliation;
  } else {
    profile = replacePhysicsProfileV1_7(key, {
      ...local,
      ...remote,
      ownerId: key,
      personalityPhysicsActive: true,
      lastActiveAtMs: atMs
    });
  }

  const trace = appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.SYNC_IMPORT,
    reason: merge ? "cross_device_physics_reconcile" : "cross_device_physics_replace",
    source: remoteEnvelope.deviceId || "cloud_reconciliation",
    deltas: Object.freeze({
      reconciliation,
      remoteChecksum: remoteEnvelope.checksum || null,
      remoteObservationCount: remote.observationCount || 0,
      localObservationCount: local.observationCount
    })
  });

  return Object.freeze({
    schema: CASTLE_PHYSICS_LIFECYCLE_CLOUD_SCHEMA_V1_9,
    reconciled: true,
    merge,
    reconciliation,
    profile,
    trace,
    cloudIsTruthSource: false
  });
}

function executeCloudWriteV1_9(userId, atMs) {
  const envelope = buildPhysicsLifecycleEnvelopeV1_9(userId, atMs);

  if (cloudAdapterV1_9?.push) {
    void Promise.resolve(cloudAdapterV1_9.push(envelope)).catch(() => {});
    appendLearningTraceV1_8(userId, {
      atMs,
      kind: LEARNING_TRACE_KIND_V1_8.SYNC_EXPORT,
      reason: "cloud_sync_push_debounced",
      source: "cloud_adapter",
      deltas: Object.freeze({ syncVersion: envelope.syncVersion, checksum: envelope.checksum })
    });
    logVoiceInfoV0("STABILITY_CLOUD_SYNC", {
      ownerId: String(userId),
      direction: "push",
      mode: "cloud_async_debounced",
      syncVersion: envelope.syncVersion
    });
    return Object.freeze({ pushed: true, mode: "cloud_async", envelope });
  }

  const queue = readQueueV1_9();
  queue.push(envelope);
  writeQueueV1_9(queue);
  appendLearningTraceV1_8(userId, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.SYNC_EXPORT,
    reason: "cloud_sync_queued_offline",
    source: "offline_queue",
    deltas: Object.freeze({ queueLength: queue.length, checksum: envelope.checksum })
  });
  return Object.freeze({ pushed: true, mode: "offline_queue", envelope, queueLength: queue.length });
}

export function scheduleDebouncedCloudWriteV1_9(userId, options = {}) {
  const key = String(userId);
  const atMs = Number(options.atMs) || Date.now();
  const debounceMs = Number(options.debounceMs) || CLOUD_DEBOUNCE_MS_V1_9;

  const prior = debouncedWriteTimersV1_9.get(key);
  if (prior) clearTimeout(prior);

  if (typeof setTimeout === "undefined") {
    return executeCloudWriteV1_9(key, atMs);
  }

  const timer = setTimeout(() => {
    debouncedWriteTimersV1_9.delete(key);
    executeCloudWriteV1_9(key, Date.now());
  }, debounceMs);
  debouncedWriteTimersV1_9.set(key, timer);

  return Object.freeze({
    scheduled: true,
    mode: cloudAdapterV1_9?.push ? "cloud_async_debounced" : "offline_queue_debounced",
    debounceMs
  });
}

export function flushDebouncedCloudWriteV1_9(userId, atMs = Date.now()) {
  const key = String(userId);
  const prior = debouncedWriteTimersV1_9.get(key);
  if (prior) {
    clearTimeout(prior);
    debouncedWriteTimersV1_9.delete(key);
  }
  return executeCloudWriteV1_9(key, atMs);
}

export function pullAndReconcilePhysicsV1_9(userId, options = {}) {
  const key = String(userId);
  const atMs = Number(options.atMs) || Date.now();

  if (cloudAdapterV1_9?.pull) {
    void Promise.resolve(cloudAdapterV1_9.pull(key))
      .then((remote) => {
        if (!remote?.physicsProfile) return;
        reconcilePhysicsStateV1_9(key, remote, { merge: options.merge !== false, atMs });
      })
      .catch(() => {});
    return Object.freeze({ pulled: false, mode: "cloud_async_pending", cloudIsTruthSource: false });
  }

  const queue = readQueueV1_9().filter((e) => e.userId === key || e.ownerId === key);
  if (!queue.length) {
    return Object.freeze({ pulled: false, mode: "offline_queue", reason: "empty_queue" });
  }
  const latest = queue[queue.length - 1];
  const reconciled = reconcilePhysicsStateV1_9(key, latest, {
    merge: options.merge !== false,
    atMs
  });
  return Object.freeze({
    pulled: true,
    mode: "offline_queue",
    reconciled,
    remoteTraceTail: latest.learningTrace || [],
    cloudIsTruthSource: false
  });
}

export function getPhysicsLifecycleCloudSnapshotV1_9() {
  return Object.freeze({
    schema: CASTLE_PHYSICS_LIFECYCLE_CLOUD_SCHEMA_V1_9,
    identity: "distributed_cognitive_physics_observable_learning",
    cloudIsTruthSource: false,
    debounceMs: CLOUD_DEBOUNCE_MS_V1_9,
    hasAdapter: Boolean(cloudAdapterV1_9?.push),
    queueLength: readQueueV1_9().length
  });
}

/** @internal vitest */
export function __resetPhysicsLifecycleCloudForTestV1_9() {
  cloudAdapterV1_9 = null;
  for (const timer of debouncedWriteTimersV1_9.values()) clearTimeout(timer);
  debouncedWriteTimersV1_9.clear();
  writeQueueV1_9([]);
}
