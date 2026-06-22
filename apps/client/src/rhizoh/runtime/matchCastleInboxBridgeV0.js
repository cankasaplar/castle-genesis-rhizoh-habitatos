/**
 * Match ↔ Shadow Inbox bridge v0 — castle-to-castle chess invites via gateway + inbox tap.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_P0_REALITY_SYNC_IMPLEMENTATION_BLUEPRINT_V1.md
 */

import { WS_MESSAGE, createEnvelope } from "@castle/protocol";
import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { buildMatchSessionShareUrlV0 } from "./matchIngressSessionRouterV0.js";
import {
  ensureMatchGatewayWsV0,
  getMatchGatewayWsV0
} from "./matchmakingGatewayWsV0.js";
import { readBoundShadowCastlePeerV0,
  remoteCastlePinIdV0
} from "./shadowCastlePeerRegistryV0.js";
import { appendShadowCastleInboxItemV0 } from "./shadowCastleInboxV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "./symbyoMapIntentBridgeV0.js";
import {
  getMatchSessionSyncSnapshotV0,
  isMatchRealitySyncActiveV0,
  startMatchSessionSyncV0
} from "./matchSessionSyncBridgeV0.js";
import { projectChessUiFromTruthV0 } from "./matchTruthUiProjectionV0.js";

export const MATCH_CASTLE_INBOX_BRIDGE_SCHEMA_V0 = "castle.rhizoh.match_castle_inbox_bridge.v0";

export const SHADOW_INBOX_KIND_MATCH_INVITE_V0 = "match_invite";

const GUEST_SESSION_KEY_V0 = "rhizoh_guest_session_v0";

function readLocalMatchPlayerIdV0(fallback = "reality_sync_player") {
  if (typeof window !== "undefined") {
    const fromSync = String(window.__rhizoh?.matchSessionSync?.playerId || "").trim();
    if (fromSync) return fromSync;
  }
  if (typeof localStorage !== "undefined") {
    try {
      const guest = localStorage.getItem(GUEST_SESSION_KEY_V0);
      if (guest) return String(guest).slice(0, 64);
    } catch {
      /* noop */
    }
  }
  return String(fallback).slice(0, 64);
}

function buildPeerCastleFromInviteV0(item) {
  const uid = String(item?.hostCastleUid || item?.hostPlayerId || "").trim();
  if (!uid) return null;
  return Object.freeze({
    uid,
    displayName: String(item?.hostDisplayName || item?.nodeLabel || uid.slice(0, 8)),
    gatewayClientId: item?.hostGatewayClientId ? String(item.hostGatewayClientId) : null
  });
}

/**
 * @param {object} payload
 */
export function appendShadowCastleMatchInviteToInboxV0(payload = {}) {
  const sessionId = String(payload.sessionId || "").trim();
  if (!sessionId) return null;

  const hostPlayerId = String(payload.hostPlayerId || "").trim();
  const localPlayerId = readLocalMatchPlayerIdV0();
  if (hostPlayerId && hostPlayerId === localPlayerId) {
    return null;
  }

  const hostName = String(payload.hostDisplayName || hostPlayerId || "Peer").slice(0, 48);
  const shareUrl =
    String(payload.shareUrl || "").trim() ||
    buildMatchSessionShareUrlV0({
      sessionId,
      role: "player",
      playerId: localPlayerId
    });

  return appendShadowCastleInboxItemV0({
    id: `match_invite_${sessionId}`,
    kind: SHADOW_INBOX_KIND_MATCH_INVITE_V0,
    titleTr: "Kale satranç daveti",
    titleEn: "Castle chess invite",
    bodyTr: `${hostName} seni insan vs insan maça davet ediyor.`,
    bodyEn: `${hostName} invited you to a human vs human match.`,
    matchSessionId: sessionId,
    shareUrl,
    hostPlayerId,
    hostGatewayClientId: payload.hostGatewayClientId ? String(payload.hostGatewayClientId) : null,
    hostCastleUid: payload.hostCastleUid ? String(payload.hostCastleUid) : hostPlayerId,
    hostDisplayName: hostName,
    gameMode: String(payload.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN),
    timeControlId: payload.timeControlId ? String(payload.timeControlId) : "blitz_5_0",
    isRealPeer: payload.isRealPeer !== false,
    eventType: "chess.match_invite",
    nodeType: "chess_arena",
    nodeLabel: hostName
  });
}

