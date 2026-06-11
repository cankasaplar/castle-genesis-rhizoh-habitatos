/**
 * Local command handlers — dispatch only; App subscribes to layer events.
 * Latency target: 0–20ms (no LLM, no OLP directive).
 */

import { fakeTVLayerV0 } from "./fakeTVLayerV0.js";
import { cancelVoiceInstantAckV0 } from "./voiceInstantAckV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { readLocalCommandRowV0 } from "./rhizohLocalCommandRegistryV0.js";
import { applyCommandStateTransitionV0 } from "./rhizohCommandStateMachineV0.js";
import { recordLocalCommandMemoryV0 } from "./rhizohCommandMemoryV0.js";
import { applyLocalCommandAppBindingV0 } from "./rhizohLocalCommandAppBindingV0.js";

export const RHIZOH_MEDIA_COMMAND_EVENT_V0 = "rhizoh:media-command";
export const RHIZOH_AUDIO_COMMAND_EVENT_V0 = "rhizoh:audio-command";
export const RHIZOH_MAP_COMMAND_EVENT_V0 = "rhizoh:map-command";
export const RHIZOH_CAMERA_COMMAND_EVENT_V0 = "rhizoh:camera-command";
export const RHIZOH_SYSTEM_COMMAND_EVENT_V0 = "rhizoh:system-command";
export const RHIZOH_VOICE_COMMAND_EVENT_V0 = "rhizoh:voice-command";

const LAYER_EVENT_V0 = Object.freeze({
  media: RHIZOH_MEDIA_COMMAND_EVENT_V0,
  audio: RHIZOH_AUDIO_COMMAND_EVENT_V0,
  map: RHIZOH_MAP_COMMAND_EVENT_V0,
  world: RHIZOH_MAP_COMMAND_EVENT_V0,
  camera: RHIZOH_CAMERA_COMMAND_EVENT_V0,
  system: RHIZOH_SYSTEM_COMMAND_EVENT_V0
});

let lastMapCommandKeyV0 = "";
let lastMapCommandAtMsV0 = 0;
const MAP_COMMAND_DEDUPE_MS_V0 = 650;

function navigateLocalCommandRouteV0(pathname) {
  if (typeof window === "undefined") return;
  const path = String(pathname || "/");
  try {
    if (window.location?.pathname !== path) {
      window.history?.pushState?.({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  } catch {
    try {
      window.location.assign(path);
    } catch {
      /* noop */
    }
  }
}

function prepareMapCommandSideEffectV0(canonical, action) {
  if (typeof window === "undefined") return;
  if (canonical === "map_open" || action === "open") {
    navigateLocalCommandRouteV0("/world/space");
    void import("./rhizohWorldDrawerDomainV0.js")
      .then((m) => m.writeRhizohWorldDrawerDomainV0(m.RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE))
      .catch(() => {});
    void import("./rhizohWorldMapToolV0.js")
      .then((m) => m.writeRhizohWorldMapToolV0("city_map"))
      .catch(() => {});
    return;
  }
  if (canonical === "map_close" || action === "close") {
    navigateLocalCommandRouteV0("/");
    return;
  }
  if (canonical === "map_toggle_layers" || action === "toggle_layers") {
    void import("./rhizohWorldMapToolV0.js")
      .then((m) => m.applyRhizohWorldMapToolV0(m.cycleRhizohWorldMapToolV0(), { source: "LOCAL_COMMAND_TOGGLE_LAYERS" }))
      .catch(() => {});
  }
}

/**
 * @param {string} eventName
 * @param {object} detail
 */
function dispatchLocalCommandEventV0(eventName, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail: Object.freeze(detail) }));
  window.dispatchEvent(
    new CustomEvent(RHIZOH_VOICE_COMMAND_EVENT_V0, {
      detail: Object.freeze({ ...detail, aggregate: true })
    })
  );
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.lastVoiceCommand = Object.freeze(detail);
}

/**
 * @param {string} canonical
 * @param {ReturnType<typeof readLocalCommandRowV0>} row
 */
export function mediaCommandHandlerV0(canonical, row) {
  const payload = Object.freeze({
    canonical,
    action: row.action,
    layer: row.layer,
    handler: "mediaCommandHandlerV0",
    atMs: Date.now()
  });
  const tv = fakeTVLayerV0({ action: row.action, payload: canonical });
  dispatchLocalCommandEventV0(RHIZOH_MEDIA_COMMAND_EVENT_V0, { ...payload, fakeTV: tv });
  logVoiceInfoV0("MEDIA_COMMAND_LOCAL", payload);
  return payload;
}

/**
 * @param {string} canonical
 * @param {ReturnType<typeof readLocalCommandRowV0>} row
 */
