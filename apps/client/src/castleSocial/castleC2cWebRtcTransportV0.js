/**
 * Castle-to-castle WebRTC transport — pairs with gateway SIGNAL relay + castleSocialAvSessionV0.
 */

import { getCastleFlightConfig } from "../castleFlight/castleFlightConfig.js";
import {
  createCastleSocialAvSessionV0,
  endCastleSocialAvSessionV0,
  patchCastleSocialAvSessionV0,
  patchCastleSocialAvTransportV0,
  promoteCastleSocialAvSessionLiveV0,
  readCastleSocialAvSessionV0
} from "./castleSocialAvSessionV0.js";
import { createCastleC2cSignalingChannelV0, CASTLE_C2C_ROOM_KEY_V0 } from "./castleC2cSignalingChannelV0.js";

export const CASTLE_C2C_WEBRTC_SCHEMA_V0 = "castle.c2c_webrtc.v0";
export const CASTLE_C2C_STATE_EVENT_V0 = "castle:c2c-state-v0";

const ICE_SERVERS = Object.freeze([{ urls: "stun:stun.l.google.com:19302" }]);

/** @type {import("./castleC2cSignalingChannelV0.js").ReturnType<createCastleC2cSignalingChannelV0> | null} */
let signaling = null;
/** @type {RTCPeerConnection | null} */
let peerConnection = null;
/** @type {MediaStream | null} */
let localStream = null;
/** @type {string} */
let activePeerUid = "";
/** @type {string} */
let activePeerClientId = "";

function publishC2cState(extra = {}) {
  if (typeof window === "undefined") return;
  const session = readCastleSocialAvSessionV0();
  try {
    window.__CASTLE_C2C_STATE__ = Object.freeze({
      schema: CASTLE_C2C_WEBRTC_SCHEMA_V0,
      sessionId: session?.sessionId || null,
      lifecycle: session?.lifecycle || null,
      peerUid: activePeerUid || null,
      peerClientId: activePeerClientId || null,
      transport: session?.transport || null,
      mediaReady: session?.mediaReady === true,
      atMs: Date.now(),
      ...extra
    });
    window.dispatchEvent(new CustomEvent(CASTLE_C2C_STATE_EVENT_V0, { detail: window.__CASTLE_C2C_STATE__ }));
  } catch {
    /* noop */
  }
}

function ensureSignaling(userId) {
  if (signaling) return signaling;
  const cfg = getCastleFlightConfig();
  signaling = createCastleC2cSignalingChannelV0({
    wsBaseUrl: cfg.gatewayWsUrl,
    token: cfg.gatewayToken,
    userId,
    castleRoomKey: CASTLE_C2C_ROOM_KEY_V0,
    onSignal: (payload) => void handleIncomingSignalV0(payload),
    onRoster: () => publishC2cState({ rosterUpdated: true }),
    onStatus: (s) => {
      if (s.state === "client_id") publishC2cState({ signaling: "ready" });
    }
  });
  signaling.connect();
  return signaling;
}

/**
 * @param {Record<string, unknown>} payload
 */
async function handleIncomingSignalV0(payload) {
  const signalType = String(payload?.signalType || "");
  const from = String(payload?.from || "");
  if (!signalType || !from) return;

  if (signalType === "OFFER" && !peerConnection) {
    activePeerClientId = from;
    activePeerUid = signaling?.resolveUserForClientIdV0?.(from) || from;
    const session = createCastleSocialAvSessionV0({
      peerLabel: activePeerUid.slice(0, 8),
      hostCastleId: "local_castle",
      peerCastleId: activePeerUid
    });
    promoteCastleSocialAvSessionLiveV0(session);
    patchCastleSocialAvTransportV0({ transport: "gateway_webrtc", mediaReady: false });
    await attachLocalMediaV0({ mic: true, camera: false });
    peerConnection = createPeerConnectionV0(from);
    await peerConnection.setRemoteDescription(payload.sdp);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signaling?.sendSignal({
      signalType: "ANSWER",
      to: from,
      sdp: peerConnection.localDescription
    });
    publishC2cState({ direction: "incoming", mediaReady: true });
    patchCastleSocialAvTransportV0({ transport: "gateway_webrtc", mediaReady: true });
    return;
  }

  if (!peerConnection) return;

  if (signalType === "ANSWER") {
    await peerConnection.setRemoteDescription(payload.sdp);
    publishC2cState({ mediaReady: true });
    patchCastleSocialAvTransportV0({ transport: "gateway_webrtc", mediaReady: true });
    return;
  }

  if (signalType === "ICE" && payload.candidate) {
    try {
      await peerConnection.addIceCandidate(payload.candidate);
    } catch {
      /* noop */
    }
  }
}

