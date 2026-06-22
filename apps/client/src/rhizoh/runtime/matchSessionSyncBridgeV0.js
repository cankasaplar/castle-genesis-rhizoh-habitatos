/**
 * Match session sync bridge v0 — Reality Projection Layer (P0).
 * Binds gateway WS · broadcast transport · truth projection · UI events.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_P0_REALITY_SYNC_IMPLEMENTATION_BLUEPRINT_V1.md
 */

import {
  bindMatchBroadcastTransportV0,
  joinMatchBroadcastSessionV0
} from "./matchmakingBroadcastTransportV0.js";
import { projectMatchTruthToUiV0 } from "./matchTruthUiProjectionV0.js";
import {
  buildMatchSessionShareUrlV0,
  MATCH_REALITY_SYNC_JOIN_EVENT_V0,
  parseMatchSessionFromLocationV0,
  publishMatchIngressRouteV0
} from "./matchIngressSessionRouterV0.js";
import { getMatchGatewayWsStatusV0 } from "./matchmakingGatewayWsV0.js";
import {
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthProductionStatusV0,
  MATCH_TRUTH_EVENT_V0
} from "./matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "./matchSessionLifecycleV0.js";

export const MATCH_SESSION_SYNC_BRIDGE_SCHEMA_V0 =
  "castle.rhizoh.match_session_sync_bridge.v0";

export const MATCH_REALITY_SYNC_STATE_EVENT_V0 = "rhizoh:match-reality-sync-state-v0";

/** @type {{ active: boolean, sessionId: string | null, unbind: (() => void) | null, lastProjection: object | null }} */
let bridgeState = {
  active: false,
  sessionId: null,
  unbind: null,
  lastProjection: null
};

function emitRealitySyncState(projection, extra = {}) {
  bridgeState.lastProjection = projection;
  if (typeof window === "undefined") return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.matchSessionSync = Object.freeze({
      schema: MATCH_SESSION_SYNC_BRIDGE_SCHEMA_V0,
      active: bridgeState.active,
      sessionId: bridgeState.sessionId,
      projection,
      wsStatus: getMatchGatewayWsStatusV0(),
      shareUrl: bridgeState.sessionId
        ? buildMatchSessionShareUrlV0({ sessionId: bridgeState.sessionId })
        : null,
      interpretationOnly: true,
      shadowRehearsal: true,
      atMs: Date.now(),
      ...extra
    });
    window.dispatchEvent(
      new CustomEvent(MATCH_REALITY_SYNC_STATE_EVENT_V0, {
        detail: window.__rhizoh.matchSessionSync
      })
    );
  } catch {
    /* noop */
  }
}

function ensureTruthSessionForSyncV0(sessionId, playerId) {
  const projection = projectMatchTruthToUiV0();
  if (projection.ok && projection.sessionId === sessionId) {
    return Object.freeze({ ok: true, created: false });
  }
  const created = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
    payload: {
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      players: [{ userId: playerId, color: "white" }],
      sessionId
    }
  });
  return Object.freeze({
    ok: created.ok === true,
    created: true,
    sessionStep: created
  });
}

/**
 * Start reality sync for a match session.
 * @param {{ sessionId: string, role?: string, playerId?: string, waitForGateway?: boolean, gatewayTimeoutMs?: number }} input
 */
export async function startMatchSessionSyncV0(input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  const playerId = String(input.playerId || "reality_sync_player");
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id", interpretationOnly: true });
  }

  stopMatchSessionSyncV0();

  ensureTruthSessionForSyncV0(sessionId, playerId);

  const joined = await joinMatchBroadcastSessionV0({
    sessionId,
    role: input.role || "player",
    playerId,
    waitForGateway: input.waitForGateway,
    gatewayTimeoutMs: input.gatewayTimeoutMs,
    gatewayPollMs: input.gatewayPollMs
  });

  if (!joined.ok || !joined.ws) {
    return Object.freeze({
      ok: false,
      reason: joined.reason || "join_failed",
      joined,
      interpretationOnly: true
    });
  }

  const unbind = bindMatchBroadcastTransportV0({
    ws: joined.ws,
    sessionId,
    role: input.role,
    playerId,
    onPresence: (presence) => {
      emitRealitySyncState(projectMatchTruthToUiV0(), { presence });
    },
    onAck: () => {
      emitRealitySyncState(projectMatchTruthToUiV0(), { source: "ack" });
    },
    onState: () => {
      emitRealitySyncState(projectMatchTruthToUiV0(), { source: "match_state" });
    }
  });

  bridgeState = {
    active: true,
    sessionId,
    unbind,
    lastProjection: projectMatchTruthToUiV0()
  };

  const out = Object.freeze({
    ok: true,
    sessionId,
    joined,
    projection: bridgeState.lastProjection,
    shareUrl: buildMatchSessionShareUrlV0({ sessionId, role: input.role, playerId }),
    interpretationOnly: true,
    shadowRehearsal: true
  });

  emitRealitySyncState(bridgeState.lastProjection, { source: "start" });

  if (typeof console !== "undefined" && console.info) {
    console.info("[MATCH_REALITY_SYNC]", {
      ok: true,
      sessionId,
      shareUrl: out.shareUrl,
      wsOpen: joined.ws?.readyState === WebSocket.OPEN,
      gatewayWaitMs: joined.gatewayWait?.waitedMs ?? 0,
      fen: bridgeState.lastProjection?.fen ?? null,
      interpretationOnly: true
    });
  }

  if (input.sendInvite !== false || input.openArena !== false) {
    void import("./matchCastleInboxBridgeV0.js").then((m) =>
      m.publishMatchCastleInviteAfterStartV0({
        sessionId,
        playerId,
        shareUrl: out.shareUrl,
        ws: joined.ws,
        hostDisplayName: input.hostDisplayName,
        hostCastleUid: input.hostCastleUid,
        sendInvite: input.sendInvite,
        openArena: input.openArena,
        gameMode: input.gameMode,
        timeControlId: input.timeControlId,
        targetGatewayClientId: input.targetGatewayClientId
      })
    );
  }

  return out;
}