/**
 * @param {WebSocket} ws
 * @param {object} input
 */
export function sendMatchCastleInviteV0(ws, input = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open" });
  }
  const sessionId = String(input.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }

  const playerId = String(input.playerId || readLocalMatchPlayerIdV0()).trim();
  const shareUrl =
    String(input.shareUrl || "").trim() ||
    buildMatchSessionShareUrlV0({
      sessionId,
      role: input.role || "player",
      playerId
    });

  const envelope = createEnvelope(WS_MESSAGE.MATCH_CASTLE_INVITE, {
    sessionId,
    shareUrl,
    hostPlayerId: playerId,
    hostDisplayName: String(input.hostDisplayName || playerId).slice(0, 48),
    hostCastleUid: String(input.hostCastleUid || playerId).slice(0, 64),
    hostGatewayClientId: input.hostGatewayClientId ? String(input.hostGatewayClientId) : null,
    targetGatewayClientId: input.targetGatewayClientId ? String(input.targetGatewayClientId) : null,
    gameMode: String(input.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN),
    timeControlId: input.timeControlId ? String(input.timeControlId) : "blitz_5_0",
    interpretationOnly: true
  });
  envelope.sessionId = sessionId;
  envelope.traceId = input.traceId || `match_invite_${Date.now()}`;
  ws.send(JSON.stringify(envelope));

  return Object.freeze({ ok: true, sent: true, sessionId, shareUrl, interpretationOnly: true });
}

/**
 * Gateway → inbox projection for incoming castle invites.
 * @param {object} payload
 */
export function ingestMatchCastleInviteFromGatewayV0(payload = {}) {
  const sessionId = String(payload.sessionId || "").trim();
  if (!sessionId) return null;

  const targetGatewayClientId = String(payload.targetGatewayClientId || "").trim();
  const bound = readBoundShadowCastlePeerV0();
  if (
    targetGatewayClientId &&
    bound?.gatewayClientId &&
    targetGatewayClientId !== bound.gatewayClientId
  ) {
    return null;
  }

  return appendShadowCastleMatchInviteToInboxV0({
    sessionId,
    shareUrl: payload.shareUrl,
    hostPlayerId: payload.hostPlayerId,
    hostGatewayClientId: payload.fromGatewayClientId || payload.hostGatewayClientId,
    hostCastleUid: payload.hostCastleUid || payload.hostPlayerId,
    hostDisplayName: payload.hostDisplayName,
    gameMode: payload.gameMode,
    timeControlId: payload.timeControlId,
    isRealPeer: true
  });
}

/**
 * Open chess arena wired for P0 human-human reality sync.
 * @param {{ peerCastle?: object | null, gameMode?: string, source?: string }} [opts]
 */
export function openChessArenaForMatchSessionV0(opts = {}) {
  if (typeof window === "undefined") return Object.freeze({ ok: false, reason: "no_window" });

  const snap = getMatchSessionSyncSnapshotV0();
  const projection = snap.projection?.ok ? snap.projection : projectChessUiFromTruthV0();
  const peerCastle = opts.peerCastle || null;
  const gameMode = String(opts.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN);
  const tr = false;

  window.dispatchEvent(
    new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
      detail: Object.freeze({
        source: opts.source || "match_castle_inbox_bridge",
        node: Object.freeze({
          id: "chess_arena",
          type: "zone",
          label: "CHESS",
          name: tr ? "Kale Satranç Arenası" : "Castle Chess Arena",
          color: "#22d3ee"
        }),
        peerCastle,
        initialMode: gameMode,
        autoPlay: true,
        matchSessionId: snap.sessionId,
        realitySync: isMatchRealitySyncActiveV0(),
        projectionFen: projection.fen || null
      })
    })
  );

  return Object.freeze({
    ok: true,
    sessionId: snap.sessionId,
    gameMode,
    realitySync: isMatchRealitySyncActiveV0(),
    interpretationOnly: true
  });
}

/**
 * After host start — fan-out invite + optional local host arena.
 * @param {object} input
 */
