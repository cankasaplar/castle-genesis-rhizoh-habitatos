import { getCastleFlightConfig, CASTLE_FLIGHT_MANIFEST_KEYS } from "./castleFlightConfig.js";
import { subscribeCastleDroneTelemetry } from "./telemetryHub.js";

if (typeof window !== "undefined") {
  window.__CASTLE_FLIGHT__ = {
    version: "1",
    getCastleFlightConfig,
    subscribeCastleDroneTelemetry,
    CASTLE_FLIGHT_MANIFEST_KEYS
  };
}
