import * as THREE from "three";
import { getCognitiveCubeFocusV1 } from "./octoCubeCentricCameraV1.js";
import { OCTO_YUVA_FLOOR_Y_V1 } from "./octoConversationMotionV1.js";

/** Yuva spiral zemin — createOctoYuvaNestV1 spiralFloor y ≈ -0.19 */
export const CONVERSATION_YUVA_FLOOR_Y_V0 = OCTO_YUVA_FLOOR_Y_V1 + 0.01;

const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _foxBox = new THREE.Box3();
const _cubeBox = new THREE.Box3();
const _union = new THREE.Box3();

/**
 * Fit a non-Octo anchor GLB into the compact yuva nest (same floor band as Octo).
 * @param {THREE.Object3D} root
 * @param {{ targetSize?: number, homeX?: number, nestFloorY?: number, tint?: number, emissive?: number, emissiveIntensity?: number, preserveOriginalMaterials?: boolean }} [opts]
 */
export function fitConversationAnchorInNestV0(root, opts = {}) {
  const targetSize = opts.targetSize ?? 0.5;
  const homeX = opts.homeX ?? -0.14;
  const nestFloorY = opts.nestFloorY ?? CONVERSATION_YUVA_FLOOR_Y_V0;
  const preserveOriginalMaterials = Boolean(opts.preserveOriginalMaterials);
  const tint = opts.tint ?? 0xd97706;
  const emissive = opts.emissive ?? 0xfbbf24;
  const emissiveIntensity = opts.emissiveIntensity ?? 0.34;

  root.scale.setScalar(1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  box.getSize(_size);
  box.getCenter(_center);
  const maxDim = Math.max(_size.x, _size.y, _size.z, 0.001);
  const s = targetSize / maxDim;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(root);
  const feetY = fitted.min.y;
  root.position.set(-_center.x * s + homeX, nestFloorY - feetY, -_center.z * s + 0.04);
  root.rotation.y = opts.baseYaw ?? 0.28;

  const tintColor = new THREE.Color(tint);
  const emColor = new THREE.Color(emissive);
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      mat.side = THREE.DoubleSide;
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.needsUpdate = true;
      }
      if (preserveOriginalMaterials) {
        if (mat.emissive) mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      } else {
        if (mat.color) mat.color.lerp(tintColor, 0.18);
        if (!mat.emissive) mat.emissive = new THREE.Color();
        mat.emissive.copy(emColor);
        mat.emissiveIntensity = emissiveIntensity;
      }
      mat.needsUpdate = true;
    }
  });

  root.userData.baseY = root.position.y;
  root.userData.baseX = root.position.x;
  root.userData.baseZ = root.position.z;
  root.userData.baseYaw = root.rotation.y;
  root.userData.fitScale = s;
  root.userData.fitHeight = _size.y * s;
  root.userData.spatialBounds = { x: 0.28, z: 0.24 };

  return { scale: s, maxDim };
}

/**
 * Lab viewport — FOX + cognitive cube birlikte; yuva zemin hizalı hero kadraj.
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} [aspect]
 */
export function aimFoxLabConversationCameraV0(crystal, root, camera, aspect = 1.6) {
  root.updateMatrixWorld(true);
  _foxBox.setFromObject(root);
  const cubeFocus = getCognitiveCubeFocusV1(crystal);
  _cubeBox.setFromCenterAndSize(cubeFocus, new THREE.Vector3(0.3, 0.3, 0.3));
  _union.copy(_foxBox).union(_cubeBox);
  _union.getCenter(_center);
  _union.getSize(_size);

  const span = Math.max(_size.y, _size.x * 0.9, 0.52);
  const wide = aspect > 1.8;
  camera.fov = wide ? 46 : 50;
  const dist = Math.max(span * 1.72, 0.88);

  camera.position.set(
    _center.x + span * 0.05,
    _center.y + span * 0.26,
    _center.z + dist
  );
  camera.near = 0.02;
  camera.far = Math.max(span * 16, 28);
  camera.lookAt(_center.x + span * 0.02, _center.y + span * 0.2, _center.z);
  camera.updateProjectionMatrix();
  camera.userData.rest = {
    pos: camera.position.clone(),
    look: _center.clone(),
    fov: camera.fov,
    lab: true
  };
}

/**
 * Frame FOX + cognitive cube together (compact dock — cube must stay visible).
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} [aspect]
 */
