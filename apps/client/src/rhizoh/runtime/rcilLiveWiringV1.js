/**
 * RCIL Live Wiring — minimal executable loop (Sprint V1).
 * Normatif: docs/RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md · docs/RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md
 *
 * Tek client içi deterministik sıra (monotonic seq). Dağıtık total order bu sprint kapsamı dışında;
 * Firestore yazımı isteğe bağlı — çoklu client için ayrı protokol gerekir.
 */

import { getFirebaseApp } from "../../firebase/castleFirebase.js";
import { logFirestoreRejection } from "../../firebase/captureFirestoreRejectionV1.js";
import {
  applyMinimalRrhpFromRcilEvent,
  getRrhpMinimalProjectionSnapshot,
  __resetRrhpMinimalProjectionForTests
} from "./rcilRrhpMinimalBridgeV1.js";
import { persistRrhpMinimalProjectionMerge } from "./rrhpPersistentProjectionV1.js";

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

/** @type {Set<(e: object) => void>} */
const _rdvhTraceSubscribers = new Set();
const RDVH_WINDOW_TAIL_MAX = 256;

export const RCIL_REPLAY_SNAPSHOT_KIND = "rcil.rdv.replay_snapshot.v1";

function rdvhTraceMirrorToWindowEnabled() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_RDVH_TRACE_STREAM === "1";
  } catch {
    return false;
  }
}

function replayHydrationAllowed() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") return true;
    return import.meta.env?.VITE_RCIL_REPLAY_HYDRATE === "1";
  } catch {
    return false;
  }
}

/**
 * RDVH-oriented trace stream: her `pushTrace` satırı için callback (abone yoksa maliyet yok).
 * @param {(entry: object) => void} onEntry
 * @returns {() => void} unsubscribe
 */
export function subscribeRcilRdvhTrace(onEntry) {
  if (typeof onEntry !== "function") return () => {};
  _rdvhTraceSubscribers.add(onEntry);
  return () => {
    _rdvhTraceSubscribers.delete(onEntry);
  };
}

function pushTrace(entry) {
  const row = { ...entry, t: Date.now() };
  _trace.push(row);
  if (_trace.length > TRACE_MAX) _trace.splice(0, _trace.length - TRACE_MAX);

  if (_rdvhTraceSubscribers.size > 0) {
    for (const fn of _rdvhTraceSubscribers) {
      try {
        fn(row);
      } catch {
        /* dev subscriber — izole */
      }
    }
  }

  if (rdvhTraceMirrorToWindowEnabled() && typeof window !== "undefined") {
    if (!Array.isArray(window.__RCIL_RDVH_TRACE_TAIL__)) window.__RCIL_RDVH_TRACE_TAIL__ = [];
    const w = window.__RCIL_RDVH_TRACE_TAIL__;
    w.push(row);
    if (w.length > RDVH_WINDOW_TAIL_MAX) w.splice(0, w.length - RDVH_WINDOW_TAIL_MAX);
  }
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
  pushTrace({ kind: "reconcile_start", seq: event.seq, source: event.source });
  // Minimal “RRHP placeholder”: tek adımda sealed — gerçek motor RCIL §2–3 ile genişletilir.
  _identityPhase = "sealed";
  pushTrace({ kind: "reconcile_done", seq: event.seq, type: event.type, source: event.source });
  const rrhp = applyMinimalRrhpFromRcilEvent(event);
  pushTrace({
    kind: "rrhp_projection",
    outcome: rrhp.outcome,
    reason: rrhp.reason ?? null,
    seq: event.seq,
    projectionSeq: rrhp.projection?.lastAppliedSeq ?? null
  });
  if (rrhp.outcome === "applied") {
    void persistRrhpMinimalProjectionMerge().catch(() => {
      /* Firestore isteğe bağlı; reconcile akışını bloklamaz */
    });
  }
  return { processed: true, event, phase: _identityPhase, rrhp };
}

/**
 * Kuyruktaki tüm olayları sırayla işler (basit “tam reconcile” döngüsü — tek düğüm sırası).
 * @returns {{ drained: ReturnType<typeof drainRcilQueueOnce>[], phase: RcilIdentityPhase }}
 */
export function drainRcilQueueAll() {
  /** @type {ReturnType<typeof drainRcilQueueOnce>[]} */
  const drained = [];
  while (_queue.length > 0) {
    drained.push(drainRcilQueueOnce());
  }
  if (drained.length > 0) {
    pushTrace({ kind: "reconcile_cycle_done", count: drained.length });
    _identityPhase = "idle";
  }
  return { drained, phase: _identityPhase };
}

/**
 * Kontrollü basınç: toplu ingest → tek reconcile pasında boşalt (Firestore yoksa bile deterministik sıra).
 *
 * **Risk (RDVH):** yüksek `count` + export/fingerprint birlikte kullanılırsa trace “noise”a döner; RCIL bir
 * logging motoruna indirgenir. Büyük koşularda `rdvPressureAck: true` verin; parmak izi için
 * `getRcilContinuityFingerprint({ semantics: "operational_only" })` düşünün.
 *
 * @param {{ count?: number, typePrefix?: string, persistLedger?: boolean, rdvPressureAck?: boolean }} [opts]
 */
