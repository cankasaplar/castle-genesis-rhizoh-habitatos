/**
 * Shadow Data-plane Loop v0 — Castle A → bus → UGL interpret → Castle B projection.
 * RESEARCH-ONLY — Phase A shadow nervous system; not production data-plane.
 * @see docs/RHIZOH_SHADOW_DATA_PLANE_V0.md
 */

import {
  SHADOW_CASTLE_BUS_EVENT_V0,
  SHADOW_CASTLE_EVENT_TYPE_V0,
  PEER_CASTLE_SIM_ID_V0,
  PEER_CASTLE_SIM_COORDS_V0,
  emitShadowCastleEventV0,
  getShadowCastleEventBusSnapshotV0,
  readShadowCastleEventRingV0
} from "./shadowCastleEventBusV0.js";
import { ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 } from "./worldMapOriginHomePinV0.js";
import { resolveDomainDescriptorV0 } from "./rhizohDomainFabricV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";
import { ensureRhizohUglV0 } from "./rhizohUglBootV0.js";
import {
  demoChessShadowMoveEmitV0,
  emitShadowCastleEventFromUglV0,
  getShadowChessUglBridgeSnapshotV0,
  installShadowChessUglBridgeV0,
  uninstallShadowChessUglBridgeV0
} from "./shadowChessUglBridgeV0.js";
import {
  getShadowCastlePeerRegistrySnapshotV0,
  resolveShadowReactionTargetV0,
  shouldShowShadowPeerSimPinV0
} from "./shadowCastlePeerRegistryV0.js";
import {
  addSessionEdgeV0,
  getShadowSessionGraphSnapshotV0,
  SESSION_EDGE_KIND_V0
} from "./shadowCastleSessionGraphV0.js";

export const SHADOW_DATA_PLANE_SCHEMA_V0 = "castle.rhizoh.shadow_data_plane.v0";
export const SHADOW_CASTLE_REACTION_EVENT_V0 = "rhizoh:shadow-castle-reaction-v0";
export const SHADOW_CASTLE_PIN_PULSE_EVENT_V0 = "rhizoh:shadow-castle-pin-pulse-v0";
export const SHADOW_CHESS_PIN_PULSE_DURATION_MS_V0 = 8000;
export const SHADOW_DEFAULT_PIN_PULSE_DURATION_MS_V0 = 5000;

export const SHADOW_DATA_PLANE_PHASE_V0 = Object.freeze({
  A_SHADOW: "A_shadow",
  B_SOFT: "B_soft",
  B_SOFT_REAL: "B_soft_real"
});

export { PEER_CASTLE_SIM_ID_V0, PEER_CASTLE_SIM_COORDS_V0 };

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
let shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.A_SHADOW;

function syncShadowDataPlanePhaseV0() {
  if (!loopStartedV0) {
    shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.A_SHADOW;
    return shadowDataPlanePhaseV0;
  }
  const registry = getShadowCastlePeerRegistrySnapshotV0();
  if (registry.boundPeer || (registry.remoteCount > 0 && !registry.reactionTarget?.isSim)) {
    shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.B_SOFT_REAL;
  } else {
    shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.B_SOFT;
  }
  return shadowDataPlanePhaseV0;
}
/** @type {(() => void) | null} */
let stopChessBridgeV0 = null;

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

