/**
 * RCIL → RRHP minimal mutation bridge (tek düğüm, bellek içi projection).
 *
 * Kurallar:
 * 1. Fail-closed — doğrulama geçmezse projection değişmez.
 * 2. Idempotent — aynı (seq + orderingKey + type + schema) ikinci kez uygulanmaz.
 * 3. Synthetic isolation — `source === "pressure_loop"` asla state yazmaz.
 *
 * Kalıcı depolama: `rrhpPersistentProjectionV1.js` — isteğe bağlı merge-only Firestore; bu dosya bellek içi
 * projection + idempotency anahtarları tutar.
 */

export const RRHP_MINIMAL_PROJECTION_SCHEMA_VERSION = 1;

/** RCIL event `v` ile uyumlu olmalı (rcilLiveWiringV1 ile aynı sayı). */
export const RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION = 1;

const SYNTHETIC_PRESSURE_SOURCE = "pressure_loop";

/** @type {Set<string>} */
const _appliedKeys = new Set();

/** @type {{ seq: number, type: string, at: number }[]} */
const _appliedTail = [];
const TAIL_MAX = 64;

/** @type {{ operationalReconcileTotal: number, lastAppliedSeq: number, lastOperationalType: string | null }} */
let _projection = {
  schemaVersion: RRHP_MINIMAL_PROJECTION_SCHEMA_VERSION,
  operationalReconcileTotal: 0,
  lastAppliedSeq: 0,
  lastOperationalType: null,
  lastPayloadSummary: null
};

function summarizePayload(payload) {
  if (payload == null) return null;
  try {
    const s = JSON.stringify(payload);
    return s.length > 240 ? `${s.slice(0, 240)}…` : s;
  } catch {
    return "[unserializable]";
  }
}

export function isSyntheticIsolatedRcilEvent(event) {
  return Boolean(event && event.source === SYNTHETIC_PRESSURE_SOURCE);
}

/**
 * Fail-closed gate: geçmezse mutation yok.
 * @param {object} event
 */
export function validateRcilEventForRrhpMutation(event) {
  if (!event || typeof event !== "object") return { ok: false, reason: "not_object" };
  if (isSyntheticIsolatedRcilEvent(event)) return { ok: false, reason: "synthetic_blocked" };
  const v = Number(event.v);
  if (v !== RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION) return { ok: false, reason: "schema_mismatch" };
  const seq = Number(event.seq);
  if (!Number.isFinite(seq) || seq < 1) return { ok: false, reason: "bad_seq" };
  const type = String(event.type || "").trim();
  if (!type) return { ok: false, reason: "missing_type" };
  const source = String(event.source || "").trim();
  if (!source) return { ok: false, reason: "missing_source" };
  if (source === SYNTHETIC_PRESSURE_SOURCE) return { ok: false, reason: "synthetic_blocked" };
  const orderingKey = String(event.orderingKey || "").trim();
  if (!orderingKey) return { ok: false, reason: "missing_ordering_key" };
  return { ok: true };
}

function idempotencyKey(event) {
  return `v${event.v}|s${event.seq}|ok:${event.orderingKey}|t:${event.type}`;
}

export function getRrhpMinimalProjectionSnapshot() {
  return {
    schemaVersion: _projection.schemaVersion,
    operationalReconcileTotal: _projection.operationalReconcileTotal,
    lastAppliedSeq: _projection.lastAppliedSeq,
    lastOperationalType: _projection.lastOperationalType,
    lastPayloadSummary: _projection.lastPayloadSummary,
    appliedTail: _appliedTail.slice(-16),
    appliedKeyCount: _appliedKeys.size
  };
}

/** @param {number} [max] */
export function getRrhpAppliedIdempotencyKeyTail(max = 256) {
  const n = Math.min(512, Math.max(8, Math.floor(max) || 256));
  return [..._appliedKeys].slice(-n);
}

/** @param {number} [max] */
export function getRrhpAppliedMetaTail(max = 64) {
  const n = Math.min(TAIL_MAX, Math.max(8, Math.floor(max) || 64));
  return _appliedTail.slice(-n).map((e) => ({ ...e }));
}

