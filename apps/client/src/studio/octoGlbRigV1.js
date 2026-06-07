import * as THREE from "three";

/** @typedef {{ bone: THREE.Bone, name: string, index: number, originalQuaternion: THREE.Quaternion, originalPosition: THREE.Vector3, originalRotation: THREE.Euler }} OctoRigBoneEntryV1 */
/** @typedef {{ id: number, label: string, rootName: string, bones: OctoRigBoneEntryV1[], tip: OctoRigBoneEntryV1, base: OctoRigBoneEntryV1 }} OctoTentacleChainV1 */
/** @typedef {{ skinnedMesh: THREE.SkinnedMesh, skeleton: THREE.Skeleton, tentacles: OctoTentacleChainV1[], headBones: OctoRigBoneEntryV1[], allBones: OctoRigBoneEntryV1[] }} OctoGlbRigV1 */

const TENTACLE_BONE_RE = /^(?:11|12|13|14|15|21|22|23|24|25|31|32|33|34|35)(?:\.00[1-7])?$/;
const HEAD_BONE_RE = /^HEAD_01$|^Bone\.00[1-3]$/;

const _aimQuat = new THREE.Quaternion();
const _aimEuler = new THREE.Euler();
const _worldPos = new THREE.Vector3();
const _orbVec = new THREE.Vector3();
const _invParent = new THREE.Matrix4();
const _localDir = new THREE.Vector3();

function ensureRigMotionStateV1(rig) {
  if (!rig.motion) {
    rig.motion = {
      reachYaw: 0,
      reachPitch: 0,
      headYaw: 0,
      headPitch: 0
    };
  }
  return rig.motion;
}

/**
 * GLB BLUE-RINGED rig — 8 tentacle zinciri × 15 kemik + HEAD.
 * @param {THREE.Object3D} root
 * @returns {OctoGlbRigV1 | null}
 */
export function extractOctoGlbRigV1(root) {
  if (!root) return null;
  /** @type {THREE.SkinnedMesh | null} */
  let skinnedMesh = null;
  root.traverse((obj) => {
    if (obj.isSkinnedMesh && !skinnedMesh) skinnedMesh = obj;
  });
  if (!skinnedMesh?.skeleton) return null;

  const boneMap = new Map();
  for (const bone of skinnedMesh.skeleton.bones) {
    boneMap.set(bone.name, bone);
  }

  /** @type {OctoRigBoneEntryV1[]} */
  const allBones = [];
  const wrap = (bone) => {
    if (!bone) return null;
    if (!bone.userData.octoOrigQ) {
      bone.userData.octoOrigQ = bone.quaternion.clone();
      bone.userData.octoOrigP = bone.position.clone();
      bone.userData.octoOrigR = bone.rotation.clone();
    }
    return {
      bone,
      name: bone.name,
      index: allBones.length,
      originalQuaternion: bone.userData.octoOrigQ,
      originalPosition: bone.userData.octoOrigP,
      originalRotation: bone.userData.octoOrigR
    };
  };

  /** @type {OctoTentacleChainV1[]} */
  const tentacles = [];
  const rootNames = ["11", "11.001", "11.002", "11.003", "11.004", "11.005", "11.006", "11.007"];

  rootNames.forEach((rootName, id) => {
    const tipBone = boneMap.get(rootName);
    if (!tipBone) return;
    /** @type {OctoRigBoneEntryV1[]} */
    const bones = [];
    let cur = tipBone;
    let guard = 0;
    while (cur && guard < 20) {
      if (!TENTACLE_BONE_RE.test(cur.name)) break;
      const entry = wrap(cur);
      if (entry) {
        bones.push(entry);
        allBones.push(entry);
      }
      cur = cur.children?.[0]?.isBone ? cur.children[0] : null;
      guard += 1;
    }
    if (bones.length < 4) return;
    tentacles.push({
      id,
      label: `tentacle_${id}`,
      rootName,
      bones,
      tip: bones[0],
      base: bones[bones.length - 1]
    });
  });

  /** @type {OctoRigBoneEntryV1[]} */
  const headBones = [];
  let headCur = boneMap.get("HEAD_01");
  let hg = 0;
  while (headCur && hg < 8) {
    if (!HEAD_BONE_RE.test(headCur.name) && headCur.name !== "HEAD_01") break;
    const entry = wrap(headCur);
    if (entry) {
      headBones.push(entry);
      allBones.push(entry);
    }
    headCur = headCur.children?.[0]?.isBone ? headCur.children[0] : null;
    hg += 1;
  }

  if (!tentacles.length) return null;

  return {
    skinnedMesh,
    skeleton: skinnedMesh.skeleton,
    tentacles,
    headBones,
    allBones
  };
}

