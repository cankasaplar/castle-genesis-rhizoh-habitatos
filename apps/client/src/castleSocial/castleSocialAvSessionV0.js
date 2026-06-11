/**
 * Castle-to-castle A/V session scaffold — LIVE gate + pulse metadata (no RTP yet).
 * @see docs/MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md
 */

import {
  SESSION_LIFECYCLE_V0,
  normalizeSessionLifecycleV0,
  isSpatialBindingAllowedV0
} from "./castleSessionLifecycleV0.js";
import {
  buildCastleSpatialSessionV0,
  deriveCastleSpatialRoomIdV0
} from "./castleSpatialSessionV0.js";

export const CASTLE_SOCIAL_AV_SESSION_SCHEMA_V0 = "castle.social_av_session.v0";
export const CASTLE_SOCIAL_AV_PULSE_EVENT_V0 = "castle:social-av-pulse";

/** @type {import("./castleSocialAvSessionV0.js").CastleSocialAvSessionV0 | null} */
let _active = null;

/**
 * @typedef {object} CastleSocialAvSessionV0
 * @property {string} sessionId
 * @property {string} lifecycle
 * @property {boolean} micActive
 * @property {boolean} cameraActive
 * @property {string} roomKey
 * @property {ReturnType<typeof buildCastleSpatialSessionV0>} [spatialSession]
 * @property {number} createdAtMs
 * @property {number} [liveAtMs]
 */

/**
 * @param {{
 *   roomKey?: string,
 *   peerLabel?: string,
 *   hostCastleId?: string,
 *   peerCastleId?: string,
 *   hostAnchor?: object | null,
 *   peerAnchor?: object | null,
 *   conversationContext?: object | null,
 *   memoryBinding?: object | null,
 *   entityLayer?: object | null
 * }} [opts]
 */
export function createCastleSocialAvSessionV0(opts = {}) {
  const sessionId = `c2c_${Date.now().toString(36)}`;
  const hostCastleId = String(opts.hostCastleId || "local_castle").trim();
  const peerCastleId = opts.peerCastleId ? String(opts.peerCastleId).trim() : null;
  const roomKey =
    String(opts.roomKey || "").trim() ||
    deriveCastleSpatialRoomIdV0({ hostCastleId, peerCastleId });
  const spatialSession = buildCastleSpatialSessionV0({
    sessionId,
    roomId: roomKey,
    hostCastleId,
    peerCastleId,
    hostAnchor: opts.hostAnchor || null,
    peerAnchor: opts.peerAnchor || null,
    conversationContext: opts.conversationContext || null,
    memoryBinding: opts.memoryBinding || null,
    entityLayer: opts.entityLayer || null
  });
  const session = Object.freeze({
    schema: CASTLE_SOCIAL_AV_SESSION_SCHEMA_V0,
    sessionId,
    lifecycle: SESSION_LIFECYCLE_V0.DRAFT,
    micActive: false,
    cameraActive: false,
    roomKey,
    peerLabel: String(opts.peerLabel || "").trim() || null,
    transport: "signaling_stub",
    note: "WebRTC/SFU wiring pending READY gate",
    spatialSession,
    createdAtMs: Date.now(),
    liveAtMs: null
  });
  _active = session;
  publishCastleSocialAvPulseV0(session);
  return session;
}

/** @returns {CastleSocialAvSessionV0 | null} */
export function readCastleSocialAvSessionV0() {
  return _active;
}

/**
 * Promote session to LIVE — required before media attach per EVENT_SYSTEM_V1.
 * @param {CastleSocialAvSessionV0} [session]
 */
export function promoteCastleSocialAvSessionLiveV0(session = _active) {
  if (!session) return null;
  const next = Object.freeze({
    ...session,
    lifecycle: SESSION_LIFECYCLE_V0.LIVE,
    liveAtMs: Date.now()
  });
  _active = next;
  publishCastleSocialAvPulseV0(next);
  return next;
}

/**
 * @param {CastleSocialAvSessionV0} session
 * @param {{ micActive?: boolean, cameraActive?: boolean }} patch
 */
export function patchCastleSocialAvSessionV0(session, patch = {}) {
  if (!session) return null;
  const lifecycle = normalizeSessionLifecycleV0(session.lifecycle);
  if (!isSpatialBindingAllowedV0(lifecycle) && (patch.micActive || patch.cameraActive)) {
    return Object.freeze({ ok: false, reason: "lifecycle_not_live", lifecycle });
  }
  const next = Object.freeze({
    ...session,
    micActive: patch.micActive === true,
    cameraActive: patch.cameraActive === true,
    lifecycle
  });
  _active = next;
  publishCastleSocialAvPulseV0(next);
  return Object.freeze({ ok: true, session: next });
}

/**
 * @param {CastleSocialAvSessionV0 | null} session
 */
export function publishCastleSocialAvPulseV0(session) {
  if (typeof window === "undefined") return;
  const snap = session
    ? Object.freeze({
        sessionId: session.sessionId,
        lifecycle: session.lifecycle,
        micActive: session.micActive,
        cameraActive: session.cameraActive,
        roomKey: session.roomKey,
        transport: session.transport,
        spatialSession: session.spatialSession
          ? Object.freeze({
              sessionId: session.spatialSession.sessionId,
              roomId: session.spatialSession.roomId,
              hostCastleId: session.spatialSession.hostCastleId,
              peerCastleId: session.spatialSession.peerCastleId,
              memoryBinding: session.spatialSession.memoryBinding,
              entityLayer: session.spatialSession.entityLayer,
              transportPlan: session.spatialSession.transportPlan
            })
          : null,
        atMs: Date.now()
      })
    : null;
  try {
    window.__CASTLE_SOCIAL_AV_SESSION__ = snap;
    window.dispatchEvent(
      new CustomEvent(CASTLE_SOCIAL_AV_PULSE_EVENT_V0, { detail: snap })
    );
  } catch {
    /* noop */
  }
}

export function endCastleSocialAvSessionV0() {
  if (_active) {
    _active = Object.freeze({ ..._active, lifecycle: SESSION_LIFECYCLE_V0.ENDED });
    publishCastleSocialAvPulseV0(_active);
  }
  _active = null;
}

export function resetCastleSocialAvSessionForTestsV0() {
  _active = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_SOCIAL_AV_SESSION__;
    } catch {
      /* noop */
    }
  }
}
