/**
 * SpiralMMO awakening cycle — route-bound cubes, birds, bottles (v0 visual).
 */

import {
  RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
  resolveRhizohNeonCountdownDeadlineForAwakeningV0
} from "./rhizohNeonCountdownV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";
import {
  listSpiralMMOContinentRouteEdgesV0
} from "./spiralMMOContinentRouteGraphV0.js";
import {
  deriveSpiralMMOAwakeningCubeSpecV0,
  spiralMMOAwakeningSeedV0
} from "./spiralMMOAwakeningCubeCalcV0.js";
import { buildSpiralMMOSequencedCubeLaunchesV0 } from "./spiralMMOAwakeningCubeFlowV0.js";
import {
  commitSpiralMMOAwakeningContinuityV0,
  readSpiralMMOContinuityV0,
  resolveSpiralMMOCollapseHandoffV0,
  resolveSpiralMMOEffectiveTriggerV0
} from "./spiralMMOContinuityV0.js";
import { PersistentCodexBusV0 } from "../../core/PersistentBusV0.js";
import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { resolveSpiralMMOBehaviorProfileV0 } from "./spiralMMOSpiralBehaviorV0.js";
import { spiralMMOMapGeoToPercentV0 } from "./spiralMMOMapGeoProjectV0.js";
import { resetSpiralMMOSessionCubeAccumV0 } from "./spiralMMOSessionAccumulationV0.js";
import {
  SPIRAL_MMO_CHAOS_COLORS_V0,
  SPIRAL_MMO_COLOR_HEX_V0,
  SPIRAL_MMO_ORDER_COLORS_V0,
  SPIRAL_MMO_SPECIAL_COLORS_V0
} from "./spiralMMOAwakeningPaletteV0.js";

export {
  SPIRAL_MMO_ORDER_COLORS_V0,
  SPIRAL_MMO_CHAOS_COLORS_V0,
  SPIRAL_MMO_SPECIAL_COLORS_V0,
  SPIRAL_MMO_COLOR_HEX_V0
} from "./spiralMMOAwakeningPaletteV0.js";

export const RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0 = "rhizoh:spiral-mmo-awakening-v0";
export const RHIZOH_SPIRAL_MMO_BUILD_REV_V0 = "spiral-mmo-session-stack-v0.7";
export const RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 = "rhizoh:spiral-mmo-immersion-end-v0";

/**
 * @param {number} lat
 * @param {number} lon
 */
export function spiralMMOGeoToPercentV0(lat, lon) {
  return spiralMMOMapGeoToPercentV0(lat, lon);
}

/**
 * @param {number} t
 * @param {{ x: number, y: number }} p0
 * @param {{ x: number, y: number }} p1
 * @param {{ x: number, y: number }} p2
 */
export function spiralMMOBezierPointV0(t, p0, p1, p2) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  };
}

/**
 * @param {string} colorClass
 * @param {number} sizePx
 */
export function spiralMMOEmptyCubeHtmlV0(colorClass, sizePx = 18) {
  const spec = deriveSpiralMMOAwakeningCubeSpecV0({
    colorClass,
    srcContinent: "europe",
    destContinent: "africa",
    routeLengthPct: 24,
    batchIndex: 0,
    isOrder: true,
    cycleSeed: 1
  });
  return `<div class="rhizoh-spiral-empty-cube" data-rhizoh-spiral-cube-color="${colorClass}" style="width:${sizePx}px;height:${sizePx}px;border:1px solid ${SPIRAL_MMO_COLOR_HEX_V0[colorClass] || "#00ccff"}"></div>`;
}

/**
 * @param {ReadonlyArray<{ lat: number, lon: number }>} pins
 */
export function buildSpiralMMOAwakeningRouteLinesV0(pins) {
  const continentByIdx = pins.map((p) => p.continent);
  return listSpiralMMOContinentRouteEdgesV0().map(([a, b], idx) => {
    const ai = continentByIdx.indexOf(a);
    const bi = continentByIdx.indexOf(b);
    if (ai < 0 || bi < 0) return null;
    return Object.freeze({
      id: `route-${a}-${b}-${idx}`,
      aPct: spiralMMOGeoToPercentV0(pins[ai].lat, pins[ai].lon),
      bPct: spiralMMOGeoToPercentV0(pins[bi].lat, pins[bi].lon)
    });
  }).filter(Boolean);
}

/**
 * @param {number} triggerPinIndex
 * @param {number} [nowMs]
 * @param {{ mode?: 'click'|'collapse'|'test', commit?: boolean, resetSession?: boolean }} [opts]
 */
