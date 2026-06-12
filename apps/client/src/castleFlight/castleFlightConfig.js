/**
 * SAFE CASTLE FLIGHT CONFIG V2
 * - no request loop
 * - strict traceId
 * - rate-limit guard
 * - deterministic gateway routing
 */

export const CASTLE_FLIGHT_MANIFEST_KEYS = {
  satelliteLayer: "castle.flight.satellite.layer.v1",
  droneTelemetryStream: "castle.flight.drone.telemetry.v1",
  droneCommandIngress: "castle.flight.drone.command.v1",
  realtimeViewerApi: "castle.flight.viewer.realtime.v1",
  cesiumIon: "castle.gis.cesium.ion.v1",
  mapboxRaster: "castle.gis.mapbox.raster.v1",
  gatewayBroadcast: "castle.network.gateway.broadcast.v1",
  rhizohLlmGateway: "castle.rhizoh.llm.gateway.v1"
};

/** ---------------------------
 *  SAFE GLOBAL GUARDS
 * --------------------------*/
let __LAST_LLM_CALL__ = 0;
let __LAST_TRACE__ = null;

export function canCallLLM(minDelayMs = 1500, traceId = "") {
  const now = Date.now();

  // duplicate same request block
  if (__LAST_TRACE__ && traceId && __LAST_TRACE__ === traceId) {
    return false;
  }

  // rate limit
  if (now - __LAST_LLM_CALL__ < minDelayMs) {
    return false;
  }

  __LAST_LLM_CALL__ = now;
  __LAST_TRACE__ = traceId;

  return true;
}

/** ---------------------------
 *  URL SAFE RESOLVER
 * --------------------------*/
function resolveMaybeRelativeHttp(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (s.startsWith("/") && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${s}`;
  }
  return s;
}

export const DEFAULT_LIVE_GATEWAY_BASE =
  "https://castle-genesis-rhizoh-habitatos.onrender.com";

const INVALID_BAKED_GATEWAY_URL_RE =
  /(?:^|\/)xxx\.onrender\.com|YOUR-RENDER-HOST|YOUR-STAGING-GATEWAY|your-render-host/i;

export function isInvalidBakedGatewayUrl(url) {
  return INVALID_BAKED_GATEWAY_URL_RE.test(String(url || ""));
}

export function coalesceValidGatewayUrl(primary, fallback = DEFAULT_LIVE_GATEWAY_BASE) {
  if (primary && !isInvalidBakedGatewayUrl(primary)) return primary;
  if (fallback && !isInvalidBakedGatewayUrl(fallback)) return fallback;
  return DEFAULT_LIVE_GATEWAY_BASE;
}

/** ---------------------------
 *  LOCAL STORAGE SAFE READ
 * --------------------------*/
const LS_RHIZOH_LLM_HTTP_OVERRIDE = "castle.rhizohLlmHttp.override";
const LS_RHIZOH_LLM_HTTP = "castle.rhizohLlmHttp";

function readLlmHttpFromLocalStorage() {
  try {
    if (typeof window === "undefined") return { force: "", fill: "" };

    return {
      force: resolveMaybeRelativeHttp(localStorage.getItem(LS_RHIZOH_LLM_HTTP_OVERRIDE) || ""),
      fill: resolveMaybeRelativeHttp(localStorage.getItem(LS_RHIZOH_LLM_HTTP) || "")
    };
  } catch {
    return { force: "", fill: "" };
  }
}

/** ---------------------------
 *  MAIN CONFIG
 * --------------------------*/
export function getCastleFlightConfig() {
  const env = import.meta.env;

  const host =
    typeof window !== "undefined" ? window.location.hostname : "";

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

  const gatewayBase = coalesceValidGatewayUrl(
    (env.VITE_GATEWAY_URL || "").trim().replace(/\/$/, "")
  );

  const llmFromBase = `${gatewayBase}/rhizoh/llm`;

  const storage = readLlmHttpFromLocalStorage();

  // base chain (NO chaos)
  let rhizohLlmHttp =
    storage.force ||
    env.VITE_GATEWAY_HTTP ||
    llmFromBase;

  // hard safety filter
  if (
    /localhost|127\.0\.0\.1|xxx\.onrender\.com/i.test(rhizohLlmHttp)
  ) {
    rhizohLlmHttp = llmFromBase;
  }

  const proxyBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/gatewayProxy`
      : "";

  // ALWAYS safe proxy override on hosted env
  if (!isLocal && proxyBase) {
    rhizohLlmHttp = `${proxyBase}/rhizoh/llm`;
  }

  return {
    gatewayWsUrl: env.VITE_GATEWAY_WS || "",
    gatewayToken: env.VITE_GATEWAY_TOKEN || "",

    rhizohLlmHttp,

    cesiumIonToken: env.VITE_CESIUM_ION_TOKEN || "",
    mapboxToken: env.VITE_MAPBOX_TOKEN || "",

    viteEnv: env.MODE || "development"
  };
}

/** ---------------------------
 *  TRACE ID GENERATOR (CRITICAL FIX)
 * --------------------------*/
export function createTraceId(prefix = "TRC") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2, 10)}`;
}
