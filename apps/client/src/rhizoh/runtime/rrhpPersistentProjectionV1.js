/**
 * RRHP Persistent Projection v1 — merge-only Firestore, kullanıcı kapsamlı.
 *
 * - Doc: `users/{uid}/rrhp_projection_v1/singleton` (rules: `users/{userId}/**`)
 * - Yalnızca `applyMinimalRrhpFromRcilEvent` → `applied` sonrası snapshot + idempotency tail yazılır.
 * - Synthetic pressure anahtarları asla üretilmez (bridge’de zaten uygulanmaz).
 * - Hydrate: session restore — varsayılan olarak yalnız yerel projection boşken; vitest’te `forceForTests`.
 *
 * Env: `VITE_RRHP_PERSIST=1` yazım; `VITE_RRHP_HYDRATE=1` + persist ile okuma (cold restore).
 */

import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "../../firebase/castleFirebase.js";
import { logFirestoreRejection } from "../../firebase/captureFirestoreRejectionV1.js";
import {
  getRrhpMinimalProjectionSnapshot,
  getRrhpAppliedIdempotencyKeyTail,
  getRrhpAppliedMetaTail,
  hydrateRrhpFromPersistentSlice
} from "./rcilRrhpMinimalBridgeV1.js";

export const RRHP_PERSISTENT_SLICE_SCHEMA = 1;

function persistEnabled() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_RRHP_PERSIST === "1";
  } catch {
    return false;
  }
}

function hydrateFromFirestoreEnabled() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") return true;
    return import.meta.env?.VITE_RRHP_PERSIST === "1" && import.meta.env?.VITE_RRHP_HYDRATE === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string} uid
 * @returns {Record<string, unknown>}
 */
export function buildRrhpPersistentMergePayload(uid) {
  const snap = getRrhpMinimalProjectionSnapshot();
  return {
    rrhpSliceSchema: RRHP_PERSISTENT_SLICE_SCHEMA,
    ownerUid: uid,
    rrhpMinimalSchemaVersion: snap.schemaVersion,
    operationalReconcileTotal: snap.operationalReconcileTotal,
    lastAppliedSeq: snap.lastAppliedSeq,
    lastOperationalType: snap.lastOperationalType,
    lastPayloadSummary: snap.lastPayloadSummary ?? null,
    appliedKeysTail: getRrhpAppliedIdempotencyKeyTail(256),
    appliedMetaTail: getRrhpAppliedMetaTail(64)
  };
}

/**
 * Merge-only `setDoc(..., { merge: true })` — overwrite yok, alanlar birleşir.
 */
export async function persistRrhpMinimalProjectionMerge() {
  if (!persistEnabled()) return { ok: false, reason: "persist_disabled" };
  const app = getFirebaseApp();
  if (!app) return { ok: false, reason: "no_firebase" };
  const auth = getAuth(app);
  const uid = auth.currentUser?.uid;
  if (!uid) return { ok: false, reason: "no_auth" };

  const payload = buildRrhpPersistentMergePayload(uid);
  const { getFirestore, doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  const db = getFirestore(app);
  const ref = doc(db, "users", uid, "rrhp_projection_v1", "singleton");
  try {
    await setDoc(
      ref,
      {
        ...payload,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    logFirestoreRejection("rrhp_projection_singleton_merge", e, { path: `users/${uid}/rrhp_projection_v1/singleton` });
    return { ok: false, reason: String(e?.message || e || "setDoc_failed") };
  }
  return { ok: true };
}

/**
 * Session restore: Firestore’tan oku → bridge hydrate (yerel boşsa veya test `forceForTests`).
 * @param {{ forceForTests?: boolean }} [options]
 */
export async function restoreRrhpPersistentProjectionFromFirestore(options = {}) {
  if (!hydrateFromFirestoreEnabled() && !options.forceForTests) {
    return { ok: false, reason: "hydrate_disabled" };
  }
  const app = getFirebaseApp();
  if (!app) return { ok: false, reason: "no_firebase" };
  const auth = getAuth(app);
  const uid = auth.currentUser?.uid;
  if (!uid) return { ok: false, reason: "no_auth" };

  const { getFirestore, doc, getDoc } = await import("firebase/firestore");
  const db = getFirestore(app);
  const ref = doc(db, "users", uid, "rrhp_projection_v1", "singleton");
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "no_doc" };
  const d = snap.data() || {};
  if (d.ownerUid && d.ownerUid !== uid) return { ok: false, reason: "owner_mismatch" };
  if (Number(d.rrhpSliceSchema) !== RRHP_PERSISTENT_SLICE_SCHEMA) {
    return { ok: false, reason: "slice_schema_mismatch" };
  }

  const slice = {
    rrhpSliceSchema: RRHP_PERSISTENT_SLICE_SCHEMA,
    operationalReconcileTotal: d.operationalReconcileTotal,
    lastAppliedSeq: d.lastAppliedSeq,
    lastOperationalType: d.lastOperationalType,
    lastPayloadSummary: d.lastPayloadSummary,
    appliedKeysTail: d.appliedKeysTail,
    appliedMetaTail: d.appliedMetaTail
  };
  const force = Boolean(options.forceForTests) && typeof import.meta !== "undefined" && import.meta.env?.MODE === "test";
  const h = hydrateRrhpFromPersistentSlice(slice, { force });
  return { ok: h.ok, reason: h.reason };
}
