/**
 * Match gateway WebSocket registry v0 — shared WS for match broadcast console API.
 * Reuses drone bridge mirror when open; otherwise opens a dedicated match socket.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_BROADCAST_LAYER_V0.md
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { bindMatchGatewayCommitListenerV0 } from "./matchmakingGatewayCommitBridgeV0.js";

export const MATCH_GATEWAY_WS_SCHEMA_V0 = "castle.rhizoh.match_gateway_ws.v0";

const WS_SOURCE_V0 = Object.freeze({
  REGISTERED: "registered",
  DRONE_BRIDGE: "drone_bridge",
  DEDICATED: "dedicated_match"
});

/** @type {WebSocket | null} */
let registeredWs = null;
/** @type {string | null} */
let registeredSource = null;
/** @type {(() => void) | null} */
let commitUnbind = null;
/** @type {WebSocket | null} */
let dedicatedWs = null;
/** @type {Promise<WebSocket | null> | null} */
let connectPromise = null;

function wsReadyStateLabel(ws) {
  if (!ws) return "none";
  const map = { 0: "connecting", 1: "open", 2: "closing", 3: "closed" };
  return map[ws.readyState] ?? String(ws.readyState);
}

function publishGatewayWsSnapshot(extra = {}) {
  if (typeof window === "undefined") return;
  const ws = getMatchGatewayWsV0();
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.matchGatewayWs = Object.freeze({
      schema: MATCH_GATEWAY_WS_SCHEMA_V0,
      readyState: ws?.readyState ?? null,
      readyLabel: wsReadyStateLabel(ws),
      source: registeredSource,
      url: ws?.url ? String(ws.url).replace(/([?&]token=)[^&]+/i, "$1***") : null,
      hasDedicated: Boolean(dedicatedWs),
      interpretationOnly: true,
      shadowRehearsal: true,
      atMs: Date.now(),
      ...extra
    });
  } catch {
    /* noop */
  }
}

function armCommitListener(ws) {
  if (commitUnbind) {
    try {
      commitUnbind();
    } catch {
      /* noop */
    }
    commitUnbind = null;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    commitUnbind = bindMatchGatewayCommitListenerV0(ws);
  }
}

/**
 * Register an externally-owned gateway WebSocket (e.g. DroneFlightBridge mirror).
 * @param {WebSocket | null | undefined} ws
 * @param {{ source?: string }} [opts]
 */
export function registerMatchGatewayWsV0(ws, opts = {}) {
  if (!ws || typeof ws.addEventListener !== "function") {
    if (dedicatedWs && dedicatedWs.readyState === WebSocket.OPEN) {
      registeredWs = dedicatedWs;
      registeredSource = WS_SOURCE_V0.DEDICATED;
    } else {
      registeredWs = null;
      registeredSource = null;
    }
    publishGatewayWsSnapshot({ lastAction: "unregister" });
    return;
  }
  registeredWs = ws;
  registeredSource = String(opts.source || WS_SOURCE_V0.REGISTERED);
  armCommitListener(ws);
  publishGatewayWsSnapshot({ lastAction: "register", source: registeredSource });
}

/**
 * @returns {WebSocket | null}
 */
export function getMatchGatewayWsV0() {
  if (registeredWs && registeredWs.readyState === WebSocket.OPEN) {
    return registeredWs;
  }
  if (dedicatedWs && dedicatedWs.readyState === WebSocket.OPEN) {
    return dedicatedWs;
  }
  if (registeredWs && registeredWs.readyState === WebSocket.CONNECTING) {
    return registeredWs;
  }
  if (dedicatedWs && dedicatedWs.readyState === WebSocket.CONNECTING) {
    return dedicatedWs;
  }
  return registeredWs || dedicatedWs || null;
}

