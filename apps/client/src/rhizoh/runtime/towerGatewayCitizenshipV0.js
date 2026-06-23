/**
 * Tower Gateway Citizenship v0 — LLM towers register on gateway via BROADCAST_REGISTER.
 * Mirrors voice citizenship pattern; interpretation-only presence.
 * SPECFLOW: CORE-ELIGIBLE (gateway client lane — not frozen phase*.js)
 */

import { GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import { registerGatewayServiceV0 } from "./gatewayServiceRegistrationV0.js";
import {
  ensureMatchGatewayWsV0,
  MATCH_GATEWAY_WS_CLOSED_EVENT_V0,
  waitForMatchGatewayWsOpenV0
} from "./matchmakingGatewayWsV0.js";
import { SOVEREIGN_TOWERS_V0 } from "./sovereignWorldMapNodesV0.js";
import { resolveRhizohTowerProviderV0 } from "./rhizohTowerProviderRegistryV0.js";
import { getMatchSessionSyncSnapshotV0 } from "./matchSessionSyncBridgeV0.js";
import { getMatchmakingTruthSnapshotV0 } from "./matchmakingTruthKernelV0.js";
import {
  isTowerGatewayCitizenshipRegisteredV0,
  recordTowerObservationV1
} from "./rhizohObservationStateV1.js";
import { setRhizohTowerGatewayReachableV0 } from "./rhizohTowerLiveStatusV0.js";

export const TOWER_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0 =
  "castle.rhizoh.tower_gateway_citizenship_client.v0";

/** @type {Set<string>} */
const registeredTowerIdsV0 = new Set();
/** @type {string | null} */
let activeTowerIdV0 = null;
let bootArmedV0 = false;

/**
 * @param {{ towerId?: string, boundMatchSessionId?: string | null }} [input]
 */
export function resolveTowerWorldContextV0(input = {}) {
  const syncSnap = getMatchSessionSyncSnapshotV0();
  const truthSnap = getMatchmakingTruthSnapshotV0();
  const towerId = String(input.towerId || activeTowerIdV0 || "").trim();
  const boundMatchSessionId =
    String(
      input.boundMatchSessionId || syncSnap.sessionId || truthSnap?.activeSession?.sessionId || ""
    ).trim() || null;
  const worldId = String(input.worldId || boundMatchSessionId || towerId || "tower_mesh").slice(
    0,
    128
  );

  return Object.freeze({
    towerId: towerId || null,
    sessionId: towerId || worldId,
    worldId,
    boundMatchSessionId,
    source: GATEWAY_EVENT_SOURCE_V0.TOWER,
    interpretationOnly: true
  });
}

/**
 * @param {WebSocket} [ws]
 * @param {{ towerId: string, worldId?: string, boundMatchSessionId?: string | null, state?: string }} ctx
 */
export async function registerTowerGatewayCitizenV0(ws, ctx = {}) {
  const towerId = String(ctx.towerId || ctx.serviceId || "").trim();
  if (!towerId) {
    return Object.freeze({ ok: false, reason: "missing_tower_id" });
  }
  const socket = ws || (await ensureMatchGatewayWsV0());
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open", towerId });
  }

  const provider = resolveRhizohTowerProviderV0(towerId);
  const worldCtx = resolveTowerWorldContextV0({
    towerId,
    worldId: ctx.worldId,
    boundMatchSessionId: ctx.boundMatchSessionId
  });
  const towerNode = SOVEREIGN_TOWERS_V0.find((t) => t.id === towerId);

  const reg = await registerGatewayServiceV0({
    ws: socket,
    kind: GATEWAY_EVENT_SOURCE_V0.TOWER,
    serviceId: towerId,
    state: ctx.state || "ONLINE",
    meta: Object.freeze({
      worldId: worldCtx.worldId,
      boundMatchSessionId: worldCtx.boundMatchSessionId,
      provider: provider.provider,
      model: provider.model,
      label: provider.labelEn,
      lat: towerNode?.lat ?? null,
      lon: towerNode?.lon ?? null
    })
  });

  if (reg.ok) {
    registeredTowerIdsV0.add(towerId);
    recordTowerObservationV1({
      registered: true,
      towerId,
      registeredCount: registeredTowerIdsV0.size,
      registeredTowerIds: [...registeredTowerIdsV0]
    });
    setRhizohTowerGatewayReachableV0(true);
  }

  return Object.freeze({ ...reg, towerId, provider: provider.provider });
}

