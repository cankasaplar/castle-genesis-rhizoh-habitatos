/**
 * Castle Stability Cloud Sync v1.9 — backward-compatible facade over physics lifecycle cloud.
 * Canonical implementation: castlePhysicsLifecycleCloudV1_9.js
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import {
  buildPhysicsLifecycleEnvelopeV1_9,
  flushDebouncedCloudWriteV1_9,
  getPhysicsLifecycleCloudAdapterV1_9,
  getPhysicsLifecycleCloudSnapshotV1_9,
  pullAndReconcilePhysicsV1_9,
  reconcilePhysicsStateV1_9,
  registerPhysicsLifecycleCloudAdapterV1_9,
  scheduleDebouncedCloudWriteV1_9,
  __resetPhysicsLifecycleCloudForTestV1_9
} from "./castlePhysicsLifecycleCloudV1_9.js";

export const CASTLE_STABILITY_CLOUD_SYNC_SCHEMA_V1_9 = "castle.stability_cloud_sync.v1.9";

export function registerStabilityCloudSyncAdapterV1_9(adapter = {}) {
  return registerPhysicsLifecycleCloudAdapterV1_9(adapter);
}

export function getStabilityCloudSyncAdapterV1_9() {
  return getPhysicsLifecycleCloudAdapterV1_9();
}

export function buildCloudSyncEnvelopeV1_9(ownerId, atMs = Date.now()) {
  const envelope = buildPhysicsLifecycleEnvelopeV1_9(ownerId, atMs);
  return Object.freeze({
    schema: CASTLE_STABILITY_CLOUD_SYNC_SCHEMA_V1_9,
    ownerId: envelope.userId,
    deviceId: envelope.deviceId,
    exportedAtMs: envelope.timestamp,
    syncVersion: envelope.syncVersion,
    checksum: envelope.checksum,
    version: envelope.version,
    physicsEnvelope: Object.freeze({
      schema: envelope.schema,
      profile: envelope.physicsProfile,
      ownerId: envelope.userId,
      deviceId: envelope.deviceId,
      exportedAtMs: envelope.timestamp
    }),
    learningTraceTail: envelope.learningTrace
  });
}

export async function pushPhysicsLifecycleCloudV1_9(ownerId, options = {}) {
  return pushPhysicsLifecycleCloudSyncV1_9(ownerId, options);
}

export function pushPhysicsLifecycleCloudSyncV1_9(ownerId, options = {}) {
  const atMs = Number(options.atMs) || Date.now();
  if (options.debounce === false) {
    return flushDebouncedCloudWriteV1_9(ownerId, atMs);
  }
  if (options.immediate === true) {
    return flushDebouncedCloudWriteV1_9(ownerId, atMs);
  }
  return scheduleDebouncedCloudWriteV1_9(ownerId, { atMs, debounceMs: options.debounceMs });
}

export async function pullPhysicsLifecycleCloudV1_9(ownerId, options = {}) {
  return pullPhysicsLifecycleCloudSyncV1_9(ownerId, options);
}

export function pullPhysicsLifecycleCloudSyncV1_9(ownerId, options = {}) {
  return pullAndReconcilePhysicsV1_9(ownerId, options);
}

export function importCloudEnvelopeV1_9(ownerId, envelope, options = {}) {
  const normalized = envelope?.physicsProfile
    ? envelope
    : {
        physicsProfile: envelope?.physicsEnvelope?.profile,
        deviceId: envelope?.deviceId,
        checksum: envelope?.checksum,
        learningTrace: envelope?.learningTraceTail
      };
  return reconcilePhysicsStateV1_9(ownerId, normalized, options);
}

export async function flushOfflineCloudQueueV1_9(ownerId) {
  const adapter = getPhysicsLifecycleCloudAdapterV1_9();
  if (!adapter?.push) {
    return Object.freeze({ flushed: false, reason: "no_adapter" });
  }
  return flushDebouncedCloudWriteV1_9(ownerId, Date.now());
}

export function getCloudSyncQueueSnapshotV1_9() {
  const snap = getPhysicsLifecycleCloudSnapshotV1_9();
  return Object.freeze({
    schema: CASTLE_STABILITY_CLOUD_SYNC_SCHEMA_V1_9,
    queueLength: snap.queueLength,
    hasAdapter: snap.hasAdapter,
    cloudIsTruthSource: false
  });
}

/** @internal vitest */
export function __resetStabilityCloudSyncForTestV1_9() {
  __resetPhysicsLifecycleCloudForTestV1_9();
}