export async function publishMatchCastleInviteAfterStartV0(input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }

  const ws = input.ws || (await ensureMatchGatewayWsV0());
  let sent = null;
  if (input.sendInvite !== false && ws?.readyState === WebSocket.OPEN) {
    const bound = readBoundShadowCastlePeerV0();
    sent = sendMatchCastleInviteV0(ws, {
      sessionId,
      playerId: input.playerId,
      shareUrl: input.shareUrl,
      hostDisplayName: input.hostDisplayName || bound?.displayName || input.playerId,
      hostCastleUid: input.hostCastleUid || bound?.uid || input.playerId,
      hostGatewayClientId: input.hostGatewayClientId,
      targetGatewayClientId: bound?.gatewayClientId || input.targetGatewayClientId || null,
      gameMode: input.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN,
      timeControlId: input.timeControlId || "blitz_5_0"
    });
  }

  let arena = null;
  if (input.openArena !== false) {
    arena = openChessArenaForMatchSessionV0({
      peerCastle: input.peerCastle || readBoundShadowCastlePeerV0(),
      gameMode: input.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN,
      source: "match_host_start"
    });
  }

  return Object.freeze({
    ok: true,
    sent,
    arena,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * Challenge bound peer — create session, join, invite, open arena.
 * @param {{ playerId?: string, sessionId?: string, peerCastle?: object }} [input]
 */
export async function challengeBoundPeerToChessMatchV0(input = {}) {
  const bound = input.peerCastle || readBoundShadowCastlePeerV0();
  const localId = String(input.playerId || readLocalMatchPlayerIdV0()).trim();
  const peerId = String(bound?.uid || "peer").trim();
  const sessionId =
    String(input.sessionId || "").trim() ||
    `c2c_${localId.slice(0, 12)}_${peerId.slice(0, 12)}_${Date.now().toString(36)}`;

  const started = await startMatchSessionSyncV0({
    sessionId,
    playerId: localId,
    role: "player",
    waitForGateway: input.waitForGateway,
    gatewayTimeoutMs: input.gatewayTimeoutMs
  });

  if (!started.ok) return started;

  const peerCastle = bound
    ? Object.freeze({
        uid: bound.uid,
        displayName: bound.displayName || bound.uid.slice(0, 8),
        gatewayClientId: bound.gatewayClientId || null,
        pinId: bound.pinId || remoteCastlePinIdV0(bound.uid)
      })
    : null;

  const invite = await publishMatchCastleInviteAfterStartV0({
    sessionId: started.sessionId,
    playerId: localId,
    shareUrl: started.shareUrl,
    ws: started.joined?.ws || getMatchGatewayWsV0(),
    peerCastle,
    hostDisplayName: localId,
    hostCastleUid: localId,
    targetGatewayClientId: bound?.gatewayClientId || null,
    gameMode: CHESS_GAME_MODE_V0.HUMAN_HUMAN,
    timeControlId: input.timeControlId || "blitz_5_0",
    sendInvite: input.sendInvite !== false,
    openArena: input.openArena !== false
  });

  return Object.freeze({
    ...started,
    invite,
    peerCastle,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * Inbox tap — join session + open human-human arena.
 * @param {object} item
 */
export async function acceptShadowCastleMatchInviteV0(item) {
  const sessionId = String(item?.matchSessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }

  const playerId = readLocalMatchPlayerIdV0();
  const started = await startMatchSessionSyncV0({
    sessionId,
    playerId,
    role: "player",
    waitForGateway: true,
    gatewayTimeoutMs: 20_000
  });

  if (!started.ok) return started;

  const arena = openChessArenaForMatchSessionV0({
    peerCastle: buildPeerCastleFromInviteV0(item),
    gameMode: item?.gameMode || CHESS_GAME_MODE_V0.HUMAN_HUMAN,
    source: "shadow_inbox_match_invite"
  });

  return Object.freeze({
    ok: true,
    started,
    arena,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

export function mountMatchCastleInboxBridgeConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchCastleInbox = Object.freeze({
    schema: MATCH_CASTLE_INBOX_BRIDGE_SCHEMA_V0,
    challengePeer: challengeBoundPeerToChessMatchV0,
    acceptInvite: acceptShadowCastleMatchInviteV0,
    openArena: openChessArenaForMatchSessionV0,
    sendInvite: async (input) => {
      const ws = await ensureMatchGatewayWsV0();
      return sendMatchCastleInviteV0(ws, input);
    },
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
