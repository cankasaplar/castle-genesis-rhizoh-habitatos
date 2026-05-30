/**
 * Studio → Firebase canonical event document (V0).
 * Pure builder — does not call Firestore. Aligns with firestore.rules `rhizoh_events/{stream}/items`:
 * `rhizohEventEnvelopeOk()` + `rhizohTypeMatchesStream('studio', type)` where type matches ^studio_.*_v[0-9]+$.
 *
 * @see docs/RHIZOH_STUDIO_FIREBASE_INTEGRATION_STABILIZATION_V0.md
 */

/** @type {const} */
export const RHIZOH_STUDIO_FIRESTORE_STREAM = "studio";

/**
 * Must satisfy `rhizohTypeMatchesStream('studio', type)` in firestore.rules.
 * @type {const}
 */
export const RHIZOH_STUDIO_CANONICAL_EVENT_TYPE_V0 = "studio_canonical_event_v1";

/**
 * @param {unknown} v
 * @returns {string}
 */
function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

/** firestore.rules: correlationId.size() > 4 — kısa id rules reddi üretir. */
function ensureCorrelationId(raw) {
  let s = str(raw);
  if (s.length > 4 && s.length < 200) return s.slice(0, 199);
  try {
    const pad =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    s = `cr_${pad}`;
  } catch {
    s = `cr_${Date.now().toString(36)}_x`;
  }
  return s.slice(0, 199);
}

/**
 * Builds one Firestore document body for `rhizoh_events/studio/items/{autoId}` (append).
 * Identity is packaged, not flattened to a single legacy key.
 *
 * @param {{
 *   actorUid: string,
 *   correlationId: string,
 *   sessionId?: string | null,
 *   continuityBindingKey?: string | null,
 *   traceId?: string | null,
 *   connectionId?: string | null,
 *   identityMap?: Record<string, unknown> | null,
 *   eventType?: string | null,
 *   payload?: Record<string, unknown> | null
 * }} input
 * @returns {Record<string, unknown>}
 */
export function buildRhizohStudioFirestoreEventDocument(input) {
  const actorUid = str(input?.actorUid);
  const correlationId = ensureCorrelationId(input?.correlationId);
  const identityMap =
    input?.identityMap && typeof input.identityMap === "object" && !Array.isArray(input.identityMap)
      ? input.identityMap
      : {};
  const payload =
    input?.payload && typeof input.payload === "object" && !Array.isArray(input.payload) ? input.payload : {};

  return {
    type: RHIZOH_STUDIO_CANONICAL_EVENT_TYPE_V0,
    source: "client",
    schemaVersion: 1,
    correlationId: correlationId.slice(0, 199),
    actorUid,
    sessionId: str(input?.sessionId),
    continuityBindingKey: str(input?.continuityBindingKey),
    traceId: str(input?.traceId),
    connectionId: str(input?.connectionId),
    identityMap,
    eventType: str(input?.eventType || "unknown").slice(0, 128),
    payload
  };
}

/**
 * Client-side guard before `addDoc` (rules subset; not a security boundary).
 * @param {Record<string, unknown>} doc
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateRhizohStudioFirestoreEventDocument(doc) {
  if (!doc || typeof doc !== "object") return { ok: false, reason: "not_object" };
  const type = str(doc.type);
  if (!/^studio_.*_v[0-9]+$/.test(type)) return { ok: false, reason: "type_studio_pattern" };
  if (str(doc.source) !== "client") return { ok: false, reason: "source" };
  if (doc.schemaVersion !== 1) return { ok: false, reason: "schemaVersion" };
  const cid = str(doc.correlationId);
  if (cid.length <= 4 || cid.length >= 200) return { ok: false, reason: "correlationId_len" };
  const aid = str(doc.actorUid);
  if (!aid) return { ok: false, reason: "actorUid" };
  return { ok: true };
}