export function aimFoxCubeConversationCameraV0(crystal, root, camera, aspect = 3.2) {
  root.updateMatrixWorld(true);
  _foxBox.setFromObject(root);
  const cubeFocus = getCognitiveCubeFocusV1(crystal);
  _cubeBox.setFromCenterAndSize(cubeFocus, new THREE.Vector3(0.24, 0.24, 0.24));
  _union.copy(_foxBox).union(_cubeBox);
  _union.getCenter(_center);
  _union.getSize(_size);

  const span = Math.max(_size.y, _size.x * 0.92, 0.42);
  const wide = aspect > 2.2;
  camera.fov = wide ? 38 : 40;
  const dist = Math.max(span * 1.42, 0.72);

  camera.position.set(
    _center.x + span * 0.04,
    _center.y + span * 0.18,
    _center.z + dist
  );
  camera.near = 0.02;
  camera.far = Math.max(span * 14, 24);
  camera.lookAt(_center.x + span * 0.02, _center.y + span * 0.14, _center.z);
  camera.updateProjectionMatrix();
  camera.userData.rest = {
    pos: camera.position.clone(),
    look: _center.clone(),
    fov: camera.fov
  };
}

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} crystal
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta
 * @param {{ live?: boolean, activation?: number }} drive
 * @param {number} [aspect]
 */
export function updateFoxCubeConversationCameraV0(crystal, root, camera, delta, drive = {}, aspect) {
  if (!camera.userData.rest) {
    aimFoxCubeConversationCameraV0(crystal, root, camera, aspect ?? camera.aspect);
    return;
  }
  const live = Boolean(drive.live);
  const act = Math.min(1, Math.max(0, Number(drive.activation) || 0));
  const rest = camera.userData.rest;
  const blend = live ? Math.min(1, 0.12 + act * 0.14) : 0;
  const a = Math.min(1, delta * 2.4);
  const nudgeY = live ? Math.sin(performance.now() * 0.0012) * 0.012 * blend : 0;
  const nudgeX = live ? Math.cos(performance.now() * 0.0009) * 0.008 * blend : 0;

  camera.position.x += (rest.pos.x + nudgeX - camera.position.x) * a;
  camera.position.y += (rest.pos.y + nudgeY - camera.position.y) * a;
  camera.position.z += (rest.pos.z - camera.position.z) * a;
  camera.lookAt(
    rest.look.x + nudgeX * 0.35,
    rest.look.y + nudgeY * 0.4,
    rest.look.z
  );
  camera.updateProjectionMatrix();
}

/**
 * Camera for compact dock — frames anchor only (legacy fallback).
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} [aspect]
 */
export function aimConversationAnchorCameraV0(root, camera, aspect = 3.2) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  box.getCenter(_center);
  box.getSize(_size);
  const span = Math.max(_size.y, _size.x * 0.85, 0.28);
  const wide = aspect > 2.2;
  camera.fov = wide ? 44 : 48;
  camera.position.set(
    _center.x + span * 0.06,
    _center.y + span * 0.55,
    _center.z + span * 1.85
  );
  camera.near = 0.02;
  camera.far = Math.max(span * 14, 24);
  camera.lookAt(_center.x, _center.y + span * 0.42, _center.z);
  camera.updateProjectionMatrix();
  camera.userData.rest = {
    pos: camera.position.clone(),
    look: _center.clone(),
    fov: camera.fov
  };
}

/**
 * Gentle idle + live motion on nest anchor.
 * @param {THREE.Object3D} root
 * @param {number} t
 * @param {{ live?: boolean, activation?: number }} drive
 */
export function animateConversationAnchorInNestV0(root, t, drive = {}, opts = {}) {
  const locomotionActive = Boolean(opts.locomotionActive);
  const act = Math.min(1, Math.max(0, Number(drive.activation) || 0.35));
  const live = Boolean(drive.live);
  const baseY = Number(root.userData.baseY) || 0;
  const baseX = Number(root.userData.baseX) || 0;
  const baseZ = Number(root.userData.baseZ) || 0;
  const baseYaw = Number(root.userData.baseYaw) || 0;

  if (locomotionActive) {
    root.position.x = baseX;
    root.position.y = baseY;
    root.position.z = baseZ;
    root.rotation.y = baseYaw + Math.sin(t * 0.38) * (live ? 0.06 : 0.03);
    root.rotation.x = 0;
    return;
  }

  const bob = live ? 0.016 + act * 0.012 : 0.008 + act * 0.006;
  root.position.y = baseY + Math.sin(t * (live ? 1.35 : 0.95)) * bob;
  root.position.x = baseX + Math.sin(t * 0.55) * (live ? 0.008 : 0.004);
  root.position.z = baseZ + Math.cos(t * 0.48) * (live ? 0.005 : 0.003);
  root.rotation.y = baseYaw + Math.sin(t * 0.42) * (live ? 0.08 : 0.04);
  root.rotation.x = Math.sin(t * 0.7) * (live ? 0.03 : 0.015);
}
