/**
 * SpiralMMO corner bottles — order-route drops (v0 visual).
 */

import { SPIRAL_MMO_COLOR_HEX_V0 } from "./spiralMMOAwakeningPaletteV0.js";

/**
 * @param {number} cornerIndex
 * @param {number} width
 * @param {number} height
 */
export function resolveSpiralMMOBottleCornerPxV0(cornerIndex, width, height) {
  const margin = 60;
  const corners = [
    { x: margin, y: margin },
    { x: width - margin, y: margin },
    { x: margin, y: height - margin },
    { x: width - margin, y: height - margin }
  ];
  return corners[cornerIndex % 4];
}

/**
 * @param {string} colorClass
 */
export function spiralMMOAwakeningBottleHtmlV0(colorClass) {
  const hex = SPIRAL_MMO_COLOR_HEX_V0[colorClass] || "#00ff66";
  return `<div data-rhizoh-spiral-bottle="${colorClass}" style="position:absolute;width:16px;height:40px;transform-origin:bottom center;color:${hex};filter:drop-shadow(0 0 5px currentColor)">
    <svg viewBox="0 0 24 60" width="100%" height="100%" aria-hidden="true">
      <rect x="9" y="0" width="6" height="4" fill="rgba(180,120,50,0.8)"/>
      <path d="M8,30 Q12,27 16,30 L15,48 Q12,51 9,48 Z" fill="rgba(255,255,255,0.8)"/>
      <path d="M10,2 L14,2 L14,12 L20,22 L20,55 A4,4 0 0,1 16,59 L8,59 A4,4 0 0,1 4,55 L4,22 L10,12 Z" fill="rgba(255,255,255,0.05)" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  </div>`;
}

/**
 * @param {ReadonlyArray<{ id: string, colorClass: string, isOrder: boolean, p0: {x:number,y:number}, cp: {x:number,y:number}, p2: {x:number,y:number}, delayMs: number }>} launches
 * @param {number} width
 * @param {number} height
 */
export function buildSpiralMMOAwakeningBottlePlanV0(launches, width, height) {
  const bottles = [];
  let corner = 0;
  for (const launch of launches) {
    if (!launch.isOrder || corner >= 4) continue;
    const t = 0.4;
    const u = 1 - t;
    const dropX =
      u * u * launch.p0.x + 2 * u * t * launch.cp.x + t * t * launch.p2.x;
    const dropY =
      u * u * launch.p0.y + 2 * u * t * launch.cp.y + t * t * launch.p2.y;
    const target = resolveSpiralMMOBottleCornerPxV0(corner, width, height);
    bottles.push(
      Object.freeze({
        id: `bottle-${launch.id}`,
        colorClass: launch.colorClass,
        startX: dropX,
        startY: dropY,
        targetX: target.x,
        targetY: target.y,
        delayMs: launch.delayMs + 1000,
        cornerIndex: corner
      })
    );
    corner += 1;
  }
  return Object.freeze(bottles);
}
