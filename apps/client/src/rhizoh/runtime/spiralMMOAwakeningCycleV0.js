/**
 * SpiralMMO awakening cycle — 6:44 global loop, empty cube flights (v0 visual).
 */

import {
  RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
  resetRhizohNeonCountdownDeadlineV0
} from "./rhizohNeonCountdownV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";

export const RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0 = "rhizoh:spiral-mmo-awakening-v0";
export const RHIZOH_SPIRAL_MMO_AWAKENING_TICK_EVENT_V0 = "rhizoh:spiral-mmo-awakening-tick-v0";

export const SPIRAL_MMO_ORDER_COLORS_V0 = Object.freeze(["blue", "cyan", "green", "purple"]);
export const SPIRAL_MMO_CHAOS_COLORS_V0 = Object.freeze(["yellow", "orange", "red", "pink"]);
export const SPIRAL_MMO_SPECIAL_COLORS_V0 = Object.freeze(["mirror", "white", "black"]);

export const SPIRAL_MMO_COLOR_HEX_V0 = Object.freeze({
  blue: "#00ccff",
  cyan: "#00ffff",
  green: "#00ff66",
  purple: "#b026ff",
  yellow: "#ffcc00",
  orange: "#ff9900",
  red: "#ff3333",
  pink: "#ff33cc",
  mirror: "#e0e0e0",
  white: "#ffffff",
  black: "#555555"
});

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
  const hex = SPIRAL_MMO_COLOR_HEX_V0[colorClass] || "#00ff66";
  const half = sizePx / 2;
  const face = (transform) =>
    `<div style="position:absolute;width:${sizePx}px;height:${sizePx}px;background:rgba(10,10,15,0.82);border:1px solid ${hex};box-shadow:0 0 4px ${hex} inset,0 0 8px ${hex}44;backface-visibility:hidden;transform:${transform}"></div>`;

  return `<div class="rhizoh-spiral-empty-cube" data-rhizoh-spiral-cube-color="${colorClass}" style="position:absolute;width:0;height:0;transform-style:preserve-3d;perspective:200px">
    <div style="position:relative;width:${sizePx}px;height:${sizePx}px;transform-style:preserve-3d">
      ${face(`rotateY(0deg) translateZ(${half}px)`)}
      ${face(`rotateY(90deg) translateZ(${half}px)`)}
      ${face(`rotateY(180deg) translateZ(${half}px)`)}
      ${face(`rotateY(-90deg) translateZ(${half}px)`)}
      ${face(`rotateX(90deg) translateZ(${half}px)`)}
      ${face(`rotateX(-90deg) translateZ(${half}px)`)}
    </div>
  </div>`;
}

/**
 * @param {number} triggerPinIndex
 * @param {number} [nowMs]
 */
export function buildSpiralMMOAwakeningLaunchPlanV0(triggerPinIndex, nowMs = Date.now()) {
  const pins = listSpiralMMOContinentMapPinsV0();
  const safeIndex = Math.max(0, Math.min(pins.length - 1, Number(triggerPinIndex) || 0));
  const launches = [];

  const addLaunch = (colorClass, srcIdx, destIdx, gap, isOrder, delayMs = 0) => {
    const src = pins[srcIdx];
    const dest = pins[destIdx];
    if (!src || !dest) return;
    launches.push(
      Object.freeze({
        id: `${colorClass}-${srcIdx}-${destIdx}-${launches.length}`,
        colorClass,
        srcPct: spiralMMOGeoToPercentV0(src.lat, src.lon),
        destPct: spiralMMOGeoToPercentV0(dest.lat, dest.lon),
        gap,
        isOrder,
        delayMs,
        durationMs: 2800 + Math.floor(Math.random() * 1200)
      })
    );
  };

  SPIRAL_MMO_ORDER_COLORS_V0.forEach((color) => {
    const destIndex = (safeIndex + 3) % pins.length;
    for (let i = 0; i < 2; i += 1) {
      addLaunch(color, safeIndex, destIndex, 100, true, Math.floor(Math.random() * 1800));
      addLaunch(color, destIndex, safeIndex, -100, true, Math.floor(Math.random() * 1800));
    }
  });

  SPIRAL_MMO_CHAOS_COLORS_V0.forEach((color) => {
    for (let i = 0; i < 3; i += 1) {
      let srcIndex = Math.floor(Math.random() * pins.length);
      let destIndex;
      do {
        destIndex = Math.floor(Math.random() * pins.length);
      } while (destIndex === srcIndex);
      const gap = (Math.random() * 120 + 40) * (Math.random() < 0.5 ? 1 : -1);
      addLaunch(color, srcIndex, destIndex, gap, false, Math.floor(Math.random() * 2200));
    }
  });

  SPIRAL_MMO_SPECIAL_COLORS_V0.forEach((color) => {
    const count = color === "mirror" ? 6 : 3;
    for (let i = 0; i < count; i += 1) {
      let destIndex;
      do {
        destIndex = Math.floor(Math.random() * pins.length);
      } while (destIndex === safeIndex);
      addLaunch(color, safeIndex, destIndex, (Math.random() - 0.5) * 160, Math.random() > 0.5, Math.floor(Math.random() * 2400));
    }
  });

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_plan.v0",
    triggerPinIndex: safeIndex,
    triggerPinId: pins[safeIndex]?.id || "",
    deadlineMs: resetRhizohNeonCountdownDeadlineV0(nowMs),
    durationMs: RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0,
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