export function stopMatchSessionSyncV0() {
  if (bridgeState.unbind) {
    try {
      bridgeState.unbind();
    } catch {
      /* noop */
    }
  }
  bridgeState = { active: false, sessionId: null, unbind: null, lastProjection: null };
  if (typeof window !== "undefined" && window.__rhizoh?.matchSessionSync) {
    delete window.__rhizoh.matchSessionSync;
  }
}

export function isMatchRealitySyncActiveV0() {
  return bridgeState.active === true && Boolean(bridgeState.sessionId);
}

export function getMatchSessionSyncSnapshotV0() {
  return Object.freeze({
    schema: MATCH_SESSION_SYNC_BRIDGE_SCHEMA_V0,
    active: bridgeState.active,
    sessionId: bridgeState.sessionId,
    projection: bridgeState.lastProjection || projectMatchTruthToUiV0(),
    wsStatus: getMatchGatewayWsStatusV0(),
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * Combined reality probe — truth snapshot + sync bridge + gateway WS.
 */
export function getMatchRealityStatusV0() {
  const sync = getMatchSessionSyncSnapshotV0();
  const truth = getMatchmakingTruthProductionStatusV0();
  const projection = sync.projection?.ok ? sync.projection : projectMatchTruthToUiV0();
  const ws = sync.wsStatus || getMatchGatewayWsStatusV0();
  const fen = String(projection.fen || truth.fen || truth.activeSession?.fen || "").trim() || null;

  return Object.freeze({
    schema: MATCH_SESSION_SYNC_BRIDGE_SCHEMA_V0,
    syncActive: sync.active,
    sessionId: sync.sessionId || truth.activeSession?.sessionId || null,
    fen,
    turn: projection.turn || truth.activeSession?.turn || null,
    moveCount: projection.moveCount ?? truth.activeSession?.moveCount ?? 0,
    serverSeq: projection.serverSeq ?? truth.activeSession?.committed?.serverSeq ?? 0,
    wsOpen: ws.open === true,
    joined: sync.active === true && ws.open === true,
    activeSession: truth.activeSession,
    projection,
    wsStatus: ws,
    probes: Object.freeze({
      fen: "window.__rhizoh.matchmaking.realityStatus().fen",
      projectionFen: "window.__rhizoh.matchSessionSync?.projection?.fen",
      truthCommittedFen: "window.__rhizoh.matchmaking.truthStatus().activeSession?.committed?.fen"
    }),
    interpretationOnly: true,
    shadowRehearsal: true,
    atMs: Date.now()
  });
}

/**
 * Auto-start from /match/:id or ?match= URL.
 * @param {{ waitForGateway?: boolean, gatewayTimeoutMs?: number }} [opts]
 */
export async function autoStartMatchSessionSyncFromLocationV0(opts = {}) {
  const parsed = parseMatchSessionFromLocationV0();
  publishMatchIngressRouteV0(parsed);
  if (!parsed?.sessionId) {
    return Object.freeze({ ok: false, reason: "no_match_route", interpretationOnly: true });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MATCH_REALITY_SYNC_JOIN_EVENT_V0, { detail: parsed })
    );
  }

  return startMatchSessionSyncV0({
    sessionId: parsed.sessionId,
    role: parsed.role,
    playerId: parsed.playerId,
    waitForGateway: opts.waitForGateway,
    gatewayTimeoutMs: opts.gatewayTimeoutMs,
    gatewayPollMs: opts.gatewayPollMs,
    openArena: opts.openArena !== false,
    sendInvite: false
  });
}

export function mountMatchSessionSyncBridgeConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchSessionSyncApi = Object.freeze({
    schema: MATCH_SESSION_SYNC_BRIDGE_SCHEMA_V0,
    start: startMatchSessionSyncV0,
    stop: stopMatchSessionSyncV0,
    autoStartFromLocation: autoStartMatchSessionSyncFromLocationV0,
    snapshot: getMatchSessionSyncSnapshotV0,
    realityStatus: getMatchRealityStatusV0,
    isActive: isMatchRealitySyncActiveV0,
    parseLocation: parseMatchSessionFromLocationV0,
    buildShareUrl: buildMatchSessionShareUrlV0,
    challengePeer: async (input) => {
      const m = await import("./matchCastleInboxBridgeV0.js");
      return m.challengeBoundPeerToChessMatchV0(input);
    },
    events: Object.freeze({
      state: MATCH_REALITY_SYNC_STATE_EVENT_V0,
      join: MATCH_REALITY_SYNC_JOIN_EVENT_V0
    }),
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/** @internal vitest */
export function resetMatchSessionSyncBridgeForTestV0() {
  stopMatchSessionSyncV0();
}
