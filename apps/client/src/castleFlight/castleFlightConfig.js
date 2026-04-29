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

export function getCastleFlightConfig() {
  return {
    gatewayWsUrl: import.meta.env.VITE_GATEWAY_WS_URL || "ws://localhost:8090",
    gatewayToken: import.meta.env.VITE_GATEWAY_TOKEN || "",
    /** MAVLink / ROS bridge / özel telemetri WS (boş = yalnızca sahne içi simülasyon) */
    droneTelemetryWs: import.meta.env.VITE_DRONE_TELEMETRY_WS || "",
    /** Uçuşları HTTP ile çeken viewer (ör. replay API) */
    flightViewerHttp: import.meta.env.VITE_FLIGHT_VIEWER_HTTP || "",
    /** Uydu / raster tile şablonu: {z}/{x}/{y} Mapbox veya özel CDN */
    satelliteTileTemplate: import.meta.env.VITE_SATELLITE_TILE_TEMPLATE || "",
    cesiumIonToken: import.meta.env.VITE_CESIUM_ION_TOKEN || "",
    mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || "",
    /** Rhizoh konuşma LLM endpoint (POST JSON) */
    rhizohLlmHttp: import.meta.env.VITE_RHIZOH_LLM_HTTP || "http://localhost:8090/rhizoh/llm",
    rhizohLlmToken: import.meta.env.VITE_RHIZOH_LLM_TOKEN || "",
    /** Telemetri Hz üst sınırı (istemci tarafı) */
    telemetryMaxHz: Number(import.meta.env.VITE_TELEMETRY_MAX_HZ || 30) || 30,
    /** Simülasyon drone sayısı (REAL_MAP) */
    simulatedDroneCount: Math.min(12, Math.max(1, Number(import.meta.env.VITE_SIM_DRONE_COUNT || 4) || 4))
  };
}
