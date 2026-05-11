/**
 * RHIZOH constitutional memory replay — θ zaman serisini segmentlere bölüp adaptasyon yasasıyla sayaç oynatma.
 * Tam constitutionalTick yeniden oynatması değil; θ/stress bellek üzerinden hafif simülasyon.
 */

import { stepRhizohConstitutionalAdaptation } from "./constitutionalDynamicsV1.js";

export const RHIZOH_CONSTITUTIONAL_MEMORY_REPLAY_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   startAt: number,
 *   endAt: number,
 *   samples: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[]
 * }} RhizohThetaReplaySegment
 */

/**
 * @param {import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[]} samples
 * @param {number} [segmentDurationMs]
 * @returns {RhizohThetaReplaySegment[]}
 */
export function buildRhizohThetaReplaySegments(samples, segmentDurationMs = 3_600_000) {
  const dur = Math.max(60_000, Number(segmentDurationMs) || 3_600_000);
  const list = [...(samples || [])].sort((a, b) => a.at - b.at);
  if (!list.length) return [];

  /** @type {RhizohThetaReplaySegment[]} */
  const segments = [];
  let cur = /** @type {RhizohThetaReplaySegment} */ ({
    startAt: list[0].at,
    endAt: list[0].at,
    samples: [list[0]]
  });

  for (let i = 1; i < list.length; i++) {
    const s = list[i];
    if (s.at - cur.startAt <= dur) {
      cur.samples.push(s);
      cur.endAt = s.at;
    } else {
      segments.push(cur);
      cur = { startAt: s.at, endAt: s.at, samples: [s] };
    }
  }
  segments.push(cur);
  return segments;
}

/**
 * Segment içi ortalama stressIndex (yoksa yedek).
 * @param {RhizohThetaReplaySegment} seg
 * @param {number} fallbackStress
 */
export function meanStressIndexForRhizohReplaySegment(seg, fallbackStress = 0.4) {
  const stresses = seg.samples
    .map((x) => x.stressIndex)
    .filter((x) => typeof x === "number" && Number.isFinite(x));
  if (!stresses.length) return clamp01(fallbackStress);
  return clamp01(stresses.reduce((a, b) => a + b, 0) / stresses.length);
}

/**
 * @param {{
 *   segments: RhizohThetaReplaySegment[],
 *   thetaStart?: number,
 *   stepsPerSegment?: number,
 *   stressSource?: 'segment_mean' | 'constant',
 *   constantStress?: number,
 *   adaptation?: { disabled?: boolean },
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number
 * }} input
 */
export function simulateRhizohConstitutionalThetaReplay(input) {
  const segments = input.segments || [];
  const stepsPerSegment = Math.max(1, Math.floor(input.stepsPerSegment ?? 1));
  let thetaPrev = clamp01(input.thetaStart ?? 0);
  const stressSource = input.stressSource || "segment_mean";
  const constantStress = clamp01(input.constantStress ?? 0.4);

  /** @type {Array<{ stepIndex: number, segmentIndex: number, theta: number, stressIndex: number, at: number }>} */
  const path = [
    {
      stepIndex: 0,
      segmentIndex: -1,
      theta: thetaPrev,
      stressIndex: constantStress,
      at: segments[0]?.startAt ?? Date.now()
    }
  ];

  let stepIndex = 1;
  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    let stress =
      stressSource === "constant"
        ? constantStress
        : meanStressIndexForRhizohReplaySegment(seg, constantStress);

    const span = Math.max(0, seg.endAt - seg.startAt);
    for (let k = 0; k < stepsPerSegment; k++) {
      const step = stepRhizohConstitutionalAdaptation({
        thetaPrev,
        stressIndex: stress,
        targetStress: input.targetStress,
        alpha: input.alpha,
        thetaMin: input.thetaMin,
        thetaMax: input.thetaMax,
        adaptation: input.adaptation
      });
      thetaPrev = step.thetaNext;
      const t =
        span > 0 ? seg.startAt + ((k + 1) / stepsPerSegment) * span : seg.startAt + k;
      path.push({
        stepIndex: stepIndex++,
        segmentIndex: si,
        theta: thetaPrev,
        stressIndex: stress,
        at: t
      });
    }
  }

  return {
    path,
    finalTheta: thetaPrev,
    segmentCount: segments.length,
    totalSteps: path.length - 1
  };
}

/**
 * Bellek örneklerinden segment kurup adaptasyon yolu oynatır.
 * @param {{
 *   memoryState: { samples: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[] },
 *   segmentDurationMs?: number,
 *   thetaStart?: number,
 *   stepsPerSegment?: number,
 *   stressSource?: 'segment_mean' | 'constant',
 *   constantStress?: number,
 *   adaptation?: { disabled?: boolean },
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number
 * }} input
 */
export function replayRhizohThetaMemorySimulation(input) {
  const segments = buildRhizohThetaReplaySegments(
    input.memoryState?.samples || [],
    input.segmentDurationMs
  );
  return simulateRhizohConstitutionalThetaReplay({
    segments,
    thetaStart: input.thetaStart,
    stepsPerSegment: input.stepsPerSegment,
    stressSource: input.stressSource,
    constantStress: input.constantStress,
    adaptation: input.adaptation,
    targetStress: input.targetStress,
    alpha: input.alpha,
    thetaMin: input.thetaMin,
    thetaMax: input.thetaMax
  });
}
