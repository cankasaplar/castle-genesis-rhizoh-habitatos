import * as THREE from "three";
import { OCTO_ORB_COLOR_V1 } from "./octoConversationMotionV1.js";

/** Enter sonrası uzanma + dokunma sekansı (sn). */
export const OCTO_GRAB_SEQUENCE_DURATION_V1 = 5.5;

/**
 * Geniş şeritte ekran kenarına yakın kavrama şeridi.
 * @param {number} aspectHint
 */
export function resolveOctoOrbLanesV1(aspectHint = 3.2) {
  const wide = aspectHint > 2.2;
  const spread = wide ? 0.62 + Math.min((aspectHint - 2.2) * 0.12, 0.22) : 0.46;
  return Object.freeze({ left: -spread, right: spread, center: 0 });
}

/**
 * Küçük 3D nesne — sabit sağ kenar; octo yüzer, tentacle uzanır.
 * @param {THREE.Scene} scene
 * @param {number} [aspectHint]
 */
export function createOctoConversationOrbV1(scene, aspectHint = 3.2) {
  const lanes = resolveOctoOrbLanesV1(aspectHint);
  const group = new THREE.Group();
  group.name = "octoConversationOrb";

  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.04, 1),
    new THREE.MeshStandardMaterial({
      color: OCTO_ORB_COLOR_V1,
      emissive: 0xff3366,
      emissiveIntensity: 0.62,
      metalness: 0.4,
      roughness: 0.28
    })
  );
  group.add(mesh);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.006, 8, 24),
    new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const light = new THREE.PointLight(0xff5588, 0.35, 2.2);
  group.add(light);

  scene.add(group);

  const rest = { x: lanes.right, y: 0.02, z: 0.14 };
  group.position.set(rest.x, rest.y, rest.z);

  return {
    group,
    mesh,
    ring,
    light,
    lanes,
    rest,
    state: {
      phase: "idle",
      touched: false,
      progress: 0,
      grabActive: false,
      grabT: 0,
      lastSubmitPulse: 0
    },
    setAspect(aspect) {
      const next = resolveOctoOrbLanesV1(aspect);
      this.lanes = next;
      this.rest.x = next.right;
      this.group.position.x = next.right;
    },
    dispose() {
      scene.remove(group);
      mesh.geometry.dispose();
      mesh.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
    }
  };
}

/**
 * @param {number} grabT
 * @returns {number} 0..1
 */
export function resolveOctoGrabProgressV1(grabT) {
  return THREE.MathUtils.clamp(grabT / OCTO_GRAB_SEQUENCE_DURATION_V1, 0, 1);
}

function holdOrbAtRest(orb, lanes, floatY, orbRestY, orbZ, smooth, delta, coastSwim) {
  orb.rest.x = lanes.right;
  orb.group.position.x += (lanes.right - orb.group.position.x) * smooth;
  orb.group.position.y += (orbRestY + floatY - orb.group.position.y) * smooth;
  orb.group.position.z += (orbZ - orb.group.position.z) * smooth;
  orb.mesh.rotation.y += delta * (coastSwim ? 0.65 : 0.95);
}

/**
 * @param {ReturnType<typeof createOctoConversationOrbV1>} orb
 * @param {ReturnType<typeof import("./octoConversationMotionV1.js").deriveOctoMotionDriveV1>} drive
 * @param {number} delta
 * @param {THREE.Vector3} octoPos
 * @param {number} time
 * @param {number} [aspectHint]
 * @param {number} [submitPulse]
 */
