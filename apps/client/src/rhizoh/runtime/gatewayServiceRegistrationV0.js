/**
 * Gateway Service Registration v0 — tower, media, observer register via BROADCAST_REGISTER.
 * RESEARCH-ONLY
 */

import { WS_MESSAGE, createEnvelope, GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import { ensureMatchGatewayWsV0 } from "./matchmakingGatewayWsV0.js";

export const GATEWAY_SERVICE_REGISTRATION_SCHEMA_V0 =
  "castle.rhizoh.gateway_service_registration.v0";

export const GATEWAY_CLIENT_SERVICE_KIND_V0 = Object.freeze({
  TOWER: GATEWAY_EVENT_SOURCE_V0.TOWER,
  MEDIA: GATEWAY_EVENT_SOURCE_V0.MEDIA,
  OBSERVER: GATEWAY_EVENT_SOURCE_V0.OBSERVER,
  SCHEDULER: GATEWAY_EVENT_SOURCE_V0.SCHEDULER
});

/**
 * @param {{
 *   kind: string,
 *   serviceId: string,
 *   state?: string,
 *   meta?: object,
 *   ws?: WebSocket
 * }} input
 */
export async function registerGatewayServiceV0(input = {}) {
  const kind = String(input.kind || "").trim();
  const serviceId = String(input.serviceId || "").trim();
  if (!kind || !serviceId) {
    return Object.freeze({ ok: false, reason: "missing_kind_or_service_id" });
  }
  const ws = input.ws || (await ensureMatchGatewayWsV0());
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open" });
  }
  const envelope = createEnvelope(WS_MESSAGE.BROADCAST_REGISTER, {
    kind,
    serviceId,
    serviceKind: kind,
    state: input.state || "ONLINE",
    meta: input.meta,
    interpretationOnly: true
  });
  ws.send(JSON.stringify(envelope));
  return Object.freeze({ ok: true, sent: true, kind, serviceId, interpretationOnly: true });
}

export function mountGatewayServiceRegistrationConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.gatewayService = Object.freeze({
    schema: GATEWAY_SERVICE_REGISTRATION_SCHEMA_V0,
    kinds: GATEWAY_CLIENT_SERVICE_KIND_V0,
    register: registerGatewayServiceV0,
    consoleHint:
      "await window.__rhizoh.gatewayService.register({ kind: 'tower', serviceId: 'tower_a' })",
    interpretationOnly: true
  });
}
