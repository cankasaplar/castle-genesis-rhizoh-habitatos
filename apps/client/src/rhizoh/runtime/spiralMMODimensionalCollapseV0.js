/**
 * Dimensional Collapse — ghost-cube spawn wave between spiral gates (v0 visual).
 * Pin click → order sine-wave arcs + chaos scatter + mirror specials.
 * @see SpiralCodex reference sketch (RESEARCH-ONLY)
 */

import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";
import { resolveSpiralMMOOrderPartnerIndexV0 } from "./spiralMMOContinentRouteGraphV0.js";
import {
  deriveSpiralMMOAwakeningCubeSpecV0,
  spiralMMOAwakeningSeedV0
} from "./spiralMMOAwakeningCubeCalcV0.js";
import {
  SPIRAL_MMO_CHAOS_COLORS_V0,
  SPIRAL_MMO_ORDER_COLORS_V0,
  SPIRAL_MMO_SPECIAL_COLORS_V0
} from "./spiralMMOAwakeningPaletteV0.js";
import { spiralMMOMapGeoToPercentV0 } from "./spiralMMOMapGeoProjectV0.js";
import { takeSpiralMMOSessionAccumIndexV0 } from "./spiralMMOSessionAccumulationV0.js";
import {
  resolveSpiralMMOAccumulationOffsetV0,
  resolveSpiralMMOCubeDepthLayerSpecV0,
  SPIRAL_MMO_CUBE_STAGGER_MS_V0
} from "./spiralMMOAwakeningCubeFlowV0.js";

export const SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0 = Object.freeze({
  ghostDensity: 28,
  arcCurve: 0.9,
  waveAmp: 14,
  chaosScatter: 28
});

/**
 * @param {ReturnType<typeof import('./spiralMMOSpiralBehaviorV0.js').resolveSpiralMMOBehaviorProfileV0>} [behavior]
 */
export function resolveSpiralMMODimCollapseParamsV0(behavior = {}) {
  const scale = behavior.staggerScale ?? 1;
  const waveAmp = behavior.waveAmplitude ?? SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.waveAmp;
  return Object.freeze({
    ghostDensity: Math.round(SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.ghostDensity * scale),
    arcCurve: SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.arcCurve,
    waveAmp,
    chaosScatter: waveAmp * 2
  });
}