export async function runRcilControlledPressureLoop(opts = {}) {
  const raw = opts.count ?? 20;
  const count = Math.min(5000, Math.max(0, Math.floor(Number(raw)) || 0));
  const typePrefix = String(opts.typePrefix || "pressure").trim() || "pressure";
  const persist = opts.persistLedger === true || shouldPersistLedger(opts);

  const PRESSURE_WARN_AFTER = 100;
  if (import.meta.env?.DEV && count > PRESSURE_WARN_AFTER && opts.rdvPressureAck !== true) {
    // eslint-disable-next-line no-console -- açık uyarı: kontrolsüz trace → fingerprint gürültüsü
    console.warn(
      `[RCIL] runPressureLoop count=${count} > ${PRESSURE_WARN_AFTER} without rdvPressureAck:true — trace dominates; fingerprint/export may be misleading (logging-engine skew).`
    );
  }

  const ingested = [];
  for (let i = 0; i < count; i += 1) {
    ingested.push(ingestRcilEvent({ type: `${typePrefix}_${i}`, payload: { i }, source: "pressure_loop" }));
  }
  const { drained, phase } = drainRcilQueueAll();

  let persisted = 0;
  /** @type {unknown[]} */
  const persistErrors = [];
  if (persist) {
    for (const d of drained) {
      if (d.processed && d.event) {
        const pr = await persistRcilEventToFirestore(d.event);
        if (pr?.ok) persisted += 1;
        else persistErrors.push(pr?.reason || "persist_fail");
      }
    }
  }

  return {
    ok: true,
    count,
    ingestedOk: ingested.filter((x) => x.ok).length,
    drainedCount: drained.length,
    phase,
    persisted,
    persistErrors: persistErrors.slice(0, 8),
    snapshot: getRcilWiringSnapshot()
  };
}

export function getRcilIdentityPhase() {
  return _identityPhase;
}

export function getRcilQueueDepth() {
  return _queue.length;
}

/**
 * RDVH / RCIL trace satırı: sentetik basınç mı, operasyonel akış mı (parmak izi gürültüsünü ayırmak için).
 * Dağıtık kimlik sistemi değil — yalnızca tek düğüm içi sezgisel sınıf.
 * @param {object} row
 * @returns {"operational" | "synthetic_pressure" | "unknown"}
 */
export function classifyRcilRdvhTraceTier(row) {
  if (!row || typeof row !== "object") return "unknown";
  const src = row.source ?? row.event?.source;
  if (src === "pressure_loop") return "synthetic_pressure";
  if (typeof src === "string" && src.length > 0) return "operational";
  return "unknown";
}

/**
 * Çok-oturum / RDVH karşılaştırması için hafif parmak izi (kriptografik değil).
 * Basınç sonrası anlamlı karşılaştırma için `semantics: "operational_only"` kullanın.
 * @param {{ semantics?: "full_tail" | "operational_only" }} [options]
 */
export function getRcilContinuityFingerprint(options = {}) {
  const semantics = options.semantics === "operational_only" ? "operational_only" : "full_tail";
  let tail = _trace.slice(-64);
  if (semantics === "operational_only") {
    tail = tail.filter((e) => classifyRcilRdvhTraceTier(e) !== "synthetic_pressure");
  }
  const tailSig = tail.map((e) => `${e.kind}:${e.seq ?? ""}:${e.event?.type ?? e.type ?? ""}`).join(";");
  return `v${RCIL_EVENT_SCHEMA_VERSION}|seq=${_seq}|phase=${_identityPhase}|qd=${_queue.length}|${tailSig}`;
}

/**
 * Operational-only RDVH tail (continuity probe için). Kimlik kanıtı değil — gözlemsel alt küme.
 * @param {number} [max]
 */
