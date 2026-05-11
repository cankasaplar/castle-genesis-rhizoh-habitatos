/**
 * RCIL Live Wiring — minimal executable loop (Sprint V1).
 * Normatif: docs/RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md · docs/RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md
 *
 * Tek client içi deterministik sıra (monotonic seq). Dağıtık total order bu sprint kapsamı dışında;
 * Firestore yazımı isteğe bağlı — çoklu client için ayrı protokol gerekir.
 */

import { getFirebaseApp } from "../../firebase/castleFirebase.js";

/** Firestore collection path — `FIREBASE_PATH_KEYS.rcilEventLedger` ile aynı (`sovereignRuntimeSpec.js`). */
const RCIL_EVENT_LEDGER_SEGMENTS = ["castle", "genesis", "v1", "runtime", "rcil_events"];

export const RCIL_EVENT_SCHEMA_VERSION = 1;

/** @typedef {"idle" | "ingested" | "reconciling" | "sealed"} RcilIdentityPhase */

const _queue = [];
let _seq = 0;
/** @type {RcilIdentityPhase} */
let _identityPhase = "idle";
const _trace = [];
const TRACE_MAX = 512;

function pushTrace(entry) {
  _trace.push({ ...entry, t: Date.now() });
  if (_trace.length > TRACE_MAX) _trace.splice(0, _trace.length - TRACE_MAX);
}

/**
 * @param {{ type: string, payload?: unknown, source?: string, orderingKey?: string }} input
 * @returns {{ ok: boolean, seq: number, phase: RcilIdentityPhase, error?: string }}
 */
export function ingestRcilEvent(input = {}) {
  const type = String(input.type || "").trim();
  if (!type) return { ok: false, seq: _seq, phase: _identityPhase, error: "missing_type" };
  _seq += 1;
  const event = {
    v: RCIL_EVENT_SCHEMA_VERSION,
    seq: _seq,
    type,
    payload: input.payload ?? null,
    source: String(input.source || "client"),
    orderingKey: String(input.orderingKey || type),
    ts: Date.now()
  };
  _queue.push(event);
  _identityPhase = "ingested";
  pushTrace({ kind: "ingest", event });
  return { ok: true, seq: _seq, phase: _identityPhase };
}

/**
 * Tek adımlık işleyici: sıradaki bir olayı state machine’den geçirir (minimal IRE önceliği).
 * @returns {{ processed: boolean, event?: object, phase: RcilIdentityPhase }}
 */
export function drainRcilQueueOnce() {
  const event = _queue.shift();
  if (!event) return { processed: false, phase: _identityPhase };
  _identityPhase = "reconciling";
  pushTrace({ kind: "reconcile_start", seq: event.seq });
  // Minimal “RRHP placeholder”: tek adımda sealed — gerçek motor RCIL §2–3 ile genişletilir.
  _identityPhase = "sealed";
  pushTrace({ kind: "reconcile_done", seq: event.seq, type: event.type });
  return { processed: true, event, phase: _identityPhase };
}

export function getRcilIdentityPhase() {
  return _identityPhase;
}

export function getRcilQueueDepth() {
  return _queue.length;
}

export function getRcilWiringSnapshot() {
  return {
    schemaVersion: RCIL_EVENT_SCHEMA_VERSION,
    seq: _seq,
    phase: _identityPhase,
    queueDepth: _queue.length,
    traceTail: _trace.slice(-32)
  };
}

/**
 * Phase 2 öncesi: OWIS-1 ile değiştirilecek **minimal projection** yeri tutucusu (trace’e yazar).
 * @see docs/RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md
 */
export function recordMinimalOwisProjection(detail = {}) {
  pushTrace({
    kind: "owis_minimal",
    payload: { ...detail, spec: "OWIS-1" }
  });
  return { ok: true };
}

