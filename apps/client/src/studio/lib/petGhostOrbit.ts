/** Orbit anchor for ghost pet — tighter + lower than Rhizoh companion. */
export const PET_GHOST_ORBIT_PHASE_DEFAULT = Math.PI * 0.22;

const ORBIT_R = 0.38;

export function petGhostOrbitTransform(
  owner: { x: number; y: number; z: number; rotY: number },
  phaseRad: number
): { x: number; y: number; z: number; rotY: number } {
  const ox = Math.cos(phaseRad) * ORBIT_R;
  const oz = Math.sin(phaseRad) * ORBIT_R;
  const x = owner.x + ox;
  const z = owner.z + oz;
  const y = owner.y + 0.22 + Math.sin(phaseRad * 2.2) * 0.04;
  const rotY = Math.atan2(-ox, -oz);
  return { x, y, z, rotY };
}
