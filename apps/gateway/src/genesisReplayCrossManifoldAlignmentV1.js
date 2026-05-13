/**
 * Alignment between manifold segmentations under different ε regimes (same embedding, scaled linkage).
 */
import { segmentManifoldFromEmbeddingV1 } from "./genesisReplayManifoldSegmentV1.js";

export const GENESIS_REPLAY_CROSS_MANIFOLD_ALIGNMENT_SCHEMA = "castle.genesis.replay_cross_manifold_alignment.v1";

/** Deterministic multi-scale ε factors (applied inside segmentManifoldFromEmbeddingV1). */
export const GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES = Object.freeze([0.7, 1, 1.35]);

function dist3(ax, ay, az, bx, by, bz) {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * @param {number[]} a
 * @param {number[]} b
 */
function jaccardIndices(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) {
    if (sb.has(x)) inter += 1;
  }
  const u = sa.size + sb.size - inter;
  return u <= 0 ? 0 : inter / u;
}

/**
 * @param {{ regions: { regionId: number, centroid: { x: number, y: number, z: number }, memberWindowIndices: number[] }[] }} segA
 * @param {{ regions: { regionId: number, centroid: { x: number, y: number, z: number }, memberWindowIndices: number[] }[] }} segB
 * @param {number} scaleA
 * @param {number} scaleB
 */
function alignRegionsGreedyCentroid(segA, segB, scaleA, scaleB) {
  const regionsA = Array.isArray(segA.regions) ? segA.regions : [];
  const regionsB = Array.isArray(segB.regions) ? segB.regions : [];
  /** @type {{ fromRegionId: number, toRegionId: number, centroidSeparation: number, windowJaccard: number }[]} */
  const pairs = [];
  for (const ra of regionsA) {
    const cax = Number(ra.centroid?.x) || 0;
    const cay = Number(ra.centroid?.y) || 0;
    const caz = Number(ra.centroid?.z) || 0;
    let bestD = Infinity;
    /** @type {null | (typeof regionsB)[number]} */
    let bestRb = null;
    let bestRid = Infinity;
    for (const rb of regionsB) {
      const cbx = Number(rb.centroid?.x) || 0;
      const cby = Number(rb.centroid?.y) || 0;
      const cbz = Number(rb.centroid?.z) || 0;
      const d = dist3(cax, cay, caz, cbx, cby, cbz);
      const ridB = Math.floor(Number(rb.regionId) || 0);
      if (d < bestD - 1e-12 || (Math.abs(d - bestD) <= 1e-12 && ridB < bestRid)) {
        bestD = d;
        bestRb = rb;
        bestRid = ridB;
      }
    }
    if (!bestRb) continue;
    const memA = Array.isArray(ra.memberWindowIndices) ? ra.memberWindowIndices : [];
    const memB = Array.isArray(bestRb.memberWindowIndices) ? bestRb.memberWindowIndices : [];
    pairs.push({
      fromRegionId: Math.floor(Number(ra.regionId) || 0),
      toRegionId: Math.floor(Number(bestRb.regionId) || 0),
      centroidSeparation: Math.round(bestD * 10000) / 10000,
      windowJaccard: Math.round(jaccardIndices(memA, memB) * 10000) / 10000
    });
  }
  pairs.sort((u, v) => u.fromRegionId - v.fromRegionId || u.toRegionId - v.toRegionId);
  return {
    fromEpsilonScale: scaleA,
    toEpsilonScale: scaleB,
    pairs
  };
}

/**
 * @param {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number }[]} points
 */
export function computeCrossManifoldAlignmentV1(points) {
  const pts = Array.isArray(points) ? points : [];
  if (pts.length === 0) {
    return {
      schema: GENESIS_REPLAY_CROSS_MANIFOLD_ALIGNMENT_SCHEMA,
      epsilonScales: [...GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES],
      segmentations: [],
      pairwiseAlignments: []
    };
  }

  /** @type {ReturnType<typeof segmentManifoldFromEmbeddingV1>[]} */
  const fullSegs = GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES.map((epsilonScale) =>
    segmentManifoldFromEmbeddingV1(pts, { epsilonScale })
  );

  const segmentations = fullSegs.map((s) => ({
    epsilonScale: s.epsilonScale,
    epsilon: s.epsilon,
    regionCount: s.regions.length,
    embeddingDiameter: s.embeddingDiameter ?? null
  }));

  /** @type {{ fromEpsilonScale: number, toEpsilonScale: number, pairs: { fromRegionId: number, toRegionId: number, centroidSeparation: number, windowJaccard: number }[] }[]} */
  const pairwiseAlignments = [];
  const scales = [...GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES];
  for (let i = 0; i < scales.length; i += 1) {
    for (let j = i + 1; j < scales.length; j += 1) {
      pairwiseAlignments.push(alignRegionsGreedyCentroid(fullSegs[i], fullSegs[j], scales[i], scales[j]));
    }
  }

  return {
    schema: GENESIS_REPLAY_CROSS_MANIFOLD_ALIGNMENT_SCHEMA,
    epsilonScales: scales,
    segmentations,
    pairwiseAlignments
  };
}
