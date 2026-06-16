/**
 * Meaningful map transitions — staged approach, dwell, commit (pins · SpiralMMO · birds).
 * SPECFLOW: RESEARCH-ONLY — perception pacing; no frozen phase*.js edits.
 */

import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import {
  dispatchSpiralMMOAwakeningV0,
  resolveSpiralMMOTriggerIndexFromPinIdV0
} from "./spiralMMOAwakeningCycleV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";

export const WORLD_MAP_TRANSITION_SCHEMA_V0 = "rhizoh.world_map_meaningful_transition.v0";
export const RHIZOH_MAP_TRANSITION_PHASE_EVENT_V0 = "rhizoh:map-transition-phase-v0";

/** Leaflet flyTo for generic pins */
export const MAP_PIN_FLY_TO_MS_V0 = 2200;
/** Spiral continent pin approach */
export const SPIRAL_PIN_FLY_TO_MS_V0 = 2800;
/** Pause after camera arrives before committing action */
export const MAP_PIN_APPROACH_DWELL_MS_V0 = 1200;
export const SPIRAL_PIN_APPROACH_DWELL_MS_V0 = 1600;
/** Delay before immersion chrome hides (lets user read map context) */
export const SPIRAL_IMMERSION_ENTER_DELAY_MS_V0 = 1100;
/** Hover preview dwell — avoids accidental preview on quick pass */
export const MAP_PIN_HOVER_DWELL_MS_V0 = 750;

let transitionBusy = false;
let hoverTimer = null;
let hoverTargetId = null;

/**
 * @param {string} phase
 * @param {object} [detail]
 */
export function publishMapTransitionPhaseV0(phase, detail = {}) {
  if (typeof window === "undefined") return;
  const payload = Object.freeze({
    schema: WORLD_MAP_TRANSITION_SCHEMA_V0,
    phase: String(phase || "idle"),
    busy: transitionBusy,
    atMs: Date.now(),
    ...detail
  });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mapTransition = payload;
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_MAP_TRANSITION_PHASE_EVENT_V0, { detail: payload }));
  } catch {
    /* noop */
  }
}

/**
 * @returns {boolean}
 */
export function isMapTransitionBusyV0() {
  return transitionBusy;
}

/**
 * Fly Leaflet map toward node, dwell, then run commit callback.
 * @param {object} map — Leaflet map instance
 * @param {object} node
 * @param {{ flyMs?: number, dwellMs?: number, zoom?: number, label?: string }} [opts]
 * @param {() => void} onCommit
 */
export function runMapPinApproachThenV0(map, node, opts = {}, onCommit) {
  if (typeof window === "undefined") return false;
  if (transitionBusy) return false;

  const lat = Number(node?.lat);
  const lon = Number(node?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    onCommit?.();
    return true;
  }

  const isSpiral = String(node?.type || "") === "spiralmmo";
  const flyMs = Math.max(
    800,
    Number(opts.flyMs) || (isSpiral ? SPIRAL_PIN_FLY_TO_MS_V0 : MAP_PIN_FLY_TO_MS_V0)
  );
  const dwellMs = Math.max(
    400,
    Number(opts.dwellMs) || (isSpiral ? SPIRAL_PIN_APPROACH_DWELL_MS_V0 : MAP_PIN_APPROACH_DWELL_MS_V0)
  );
  const zoom = Math.max(
    5,
    Number(opts.zoom) || Math.max(map?.getZoom?.() || 14, isSpiral ? 5 : 16)
  );

  transitionBusy = true;
  publishMapTransitionPhaseV0("approach", {
    nodeId: node.id,
    nodeType: node.type,
    label: opts.label || node.label || node.name || node.id,
    flyMs,
    dwellMs
  });

  try {
    map?.flyTo?.([lat, lon], zoom, { animate: true, duration: flyMs / 1000 });
  } catch {
    /* noop */
  }

  window.setTimeout(() => {
    publishMapTransitionPhaseV0("dwell", {
      nodeId: node.id,
      nodeType: node.type,
      label: opts.label || node.label || node.name
    });
    window.setTimeout(() => {
      publishMapTransitionPhaseV0("commit", { nodeId: node.id, nodeType: node.type });
      try {
        onCommit?.();
      } finally {
        transitionBusy = false;
        publishMapTransitionPhaseV0("idle");
      }
    }, dwellMs);
  }, flyMs);

  return true;
}

/**
 * Staged SpiralMMO awakening — approach pin, dwell, then awakening (deduped entry).
 * @param {string} pinId
 * @param {object} [map]
 */
export function dispatchSpiralMMOAwakeningStagedV0(pinId, map = null) {
  const triggerIndex = resolveSpiralMMOTriggerIndexFromPinIdV0(String(pinId || ""));
  const node = listSpiralMMOContinentMapPinsV0().find((p) => p.id === pinId) || null;

  const commitAwakening = () => {
    publishMapTransitionPhaseV0("spiral_awaken", { pinId, triggerIndex });
    dispatchSpiralMMOAwakeningV0(triggerIndex);
  };

  if (!map || !node) {
    commitAwakening();
    return;
  }

  runMapPinApproachThenV0(
    map,
    node,
    {
      flyMs: SPIRAL_PIN_FLY_TO_MS_V0,
      dwellMs: SPIRAL_PIN_APPROACH_DWELL_MS_V0,
      zoom: Math.max(map.getZoom?.() || 4, 5),
      label: node.label || node.name || "SpiralMMO"
    },
    commitAwakening
  );
}

/**
 * Debounced hover — only fires after dwell on same pin.
 * @param {object} node
 * @param {(node: object) => void} onDwell
 * @param {(node: object) => void} [onClear]
 */
export function scheduleMapPinHoverDwellV0(node, onDwell, onClear) {
  if (typeof window === "undefined") return;
  const id = String(node?.id || "");
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  if (!id) {
    onClear?.(node);
    hoverTargetId = null;
    return;
  }
  if (hoverTargetId && hoverTargetId !== id) {
    onClear?.({ id: hoverTargetId });
  }
  hoverTargetId = id;
  hoverTimer = window.setTimeout(() => {
    hoverTimer = null;
    if (hoverTargetId === id) onDwell?.(node);
  }, MAP_PIN_HOVER_DWELL_MS_V0);
}

/**
 * Cancel pending hover dwell.
 */
export function cancelMapPinHoverDwellV0(onClear) {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  if (hoverTargetId) {
    onClear?.({ id: hoverTargetId });
    hoverTargetId = null;
  }
}

/**
 * Delayed satellite + immersion handoff (call from awakening listener).
 * @param {() => void} enterImmersion
 */
export function runSpiralImmersionEnterStagedV0(enterImmersion) {
  publishMapTransitionPhaseV0("spiral_immersion_pending");
  window.setTimeout(() => {
    void applyRhizohWorldMapToolV0("satellite", {
      leafletOnly: true,
      source: "SPIRAL_MMO_IMMERSION_STAGED"
    });
    enterImmersion?.();
    publishMapTransitionPhaseV0("spiral_immersion_active");
  }, SPIRAL_IMMERSION_ENTER_DELAY_MS_V0);
}

export function resetWorldMapTransitionForTestsV0() {
  transitionBusy = false;
  if (hoverTimer && typeof window !== "undefined") {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  hoverTargetId = null;
}
