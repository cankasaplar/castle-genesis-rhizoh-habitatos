/**
 * Gateway transport fallback — WS blocked (Firebase 101) → HTTP auto-switch.
 * castlePresence uses HTTP mirror when WS upgrade fails.
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { appendIdentityEventV0 } from "./rhizohIdentityEventLogV0.js";
import { noteGroundSignalV1, GROUND_SIGNAL_KIND_V1 } from "./rhizohGroundingLayerV1.js";

export const RHIZOH_GATEWAY_TRANSPORT_SCHEMA_V0 = "rhizoh.gateway_transport_fallback.v0";

export const GATEWAY_TRANSPORT_MODE_V0 = Object.freeze({
  HTTP: "http",
  WS: "ws",
  HTTP_PREFERRED: "http_preferred"
});

/** @type {boolean} */
let wsUpgradeFailedV0 = false;
/** @type {number} */
let wsFailAtMsV0 = 0;

/**
 * Call when WS handshake returns non-101 or connection error.
 */
export function noteGatewayWsUpgradeFailedV0(reason = "proxy_no_101") {
  wsUpgradeFailedV0 = true;
  wsFailAtMsV0 = Date.now();
  logVoiceInfoV0("GATEWAY_WS_FALLBACK_HTTP", { reason });
  appendIdentityEventV0({
    type: "transport_switch",
    intent: "http_fallback",
    carrier: GATEWAY_TRANSPORT_MODE_V0.HTTP_PREFERRED,
    preview: reason
  });
  noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.GATEWAY_WS_FAIL, { reason });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.gatewayTransport = resolveGatewayTransportV0();
  }
}

export function clearGatewayWsUpgradeFailedV0() {
  wsUpgradeFailedV0 = false;
  wsFailAtMsV0 = 0;
}

/**
 * Resolved transport for LLM + presence (HTTP always viable on Firebase hosting).
 */
export function resolveGatewayTransportV0() {
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  const httpUrl = String(cfg.rhizohLlmHttp || cfg.gatewayHttp || "").trim();
  const wsUrl = String(cfg.gatewayWsUrl || cfg.gatewayWs || "").trim();
  const httpAvailable = Boolean(httpUrl);
  const wsConfigured = Boolean(wsUrl);

  const preferHttp = wsUpgradeFailedV0 || !wsConfigured;
  const mode = preferHttp && httpAvailable
    ? GATEWAY_TRANSPORT_MODE_V0.HTTP_PREFERRED
    : wsConfigured
      ? GATEWAY_TRANSPORT_MODE_V0.WS
      : httpAvailable
        ? GATEWAY_TRANSPORT_MODE_V0.HTTP
        : GATEWAY_TRANSPORT_MODE_V0.HTTP;

  return Object.freeze({
    schema: RHIZOH_GATEWAY_TRANSPORT_SCHEMA_V0,
    mode,
    httpAvailable,
    wsConfigured,
    wsUpgradeFailed: wsUpgradeFailedV0,
    wsFailAtMs: wsFailAtMsV0 || null,
    castlePresenceBlockedUntilUpgrade: wsConfigured && !wsUpgradeFailedV0 && !httpAvailable,
    castlePresenceViaHttp: httpAvailable,
    note: wsUpgradeFailedV0
      ? "WS blocked — HTTP gateway active for LLM/presence."
      : wsConfigured
        ? "WS configured; HTTP available as fallback."
        : "HTTP-only gateway."
  });
}

/** @internal vitest */
export function __resetGatewayTransportFallbackForTestV0() {
  wsUpgradeFailedV0 = false;
  wsFailAtMsV0 = 0;
}
