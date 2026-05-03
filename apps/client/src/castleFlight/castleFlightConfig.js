/**
 * Yayın / plugin için yapılandırma anahtarları (Vite env).
 * Gerçek token’ları sadece .env veya hosting secret store’da tutun.
 * Tüm anahtar listesi: monorepo kökünde ENV_KEYS.md
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

function resolveMaybeRelativeHttp(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (s.startsWith("/") && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${s}`;
  }
  return s;
}

/** Tam URL zorlar (build yanlış / boşsa). */
export const LS_RHIZOH_LLM_HTTP_OVERRIDE = "castle.rhizohLlmHttp.override";
/** Build’de URL yoksa yedek (ör. sadece Hosting’de hızlı deneme). */
export const LS_RHIZOH_LLM_HTTP = "castle.rhizohLlmHttp";

function readLlmHttpFromLocalStorage() {
  try {
    if (typeof window === "undefined") return { force: "", fill: "" };
    const force = resolveMaybeRelativeHttp(window.localStorage.getItem(LS_RHIZOH_LLM_HTTP_OVERRIDE) || "");
    const fill = resolveMaybeRelativeHttp(window.localStorage.getItem(LS_RHIZOH_LLM_HTTP) || "");
    return { force, fill };
  } catch {
    return { force: "", fill: "" };
  }
}

export function getCastleFlightConfig() {
  const env = import.meta.env;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  /** Ephemeral tunnel / geçici gateway tamamen kapalı: WS + telemetri WS zorla boş; VITE_GATEWAY_URL türevi yok sayılır. */
  const gatewayOff = String(env.VITE_CASTLE_GATEWAY_OFF || "").trim() === "1";
  const gatewayBase = gatewayOff
    ? ""
    : String(env.VITE_GATEWAY_URL || "")
        .trim()
        .replace(/\/$/, "");
  const wsFromBase = gatewayBase
    ? gatewayBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:")
    : "";
  const llmFromBase = gatewayBase ? `${gatewayBase}/rhizoh/llm` : "";
  const wsFallback = isLocalHost ? "ws://localhost:8090" : "";
  const llmFallback = isLocalHost ? "http://localhost:8090/rhizoh/llm" : "";
  const llmExplicit = resolveMaybeRelativeHttp(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "");
  const { force: llmStorageForce, fill: llmStorageFill } = readLlmHttpFromLocalStorage();
  const envLlmChain = llmExplicit || llmFromBase || llmFallback;
  const rhizohLlmHttpResolved = llmStorageForce || envLlmChain || llmStorageFill;
  return {
    /** Yayın kısa adlar: VITE_GATEWAY_WS — eski: VITE_GATEWAY_WS_URL — veya VITE_GATEWAY_URL tabanı */
    gatewayWsUrl: gatewayOff
      ? ""
      : env.VITE_GATEWAY_WS || env.VITE_GATEWAY_WS_URL || wsFromBase || wsFallback,
    gatewayToken: gatewayOff ? "" : env.VITE_GATEWAY_TOKEN || "",
    /** MAVLink / ROS bridge / özel telemetri WS (boş = yalnızca sahne içi simülasyon) */
    droneTelemetryWs: gatewayOff ? "" : env.VITE_DRONE_TELEMETRY_WS || "",
    /** Uçuşları HTTP ile çeken viewer (ör. replay API) */
    flightViewerHttp: env.VITE_FLIGHT_VIEWER_HTTP || "",
    /** Uydu / raster tile şablonu: {z}/{x}/{y} Mapbox veya özel CDN */
    satelliteTileTemplate: env.VITE_SATELLITE_TILE_TEMPLATE || "",
    cesiumIonToken: env.VITE_CESIUM_ION_TOKEN || "",
    /** OSM 3D Buildings — bazı ortamlarda PVS / RangeError tetikleyebilir; varsayılan kapalı, `VITE_CESIUM_OSM_BUILDINGS=1` ile aç */
    cesiumOsmBuildings: String(env.VITE_CESIUM_OSM_BUILDINGS || "").trim() === "1",
    /** Cesium World Terrain (Ion) — Windows/GPU’da PVS RangeError; varsayılan kapalı, `VITE_CESIUM_WORLD_TERRAIN=1` ile aç */
    cesiumWorldTerrain: String(env.VITE_CESIUM_WORLD_TERRAIN || "").trim() === "1",
    /** Rhizoh dünya projeksiyonu (poliline/entity yükü); varsayılan kapalı, `VITE_CESIUM_WORLD_PROJECTION_BIND=1` ile aç */
    cesiumWorldProjectionBind: String(env.VITE_CESIUM_WORLD_PROJECTION_BIND || "").trim() === "1",
    /** REAL_MAP: yalnızca Viewer + imagery + sabit kamera; preRender/klavye/telemetri/POI/kutu binalar kapalı (PVS/NaN teşhisi). */
    cesiumVanillaRealMap: String(env.VITE_CESIUM_VANILLA_REAL_MAP || "").trim() === "1",
    /**
     * Terrain → OSM → ağır entity → world projection sırasını gevşetir (tek boot penceresinde PVS çakışmasını azaltır).
     * Kapatmak: VITE_CESIUM_STAGED_BOOT=0
     */
    cesiumStagedBoot: String(env.VITE_CESIUM_STAGED_BOOT || "1").trim() !== "0",
    cesiumStageMsTerrain: Math.max(0, Number(env.VITE_CESIUM_STAGE_MS_TERRAIN ?? 160) || 160),
    cesiumStageMsOsm: Math.max(0, Number(env.VITE_CESIUM_STAGE_MS_OSM ?? 280) || 280),
    cesiumStageMsProjection: Math.max(0, Number(env.VITE_CESIUM_STAGE_MS_PROJECTION ?? 420) || 420),
    /** Boot sonrası teşhis (canvas, DPR, primitive sayısı) — VITE_CESIUM_BOOT_DIAG=1 */
    cesiumBootDiag: String(env.VITE_CESIUM_BOOT_DIAG || "").trim() === "1",
    /** Aşama süreleri + primitive/entity sayıları — VITE_CESIUM_BOOT_WATCHDOG=1 (veya BOOT_DIAG açıkken de yazılır) */
    cesiumBootWatchdog: String(env.VITE_CESIUM_BOOT_WATCHDOG || "").trim() === "1",
    mapboxToken: env.VITE_MAPBOX_TOKEN || "",
    /** Rhizoh LLM HTTP — sıra: localStorage override → Vite env → localStorage fill (demo Hosting). */
    rhizohLlmHttp: rhizohLlmHttpResolved,
    rhizohLlmToken: env.VITE_RHIZOH_LLM_TOKEN || "",
    /** Telemetri Hz üst sınırı (istemci tarafı) */
    telemetryMaxHz: Number(env.VITE_TELEMETRY_MAX_HZ || 30) || 30,
    /** Simülasyon drone sayısı (REAL_MAP) */
    simulatedDroneCount: Math.min(12, Math.max(1, Number(env.VITE_SIM_DRONE_COUNT || 4) || 4)),
    /** production | development — isteğe bağlı (Vite MODE yerine) */
    viteEnv: env.VITE_ENV || env.MODE || "development"
  };
}
