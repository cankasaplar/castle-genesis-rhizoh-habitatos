/**
 * SpiralMMO bird flock flight — spiral routes with tier-labeled 6+44 hints.
 * RESEARCH-ONLY — perception motion only; birds remain citizenship-exempt.
 */

import { spiralMMOAwakeningSeedV0 } from "./spiralMMOAwakeningCubeCalcV0.js";
import { listSpiralMMOWhirlpoolPathPointsV0 } from "./spiralMMOContinentPinsV0.js";
import {
  SPIRAL_MMO_CITIZENSHIP_TIER_ORDER_V0,
  resolveSpiralMMOSixFortyFourTierLabelV0
} from "./spiralMMOPinCitizenshipV0.js";

/**
 * @param {ReadonlyArray<{ x: number, y: number, bank?: number }>} points
 */
function measureSpiralMMOBirdRouteLengthV0(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
  }
  return total;
}

/**
 * @param {ReadonlyArray<{ x: number, y: number, bank?: number }>} points
 * @param {number} offset01
 */
export function sampleSpiralMMOBirdRoutePointV0(points, offset01) {
  if (!points?.length) return { x: 0, y: 0, bank: 0, headingDeg: 0 };
  if (points.length === 1) return { ...points[0], bank: points[0].bank ?? 0, headingDeg: 0 };

  const totalLen = measureSpiralMMOBirdRouteLengthV0(points);
  if (totalLen <= 0) return { ...points[0], bank: points[0].bank ?? 0, headingDeg: 0 };

  let target = ((offset01 % 1) + 1) % 1 * totalLen;
  let walked = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + seg >= target) {
      const t = seg > 0 ? (target - walked) / seg : 0;
      const bankA = a.bank ?? 0;
      const bankB = b.bank ?? 0;
      const headingDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        bank: bankA + (bankB - bankA) * t,
        headingDeg
      };
    }
    walked += seg;
  }
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return {
    ...last,
    bank: last.bank ?? 0,
    headingDeg: (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI
  };
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {{ seed?: string|number, outerR?: number, turns?: number, clockwise?: boolean }} opts
 */
export function buildSpiralMMOBirdFlockRouteV0(cx, cy, opts = {}) {
  const seed = String(opts.seed ?? "flock");
  const r0 = spiralMMOAwakeningSeedV0(seed, "turns");
  const r1 = spiralMMOAwakeningSeedV0(seed, "angle");
  const r2 = spiralMMOAwakeningSeedV0(seed, "radius");
  const turns = opts.turns ?? 1.8 + r0 * 2.8;
  const outerR = opts.outerR ?? 70 + r2 * 140;
  const clockwise = opts.clockwise ?? r1 > 0.5;
  const startAngleDeg = r1 * 360 * (clockwise ? 1 : -1);

  const raw = listSpiralMMOWhirlpoolPathPointsV0(cx, cy, {
    turns,
    outerR,
    innerR: Math.max(6, outerR * 0.06),
    startAngleDeg
  });

  const points = raw.map((p, i) =>
    Object.freeze({
      x: p.x,
      y: p.y,
      bank: Math.sin(i * 0.35 + r0 * 6) * (10 + r2 * 14)
    })
  );

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_bird_flock_route.v0",
    cx,
    cy,
    turns,
    outerR,
    clockwise,
    points: Object.freeze(points),
    loopDurationMs: Math.round(9000 + r0 * 11000)
  });
}

/**
 * Build flock groups — each flock shares a spiral center but unique route + tier hint.
 * @param {{
 *   hostW: number,
 *   hostH: number,
 *   cycleSeed: number,
 *   anchors?: ReadonlyArray<{ x: number, y: number }>
 * }} input
 */
export function buildSpiralMMOBirdFlockPlanV0(input) {
  const hostW = Math.max(320, Number(input.hostW) || 800);
  const hostH = Math.max(240, Number(input.hostH) || 600);
  const cycleSeed = Number(input.cycleSeed) || 0;
  const anchors = input.anchors?.length
    ? input.anchors
    : [{ x: hostW * 0.5, y: hostH * 0.42 }];

  const flockCount = Math.min(4, Math.max(2, anchors.length));
  const flocks = [];

  for (let flockIdx = 0; flockIdx < flockCount; flockIdx += 1) {
    const anchor = anchors[flockIdx % anchors.length];
    const tierId = SPIRAL_MMO_CITIZENSHIP_TIER_ORDER_V0[flockIdx % SPIRAL_MMO_CITIZENSHIP_TIER_ORDER_V0.length];
    const tierLabel = resolveSpiralMMOSixFortyFourTierLabelV0(tierId);
    const route = buildSpiralMMOBirdFlockRouteV0(anchor.x, anchor.y, {
      seed: `${cycleSeed}:flock:${flockIdx}`,
      outerR: 55 + flockIdx * 38 + (hostW / hostH) * 22,
      turns: 2.1 + flockIdx * 0.55,
      clockwise: flockIdx % 2 === 0
    });

    const birdCount = 3 + (flockIdx % 2);
    const birds = [];
    for (let birdIdx = 0; birdIdx < birdCount; birdIdx += 1) {
      const pathOffset = birdIdx / birdCount;
      const start = sampleSpiralMMOBirdRoutePointV0(route.points, pathOffset);
      birds.push(
        Object.freeze({
          flockId: `flock-${flockIdx}`,
          flockIndex: flockIdx,
          birdIndex: birdIdx,
          routePoints: route.points,
          pathOffset,
          loopDurationMs: route.loopDurationMs + birdIdx * 420,
          tierId,
          tierShort: tierLabel.short,
          tierLong: tierLabel.long,
          startX: start.x,
          startY: start.y,
          routeMode: "spiral_flock"
        })
      );
    }

    flocks.push(
      Object.freeze({
        flockId: `flock-${flockIdx}`,
        tierId,
        tierShort: tierLabel.short,
        route,
        birds: Object.freeze(birds)
      })
    );
  }

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_bird_flock_plan.v0",
    flockCount: flocks.length,
    flocks: Object.freeze(flocks),
    birds: Object.freeze(flocks.flatMap((f) => f.birds))
  });
}
