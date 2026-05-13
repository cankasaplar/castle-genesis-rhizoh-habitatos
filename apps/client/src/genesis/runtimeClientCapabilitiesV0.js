import { getCastleFlightConfig } from "../castleFlight/castleFlightConfig.js";
import { isWorldLayerEnabled } from "../rhizoh/runtime/castleWorldLayerGateV0.js";
import { syncStudioRenderCapabilityProbe } from "../rhizoh/runtime/studioCapabilityProbeV0.js";
import { getRhizohApiBase } from "../rhizoh/useRhizohGatewayMonitor.js";

export const RUNTIME_CLIENT_CAPABILITIES_SCHEMA = "castle.runtime.client_capabilities.v0";

/**
 * Synchronous client capability snapshot (no WebGPU adapter probe — use {@link probeWebGpuAdapterResolvableV0}).
 * "No available adapters" (Chrome) is a **soft signal**: `webgpuApiPresent` may be true while adapter resolves null.
 * @returns {Record<string, unknown>}
 */
export function getRuntimeClientCapabilitiesSnapshotV0() {
  const cfg = getCastleFlightConfig();
  const probe = syncStudioRenderCapabilityProbe();
  const world = isWorldLayerEnabled();
  const ion = String(cfg.cesiumIonToken || "").trim().length > 0;
  const http = String(getRhizohApiBase() || "").trim().length > 0;
  const ws = String(cfg.gatewayWsUrl || "").trim().length > 0;
  return {
    schema: RUNTIME_CLIENT_CAPABILITIES_SCHEMA,
    at: Date.now(),
    worldLayerEnabled: world,
    cesiumMountable: world && ion,
    mapStreamingEligible: world && ion,
    gatewayHttpConfigured: http,
    gatewayWsConfigured: ws,
    webgl: probe.webgl,
    webgl2: probe.webgl2,
    webgpuApiPresent: probe.webgpuApi,
    webgpuAdapterResolved: null
  };
}

/**
 * Non-fatal: null adapter is expected on low-power / policy-blocked browsers.
 * @returns {Promise<boolean>}
 */
export async function probeWebGpuAdapterResolvableV0() {
  if (typeof navigator === "undefined" || !navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
    return !!adapter;
  } catch {
    return false;
  }
}