/**
 * Firestore’tan gelen slice ile bellek projection’ı doldur (session restore).
 * Varsayılan: yalnızca yerel projection boşken (cold start). `force: true` yalnızca vitest içinde.
 * @param {{ rrhpSliceSchema?: number, operationalReconcileTotal?: number, lastAppliedSeq?: number, lastOperationalType?: string | null, lastPayloadSummary?: string | null, appliedKeysTail?: string[], appliedMetaTail?: { seq: number, type: string, at: number }[] }} slice
 * @param {{ force?: boolean }} [options]
 */
export function hydrateRrhpFromPersistentSlice(slice, options = {}) {
  if (!slice || typeof slice !== "object") return { ok: false, reason: "bad_slice" };
  if (Number(slice.rrhpSliceSchema) !== 1) return { ok: false, reason: "slice_schema" };
  const force = Boolean(options.force) && typeof import.meta !== "undefined" && import.meta.env?.MODE === "test";
  if (!force && (_appliedKeys.size > 0 || _projection.operationalReconcileTotal > 0)) {
    return { ok: false, reason: "local_nonempty" };
  }

  _appliedKeys.clear();
  const keys = Array.isArray(slice.appliedKeysTail) ? slice.appliedKeysTail : [];
  for (const k of keys) {
    if (typeof k === "string" && k.length > 0 && k.length < 512) _appliedKeys.add(k);
  }

  const total = Math.max(0, Math.floor(Number(slice.operationalReconcileTotal)) || 0);
  const lastSeq = Math.max(0, Math.floor(Number(slice.lastAppliedSeq)) || 0);
  _projection = {
    schemaVersion: RRHP_MINIMAL_PROJECTION_SCHEMA_VERSION,
    operationalReconcileTotal: total,
    lastAppliedSeq: lastSeq,
    lastOperationalType: slice.lastOperationalType != null ? String(slice.lastOperationalType) : null,
    lastPayloadSummary: slice.lastPayloadSummary != null ? String(slice.lastPayloadSummary) : null
  };

  _appliedTail.length = 0;
  const meta = Array.isArray(slice.appliedMetaTail) ? slice.appliedMetaTail : [];
  for (const m of meta) {
    if (m && typeof m === "object" && Number.isFinite(m.seq)) {
      _appliedTail.push({ seq: m.seq, type: String(m.type || ""), at: Number(m.at) || 0 });
    }
  }
  if (_appliedTail.length > TAIL_MAX) _appliedTail.splice(0, _appliedTail.length - TAIL_MAX);

  return { ok: true };
}

/**
 * RCIL reconcile tamamlandıktan sonra tek adımlık projection güncellemesi.
 * @param {object} event drain edilen RCIL olayı
 * @returns {{ outcome: "applied" | "skipped", reason?: string, projection: ReturnType<typeof getRrhpMinimalProjectionSnapshot> }}
 */
export function applyMinimalRrhpFromRcilEvent(event) {
  const snap = () => getRrhpMinimalProjectionSnapshot();
  const gate = validateRcilEventForRrhpMutation(event);
  if (!gate.ok) {
    return { outcome: "skipped", reason: gate.reason, projection: snap() };
  }
  const key = idempotencyKey(event);
  if (_appliedKeys.has(key)) {
    return { outcome: "skipped", reason: "idempotent_duplicate", projection: snap() };
  }

  _appliedKeys.add(key);
  _projection = {
    ..._projection,
    operationalReconcileTotal: _projection.operationalReconcileTotal + 1,
    lastAppliedSeq: event.seq,
    lastOperationalType: event.type,
    lastPayloadSummary: summarizePayload(event.payload)
  };
  _appliedTail.push({ seq: event.seq, type: event.type, at: Date.now() });
  if (_appliedTail.length > TAIL_MAX) _appliedTail.splice(0, _appliedTail.length - TAIL_MAX);

  return { outcome: "applied", projection: snap() };
}

/** @internal vitest + RCIL reset ile hizalı */
export function __resetRrhpMinimalProjectionForTests() {
  _appliedKeys.clear();
  _appliedTail.length = 0;
  _projection = {
    schemaVersion: RRHP_MINIMAL_PROJECTION_SCHEMA_VERSION,
    operationalReconcileTotal: 0,
    lastAppliedSeq: 0,
    lastOperationalType: null,
    lastPayloadSummary: null
  };
}