export function buildSpiralMMOAwakeningLaunchPlanV0(triggerPinIndex, nowMs = Date.now(), opts = {}) {
  const pins = listSpiralMMOContinentMapPinsV0();
  const pinCount = pins.length;
  const requestedIndex = Math.max(0, Math.min(pinCount - 1, Number(triggerPinIndex) || 0));
  const continuityBefore = readSpiralMMOContinuityV0();

  let effectiveIndex = requestedIndex;
  let triggerResolution = Object.freeze({
    triggerIndex: requestedIndex,
    requestedIndex,
    advanced: false,
    reason: "direct"
  });

  if (opts.mode === "collapse") {
    const handoff = resolveSpiralMMOCollapseHandoffV0(requestedIndex, pinCount);
    effectiveIndex = handoff.toIndex;
    triggerResolution = Object.freeze({
      triggerIndex: handoff.toIndex,
      requestedIndex,
      advanced: handoff.dualTransition,
      reason: "collapse_dual_handoff"
    });
  } else {
    triggerResolution = resolveSpiralMMOEffectiveTriggerV0(requestedIndex, pinCount);
    effectiveIndex = triggerResolution.triggerIndex;
  }

  const previousPin = continuityBefore.lastTriggerIndex >= 0 ? pins[continuityBefore.lastTriggerIndex] : null;
  const triggerPin = pins[effectiveIndex];
  const behavior = resolveSpiralMMOBehaviorProfileV0(triggerPin?.continent || "europe", continuityBefore.epoch);
  const cycleSeed = nowMs ^ (effectiveIndex * 9973) ^ (continuityBefore.epoch * 7919);
  const handoff = resolveSpiralMMOCollapseHandoffV0(effectiveIndex, pinCount);
  const launches = [];

  const addLaunch = (launch) => {
    launches.push(Object.freeze(launch));
  };

  if (opts.resetSession) {
    resetSpiralMMOSessionCubeAccumV0();
  }

  buildSpiralMMOSequencedCubeLaunchesV0({
    triggerPinIndex: effectiveIndex,
    pins,
    cycleSeed,
    behavior,
    handoffFromContinent: previousPin?.continent || null,
    addLaunch
  });

  const deadlineMs = resolveRhizohNeonCountdownDeadlineForAwakeningV0(nowMs, Boolean(opts.resetSession));

  const plan = Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_plan.v0",
    buildRev: RHIZOH_SPIRAL_MMO_BUILD_REV_V0,
    sessionReset: Boolean(opts.resetSession),
    triggerPinIndex: effectiveIndex,
    requestedPinIndex: requestedIndex,
    triggerPinId: triggerPin?.id || "",
    previousTriggerPinIndex: continuityBefore.lastTriggerIndex,
    previousTriggerPinId: previousPin?.id || "",
    collapseHandoff: handoff,
    triggerResolution,
    continuityEpoch: continuityBefore.epoch,
    behavior,
    deadlineMs,
    durationMs: RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
    cycleSeed,
    routeLines: Object.freeze([]),
    launches: Object.freeze(launches)
  });

  if (opts.commit !== false) {
    commitSpiralMMOAwakeningContinuityV0(effectiveIndex, {
      handoffFromIndex: continuityBefore.lastTriggerIndex
    });
  }

  return plan;
}

/**
 * @param {number} triggerPinIndex
 * @param {number} [nowMs]
 */
export function dispatchSpiralMMOAwakeningV0(triggerPinIndex, nowMs = Date.now()) {
  void applyRhizohWorldMapToolV0("satellite", {
    leafletOnly: true,
    source: "SPIRAL_MMO_AWAKEN"
  });

  const plan = buildSpiralMMOAwakeningLaunchPlanV0(triggerPinIndex, nowMs, { mode: "click", commit: true });
  const pins = listSpiralMMOContinentMapPinsV0();
  const triggerPin = pins[plan.triggerPinIndex];
  const previousPin =
    plan.previousTriggerPinIndex >= 0 ? pins[plan.previousTriggerPinIndex] : null;

  void PersistentCodexBusV0.AWAKEN({
    pin: triggerPin?.continent || "",
    continent: triggerPin?.continent || "",
    triggerPinIndex: plan.triggerPinIndex,
    triggerPinId: plan.triggerPinId,
    previousPin: previousPin?.continent || "",
    previousContinent: previousPin?.continent || "",
    continuityEpoch: plan.continuityEpoch,
    cycleSeed: plan.cycleSeed
  });

  if (typeof window !== "undefined") {
    try {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.spiralMMOBuildRev = RHIZOH_SPIRAL_MMO_BUILD_REV_V0;
    } catch {
      /* noop */
    }
    window.dispatchEvent(
      new CustomEvent(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, { detail: plan })
    );
  }
  return plan;
}

/**
 * @param {string} pinId
 */
export function resolveSpiralMMOTriggerIndexFromPinIdV0(pinId) {
  const pins = listSpiralMMOContinentMapPinsV0();
  const idx = pins.findIndex((p) => p.id === pinId);
  return idx >= 0 ? idx : 0;
}

/**
 * @param {string} continent
 */
export function resolveSpiralMMOAccentForContinentV0(continent) {
  return deriveSpiralMMOContinentCubeMotionV0({ continent }).accent;
}