export function readShadowCastlePulseRemainingMsV0(pinId) {
  pruneExpiredPinPulsesV0();
  const row = activePinPulsesV0.get(String(pinId || ""));
  if (!row) return 0;
  return Math.max(0, row.untilMs - Date.now());
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
  if (!shouldShowShadowPeerSimPinV0()) return null;
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
  } else if (type === SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_MOVE) {
    const san = String(payload.san || "").trim();
    meaning = scalar >= 0.6 ? "chess_sharp_move" : "chess_quiet_move";
    reactionKind = "chess_move_echo";
    atmosphere = scalar >= 0.6 ? "focused" : "calm";
    if (san) {
      meaning = `${meaning}:${san}`;
    }
  } else if (type === SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_GAME_END) {
    meaning = scalar >= 0.55 ? "chess_game_win_tone" : "chess_game_close";
    reactionKind = "chess_end_echo";
    atmosphere = "resolved";
  } else if (type === SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_VISIT_ECHO) {
    meaning = "castle_visit_open";
    reactionKind = "visit_echo";
    atmosphere = "linked";
  } else if (type === SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_INVITE_EDGE) {
    meaning = "castle_invite_pending";
    reactionKind = "invite_echo";
    atmosphere = "awaiting";
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
  const target = resolveShadowReactionTargetV0({
    toCastleId: event?.toCastleId,
    preferSim: event?.meta?.preferSim === true
  });
  const pinId = target.pinId;
  const eventType = String(event?.type || "");
  const pulseDurationMs = eventType.startsWith("chess.")
    ? SHADOW_CHESS_PIN_PULSE_DURATION_MS_V0
    : SHADOW_DEFAULT_PIN_PULSE_DURATION_MS_V0;
  const pulse = applyShadowCastlePinPulseV0({
    pinId,
    sourceEventId: String(event?.eventId || "shadow"),
    durationMs: pulseDurationMs
  });

  const isChess = eventType.startsWith("chess.");
  const peerLabel = target.displayName || (target.isSim ? "Peer Sim" : "Peer Castle");
  const toastTr = isChess
    ? event?.payload?.san
      ? `${peerLabel} ← Satranç: ${event.payload.san}`
      : `${peerLabel} ← satranç hamlesi`
    : eventType === SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_VISIT_ECHO
      ? `${peerLabel} · ziyaret bağlantısı`
      : `${peerLabel} tepki: ${interpreted.meaning}`;
  const toastEn = isChess
    ? event?.payload?.san
      ? `${peerLabel} ← Chess: ${event.payload.san}`
      : `${peerLabel} ← chess move`
    : eventType === SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_VISIT_ECHO
      ? `${peerLabel} · visit link`
      : `${peerLabel} reaction: ${interpreted.meaning}`;

  return Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.reaction`,
    eventId: event?.eventId || null,
    fromCastleId: String(event?.fromCastleId || ORIGIN_HOME_SERENCEBEY_PIN_ID_V0),
    toCastleId: pinId,
    target: Object.freeze({ ...target }),
    meaning: interpreted.meaning,
    reactionKind: interpreted.reactionKind,
    atmosphere: interpreted.atmosphere,
    mapPinPulse: pulse,
    toast: Object.freeze({
      tr: toastTr,
      en: toastEn
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
  syncShadowDataPlanePhaseV0();
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(SHADOW_CASTLE_REACTION_EVENT_V0, { detail: trace }));
  }
  return trace;
}

export function inspectShadowDataPlaneV0() {
  pruneExpiredPinPulsesV0();
  const ring = readShadowCastleEventRingV0(16);
  const lastTrace = reactionTraceV0[0] || null;
  const lastPulsePinId = lastTrace?.reaction?.mapPinPulse?.pinId || null;
  const pulseRemainingMs = lastPulsePinId
    ? readShadowCastlePulseRemainingMsV0(lastPulsePinId)
    : 0;
  return Object.freeze({
    schema: `${SHADOW_DATA_PLANE_SCHEMA_V0}.inspect`,
    phase: shadowDataPlanePhaseV0,
    loopStarted: loopStartedV0,
    chessBridge: getShadowChessUglBridgeSnapshotV0(),
    bus: getShadowCastleEventBusSnapshotV0(),
    lastTrace,
    lastReaction: lastTrace
      ? Object.freeze({
          meaning: lastTrace.interpreted?.meaning || null,
          pinId: lastPulsePinId,
          target: lastTrace.reaction?.target || null,
          isRealPeer: lastTrace.reaction?.target?.isSim === false,
          pulseRemainingMs,
          pulseActive: pulseRemainingMs > 0,
          toast: lastTrace.reaction?.toast || null
        })
      : null,
    recentTraces: Object.freeze(reactionTraceV0.slice(0, 4)),
    activePinPulses: Object.freeze(
      [...activePinPulsesV0.entries()].map(([pinId, row]) =>
        Object.freeze({ pinId, untilMs: row.untilMs, sourceEventId: row.sourceEventId })
      )
    ),
    peerRegistry: getShadowCastlePeerRegistrySnapshotV0(),
    sessionGraph: getShadowSessionGraphSnapshotV0(),
    reactionTarget: resolveShadowReactionTargetV0(),
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
    toCastleId: opts.toCastleId != null ? String(opts.toCastleId) : null,
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

/**
 * Demo chess move with full trace + inspect (DevTools SSOT).
 * @param {object} [opts]
 */
export function demoChessShadowMoveV0(opts = {}) {
  const event = demoChessShadowMoveEmitV0(opts);
  if (!event) {
    return Object.freeze({ ok: false, reason: "emit_failed" });
  }
  if (!loopStartedV0) {
    processShadowCastleEventV0(event);
  }
  const inspect = inspectShadowDataPlaneV0();
  if (opts.flyToPeer !== false) {
    flyToShadowReactionTargetV0(13);
  }
  return Object.freeze({
    ok: true,
    event,
    trace: inspect.lastTrace,
    pulseRemainingMs: inspect.lastReaction?.pulseRemainingMs ?? 0,
    inspect
  });
}

export function flyToShadowReactionTargetV0(zoom = 13) {
  const target = resolveShadowReactionTargetV0();
  if (typeof window === "undefined" || !Number.isFinite(target.lat) || !Number.isFinite(target.lon)) {
    return false;
  }
  try {
    window.__rhizoh?.v11LeafletMap?.flyTo([target.lat, target.lon], zoom, {
      animate: true,
      duration: 1.2
    });
    return true;
  } catch {
    return false;
  }
}

export function flyToShadowPeerCastleV0(zoom = 13) {
  return flyToShadowReactionTargetV0(zoom);
}

/**
 * Remote castle click → session edge + visit echo on shadow bus.
 * @param {object} peerDetail
 */
export function emitCastleVisitEchoShadowEventV0(peerDetail) {
  const uid = String(peerDetail?.uid || "").trim();
  if (!uid) return null;
  addSessionEdgeV0({
    fromCastleId: "my_castle",
    toUid: uid,
    edgeKind: SESSION_EDGE_KIND_V0.VISIT
  });
  const event = emitShadowCastleEventV0({
    type: SHADOW_CASTLE_EVENT_TYPE_V0.CASTLE_VISIT_ECHO,
    fromCastleId: "my_castle",
    toCastleId: `remote_castle_${uid}`,
    payload: Object.freeze({
      displayName: peerDetail.displayName || null,
      lat: Number(peerDetail.lat),
      lon: Number(peerDetail.lon)
    }),
    source: "castle_visit_click"
  });
  if (!loopStartedV0) {
    processShadowCastleEventV0(event);
  }
  return event;
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
  window.__rhizoh.demoChessShadowMoveV0 = demoChessShadowMoveV0;
  window.__rhizoh.flyToShadowPeerCastleV0 = flyToShadowPeerCastleV0;
  window.__rhizoh.flyToShadowReactionTargetV0 = flyToShadowReactionTargetV0;
  window.__rhizoh.emitCastleVisitEchoShadowEventV0 = emitCastleVisitEchoShadowEventV0;
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
  syncShadowDataPlanePhaseV0();

  ensureRhizohUglV0();
  stopChessBridgeV0 = installShadowChessUglBridgeV0();

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
  shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.A_SHADOW;
  stopChessBridgeV0?.();
  stopChessBridgeV0 = null;
  uninstallShadowChessUglBridgeV0();
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
  shadowDataPlanePhaseV0 = SHADOW_DATA_PLANE_PHASE_V0.A_SHADOW;
}
