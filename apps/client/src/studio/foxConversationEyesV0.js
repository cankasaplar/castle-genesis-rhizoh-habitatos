import * as THREE from "three";

/** Yuva spiral tabanı — octoYuvaNestV1 spiralFloor.position.y ile hizalı. */
export const FOX_EYE_SCHEMA_V0 = "castle.fox_conversation_eyes.v0";

const GAZE_BY_EMOTION = Object.freeze({
  idle: Object.freeze({ lidOpen: 1, pupilScale: 1, alert: 0.25 }),
  neutral: Object.freeze({ lidOpen: 1, pupilScale: 1, alert: 0.25 }),
  listening: Object.freeze({ lidOpen: 1.02, pupilScale: 1.12, alert: 0.7 }),
  thinking: Object.freeze({ lidOpen: 0.52, pupilScale: 0.82, alert: 0.35 }),
  speaking: Object.freeze({ lidOpen: 0.9, pupilScale: 1.05, alert: 0.55 }),
  curious: Object.freeze({ lidOpen: 0.95, pupilScale: 1.08, alert: 0.65 }),
  dormant: Object.freeze({ lidOpen: 0.06, pupilScale: 0.5, alert: 0 }),
  sleeping: Object.freeze({ lidOpen: 0.04, pupilScale: 0.45, alert: 0 })
});

function softenEyeSocketsV0(root) {
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (String(mat.name || "").toLowerCase() !== "eyes") continue;
      mat.color.setHex(0xb85c1a);
      mat.emissive?.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }
  });
}

function makeEyeV0(side) {
  const eyeGroup = new THREE.Group();
  eyeGroup.name = side < 0 ? "foxEyeL" : "foxEyeR";

  const sclera = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 14, 14),
    new THREE.MeshStandardMaterial({
      color: 0xf5efe4,
      roughness: 0.38,
      metalness: 0,
      emissive: 0x221100,
      emissiveIntensity: 0.04
    })
  );
  sclera.renderOrder = 12;

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.25, metalness: 0.05 })
  );
  pupil.position.z = 0.021;
  pupil.renderOrder = 13;

  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  highlight.position.set(0.004, 0.004, 0.026);
  highlight.renderOrder = 14;

  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.031, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({ color: 0xc45e1a, roughness: 0.58, metalness: 0, side: THREE.DoubleSide })
  );
  lid.rotation.x = Math.PI;
  lid.position.y = 0.016;
  lid.scale.y = 0.02;
  lid.renderOrder = 15;

  eyeGroup.add(sclera, pupil, highlight, lid);
  eyeGroup.position.set(side * 0.052, 0.055, 0.105);
  eyeGroup.rotation.y = side * 0.06;

  return { eyeGroup, pupil, highlight, lid, baseLidY: lid.position.y, baseLidScaleY: 0.02 };
}

/**
 * Procedural göz + gözkapağı — GLB'de Eyes materyali boş çukur; Head kemik üzerine eklenir.
 * @param {THREE.Object3D} root
 */
export function attachFoxConversationEyesV0(root) {
  const head = root.getObjectByName("Head");
  if (!head) return null;

  softenEyeSocketsV0(root);

  const rig = new THREE.Group();
  rig.name = "foxConversationEyes";
  const left = makeEyeV0(-1);
  const right = makeEyeV0(1);
  rig.add(left.eyeGroup, right.eyeGroup);
  head.add(rig);

  return {
    schema: FOX_EYE_SCHEMA_V0,
    rig,
    left,
    right,
    blink: { phase: 0, nextAt: 2.2 + Math.random() * 2.5, closing: false }
  };
}

/**
 * @param {ReturnType<typeof attachFoxConversationEyesV0>} eyes
 * @param {number} t
 * @param {number} delta
 * @param {{ emotion?: string, live?: boolean, activation?: number }} [drive]
 */
export function updateFoxConversationEyesV0(eyes, t, delta, drive = {}) {
  if (!eyes) return;

  const emotion = String(drive.emotion || "idle").toLowerCase();
  const gaze = GAZE_BY_EMOTION[emotion] || GAZE_BY_EMOTION.idle;
  const live = Boolean(drive.live);
  const act = Math.min(1, Math.max(0, Number(drive.activation) || 0.35));

  const blink = eyes.blink;
  blink.nextAt -= delta;
  if (blink.nextAt <= 0 && gaze.lidOpen > 0.3) {
    blink.closing = true;
    blink.phase = 0;
    blink.nextAt = 2.5 + Math.random() * 4.2;
  }

  let blinkMul = 1;
  if (blink.closing) {
    blink.phase += delta * 9;
    if (blink.phase < 1) blinkMul = 1 - Math.sin(blink.phase * Math.PI);
    else {
      blink.closing = false;
      blinkMul = 1;
    }
  }

  const lidOpen = gaze.lidOpen * blinkMul;
  const gp =
    drive.ghostPresentation && typeof drive.ghostPresentation === "object" ? drive.ghostPresentation : null;
  const gazeHold01 = Math.min(1, Math.max(0, Number(gp?.gazeHold01) || 0));
  const scanIntensity = Math.min(1, Math.max(0, Number(gp?.scanIntensity) || 0));
  const driftMul = (1 - gazeHold01 * 0.72) * (1 + scanIntensity * 0.55);
  const lookX = live ? Math.sin(t * 0.7) * 0.004 * (0.4 + act) * driftMul : Math.sin(t * 0.35) * 0.002 * driftMul;
  const lookY = live ? Math.cos(t * 0.55) * 0.003 * (0.3 + act * 0.5) * driftMul : 0;

  for (const side of [eyes.left, eyes.right]) {
    if (!side) continue;
    const sign = side === eyes.left ? -1 : 1;
    side.pupil.position.x = lookX * sign;
    side.pupil.position.y = lookY;
    side.highlight.position.x = 0.004 + lookX * sign * 0.5;
    side.highlight.position.y = 0.004 + lookY * 0.5;

    const pupilS = gaze.pupilScale * (0.92 + gaze.alert * 0.12);
    side.pupil.scale.setScalar(pupilS);

    const closed = 1 - Math.min(1, lidOpen);
    side.lid.scale.y = side.baseLidScaleY + closed * 2.8;
    side.lid.position.y = side.baseLidY + closed * 0.022;
    side.lid.visible = lidOpen < 0.98 || blinkMul < 0.95;
  }
}

/**
 * @param {ReturnType<typeof attachFoxConversationEyesV0>} eyes
 */
export function disposeFoxConversationEyesV0(eyes) {
  if (!eyes?.rig) return;
  eyes.rig.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m.dispose?.();
    }
  });
  eyes.rig.parent?.remove(eyes.rig);
}
