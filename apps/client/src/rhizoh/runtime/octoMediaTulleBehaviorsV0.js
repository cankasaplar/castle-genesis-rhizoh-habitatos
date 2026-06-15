/**
 * Octo media tulle — behavior presets (OctoDance-derived, v0 visual).
 */

export const OCTO_MEDIA_TULLE_BEHAVIORS_V0 = Object.freeze({
  IDLE: Object.freeze({ freq: 0.42, amplitude: 0.55, colorH: 190, spread: 0.7, curl: 0.5 }),
  SWIM: Object.freeze({ freq: 0.9, amplitude: 0.75, colorH: 210, spread: 1.0, curl: 0.35 }),
  HUNT: Object.freeze({ freq: 1.6, amplitude: 0.9, colorH: 40, spread: 0.5, curl: 0.8 }),
  DANCE: Object.freeze({ freq: 2.2, amplitude: 1.1, colorH: 290, spread: 1.2, curl: 0.6 }),
  SPEAK: Object.freeze({ freq: 1.1, amplitude: 0.85, colorH: 160, spread: 0.9, curl: 0.45 })
});

/**
 * @param {keyof typeof OCTO_MEDIA_TULLE_BEHAVIORS_V0} name
 */
export function resolveOctoMediaTulleBehaviorV0(name) {
  return OCTO_MEDIA_TULLE_BEHAVIORS_V0[name] || OCTO_MEDIA_TULLE_BEHAVIORS_V0.IDLE;
}

/**
 * Audio + float velocity → behavior mode, hue lerp speed, wave flow direction.
 * Faster movement → faster color adaptation.
 * @param {{ audioMotion?: number, centroid?: number, vx?: number, vy?: number }} input
 */
export function deriveOctoMediaTulleDriveV0(input = {}) {
  const audioMotion = Math.max(0, Math.min(1, Number(input.audioMotion) || 0));
  const centroid = Math.max(0, Math.min(1, Number(input.centroid) || 0.5));
  const vx = Number(input.vx) || 0;
  const vy = Number(input.vy) || 0;
  const speed = Math.hypot(vx, vy);

  let mode = "IDLE";
  if (audioMotion > 0.4) mode = "SPEAK";
  else if (audioMotion > 0.3 || speed > 0.1) mode = "DANCE";
  else if (speed > 0.055) mode = "SWIM";
  else if (audioMotion > 0.17) mode = "HUNT";

  const colorLerpSpeed = 0.45 + speed * 14 + audioMotion * 5.5;
  const waveFlow =
    speed > 0.04 ? (vy < 0 || vx > 0.02 ? "head_to_tip" : "tip_to_head") : "pulse";

  return Object.freeze({
    mode,
    colorLerpSpeed,
    waveFlow,
    hueBias: (centroid - 0.5) * 70,
    speed,
    audioMotion
  });
}

/**
 * @param {Record<string, number>} current
 * @param {Record<string, number>} target
 * @param {number} dt
 * @param {number} lerpSpeed
 */
export function lerpOctoMediaTulleBehaviorV0(current, target, dt, lerpSpeed) {
  const speed = Math.min(1, dt * lerpSpeed);
  for (const k of ["freq", "amplitude", "colorH", "spread", "curl"]) {
    current[k] += (target[k] - current[k]) * speed;
  }
}
