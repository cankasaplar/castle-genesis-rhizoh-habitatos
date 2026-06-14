/**
 * Medusa companion motion — head sway + snake wiggle (GLTF meshes only, no torus overlays).
 */

import { MEDUSA_COMPANION_FACE_Y_V0 } from "./medusaCompanionSceneV0.js";

/**
 * @param {THREE.Object3D} root
 * @returns {THREE.Object3D[]}
 */
export function collectMedusaSnakeMeshesV0(root) {
  if (!root) return [];
  /** @type {THREE.Object3D[]} */
  const snakes = [];
  root.traverse((obj) => {
    if (obj.userData?.medusaSnake) snakes.push(obj);
  });
  return snakes;
}

/**
 * Tag snake/hair meshes on loaded GLTF root.
 * @param {THREE.Object3D} root
 */
export function tagMedusaGltfSnakeMeshesV0(root) {
  if (!root) return;
  root.traverse((obj) => {
    const name = String(obj.name || "").toLowerCase();
    if (/snake|hair|serpent|lock|strand/.test(name)) {
      obj.userData.medusaSnake = true;
      if (obj.userData.snakePhase == null) {
        obj.userData.snakePhase = Math.random() * Math.PI * 2;
      }
    }
  });
}

/**
 * @param {THREE.Object3D | null} root
 * @param {number} t
 * @param {{
 *   motion?: number,
 *   headYawTarget?: number,
 *   swayScale?: number,
 *   idleAmp?: number,
 *   audioGain?: number,
 *   snakeMeshes?: THREE.Object3D[]
 * }} [opts]
 */
export function animateMedusaCompanionRootV0(root, t, opts = {}) {
  if (!root) return { headYawTarget: opts.headYawTarget ?? 0 };
  const motionProfile = {
    swayScale: opts.swayScale ?? 1,
    idleAmp: opts.idleAmp ?? 0.09,
    audioGain: opts.audioGain ?? 1
  };
  let motion = opts.motion;
  if (motion == null) {
    motion = 0.28 + Math.sin(t * 2.1) * motionProfile.idleAmp;
  }
  let headYawTarget = opts.headYawTarget ?? 0;
  headYawTarget *= 0.972;

  const sway = (0.28 + motion * 0.85 * motionProfile.audioGain) * motionProfile.swayScale;
  const breathe = Math.sin(t * 1.1) * 0.07 * motionProfile.swayScale;
  const idleYaw = Math.sin(t * 1.2) * sway * 0.38 + Math.sin(t * 0.35) * 0.06;
  root.rotation.y = MEDUSA_COMPANION_FACE_Y_V0 + headYawTarget + idleYaw;
  root.rotation.z = Math.sin(t * 0.9) * sway * 0.32;
  root.rotation.x = Math.sin(t * 0.7) * sway * 0.14 - headYawTarget * 0.08;
  root.position.y = Math.sin(t * 1.6) * (0.06 + motion * 0.14) + breathe;
  root.position.x = Math.sin(t * 0.85) * sway * 0.07 + headYawTarget * 0.04;

  const snakeMeshes = opts.snakeMeshes || collectMedusaSnakeMeshesV0(root);
  for (let i = 0; i < snakeMeshes.length; i += 1) {
    const snake = snakeMeshes[i];
    const phase = Number(snake.userData?.snakePhase) || i * 0.7;
    const wiggle = (0.48 + motion * 0.95) * motionProfile.swayScale;
    const hairLift = motion * 0.18;
    snake.rotation.z = Math.sin(t * 2.8 + phase) * wiggle + hairLift;
    snake.rotation.x = Math.sin(t * 2.1 + phase * 1.3) * wiggle * 0.78;
    snake.rotation.y = Math.cos(t * 2.4 + phase * 0.8) * wiggle * 0.55 + headYawTarget * 0.35;
  }

  return { headYawTarget };
}