function routeLengthPctV0(aPct, bPct) {
  return Math.hypot(bPct.x - aPct.x, bPct.y - aPct.y);
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
export function buildSpiralMMODimensionalCollapseLaunchesV0(input) {
  const pins = input.pins || listSpiralMMOContinentMapPinsV0();
  const safeIndex = Math.max(0, Math.min(pins.length - 1, Number(input.triggerPinIndex) || 0));
  const cycleSeed = Number(input.cycleSeed) || 0;
  const behavior = input.behavior || {};
  const params = resolveSpiralMMODimCollapseParamsV0(behavior);
  const staggerMs = SPIRAL_MMO_CUBE_STAGGER_MS_V0 * (behavior.staggerScale ?? 1);
  const colorWaveOffset = behavior.colorWaveOffset ?? 0;
  const transitionEase = behavior.transitionEase || "cubic-bezier(0.42, 0, 0.22, 1)";
  const trigIdx = safeIndex;
  const oppIdx = resolveSpiralMMOOrderPartnerIndexV0(trigIdx, pins.length);
  let sequenceIndex = 0;

  const pushLaunch = ({
    srcIdx,
    destIdx,
    kind,
    gap,
    indexInGroup,
    scatterX = 0,
    scatterY = 0
  }) => {
    const src = pins[srcIdx];
    const dest = pins[destIdx];
    if (!src || !dest) return;

    const srcPct = spiralMMOMapGeoToPercentV0(src.lat, src.lon);
    const destPct = spiralMMOMapGeoToPercentV0(dest.lat, dest.lon);
    const routeLengthPct = routeLengthPctV0(srcPct, destPct);
    const depthLayer = 0;
    const layerSpec = resolveSpiralMMOCubeDepthLayerSpecV0(depthLayer);

    let colorClass;
    let isOrder = false;
    if (kind === "order") {
      colorClass =
        SPIRAL_MMO_ORDER_COLORS_V0[
          (indexInGroup + colorWaveOffset) % SPIRAL_MMO_ORDER_COLORS_V0.length
        ];
      isOrder = true;
    } else if (kind === "chaos") {
      colorClass =
        SPIRAL_MMO_CHAOS_COLORS_V0[
          (indexInGroup + colorWaveOffset + 2) % SPIRAL_MMO_CHAOS_COLORS_V0.length
        ];
    } else {
      colorClass = kind;
      if (!SPIRAL_MMO_SPECIAL_COLORS_V0.includes(kind)) colorClass = "mirror";
    }

    const accumulationIndex = takeSpiralMMOSessionAccumIndexV0(dest.continent);
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
    const delayMs = sequenceIndex * staggerMs;

    input.addLaunch(
      Object.freeze({
        id: `dim-${sequenceIndex}-${kind}-${src.continent}-${dest.continent}`,
        kind,
        colorClass,
        srcIdx,
        destIdx,
        srcContinent: src.continent,
        destContinent: dest.continent,
        srcPct,
        destPct,
        gap,
        scatterX,
        scatterY,
        isOrder,
        delayMs,
        durationMs,
        batchIndex: sequenceIndex,
        sequenceIndex,
        groupIndex: indexInGroup,
        depthLayer,
        direction: srcIdx === trigIdx ? "forward" : "reverse",
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
        waveAmplitude: params.waveAmp,
        chaosScatter: params.chaosScatter,
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
  };

  for (let i = 0; i < params.ghostDensity; i += 1) {
    const isReturn = i % 2 === 0;
    const srcIdx = isReturn ? oppIdx : trigIdx;
    const destIdx = isReturn ? trigIdx : oppIdx;
    const gap = (80 + i * 3.5) * params.arcCurve * (isReturn ? -1 : 1);
    pushLaunch({ srcIdx, destIdx, kind: "order", gap, indexInGroup: i });
  }

  const chaosCount = Math.floor(params.ghostDensity * 0.8);
  for (let i = 0; i < chaosCount; i += 1) {
    const rSrc = spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "src");
    const rDst = spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "dst");
    let srcIdx = Math.floor(rSrc * pins.length);
    let destIdx = Math.floor(rDst * pins.length) % pins.length;
    if (destIdx === srcIdx) destIdx = (destIdx + 1) % pins.length;
    const gapSign = spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "sign") < 0.5 ? 1 : -1;
    const gapBase = 80 + spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "gap") * 100;
    const gap = gapBase * gapSign * params.arcCurve;
    const scatterX =
      (spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "sx") - 0.5) * params.chaosScatter;
    const scatterY =
      (spiralMMOAwakeningSeedV0(cycleSeed, "chaos", i, "sy") - 0.5) * params.chaosScatter;
    pushLaunch({ srcIdx, destIdx, kind: "chaos", gap, indexInGroup: i, scatterX, scatterY });
  }

  const specialKinds = ["mirror", "black", "white"];
  const specialCount = Math.floor(params.ghostDensity * 0.45);
  for (let i = 0; i < specialCount; i += 1) {
    const kind =
      specialKinds[
        Math.floor(spiralMMOAwakeningSeedV0(cycleSeed, "special", i, "kind") * specialKinds.length)
      ];
    const srcIdx = trigIdx;
    let destIdx = Math.floor(
      spiralMMOAwakeningSeedV0(cycleSeed, "special", i, "dst") * pins.length
    );
    if (destIdx === srcIdx) destIdx = (destIdx + 1) % pins.length;
    const gapSign = spiralMMOAwakeningSeedV0(cycleSeed, "special", i, "sign") < 0.5 ? 1 : -1;
    const gapBase = 40 + spiralMMOAwakeningSeedV0(cycleSeed, "special", i, "gap") * 70;
    const gap = gapBase * gapSign * params.arcCurve;
    pushLaunch({ srcIdx, destIdx, kind, gap, indexInGroup: i });
  }

  return Object.freeze({
    sequenceCount: sequenceIndex,
    triggerIndex: trigIdx,
    partnerIndex: oppIdx,
    behaviorContinent: behavior.continent || pins[safeIndex]?.continent || ""
  });
}

/**
 * @param {ReadonlyArray<{ sequenceIndex?: number, kind?: string, isOrder?: boolean }>} launches
 */
export function verifySpiralMMODimCollapseFlowV0(launches) {
  if (!launches.length) return { ok: false, reason: "empty" };
  for (let i = 1; i < launches.length; i += 1) {
    const prev = launches[i - 1];
    const cur = launches[i];
    if ((cur.sequenceIndex ?? i) <= (prev.sequenceIndex ?? i - 1)) {
      return { ok: false, reason: "sequence_not_monotonic", index: i };
    }
  }
  const orderCount = launches.filter((l) => l.kind === "order" || l.isOrder).length;
  const chaosCount = launches.filter((l) => l.kind === "chaos").length;
  const specialCount = launches.filter((l) =>
    ["mirror", "black", "white"].includes(l.kind || "")
  ).length;
  return Object.freeze({
    ok: true,
    launchCount: launches.length,
    orderCount,
    chaosCount,
    specialCount
  });
}