export function getMatchGatewayWsStatusV0() {
  const ws = getMatchGatewayWsV0();
  return Object.freeze({
    schema: MATCH_GATEWAY_WS_SCHEMA_V0,
    open: ws?.readyState === WebSocket.OPEN,
    readyState: ws?.readyState ?? null,
    readyLabel: wsReadyStateLabel(ws),
    source: registeredSource,
    urlConfigured: Boolean(String(getCastleFlightConfig().gatewayWsUrl || "").trim()),
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

function buildGatewayWsUrl() {
  const cfg = getCastleFlightConfig();
  const base = String(cfg.gatewayWsUrl || "").trim();
  if (!base) return "";
  const token = String(cfg.gatewayToken || "").trim();
  try {
    const u = new URL(base);
    if (token) u.searchParams.set("token", token);
    return u.toString();
  } catch {
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${base}${q}`;
  }
}

function openDedicatedMatchGatewayWsV0() {
  const url = buildGatewayWsUrl();
  if (!url || typeof WebSocket === "undefined") {
    return Promise.resolve(null);
  }

  if (dedicatedWs && (dedicatedWs.readyState === WebSocket.OPEN || dedicatedWs.readyState === WebSocket.CONNECTING)) {
    if (dedicatedWs.readyState === WebSocket.OPEN) {
      registerMatchGatewayWsV0(dedicatedWs, { source: WS_SOURCE_V0.DEDICATED });
      return Promise.resolve(dedicatedWs);
    }
    return new Promise((resolve) => {
      const onOpen = () => {
        cleanup();
        registerMatchGatewayWsV0(dedicatedWs, { source: WS_SOURCE_V0.DEDICATED });
        resolve(dedicatedWs);
      };
      const onFail = () => {
        cleanup();
        resolve(null);
      };
      const cleanup = () => {
        dedicatedWs?.removeEventListener("open", onOpen);
        dedicatedWs?.removeEventListener("error", onFail);
        dedicatedWs?.removeEventListener("close", onFail);
      };
      dedicatedWs.addEventListener("open", onOpen);
      dedicatedWs.addEventListener("error", onFail);
      dedicatedWs.addEventListener("close", onFail);
    });
  }

  dedicatedWs = new WebSocket(url);
  registeredSource = WS_SOURCE_V0.DEDICATED;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(dedicatedWs?.readyState === WebSocket.OPEN ? dedicatedWs : null);
    }, 12_000);

    const onOpen = () => {
      cleanup();
      registerMatchGatewayWsV0(dedicatedWs, { source: WS_SOURCE_V0.DEDICATED });
      resolve(dedicatedWs);
    };
    const onFail = () => {
      cleanup();
      resolve(null);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      dedicatedWs?.removeEventListener("open", onOpen);
      dedicatedWs?.removeEventListener("error", onFail);
      dedicatedWs?.removeEventListener("close", onFail);
    };

    dedicatedWs.addEventListener("open", onOpen);
    dedicatedWs.addEventListener("error", onFail);
    dedicatedWs.addEventListener("close", onFail);
  });
}

/**
 * Ensure an open gateway WebSocket for match broadcast (reuse or connect).
 * @returns {Promise<WebSocket | null>}
 */
export async function ensureMatchGatewayWsV0() {
  const existing = getMatchGatewayWsV0();
  if (existing?.readyState === WebSocket.OPEN) {
    return existing;
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = openDedicatedMatchGatewayWsV0().finally(() => {
    connectPromise = null;
    publishGatewayWsSnapshot({ lastAction: "ensure_complete" });
  });
  return connectPromise;
}

/** @internal vitest */
export function resetMatchGatewayWsForTestV0() {
  if (commitUnbind) {
    try {
      commitUnbind();
    } catch {
      /* noop */
    }
    commitUnbind = null;
  }
  registeredWs = null;
  registeredSource = null;
  dedicatedWs = null;
  connectPromise = null;
  if (typeof window !== "undefined" && window.__rhizoh?.matchGatewayWs) {
    delete window.__rhizoh.matchGatewayWs;
  }
}
