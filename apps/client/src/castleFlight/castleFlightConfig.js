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
/**
 * Build’de `VITE_LIVE_GATEWAY_BASE` boşsa kullanılan varsayılan gateway kökü (LLM = `${base}/rhizoh/llm`, Genesis SSE aynı origin).
 * Kendi Render servisin farklıysa: hem `VITE_GATEWAY_HTTP` hem `VITE_LIVE_GATEWAY_BASE` aynı host’a kilitlenmeli (split gateway yok).
 */
export const DEFAULT_LIVE_GATEWAY_BASE = "https://castle-genesis-rhizoh-habitatos.onrender.com";

/** CI/doc placeholder hosts baked into prod by mistake — never call these. */
const INVALID_BAKED_GATEWAY_URL_RE =
  /(?:^|\/)xxx\.onrender\.com|YOUR-RENDER-HOST|YOUR-STAGING-GATEWAY|your-render-host/i;

export function isInvalidBakedGatewayUrl(url) {
  const s = String(url || "").trim();
  if (!s) return false;
  return INVALID_BAKED_GATEWAY_URL_RE.test(s);
}

/** @param {string} primary @param {string} [fallback] */
export function coalesceValidGatewayUrl(primary, fallback = DEFAULT_LIVE_GATEWAY_BASE) {
  const p = String(primary || "").trim();
  if (p && !isInvalidBakedGatewayUrl(p)) return p;
  const f = String(fallback || "").trim();
  if (f && !isInvalidBakedGatewayUrl(f)) return f;
  return DEFAULT_LIVE_GATEWAY_BASE;
}

function sanitizeGatewayUrlOrEmpty(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return isInvalidBakedGatewayUrl(s) ? "" : s;
}

