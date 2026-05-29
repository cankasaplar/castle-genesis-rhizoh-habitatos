/**
 * Phase 9.4.3 — Epistemic Event Bus (Epistemic Perceptual Causality Layer).
 *
 * Propagates observation-plane physics events; does NOT write execution state.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15.3
 */

import { EPISTEMIC_PHYSICS_EVENT_KIND_V0 } from "./epistemicPhysicsEventContractV0.js";
import {
  OBSERVER_TELEMETRY_EVENT_KIND_V0,
  OBSERVER_TELEMETRY_SCHEMA_V0
} from "./epistemicObserverTelemetryContractV0.js";

export const EPISTEMIC_EVENT_BUS_SCHEMA_V0 = "castle.rhizoh.epistemic_event_bus.v0.4.3";

export const EPISTEMIC_EVENT_CLASS_V0 = Object.freeze({
  PHYSICS: "physics",
  OBSERVER: "observer"
});

export const EPISTEMIC_EVENT_ENVELOPE_SCHEMA_V0 =
  "castle.rhizoh.epistemic_physics_event.envelope.v0.4.3";

export const EPISTEMIC_CAUSAL_LAYER_V0 = "epistemic_perceptual_causality";

/** @typedef {(envelope: import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0) => void} EpistemicEventBusListenerV0 */

/**
 * @typedef {Object} EpistemicEventEnvelopeV0
 * @property {string} schema
 * @property {number} seq
 * @property {number} atMs
 * @property {number} atFrame
 * @property {string} plane
 * @property {string} causalLayer
 * @property {string} eventClass
 * @property {string} kind
 * @property {string} nodeId
 * @property {number} severity
 * @property {string} statement
 * @property {boolean} readOnly
 * @property {boolean} truthCollapsed
 * @property {boolean} witnessWrite
 * @property {boolean} feedbackLoop
 * @property {string|null} focusNodeId
 * @property {string|null} stabilizationMode
 * @property {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicNavigationPhysicsV0|null} physicsSnapshot
 * @property {import('./epistemicObserverTelemetryContractV0.js').ObserverActionPayloadV0|null} observerAction
 */

const MAX_TRACE_V0 = 256;
const DEDUPE_FRAME_WINDOW_V0 = 1;
const OBSERVER_DEDUPE_MS_V0 = 120;

/** @type {EpistemicEventEnvelopeV0[]} */
let traceV0 = [];

/** @type {Set<EpistemicEventBusListenerV0>} */
const listenersV0 = new Set();

let seqV0 = 0;

/** @type {Map<string, number>} */
const lastEmitFrameByKeyV0 = new Map();

/** @type {Map<string, number>} */
const lastObserverEmitMsByKeyV0 = new Map();

let enabledV0 = false;

/**
 * @param {boolean} on
 */
export function setEpistemicEventBusEnabledV0(on) {
  enabledV0 = on === true;
  if (!enabledV0) {
    clearEpistemicEventBusV0();
  }
}

export function isEpistemicEventBusEnabledV0() {
  return enabledV0;
}

/**
 * @param {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicPhysicsEventV0} raw
 * @param {{
 *   atFrame?: number,
 *   focusNodeId?: string | null,
 *   stabilizationMode?: string | null,
 *   physicsSnapshot?: import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicNavigationPhysicsV0 | null
 * }} ctx
 */
export function buildEpistemicEventEnvelopeV0(raw, ctx = {}) {
  const frame = Number(ctx.atFrame ?? raw.atFrame) || 0;
  seqV0 += 1;

  const envelope = Object.freeze({
    schema: EPISTEMIC_EVENT_ENVELOPE_SCHEMA_V0,
    seq: seqV0,
    atMs: Date.now(),
    atFrame: frame,
    plane: "observation",
    causalLayer: EPISTEMIC_CAUSAL_LAYER_V0,
    eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
    kind: String(raw.kind || ""),
    nodeId: String(raw.nodeId || "node:unknown"),
    severity: Math.min(1, Math.max(0, Number(raw.severity) || 0)),
    statement: String(raw.statement || ""),
    readOnly: true,
    truthCollapsed: false,
    witnessWrite: false,
    feedbackLoop: false,
    focusNodeId: ctx.focusNodeId ?? raw.nodeId ?? null,
    stabilizationMode: ctx.stabilizationMode ?? null,
    physicsSnapshot: ctx.physicsSnapshot ?? null,
    observerAction: null
  });

  return envelope;
}

