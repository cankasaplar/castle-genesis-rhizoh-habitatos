/**
 * Octo media overlay — free float + audio-reactive drive (v0 visual only).
 */

import { deriveOctoMotionDriveV1 } from "../../studio/octoConversationMotionV1.js";

/**
 * @param {Uint8Array | null} freqData
 * @returns {{ motion: number, centroid: number, low: number, mid: number, high: number }}
 */
export function sampleOctoMediaAudioBandsV0(freqData) {
  if (!freqData?.length) {
    return { motion: 0.22, centroid: 0.5, low: 0, mid: 0, high: 0 };
  }
  let sum = 0;
  let low = 0;
  let mid = 0;
  let high = 0;
  const third = Math.max(1, Math.floor(freqData.length / 3));
  for (let i = 0; i < freqData.length; i += 1) {
    sum += freqData[i];
    if (i < third) low += freqData[i];
    else if (i < third * 2) mid += freqData[i];
    else high += freqData[i];
  }
  const motion = sum / (freqData.length * 255);
  const centroid = (low * 0.25 + mid * 0.55 + high * 0.95) / (low + mid + high + 1);
  return { motion, centroid, low, mid, high };
}

/**
 * @param {{ motion?: number, centroid?: number }} bands
 */
export function deriveOctoMediaAudioDriveV0(bands = {}) {
  const motion = Math.max(0, Math.min(1, Number(bands.motion) || 0));
  const centroid = Math.max(0, Math.min(1, Number(bands.centroid) || 0.5));
  let fieldState = "idle";
  if (motion > 0.42) fieldState = "speaking";
  else if (motion > 0.28) fieldState = "listening";
  else if (motion > 0.16) fieldState = "thinking";
  const drive = deriveOctoMotionDriveV1({ fieldState, busy: motion > 0.35 });
  return Object.freeze({
    ...drive,
    audioMotion: motion,
    audioCentroid: centroid,
    swayBoost: 0.35 + motion * 1.4,
    colorPulse: motion
  });
}

/**
 * Serbest yüzme — normalized viewport coords (0–1).
 * @param {{ x: number, y: number, vx: number, vy: number, targetX: number, targetY: number }} state
 * @param {{ motion?: number, centroid?: number, dt?: number }} input
 */
export function stepOctoMediaFloatV0(state, input = {}) {
  const dt = Math.min(0.05, Math.max(0.008, Number(input.dt) || 0.016));
  const motion = Math.max(0, Math.min(1, Number(input.motion) || 0.2));
  const centroid = Math.max(0, Math.min(1, Number(input.centroid) || 0.5));
  const margin = 0.08;
  const speed = 0.12 + motion * 0.55;

  let { x, y, vx, vy, targetX, targetY } = state;
  const dist = Math.hypot(targetX - x, targetY - y);
  if (dist < 0.04 || Math.random() < 0.002) {
    targetX = margin + Math.random() * (1 - margin * 2);
    targetY = margin + Math.random() * (1 - margin * 2);
  }

  const ax = (targetX - x) * (1.8 + motion * 2.2);
  const ay = (targetY - y) * (1.8 + motion * 2.2);
  vx += ax * dt + (centroid - 0.5) * motion * 0.35 * dt;
  vy += ay * dt + Math.sin(performance.now() * 0.0012) * motion * 0.12 * dt;
  vx *= 0.92;
  vy *= 0.92;
  const vlen = Math.hypot(vx, vy);
  if (vlen > speed) {
    vx = (vx / vlen) * speed;
    vy = (vy / vlen) * speed;
  }
  x = Math.max(margin, Math.min(1 - margin, x + vx * dt));
  y = Math.max(margin, Math.min(1 - margin, y + vy * dt));

  return { x, y, vx, vy, targetX, targetY };
}

/**
 * Normalized float (0–1) → Three.js scene XY (aspect-corrected).
 * @param {number} aspect width/height
 */
export function octoMediaFloatToSceneXYV0(x, y, aspect = 1) {
  const spanX = Math.max(1.2, aspect * 1.05);
  const spanY = 1.05;
  return {
    sceneX: (x - 0.5) * spanX * 2,
    sceneY: (0.5 - y) * spanY * 2
  };
}
