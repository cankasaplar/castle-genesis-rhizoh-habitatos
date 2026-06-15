/**
 * SpiralMMO awakening cube flow — sequenced dual-direction launches across all routes + depth layers.
 */

import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";
import { resolveSpiralMMOAwakeningRoutePairsV0 } from "./spiralMMOContinentRouteGraphV0.js";
import {
  deriveSpiralMMOAwakeningCubeSpecV0
} from "./spiralMMOAwakeningCubeCalcV0.js";
import {
  SPIRAL_MMO_CHAOS_COLORS_V0,
  SPIRAL_MMO_ORDER_COLORS_V0,
  SPIRAL_MMO_SPECIAL_COLORS_V0
} from "./spiralMMOAwakeningPaletteV0.js";

function spiralMMOGeoToPercentLocalV0(lat, lon) {
  const x = ((Number(lon) + 180) / 360) * 100;
  const clampedLat = Math.max(-70, Math.min(70, Number(lat)));
  const y = ((70 - clampedLat) / 140) * 100;
  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(8, Math.min(88, y))
  };
}

export const SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0 = Object.freeze([0, 1, 2]);
export const SPIRAL_MMO_CUBE_STAGGER_MS_V0 = 140;
export const SPIRAL_MMO_CUBE_WAVE_COLORS_V0 = Object.freeze([
  ...SPIRAL_MMO_ORDER_COLORS_V0,
  ...SPIRAL_MMO_CHAOS_COLORS_V0,
  ...SPIRAL_MMO_SPECIAL_COLORS_V0
]);

const GOLDEN_ANGLE_RAD_V0 = Math.PI * (3 - Math.sqrt(5));

/**
 * @param {number} accumulationIndex
 * @param {number} [scale]
 */
export function resolveSpiralMMOAccumulationOffsetV0(accumulationIndex, scale = 1) {
  const idx = Math.max(0, Number(accumulationIndex) || 0);
  const ring = Math.floor(idx / 8);
  const radius = (5 + ring * 4.5) * scale;
  const angle = idx * GOLDEN_ANGLE_RAD_V0;
  return Object.freeze({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  });
}

/**
 * @param {number} depthLayer
 */
export function resolveSpiralMMOCubeDepthLayerSpecV0(depthLayer) {
  const layer = Math.max(0, Math.min(2, Number(depthLayer) || 0));
  return Object.freeze({
    depth: 0.2 + layer * 0.32,
    zIndex: 8 + layer * 7,
    scaleBias: 0.78 + layer * 0.14,
    gapScale: 0.85 + layer * 0.22,
    speedBias: 1.08 - layer * 0.12
  });
}

function routeLengthPctV0(aPct, bPct) {
  return Math.hypot(bPct.x - aPct.x, bPct.y - aPct.y);
}

/**
 * All undirected edges in walk order from trigger; each edge yields forward then reverse.
 * @param {number} triggerPinIndex
 * @param {ReadonlyArray<{ continent: string }>} pins
 */
