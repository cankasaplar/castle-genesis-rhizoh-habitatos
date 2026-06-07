import * as THREE from "three";
import { getCognitiveCubeFocusV1 } from "./octoCubeCentricCameraV1.js";

export const FOX_CUBE_SYNC_SMOOTH_V1 = 2.4;
export const FOX_POSITION_SMOOTH_V1 = 1.85;
export const FOX_YAW_SMOOTH_V1 = 1.35;
export const FOX_REACH_SMOOTH_V1 = 1.6;
export const FOX_MOTION_HOLD_SEC_V1 = 0.55;
export const FOX_LOCOMOTION_HOLD_SEC_V1 = 0.2;

const LOCOMOTION_MOTIONS = new Set(["walk", "trot"]);
const STATIONARY_MOTIONS = new Set(["idle", "listening", "thinking", "waiting"]);

const _cubeFocus = new THREE.Vector3();
const _cubeLive = new THREE.Vector3();

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function expSmooth(current, target, delta, rate) {
  const a = 1 - Math.exp(-Math.max(0, rate) * Math.max(delta, 1e-4));
  return current + (target - current) * Math.min(1, a);
}

/** @param {string} motionState */
export function isFoxLocomotionMotionStateV1(motionState) {
  return LOCOMOTION_MOTIONS.has(String(motionState || ""));
}

/**
 * @param {THREE.Object3D} body
 */
export function initFoxSpatialStateV1(body) {
  if (body.userData.foxSpatial) return body.userData.foxSpatial;
  const bx = body.userData.baseX ?? 0;
  const by = body.userData.baseY ?? 0;
  const bz = body.userData.baseZ ?? 0;
  body.userData.foxSpatial = {
    x: bx,
    y: by,
    z: bz,
    yaw: body.userData.baseYaw ?? 0.28,
    lastX: bx,
    lastZ: bz,
    smoothReach: 0.08,
    smoothSpeed: 0,
    followCubeX: bx + 0.28,
    followCubeZ: bz + 0.06,
    motionState: "idle",
    motionCandidate: "idle",
    motionHold: 0
  };
  return body.userData.foxSpatial;
}

/**
 * @param {ReturnType<typeof import("./octoSpeakingCrystalV1.js").createOctoSpeakingCrystalV1>} [crystal]
 */
export function readFoxCubeAnchorV1(crystal, carry = null) {
  if (crystal?.group) {
    _cubeLive.set(
      crystal.group.position.x,
      crystal.group.position.y,
      crystal.group.position.z
    );
    return _cubeLive;
  }
  if (carry?.orbPos && Number.isFinite(carry.orbPos.x)) {
    return carry.orbPos;
  }
  _cubeFocus.copy(getCognitiveCubeFocusV1(crystal));
  return _cubeFocus;
}

/**
 * Hedef konum — sadece yürü/koç sırasında kullanılır (drift yok).
 */
export function computeFoxCubeSpatialTargetsV1(drive, time, layout, carry = null, cubeAnchor = null) {
  const { baseX, baseY, baseZ } = layout;
  const bounds = layout.bounds ?? { x: 0.24, z: 0.2 };

  const rawReach =
    Number(carry?.ecologyReachBias) ||
    Number(drive?.reach) * 0.72 ||
    0.06;

  let rawX = baseX;
  let rawZ = baseZ;
  const rawY = baseY;

  const cubePos = cubeAnchor ?? carry?.orbPos ?? null;
  if (cubePos && Number.isFinite(cubePos.x)) {
    const pull = Math.max(0, rawReach);
    const push = Math.max(0, -rawReach);
    if (pull > 0) {
      rawX = THREE.MathUtils.lerp(baseX, cubePos.x + (baseX - cubePos.x) * 0.18, pull * 0.55);
      rawZ = THREE.MathUtils.lerp(baseZ, cubePos.z - 0.03, pull * 0.48);
    }
    if (push > 0) {
      rawX = THREE.MathUtils.lerp(baseX, baseX - (cubePos.x - baseX) * 0.24, push * 0.42);
      rawZ = THREE.MathUtils.lerp(baseZ, baseZ - (cubePos.z - baseZ) * 0.18, push * 0.36);
    }
    if (carry?.ecologyOrbit) {
      const orbitR = bounds.x * 0.48;
      const orbitT = time * 0.22;
      rawX = cubePos.x + Math.cos(orbitT) * orbitR - bounds.x * 0.28;
      rawZ = cubePos.z + Math.sin(orbitT) * orbitR * 0.4;
    }
  }

  const clamp = (base, val, bound) => base + THREE.MathUtils.clamp(val - base, -bound, bound);

  return {
    x: clamp(baseX, rawX, bounds.x),
    y: rawY,
    z: clamp(baseZ, rawZ, bounds.z),
    reachBias: rawReach,
    swimming: true,
    ampX: 0,
    ampZ: 0
  };
}