/**
 * Sağdaki orb'a en uygun tek ön tentacle.
 * @param {OctoGlbRigV1} rig
 * @param {THREE.Vector3} orbPos
 * @returns {number}
 */
export function pickOctoPrimaryReachChainV1(rig, orbPos) {
  if (!rig?.tentacles?.length || !orbPos) return rig?.tentacles?.[0]?.id ?? 0;
  let best = rig.tentacles[0].id;
  let bestScore = -Infinity;
  for (const chain of rig.tentacles) {
    chain.tip.bone.getWorldPosition(_worldPos);
    const towardOrb = orbPos.x - _worldPos.x;
    const score = _worldPos.x * 1.6 + towardOrb * 0.35 - Math.abs(_worldPos.y - orbPos.y) * 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = chain.id;
    }
  }
  return best;
}

/** @deprecated use pickOctoPrimaryReachChainV1 */
export function pickOctoReachChainsV1(rig, orbPos) {
  return [pickOctoPrimaryReachChainV1(rig, orbPos)];
}

/**
 * Yumuşak uzanma — yön her kare sıfırlanmaz, delta ile lerp.
 * @param {OctoGlbRigV1} rig
 * @param {OctoTentacleChainV1} chain
 * @param {THREE.Vector3} targetWorld
 * @param {number} amount
 * @param {number} delta
 */
export function bendOctoChainTowardSmoothV1(rig, chain, targetWorld, amount, delta = 1 / 60) {
  const amt = THREE.MathUtils.clamp(amount, 0, 1.1);
  if (amt < 0.02) return;
  const motion = ensureRigMotionStateV1(rig);
  const baseEntry = chain.base;
  const parent = baseEntry.bone.parent;
  if (!parent) return;

  baseEntry.bone.getWorldPosition(_worldPos);
  _orbVec.copy(targetWorld).sub(_worldPos);
  if (_orbVec.lengthSq() < 1e-6) return;

  _invParent.copy(parent.matrixWorld).invert();
  _localDir.copy(_orbVec).normalize().transformDirection(_invParent).normalize();

  const targetYaw = Math.atan2(_localDir.x, _localDir.z) * amt * 1.35;
  const targetPitch = Math.asin(THREE.MathUtils.clamp(_localDir.y, -1, 1)) * amt * 0.9;
  const smooth = Math.min(1, delta * 2.8);

  motion.reachYaw += (targetYaw - motion.reachYaw) * smooth;
  motion.reachPitch += (targetPitch - motion.reachPitch) * smooth;

  const ordered = [...chain.bones].reverse();
  ordered.forEach((entry, segIdx) => {
    const t = segIdx / Math.max(ordered.length - 1, 1);
    const weight = THREE.MathUtils.smoothstep(t, 0.1, 1);
    const yaw = motion.reachYaw * weight;
    const pitch = motion.reachPitch * weight;
    _aimEuler.set(pitch, yaw, yaw * 0.08, "XYZ");
    _aimQuat.setFromEuler(_aimEuler);
    entry.bone.quaternion.copy(entry.originalQuaternion).multiply(_aimQuat);
  });
}

/**
 * Sakin dalga — kemik zinciri.
 * @param {OctoTentacleChainV1} chain
 * @param {number} time
 * @param {{ speed?: number, amp?: number, phase?: number, bias?: number }} wave
 */
export function waveOctoChainV1(chain, time, wave = {}) {
  const spd = wave.speed ?? 0.32;
  const amp = wave.amp ?? 0.07;
  const phase = wave.phase ?? chain.id * 0.78;
  const bias = wave.bias ?? 0;
  const segCount = chain.bones.length;

  chain.bones.forEach((entry, segIdx) => {
    const t = time * spd + phase + segIdx * 0.28;
    const w = amp * (0.28 + segIdx / segCount);
    const swayX = Math.sin(t * 0.75) * w + bias * w * 0.35;
    const swayY = Math.sin(t * 0.5 + 0.35) * w * 0.22;
    const swayZ = Math.cos(t * 0.58) * w * 0.32;
    _aimEuler.set(swayX, swayY, swayZ, "XYZ");
    _aimQuat.setFromEuler(_aimEuler);
    entry.bone.quaternion.copy(entry.originalQuaternion).multiply(_aimQuat);
  });
}

/**
 * Kafa → orb (yumuşak).
 * @param {OctoGlbRigV1} rig
 * @param {THREE.Vector3} orbPos
 * @param {number} amount
 * @param {number} delta
 */