export function buildSpiralMMOOrderedRouteWalkV0(triggerPinIndex, pins) {
  const safe = Math.max(0, Math.min(pins.length - 1, Number(triggerPinIndex) || 0));
  const pairs = resolveSpiralMMOAwakeningRoutePairsV0(safe, pins);
  /** @type {Map<string, { low: number, high: number, forward: [number, number] | null, reverse: [number, number] | null }>} */
  const edgeMap = new Map();

  for (const [src, dest] of pairs) {
    const low = Math.min(src, dest);
    const high = Math.max(src, dest);
    const key = `${low}|${high}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { low, high, forward: null, reverse: null });
    }
    const edge = edgeMap.get(key);
    if (src === low) edge.forward = [src, dest];
    else edge.reverse = [src, dest];
  }

  const edges = [...edgeMap.values()].sort((a, b) => {
    const distA = Math.min(Math.abs(a.low - safe), Math.abs(a.high - safe));
    const distB = Math.min(Math.abs(b.low - safe), Math.abs(b.high - safe));
    if (distA !== distB) return distA - distB;
    if (a.low !== b.low) return a.low - b.low;
    return a.high - b.high;
  });

  /** @type {ReadonlyArray<{ pair: [number, number], direction: 'forward' | 'reverse', edgeKey: string }>} */
  const walk = [];
  for (const edge of edges) {
    const edgeKey = `${edge.low}|${edge.high}`;
    if (edge.forward) walk.push({ pair: edge.forward, direction: "forward", edgeKey });
    if (edge.reverse) walk.push({ pair: edge.reverse, direction: "reverse", edgeKey });
  }
  return Object.freeze(walk);
}

/**
 * @param {{
 *   triggerPinIndex: number,
 *   pins?: ReadonlyArray<{ id?: string, continent: string, lat: number, lon: number }>,
 *   cycleSeed: number,
 *   addLaunch: (launch: Record<string, unknown>) => void
 * }} input
 */
export function buildSpiralMMOSequencedCubeLaunchesV0(input) {
  const pins = input.pins || listSpiralMMOContinentMapPinsV0();
  const safeIndex = Math.max(0, Math.min(pins.length - 1, Number(input.triggerPinIndex) || 0));
  const cycleSeed = Number(input.cycleSeed) || 0;
  const routeWalk = buildSpiralMMOOrderedRouteWalkV0(safeIndex, pins);
  /** @type {Map<string, number>} */
  const destAccum = new Map();
  let sequenceIndex = 0;

  for (const route of routeWalk) {
    const [srcIdx, destIdx] = route.pair;
    const src = pins[srcIdx];
    const dest = pins[destIdx];
    if (!src || !dest) continue;

    const srcPct = spiralMMOGeoToPercentLocalV0(src.lat, src.lon);
    const destPct = spiralMMOGeoToPercentLocalV0(dest.lat, dest.lon);
    const routeLengthPct = routeLengthPctV0(srcPct, destPct);

    for (const depthLayer of SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0) {
      const layerSpec = resolveSpiralMMOCubeDepthLayerSpecV0(depthLayer);
      const colorClass = SPIRAL_MMO_CUBE_WAVE_COLORS_V0[sequenceIndex % SPIRAL_MMO_CUBE_WAVE_COLORS_V0.length];
      const isOrder = SPIRAL_MMO_ORDER_COLORS_V0.includes(colorClass);
      const accKey = dest.continent;
      const accumulationIndex = destAccum.get(accKey) || 0;
      destAccum.set(accKey, accumulationIndex + 1);

      const gapBase = 72 + routeLengthPct * 0.35;
      const gap = gapBase * layerSpec.gapScale * (route.direction === "forward" ? 1 : -1);
      const delayMs = sequenceIndex * SPIRAL_MMO_CUBE_STAGGER_MS_V0;
      const cubeSpec = deriveSpiralMMOAwakeningCubeSpecV0({
        colorClass,
        srcContinent: src.continent,
        destContinent: dest.continent,
        routeLengthPct,
        batchIndex: sequenceIndex,
        depthLayer,
        isOrder,
        cycleSeed
      });
      const durationMs = Math.round(cubeSpec.durationMs * layerSpec.speedBias);

      input.addLaunch(
        Object.freeze({
          id: `seq-${sequenceIndex}-${colorClass}-${src.continent}-${dest.continent}-L${depthLayer}`,
          colorClass,
          srcIdx,
          destIdx,
          srcContinent: src.continent,
          destContinent: dest.continent,
          srcPct,
          destPct,
          gap,
          isOrder,
          delayMs,
          durationMs,
          batchIndex: sequenceIndex,
          sequenceIndex,
          depthLayer,
          direction: route.direction,
          edgeKey: route.edgeKey,
          routeLengthPct,
          accumulationIndex,
          accumulationOffset: resolveSpiralMMOAccumulationOffsetV0(accumulationIndex, 0.85 + layerSpec.depth * 0.35),
          depthZIndex: layerSpec.zIndex,
          depthScale: layerSpec.scaleBias,
          holdAtDest: true,
          transitionEase: "cubic-bezier(0.42, 0, 0.22, 1)",
          cubeSpec: Object.freeze({
            ...cubeSpec,
            durationMs,
            depth: layerSpec.depth
          }),
          routeId: `${src.continent}|${dest.continent}`
        })
      );

      sequenceIndex += 1;
    }
  }

  return Object.freeze({
    sequenceCount: sequenceIndex,
    routeStepCount: routeWalk.length,
    depthLayerCount: SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0.length
  });
}

/**
 * @param {ReadonlyArray<{ sequenceIndex?: number, direction?: string, depthLayer?: number, edgeKey?: string }>} launches
 */
export function verifySpiralMMOCubeFlowContinuityV0(launches) {
  if (!launches.length) return { ok: false, reason: "empty" };
  for (let i = 1; i < launches.length; i += 1) {
    const prev = launches[i - 1];
    const cur = launches[i];
    if ((cur.sequenceIndex ?? i) <= (prev.sequenceIndex ?? i - 1)) {
      return { ok: false, reason: "sequence_not_monotonic", index: i };
    }
  }
  const edges = new Set(launches.map((l) => l.edgeKey).filter(Boolean));
  const hasDual = [...edges].every((key) => {
    const fwd = launches.some((l) => l.edgeKey === key && l.direction === "forward");
    const rev = launches.some((l) => l.edgeKey === key && l.direction === "reverse");
    return fwd && rev;
  });
  const layers = new Set(launches.map((l) => l.depthLayer));
  return Object.freeze({
    ok: true,
    launchCount: launches.length,
    edgeCount: edges.size,
    dualDirectionCoverage: hasDual,
    depthLayers: [...layers].sort()
  });
}
