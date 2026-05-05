/** Default orbit phase (rad) — stable when owner moves until we add live phase in viewport. */
export const RHIZOH_ORBIT_PHASE_DEFAULT = Math.PI * 0.38;

const ORBIT_R = 0.64;

export function companionOrbitTransform(
  owner: { x: number; y: number; z: number; rotY: number },
  phaseRad: number
): { x: number; y: number; z: number; rotY: number } {
  const ox = Math.cos(phaseRad) * ORBIT_R;
  const oz = Math.sin(phaseRad) * ORBIT_R;
  const x = owner.x + ox;
  const z = owner.z + oz;
  const y = owner.y + 0.44 + Math.sin(phaseRad * 2) * 0.05;
  const rotY = Math.atan2(-ox, -oz);
  return { x, y, z, rotY };
}