export function audioVoiceCommandHandlerV0(canonical, row) {
  if (canonical === "stop_listening" || row.action === "stop_listening") {
    cancelVoiceInstantAckV0();
    try {
      window.speechSynthesis?.cancel?.();
    } catch {
      /* noop */
    }
  }
  if (row.action === "rate_up" || row.action === "rate_down") {
    const synth = window.speechSynthesis;
    if (synth) {
      const delta = row.action === "rate_up" ? 0.06 : -0.06;
      window.__rhizoh = window.__rhizoh || {};
      const prev = Number(window.__rhizoh.ttsRateBias) || 1;
      window.__rhizoh.ttsRateBias = Math.min(1.25, Math.max(0.85, prev + delta));
    }
  }
  const payload = Object.freeze({
    canonical,
    action: row.action,
    layer: row.layer,
    handler: "audioVoiceCommandHandlerV0",
    atMs: Date.now()
  });
  dispatchLocalCommandEventV0(RHIZOH_AUDIO_COMMAND_EVENT_V0, payload);
  logVoiceInfoV0("AUDIO_COMMAND_LOCAL", payload);
  return payload;
}

/**
 * @param {string} canonical
 * @param {ReturnType<typeof readLocalCommandRowV0>} row
 */
export function mapSpatialCommandHandlerV0(canonical, row) {
  const nowMs = Date.now();
  const key = `${canonical}:${row.action}`;
  if (key === lastMapCommandKeyV0 && nowMs - lastMapCommandAtMsV0 < MAP_COMMAND_DEDUPE_MS_V0) {
    const deduped = Object.freeze({
      canonical,
      action: row.action,
      layer: row.layer,
      handler: "mapSpatialCommandHandlerV0",
      atMs: nowMs,
      deduped: true
    });
    logVoiceInfoV0("MAP_COMMAND_DEDUPED", deduped);
    return deduped;
  }
  lastMapCommandKeyV0 = key;
  lastMapCommandAtMsV0 = nowMs;
  prepareMapCommandSideEffectV0(canonical, row.action);
  const payload = Object.freeze({
    canonical,
    action: row.action,
    layer: row.layer,
    handler: "mapSpatialCommandHandlerV0",
    atMs: Date.now()
  });
  dispatchLocalCommandEventV0(RHIZOH_MAP_COMMAND_EVENT_V0, payload);
  applyLocalCommandAppBindingV0(payload);
  logVoiceInfoV0("MAP_COMMAND_LOCAL", payload);
  return payload;
}

/**
 * @param {string} canonical
 * @param {ReturnType<typeof readLocalCommandRowV0>} row
 */
export function cameraVisionCommandHandlerV0(canonical, row) {
  const payload = Object.freeze({
    canonical,
    action: row.action,
    layer: row.layer,
    handler: "cameraVisionCommandHandlerV0",
    atMs: Date.now()
  });
  dispatchLocalCommandEventV0(RHIZOH_CAMERA_COMMAND_EVENT_V0, payload);
  applyLocalCommandAppBindingV0(payload);
  logVoiceInfoV0("CAMERA_COMMAND_LOCAL", payload);
  return payload;
}

/**
 * @param {string} canonical
 * @param {ReturnType<typeof readLocalCommandRowV0>} row
 */
export function systemCastleCommandHandlerV0(canonical, row) {
  if (row.action === "language_runtime" && typeof window !== "undefined") {
    logVoiceInfoV0("LANGUAGE_RUNTIME_DUMP", {
      runtime: window.__CASTLE_LANGUAGE_RUNTIME__ || window.__RHIZOH_LANGUAGE_RUNTIME__,
      invariant: window.__CASTLE_LANGUAGE_INVARIANT__,
      violations: window.__RHIZOH_LANGUAGE_VIOLATIONS__
    });
  }
  const payload = Object.freeze({
    canonical,
    action: row.action,
    layer: row.layer,
    handler: "systemCastleCommandHandlerV0",
    atMs: Date.now()
  });
  dispatchLocalCommandEventV0(RHIZOH_SYSTEM_COMMAND_EVENT_V0, payload);
  logVoiceInfoV0("SYSTEM_COMMAND_LOCAL", payload);
  return payload;
}

const HANDLER_DISPATCH_V0 = Object.freeze({
  mediaCommandHandlerV0,
  audioVoiceCommandHandlerV0,
  mapSpatialCommandHandlerV0,
  cameraVisionCommandHandlerV0,
  systemCastleCommandHandlerV0
});

/**
 * @param {string} canonical
 */
export function dispatchLocalCommandHandlerV0(canonical, opts = {}) {
  const row = readLocalCommandRowV0(canonical);
  if (!row) return null;
  const fn = HANDLER_DISPATCH_V0[row.handler];
  if (typeof fn !== "function") return null;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const payload = fn(canonical, row);
  const latencyMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  const traceId = opts.traceId ? String(opts.traceId) : null;
  const stateTransition = applyCommandStateTransitionV0(canonical, {
    layer: row.layer,
    action: row.action
  });
  if (!stateTransition.ok) {
    recordLocalCommandMemoryV0({
      canonical,
      layer: row.layer,
      action: row.action
    });
  }
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastLocalCommandLatencyMs = latencyMs;
    window.__rhizoh.lastCommandStateTransition = stateTransition;
  }
  return Object.freeze({
    payload,
    latencyMs,
    event: LAYER_EVENT_V0[row.layer],
    stateTransition,
    traceId
  });
}
