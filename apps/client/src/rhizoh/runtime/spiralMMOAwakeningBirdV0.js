/**
 * SpiralMMO light-birds — procedural grayscale flock (v0 visual).
 */

import { spiralMMOAwakeningSeedV0 } from "./spiralMMOAwakeningCubeCalcV0.js";

/**
 * @param {{
 *   id: string,
 *   startX: number,
 *   startY: number,
 *   cycleSeed: number,
 *   birdIndex: number
 * }} input
 */
export function buildSpiralMMOAwakeningBirdSpecV0(input) {
  const seed = `${input.cycleSeed}:bird:${input.id}:${input.birdIndex}`;
  const r0 = spiralMMOAwakeningSeedV0(seed, "gray");
  const r1 = spiralMMOAwakeningSeedV0(seed, "scale");
  const r2 = spiralMMOAwakeningSeedV0(seed, "opacity");
  const r3 = spiralMMOAwakeningSeedV0(seed, "wing");

  const gray = Math.floor(r0 * 256);
  const depthScale = 0.3 + r1 * 1.2;
  const depthOpacity = 0.4 + r2 * 0.6;
  const wingDur = 0.35 + r3 * 0.55;
  const hoverDur = 2.4 + r1 * 2.0;

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_awakening_bird.v0",
    id: input.id,
    startX: input.startX,
    startY: input.startY,
    arcTarget: input.arcTarget || null,
    kind: input.kind || "order",
    gray,
    depthScale,
    depthOpacity,
    wingDur,
    hoverDur,
    color: `rgb(${gray}, ${gray}, ${gray})`,
    citizenshipExempt: true,
    routeMode: "free"
  });
}

/**
 * @param {ReturnType<typeof buildSpiralMMOAwakeningBirdSpecV0>} spec
 */
export function spiralMMOAwakeningBirdHtmlV0(spec) {
  const size = 20;
  return `<div data-rhizoh-spiral-bird="${spec.id}" style="position:absolute;width:${size}px;height:${size}px;color:${spec.color};transform:scale(${spec.depthScale});opacity:${spec.depthOpacity};filter:drop-shadow(0 0 4px ${spec.color})">
    <svg viewBox="0 0 24 24" width="100%" height="100%" overflow="visible" aria-hidden="true">
      <path fill="currentColor" opacity="0.9" d="M12,16 L2,6 L12,10 L22,6 Z">
        <animate attributeName="d" dur="${spec.wingDur}s" repeatCount="indefinite"
          values="M12,16 L2,6 L12,10 L22,6 Z;M12,14 L2,20 L12,10 L22,20 Z;M12,16 L2,6 L12,10 L22,6 Z"/>
      </path>
    </svg>
  </div>`;
}

/**
 * @param {ReadonlyArray<{ id: string, p0: { x: number, y: number }, p2?: { x: number, y: number }, delayMs: number, kind?: string }>} launches
 * @param {number} cycleSeed
 * @param {{ triggerX?: number, triggerY?: number }} [opts]
 */
export function buildSpiralMMOAwakeningBirdPlanV0(launches, cycleSeed, opts = {}) {
  const birds = [];
  if (Number.isFinite(opts.triggerX) && Number.isFinite(opts.triggerY)) {
    birds.push(
      buildSpiralMMOAwakeningBirdSpecV0({
        id: "bird-gate-anchor",
        startX: opts.triggerX,
        startY: opts.triggerY,
        cycleSeed,
        birdIndex: -1
      })
    );
  }
  launches.forEach((launch, idx) => {
    if (idx % 3 !== 0) return;
    const startX = launch.p0?.x ?? opts.triggerX ?? 0;
    const startY = launch.p0?.y ?? opts.triggerY ?? 0;
    birds.push(
      buildSpiralMMOAwakeningBirdSpecV0({
        id: `bird-${launch.id}`,
        startX,
        startY,
        cycleSeed,
        birdIndex: idx,
        arcTarget: launch.p2 || null,
        kind: launch.kind || "order"
      })
    );
  });
  return Object.freeze(birds);
}