function shouldPersistLedger(options) {
  if (options.persistLedger === true) return true;
  if (options.persistLedger === false) return false;
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_RCIL_LEDGER_WRITE === "1";
  } catch {
    return false;
  }
}

/**
 * Phase 0–1: tek tick’te küçük **epistemik loop** — minimal OWIS iması → ingest → drain → (isteğe bağlı) Firestore ledger.
 * @param {{ type: string, payload?: unknown, source?: string, orderingKey?: string }} input
 * @param {{ persistLedger?: boolean, owis?: Record<string, unknown> }} [options]
 */
export async function runPhase01EpistemicTick(input = {}, options = {}) {
  recordMinimalOwisProjection({ phase: "W0_gate", ...(options.owis || {}) });
  const ingest = ingestRcilEvent(input);
  if (!ingest.ok) {
    return { ok: false, ingest, drain: { processed: false, phase: _identityPhase }, persisted: false, snapshot: getRcilWiringSnapshot() };
  }
  const drain = drainRcilQueueOnce();
  let persisted = false;
  /** @type {{ ok: boolean, reason?: string } | null} */
  let persistResult = null;
  if (shouldPersistLedger(options) && drain.processed && drain.event) {
    persistResult = await persistRcilEventToFirestore(drain.event);
    persisted = Boolean(persistResult?.ok);
  }
  return {
    ok: true,
    ingest,
    drain,
    persisted,
    persistResult,
    snapshot: getRcilWiringSnapshot()
  };
}

/**
 * Phase 0–1 sonrası ürün sorusu (davranış / his — teori değil).
 * @see docs/RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md §7.3–7.6
 */
export const PHASE01_CONTINUITY_PROMPT =
  "Sistem süreklilik hissi üretiyor mu? — traceTail + kullanıcı akışı + recovery ile yanıtlayın.";

/**
 * Firestore’a tek olay append (auth + rules gerekli). Başarısızlıkta sessiz düşmez — { ok, reason }.
 * @param {object} event ingestRcilEvent öncesi veya sonrası tam event nesnesi
 */
export async function persistRcilEventToFirestore(event) {
  const app = getFirebaseApp();
  if (!app) return { ok: false, reason: "no_firebase" };
  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    const db = getFirestore(app);
    const colRef = collection(db, ...RCIL_EVENT_LEDGER_SEGMENTS);
    await addDoc(colRef, {
      ...event,
      _writtenAt: serverTimestamp()
    });
    pushTrace({ kind: "firestore_persist", seq: event.seq });
    return { ok: true };
  } catch (e) {
    const msg = String(e?.message || e);
    pushTrace({ kind: "firestore_error", message: msg });
    return { ok: false, reason: msg };
  }
}

/**
 * Geliştirici / staging: global snapshot + ingest erişimi (RDVH trace toplama için).
 */
export function installRcilLiveWiringBootHook() {
  if (typeof window === "undefined") return;
  window.__RCIL_LIVE_WIRING__ = {
    version: RCIL_EVENT_SCHEMA_VERSION,
    ingest: ingestRcilEvent,
    drainOnce: drainRcilQueueOnce,
    snapshot: getRcilWiringSnapshot,
    persist: persistRcilEventToFirestore,
    recordOwisMinimal: recordMinimalOwisProjection,
    runPhase01: runPhase01EpistemicTick,
    continuityPrompt: PHASE01_CONTINUITY_PROMPT
  };
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console -- dev-only discoverability (race before dynamic import completes)
    console.info(
      "[RCIL Live Wiring] Hook hazır. Önce: await window.__RCIL_LIVE_WIRING_READY__  sonra: await window.__RCIL_LIVE_WIRING__.runPhase01({ type: \"sandbox_ping\", payload: {} })"
    );
  }
}

/** @internal vitest */
export function __resetRcilLiveWiringForTests() {
  _queue.length = 0;
  _seq = 0;
  _identityPhase = "idle";
  _trace.length = 0;
}
