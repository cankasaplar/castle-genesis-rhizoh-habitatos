/**
 * Read-Only Hook v0 — three-plane model.
 * observe() → observation plane ONLY. NEVER causal graph / identity / learning.
 * @see docs/RHIZOH_READ_ONLY_HOOK_V0.md
 */

import {
  isEpistemicConsumeOnlyPassV0,
  runEpistemicConsumeOnlyPassV0,
  detectEpistemicEchoLoopV0
} from "./epistemicInvocationGuardV0.js";

export const OBSERVER_PLANE_V0 = Object.freeze({
  CAUSAL: "causal_plane_immutable",
  OBSERVATION: "observation_plane_shadow",
  NARRATIVE: "narrative_plane_derived",
  MEANING_LEDGER: "meaning_resonance_ledger_non_authoritative",
  ATTENTION_SEDIMENT: "attention_sediment_shadow_d_non_causal"
});

export const OBSERVER_TRACE_ENTRY_SCHEMA_V0 = "castle.rhizoh.observer_trace_entry.v0";

/** Hard boundary — observer trace must never feed these sinks. */
export const OBSERVER_TRACE_EXCLUDED_SINKS_V0 = Object.freeze([
  "learning_loops",
  "identity_updates",
  "causal_compression",
  "identity_event_log",
  "wal_seal_chain"
]);

const TRACE_STORAGE_KEY_V0 = "rhizoh.observer_trace.v0";
const MAX_ENTRIES_V0 = 256;

/**
 * @param {object} event
 * @param {string} event.type
 * @param {string} [event.target]
 * @param {{ focus?: number, surface?: string, meta?: Record<string, unknown> }} [event.meta]
 */
export function observeV0(event) {
  if (isEpistemicConsumeOnlyPassV0()) {
    return Object.freeze({
      schema: OBSERVER_TRACE_ENTRY_SCHEMA_V0,
      rejected: true,
      reason: "invocation_asymmetry",
      plane: OBSERVER_PLANE_V0.OBSERVATION,
      interpretationOnly: true,
      influencesCausalGraph: false,
      influencesIdentity: false,
      isAgenticInput: false
    });
  }

  const type = String(event?.type || "unknown").slice(0, 64);
  const target = String(event?.target || "").slice(0, 128);
  const intensity = Math.min(1, Math.max(0, Number(event?.meta?.focus ?? 0.1) || 0.1));

  const entry = Object.freeze({
    schema: OBSERVER_TRACE_ENTRY_SCHEMA_V0,
    ts: Date.now(),
    type,
    target,
    intensity,
    plane: OBSERVER_PLANE_V0.OBSERVATION,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    readOnly: true,
    influencesExecution: false,
    influencesIdentity: false,
    influencesCausalGraph: false,
    isAgenticInput: false
  });

  appendObserverTraceEntryV0(entry);

  const surface = event?.meta?.surface;
  if (surface) {
    void import("./visitorEpistemicTraceV0.js")
      .then((m) => m.recordVisitorSurfaceV0(String(surface)))
      .catch(() => {});
  }

  return entry;
}

/**
 * @param {ReturnType<typeof observeV0>} entry
 */
function appendObserverTraceEntryV0(entry) {
  const row = readObserverTraceRowV0();
  const entries = [...(row?.entries || []), entry].slice(-MAX_ENTRIES_V0);
  const next = Object.freeze({
    schema: "castle.rhizoh.observer_trace.v0",
    plane: OBSERVER_PLANE_V0.OBSERVATION,
    entries: Object.freeze(entries),
    count: entries.length,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    isMemory: false,
    isIdentity: false
  });
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TRACE_STORAGE_KEY_V0, JSON.stringify(next));
    }
  } catch {
    /* noop */
  }
  syncObserverTraceWindowV0(next);
  return next;
}

function readObserverTraceRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRACE_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getObserverTraceSnapshotV0() {
  const row = readObserverTraceRowV0();
  if (row) return Object.freeze({ ...row, interpretationOnly: true });
  return Object.freeze({
    schema: "castle.rhizoh.observer_trace.v0",
    plane: OBSERVER_PLANE_V0.OBSERVATION,
    entries: Object.freeze([]),
    count: 0,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    isMemory: false,
    isIdentity: false
  });
}

export function clearObserverTraceForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(TRACE_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

/**
 * Test-only — inject trace rows with explicit timestamps (no synthetic observe loop).
 * @param {readonly object[]} rows
 */
export function injectObserverTraceEntriesForTestV0(rows) {
  const base = Date.now() - 180_000;
  const entries = (rows || []).map((row, i) =>
    Object.freeze({
      schema: OBSERVER_TRACE_ENTRY_SCHEMA_V0,
      ts: row.ts ?? base + i * 30_000,
      type: String(row.type || "unknown").slice(0, 64),
      target: String(row.target || "").slice(0, 128),
      intensity: Math.min(1, Math.max(0, Number(row.intensity ?? row.meta?.focus ?? 0.1) || 0.1)),
      plane: OBSERVER_PLANE_V0.OBSERVATION,
      meta: row.meta ?? null,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
      interpretationOnly: true,
      readOnly: true,
      influencesExecution: false,
      influencesIdentity: false,
      influencesCausalGraph: false,
      isAgenticInput: false,
      testInjected: true
    })
  );
  const next = Object.freeze({
    schema: "castle.rhizoh.observer_trace.v0",
    plane: OBSERVER_PLANE_V0.OBSERVATION,
    entries: Object.freeze(entries),
    count: entries.length,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    isMemory: false,
    isIdentity: false
  });
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TRACE_STORAGE_KEY_V0, JSON.stringify(next));
    }
  } catch {
    /* noop */
  }
  syncObserverTraceWindowV0(next);
  return next;
}

function syncObserverTraceWindowV0(row) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh_observer_trace = row;
  if (!window.__rhizoh.observerTrace) {
    window.__rhizoh.observerTrace = Object.freeze({
      push: observeV0,
      observe: observeV0,
      snapshot: getObserverTraceSnapshotV0,
      clear: clearObserverTraceForTestV0,
      plane: OBSERVER_PLANE_V0.OBSERVATION,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0
    });
  }
}

export function mountObserverReadOnlyHookV0() {
  if (typeof window === "undefined") return;
  syncObserverTraceWindowV0(getObserverTraceSnapshotV0());
  window.__rhizoh.observe = observeV0;
}

export function installObserverReadOnlyHookWireV0() {
  if (typeof window === "undefined") return;
  mountObserverReadOnlyHookV0();

  window.addEventListener("rhizoh:invite-proceed-v0", () => {
    observeV0({ type: "invite_proceed", target: "chat", meta: { surface: "chat", focus: 0.2 } });
  });

  window.addEventListener("rhizoh:map-camera-feedback-v0", (ev) => {
    const d = ev?.detail || {};
    observeV0({
      type: "map_camera",
      target: d.action || "fly_to",
      meta: { surface: "map", focus: 0.35 }
    });
  });
}
