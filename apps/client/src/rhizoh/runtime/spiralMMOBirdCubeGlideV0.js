/**
 * SpiralMMO bird cube glide v0 — short bezier hops from spiral route to cube targets.
 * RESEARCH-ONLY — perception motion only.
 */

/**
 * @param {{ x: number, y: number, z?: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} t01
 */
export function sampleSpiralMMOBirdCubeGlideV0(from, to, t01) {
  const t = Math.max(0, Math.min(1, t01));
  const ease = t * t * (3 - 2 * t);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - 42;
  const inv = 1 - ease;
  const x = inv * inv * from.x + 2 * inv * ease * midX + ease * ease * to.x;
  const y = inv * inv * from.y + 2 * inv * ease * midY + ease * ease * to.y;
  const z = (from.z ?? 0) + Math.sin(ease * Math.PI) * 28;
  const headingDeg = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const pitchDeg = -18 + Math.sin(ease * Math.PI) * -12;
  const depthScaleMul = 0.88 + Math.sin(ease * Math.PI) * 0.22;
  return { x, y, z, headingDeg, pitchDeg, bank: 0, depthScaleMul };
}

/**
 * @param {number} progress01
 * @param {number} loopIndex
 * @param {number} birdIndex
 */
export function shouldTriggerSpiralMMOBirdCubeGlideV0(progress01, loopIndex, birdIndex) {
  if (progress01 < 0.88) return false;
  if (loopIndex < 1) return false;
  return (loopIndex + birdIndex) % 2 === 0;
}