/**
 * Register all sovereign LLM towers (7) on gateway presence registry.
 * @param {WebSocket} [ws]
 */
export async function registerAllLlmTowerCitizensV0(ws) {
  const socket = ws || (await ensureMatchGatewayWsV0());
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open", registered: registeredTowerIdsV0.size });
  }

  /** @type {object[]} */
  const results = [];
  for (const tower of SOVEREIGN_TOWERS_V0) {
    results.push(await registerTowerGatewayCitizenV0(socket, { towerId: tower.id }));
  }

  const okCount = results.filter((r) => r.ok).length;
  return Object.freeze({
    ok: okCount === SOVEREIGN_TOWERS_V0.length,
    registered: registeredTowerIdsV0.size,
    expected: SOVEREIGN_TOWERS_V0.length,
    results: Object.freeze(results),
    interpretationOnly: true
  });
}

/**
 * Idempotent boot — register mesh when gateway WS is open.
 * @param {WebSocket} [ws]
 */
export async function ensureLlmTowerGatewayCitizenshipV0(ws) {
  if (
    registeredTowerIdsV0.size >= SOVEREIGN_TOWERS_V0.length &&
    isTowerGatewayCitizenshipRegisteredV0()
  ) {
    return Object.freeze({
      ok: true,
      reason: "already_registered",
      registered: registeredTowerIdsV0.size,
      interpretationOnly: true
    });
  }
  return registerAllLlmTowerCitizensV0(ws);
}

/**
 * Mark focused tower for workspace / voice routing.
 * @param {string} towerId
 */
export function setActiveTowerGatewayCitizenV0(towerId) {
  const id = String(towerId || "").trim();
  if (!id) return;
  activeTowerIdV0 = id;
  recordTowerObservationV1({ activeTowerId: id });
}

/**
 * Register active tower when workspace opens (re-affirms presence).
 * @param {string} towerId
 */
export async function affirmActiveTowerGatewayCitizenV0(towerId) {
  const id = String(towerId || "").trim();
  if (!id) return Object.freeze({ ok: false, reason: "missing_tower_id" });
  setActiveTowerGatewayCitizenV0(id);
  return registerTowerGatewayCitizenV0(undefined, { towerId: id, state: "ONLINE" });
}

export function listRegisteredTowerIdsV0() {
  return Object.freeze([...registeredTowerIdsV0]);
}

export { isTowerGatewayCitizenshipRegisteredV0 };

export function resetTowerGatewayCitizenshipClientForTestV0() {
  registeredTowerIdsV0.clear();
  activeTowerIdV0 = null;
  bootArmedV0 = false;
}

/**
 * Boot hook — register on gateway connect; clear on WS close.
 */
export function armLlmTowerGatewayCitizenshipBootV0() {
  if (bootArmedV0 || typeof window === "undefined") return;
  bootArmedV0 = true;

  const onWsClosed = () => {
    registeredTowerIdsV0.clear();
    recordTowerObservationV1({
      registered: false,
      registeredCount: 0,
      registeredTowerIds: []
    });
    setRhizohTowerGatewayReachableV0(false);
    window.setTimeout(() => {
      void waitForMatchGatewayWsOpenV0({ timeoutMs: 20_000 }).then((res) => {
        if (res.ok && res.ws) void ensureLlmTowerGatewayCitizenshipV0(res.ws);
      });
    }, 1500);
  };

  window.addEventListener(MATCH_GATEWAY_WS_CLOSED_EVENT_V0, onWsClosed);
}

export function mountTowerGatewayCitizenshipConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.towerGateway = Object.freeze({
    schema: TOWER_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0,
    resolveContext: resolveTowerWorldContextV0,
    register: registerTowerGatewayCitizenV0,
    registerAll: registerAllLlmTowerCitizensV0,
    ensure: ensureLlmTowerGatewayCitizenshipV0,
    setActive: setActiveTowerGatewayCitizenV0,
    affirmActive: affirmActiveTowerGatewayCitizenV0,
    listRegistered: listRegisteredTowerIdsV0,
    sessionActive: isTowerGatewayCitizenshipRegisteredV0,
    consoleHint: "await window.__rhizoh.towerGateway.ensure()",
    interpretationOnly: true
  });
}
