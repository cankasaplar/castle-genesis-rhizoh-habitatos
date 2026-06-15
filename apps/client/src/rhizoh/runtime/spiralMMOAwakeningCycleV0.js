/**
 * SpiralMMO awakening cycle — route-bound cubes, birds, bottles (v0 visual).
 */

import {
  RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
  resetRhizohNeonCountdownDeadlineV0
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
export const RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 = "rhizoh:spiral-mmo-immersion-end-v0";

/**
 * @param {number} lat
 * @param {number} lon
 */
export function spiralMMOGeoToPercentV0(lat, lon) {
  const x = ((Number(lon) + 180) / 360) * 100;
  const clampedLat = Math.max(-70, Math.min(70, Number(lat)));
  const y = ((70 - clampedLat) / 140) * 100;
  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(8, Math.min(88, y))
  };
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
 */
export function buildSpiralMMOAwakeningLaunchPlanV0(triggerPinIndex, nowMs = Date.now()) {
  const pins = listSpiralMMOContinentMapPinsV0();
  const safeIndex = Math.max(0, Math.min(pins.length - 1, Number(triggerPinIndex) || 0));
  const cycleSeed = nowMs ^ (safeIndex * 9973);
  const launches = [];

  const addLaunch = (launch) => {
    launches.push(Object.freeze(launch));
  };

  buildSpiralMMOSequencedCubeLaunchesV0({
    triggerPinIndex: safeIndex,
    pins,
    cycleSeed,
    addLaunch
  });

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_plan.v0",
    triggerPinIndex: safeIndex,
    triggerPinId: pins[safeIndex]?.id || "",
    deadlineMs: resetRhizohNeonCountdownDeadlineV0(nowMs),
    durationMs: RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
    cycleSeed,
    routeLines: Object.freeze(buildSpiralMMOAwakeningRouteLinesV0(pins)),
    launches: Object.freeze(launches)
  });
}

/**
 * @param {number} triggerPinIndex
 * @param {number} [nowMs]
 */
export function dispatchSpiralMMOAwakeningV0(triggerPinIndex, nowMs = Date.now()) {
  const plan = buildSpiralMMOAwakeningLaunchPlanV0(triggerPinIndex, nowMs);
  if (typeof window !== "undefined") {
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
