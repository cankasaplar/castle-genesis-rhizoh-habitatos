/**
 * SpiralMMO awakening cube — shape · color · speed · direction · light · shadow (v0).
 */

import { SPIRAL_MMO_COLOR_HEX_V0 } from "./spiralMMOAwakeningPaletteV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";

/** @typedef {'rotateY'|'rotateX'|'rotateZ'|'rotate3d'} SpiralMMOCubeAxisV0 */

/**
 * Deterministic noise in [0,1) from seed parts.
 * @param  {...(string|number)} parts
 */
export function spiralMMOAwakeningSeedV0(...parts) {
  const raw = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * @param {{
 *   colorClass: string,
 *   srcContinent: string,
 *   destContinent: string,
 *   routeLengthPct: number,
 *   batchIndex: number,
 *   isOrder: boolean,
 *   cycleSeed: number
 * }} input
 */
export function deriveSpiralMMOAwakeningCubeSpecV0(input) {
  const colorClass = String(input.colorClass || "blue");
  const hex = SPIRAL_MMO_COLOR_HEX_V0[colorClass] || "#00ccff";
  const motion = deriveSpiralMMOContinentCubeMotionV0({ continent: input.srcContinent });
  const seedBase = `${input.cycleSeed}:${colorClass}:${input.srcContinent}:${input.destContinent}:${input.batchIndex}`;
  const r0 = spiralMMOAwakeningSeedV0(seedBase, "shape");
  const r1 = spiralMMOAwakeningSeedV0(seedBase, "speed");
  const r2 = spiralMMOAwakeningSeedV0(seedBase, "size");
  const r3 = spiralMMOAwakeningSeedV0(seedBase, "axis");

  const routeLen = Math.max(8, Number(input.routeLengthPct) || 20);
  const speedFactor = input.isOrder ? 0.88 : 1.12;
  const durationMs = Math.round((2400 + routeLen * 28 + r1 * 1400) * speedFactor);

  const spinDirection = input.isOrder ? motion.direction : r0 > 0.5 ? 1 : -1;
  const axisTypes = /** @type {SpiralMMOCubeAxisV0[]} */ (["rotateY", "rotateX", "rotateZ", "rotate3d"]);
  const axisType = axisTypes[Math.floor(r3 * axisTypes.length) % axisTypes.length];

  const sizePx = Math.round(14 + r2 * 8 + (input.isOrder ? 2 : 0));
  const depth = 0.35 + r2 * 0.55;
  const glowBlur = Math.round(6 + depth * 14);
  const glowSpread = Math.round(2 + depth * 6);
  const shadowX = Math.round(2 + depth * 5);
  const shadowY = Math.round(3 + depth * 7);
  const shadowBlur = Math.round(4 + depth * 10);
  const lightIntensity = 0.55 + depth * 0.45;

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_cube_spec.v0",
    colorClass,
    hex,
    sizePx,
    durationMs,
    spinDirection,
    axisType,
    spinPeriodSec: Number((motion.periodSec * (0.65 + r1 * 0.5)).toFixed(2)),
    depth,
    glowBlur,
    glowSpread,
    shadowX,
    shadowY,
    shadowBlur,
    lightIntensity,
    faceFill: colorClass === "white" ? "rgba(240,240,255,0.9)" : colorClass === "black" ? "rgba(5,5,5,0.95)" : "rgba(10,10,15,0.82)",
    mirrorSheen: colorClass === "mirror"
  });
}

/**
 * @param {ReturnType<typeof deriveSpiralMMOAwakeningCubeSpecV0>} spec
 */
export function spiralMMOAwakeningCubeHtmlV0(spec) {
  const half = spec.sizePx / 2;
  const border =
    spec.colorClass === "mirror"
      ? "1px solid #fff"
      : spec.colorClass === "black"
        ? "1px solid #333"
        : `1px solid ${spec.hex}`;
  const bg = spec.mirrorSheen
    ? "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(150,150,150,0.6) 50%, rgba(30,30,30,0.9) 100%)"
    : spec.faceFill;
  const shadow = `${spec.shadowX}px ${spec.shadowY}px ${spec.shadowBlur}px rgba(0,0,0,0.55)`;
  const glow = `0 0 ${spec.glowBlur}px ${spec.hex}, 0 0 ${spec.glowSpread}px ${spec.hex}88 inset`;

  const face = (transform) =>
    `<div style="position:absolute;width:${spec.sizePx}px;height:${spec.sizePx}px;background:${bg};border:${border};box-shadow:${glow};filter:drop-shadow(${shadow});display:flex;align-items:center;justify-content:center;backface-visibility:hidden;transform:${transform}"></div>`;

  const spinKeyframes = `@keyframes rhizohSpiralCubeSpin${spec.axisType}${spec.spinDirection > 0 ? "P" : "N"}V0 {
  from { transform: rotateX(-18deg) ${spec.axisType}(0deg); }
  to { transform: rotateX(-18deg) ${spec.axisType}(${360 * spec.spinDirection}deg); }
}`;

  return {
    html: `<div class="rhizoh-spiral-flight-cube" data-rhizoh-spiral-cube-color="${spec.colorClass}" style="position:absolute;width:0;height:0;transform-style:preserve-3d;perspective:220px">
      <div style="position:relative;width:${spec.sizePx}px;height:${spec.sizePx}px;transform-style:preserve-3d;animation:rhizohSpiralCubeSpin${spec.axisType}${spec.spinDirection > 0 ? "P" : "N"}V0 ${spec.spinPeriodSec}s linear infinite">
        ${face(`translateZ(${half}px)`)}
        ${face(`rotateY(90deg) translateZ(${half}px)`)}
        ${face(`rotateY(180deg) translateZ(${half}px)`)}
        ${face(`rotateY(-90deg) translateZ(${half}px)`)}
        ${face(`rotateX(90deg) translateZ(${half}px)`)}
        ${face(`rotateX(-90deg) translateZ(${half}px)`)}
      </div>
    </div>`,
    spinKeyframes
  };
}
