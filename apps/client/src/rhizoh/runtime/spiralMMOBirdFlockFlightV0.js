/**
 * SpiralMMO bird flock flight — helical spiral routes (3D perception).
 * RESEARCH-ONLY — perception motion only; birds remain citizenship-exempt.
 * Tier labels belong on pins only — never on birds.
 */

import { spiralMMOAwakeningSeedV0 } from "./spiralMMOAwakeningCubeCalcV0.js";
import { listSpiralMMOWhirlpoolPathPointsV0 } from "./spiralMMOContinentPinsV0.js";

/**
 * @param {ReadonlyArray<{ x: number, y: number, z?: number, bank?: number, pitchDeg?: number }>} points
 */
function measureSpiralMMOBirdRouteLengthV0(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dz = (points[i].z ?? 0) - (points[i - 1].z ?? 0);
    total += Math.hypot(dx, dy, dz);
  }
  return total;
}

/**
 * @param {ReadonlyArray<{ x: number, y: number, z?: number, bank?: number, pitchDeg?: number }>} points
 * @param {number} offset01
 */
export function sampleSpiralMMOBirdRoutePointV0(points, offset01) {
  if (!points?.length) return { x: 0, y: 0, z: 0, bank: 0, pitchDeg: 0, headingDeg: 0, depthScaleMul: 1 };
  if (points.length === 1) {
    const p = points[0];
    return {
      x: p.x,
      y: p.y,
      z: p.z ?? 0,
      bank: p.bank ?? 0,
      pitchDeg: p.pitchDeg ?? 0,
      headingDeg: 0,
      depthScaleMul: 1
    };
  }

  const totalLen = measureSpiralMMOBirdRouteLengthV0(points);
  if (totalLen <= 0) {
    const p = points[0];
    return {
      x: p.x,
      y: p.y,
      z: p.z ?? 0,
      bank: p.bank ?? 0,
      pitchDeg: p.pitchDeg ?? 0,
      headingDeg: 0,
      depthScaleMul: 1
    };
  }

  let target = ((offset01 % 1) + 1) % 1 * totalLen;
  let walked = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y, (b.z ?? 0) - (a.z ?? 0));
    if (walked + seg >= target) {
      const t = seg > 0 ? (target - walked) / seg : 0;
      const z = (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * t;
      const bankA = a.bank ?? 0;
      const bankB = b.bank ?? 0;
      const pitchA = a.pitchDeg ?? 0;
      const pitchB = b.pitchDeg ?? 0;
      const headingDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const depthScaleMul = 0.78 + Math.max(-40, Math.min(60, z)) / 120;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z,
        bank: bankA + (bankB - bankA) * t,
        pitchDeg: pitchA + (pitchB - pitchA) * t,
        headingDeg,
        depthScaleMul
      };
    }
    walked += seg;
  }
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const z = last.z ?? 0;
  return {
    x: last.x,
    y: last.y,
    z,
    bank: last.bank ?? 0,
    pitchDeg: last.pitchDeg ?? 0,
    headingDeg: (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI,
    depthScaleMul: 0.78 + Math.max(-40, Math.min(60, z)) / 120
  };
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {{ seed?: string|number, outerR?: number, turns?: number, clockwise?: boolean, hostW?: number }} opts
 */
export function buildSpiralMMOBirdFlockRouteV0(cx, cy, opts = {}) {
  const seed = String(opts.seed ?? "flock");
  const r0 = spiralMMOAwakeningSeedV0(seed, "turns");
  const r1 = spiralMMOAwakeningSeedV0(seed, "angle");
  const r2 = spiralMMOAwakeningSeedV0(seed, "radius");
  const hostW = Number(opts.hostW) || 960;
  const turns = opts.turns ?? 1.6 + r0 * 2.2;
  const outerR = opts.outerR ?? Math.min(hostW * 0.22, 120 + r2 * 160);
  const clockwise = opts.clockwise ?? r1 > 0.5;
  const startAngleDeg = r1 * 360 * (clockwise ? 1 : -1);

  const raw = listSpiralMMOWhirlpoolPathPointsV0(cx, cy, {
    turns,
    outerR,
    innerR: Math.max(10, outerR * 0.12),
    startAngleDeg
  });

  const points = raw.map((p, i) => {
    const radius = Math.hypot(p.x - cx, p.y - cy);
    const radius01 = outerR > 0 ? Math.min(1, radius / outerR) : 0;
    const helixT = i / Math.max(1, raw.length - 1);
    const z =
      Math.sin(helixT * Math.PI * 5 + r0 * 4) * (36 + r2 * 44) +
      (1 - radius01) * 22 -
      radius01 * 10;
    const pitchDeg = -12 - radius01 * 20 + Math.sin(i * 0.28 + r1 * 5) * 10;
    const bank = Math.sin(i * 0.38 + r0 * 6) * (16 + r2 * 18);
    return Object.freeze({ x: p.x, y: p.y, z, pitchDeg, bank, radius01 });
  });

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_bird_flock_route.v0",
    cx,
    cy,
    turns,
    outerR,
    clockwise,
    points: Object.freeze(points),
    loopDurationMs: Math.round(11000 + r0 * 9000)
  });
}

/**
 * Build flock groups — each flock shares a spiral center with unique helical route.
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
    const route = buildSpiralMMOBirdFlockRouteV0(anchor.x, anchor.y, {
      seed: `${cycleSeed}:flock:${flockIdx}`,
      hostW,
      outerR: Math.min(hostW, hostH) * (0.14 + flockIdx * 0.05),
      turns: 1.8 + flockIdx * 0.45,
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
          loopDurationMs: route.loopDurationMs + birdIdx * 520,
          startX: start.x,
          startY: start.y,
          routeMode: "spiral_flock"
        })
      );
    }

    flocks.push(
      Object.freeze({
        flockId: `flock-${flockIdx}`,
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
