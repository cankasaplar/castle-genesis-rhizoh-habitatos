/**
 * Map camera visual feedback — zoom pulse, ghost trail hint, voice confirmation.
 * Closes State → Visual World affordances for PR 81A.
 */

import { PersistentCodexBusV0 } from "../../core/PersistentBusV0.js";
import { pickSpeechVoiceForLocaleV0 } from "./rhizohSpeechLocaleV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0 } from "./worldSpaceMapCommandFacadeV0.js";

export const RHIZOH_MAP_GHOST_TRAIL_HINT_EVENT_V0 = "rhizoh:map-ghost-trail-hint-v0";
export const RHIZOH_MAP_VISUAL_PULSE_CLASS_V0 = "rhizoh-map-camera-pulse-v0";

const PULSE_MS_V0 = 520;

const MAP_ACK_PHRASES_V0 = Object.freeze({
  tr: Object.freeze({
    zoom_in: "Yakınlaştırıyorum.",
    zoom_out: "Haritayı uzaklaştırıyorum.",
    fly_to: "Haritaya gidiyorum.",
    center: "Haritayı ortalıyorum.",
    default: "Harita güncellendi."
  }),
  en: Object.freeze({
    zoom_in: "Zooming in.",
    zoom_out: "Zooming out.",
    fly_to: "Flying to map location.",
    center: "Centering the map.",
    default: "Map updated."
  })
});

function resolveMapAckPhraseV0(action, canonical, locale) {
  const tr = locale === "tr";
  const table = MAP_ACK_PHRASES_V0[tr ? "tr" : "en"];
  if (action === "zoom_in" || canonical === "map_zoom_in") return table.zoom_in;
  if (action === "zoom_out" || canonical === "map_zoom_out") return table.zoom_out;
  if (action === "fly_to") return table.fly_to;
  if (action === "center" || canonical === "map_center") return table.center;
  return table.default;
}

/**
 * Brief CSS pulse on map host / Cesium canvas.
 * @param {string} action
 */
export function pulseMapViewportV0(action = "zoom") {
  if (typeof document === "undefined") return false;
  const targets = new Set();
  const host = document.querySelector('[data-rhizoh-world-space-map-host="1"]');
  if (host) targets.add(host);
  const cesiumRoot = document.querySelector('[data-cesium-real-map-layer="1"]');
  if (cesiumRoot) targets.add(cesiumRoot);

  for (const el of targets) {
    el.classList.add(RHIZOH_MAP_VISUAL_PULSE_CLASS_V0);
    el.dataset.rhizohMapPulse = action;
  }

  window.setTimeout(() => {
    for (const el of document.querySelectorAll(`.${RHIZOH_MAP_VISUAL_PULSE_CLASS_V0}`)) {
      el.classList.remove(RHIZOH_MAP_VISUAL_PULSE_CLASS_V0);
      delete el.dataset.rhizohMapPulse;
    }
  }, PULSE_MS_V0);
  return targets.size > 0;
}

/**
 * Ghost trail hint — codex emit + visual event (ties map camera to replay graph).
 * @param {{ lat?: number, lon?: number, action?: string, source?: string }} detail
 */
export function emitMapGhostTrailHintV0(detail = {}) {
  const lat = Number(detail.lat);
  const lon = Number(detail.lon);
  const payload = Object.freeze({
    schema: "rhizoh.map_ghost_trail_hint.v0",
    atMs: Date.now(),
    action: detail.action || "map_camera",
    source: detail.source || "map_visual_feedback",
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null
  });

  logCastleLifecycleV0("map_ghost_trail_hint", payload);

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    void PersistentCodexBusV0.GHOST_SPAWN({
      id: `map_trail_${payload.atMs}`,
      origin: "map_camera",
      lat,
      lon,
      hint: detail.action || "zoom"
    });
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_MAP_GHOST_TRAIL_HINT_EVENT_V0, { detail: payload }));
    } catch {
      /* noop */
    }
  }
  return payload;
}

/**
 * Short spoken confirmation for map camera ops.
 * @param {{ action?: string, canonical?: string, locale?: string }} detail
 */
export function speakMapCommandAckV0(detail = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const locale = detail.locale || readUiLocaleV0();
  const phrase = resolveMapAckPhraseV0(detail.action, detail.canonical, locale);
  if (!phrase) return false;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase);
    u.rate = 1.08;
    u.pitch = 1.02;
    const voice = pickSpeechVoiceForLocaleV0(window.speechSynthesis.getVoices(), locale);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    logCastleLifecycleV0("map_voice_ack", {
      action: detail.action || null,
      canonical: detail.canonical || null,
      phrase
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Full visual feedback chain for a map camera event.
 * @param {object} detail
 */
export function applyMapCameraVisualFeedbackV0(detail = {}) {
  const action = String(detail.action || "");
  const canonical = String(detail.canonical || "");
  pulseMapViewportV0(action || canonical || "map");
  emitMapGhostTrailHintV0({
    lat: detail.lat ?? detail.center?.lat,
    lon: detail.lon ?? detail.center?.lon,
    action: action || canonical,
    source: detail.source || "map_camera_feedback"
  });
  speakMapCommandAckV0({ action, canonical, locale: detail.locale });
  return Object.freeze({
    pulsed: true,
    ghostTrail: true,
    voiceAck: true
  });
}

let installedV0 = false;

export function installWorldMapVisualFeedbackV0() {
  if (typeof window === "undefined" || installedV0) return;
  installedV0 = true;

  window.addEventListener(RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0, (ev) => {
    const detail = ev?.detail;
    if (!detail || detail.deduped === true) return;
    applyMapCameraVisualFeedbackV0(detail);
  });
}

export function __resetWorldMapVisualFeedbackForTestV0() {
  installedV0 = false;
}
