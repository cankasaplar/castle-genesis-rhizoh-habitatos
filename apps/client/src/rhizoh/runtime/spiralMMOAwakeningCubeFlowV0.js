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

import { spiralMMOMapGeoToPercentV0 } from "./spiralMMOMapGeoProjectV0.js";
import { takeSpiralMMOSessionAccumIndexV0 } from "./spiralMMOSessionAccumulationV0.js";

export const SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0 = Object.freeze([0, 1, 2]);
export const SPIRAL_MMO_CUBE_STAGGER_MS_V0 = 280;
export const SPIRAL_MMO_CUBE_WAVE_COLORS_V0 = Object.freeze([
  ...SPIRAL_MMO_ORDER_COLORS_V0,
  ...SPIRAL_MMO_CHAOS_COLORS_V0,
  ...SPIRAL_MMO_SPECIAL_COLORS_V0
]);

const GOLDEN_ANGLE_RAD_V0 = Math.PI * (3 - Math.sqrt(5));

/**
 * @param {number} accumulationIndex
 * @param {number} [scale]
 * @param {number} [depthLayer]
 */
export function resolveSpiralMMOAccumulationOffsetV0(accumulationIndex, scale = 1, depthLayer = 0) {
  const idx = Math.max(0, Number(accumulationIndex) || 0);
  const layer = Math.max(0, Math.min(2, Number(depthLayer) || 0));
  const ring = Math.floor(idx / 6);
  const tier = idx % 6;
  const radius = (10 + ring * 7) * scale;
  const angle = idx * GOLDEN_ANGLE_RAD_V0;
  const z = layer * 16 + tier * 4;
  const stackScale = 1 + ring * 0.1 + layer * 0.08;
  const rotateY = (idx * 51 + layer * 73) % 360;
  const rotateX = -14 - layer * 9;
  return Object.freeze({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z,
    stackScale,
    rotateY,
    rotateX
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
 * All undirected edges in walk order from trigger; each edge yields dual pass per behavior.
 * @param {number} triggerPinIndex
 * @param {ReadonlyArray<{ continent: string }>} pins
 * @param {{ routeRotate?: number, dualLead?: 'forward'|'reverse' }} [behavior]
 */
export function buildSpiralMMOOrderedRouteWalkV0(triggerPinIndex, pins, behavior = {}) {
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

  const rotate = Math.max(0, Number(behavior.routeRotate) || 0) % Math.max(1, edges.length);
  const rotated = [...edges.slice(rotate), ...edges.slice(0, rotate)];
  const dualLead = behavior.dualLead === "reverse" ? "reverse" : "forward";

  /** @type {ReadonlyArray<{ pair: [number, number], direction: 'forward' | 'reverse', edgeKey: string }>} */
  const walk = [];
  for (const edge of rotated) {
    const edgeKey = `${edge.low}|${edge.high}`;
    const steps =
      dualLead === "reverse"
        ? [
            edge.reverse ? { pair: edge.reverse, direction: "reverse" } : null,
            edge.forward ? { pair: edge.forward, direction: "forward" } : null
          ]
        : [
            edge.forward ? { pair: edge.forward, direction: "forward" } : null,
            edge.reverse ? { pair: edge.reverse, direction: "reverse" } : null
          ];
    for (const step of steps) {
      if (step) walk.push({ pair: step.pair, direction: step.direction, edgeKey });
    }
  }
  return Object.freeze(walk);
}

/**
 * @param {{
 *   triggerPinIndex: number,
 *   pins?: ReadonlyArray<{ id?: string, continent: string, lat: number, lon: number }>,
 *   cycleSeed: number,
 *   behavior?: ReturnType<typeof import('./spiralMMOSpiralBehaviorV0.js').resolveSpiralMMOBehaviorProfileV0>,
 *   handoffFromContinent?: string | null,
 *   addLaunch: (launch: Record<string, unknown>) => void
 * }} input
 */
export function buildSpiralMMOSequencedCubeLaunchesV0(input) {
  const pins = input.pins || listSpiralMMOContinentMapPinsV0();
  const safeIndex = Math.max(0, Math.min(pins.length - 1, Number(input.triggerPinIndex) || 0));
  const cycleSeed = Number(input.cycleSeed) || 0;
  const behavior = input.behavior || {};
  const depthLayers = behavior.depthLayerOrder?.length
    ? behavior.depthLayerOrder
    : SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0;
  const staggerMs = SPIRAL_MMO_CUBE_STAGGER_MS_V0 * (behavior.staggerScale ?? 1);
  const colorWaveOffset = behavior.colorWaveOffset ?? 0;
  const gapPolarity = behavior.gapPolarity ?? 1;
  const waveAmplitude = behavior.waveAmplitude ?? 4;
  const transitionEase = behavior.transitionEase || "cubic-bezier(0.42, 0, 0.22, 1)";
  const routeWalk = buildSpiralMMOOrderedRouteWalkV0(safeIndex, pins, behavior);
  let sequenceIndex = 0;

  for (const route of routeWalk) {
    const [srcIdx, destIdx] = route.pair;
    const src = pins[srcIdx];
    const dest = pins[destIdx];
    if (!src || !dest) continue;

    const srcPct = spiralMMOMapGeoToPercentV0(src.lat, src.lon);
    const destPct = spiralMMOMapGeoToPercentV0(dest.lat, dest.lon);
    const routeLengthPct = routeLengthPctV0(srcPct, destPct);

    for (const depthLayer of depthLayers) {
      const layerSpec = resolveSpiralMMOCubeDepthLayerSpecV0(depthLayer);
      const colorClass =
        SPIRAL_MMO_CUBE_WAVE_COLORS_V0[(sequenceIndex + colorWaveOffset) % SPIRAL_MMO_CUBE_WAVE_COLORS_V0.length];
      const isOrder = SPIRAL_MMO_ORDER_COLORS_V0.includes(colorClass);
      const accKey = dest.continent;
      const accumulationIndex = takeSpiralMMOSessionAccumIndexV0(accKey);

      const gapBase = 72 + routeLengthPct * 0.35;
      const gap =
        gapBase *
        layerSpec.gapScale *
        gapPolarity *
        (route.direction === "forward" ? 1 : -1);
      const delayMs = sequenceIndex * staggerMs;
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
          accumulationOffset: resolveSpiralMMOAccumulationOffsetV0(
            accumulationIndex,
            0.9 + layerSpec.depth * 0.4,
            depthLayer
          ),
          depthZIndex: layerSpec.zIndex,
          renderScale: cubeSpec.renderScaleFactor,
          holdAtDest: true,
          waveAmplitude,
          transitionEase,
          handoffFromContinent: sequenceIndex === 0 ? input.handoffFromContinent || null : null,
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
    depthLayerCount: depthLayers.length,
    behaviorContinent: behavior.continent || pins[safeIndex]?.continent || ""
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
