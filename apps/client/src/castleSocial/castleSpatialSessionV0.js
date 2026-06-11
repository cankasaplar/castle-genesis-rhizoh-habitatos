/**
 * Castle Spatial Session v0 — castle-to-castle context binding only.
 *
 * This is not media transport. It maps castle identity, room identity, spatial
 * anchors, conversation context, and memory intent before any real-time layer.
 */

export const CASTLE_SPATIAL_SESSION_SCHEMA_V0 = "castle.spatial_session.v0";

function slugV0(value, fallback = "castle") {
  const s = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || fallback;
}

function normalizeAnchorV0(anchor, fallbackLabel = "Castle") {
  const lat = Number(anchor?.lat);
  const lon = Number(anchor?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Object.freeze({
      label: String(anchor?.label || fallbackLabel),
      source: String(anchor?.source || "non_spatial_projection"),
      spatial: false,
      lat: null,
      lon: null
    });
  }
  return Object.freeze({
    label: String(anchor?.label || fallbackLabel),
    source: String(anchor?.source || "castle_anchor"),
    spatial: true,
    lat,
    lon
  });
}

/**
 * @param {{ hostCastleId?: string, peerCastleId?: string }} input
 */
export function deriveCastleSpatialRoomIdV0(input = {}) {
  const host = slugV0(input.hostCastleId, "host_castle");
  const peer = slugV0(input.peerCastleId, "solo");
  const pair = peer === "solo" ? [host, peer] : [host, peer].sort();
  return `castle_room_${pair.join("__")}`;
}

/**
 * @param {{
 *   sessionId?: string,
 *   roomId?: string,
 *   hostCastleId?: string,
 *   peerCastleId?: string,
 *   hostAnchor?: { lat?: number, lon?: number, label?: string, source?: string } | null,
 *   peerAnchor?: { lat?: number, lon?: number, label?: string, source?: string } | null,
 *   conversationContext?: { intent?: string, threadId?: string | null, openLoops?: string[] } | null,
 *   memoryBinding?: { enabled?: boolean, mode?: string } | null
 * }} input
 */
export function buildCastleSpatialSessionV0(input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  const hostCastleId = String(input.hostCastleId || "local_castle").trim();
  const peerCastleId = input.peerCastleId ? String(input.peerCastleId).trim() : null;
  const roomId = String(input.roomId || deriveCastleSpatialRoomIdV0({ hostCastleId, peerCastleId })).trim();

  if (!sessionId || !roomId || !hostCastleId) {
    return Object.freeze({
      schema: CASTLE_SPATIAL_SESSION_SCHEMA_V0,
      ok: false,
      reason: "missing_spatial_session_identity"
    });
  }

  const hostAnchor = normalizeAnchorV0(input.hostAnchor, "Local Castle");
  const peerAnchor = input.peerAnchor ? normalizeAnchorV0(input.peerAnchor, "Peer Castle") : null;
  const conversation = input.conversationContext || {};
  const openLoops = Array.isArray(conversation.openLoops)
    ? conversation.openLoops.map((x) => String(x)).filter(Boolean).slice(0, 8)
    : [];

  return Object.freeze({
    schema: CASTLE_SPATIAL_SESSION_SCHEMA_V0,
    ok: true,
    sessionId,
    roomId,
    hostCastleId,
    peerCastleId,
    participants: Object.freeze([
      Object.freeze({ castleId: hostCastleId, role: "host", anchor: hostAnchor }),
      ...(peerCastleId ? [Object.freeze({ castleId: peerCastleId, role: "peer", anchor: peerAnchor })] : [])
    ]),
    spatialContext: Object.freeze({
      mode: "castle_session",
      originClusterId: `cluster:${hostAnchor.source}`,
      hostAnchor,
      peerAnchor,
      sharedCameraMode: "independent_until_sync",
      mapOverlay: "castle_session_presence"
    }),
    conversationContext: Object.freeze({
      intent: String(conversation.intent || "castle_session"),
      threadId: conversation.threadId ? String(conversation.threadId) : null,
      openLoops: Object.freeze(openLoops)
    }),
    memoryBinding: Object.freeze({
      enabled: input.memoryBinding?.enabled !== false,
      mode: String(input.memoryBinding?.mode || "session_open")
    }),
    transportPlan: Object.freeze({
      kind: "pending_media_transport",
      mediaReady: false,
      signalingReady: false,
      routingReady: false
    }),
    readOnly: true
  });
}