function shouldDedupeEnvelopeV0(envelope) {
  if (envelope.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER) {
    const obs = envelope.observerAction;
    const key = `${obs?.action || ""}|${obs?.source || ""}|${envelope.nodeId}`;
    const now = envelope.atMs;
    const lastMs = lastObserverEmitMsByKeyV0.get(key);
    if (lastMs !== undefined && now - lastMs < OBSERVER_DEDUPE_MS_V0) return true;
    lastObserverEmitMsByKeyV0.set(key, now);
    return false;
  }
  const key = `${envelope.kind}|${envelope.nodeId}`;
  const lastFrame = lastEmitFrameByKeyV0.get(key);
  if (lastFrame !== undefined && envelope.atFrame - lastFrame <= DEDUPE_FRAME_WINDOW_V0) {
    return true;
  }
  lastEmitFrameByKeyV0.set(key, envelope.atFrame);
  return false;
}

/**
 * @param {{
 *   action: string,
 *   source?: string,
 *   targetNodeId?: string | null,
 *   meta?: Record<string, unknown>,
 *   atFrame?: number,
 *   focusNodeId?: string | null,
 *   stabilizationMode?: string | null
 * }} input
 * @returns {EpistemicEventEnvelopeV0}
 */
export function buildObserverActionEnvelopeV0(input) {
  const frame = Number(input.atFrame) || 0;
  const nodeId = String(input.targetNodeId || input.focusNodeId || "node:observer");
  seqV0 += 1;

  /** @type {ObserverActionPayloadV0} */
  const observerAction = Object.freeze({
    schema: OBSERVER_TELEMETRY_SCHEMA_V0,
    action: String(input.action || ""),
    source: String(input.source || "observer_ui"),
    meta: input.meta && typeof input.meta === "object" ? { ...input.meta } : {},
    witnessWrite: false,
    feedbackLoop: false
  });

  return Object.freeze({
    schema: EPISTEMIC_EVENT_ENVELOPE_SCHEMA_V0,
    seq: seqV0,
    atMs: Date.now(),
    atFrame: frame,
    plane: "observation",
    causalLayer: EPISTEMIC_CAUSAL_LAYER_V0,
    eventClass: EPISTEMIC_EVENT_CLASS_V0.OBSERVER,
    kind: OBSERVER_TELEMETRY_EVENT_KIND_V0.OBSERVER_ACTION,
    nodeId,
    severity: 0,
    statement: `Observer action: ${observerAction.action} (${observerAction.source})`,
    readOnly: true,
    truthCollapsed: false,
    witnessWrite: false,
    feedbackLoop: false,
    focusNodeId: input.focusNodeId ?? null,
    stabilizationMode: input.stabilizationMode ?? null,
    physicsSnapshot: null,
    observerAction
  });
}

/**
 * @param {Parameters<typeof buildObserverActionEnvelopeV0>[0]} input
 * @returns {EpistemicEventEnvelopeV0|null}
 */
export function publishObserverActionEnvelopeV0(input) {
  if (!enabledV0 || !input?.action) return null;

  const envelope = buildObserverActionEnvelopeV0(input);
  if (shouldDedupeEnvelopeV0(envelope)) return null;

  appendTraceV0(envelope);
  notifyListenersV0(envelope);
  syncWindowBusMirrorV0();
  return envelope;
}

