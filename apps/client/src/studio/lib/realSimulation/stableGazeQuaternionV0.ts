/**
 * Stable gaze: yaw toward target with turn-rate limit; quaternion helper for Three.
 * Presence pets use `rotY` — primary API is yaw; quat is optional for rigs.
 */

import * as THREE from "three";

const _e = new THREE.Euler(0, 0, 0, "YXZ");
const _fwd = new THREE.Vector3();

export function yawTowardPointV0(from: { x: number; z: number }, to: { x: number; z: number }): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(dx, dz);
}

export function stableYawTowardV0(
  currentYaw: number,
  targetYaw: number,
  dtSec: number,
  maxTurnRadPerSec: number
): number {
  let delta = targetYaw - currentYaw;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const maxStep = maxTurnRadPerSec * dtSec;
  if (Math.abs(delta) <= maxStep) return targetYaw;
  return currentYaw + Math.sign(delta) * maxStep;
}

export function quaternionLookAtStableV0(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  currentQuat: THREE.Quaternion,
  maxTurnRadPerSec: number,
  dtSec: number
): THREE.Quaternion {
  _fwd.set(to.x - from.x, to.y - from.y, to.z - from.z);
  if (_fwd.lengthSq() < 1e-10) return currentQuat.clone();
  _fwd.normalize();
  const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), _fwd);
  const step = Math.min(1, maxTurnRadPerSec * dtSec * 0.18);
  return currentQuat.clone().slerp(targetQ, step);
}

export function quaternionToYawV0(q: THREE.Quaternion): number {
  _e.setFromQuaternion(q);
  return _e.y;
}
