/**
 * Deterministic region clustering in 3D embedding space (epsilon-connected components).
 */
export const GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA = "castle.genesis.replay_manifold_segment.v1";

function dist3(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

class UnionFind {
  /** @param {number} n */
  constructor(n) {
    /** @type {number[]} */
    this.p = Array.from({ length: n }, (_, i) => i);
    /** @type {number[]} */
    this.r = Array(n).fill(0);
  }
  /** @param {number} x */
  find(x) {
    if (this.p[x] !== x) this.p[x] = this.find(this.p[x]);
    return this.p[x];
  }
  /** @param {number} a @param {number} b */
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return;
    if (this.r[ra] < this.r[rb]) [ra, rb] = [rb, ra];
    this.p[rb] = ra;
    if (this.r[ra] === this.r[rb]) this.r[ra] += 1;
  }
}

/**
 * @param {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number }[]} points
 * @param {{ epsilonScale?: number } | undefined} opts
 */
export function segmentManifoldFromEmbeddingV1(points, opts) {
  const scale = Math.min(2.5, Math.max(0.35, Number(opts?.epsilonScale) || 1));
  const pts = Array.isArray(points) ? points : [];
  const n = pts.length;
  if (n === 0) {
    return {
      schema: GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA,
      method: "epsilon_components_v1",
      epsilon: 0,
      epsilonScale: scale,
      assignments: [],
      regions: []
    };
  }
  if (n === 1) {
    const p0 = pts[0];
    return {
      schema: GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA,
      method: "epsilon_components_v1",
      epsilon: 0,
      epsilonScale: scale,
      assignments: [
        {
          windowIndex: p0.windowIndex,
          regionId: 0,
          x: p0.x,
          y: p0.y,
          z: p0.z
        }
      ],
      regions: [
        {
          regionId: 0,
          memberWindowIndices: [p0.windowIndex],
          centroid: { x: p0.x, y: p0.y, z: p0.z },
          seqSpan: { from: p0.from, to: p0.to }
        }
      ]
    };
  }

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
  const dx = Math.max(1e-6, maxX - minX);
  const dy = Math.max(1e-6, maxY - minY);
  const dz = Math.max(1e-6, maxZ - minZ);
  const diam = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const epsilonBase = Math.max(0.02, Math.round(0.18 * diam * 10000) / 10000);
  const epsilon = Math.max(0.015, Math.round(epsilonBase * scale * 10000) / 10000);

  const uf = new UnionFind(n);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (dist3(pts[i], pts[j]) <= epsilon + 1e-9) uf.union(i, j);
    }
  }

  /** @type {Map<number, number[]>} */
  const comp = new Map();
  for (let i = 0; i < n; i += 1) {
    const root = uf.find(i);
    const arr = comp.get(root) || [];
    arr.push(i);
    comp.set(root, arr);
  }

  /** @type {{ root: number, members: number[] }[]} */
  const groups = [];
  for (const [, members] of comp) {
    const root = uf.find(members[0]);
    groups.push({ root, members: [...members].sort((a, b) => a - b) });
  }
  groups.sort((a, b) => {
    const wa = pts[a.members[0]].windowIndex;
    const wb = pts[b.members[0]].windowIndex;
    return wa - wb;
  });

  /** @type {{ windowIndex: number, regionId: number, x: number, y: number, z: number }[]} */
  const assignments = [];
  /** @type {{ regionId: number, memberWindowIndices: number[], centroid: { x: number, y: number, z: number }, seqSpan: { from: number, to: number } }[]} */
  const regions = [];
  let rid = 0;
  for (const g of groups) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let sf = Infinity;
    let st = -Infinity;
    const idxs = g.members;
    const winIdxs = [];
    for (const ii of idxs) {
      const p = pts[ii];
      sx += p.x;
      sy += p.y;
      sz += p.z;
      sf = Math.min(sf, p.from);
      st = Math.max(st, p.to);
      winIdxs.push(p.windowIndex);
      assignments.push({
        windowIndex: p.windowIndex,
        regionId: rid,
        x: p.x,
        y: p.y,
        z: p.z
      });
    }
    const k = idxs.length;
    regions.push({
      regionId: rid,
      memberWindowIndices: winIdxs.sort((a, b) => a - b),
      centroid: {
        x: Math.round((sx / k) * 10000) / 10000,
        y: Math.round((sy / k) * 10000) / 10000,
        z: Math.round((sz / k) * 10000) / 10000
      },
      seqSpan: { from: sf, to: st }
    });
    rid += 1;
  }
  assignments.sort((a, b) => a.windowIndex - b.windowIndex);

  return {
    schema: GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA,
    method: "epsilon_components_v1",
    epsilon,
    epsilonScale: scale,
    embeddingDiameter: Math.round(diam * 10000) / 10000,
    assignments,
    regions
  };
}