function appendTraceV0(envelope) {
  traceV0.push(envelope);
  if (traceV0.length > MAX_TRACE_V0) {
    traceV0 = traceV0.slice(-MAX_TRACE_V0);
  }
}

function notifyListenersV0(envelope) {
  for (const fn of listenersV0) {
    try {
      fn(envelope);
    } catch {
      /* observation bus must not break prod */
    }
  }
}

/**
 * @param {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicPhysicsEventV0} raw
 * @param {Parameters<typeof buildEpistemicEventEnvelopeV0>[1]} ctx
 * @returns {EpistemicEventEnvelopeV0|null}
 */
export function publishEpistemicPhysicsEventV0(raw, ctx = {}) {
  if (!enabledV0 || !raw?.kind) return null;

  const envelope = buildEpistemicEventEnvelopeV0(raw, ctx);
  if (shouldDedupeEnvelopeV0(envelope)) return null;

  appendTraceV0(envelope);
  notifyListenersV0(envelope);
  syncWindowBusMirrorV0();
  return envelope;
}

/**
 * @param {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicPhysicsEventV0[]} events
 * @param {Parameters<typeof buildEpistemicEventEnvelopeV0>[1]} ctx
 * @returns {EpistemicEventEnvelopeV0[]}
 */
export function publishEpistemicPhysicsEventsBatchV0(events, ctx = {}) {
  if (!enabledV0 || !Array.isArray(events)) return [];
  const published = [];
  for (const ev of events) {
    const env = publishEpistemicPhysicsEventV0(ev, ctx);
    if (env) published.push(env);
  }
  return published;
}

/**
 * @param {EpistemicEventBusListenerV0} listener
 * @returns {() => void}
 */
export function subscribeEpistemicEventBusV0(listener) {
  if (typeof listener !== "function") return () => {};
  listenersV0.add(listener);
  return () => {
    listenersV0.delete(listener);
  };
}

/**
 * @returns {readonly EpistemicEventEnvelopeV0[]}
 */
export function getEpistemicEventTraceV0() {
  return traceV0;
}

/**
 * @returns {{ schema: string, enabled: boolean, seqHead: number, traceLength: number, kinds: string[] }}
 */
export function getEpistemicEventBusStatusV0() {
  const kinds = new Set(traceV0.map((e) => e.kind));
  return {
    schema: EPISTEMIC_EVENT_BUS_SCHEMA_V0,
    enabled: enabledV0,
    seqHead: seqV0,
    traceLength: traceV0.length,
    kinds: [...kinds]
  };
}

/**
 * Replayable export for CI / debug (no execution mutation).
 */
export function exportEpistemicEventTraceJsonV0() {
  return JSON.stringify(
    {
      schema: EPISTEMIC_EVENT_BUS_SCHEMA_V0,
      causalLayer: EPISTEMIC_CAUSAL_LAYER_V0,
      readOnly: true,
      events: traceV0
    },
    null,
    2
  );
}

export function clearEpistemicEventBusV0() {
  traceV0 = [];
  listenersV0.clear();
  lastEmitFrameByKeyV0.clear();
  lastObserverEmitMsByKeyV0.clear();
  seqV0 = 0;
  syncWindowBusMirrorV0();
}

function syncWindowBusMirrorV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh_epistemic_event_bus = {
    schema: EPISTEMIC_EVENT_BUS_SCHEMA_V0,
    enabled: enabledV0,
    status: getEpistemicEventBusStatusV0(),
    trace: getEpistemicEventTraceV0(),
    kinds: EPISTEMIC_PHYSICS_EVENT_KIND_V0,
    observerTelemetry: OBSERVER_TELEMETRY_EVENT_KIND_V0
  };
}

export function resetEpistemicEventBusForTestsV0() {
  enabledV0 = false;
  clearEpistemicEventBusV0();
  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_epistemic_event_bus;
    } catch {
      /* noop */
    }
  }
}