export function getRcilOperationalOnlyTraceTail(max = 48) {
  const n = Math.min(128, Math.max(8, Math.floor(max) || 48));
  return _trace.filter((e) => classifyRcilRdvhTraceTier(e) !== "synthetic_pressure").slice(-n);
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
 * Replay / denetim için tam iç durum (JSON olarak saklanabilir).
 * @param {{ traceMax?: number, continuitySemantics?: "full_tail" | "operational_only" }} [options]
 */
export function exportRcilReplaySnapshot(options = {}) {
  const traceMax = Math.min(Math.max(8, options.traceMax ?? TRACE_MAX), TRACE_MAX);
  const contSem = options.continuitySemantics === "operational_only" ? "operational_only" : "full_tail";
  return {
    kind: RCIL_REPLAY_SNAPSHOT_KIND,
    exportedAt: Date.now(),
    schemaVersion: RCIL_EVENT_SCHEMA_VERSION,
    seq: _seq,
    phase: _identityPhase,
    queue: _queue.map((e) => ({ ...e })),
    trace: _trace.slice(-traceMax).map((e) => ({ ...e })),
    continuityFingerprint: getRcilContinuityFingerprint({ semantics: contSem }),
    continuitySemantics: contSem
  };
}

/**
 * **Yalnızca** vitest veya `VITE_RCIL_REPLAY_HYDRATE=1` (dev) iken — üretimde kapalı.
 * @returns {{ ok: boolean, error?: string }}
 */
export function hydrateRcilFromReplaySnapshot(snapshot) {
  if (!replayHydrationAllowed()) return { ok: false, error: "hydration_disabled" };
  if (!snapshot || snapshot.kind !== RCIL_REPLAY_SNAPSHOT_KIND) return { ok: false, error: "bad_snapshot" };
  if (Number(snapshot.schemaVersion) !== RCIL_EVENT_SCHEMA_VERSION) return { ok: false, error: "schema_mismatch" };

  _queue.length = 0;
  const q = Array.isArray(snapshot.queue) ? snapshot.queue : [];
  for (const e of q) {
    if (e && typeof e === "object") _queue.push({ ...e });
  }
  _seq = Math.max(0, Math.floor(Number(snapshot.seq)) || 0);
  const ph = String(snapshot.phase || "idle");
  _identityPhase =
    ph === "idle" || ph === "ingested" || ph === "reconciling" || ph === "sealed" ? /** @type {RcilIdentityPhase} */ (ph) : "idle";
  _trace.length = 0;
  const tr = Array.isArray(snapshot.trace) ? snapshot.trace : [];
  for (const row of tr) {
    if (row && typeof row === "object") _trace.push({ ...row });
  }
  return { ok: true };
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
    logFirestoreRejection("rcil_event_ledger_addDoc", e, {
      path: "castle/genesis/v1/runtime/rcil_events",
      seq: event?.seq != null ? Number(event.seq) : null
    });
    return { ok: false, reason: msg };
  }
}

/**
 * Geliştirici / staging: global snapshot + ingest erişimi (RDVH trace toplama için).
 */
function downloadJsonInBrowser(filename, data) {
  if (typeof document === "undefined") return { ok: false, reason: "no_document" };
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "rcil-replay-snapshot.json";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

export function installRcilLiveWiringBootHook() {
  if (typeof window === "undefined") return;
  window.__RCIL_LIVE_WIRING__ = {
    version: RCIL_EVENT_SCHEMA_VERSION,
    ingest: ingestRcilEvent,
    drainOnce: drainRcilQueueOnce,
    drainQueueAll: drainRcilQueueAll,
    snapshot: getRcilWiringSnapshot,
    persist: persistRcilEventToFirestore,
    recordOwisMinimal: recordMinimalOwisProjection,
    runPhase01: runPhase01EpistemicTick,
    runPressureLoop: runRcilControlledPressureLoop,
    subscribeRdvhTrace: subscribeRcilRdvhTrace,
    exportReplaySnapshot: exportRcilReplaySnapshot,
    getContinuityFingerprint: getRcilContinuityFingerprint,
    classifyRdvhTraceTier: classifyRcilRdvhTraceTier,
    hydrateFromReplaySnapshot: hydrateRcilFromReplaySnapshot,
    downloadReplaySnapshot: (name) =>
      downloadJsonInBrowser(name || `rcil-replay-${Date.now()}.json`, exportRcilReplaySnapshot()),
    getRrhpProjection: getRrhpMinimalProjectionSnapshot,
    persistRrhpProjectionMerge: () => persistRrhpMinimalProjectionMerge(),
    restoreRrhpPersistentProjection: (opts) =>
      import("./rrhpPersistentProjectionV1.js").then((m) => m.restoreRrhpPersistentProjectionFromFirestore(opts || {})),
    runOperationalContinuityProbe: (inp) =>
      import("./operationalContinuityProbeV1.js").then((m) => m.runOperationalContinuityProbeV1(inp || {})),
    formatContinuityMarkdownReport: (probeResult) =>
      import("./continuityAssessmentExportV1.js").then((m) =>
        Promise.resolve(m.formatContinuityProbeReportMarkdown(probeResult || {}))
      ),
    buildContinuitySuggestions: (probeResult) =>
      import("./continuityAssessmentExportV1.js").then((m) =>
        Promise.resolve(m.buildContinuityReconciliationSuggestions(probeResult || {}))
      ),
    continuityPrompt: PHASE01_CONTINUITY_PROMPT
  };
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console -- dev-only discoverability (race before dynamic import completes)
    console.info(
      "[RCIL Live Wiring] Hook hazır. await window.__RCIL_LIVE_WIRING_READY__ → runPhase01 / runPressureLoop / subscribeRdvhTrace / exportReplaySnapshot / downloadReplaySnapshot (VITE_RDVH_TRACE_STREAM=1 → window.__RCIL_RDVH_TRACE_TAIL__)"
    );
  }
}

/** @internal vitest */
export function __resetRcilLiveWiringForTests() {
  _queue.length = 0;
  _seq = 0;
  _identityPhase = "idle";
  _trace.length = 0;
  _rdvhTraceSubscribers.clear();
  __resetRrhpMinimalProjectionForTests();
}
