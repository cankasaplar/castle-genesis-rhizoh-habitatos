/**
 * Event catalog cross-device sync V1 — URL hydrate (always) + Firestore append log (best-effort).
 * Local catalog remains primary; remote = eventual consistency for shared awareness.
 * @see docs/RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md §7
 */

import { getFirebaseApp } from "../../firebase/castleFirebase.js";
import { logFirestoreRejection } from "../../firebase/captureFirestoreRejectionV1.js";
import {
  buildRhizohEventInviteLinkV12,
  loadRhizohEventRecordV12,
  saveRhizohEventRecordV12
} from "./rhizohEventSurfaceV12.js";

export const RHIZOH_EVENT_CATALOG_SYNC_SCHEMA_V1 = "castle.rhizoh_event_catalog_sync.v1";
export const RHIZOH_EVENT_CATALOG_SYNC_EVENT_V1 = "rhizoh:event-catalog-sync-v1";
export const CASTLE_EXPERIENCE_EVENT_FIRESTORE_TYPE_V1 = "castle_experience_event_v1";

/**
 * @param {string} raw
 */
function toBase64UrlV1(raw) {
  const str = String(raw || "");
  try {
    if (typeof btoa === "function") {
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }
  } catch {
    /* noop */
  }
  return "";
}

/**
 * @param {string} encoded
 */
function fromBase64UrlV1(encoded) {
  const pad = "=".repeat((4 - (encoded.length % 4)) % 4);
  const b64 = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    if (typeof atob === "function") return atob(b64);
  } catch {
    /* noop */
  }
  return "";
}

/**
 * @param {Record<string, unknown>} record
 */
export function compactEventRecordForSyncV1(record) {
  return Object.freeze({
    t: String(record.title || "").slice(0, 120),
    y: String(record.type || "scheduled").slice(0, 24),
    l: String(record.lifecycle || "SCHEDULED").slice(0, 24),
    k: String(record.inviteToken || "").slice(0, 32),
    h: String(record.hostCastleId || "").slice(0, 32),
    s: String(record.sessionId || "").slice(0, 64),
    x: record.experienceSessionId ? String(record.experienceSessionId).slice(0, 64) : null,
    v: String(record.visibility || "invite_only").slice(0, 24),
    c: Number(record.createdAtMs) || Date.now(),
    u: Number(record.updatedAtMs) || Date.now()
  });
}

/**
 * @param {Record<string, unknown>} compact
 * @param {string} eventId
 */
