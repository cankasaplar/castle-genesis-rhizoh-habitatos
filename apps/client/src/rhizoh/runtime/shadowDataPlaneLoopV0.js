/**
 * Shadow Data-plane Loop v0 — Castle A → bus → UGL interpret → Castle B projection.
 * RESEARCH-ONLY — Phase A shadow nervous system; not production data-plane.
 * @see docs/RHIZOH_SHADOW_DATA_PLANE_V0.md
 */

import {
  SHADOW_CASTLE_BUS_EVENT_V0,
  SHADOW_CASTLE_EVENT_TYPE_V0,
  emitShadowCastleEventV0,
  getShadowCastleEventBusSnapshotV0,
  readShadowCastleEventRingV0
} from "./shadowCastleEventBusV0.js";
import { ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 } from "./worldMapOriginHomePinV0.js";
import { resolveDomainDescriptorV0 } from "./rhizohDomainFabricV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const SHADOW_DATA_PLANE_SCHEMA_V0 = "castle.rhizoh.shadow_data_plane.v0";
export const SHADOW_CASTLE_REACTION_EVENT_V0 = "rhizoh:shadow-castle-reaction-v0";
export const SHADOW_CASTLE_PIN_PULSE_EVENT_V0 = "rhizoh:shadow-castle-pin-pulse-v0";

export const PEER_CASTLE_SIM_ID_V0 = "peer_castle_sim_istanbul";
export const PEER_CASTLE_SIM_COORDS_V0 = Object.freeze({
  lat: 41.0488,
  lon: 29.0245
});

/** @type {Map<string, { untilMs: number, sourceEventId: string }>} */
const activePinPulsesV0 = new Map();
/** @type {Set<() => void>} */
const pinPulseListenersV0 = new Set();
/** @type {object[]} */
const reactionTraceV0 = [];
/** @type {((event: object) => void) | null} */
let busListenerV0 = null;
/** @type {ReturnType<typeof setInterval> | null} */
let pulsePruneTimerV0 = null;
let loopStartedV0 = false;

function notifyPinPulseListenersV0() {
  for (const fn of pinPulseListenersV0) {
    try {
      fn();
    } catch {
      /* noop */
    }
  }
}

function pruneExpiredPinPulsesV0() {
  const now = Date.now();
  let changed = false;
  for (const [pinId, row] of activePinPulsesV0) {
    if (!row || row.untilMs <= now) {
      activePinPulsesV0.delete(pinId);
      changed = true;
    }
  }
  if (changed) notifyPinPulseListenersV0();
}

/**
 * @param {string} pinId
 */
export function readShadowCastlePinPulseActiveV0(pinId) {
  pruneExpiredPinPulsesV0();
  const row = activePinPulsesV0.get(String(pinId || ""));
  return Boolean(row && row.untilMs > Date.now());
}

/**
 * @param {() => void} fn
 */
export function subscribeShadowCastlePinPulseV0(fn) {
  pinPulseListenersV0.add(fn);
  return () => pinPulseListenersV0.delete(fn);
}

/**
 * @param {{ pinId: string, untilMs?: number, sourceEventId?: string, durationMs?: number }} row
 */
export function applyShadowCastlePinPulseV0(row = {}) {
  const pinId = String(row.pinId || "");
  if (!pinId) return null;
  const untilMs = Number.isFinite(Number(row.untilMs))
    ? Number(row.untilMs)
    : Date.now() + Math.max(500, Number(row.durationMs) || 4500);
  const pulse = Object.freeze({
    pinId,
    untilMs,
    sourceEventId: String(row.sourceEventId || "shadow_pulse"),
    atMs: Date.now()
  });
  activePinPulsesV0.set(pinId, pulse);
  notifyPinPulseListenersV0();
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(SHADOW_CASTLE_PIN_PULSE_EVENT_V0, { detail: pulse }));
  }
  return pulse;
}

/**
 * Sim peer castle pin for Phase A demo (always visible on /world/space when loop booted).
 */
