/**
 * Gateway Presence Registry v0 — unified read path for castle network + match sessions + service nodes.
 * RESEARCH-ONLY until data-plane READY.
 */

import { listCastleNetworkPresenceV0 } from "../castleNetworkRelayV0.js";
import { getMatchSessionPresenceV0 } from "./matchBroadcastRoomV0.js";

export const GATEWAY_PRESENCE_REGISTRY_SCHEMA_V0 = "castle.rhizoh.gateway_presence_registry.v0";

export const GATEWAY_SERVICE_KIND_V0 = Object.freeze({
  TOWER: "tower",
  MEDIA: "media",
  CHESS: "chess",
  OBSERVER: "observer",
  VOICE: "voice",
  SCHEDULER: "scheduler"
});

/** @type {Map<string, { kind: string, serviceId: string, gatewayClientId: string | null, state: string, registeredAtMs: number, lastSeenMs: number, meta?: object }>} */
const serviceNodesV0 = new Map();

function serviceKeyV0(kind, serviceId) {
  return `${String(kind || "").slice(0, 32)}:${String(serviceId || "").slice(0, 128)}`;
}

/**
 * Register a service node (tower, media player, etc.) on gateway WS connect.
 * @param {{ kind: string, serviceId: string, gatewayClientId?: string | null, state?: string, meta?: object }} input
 */
export function registerGatewayServiceNodeV0(input = {}) {
  const kind = String(input.kind || "").slice(0, 32);
  const serviceId = String(input.serviceId || "").slice(0, 128);
  if (!kind || !serviceId) {
    return Object.freeze({ ok: false, reason: "missing_kind_or_service_id" });
  }
  const key = serviceKeyV0(kind, serviceId);
  const now = Date.now();
  const entry = Object.freeze({
    kind,
    serviceId,
    gatewayClientId: input.gatewayClientId ? String(input.gatewayClientId) : null,
    state: String(input.state || "ONLINE").slice(0, 32),
    registeredAtMs: serviceNodesV0.get(key)?.registeredAtMs ?? now,
    lastSeenMs: now,
    meta: input.meta && typeof input.meta === "object" ? Object.freeze({ ...input.meta }) : undefined
  });
  serviceNodesV0.set(key, entry);
  return Object.freeze({ ok: true, key, entry });
}

/**
 * @param {string} kind
 * @param {string} serviceId
 */
export function unregisterGatewayServiceNodeV0(kind, serviceId) {
  const key = serviceKeyV0(kind, serviceId);
  serviceNodesV0.delete(key);
  return Object.freeze({ ok: true, key });
}

/**
 * @param {string} [gatewayClientId]
 */
export function unregisterGatewayServiceNodesByClientV0(gatewayClientId) {
  const id = String(gatewayClientId || "").trim();
  if (!id) return Object.freeze({ ok: true, removed: 0 });
  let removed = 0;
  for (const [key, entry] of [...serviceNodesV0.entries()]) {
    if (entry.gatewayClientId === id) {
      serviceNodesV0.delete(key);
      removed += 1;
    }
  }
  return Object.freeze({ ok: true, removed });
}

/**
 * @param {{ roomKey?: string, sessionId?: string, kind?: string }} [opts]
 */
export function listUnifiedGatewayPresenceV0(opts = {}) {
  const roomKey = String(opts.roomKey || "world_space_c2c_v0").slice(0, 64);
  const sessionId = String(opts.sessionId || "").trim();
  const kindFilter = opts.kind ? String(opts.kind).slice(0, 32) : null;

  const castlePeers = listCastleNetworkPresenceV0(roomKey).map((p) =>
    Object.freeze({
      kind: GATEWAY_SERVICE_KIND_V0.OBSERVER,
      source: "castle_network",
      castleId: p.castleId,
      userId: p.userId,
      gatewayClientId: p.gatewayClientId,
      state: p.state,
      region: p.region,
      lastMs: p.lastMs
    })
  );

  const matchPresence = sessionId
    ? getMatchSessionPresenceV0(sessionId).members.map((m) =>
        Object.freeze({
          kind: GATEWAY_SERVICE_KIND_V0.CHESS,
          source: "match_session",
          sessionId,
          role: m.role,
          playerId: m.playerId,
          gatewayClientId: m.gatewayClientId,
          state: "ONLINE",
          joinedAtMs: m.joinedAtMs
        })
      )
    : [];

  const services = [...serviceNodesV0.values()]
    .filter((s) => !kindFilter || s.kind === kindFilter)
    .map((s) =>
      Object.freeze({
        kind: s.kind,
        source: "service_registry",
        serviceId: s.serviceId,
        gatewayClientId: s.gatewayClientId,
        state: s.state,
        registeredAtMs: s.registeredAtMs,
        lastSeenMs: s.lastSeenMs,
        meta: s.meta
      })
    );

  return Object.freeze({
    schema: GATEWAY_PRESENCE_REGISTRY_SCHEMA_V0,
    roomKey,
    sessionId: sessionId || null,
    castlePeers: Object.freeze(castlePeers),
    matchMembers: Object.freeze(matchPresence),
    services: Object.freeze(services),
    counts: Object.freeze({
      castle: castlePeers.length,
      match: matchPresence.length,
      services: services.length,
      total: castlePeers.length + matchPresence.length + services.length
    }),
    interpretationOnly: true
  });
}

/** @internal vitest */
export function clearGatewayPresenceRegistryForTestV0() {
  serviceNodesV0.clear();
}