export function expandEventRecordFromSyncV1(compact, eventId) {
  if (!compact || typeof compact !== "object" || !eventId) return null;
  const inviteToken = String(compact.k || "");
  return Object.freeze({
    schema: "castle.rhizoh_event_surface.v12",
    eventId: String(eventId),
    title: String(compact.t || "Shared experience").slice(0, 120),
    type: String(compact.y || "scheduled").toLowerCase(),
    visibility: String(compact.v || "invite_only"),
    lifecycle: String(compact.l || "SCHEDULED"),
    inviteToken,
    inviteLink: buildRhizohEventInviteLinkV12(eventId, inviteToken),
    experienceSessionId: compact.x ? String(compact.x) : null,
    hostCastleId: compact.h ? String(compact.h) : null,
    sessionId: compact.s ? String(compact.s) : null,
    createdAtMs: Number(compact.c) || Date.now(),
    updatedAtMs: Number(compact.u) || Date.now(),
    readOnly: true,
    syncSource: "url_payload_v1"
  });
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 */
export function encodeEventPayloadParamV1(record) {
  if (!record?.eventId) return "";
  return toBase64UrlV1(JSON.stringify(compactEventRecordForSyncV1(record)));
}

/**
 * @param {string} payloadParam
 * @param {string} eventId
 */
export function decodeEventPayloadParamV1(payloadParam, eventId) {
  const raw = fromBase64UrlV1(String(payloadParam || "").trim());
  if (!raw) return null;
  try {
    const compact = JSON.parse(raw);
    return expandEventRecordFromSyncV1(compact, eventId);
  } catch {
    return null;
  }
}

/**
 * @param {string} [search]
 */
export function parseEventJoinBundleV1(search = "") {
  if (typeof window !== "undefined" && !search) {
    search = window.location.search || "";
  }
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const inviteToken = params.get("invite") || params.get("inviteToken") || null;
  const eventId = params.get("event") || params.get("eventId") || null;
  const payloadParam = params.get("evp") || params.get("eventPayload") || null;
  const hydratedRecord =
    eventId && payloadParam ? decodeEventPayloadParamV1(payloadParam, String(eventId)) : null;
  return Object.freeze({
    inviteToken: inviteToken ? String(inviteToken) : null,
    eventId: eventId ? String(eventId) : null,
    payloadParam: payloadParam ? String(payloadParam) : null,
    hydratedRecord
  });
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} incoming
 */
export function mergeEventRecordIntoLocalCatalogV1(incoming) {
  if (!incoming?.eventId) return null;
  const existing = loadRhizohEventRecordV12(incoming.eventId);
  const incomingUpdated = Number(incoming.updatedAtMs) || 0;
  const existingUpdated = Number(existing?.updatedAtMs) || 0;
  if (existing && existingUpdated > incomingUpdated) {
    return existing;
  }
  const merged = saveRhizohEventRecordV12({
    ...(existing || {}),
    ...incoming,
    inviteLink: buildRhizohEventInviteLinkWithSyncV1({
      ...incoming,
      inviteToken: incoming.inviteToken || existing?.inviteToken || ""
    }),
    updatedAtMs: Math.max(incomingUpdated, existingUpdated) || Date.now()
  });
  publishEventCatalogSyncV1(merged, incoming.syncSource || "local_merge_v1");
  return merged;
}

/**
 * Hydrate local catalog from invite URL payload (cross-device primary path).
 * @param {string} [search]
 */
export function hydrateEventCatalogFromJoinV1(search = "") {
  const bundle = parseEventJoinBundleV1(search);
  if (bundle.hydratedRecord) {
    return mergeEventRecordIntoLocalCatalogV1(bundle.hydratedRecord);
  }
  if (bundle.eventId) {
    return loadRhizohEventRecordV12(bundle.eventId);
  }
  return null;
}

/**
 * @param {string} [search]
 * @returns {"invite_broken" | "event_not_found" | null}
 */
export function detectInviteJoinDegradeV1(search = "") {
  const bundle = parseEventJoinBundleV1(search);
  if (bundle.payloadParam && !bundle.hydratedRecord) {
    return "invite_broken";
  }
  if (bundle.eventId && !bundle.hydratedRecord && !loadRhizohEventRecordV12(bundle.eventId)) {
    return "event_not_found";
  }
  return null;
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 * @param {string} [origin]
 */
export function buildRhizohEventInviteLinkWithSyncV1(record, origin = "") {
  if (!record?.eventId) return "";
  const payload = encodeEventPayloadParamV1(record);
  const base = buildRhizohEventInviteLinkV12(record.eventId, record.inviteToken, origin);
  const u = new URL(base);
  if (payload) u.searchParams.set("evp", payload);
  return u.toString();
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 * @param {{ uid?: string | null }} [auth]
 */
export async function appendEventToRemoteCatalogV1(record, auth = {}) {
  const app = getFirebaseApp();
  const actorUid = String(auth.uid || "").trim();
  if (!app) return Object.freeze({ ok: false, reason: "no_firebase" });
  if (!actorUid) return Object.freeze({ ok: false, reason: "no_auth" });
  if (!record?.eventId) return Object.freeze({ ok: false, reason: "missing_event" });

  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    const db = getFirestore(app);
    const correlationId = `exp_evt_${record.eventId}_${Date.now()}`.slice(0, 199);
    await addDoc(collection(db, "rhizoh_events", "castle", "items"), {
      type: CASTLE_EXPERIENCE_EVENT_FIRESTORE_TYPE_V1,
      source: "client",
      schemaVersion: 1,
      correlationId,
      actorUid,
      payload: Object.freeze({
        eventId: record.eventId,
        catalogSeq: Number(record.updatedAtMs) || Date.now(),
        record: compactEventRecordForSyncV1(record)
      }),
      _writtenAt: serverTimestamp()
    });
    return Object.freeze({ ok: true, reason: null });
  } catch (e) {
    logFirestoreRejection("event_catalog_append_v1", e, {
      path: "rhizoh_events/castle/items",
      eventId: record.eventId
    });
    return Object.freeze({ ok: false, reason: String(e?.message || e) });
  }
}

/**
 * Best-effort remote tail — requires Firebase auth.
 * @param {string} eventId
 * @param {(record: ReturnType<typeof loadRhizohEventRecordV12>) => void} onRecord
 */
export function subscribeRemoteEventCatalogV1(eventId, onRecord) {
  const id = String(eventId || "").trim();
  if (!id || typeof onRecord !== "function") return () => {};
  const app = getFirebaseApp();
  if (!app) return () => {};

  let unsub = () => {};
  let dead = false;

  void (async () => {
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth(app);
      if (!auth.currentUser) return;

      const { getFirestore, collection, query, where, limit, onSnapshot } = await import(
        "firebase/firestore"
      );
      const db = getFirestore(app);
      const colRef = collection(db, "rhizoh_events", "castle", "items");
      const q = query(colRef, where("payload.eventId", "==", id), limit(24));
      unsub = onSnapshot(
        q,
        (snap) => {
          if (dead) return;
          /** @type {ReturnType<typeof loadRhizohEventRecordV12> | null} */
          let best = null;
          let bestSeq = -1;
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const payload = data?.payload;
            const seq = Number(payload?.catalogSeq) || 0;
            const compact = payload?.record;
            if (!compact || seq <= bestSeq) return;
            const expanded = expandEventRecordFromSyncV1(compact, id);
            if (!expanded) return;
            bestSeq = seq;
            best = expanded;
          });
          if (best) {
            const merged = mergeEventRecordIntoLocalCatalogV1({
              ...best,
              syncSource: "remote_catalog_v1"
            });
            if (merged) onRecord(merged);
          }
        },
        (err) => {
          logFirestoreRejection("event_catalog_subscribe_v1", err, { eventId: id });
        }
      );
    } catch (e) {
      logFirestoreRejection("event_catalog_subscribe_boot_v1", e, { eventId: id });
    }
  })();

  return () => {
    dead = true;
    unsub();
  };
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 * @param {string} [source]
 */