export function buildShadowPeerCastleSimNodeV0() {
  return Object.freeze({
    id: PEER_CASTLE_SIM_ID_V0,
    name: "Peer Castle · Istanbul Sim",
    label: "PEER CASTLE",
    type: "remote_castle",
    lat: PEER_CASTLE_SIM_COORDS_V0.lat,
    lon: PEER_CASTLE_SIM_COORDS_V0.lon,
    color: "#38bdf8",
    owner: "Shadow",
    description: "Shadow data-plane peer · event reaction target",
    shadowPeerSim: true,
    shadowPulseActive: readShadowCastlePinPulseActiveV0(PEER_CASTLE_SIM_ID_V0)
  });
}

/**
 * @param {object} event
 */
export function interpretShadowCastleEventV0(event) {
  const type = String(event?.type || "");
  const payload = event?.payload || {};
  const scalar = Math.max(0, Math.min(1, Number(payload.scalar) || 0.5));
  const domain = resolveDomainDescriptorV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS);

  let meaning = "neutral_echo";
  let reactionKind = "map_pin_pulse";
  let atmosphere = "steady";

  if (type === SHADOW_CASTLE_EVENT_TYPE_V0.RESOURCE_DISCOVERED) {
    meaning = scalar >= 0.55 ? "positive_discovery" : "muted_discovery";
    reactionKind = "atmosphere_warm";
    atmosphere = scalar >= 0.55 ? "warm" : "calm";
  } else if (type === SHADOW_CASTLE_EVENT_TYPE_V0.ATMOSPHERE_SHIFT) {
    meaning = "atmosphere_shift";
    reactionKind = "atmosphere_echo";
    atmosphere = String(payload.atmosphere || "shift");
  }

  return Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.interpretation`,
    eventId: event?.eventId || null,
    meaning,
    reactionKind,
    atmosphere,
    confidence: Number(scalar.toFixed(3)),
    uglRoute: Object.freeze({
      domainId: domain.domainId,
      coverage: domain.coverage,
      adapterId: domain.adapterId
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} interpreted
 * @param {object} event
 */
export function projectShadowCastleReactionV0(interpreted, event) {
  const toCastleId = String(
    event?.toCastleId || PEER_CASTLE_SIM_ID_V0
  );
  const pinId = toCastleId.startsWith("remote_castle_") ? toCastleId : toCastleId;
  const pulse = applyShadowCastlePinPulseV0({
    pinId,
    sourceEventId: String(event?.eventId || "shadow"),
    durationMs: 5000
  });

  return Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.reaction`,
    eventId: event?.eventId || null,
    fromCastleId: String(event?.fromCastleId || ORIGIN_HOME_SERENCEBEY_PIN_ID_V0),
    toCastleId,
    meaning: interpreted.meaning,
    reactionKind: interpreted.reactionKind,
    atmosphere: interpreted.atmosphere,
    mapPinPulse: pulse,
    toast: Object.freeze({
      tr: `Peer Kale tepki: ${interpreted.meaning}`,
      en: `Peer Castle reaction: ${interpreted.meaning}`
    }),
    interpretationOnly: true,
    nonExecutive: true,
    realityMutationPermitted: false
  });
}

/**
 * @param {object} event
 */
export function processShadowCastleEventV0(event) {
  const interpreted = interpretShadowCastleEventV0(event);
  const reaction = projectShadowCastleReactionV0(interpreted, event);
  const trace = Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.trace`,
    event,
    interpreted,
    reaction,
    atMs: Date.now()
  });
  reactionTraceV0.unshift(trace);
  if (reactionTraceV0.length > 32) reactionTraceV0.length = 32;
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(SHADOW_CASTLE_REACTION_EVENT_V0, { detail: trace }));
  }
  return trace;
}

export function inspectShadowDataPlaneV0() {
  pruneExpiredPinPulsesV0();
  const ring = readShadowCastleEventRingV0(16);
  const lastTrace = reactionTraceV0[0] || null;
  return Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.inspect`,
    phase: "A_shadow",
    loopStarted: loopStartedV0,
    bus: getShadowCastleEventBusSnapshotV0(),
    lastTrace,
    recentTraces: Object.freeze(reactionTraceV0.slice(0, 4)),
    activePinPulses: Object.freeze(
      [...activePinPulsesV0.entries()].map(([pinId, row]) =>
        Object.freeze({ pinId, untilMs: row.untilMs, sourceEventId: row.sourceEventId })
      )
    ),
    peerSim: buildShadowPeerCastleSimNodeV0(),
    readOnly: true,
    realityMutationPermitted: false,
    atMs: Date.now()
  });
}

