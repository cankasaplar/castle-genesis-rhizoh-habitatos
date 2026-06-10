/**
 * Castle Physics Firebase Adapter v1.9 — production cloud sync via rhizoh_client_sync.
 * Cloud is NEVER truth source — push merges before write; pull reconciles locally.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9_BRIDGE_V1.md
 */

import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseApp, firebaseConfigured } from "../firebase/castleFirebase.js";
import { logFirestoreRejection } from "../firebase/captureFirestoreRejectionV1.js";
import { mergePhysicsProfilesV1_9 } from "./castlePhysicsMergeV1_9.js";
import {
  buildPhysicsLifecycleEnvelopeV1_9,
  PHYSICS_LIFECYCLE_ENVELOPE_VERSION_V1_9
} from "./castlePhysicsLifecycleCloudV1_9.js";

export const CASTLE_PHYSICS_FIREBASE_ADAPTER_SCHEMA_V1_9 = "castle.physics_firebase_adapter.v1.9";

export const PHYSICS_FIRESTORE_COLLECTION_V1_9 = "rhizoh_client_sync";
export const PHYSICS_FIRESTORE_FIELD_V1_9 = "physicsLifecycleV1_9";
export const PHYSICS_FIRESTORE_PRODUCT_SURFACE_V1_9 = "castle";

const TRACE_TAIL_MAX_V1_9 = 12;

function resolveFirebaseUidV1_9(fallbackUserId) {
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    const uid = getAuth(app).currentUser?.uid;
    return uid || null;
  } catch {
    return null;
  }
}

function syncDocRefV1_9(uid, getDb = () => getFirestore(getFirebaseApp())) {
  const db = getDb();
  if (!db || !uid) return null;
  return doc(db, PHYSICS_FIRESTORE_COLLECTION_V1_9, String(uid));
}

function resolveDocRefV1_9(uid, deps) {
  if (deps.createRef) return deps.createRef(uid);
  return syncDocRefV1_9(uid, deps.getDb);
}

function serializeEnvelopeForFirestoreV1_9(envelope) {
  const trace = Array.isArray(envelope.learningTrace)
    ? envelope.learningTrace.slice(-TRACE_TAIL_MAX_V1_9)
    : [];
  return Object.freeze({
    schema: envelope.schema,
    userId: envelope.userId,
    deviceId: envelope.deviceId,
    physicsProfile: envelope.physicsProfile,
    learningTrace: trace,
    version: envelope.version || PHYSICS_LIFECYCLE_ENVELOPE_VERSION_V1_9,
    checksum: envelope.checksum,
    timestamp: envelope.timestamp,
    syncVersion: envelope.syncVersion
  });
}

function mergeTraceTailsV1_9(localTrace = [], remoteTrace = []) {
  const seen = new Set();
  const merged = [];
  for (const entry of [...remoteTrace, ...localTrace]) {
    if (!entry?.traceId || seen.has(entry.traceId)) continue;
    seen.add(entry.traceId);
    merged.push(entry);
  }
  merged.sort((a, b) => Number(a.atMs || 0) - Number(b.atMs || 0));
  return Object.freeze(merged.slice(-TRACE_TAIL_MAX_V1_9));
}

function reconcileEnvelopesBeforePushV1_9(localEnvelope, remotePayload, atMs = Date.now()) {
  if (!remotePayload?.physicsProfile) return localEnvelope;

  const merged = mergePhysicsProfilesV1_9(localEnvelope.physicsProfile, remotePayload.physicsProfile, {
    atMs
  });

  return Object.freeze({
    ...localEnvelope,
    physicsProfile: merged.profile,
    learningTrace: mergeTraceTailsV1_9(localEnvelope.learningTrace, remotePayload.learningTrace),
    timestamp: atMs,
    syncVersion: `${merged.profile.observationCount || 0}:${atMs}`,
    mergeReconciliation: merged.reconciliation,
    cloudIsTruthSource: false
  });
}

/**
 * @param {{ getUid?: () => string | null, getDb?: () => import('firebase/firestore').Firestore | null, getDocFn?: typeof getDoc, setDocFn?: typeof setDoc, createRef?: (uid: string) => object | null }} [deps]
 */
