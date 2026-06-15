/**
 * Octo media — zarif yüzme, tentacle harmony (kuş sürüsü fazı), renk/boy (v0).
 */

import { deriveOctoMotionDriveV1 } from "../../studio/octoConversationMotionV1.js";
import { deriveOctoMediaTulleDriveV0 } from "./octoMediaTulleBehaviorsV0.js";

const TAU = Math.PI * 2;

/**
 * Kuş benzeri yaylı yüzme — bezier ara noktaları, yumuşak hız.
 * @param {{ x: number, y: number, vx: number, vy: number, targetX: number, targetY: number, arcT?: number, arcMidX?: number, arcMidY?: number }} state
 */
export function stepOctoMediaBirdFloatV0(state, input = {}) {
  const dt = Math.min(0.05, Math.max(0.008, Number(input.dt) || 0.016));
  const motion = Math.max(0, Math.min(1, Number(input.motion) || 0.18));
  const centroid = Math.max(0, Math.min(1, Number(input.centroid) || 0.5));
  const margin = 0.1;

  let { x, y, vx, vy, targetX, targetY } = state;
  let arcT = state.arcT ?? 1;
  let arcMidX = state.arcMidX ?? x;
  let arcMidY = state.arcMidY ?? y;

  const dist = Math.hypot(targetX - x, targetY - y);
  if (dist < 0.035 || arcT >= 1) {
    targetX = margin + Math.random() * (1 - margin * 2);
    targetY = margin + Math.random() * (1 - margin * 2);
    arcMidX = (x + targetX) / 2 + (Math.random() - 0.5) * 0.18;
    arcMidY = (y + targetY) / 2 + (Math.random() - 0.5) * 0.14;
    arcT = 0;
  }

  const cruise = 0.045 + motion * 0.22;
  arcT = Math.min(1, arcT + dt * cruise * (0.7 + motion * 0.5));
  const u = 1 - arcT;
  const bx = u * u * x + 2 * u * arcT * arcMidX + arcT * arcT * targetX;
  const by = u * u * y + 2 * u * arcT * arcMidY + arcT * arcT * targetY;

  vx = (bx - x) / Math.max(dt, 0.001);
  vy = (by - y) / Math.max(dt, 0.001);
  x = bx;
  y = by;
  x += (centroid - 0.5) * motion * 0.008;
  y += Math.sin(performance.now() * 0.0009) * motion * 0.004;

  const speed = Math.hypot(vx, vy);
  if (speed > 0.35) {
    vx *= 0.35 / speed;
    vy *= 0.35 / speed;
  }

  return {
    x: Math.max(margin, Math.min(1 - margin, x)),
    y: Math.max(margin, Math.min(1 - margin, y)),
    vx,
    vy,
    targetX,
    targetY,
    arcT,
    arcMidX,
    arcMidY
  };
}

/**
 * @param {{ audioMotion?: number, centroid?: number, vx?: number, vy?: number, emotion?: string }} input
 */
export function deriveOctoMediaElegantDriveV0(input = {}) {
  const tulle = deriveOctoMediaTulleDriveV0(input);
  const fieldState =
    tulle.mode === "SPEAK"
      ? "speaking"
      : tulle.mode === "DANCE"
        ? "executing"
        : tulle.mode === "SWIM"
          ? "listening"
          : tulle.mode === "HUNT"
            ? "thinking"
            : "idle";
  const base = deriveOctoMotionDriveV1({ fieldState, busy: tulle.audioMotion > 0.32 });
  const speed = tulle.speed;

  return Object.freeze({
    ...base,
    audioMotion: tulle.audioMotion,
    audioCentroid: input.centroid ?? 0.5,
    tulleMode: tulle.mode,
    colorLerpSpeed: tulle.colorLerpSpeed,
    waveFlow: tulle.waveFlow,
    harmonyCoupling: 0.42 + speed * 1.8 + tulle.audioMotion * 0.55,
    elegantScale: 0.36 + tulle.audioMotion * 0.06 + speed * 0.12,
    swayYaw: Math.atan2(input.vx || 0, input.vy || 0.001) * 0.28,
    breatheHz: 0.55 + tulle.audioMotion * 0.4
  });
}

/**
 * Tentacle harmony carry — kuş sürüsü faz kilidi + komşu yumuşatma.
 * @param {number} time
 * @param {ReturnType<typeof deriveOctoMediaElegantDriveV0>} drive
 * @param {{ vx?: number, vy?: number }} floatState
 * @param {number} tentacleCount
 */
export function buildOctoMediaHarmonyCarryV0(time, drive, floatState, tentacleCount) {
  const n = Math.max(1, tentacleCount);
  const flockPhase = time * (0.65 + drive.harmonyCoupling * 0.35);
  const flowSign = drive.waveFlow === "tip_to_head" ? -1 : 1;

  const harmonyOffsets = Array.from({ length: n }, (_, i) => {
    const ring = (i / n) * TAU;
    const neighbor =
      Math.sin(flockPhase + ring) * 0.5 +
      Math.sin(flockPhase * 0.7 + ring * 2 + i * 0.3) * 0.3;
    const flowWave = Math.sin(flockPhase * flowSign + i * (TAU / n) * 0.85) * drive.harmonyCoupling * 0.12;
    return neighbor + flowWave;
  });

  return {
    allowBodySwim: true,
    coastSwim: drive.audioMotion < 0.14,
    ecologyCoilBias: 0.18 + drive.harmonyCoupling * 0.22,
    tentacleExtend: drive.reach * 0.45,
    reach: drive.reach * 0.55,
    headLeanX: (floatState.vx || 0) * 0.35,
    harmonyOffsets,
    harmonyCoupling: drive.harmonyCoupling,
    phase: drive.audioMotion > 0.35 ? "extend" : "coast"
  };
}

/**
 * Harmony tentacle pass — animateOctoTentaclesV1 sonrası faz senkronu.
 * @param {ReturnType<import("../../studio/octoConversationMotionV1.js").collectOctoTentacleNodesV1>} tentacles
 * @param {ReturnType<typeof buildOctoMediaHarmonyCarryV0>} carry
 * @param {number} time
 */
export function applyOctoMediaHarmonyTentaclesV0(tentacles, carry, time) {
  if (!carry?.harmonyOffsets?.length) return;
  const coupling = carry.harmonyCoupling ?? 0.5;

  tentacles.forEach((t, i) => {
    const mesh = t.node;
    if (!mesh?.rotation) return;
    const off = carry.harmonyOffsets[i % carry.harmonyOffsets.length] ?? 0;
    const wave = Math.sin(time * (1.1 + coupling * 0.4) + i * 0.62) * off * 0.35;
    mesh.rotation.x += wave * 0.22;
    mesh.rotation.y += off * 0.08;
    mesh.rotation.z += wave * 0.18;
    if (mesh.position) {
      mesh.position.y += Math.sin(time * 0.9 + i * 0.4) * off * 0.006;
    }
  });
}

/**
 * @param {number} elegantScale
 * @param {number} time
 * @param {number} breatheHz
 */
export function resolveOctoMediaElegantScaleV0(elegantScale, time, breatheHz = 0.6) {
  const breathe = 1 + Math.sin(time * breatheHz * TAU * 0.5) * 0.018;
  return elegantScale * breathe;
}