/** @param {string} motionState */
export function isFoxStationaryMotionStateV1(motionState) {
  return STATIONARY_MOTIONS.has(String(motionState || ""));
}

/**
 * @param {ReturnType<typeof initFoxSpatialStateV1>} spatial
 * @param {ReturnType<typeof import("./octoConversationMotionV1.js").deriveOctoMotionDriveV1>} drive
 * @param {{ reachBias?: number, forceMotion?: string }} rawSpatial
 * @param {number} delta
 */
export function stepFoxCompanionMotionGateV1(spatial, drive, rawSpatial, delta) {
  if (rawSpatial?.forceMotion) {
    spatial.motionState = rawSpatial.forceMotion;
    spatial.motionCandidate = rawSpatial.forceMotion;
    spatial.motionHold = FOX_MOTION_HOLD_SEC_V1;
    return rawSpatial.forceMotion;
  }

  const candidate = resolveFoxSpatialMotionStateV1(drive, rawSpatial);
  const holdSec =
    isFoxLocomotionMotionStateV1(candidate) || isFoxLocomotionMotionStateV1(spatial.motionState)
      ? FOX_LOCOMOTION_HOLD_SEC_V1
      : FOX_MOTION_HOLD_SEC_V1;

  if (candidate === spatial.motionState) {
    spatial.motionCandidate = candidate;
    spatial.motionHold = holdSec;
    return candidate;
  }
  if (candidate !== spatial.motionCandidate) {
    spatial.motionCandidate = candidate;
    spatial.motionHold = 0;
  }
  spatial.motionHold += delta;
  if (spatial.motionHold >= holdSec) {
    spatial.motionState = candidate;
  }
  return spatial.motionState;
}

/**
 * Bekle / dinle / düşün — tamamen sabit duruş (yerinde dönme yok).
 * @param {THREE.Object3D} body
 * @param {ReturnType<typeof initFoxSpatialStateV1>} spatial
 * @param {number} delta
 */
function holdFoxStationaryPoseV1(body, spatial, delta) {
  const baseX = body.userData.baseX ?? 0;
  const baseY = body.userData.baseY ?? 0;
  const baseZ = body.userData.baseZ ?? 0;
  const baseYaw = body.userData.baseYaw ?? 0.28;

  spatial.x = expSmooth(spatial.x, baseX, delta, 5.5);
  spatial.y = expSmooth(spatial.y, baseY, delta, 5.5);
  spatial.z = expSmooth(spatial.z, baseZ, delta, 5.5);
  spatial.smoothSpeed = expSmooth(spatial.smoothSpeed, 0, delta, 8);
  spatial.yaw = lerpAngle(
    spatial.yaw,
    baseYaw,
    1 - Math.exp(-4.2 * Math.max(delta, 1e-4))
  );
  spatial.lastX = spatial.x;
  spatial.lastZ = spatial.z;

  body.position.set(spatial.x, spatial.y, spatial.z);
  body.rotation.y = spatial.yaw;
  body.rotation.x = 0;
  body.rotation.z = 0;
}

/**
 * @param {THREE.Object3D} body
 * @param {number} delta
 */
export function holdFoxAtRestV1(body, delta = 1 / 60) {
  if (!body) return { velX: 0, velZ: 0, speed: 0, smoothSpeed: 0, reachBias: 0, motionState: "idle" };
  const spatial = initFoxSpatialStateV1(body);
  holdFoxStationaryPoseV1(body, spatial, delta);
  spatial.smoothReach = expSmooth(spatial.smoothReach, 0.06, delta, 2);
  spatial.motionState = "idle";
  spatial.motionCandidate = "idle";
  spatial.motionHold = FOX_MOTION_HOLD_SEC_V1;

  return { velX: 0, velZ: 0, speed: 0, smoothSpeed: 0, reachBias: spatial.smoothReach, motionState: "idle" };
}

/**
 * Fox — bekle/dinle/düşün sabit; walk/trot ile cube'a kay; settle/jump sabit kalır.
 * @param {{ motionOverride?: string | null }} [opts]
 */