/**
 * Demo helper — Castle A discovers resource → Castle B reacts.
 * @param {object} [opts]
 */
export function demoCastleToCastleEventLoopV0(opts = {}) {
  const event = emitShadowCastleEventV0({
    type: SHADOW_CASTLE_EVENT_TYPE_V0.RESOURCE_DISCOVERED,
    fromCastleId: String(opts.fromCastleId || ORIGIN_HOME_SERENCEBEY_PIN_ID_V0),
    toCastleId: String(opts.toCastleId || PEER_CASTLE_SIM_ID_V0),
    payload: Object.freeze({
      resourceId: String(opts.resourceId || "crystal_alpha"),
      scalar: Number.isFinite(Number(opts.scalar)) ? Number(opts.scalar) : 0.82
    }),
    source: String(opts.source || "shadow_demo")
  });
  if (!loopStartedV0) {
    processShadowCastleEventV0(event);
  }
  return Object.freeze({
    ok: true,
    event,
    trace: reactionTraceV0[0] || null,
    inspect: inspectShadowDataPlaneV0()
  });
}

export function publishShadowDataPlaneDevtoolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowDataPlane = inspectShadowDataPlaneV0;
  window.__rhizoh.emitShadowCastleEventV0 = (row) => {
    const event = emitShadowCastleEventV0(row);
    if (!loopStartedV0) {
      processShadowCastleEventV0(event);
    }
    return inspectShadowDataPlaneV0();
  };
  window.__rhizoh.demoCastleToCastleEventLoopV0 = demoCastleToCastleEventLoopV0;
  window.__rhizoh.inspectShadowDataPlaneV0 = inspectShadowDataPlaneV0;
  return inspectShadowDataPlaneV0();
}

/**
 * @param {object} [opts]
 */
export function startShadowDataPlaneLoopV0(opts = {}) {
  if (loopStartedV0 && busListenerV0) {
    publishShadowDataPlaneDevtoolsV0();
    return stopShadowDataPlaneLoopV0;
  }
  loopStartedV0 = true;

  busListenerV0 = (ev) => {
    const event = ev?.detail;
    if (!event?.eventId) return;
    processShadowCastleEventV0(event);
  };
  if (typeof window !== "undefined") {
    window.addEventListener(SHADOW_CASTLE_BUS_EVENT_V0, busListenerV0);
  }

  publishShadowDataPlaneDevtoolsV0();

  pulsePruneTimerV0 = setInterval(() => pruneExpiredPinPulsesV0(), 1000);

  if (opts.demoOnBoot === true) {
    demoCastleToCastleEventLoopV0({ source: "shadow_boot" });
  }

  return stopShadowDataPlaneLoopV0;
}

export function stopShadowDataPlaneLoopV0() {
  loopStartedV0 = false;
  if (pulsePruneTimerV0) {
    clearInterval(pulsePruneTimerV0);
    pulsePruneTimerV0 = null;
  }
  if (typeof window !== "undefined" && busListenerV0) {
    window.removeEventListener(SHADOW_CASTLE_BUS_EVENT_V0, busListenerV0);
  }
  busListenerV0 = null;
}

/** @internal vitest */
export function __resetShadowDataPlaneLoopForTestV0() {
  stopShadowDataPlaneLoopV0();
  activePinPulsesV0.clear();
  reactionTraceV0.length = 0;
  pinPulseListenersV0.clear();
}
