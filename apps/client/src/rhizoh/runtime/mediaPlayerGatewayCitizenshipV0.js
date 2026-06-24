/**
 * Media Player Gateway Citizenship v0 — media tube channels register on gateway via BROADCAST_REGISTER.
 * Mirrors tower citizenship pattern; interpretation-only presence.
 * SPECFLOW: CORE-ELIGIBLE (gateway client lane — not frozen phase*.js)
 */

import { GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import { registerGatewayServiceV0 } from "./gatewayServiceRegistrationV0.js";
import {
  ensureMatchGatewayWsV0,
  MATCH_GATEWAY_WS_CLOSED_EVENT_V0,
  waitForMatchGatewayWsOpenV0
} from "./matchmakingGatewayWsV0.js";
import { getMatchSessionSyncSnapshotV0 } from "./matchSessionSyncBridgeV0.js";
import { getMatchmakingTruthSnapshotV0 } from "./matchmakingTruthKernelV0.js";
import {
  isMediaPlayerGatewayCitizenshipRegisteredV0,
  recordMediaObservationV1
} from "./rhizohObservationStateV1.js";
import {
  listWorldSpaceMediaChannelsV0,
  resolveWorldSpaceMediaChannelV0,
  RHIZOH_WORLDSPORTS_CHANNEL_ID_V0
} from "./worldSpaceMediaChannelsV0.js";
import { getWorldSportsTubeSnapshotV0 } from "./worldSportsMediaTubeWireV0.js";

export const MEDIA_PLAYER_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0 =
  "castle.rhizoh.media_player_gateway_citizenship_client.v0";

/** @type {Set<string>} */
const registeredChannelIdsV0 = new Set();
/** @type {string | null} */
let activeChannelIdV0 = null;
let bootArmedV0 = false;

/**
 * @param {{ channelId?: string, boundMatchSessionId?: string | null }} [input]
 */
export function resolveMediaPlayerWorldContextV0(input = {}) {
  const syncSnap = getMatchSessionSyncSnapshotV0();
  const truthSnap = getMatchmakingTruthSnapshotV0();
  const channelId = String(input.channelId || activeChannelIdV0 || "").trim();
  const boundMatchSessionId =
    String(
      input.boundMatchSessionId || syncSnap.sessionId || truthSnap?.activeSession?.sessionId || ""
    ).trim() || null;
  const worldId = String(input.worldId || boundMatchSessionId || channelId || "media_mesh").slice(
    0,
    128
  );

  return Object.freeze({
    channelId: channelId || null,
    sessionId: channelId || worldId,
    worldId,
    boundMatchSessionId,
    source: GATEWAY_EVENT_SOURCE_V0.MEDIA,
    interpretationOnly: true
  });
}

/**
 * @returns {ReadonlyArray<string>}
 */
export function listMediaGatewayCitizenChannelIdsV0() {
  return Object.freeze(listWorldSpaceMediaChannelsV0().map((row) => String(row.id)));
}

/**
 * @param {WebSocket} [ws]
 * @param {{ channelId: string, worldId?: string, boundMatchSessionId?: string | null, state?: string }} ctx
 */
export async function registerMediaPlayerGatewayCitizenV0(ws, ctx = {}) {
  const channelId = String(ctx.channelId || ctx.serviceId || "").trim();
  if (!channelId) {
    return Object.freeze({ ok: false, reason: "missing_channel_id" });
  }
  const socket = ws || (await ensureMatchGatewayWsV0());
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open", channelId });
  }

  const channel = resolveWorldSpaceMediaChannelV0(channelId);
  const worldCtx = resolveMediaPlayerWorldContextV0({
    channelId,
    worldId: ctx.worldId,
    boundMatchSessionId: ctx.boundMatchSessionId
  });
  const worldSportsSnap =
    channelId === RHIZOH_WORLDSPORTS_CHANNEL_ID_V0 ? getWorldSportsTubeSnapshotV0() : null;

  const reg = await registerGatewayServiceV0({
    ws: socket,
    kind: GATEWAY_EVENT_SOURCE_V0.MEDIA,
    serviceId: channelId,
    state: ctx.state || "ONLINE",
    meta: Object.freeze({
      worldId: worldCtx.worldId,
      boundMatchSessionId: worldCtx.boundMatchSessionId,
      channelType: channel?.type || null,
      titleEn: channel?.titleEn || null,
      titleTr: channel?.titleTr || null,
      liveMatchCount: worldSportsSnap?.liveMatchCount ?? null,
      upcomingMatchCount: worldSportsSnap?.upcomingMatchCount ?? null,
      pinCount: worldSportsSnap?.pinCount ?? null
    })
  });

  if (reg.ok) {
    registeredChannelIdsV0.add(channelId);
    recordMediaObservationV1({
      registered: true,
      channelId,
      registeredCount: registeredChannelIdsV0.size,
      registeredChannelIds: [...registeredChannelIdsV0]
    });
  }

  return Object.freeze({ ...reg, channelId, channelType: channel?.type || null });
}