export function publishEventCatalogSyncV1(record, source = "local_v1") {
  if (typeof window !== "undefined") {
    window.__RHIZOH_EVENT_CATALOG_SYNC__ = Object.freeze({
      schema: RHIZOH_EVENT_CATALOG_SYNC_SCHEMA_V1,
      readOnly: true,
      source,
      last: record,
      atMs: record?.updatedAtMs ?? Date.now()
    });
    window.dispatchEvent(
      new CustomEvent(RHIZOH_EVENT_CATALOG_SYNC_EVENT_V1, {
        detail: Object.freeze({ record, source, atMs: Date.now() })
      })
    );
  }
  return record;
}

/**
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 * @param {{ uid?: string | null }} [auth]
 */
export async function propagateEventCatalogV1(record, auth = {}) {
  const local = mergeEventRecordIntoLocalCatalogV1({
    ...record,
    inviteLink: buildRhizohEventInviteLinkWithSyncV1(record),
    syncSource: "host_propagate_v1"
  });
  const remote = await appendEventToRemoteCatalogV1(local, auth);
  publishEventCatalogSyncV1(local, remote.ok ? "host_local_remote_v1" : "host_local_only_v1");
  return Object.freeze({ local, remote });
}

/** @internal vitest */
export function __resetRhizohEventCatalogSyncForTestV1() {
  try {
    if (typeof window !== "undefined") {
      delete window.__RHIZOH_EVENT_CATALOG_SYNC__;
    }
  } catch {
    /* noop */
  }
}
