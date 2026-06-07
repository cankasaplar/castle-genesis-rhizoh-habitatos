/**
 * Castle / Studio / Observer zone adapters — bridge to existing implementations.
 * All missing deps resolve silently via idle fallback (no crash, no warn).
 */

import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";
import { getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import { getCastleWorldDataStateV2 } from "../../castleFlight/castleWorldDataProviderV2.js";
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getWorldExecutionModeV0 } from "./worldExecutionGateV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import {
  CASTLE_ZONE_CAPABILITY_V0,
  STUDIO_ZONE_CAPABILITY_V0,
  OBSERVER_ZONE_CAPABILITY_V0
} from "./rhizohDomainCapabilitySpecV0.js";

function idleAdapter(id, reason = "idle_fallback") {
  return Object.freeze({
    id,
    ready: true,
    kind: "idle",
    invoke() {
      return Object.freeze({ ok: false, reason, deferred: true });
    }
  });
}

function liveAdapter(id, invokeFn) {
  return Object.freeze({
    id,
    ready: true,
    kind: "live",
    invoke: invokeFn
  });
}

/** Castle — WebRTC stub (voice/posture via kernel; no RTP in v0). */
export function createCastleWebRtcAdapterV0() {
  return liveAdapter("castle:webrtc", (request = {}) => {
    const mode = String(request.mode || "voice_posture");
    return Object.freeze({
      ok: true,
      mode,
      transport: "kernel_local",
      note: "WebRTC not wired — avatar.speak.* posture stub"
    });
  });
}

/** Castle — presence mesh bridge. */
export function createCastlePresenceZoneAdapterV0() {
  return liveAdapter("castle:presence", (request = {}) => {
    const action = String(request.action || "ping");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rhizoh:castle-presence-v0", {
          detail: Object.freeze({ action, ...request, atMs: Date.now() })
        })
      );
    }
    return Object.freeze({ ok: true, action, zone: RHIZOH_DOMAIN_ID_V0.CASTLE });
  });
}

/** Castle — session graph (greenroom / broadcast session). */
export function createCastleSessionAdapterV0() {
  return liveAdapter("castle:session", (request = {}) => {
    const sessionId = String(request.sessionId || request.traceId || "").trim() || null;
    const roomUid = String(request.roomUid || "main").trim();
    return Object.freeze({
      ok: true,
      sessionId,
      roomUid,
      graph: Object.freeze({ nodes: [roomUid], edges: [] })
    });
  });
}

/** Castle — identity sync (user + guest continuity). */
export function createCastleIdentitySyncAdapterV0() {
  return liveAdapter("castle:identity_sync", (request = {}) => {
    const core = getRhizohDomainCoreSnapshotV0();
    return Object.freeze({
      ok: true,
      userId: core.userId ?? request.userId ?? null,
      synced: true
    });
  });
}

/** Studio — filesystem sandbox (browser-only v0). */
export function createStudioFilesystemAdapterV0() {
  return liveAdapter("studio:filesystem", (request = {}) => {
    const op = String(request.op || "list");
    return Object.freeze({
      ok: true,
      op,
      sandbox: true,
      roots: Object.freeze(["/studio/assets", "/studio/exports"])
    });
  });
}

/** Studio — asset pipeline. */
export function createStudioAssetPipelineAdapterV0() {
  return liveAdapter("studio:asset_pipeline", (request = {}) => {
    const kind = String(request.kind || "glb");
    return Object.freeze({
      ok: true,
      kind,
      stage: "validate",
      pipeline: "asset_contract_v1"
    });
  });
}

/** Studio — map builder (delegates to spatial engine only). */
export function createStudioMapBuilderAdapterV0() {
  return liveAdapter("studio:map_builder", (request = {}) => {
    const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
    return Object.freeze({
      ok: Boolean(cesium),
      deferred: !cesium,
      reason: cesium ? "spatial_engine_attached" : "cesium_not_ready",
      op: request.op ?? "edit_viewport"
    });
  });
}

