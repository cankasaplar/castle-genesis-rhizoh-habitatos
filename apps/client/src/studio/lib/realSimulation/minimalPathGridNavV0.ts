/**
 * Coarse grid BFS pathing around disc obstacles (hall xz plane).
 * Pure math — no RSK imports.
 */

export type DiscObstacleV0 = { x: number; z: number; r: number };

export type NavGridSpecV0 = {
  halfExtent: number;
  resolution: number;
};

export function worldToCellV0(
  x: number,
  z: number,
  spec: NavGridSpecV0
): { ix: number; iz: number } {
  const { halfExtent, resolution } = spec;
  const cell = (2 * halfExtent) / resolution;
  const ix = Math.floor(((x + halfExtent) / (2 * halfExtent)) * resolution);
  const iz = Math.floor(((z + halfExtent) / (2 * halfExtent)) * resolution);
  return {
    ix: Math.max(0, Math.min(resolution - 1, ix)),
    iz: Math.max(0, Math.min(resolution - 1, iz))
  };
}

export function cellCenterV0(
  ix: number,
  iz: number,
  spec: NavGridSpecV0
): { x: number; z: number } {
  const { halfExtent, resolution } = spec;
  const cell = (2 * halfExtent) / resolution;
  const x = -halfExtent + (ix + 0.5) * cell;
  const z = -halfExtent + (iz + 0.5) * cell;
  return { x, z };
}

export function buildBlockedGridV0(spec: NavGridSpecV0, obstacles: DiscObstacleV0[]): Uint8Array {
  const n = spec.resolution * spec.resolution;
  const blocked = new Uint8Array(n);
  const cell = (2 * spec.halfExtent) / spec.resolution;
  const margin = cell * 0.55;
  for (let iz = 0; iz < spec.resolution; iz++) {
    for (let ix = 0; ix < spec.resolution; ix++) {
      const { x, z } = cellCenterV0(ix, iz, spec);
      let b = 0;
      for (const o of obstacles) {
        const dx = x - o.x;
        const dz = z - o.z;
        if (dx * dx + dz * dz < (o.r + margin) * (o.r + margin)) {
          b = 1;
          break;
        }
      }
      blocked[iz * spec.resolution + ix] = b;
    }
  }
  return blocked;
}

const NEI4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
] as const;

/**
 * @returns cell indices from start to goal inclusive, or null if unreachable.
 */
export function bfsPathOnGridV0(
  spec: NavGridSpecV0,
  blocked: Uint8Array,
  start: { ix: number; iz: number },
  goal: { ix: number; iz: number }
): { ix: number; iz: number }[] | null {
  const { resolution } = spec;
  if (blocked[start.iz * resolution + start.ix] || blocked[goal.iz * resolution + goal.ix]) return null;
  const came = new Int32Array(resolution * resolution);
  came.fill(-1);
  const q: number[] = [];
  const si = start.iz * resolution + start.ix;
  const gi = goal.iz * resolution + goal.ix;
  came[si] = si;
  q.push(si);
  while (q.length) {
    const cur = q.shift()!;
    if (cur === gi) break;
    const cx = cur % resolution;
    const cz = (cur / resolution) | 0;
    for (const [dx, dz] of NEI4) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= resolution || nz >= resolution) continue;
      const ni = nz * resolution + nx;
      if (blocked[ni] || came[ni] !== -1) continue;
      came[ni] = cur;
      q.push(ni);
    }
  }
  if (came[gi] === -1) return null;
  const out: { ix: number; iz: number }[] = [];
  let p = gi;
  while (p !== si) {
    out.push({ ix: p % resolution, iz: (p / resolution) | 0 });
    p = came[p];
  }
  out.push({ ix: start.ix, iz: start.iz });
  out.reverse();
  return out;
}

/** First waypoint after current cell (or goal cell if path length 1). */
export function nextWaypointWorldV0(
  path: { ix: number; iz: number }[],
  spec: NavGridSpecV0,
  minCellsAhead: number
): { x: number; z: number } | null {
  if (!path.length) return null;
  const idx = Math.min(path.length - 1, Math.max(1, minCellsAhead));
  return cellCenterV0(path[idx].ix, path[idx].iz, spec);
}