export function animateFoxCompanionSpatialV1(body, time, drive, delta, carry = null, crystal = null, opts = {}) {
  if (!body) return { velX: 0, velZ: 0, speed: 0, smoothSpeed: 0, reachBias: 0, motionState: "idle" };

  const forceMotion = opts.motionOverride ? String(opts.motionOverride).trim() : "";
  const overrideLocomotion = isFoxLocomotionMotionStateV1(forceMotion);
  const effectiveDrive =
    overrideLocomotion && drive
      ? {
          ...drive,
          live: true,
          reach: forceMotion === "trot" ? 0.72 : 0.55
        }
      : drive;

  if (
    effectiveDrive?.live === false &&
    !carry?.sessionSwim &&
    !carry?.allowBodySwim &&
    !overrideLocomotion
  ) {
    return holdFoxAtRestV1(body, delta);
  }

  const cubeAnchor = readFoxCubeAnchorV1(crystal, carry);
  const baseX = body.userData.baseX ?? 0;
  const baseY = body.userData.baseY ?? 0;
  const baseZ = body.userData.baseZ ?? 0;
  const baseYaw = body.userData.baseYaw ?? 0.28;
  const spatial = initFoxSpatialStateV1(body);

  spatial.followCubeX = expSmooth(spatial.followCubeX, cubeAnchor.x, delta, FOX_CUBE_SYNC_SMOOTH_V1);
  spatial.followCubeZ = expSmooth(spatial.followCubeZ, cubeAnchor.z, delta, FOX_CUBE_SYNC_SMOOTH_V1);
  const followCube = _cubeLive.set(spatial.followCubeX, cubeAnchor.y, spatial.followCubeZ);

  const targets = computeFoxCubeSpatialTargetsV1(
    effectiveDrive,
    time,
    {
      baseX,
      baseY,
      baseZ,
      bounds: body.userData.spatialBounds ?? { x: 0.26, z: 0.22 }
    },
    carry,
    followCube
  );

  spatial.smoothReach = expSmooth(spatial.smoothReach, targets.reachBias, delta, FOX_REACH_SMOOTH_V1);

  const rawSpatial = {
    reachBias: spatial.smoothReach,
    ...(forceMotion ? { forceMotion } : {})
  };
  const motionState = stepFoxCompanionMotionGateV1(spatial, effectiveDrive, rawSpatial, delta);
  const locomoting = isFoxLocomotionMotionStateV1(motionState);

  if (!locomoting) {
    holdFoxStationaryPoseV1(body, spatial, delta);
    return {
      velX: 0,
      velZ: 0,
      speed: 0,
      smoothSpeed: 0,
      reachBias: spatial.smoothReach,
      swimming: false,
      motionState
    };
  }

  spatial.x = expSmooth(spatial.x, targets.x, delta, FOX_POSITION_SMOOTH_V1);
  spatial.y = expSmooth(spatial.y, targets.y, delta, FOX_POSITION_SMOOTH_V1);
  spatial.z = expSmooth(spatial.z, targets.z, delta, FOX_POSITION_SMOOTH_V1);

  const velX = (spatial.x - spatial.lastX) / Math.max(delta, 1e-4);
  const velZ = (spatial.z - spatial.lastZ) / Math.max(delta, 1e-4);
  spatial.lastX = spatial.x;
  spatial.lastZ = spatial.z;
  const speed = Math.hypot(velX, velZ);
  spatial.smoothSpeed = expSmooth(spatial.smoothSpeed, speed, delta, 2.2);

  if (spatial.smoothSpeed > 0.008) {
    const targetYaw = Math.atan2(velX, Math.max(velZ, 0.08));
    const yawBlend = 1 - Math.exp(-FOX_YAW_SMOOTH_V1 * Math.max(delta, 1e-4));
    spatial.yaw = lerpAngle(spatial.yaw, targetYaw, Math.min(1, yawBlend));
  } else {
    spatial.yaw = lerpAngle(
      spatial.yaw,
      baseYaw,
      1 - Math.exp(-3.5 * Math.max(delta, 1e-4))
    );
  }

  body.position.set(spatial.x, spatial.y, spatial.z);
  body.rotation.y = spatial.yaw;
  body.rotation.x = 0;
  body.rotation.z = 0;

  return {
    velX,
    velZ,
    speed,
    smoothSpeed: spatial.smoothSpeed,
    reachBias: spatial.smoothReach,
    swimming: true,
    motionState
  };
}

/**
 * Bekle / dinle / düşün = sabit aile; yürü / koş = cube yaklaşma; jump ayrı (settle).
 */
export function resolveFoxSpatialMotionStateV1(drive, spatial = null) {
  const emotion = String(drive?.emotion || "neutral");
  const activation = Number(drive?.activation) || 0;
  const reach = Number(spatial?.reachBias) || 0;
  const draftOnly = Boolean(drive?.draftOnly);
  const hasDraft = Boolean(String(drive?.draftText || "").trim());

  if (draftOnly || hasDraft) {
    if (reach > 0.22 || hasDraft) {
      return activation > 0.58 || Boolean(drive?.busy) ? "trot" : "walk";
    }
  }

  if (emotion !== "listening" && emotion !== "thinking") {
    if (reach > 0.36 && activation > 0.44) {
      return activation > 0.64 ? "trot" : "walk";
    }
  }

  if (emotion === "thinking") return "thinking";
  if (emotion === "listening") return "listening";
  if (reach < -0.08) return "waiting";
  if (emotion === "curious") return "waiting";
  return "idle";
}