function resolveLiveGatewayBaseFromEnv(env) {
  return coalesceValidGatewayUrl(env.VITE_LIVE_GATEWAY_BASE || "", DEFAULT_LIVE_GATEWAY_BASE).replace(/\/$/, "");
}

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
  const preferLocalGateway = String(env.VITE_PREFER_LOCAL_GATEWAY || "").trim() === "1";
  /** Ephemeral tunnel / geçici gateway tamamen kapalı: WS + telemetri WS zorla boş; VITE_GATEWAY_URL türevi yok sayılır. */
  const gatewayOff = String(env.VITE_CASTLE_GATEWAY_OFF || "").trim() === "1";
  const gatewayBase = gatewayOff
    ? ""
    : sanitizeGatewayUrlOrEmpty(String(env.VITE_GATEWAY_URL || "").trim().replace(/\/$/, ""));
  const wsFromBase = gatewayBase
    ? gatewayBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:")
    : "";
  const llmFromBase = gatewayBase ? `${gatewayBase}/rhizoh/llm` : "";
  const liveGatewayBase = resolveLiveGatewayBaseFromEnv(env);
  const wsLiveFallback = liveGatewayBase ? liveGatewayBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:") : "";
  const llmLiveFallback = liveGatewayBase ? `${liveGatewayBase}/rhizoh/llm` : "";
  const wsLocalFallback = isLocalHost ? "ws://localhost:8090" : "";
  const llmLocalFallback = isLocalHost ? "http://localhost:8090/rhizoh/llm" : "";
  const defaultLocalFirst = isLocalHost && !preferLocalGateway;
  const wsFallback = defaultLocalFirst
    ? wsLocalFallback || wsLiveFallback
    : preferLocalGateway
      ? wsLocalFallback
      : wsLiveFallback || wsLocalFallback;
  const llmFallback = defaultLocalFirst
    ? llmLocalFallback || llmLiveFallback
    : preferLocalGateway
      ? llmLocalFallback
      : llmLiveFallback || llmLocalFallback;
  const llmExplicitRaw = resolveMaybeRelativeHttp(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "");
  const llmExplicit = isInvalidBakedGatewayUrl(llmExplicitRaw) ? "" : llmExplicitRaw;
  const { force: llmStorageForce, fill: llmStorageFill } = readLlmHttpFromLocalStorage();
  const envLlmChain = llmExplicit || llmFromBase || llmFallback;
  // Production'da eski localStorage override/fill değerleri yanlış gateway'e kilitleyebiliyor.
  // Varsayılan olarak sadece localhost geliştirmede localStorage override'larını dikkate al.
  const allowStorageLlmOverride = isLocalHost || String(env.VITE_ALLOW_LLM_STORAGE_OVERRIDE || "").trim() === "1";
  let rhizohLlmHttpResolved = allowStorageLlmOverride ? llmStorageForce || envLlmChain || llmStorageFill : envLlmChain;
  // Barındırılan sitede (Firebase vb.) build'e yanlışlıkla gömülü localhost / placeholder URL çalışmaz.
  if (typeof window !== "undefined" && !isLocalHost) {
    const baked = String(rhizohLlmHttpResolved || "").trim();
    if (baked && (/localhost|127\.0\.0\.1/i.test(baked) || isInvalidBakedGatewayUrl(baked))) {
      const altCandidates = [llmLiveFallback, llmFromBase].map((s) => String(s || "").trim()).filter(Boolean);
      const alt = altCandidates.find((u) => u && !/localhost|127\.0\.0\.1/i.test(u) && !isInvalidBakedGatewayUrl(u)) || "";
      if (alt) rhizohLlmHttpResolved = alt;
    }
  }
  rhizohLlmHttpResolved = coalesceValidGatewayUrl(rhizohLlmHttpResolved, llmLiveFallback);
  const proxyBase = getRhizohSameOriginGatewayProxyBaseV0();
  if (proxyBase) {
    rhizohLlmHttpResolved = `${proxyBase}/rhizoh/llm`;
  }
  const gatewayWsResolved = coalesceValidGatewayUrl(
    gatewayOff ? "" : env.VITE_GATEWAY_WS || env.VITE_GATEWAY_WS_URL || wsFromBase || wsFallback,
    wsLiveFallback
  );
  let gatewayWsFinal = gatewayWsResolved;
  // HTTP same-origin proxy (Firebase gatewayProxyV0 / Vite) is fetch-only — no WebSocket upgrade.
  // Local dev: Vite proxy forwards WS; hosted Firebase: keep direct Render WSS.
  if (proxyBase && typeof window !== "undefined" && isRhizohLocalDevHostV0(window.location.hostname)) {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    gatewayWsFinal = `${wsProto}//${window.location.host}/api/gatewayProxy`;
  }
  return {
    /** Yayın kısa adlar: VITE_GATEWAY_WS — eski: VITE_GATEWAY_WS_URL — veya VITE_GATEWAY_URL tabanı */
    gatewayWsUrl: gatewayOff ? "" : gatewayWsFinal,
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
    /** Rhizoh B1 — Sarıyer kalibrasyon kökü + anchor projection → Cesium fog/globe + tek entity (`VITE_RHIZOH_EPISTEMIC_CESIUM_BOOTSTRAP=1`) */
    rhizohEpistemicCesiumBootstrap: String(env.VITE_RHIZOH_EPISTEMIC_CESIUM_BOOTSTRAP || "").trim() === "1",
    mapboxToken: env.VITE_MAPBOX_TOKEN || "",
    /** Rhizoh LLM HTTP — sıra: localStorage override → Vite env → localStorage fill (demo Hosting). */
    rhizohLlmHttp: rhizohLlmHttpResolved,
    rhizohLlmToken: env.VITE_RHIZOH_LLM_TOKEN || "",
    /**
     * YouTube Publisher Bridge (A1) HTTP kökü, örn. `http://127.0.0.1:8791`.
     * Boş → istemci publish isteği göndermez ve analytics çekmez (A2/A3 kapalı).
     */
    youtubePublisherBridgeUrl: String(env.VITE_YOUTUBE_PUBLISHER_BRIDGE_URL || "")
      .trim()
      .replace(/\/$/, ""),
    /** Telemetri Hz üst sınırı (istemci tarafı) */
    telemetryMaxHz: Number(env.VITE_TELEMETRY_MAX_HZ || 30) || 30,
    /** Simülasyon drone sayısı (REAL_MAP) */
    simulatedDroneCount: Math.min(12, Math.max(1, Number(env.VITE_SIM_DRONE_COUNT || 4) || 4)),
    /** production | development — isteğe bağlı (Vite MODE yerine) */
    viteEnv: env.VITE_ENV || env.MODE || "development"
  };
}

/**
 * Genesis `GET /rhizoh/genesis/*` ve SSE için gerçek gateway origin.
 * Firebase Hosting üzerinde `VITE_GATEWAY_HTTP` veya göreli `/rhizoh/llm` bazen sayfa origin'ine çözülür;
 * bu durumda statik SPA HTML döner (`text/html` ≠ `text/event-stream`). O zaman canlı gateway tabanı kullanılır.
 * @returns {string}
 */
