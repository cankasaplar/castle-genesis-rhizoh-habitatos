/**
 * Reynolds-style separation for xz steering (minimal flock solver).
 */

export type Vec2 = { x: number; z: number };

export function separationAccelerationV0(
  self: Vec2,
  neighbors: Vec2[],
  minSeparation: number,
  maxAccel: number
): Vec2 {
  let ax = 0;
  let az = 0;
  for (const o of neighbors) {
    const dx = self.x - o.x;
    const dz = self.z - o.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 1e-8 || d2 > minSeparation * minSeparation * 4) continue;
    const d = Math.sqrt(d2);
    const push = (minSeparation - d) / minSeparation;
    const nx = dx / d;
    const nz = dz / d;
    ax += nx * push;
    az += nz * push;
  }
  const m = Math.hypot(ax, az);
  if (m > maxAccel && m > 1e-8) {
    const s = maxAccel / m;
    ax *= s;
    az *= s;
  }
  return { x: ax, z: az };
}
