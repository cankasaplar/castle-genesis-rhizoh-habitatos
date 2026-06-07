/**
 * Cube-centric camera v1 — truth layer = cognitive cube; Octo is peripheral observer.
 * No agent is world center. Camera lookAt locks to cube; live drift follows topology only.
 * @see octoConversationMotionV1.js (legacy octo-head shots retained for regression)
 */

import * as THREE from "three";
import { stepOctoCameraLiveBlendV1 } from "./octoConversationMotionV1.js";

export const CUBE_CENTRIC_CAMERA_SCHEMA_V0 = "castle.cube_centric_camera.v0";

const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _look = new THREE.Vector3();
const _pos = new THREE.Vector3();

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @returns {THREE.Vector3}
 */
export function getCognitiveCubeFocusV1(crystal) {
  const cube = crystal?.cubeGroup ?? crystal?.group?.getObjectByName?.("cognitive_cube");
  const target = cube ?? crystal?.group;
  if (!target) return new THREE.Vector3(0, 0.12, 0.14);
  target.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(target);
  if (box.isEmpty()) {
    target.getWorldPosition(_center);
    return _center.clone();
  }
  box.getCenter(_center);
  return _center.clone();
}

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {number} aspectHint
 */
export function resolveCubeCentricRestShotV1(crystal, aspectHint = 3.2) {
  const cube = crystal?.cubeGroup ?? crystal?.group;
  if (cube) cube.updateMatrixWorld(true);
  const box = cube ? new THREE.Box3().setFromObject(cube) : new THREE.Box3();
  if (box.isEmpty()) {
    box.setFromCenterAndSize(new THREE.Vector3(0, 0.1, 0.14), new THREE.Vector3(0.22, 0.22, 0.22));
  }
  box.getCenter(_look);
  box.getSize(_size);

  const wide = aspectHint > 2.2;
  const fov = wide ? 46 : 44;
  const vFovRad = (fov * Math.PI) / 180;
  const span = Math.max(_size.x, _size.y, _size.z, 0.18);
  const dist = Math.max(((span * 1.35) / Math.tan(vFovRad / 2)) * 1.08, 0.72);

  _pos.set(_look.x + span * 0.08, _look.y + span * 0.12, _look.z + dist);

  return {
    pos: _pos.clone(),
    look: _look.clone(),
    fov,
    radius: span * 0.5,
    schema: CUBE_CENTRIC_CAMERA_SCHEMA_V0
  };
}

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} [aspectHint]
 */
export function aimCubeCentricConversationCameraV1(crystal, camera, aspectHint = 3.2) {
  const shot = resolveCubeCentricRestShotV1(crystal, aspectHint);
  camera.fov = shot.fov;
  camera.position.copy(shot.pos);
  camera.lookAt(shot.look);
  camera.near = Math.max(0.02, shot.radius * 0.04);
  camera.far = Math.max(shot.radius * 16, 40);
  camera.updateProjectionMatrix();
  camera.userData.cubeCentric = true;
  camera.userData.rest = {
    pos: shot.pos.clone(),
    look: shot.look.clone(),
    fov: shot.fov
  };
  if (!camera.userData.action) {
    camera.userData.action = {
      pos: shot.pos.clone(),
      look: shot.look.clone(),
      fov: shot.fov,
      initialized: true
    };
  }
  if (camera.userData.camBlend == null) camera.userData.camBlend = 0;
}

/**
 * Topology-driven micro-drift — cube evolution, not Octo swim.
 * @param {{ twist?: number, fold?: number, spikes?: number, stretchY?: number }} [topology]
 */
function resolveTopologyCameraNudgeV1(topology = {}, nowSec = 0) {
  const twist = topology.twist ?? 0;
  const fold = topology.fold ?? 0;
  const stretch = Math.max(0, (topology.stretchY ?? 1) - 1);
  return {
    x: Math.sin(nowSec * 0.35 + twist * 2.1) * 0.012 * (0.4 + twist),
    y: Math.cos(nowSec * 0.28 + fold * 1.6) * 0.008 * (0.3 + fold),
    z: Math.sin(nowSec * 0.22 + stretch * 3) * 0.006
  };
}

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta
 * @param {ReturnType<typeof import("./octoConversationMotionV1.js").deriveOctoMotionDriveV1>} drive
 * @param {{ twist?: number, fold?: number, spikes?: number, stretchY?: number }} [topology]
 */
export function updateCubeCentricConversationCameraV1(crystal, camera, delta, drive, topology = {}) {
  const blend = stepOctoCameraLiveBlendV1(camera, drive, delta);
  if (!camera.userData.rest) aimCubeCentricConversationCameraV1(crystal, camera, camera.aspect);

  const restShot = resolveCubeCentricRestShotV1(crystal, camera.aspect);
  const restPos = restShot.pos;
  const restLook = restShot.look;
  const restFov = restShot.fov;
  const ac = camera.userData.action;
  if (!ac) return;

  const now = performance.now() * 0.001;
  const nudge = resolveTopologyCameraNudgeV1(topology, now);
  const cubeFocus = getCognitiveCubeFocusV1(crystal);

  if (drive.live) {
    const pan = Math.min(1, blend * 0.18);
    const desiredPos = restPos.clone();
    desiredPos.x += nudge.x * (1 + pan);
    desiredPos.y += nudge.y * (1 + pan * 0.5);
    const targetLook = cubeFocus.clone().add(new THREE.Vector3(nudge.x * 0.4, nudge.y * 0.35, 0));
    const a = Math.min(1, delta * 2.8);
    ac.pos.lerp(desiredPos, a);
    ac.look.lerp(targetLook, a);
    ac.fov += (restFov + drive.activation * 1.2 - ac.fov) * Math.min(1, delta * 2.2);
  } else {
    const smooth = Math.min(1, delta * 4.2);
    ac.pos.lerp(restPos, smooth);
    ac.look.lerp(cubeFocus, smooth);
    ac.fov += (restFov - ac.fov) * smooth;
  }

  camera.position.lerpVectors(restPos, ac.pos, blend);
  const finalLook = restLook.clone().lerp(ac.look, blend);
  camera.lookAt(finalLook);
  camera.fov = THREE.MathUtils.lerp(restFov, ac.fov, blend);
  camera.updateProjectionMatrix();
  camera.userData.rest = { pos: restPos, look: restLook, fov: restFov };
}