/** Firebase preview channel — CORS not on gateway allowlist; route via same-origin proxy. */
export function isRhizohLocalDevHostV0(hostname) {
  const h = String(hostname || "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

export function isCastleGenesisFirebasePreviewHostV0(hostname) {
  const h = String(hostname || "").toLowerCase();
  return (
    h.startsWith("castle-genesis--") &&
    (h.endsWith(".web.app") || h.endsWith(".firebaseapp.com"))
  );
}

export function isRhizohFirebaseHostingSurfaceV0(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h) return false;
  if (h === "castle-genesis.web.app" || h === "castle-genesis.firebaseapp.com") return true;
  return isCastleGenesisFirebasePreviewHostV0(h);
}

export function shouldUseSameOriginGatewayProxyV0() {
  if (typeof window === "undefined") return false;
  const h = String(window.location.hostname || "").toLowerCase();
  if (h === "rhizoh.com" || h === "www.rhizoh.com" || h.endsWith(".rhizoh.com")) return true;
  if (isRhizohFirebaseHostingSurfaceV0(h)) return true;
  /** Localhost + remote cloud gateway → same-origin Vite proxy (any port; Render CORS is 5173-only). */
  if (isRhizohLocalDevHostV0(h)) {
    if (String(import.meta.env.VITE_PREFER_LOCAL_GATEWAY || "").trim() === "1") return false;
    const llm = String(
      import.meta.env.VITE_GATEWAY_HTTP || import.meta.env.VITE_RHIZOH_LLM_HTTP || ""
    ).trim();
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(llm) || /:8090\b/.test(llm)) return false;
    return true;
  }
  return false;
}

function localDevGatewayProxyOriginV0() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (!isRhizohLocalDevHostV0(host)) return "";
  if (String(import.meta.env.VITE_PREFER_LOCAL_GATEWAY || "").trim() === "1") return "";
  const llm = String(
    import.meta.env.VITE_GATEWAY_HTTP || import.meta.env.VITE_RHIZOH_LLM_HTTP || ""
  ).trim();
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(llm) || /:8090\b/.test(llm)) return "";
  return `${window.location.origin}/api/gatewayProxy`.replace(/\/+$/, "");
}

/** Genesis / ingress HTTP base (fetch + SSE). */
export function resolveGenesisGatewayHttpBaseV0() {
  return String(getGenesisProtocolGatewayOrigin() || "")
    .trim()
    .replace(/\/+$/, "");
}

export function getRhizohSameOriginGatewayProxyBaseV0() {
  if (!shouldUseSameOriginGatewayProxyV0() || typeof window === "undefined") return "";
  return `${window.location.origin}/api/gatewayProxy`;
}

function isStaticSpaProductHost(pageHost) {
  const h = String(pageHost || "").toLowerCase();
  return (
    h === "rhizoh.com" ||
    h === "www.rhizoh.com" ||
    h.endsWith(".rhizoh.com") ||
    isRhizohFirebaseHostingSurfaceV0(h)
  );
}

export function getGenesisProtocolGatewayOrigin() {
  const localProxy = localDevGatewayProxyOriginV0();
  if (localProxy) return localProxy;
  const env = import.meta.env;
  const cfg = getCastleFlightConfig();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost = isRhizohLocalDevHostV0(host);
  const proxyBase = getRhizohSameOriginGatewayProxyBaseV0();
  if (proxyBase) return proxyBase;
  const liveBase = resolveLiveGatewayBaseFromEnv(env).replace(/\/+$/, "");

  let liveOrigin = "";
  if (liveBase) {
    try {
      liveOrigin = new URL(liveBase).origin;
    } catch {
      liveOrigin = liveBase;
    }
  }

  const llm = String(cfg.rhizohLlmHttp || "").trim();
  let origin = "";
  if (llm) {
    try {
      const baseHref =
        typeof window !== "undefined" && window.location?.href ? window.location.href : "http://localhost/";
      const u = new URL(llm, baseHref);
      origin = `${u.protocol}//${u.host}`;
    } catch {
      origin = "";
    }
  }

  if (!origin) return liveOrigin;

  const pageOrigin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  let pageHost = "";
  try {
    pageHost = pageOrigin ? new URL(pageOrigin).hostname : "";
  } catch {
    pageHost = "";
  }
  if (!isLocalHost && pageOrigin && origin === pageOrigin && isStaticSpaProductHost(pageHost)) {
    if (liveOrigin && liveOrigin !== pageOrigin) return liveOrigin;
    try {
      const defOrigin = new URL(DEFAULT_LIVE_GATEWAY_BASE).origin;
      if (defOrigin && defOrigin !== pageOrigin) return defOrigin;
    } catch {
      /* noop */
    }
  }

  if (!isLocalHost && pageOrigin && origin === pageOrigin && liveOrigin) return liveOrigin;

  if (isInvalidBakedGatewayUrl(origin)) {
    try {
      return new URL(DEFAULT_LIVE_GATEWAY_BASE).origin;
    } catch {
      return liveOrigin;
    }
  }

  return origin;
}
