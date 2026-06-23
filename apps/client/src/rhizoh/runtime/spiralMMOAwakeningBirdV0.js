/**
 * SpiralMMO light-birds — procedural grayscale flock (v0 visual).
 */

import { spiralMMOAwakeningSeedV0 } from "./spiralMMOAwakeningCubeCalcV0.js";
import { buildSpiralMMOBirdFlockPlanV0 } from "./spiralMMOBirdFlockFlightV0.js";

/**
 * @param {{
 *   id: string,
 *   startX: number,
 *   startY: number,
 *   cycleSeed: number,
 *   birdIndex: number,
 *   flockId?: string,
 *   tierId?: string,
 *   tierShort?: string,
 *   tierLong?: string,
 *   routeMode?: string,
 *   routePoints?: ReadonlyArray<{ x: number, y: number, bank?: number }>,
 *   pathOffset?: number,
 *   loopDurationMs?: number
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
    flockId: input.flockId || null,
    flockIndex: input.flockIndex ?? null,
    birdIndex: input.birdIndex,
    tierId: input.tierId || null,
    tierShort: input.tierShort || null,
    tierLong: input.tierLong || null,
    routePoints: input.routePoints ? Object.freeze([...input.routePoints]) : null,
    pathOffset: Number.isFinite(input.pathOffset) ? input.pathOffset : 0,
    loopDurationMs: Number(input.loopDurationMs) > 0 ? Number(input.loopDurationMs) : 12000,
    gray,
    depthScale,
    depthOpacity,
    wingDur,
    hoverDur,
    color: `rgb(${gray}, ${gray}, ${gray})`,
    citizenshipExempt: true,
    routeMode: input.routeMode || "spiral_flock"
  });
}

/**
 * @param {ReturnType<typeof buildSpiralMMOAwakeningBirdSpecV0>} spec
 */
export function spiralMMOAwakeningBirdHtmlV0(spec) {
  const size = 20;
  const tierBadge = spec.tierShort
    ? `<span title="${spec.tierLong || spec.tierShort}" style="position:absolute;left:50%;top:-10px;transform:translateX(-50%);font:600 7px/1 Courier New,monospace;letter-spacing:0.04em;color:rgba(255,255,255,0.72);text-shadow:0 0 6px rgba(0,0,0,0.9);white-space:nowrap;pointer-events:none">${spec.tierShort}</span>`
    : "";
  return `<div data-rhizoh-spiral-bird="${spec.id}" data-rhizoh-spiral-bird-route="${spec.routeMode || "free"}" data-rhizoh-spiral-bird-tier="${spec.tierId || ""}" data-rhizoh-spiral-bird-flock="${spec.flockId || ""}" style="position:absolute;width:${size}px;height:${size}px;color:${spec.color};transform:scale(${spec.depthScale});opacity:${spec.depthOpacity};filter:drop-shadow(0 0 4px ${spec.color})">
    ${tierBadge}
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
 * @param {{ triggerX?: number, triggerY?: number, hostW?: number, hostH?: number }} [opts]
 */
export function buildSpiralMMOAwakeningBirdPlanV0(launches, cycleSeed, opts = {}) {
  const hostW = Number(opts.hostW) || 960;
  const hostH = Number(opts.hostH) || 640;
  const anchors = [];

  if (Number.isFinite(opts.triggerX) && Number.isFinite(opts.triggerY)) {
    anchors.push({ x: opts.triggerX, y: opts.triggerY });
  }

  launches.forEach((launch, idx) => {
    if (idx % 5 !== 0) return;
    const x = launch.p2?.x ?? launch.p0?.x;
    const y = launch.p2?.y ?? launch.p0?.y;
    if (Number.isFinite(x) && Number.isFinite(y)) anchors.push({ x, y });
  });

  const flockPlan = buildSpiralMMOBirdFlockPlanV0({
    hostW,
    hostH,
    cycleSeed,
    anchors: anchors.length ? anchors : undefined
  });

  const birds = flockPlan.birds.map((b, idx) =>
    buildSpiralMMOAwakeningBirdSpecV0({
      id: `bird-${b.flockId}-${b.birdIndex}`,
      startX: b.startX,
      startY: b.startY,
      cycleSeed,
      birdIndex: idx,
      flockId: b.flockId,
      flockIndex: b.flockIndex,
      tierId: b.tierId,
      tierShort: b.tierShort,
      tierLong: b.tierLong,
      routePoints: b.routePoints,
      pathOffset: b.pathOffset,
      loopDurationMs: b.loopDurationMs,
      routeMode: b.routeMode
    })
  );

  return Object.freeze(birds);
}