function createPeerConnectionV0(peerClientId) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  pc.onicecandidate = (ev) => {
    if (!ev.candidate || !peerClientId) return;
    signaling?.sendSignal({
      signalType: "ICE",
      to: peerClientId,
      candidate: ev.candidate
    });
  };
  pc.ontrack = (ev) => {
    if (typeof window === "undefined") return;
    try {
      window.__CASTLE_C2C_REMOTE_STREAM__ = ev.streams?.[0] || null;
      window.dispatchEvent(
        new CustomEvent("castle:c2c-remote-stream-v0", {
          detail: Object.freeze({ stream: ev.streams?.[0] || null })
        })
      );
    } catch {
      /* noop */
    }
    publishC2cState({ remoteTrack: true });
  };
  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }
  return pc;
}

/**
 * @param {{ mic?: boolean, camera?: boolean }} [opts]
 */
async function attachLocalMediaV0(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia_unavailable");
  }
  if (localStream) return localStream;
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: opts.mic !== false,
    video: opts.camera === true
  });
  const session = readCastleSocialAvSessionV0();
  if (session) {
    patchCastleSocialAvSessionV0(session, {
      micActive: opts.mic !== false,
      cameraActive: opts.camera === true
    });
  }
  return localStream;
}

function stopLocalMediaV0() {
  if (localStream) {
    for (const track of localStream.getTracks()) track.stop();
  }
  localStream = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_C2C_REMOTE_STREAM__;
    } catch {
      /* noop */
    }
  }
}

function teardownPeerV0() {
  try {
    peerConnection?.close();
  } catch {
    /* noop */
  }
  peerConnection = null;
  stopLocalMediaV0();
  activePeerUid = "";
  activePeerClientId = "";
}

/**
 * @param {{
 *   userId: string,
 *   peerUid: string,
 *   peerClientId?: string | null,
 *   peerLabel?: string,
 *   mic?: boolean,
 *   camera?: boolean
 * }} opts
 */
export async function startCastleC2cCallV0(opts) {
  const userId = String(opts.userId || "").trim();
  const peerUid = String(opts.peerUid || "").trim();
  if (!userId || !peerUid) {
    return Object.freeze({ ok: false, reason: "missing_ids" });
  }
  if (typeof RTCPeerConnection === "undefined") {
    return Object.freeze({ ok: false, reason: "webrtc_unavailable" });
  }

  const channel = ensureSignaling(userId);
  activePeerUid = peerUid;

  let peerClientId = String(opts.peerClientId || "").trim();
  if (!peerClientId) peerClientId = channel.resolveClientIdForUserV0(peerUid);
  if (!peerClientId) {
    channel.sendPulse();
    await new Promise((r) => setTimeout(r, 400));
    peerClientId = channel.resolveClientIdForUserV0(peerUid);
  }
  if (!peerClientId) {
    return Object.freeze({ ok: false, reason: "peer_offline", peerUid });
  }
  activePeerClientId = peerClientId;

  const session = createCastleSocialAvSessionV0({
    peerLabel: opts.peerLabel || peerUid.slice(0, 8),
    hostCastleId: userId,
    peerCastleId: peerUid
  });
  const live = promoteCastleSocialAvSessionLiveV0(session);
  patchCastleSocialAvTransportV0({ transport: "gateway_webrtc", mediaReady: false });

  await attachLocalMediaV0({ mic: opts.mic !== false, camera: opts.camera === true });
  peerConnection = createPeerConnectionV0(peerClientId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  const sent = channel.sendSignal({
    signalType: "OFFER",
    to: peerClientId,
    sdp: peerConnection.localDescription
  });
  if (!sent) {
    teardownPeerV0();
    endCastleSocialAvSessionV0();
    return Object.freeze({ ok: false, reason: "signal_send_failed" });
  }

  publishC2cState({ direction: "outgoing", mediaReady: false });
  return Object.freeze({ ok: true, sessionId: live.sessionId, peerClientId });
}

export function endCastleC2cCallV0() {
  teardownPeerV0();
  endCastleSocialAvSessionV0();
  publishC2cState({ ended: true });
}

/**
 * @param {string} userId
 */
export function bootCastleC2cSignalingV0(userId) {
  if (!String(userId || "").trim()) return null;
  const cfg = getCastleFlightConfig();
  if (!cfg.gatewayWsUrl) return null;
  return ensureSignaling(String(userId));
}

export function disposeCastleC2cTransportV0() {
  teardownPeerV0();
  signaling?.dispose();
  signaling = null;
  endCastleSocialAvSessionV0();
  publishC2cState({ disposed: true });
}

/** @internal vitest */
export function resetCastleC2cTransportForTestsV0() {
  disposeCastleC2cTransportV0();
  if (typeof window !== "undefined") {
    delete window.__CASTLE_C2C_STATE__;
    delete window.__CASTLE_C2C_CLIENT_ID__;
  }
}