export function createPhysicsFirebaseAdapterV1_9(deps = {}) {
  const getUid = deps.getUid || (() => resolveFirebaseUidV1_9(null));
  const getDb = deps.getDb || (() => {
    const app = getFirebaseApp();
    return app ? getFirestore(app) : null;
  });
  const readDoc = deps.getDocFn || getDoc;
  const writeDoc = deps.setDocFn || setDoc;

  return Object.freeze({
    schema: CASTLE_PHYSICS_FIREBASE_ADAPTER_SCHEMA_V1_9,
    cloudIsTruthSource: false,

    async push(envelope) {
      const uid = getUid();
      if (!uid) {
        return Object.freeze({ pushed: false, reason: "no_auth_uid", cloudIsTruthSource: false });
      }
      const ref = resolveDocRefV1_9(uid, deps);
      if (!ref) {
        return Object.freeze({ pushed: false, reason: "no_firestore_or_uid" });
      }

      const atMs = Number(envelope?.timestamp) || Date.now();
      let payload = serializeEnvelopeForFirestoreV1_9(envelope);

      try {
        const snap = await readDoc(ref);
        const remote = snap.exists() ? snap.data()?.[PHYSICS_FIRESTORE_FIELD_V1_9] : null;
        if (remote?.checksum && remote.checksum !== payload.checksum) {
          payload = serializeEnvelopeForFirestoreV1_9(
            reconcileEnvelopesBeforePushV1_9(envelope, remote, atMs)
          );
        }

        await writeDoc(
          ref,
          {
            productSurface: PHYSICS_FIRESTORE_PRODUCT_SURFACE_V1_9,
            [PHYSICS_FIRESTORE_FIELD_V1_9]: payload,
            physicsLifecycleUpdatedAt: serverTimestamp(),
            physicsSyncMeta: Object.freeze({
              observationCount: payload.physicsProfile?.observationCount || 0,
              lastPushDeviceId: payload.deviceId,
              conflictStrategy: "cognitive_merge_v1_9",
              cloudIsTruthSource: false
            })
          },
          { merge: true }
        );

        return Object.freeze({
          pushed: true,
          mode: "firebase_rhizoh_client_sync",
          uid,
          checksum: payload.checksum,
          cloudIsTruthSource: false
        });
      } catch (err) {
        logFirestoreRejection("physics_lifecycle_push_v1_9", err, { uid });
        return Object.freeze({ pushed: false, reason: "firestore_error", cloudIsTruthSource: false });
      }
    },

    async pull(userId) {
      const uid = getUid() || String(userId);
      const ref = resolveDocRefV1_9(uid, deps);
      if (!ref) {
        return null;
      }

      try {
        const snap = await readDoc(ref);
        if (!snap.exists()) return null;
        const remote = snap.data()?.[PHYSICS_FIRESTORE_FIELD_V1_9];
        if (!remote?.physicsProfile) return null;

        return Object.freeze({
          schema: remote.schema,
          userId: remote.userId || uid,
          ownerId: remote.userId || uid,
          deviceId: remote.deviceId,
          physicsProfile: remote.physicsProfile,
          learningTrace: remote.learningTrace || [],
          version: remote.version,
          checksum: remote.checksum,
          timestamp: remote.timestamp,
          syncVersion: remote.syncVersion,
          cloudIsTruthSource: false
        });
      } catch (err) {
        logFirestoreRejection("physics_lifecycle_pull_v1_9", err, { uid });
        return null;
      }
    }
  });
}

export function resolvePhysicsSyncUserIdV1_9(fallback = "user_local") {
  return resolveFirebaseUidV1_9(fallback) || String(fallback);
}

export function isPhysicsFirebaseAdapterAvailableV1_9() {
  return firebaseConfigured && Boolean(getFirebaseApp());
}

let installedV1_9 = false;

/**
 * Register Firebase adapter with cloud sync layer when infra is available.
 * @param {{ registerAdapter: Function, getUid?: () => string | null }} deps
 */
export function installPhysicsFirebaseCloudAdapterV1_9(deps) {
  if (installedV1_9) {
    return Object.freeze({ installed: true, mode: "already_installed" });
  }
  if (!deps.force && !isPhysicsFirebaseAdapterAvailableV1_9()) {
    return Object.freeze({ installed: false, mode: "firebase_not_configured" });
  }
  const uid = (deps.getUid || (() => resolveFirebaseUidV1_9(null)))();
  if (!uid) {
    return Object.freeze({ installed: false, mode: "awaiting_auth" });
  }

  const adapter = createPhysicsFirebaseAdapterV1_9({
    getUid: deps.getUid || (() => resolveFirebaseUidV1_9(null))
  });
  deps.registerAdapter(adapter);
  installedV1_9 = true;

  return Object.freeze({
    installed: true,
    mode: "firebase_rhizoh_client_sync",
    uid,
    cloudIsTruthSource: false
  });
}

/** @internal vitest */
export function __resetPhysicsFirebaseAdapterForTestV1_9() {
  installedV1_9 = false;
}

/** @internal vitest — expose merge for unit tests */
export function __reconcileEnvelopesBeforePushForTestV1_9(local, remote, atMs) {
  return reconcileEnvelopesBeforePushV1_9(local, remote, atMs);
}

/** @internal vitest */
export function __buildEnvelopeForTestV1_9(userId, atMs) {
  return buildPhysicsLifecycleEnvelopeV1_9(userId, atMs);
}