export function updateOctoConversationOrbV1(
  orb,
  drive,
  delta,
  octoPos,
  time,
  aspectHint = 3.2,
  submitPulse = 0
) {
  const lanes = resolveOctoOrbLanesV1(aspectHint);
  orb.lanes = lanes;
  const smooth = Math.min(1, delta * 5);
  const floatY = Math.sin(time * 2.1) * 0.01;
  const orbRestY = 0.02;
  const orbZ = 0.14;

  if (submitPulse > 0 && submitPulse !== orb.state.lastSubmitPulse) {
    orb.state.lastSubmitPulse = submitPulse;
    orb.state.grabActive = true;
    orb.state.grabT = 0;
    orb.state.touched = false;
  }

  const coastSwim = drive.live && !drive.draftOnly;
  const typingSwim = drive.live && Boolean(drive.draftOnly) && !orb.state.grabActive;
  const swimming = typingSwim || coastSwim || orb.state.touched;

  if (!drive.live) {
    orb.state.phase = "idle";
    orb.state.touched = false;
    orb.state.progress = 0;
    orb.state.grabActive = false;
    orb.state.grabT = 0;
    holdOrbAtRest(orb, lanes, floatY, orbRestY, orbZ, smooth, delta, false);
    orb.ring.material.opacity += (0.35 - orb.ring.material.opacity) * 0.08;
    return {
      lateralTargetX: null,
      grab: 0,
      reach: 0,
      touchAmount: 0,
      reachAmount: 0,
      headLeanX: 0,
      bodyRoll: 0,
      freeSwim: false,
      coastSwim: false,
      grabActive: false,
      orbPos: orb.group.position.clone(),
      orbColor: OCTO_ORB_COLOR_V1
    };
  }

  if (orb.state.grabActive) {
    orb.state.grabT += delta;
    if (orb.state.grabT >= OCTO_GRAB_SEQUENCE_DURATION_V1) {
      orb.state.grabActive = false;
      orb.state.grabT = 0;
      orb.state.phase = "coast";
      orb.state.touched = true;
    }
  }

  if (!orb.state.grabActive) {
    holdOrbAtRest(orb, lanes, floatY, orbRestY, orbZ, smooth, delta, coastSwim || orb.state.touched);
    orb.ring.material.opacity += ((orb.state.touched ? 0.75 : 0.45) - orb.ring.material.opacity) * 0.08;
    orb.light.intensity += ((orb.state.touched ? 0.65 : 0.35) - orb.light.intensity) * 0.08;
    orb.state.progress = orb.state.touched ? 1 : 0;
    orb.state.phase = typingSwim ? "swim" : coastSwim || orb.state.touched ? "coast" : "idle";

    return {
      phase: orb.state.phase,
      lateralTargetX: null,
      grab: orb.state.touched ? 1 : 0,
      reach: 0,
      touchAmount: orb.state.touched ? 1 : 0,
      reachAmount: 0,
      tentacleExtend: 0,
      touched: orb.state.touched,
      headLeanX: 0,
      bodyRoll: 0,
      bodyPitch: 0,
      allowBodySwim: swimming,
      freeSwim: typingSwim,
      coastSwim: coastSwim || orb.state.touched,
      grabActive: false,
      orbPos: orb.group.position.clone(),
      orbColor: OCTO_ORB_COLOR_V1
    };
  }

  const p = resolveOctoGrabProgressV1(orb.state.grabT);
  orb.state.progress = p;

  holdOrbAtRest(orb, lanes, floatY, orbRestY, orbZ, smooth, delta, true);

  let grab = 0;
  let reach = 0;
  let touchAmount = 0;
  let tentacleExtend = 0;
  let headLeanX = 0;
  let bodyRoll = 0;
  let bodyPitch = 0;
  let phase = "orient";

  if (p < 0.14) {
    phase = "orient";
    const t = p / 0.14;
    headLeanX = 0.75 * t;
    bodyRoll = -0.06 * t;
  } else if (p < 0.46) {
    phase = "extend";
    const t = (p - 0.14) / 0.32;
    headLeanX = 0.45;
    bodyRoll = -0.04;
    tentacleExtend = t;
    reach = t;
  } else if (p < 0.78) {
    phase = "touch";
    const t = (p - 0.46) / 0.32;
    tentacleExtend = 1;
    reach = 1;
    grab = t;
    touchAmount = t;
    headLeanX = 0.5;
    bodyRoll = -0.04;
    orb.state.touched = t > 0.45;
    orb.mesh.scale.setScalar(1 + t * 0.12);
    orb.ring.material.opacity = 0.45 + t * 0.4;
    orb.light.intensity = 0.35 + t * 0.45;
  } else {
    phase = "coast";
    tentacleExtend = 1;
    reach = 1;
    grab = 1;
    touchAmount = 1;
    headLeanX = 0.5;
    orb.state.touched = true;
    orb.mesh.scale.setScalar(1.12);
  }

  orb.state.phase = phase;
  orb.mesh.rotation.y += delta * (phase === "touch" ? 2.2 : 1.1);

  return {
    phase,
    lateralTargetX: null,
    grab,
    reach,
    touchAmount,
    reachAmount: reach,
    tentacleExtend,
    touched: orb.state.touched,
    headLeanX,
    bodyRoll,
    bodyPitch,
    allowBodySwim: true,
    freeSwim: false,
    coastSwim: true,
    grabActive: true,
    orbPos: orb.group.position.clone(),
    orbColor: OCTO_ORB_COLOR_V1
  };
}