/** Studio — AI generation (gateway LLM path). */
export function createStudioAiGenerationAdapterV0() {
  return liveAdapter("studio:ai_generation", (request = {}) => {
    let gateway = false;
    try {
      const cfg = getCastleFlightConfig();
      gateway = Boolean(cfg.rhizohLlmHttp || cfg.gatewayWs);
    } catch {
      gateway = false;
    }
    return Object.freeze({
      ok: gateway,
      deferred: !gateway,
      intent: request.intent ?? "generate_asset",
      toolchain: gateway ? "rhizoh_llm_gateway" : "offline"
    });
  });
}

/** Observer — telemetry read-only. */
export function createObserverTelemetryAdapterV0() {
  return liveAdapter("observer:telemetry", () => {
    let gateway = false;
    try {
      const cfg = getCastleFlightConfig();
      gateway = Boolean(cfg.rhizohLlmHttp || cfg.gatewayWs);
    } catch {
      gateway = false;
    }
    return Object.freeze({
      ok: true,
      readOnly: true,
      gateway,
      executionMode: getWorldExecutionModeV0(),
      atMs: Date.now()
    });
  });
}

/** Observer — log stream read-only. */
export function createObserverLogStreamAdapterV0() {
  return liveAdapter("observer:log_stream", () => {
    return Object.freeze({
      ok: true,
      readOnly: true,
      streams: Object.freeze(["castle_lifecycle", "voice", "domain_gate"])
    });
  });
}

/** Observer — state inspector flatten snapshot. */
export function createObserverStateInspectorAdapterV0() {
  return liveAdapter("observer:state_inspector", () => {
    const core = getRhizohDomainCoreSnapshotV0();
    const world = getCastleWorldDataStateV2();
    return Object.freeze({
      ok: true,
      readOnly: true,
      snapshot: Object.freeze({
        domain: core.activeDomain,
        layerMode: core.layerMode,
        adaptersReady: core.adaptersReady,
        mapFeed: world.feed,
        poiCount: world.poiCount
      })
    });
  });
}

/**
 * Register all zone adapters for a domain id.
 * @param {string} domain
 * @param {(domain: string, cap: string, adapter: object) => void} registerFn
 */
export function registerDomainZoneAdaptersV0(domain, registerFn) {
  const d = String(domain || "").trim();
  if (d === RHIZOH_DOMAIN_ID_V0.CASTLE) {
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.WEBRTC, createCastleWebRtcAdapterV0());
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.PRESENCE, createCastlePresenceZoneAdapterV0());
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.SESSION, createCastleSessionAdapterV0());
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.IDENTITY_SYNC, createCastleIdentitySyncAdapterV0());
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.VOICE, liveAdapter("castle:voice", () => {
      const snap = getVoiceAdapterRegistrySnapshot();
      return Object.freeze({ ok: snap.hydrated, ...snap });
    }));
    registerFn(d, CASTLE_ZONE_CAPABILITY_V0.SOCIAL, createCastlePresenceZoneAdapterV0());
    return;
  }
  if (d === RHIZOH_DOMAIN_ID_V0.STUDIO) {
    registerFn(d, STUDIO_ZONE_CAPABILITY_V0.FILESYSTEM, createStudioFilesystemAdapterV0());
    registerFn(d, STUDIO_ZONE_CAPABILITY_V0.ASSET_PIPELINE, createStudioAssetPipelineAdapterV0());
    registerFn(d, STUDIO_ZONE_CAPABILITY_V0.MAP_BUILDER, createStudioMapBuilderAdapterV0());
    registerFn(d, STUDIO_ZONE_CAPABILITY_V0.AI_GENERATION, createStudioAiGenerationAdapterV0());
    registerFn(d, STUDIO_ZONE_CAPABILITY_V0.VOICE, liveAdapter("studio:voice", () => {
      const snap = getVoiceAdapterRegistrySnapshot();
      return Object.freeze({ ok: snap.hydrated, ...snap });
    }));
    return;
  }
  if (d === RHIZOH_DOMAIN_ID_V0.OBSERVER) {
    registerFn(d, OBSERVER_ZONE_CAPABILITY_V0.TELEMETRY, createObserverTelemetryAdapterV0());
    registerFn(d, OBSERVER_ZONE_CAPABILITY_V0.LOG_STREAM, createObserverLogStreamAdapterV0());
    registerFn(d, OBSERVER_ZONE_CAPABILITY_V0.STATE_INSPECTOR, createObserverStateInspectorAdapterV0());
  }
}
