/**
 * Affine reparameterization of the embedding measure (unit cube) vs raw: co-clustering invariance probe.
 */
import { segmentManifoldFromEmbeddingV1 } from "./genesisReplayManifoldSegmentV1.js";

export const GENESIS_REPLAY_TEMPORAL_RENORMALIZE_SCHEMA = "castle.genesis.replay_temporal_renormalize.v1";

/**
 * @param {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number }[]} points
 */
export function embedPointsToUnitCubeV1(points) {
  const pts = Array.isArray(points) ? points : [];
  if (pts.length === 0) return [];

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  const spanZ = Math.max(1e-9, maxZ - minZ);

  return pts.map((p) => ({
    windowIndex: p.windowIndex,
    from: p.from,
    to: p.to,
    x: Math.round(((p.x - minX) / spanX) * 10000) / 10000,
    y: Math.round(((p.y - minY) / spanY) * 10000) / 10000,
    z: Math.round(((p.z - minZ) / spanZ) * 10000) / 10000
  }));
}

/**
 * @param {{ windowIndex: number, regionId: number }[]} assignments
 */
function assignmentMap(assignments) {
  /** @type {Map<number, number>} */
  const m = new Map();
  for (const a of assignments || []) {
    m.set(Math.floor(Number(a.windowIndex) || 0), Math.floor(Number(a.regionId) || 0));
  }
  return m;
}

/**
 * @param {Map<number, number>} ma
 * @param {Map<number, number>} mb
 */
function coClusteringAgreement(ma, mb) {
  const keys = [...new Set([...ma.keys(), ...mb.keys()])].sort((a, b) => a - b);
  if (keys.length < 2) return 1;
  let total = 0;
  let agree = 0;
  for (let ii = 0; ii < keys.length; ii += 1) {
    for (let jj = ii + 1; jj < keys.length; jj += 1) {
      const i = keys[ii];
      const j = keys[jj];
      if (!ma.has(i) || !ma.has(j) || !mb.has(i) || !mb.has(j)) continue;
      const sb = ma.get(i) === ma.get(j);
      const su = mb.get(i) === mb.get(j);
      total += 1;
      if (sb === su) agree += 1;
    }
  }
  return total > 0 ? agree / total : 1;
}

/**
 * @param {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number }[]} points
 * @param {unknown} baselineManifold
 */
export function computeTemporalRenormalizationAxisV1(points, baselineManifold) {
  const pts = Array.isArray(points) ? points : [];
  const baseAssign = assignmentMap(
    /** @type {{ assignments?: { windowIndex: number, regionId: number }[] }} */ (baselineManifold)?.assignments
  );

  if (pts.length < 2) {
    return {
      schema: GENESIS_REPLAY_TEMPORAL_RENORMALIZE_SCHEMA,
      normalization: "per_axis_minmax_v1",
      coClusteringAgreement: 1,
      manifoldInvarianceScore: 1,
      segmentEpsilonRaw: Math.round((Number(/** @type {{ epsilon?: unknown }} */ (baselineManifold)?.epsilon) || 0) * 10000) / 10000,
      segmentEpsilonUnit: 0,
      embeddingDiameterUnit: null
    };
  }

  const unitPts = embedPointsToUnitCubeV1(pts);
  const segU = segmentManifoldFromEmbeddingV1(unitPts, { epsilonScale: 1 });
  const unitAssign = assignmentMap(segU.assignments);
  const agreement = coClusteringAgreement(baseAssign, unitAssign);

  return {
    schema: GENESIS_REPLAY_TEMPORAL_RENORMALIZE_SCHEMA,
    normalization: "per_axis_minmax_v1",
    coClusteringAgreement: Math.round(agreement * 10000) / 10000,
    manifoldInvarianceScore: Math.round(agreement * 10000) / 10000,
    segmentEpsilonRaw: Math.round((Number(/** @type {{ epsilon?: unknown }} */ (baselineManifold)?.epsilon) || 0) * 10000) / 10000,
    segmentEpsilonUnit: Math.round(Number(segU.epsilon) * 10000) / 10000,
    embeddingDiameterUnit:
      segU.embeddingDiameter !== undefined ? Math.round(Number(segU.embeddingDiameter) * 10000) / 10000 : null
  };
}