/**
 * Register all media tube channels on gateway presence registry.
 * @param {WebSocket} [ws]
 */
export async function registerAllMediaPlayerCitizensV0(ws) {
  const socket = ws || (await ensureMatchGatewayWsV0());
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Object.freeze({
      ok: false,
      reason: "ws_not_open",
      registered: registeredChannelIdsV0.size
    });
  }

  const expected = listMediaGatewayCitizenChannelIdsV0();
  /** @type {object[]} */
  const results = [];
  for (const channelId of expected) {
    results.push(await registerMediaPlayerGatewayCitizenV0(socket, { channelId }));
  }

  const okCount = results.filter((r) => r.ok).length;
  recordMediaObservationV1({
    registered: okCount > 0,
    registeredChannelIds: [...registeredChannelIdsV0],
    registeredCount: registeredChannelIdsV0.size,
    expectedChannelCount: expected.length
  });
  return Object.freeze({
    ok: okCount === expected.length,
    registered: registeredChannelIdsV0.size,
    expected: expected.length,
    results: Object.freeze(results),
    interpretationOnly: true
  });
}

/**
 * Idempotent boot — register mesh when gateway WS is open.
 * @param {WebSocket} [ws]
 */
export async function ensureMediaPlayerGatewayCitizenshipV0(ws) {
  const expected = listMediaGatewayCitizenChannelIdsV0();
  if (
    registeredChannelIdsV0.size >= expected.length &&
    isMediaPlayerGatewayCitizenshipRegisteredV0()
  ) {
    return Object.freeze({
      ok: true,
      reason: "already_registered",
      registered: registeredChannelIdsV0.size,
      interpretationOnly: true
    });
  }
  return registerAllMediaPlayerCitizensV0(ws);
}

/**
 * Mark focused channel when media tube selects a feed.
 * @param {string} channelId
 */
export function setActiveMediaPlayerGatewayCitizenV0(channelId) {
  const id = String(channelId || "").trim();
  if (!id) return;
  activeChannelIdV0 = id;
  recordMediaObservationV1({ activeChannelId: id });
}

/**
 * Re-affirm presence when media tube opens or user switches channel.
 * @param {string} channelId
 */
export async function affirmActiveMediaPlayerGatewayCitizenV0(channelId) {
  const id = String(channelId || "").trim();
  if (!id) return Object.freeze({ ok: false, reason: "missing_channel_id" });
  setActiveMediaPlayerGatewayCitizenV0(id);
  return registerMediaPlayerGatewayCitizenV0(undefined, { channelId: id, state: "ONLINE" });
}

export function listRegisteredMediaChannelIdsV0() {
  return Object.freeze([...registeredChannelIdsV0]);
}

export { isMediaPlayerGatewayCitizenshipRegisteredV0 };

export function resetMediaPlayerGatewayCitizenshipClientForTestV0() {
  registeredChannelIdsV0.clear();
  activeChannelIdV0 = null;
  bootArmedV0 = false;
}

/**
 * Boot hook — register on gateway connect; clear on WS close.
 */
export function armMediaPlayerGatewayCitizenshipBootV0() {
  if (bootArmedV0 || typeof window === "undefined") return;
  bootArmedV0 = true;

  const onWsClosed = () => {
    registeredChannelIdsV0.clear();
    recordMediaObservationV1({
      registered: false,
      registeredCount: 0,
      registeredChannelIds: []
    });
    window.setTimeout(() => {
      void waitForMatchGatewayWsOpenV0({ timeoutMs: 20_000 }).then((res) => {
        if (res.ok && res.ws) void ensureMediaPlayerGatewayCitizenshipV0(res.ws);
      });
    }, 1500);
  };

  window.addEventListener(MATCH_GATEWAY_WS_CLOSED_EVENT_V0, onWsClosed);
}

export function mountMediaPlayerGatewayCitizenshipConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mediaGateway = Object.freeze({
    schema: MEDIA_PLAYER_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0,
    resolveContext: resolveMediaPlayerWorldContextV0,
    register: registerMediaPlayerGatewayCitizenV0,
    registerAll: registerAllMediaPlayerCitizensV0,
    ensure: ensureMediaPlayerGatewayCitizenshipV0,
    setActive: setActiveMediaPlayerGatewayCitizenV0,
    affirmActive: affirmActiveMediaPlayerGatewayCitizenV0,
    listRegistered: listRegisteredMediaChannelIdsV0,
    listChannelIds: listMediaGatewayCitizenChannelIdsV0,
    sessionActive: isMediaPlayerGatewayCitizenshipRegisteredV0,
    consoleHint: "await window.__rhizoh.mediaGateway.ensure()",
    interpretationOnly: true
  });
}
