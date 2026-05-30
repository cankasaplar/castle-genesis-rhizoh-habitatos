/** Orbit anchor for ghost pet — tighter + lower than Rhizoh companion. */
export const PET_GHOST_ORBIT_PHASE_DEFAULT = Math.PI * 0.22;

const ORBIT_R = 0.38;
const BOB_AMP = 0.04;

export type PetGhostOrbitScaleOpts = {
  /** ~0.65–1.35 — radial distance from owner (social initiative / room heat). */
  radiusScale01?: number;
  /** ~0.5–1.4 — vertical shimmer amplitude (energy / memory recall load). */
  verticalBobScale01?: number;
  /** Social attention yaw (rad) — konum grafiği gelene kadar sembolik “kime baktığı”. */
  attentionYawOffsetRad?: number;
  /** Presence köprüsü: pet baz rotasyonuna ek dünya dikkat delta (rad), blend ile ölçeklenir. */
  worldAttentionYawOffsetRad?: number;
  /** 0..1 — readiness; dünya dikkat ofsetinin ne kadarının uygulanacağı. */
  worldSpatialBlend01?: number;
};

export function petGhostOrbitTransform(
  owner: { x: number; y: number; z: number; rotY: number },
  phaseRad: number,
  scaleOpts?: PetGhostOrbitScaleOpts | null
): { x: number; y: number; z: number; rotY: number } {
  const o = scaleOpts && typeof scaleOpts === "object" ? scaleOpts : {};
  const rs = Number.isFinite(Number(o.radiusScale01))
    ? Math.max(0.65, Math.min(1.35, Number(o.radiusScale01)))
    : 1;
  const vs = Number.isFinite(Number(o.verticalBobScale01))
    ? Math.max(0.5, Math.min(1.4, Number(o.verticalBobScale01)))
    : 1;
  const ox = Math.cos(phaseRad) * ORBIT_R * rs;
  const oz = Math.sin(phaseRad) * ORBIT_R * rs;
  const x = owner.x + ox;
  const z = owner.z + oz;
  const y = owner.y + 0.22 + Math.sin(phaseRad * 2.2) * BOB_AMP * vs;
  let rotY = Math.atan2(-ox, -oz);
  const yawOff = Number(o.attentionYawOffsetRad);
  if (Number.isFinite(yawOff)) {
    rotY += Math.max(-0.95, Math.min(0.95, yawOff));
  }
  const wDelta = Number(o.worldAttentionYawOffsetRad);
  const wBlend = Number(o.worldSpatialBlend01);
  if (Number.isFinite(wDelta) && Number.isFinite(wBlend)) {
    const b = Math.max(0, Math.min(1, wBlend));
    rotY += Math.max(-1.15, Math.min(1.15, wDelta * b));
  }
  return { x, y, z, rotY };
}
