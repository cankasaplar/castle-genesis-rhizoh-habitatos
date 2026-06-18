/**
 * SpiralMMO awakening cube — shape · color · speed · direction · light · shadow (v0).
 */

import { SPIRAL_MMO_COLOR_HEX_V0 } from "./spiralMMOAwakeningPaletteV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";
import {
  resolveSpiralCubeRenderScaleV0,
  resolveSpiralCubeSizePxV0,
  SPIRAL_CUBE_UNIT_SCHEMA_V0
} from "./spiralMMOCubeUnitV0.js";

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
 *   depthLayer?: number,
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
  const depthLayer = Math.max(0, Math.min(2, Number(input.depthLayer) || 0));

  const routeLen = Math.max(8, Number(input.routeLengthPct) || 20);
  const speedFactor = (input.isOrder ? 0.88 : 1.02) * (1.06 - depthLayer * 0.08);
  const durationMs = Math.round((2400 + routeLen * 32 + r1 * 900) * speedFactor);

  const spinDirection = input.isOrder ? motion.direction : depthLayer % 2 === 0 ? 1 : -1;
  const axisTypes = /** @type {SpiralMMOCubeAxisV0[]} */ (["rotateY", "rotateX", "rotateZ", "rotate3d"]);
  const axisType = axisTypes[Math.floor(r3 * axisTypes.length) % axisTypes.length];

  const sizePx = resolveSpiralCubeSizePxV0({
    depthLayer,
    sizeNoise: r2,
    isOrder: input.isOrder
  });
  const depth = 0.22 + depthLayer * 0.3 + r2 * 0.18;
  const renderScaleFactor = resolveSpiralCubeRenderScaleV0({ depth });
  const glowBlur = Math.round(6 + depth * 14);
  const glowSpread = Math.round(2 + depth * 6);
  const shadowX = Math.round(2 + depth * 5);
  const shadowY = Math.round(3 + depth * 7);
  const shadowBlur = Math.round(4 + depth * 10);
  const lightIntensity = 0.55 + depth * 0.45;

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_cube_spec.v0",
    unitSchema: SPIRAL_CUBE_UNIT_SCHEMA_V0,
    colorClass,
    hex,
    sizePx,
    renderScaleFactor,
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
  const shadow = `${spec.shadowX}px ${spec.shadowY}px ${spec.shadowBlur}px rgba(0,0,0,0.55)`;

  const faceFill = spec.mirrorSheen
    ? "transparent"
    : spec.colorClass === "white"
      ? "rgba(240,240,255,0.15)"
      : spec.colorClass === "black"
        ? "rgba(5,5,5,0.35)"
        : "rgba(3,3,8,0.55)";
  const edge = spec.hex;
  const sz = spec.sizePx;
  const off = sz * 0.35;

  const wireRect = (x, y, w, h, alpha = 1) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${edge}" stroke-width="1" opacity="${alpha}"/>`;

  const spinKeyframes = `@keyframes rhizohSpiralCubeSpin${spec.axisType}${spec.spinDirection > 0 ? "P" : "N"}V0 {
  from { transform: rotateX(-18deg) ${spec.axisType}(0deg); }
  to { transform: rotateX(-18deg) ${spec.axisType}(${360 * spec.spinDirection}deg); }
}`;

  return {
    html: `<div class="rhizoh-spiral-flight-cube" data-rhizoh-spiral-cube-color="${spec.colorClass}" style="position:absolute;width:0;height:0;transform-style:preserve-3d;filter:drop-shadow(${shadow})">
      <div style="position:relative;width:${sz}px;height:${sz}px;transform-style:preserve-3d;animation:rhizohSpiralCubeSpin${spec.axisType}${spec.spinDirection > 0 ? "P" : "N"}V0 ${spec.spinPeriodSec}s linear infinite">
        <svg viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" style="position:absolute;left:0;top:0;overflow:visible">
          <rect x="0.5" y="0.5" width="${sz - 1}" height="${sz - 1}" fill="${faceFill}" stroke="${edge}" stroke-width="1"/>
          ${wireRect(off, -off, sz, sz, 0.5)}
          <line x1="0.5" y1="0.5" x2="${off + 0.5}" y2="${-off + 0.5}" stroke="${edge}" stroke-width="0.75" opacity="0.55"/>
          <line x1="${sz - 0.5}" y1="0.5" x2="${off + sz - 0.5}" y2="${-off + 0.5}" stroke="${edge}" stroke-width="0.75" opacity="0.55"/>
          <line x1="${sz - 0.5}" y1="${sz - 0.5}" x2="${off + sz - 0.5}" y2="${sz - off - 0.5}" stroke="${edge}" stroke-width="0.75" opacity="0.55"/>
          <line x1="0.5" y1="${sz - 0.5}" x2="${off + 0.5}" y2="${sz - off - 0.5}" stroke="${edge}" stroke-width="0.75" opacity="0.55"/>
        </svg>
      </div>
    </div>`,
    spinKeyframes
  };
}