export function aimOctoHeadAtOrbV1(rig, orbPos, amount = 0.5, delta = 1 / 60) {
  if (!rig?.headBones?.length || !orbPos || amount < 0.02) return;
  const entry = rig.headBones[0];
  const head = entry.bone;
  const parent = head.parent;
  if (!parent) return;
  const motion = ensureRigMotionStateV1(rig);

  head.getWorldPosition(_worldPos);
  _orbVec.copy(orbPos).sub(_worldPos);
  if (_orbVec.lengthSq() < 1e-6) return;
  _orbVec.normalize();

  _invParent.copy(parent.matrixWorld).invert();
  _localDir.copy(_orbVec).transformDirection(_invParent).normalize();

  const lean = THREE.MathUtils.clamp(amount, 0, 1);
  const targetYaw = Math.atan2(_localDir.x, _localDir.z) * lean * 0.85;
  const targetPitch = Math.asin(THREE.MathUtils.clamp(_localDir.y, -1, 1)) * lean * 0.55;
  const smooth = Math.min(1, delta * 2.4);

  motion.headYaw += (targetYaw - motion.headYaw) * smooth;
  motion.headPitch += (targetPitch - motion.headPitch) * smooth;

  _aimEuler.set(motion.headPitch, motion.headYaw, 0, "XYZ");
  _aimQuat.setFromEuler(_aimEuler);
  head.quaternion.copy(entry.originalQuaternion).multiply(_aimQuat);
}

/**
 * @param {OctoGlbRigV1} rig
 * @param {number} time
 * @param {*} drive
 * @param {*} carry
 * @param {number} [delta]
 */
export function animateOctoGlbRigV1(rig, time, drive, carry = {}, delta = 1 / 60) {
  if (!rig) return;
  const live = drive?.live !== false || carry?.sessionSwim === true || carry?.allowBodySwim === true;
  if (!live) {
    resetOctoGlbRigV1(rig, 1);
    return;
  }

  const coast = drive?.swimMode === "coast" || carry?.coastSwim || carry?.touched;
  const typing = drive?.swimMode === "typing";
  const orbPos = carry.orbPos;
  const primaryId = carry.primaryReachId ?? carry.reachChainIds?.[0] ?? 0;
  const phase = String(carry.phase || "");
  const reachAmt = Math.max(carry.reachAmount ?? 0, carry.reach ?? 0, carry.tentacleExtend ?? 0);

  const activeReach =
    carry.grabActive === true &&
    (phase === "orient" || phase === "extend" || phase === "touch");

  if (!activeReach) {
    if (rig.motion) {
      rig.motion.reachYaw *= 1 - Math.min(1, delta * 2.5);
      rig.motion.reachPitch *= 1 - Math.min(1, delta * 2.5);
    }
    if (orbPos) {
      const headSign = carry?.octoHeadSign ?? 1;
      const headAmt = (coast || typing ? 0.52 : 0.38) * Math.abs(headSign);
      const lookPos = orbPos.clone();
      if (headSign < 0) lookPos.x *= -1;
      aimOctoHeadAtOrbV1(rig, lookPos, headAmt, delta);
    }
    rig.skeleton.update();
    return;
  }

  const waveSpeed = coast ? 0.22 : typing ? 0.34 : 0.28;
  const waveAmp = coast ? 0.055 : typing ? 0.085 : 0.065;

  for (const chain of rig.tentacles) {
    const isPrimary = chain.id === primaryId;
    if (isPrimary && orbPos) {
      const bend = Math.min(1.05, reachAmt * 1.05);
      bendOctoChainTowardSmoothV1(rig, chain, orbPos, bend, delta);
    } else {
      const bias = isPrimary && coast && carry?.touched ? 0.18 : 0;
      waveOctoChainV1(chain, time, {
        speed: waveSpeed,
        amp: waveAmp,
        phase: chain.id * 0.78,
        bias
      });
    }
  }

  if (orbPos) {
    aimOctoHeadAtOrbV1(rig, orbPos, 0.75, delta);
  }

  rig.skeleton.update();
}

/**
 * @param {OctoGlbRigV1} rig
 * @param {number} [strength]
 */
export function resetOctoGlbRigV1(rig, strength = 0.35) {
  if (!rig) return;
  const t = THREE.MathUtils.clamp(strength, 0, 1);
  for (const entry of rig.allBones) {
    entry.bone.quaternion.slerp(entry.originalQuaternion, t);
    entry.bone.position.lerp(entry.originalPosition, t);
  }
  if (rig.motion) {
    rig.motion.reachYaw = 0;
    rig.motion.reachPitch = 0;
    rig.motion.headYaw = 0;
    rig.motion.headPitch = 0;
  }
  rig.skeleton.update();
}
