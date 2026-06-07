/**
 * Octo motion / color / tentacle — ported from Desktop "Yeni klasör (4)":
 * emotionController.js, tentacleController.js, motionPatterns.js, octo-renderer.js, octo3d-scene.js
 */

import * as THREE from "three";

/** @see emotionController.js */
export const OCTO_EMOTION_MAP_V1 = Object.freeze({
  neutral: Object.freeze({ color: 0x16213e, accent: 0x00e5ff, frequency: 1.0, amplitude: 0.12 }),
  happy: Object.freeze({ color: 0xff8c00, accent: 0x00ffcc, frequency: 1.5, amplitude: 0.22 }),
  sad: Object.freeze({ color: 0x1a4a7a, accent: 0x4da6ff, frequency: 0.7, amplitude: 0.1 }),
  angry: Object.freeze({ color: 0xff3300, accent: 0xff4444, frequency: 2.0, amplitude: 0.28 }),
  curious: Object.freeze({ color: 0x1a5c3a, accent: 0x44ff88, frequency: 1.2, amplitude: 0.18 }),
  excited: Object.freeze({ color: 0xff6600, accent: 0x00f0ff, frequency: 2.2, amplitude: 0.3 }),
  tired: Object.freeze({ color: 0x3a3a55, accent: 0xaaaacc, frequency: 0.5, amplitude: 0.06 }),
  focused: Object.freeze({ color: 0x1a1a5c, accent: 0x7788ff, frequency: 1.0, amplitude: 0.14 }),
  shy: Object.freeze({ color: 0x4a2a40, accent: 0xff99bb, frequency: 0.8, amplitude: 0.1 }),
  playful: Object.freeze({ color: 0x0a5a5a, accent: 0x00ffaa, frequency: 1.7, amplitude: 0.2 }),
  speaking: Object.freeze({ color: 0x0a4a62, accent: 0x33eeff, frequency: 1.8, amplitude: 0.26 }),
  listening: Object.freeze({ color: 0x103050, accent: 0x55ccff, frequency: 1.1, amplitude: 0.15 }),
  thinking: Object.freeze({ color: 0x2a1860, accent: 0xbb88ff, frequency: 0.85, amplitude: 0.14 })
});

const TENTACLE_NAME_RE =
  /tent|tentacle|arm|leg|sucker|hair|fin|append|digit|tentáculo|kol|bacak/i;

/** Head / mantle — never treat as tentacles (keeps face visible, no limb warping). */
const OCTO_BODY_HEAD_RE =
  /head|body|mantle|bell|torso|abdomen|sac|brain|beak|eye|mouth|pupil|lid|cornea|ringed/i;

const EMOTION_CLIP_HINTS_V1 = Object.freeze({
  happy: ["BODY_RIG", "KeyAction", "happy"],
  excited: ["KeyAction", "BODY_RIG"],
  speaking: ["KeyAction", "BODY_RIG", "speak"],
  listening: ["PoseLib", "idle"],
  thinking: ["Empty", "thought", "PoseLib"],
  focused: ["PoseLib", "Empty"],
  curious: ["PoseLib", "KeyAction"],
  neutral: ["BODY_RIG", "idle", "PoseLib"]
});

/**
 * @param {string} fieldState
 * @returns {keyof typeof OCTO_EMOTION_MAP_V1}
 */
export function mapFieldStateToOctoEmotionV1(fieldState) {
  const s = String(fieldState || "idle").toLowerCase();
  if (s === "speaking" || s === "executing") return "speaking";
  if (s === "listening") return "listening";
  if (s === "thinking" || s === "generating" || s === "interpreting") return "thinking";
  if (s === "idle" || s === "degraded") return "neutral";
  return "neutral";
}

/**
 * @param {keyof typeof OCTO_EMOTION_MAP_V1} emotion
 */
export function getOctoEmotionParamsV1(emotion) {
  return OCTO_EMOTION_MAP_V1[emotion] || OCTO_EMOTION_MAP_V1.neutral;
}

/**
 * Konuşma canlı mı — kullanıcı yazarken, yanıt varken veya dinlerken.
 * @param {{ fieldState?: string, replyText?: string, draftText?: string, busy?: boolean }} input
 */
export function isOctoConversationLiveV1(input = {}) {
  if (Boolean(input.busy)) return true;
  const fs = String(input.fieldState || "idle").toLowerCase();
  if (
    fs === "speaking" ||
    fs === "executing" ||
    fs === "generating" ||
    fs === "interpreting" ||
    fs === "thinking"
  ) {
    return true;
  }
  if (String(input.replyText || "").trim()) return true;
  if (String(input.draftText || "").trim()) return true;
  return false;
}

/**
 * Yuva + reply + fieldState → motion drive (main.js activation + tentacleController extend/coil).
 * @param {{ fieldState?: string, replyText?: string, draftText?: string, busy?: boolean }} input
 */
export function deriveOctoMotionDriveV1(input = {}) {
  const live = isOctoConversationLiveV1(input);
  const emotion = mapFieldStateToOctoEmotionV1(input.fieldState);
  const text = String(input.replyText || input.draftText || "").trim();
  const textLen = text.length;
  const words = textLen ? text.split(/\s+/).filter(Boolean).length : 0;
  const busy = Boolean(input.busy);

  let activation = 0.32;
  if (busy) activation = 0.58;
  if (textLen > 0) activation = Math.min(1, 0.48 + textLen / 320);
  if (emotion === "speaking") activation = Math.min(1, activation + 0.28);
  if (emotion === "thinking") activation = Math.min(1, activation + 0.18);
  if (emotion === "listening") activation = Math.max(0.38, activation * 0.85);

  const draftOnly = Boolean(String(input.draftText || "").trim()) && !String(input.replyText || "").trim();

  let reach = 0.35;
  if (draftOnly) reach = 0.05;
  else if (emotion === "speaking" || textLen > 60) reach = 0.82;
  else if (emotion === "curious" || textLen > 20) reach = 0.55;
  else if (emotion === "listening") reach = 0.22;

  let coil = 0.12;
  if (draftOnly) coil = 0.14;
  else if (emotion === "thinking" || emotion === "listening") coil = 0.62;
  if (busy && !textLen) coil = 0.45;

  let speed = 0.85 + words / 14 + textLen / 200;
  let swimMode = "idle";
  if (draftOnly) {
    swimMode = "typing";
    speed = Math.min(2.2, 0.95 + textLen / 110 + words / 22);
  } else if (live) {
    swimMode = "coast";
    speed = Math.min(1.25, 0.62 + textLen / 420);
    activation = Math.min(0.55, 0.34 + textLen / 600);
    if (emotion !== "thinking" && emotion !== "listening") {
      coil = 0.2;
      reach = 0.06;
    }
  }
  if (emotion === "speaking" && !draftOnly) speed = Math.min(1.45, speed + 0.22);
  if (emotion === "thinking") speed *= 0.78;
  if (emotion === "listening") speed *= 0.62;
  speed = Math.min(3.4, Math.max(0.55, speed));

  const { accent, color } = getOctoEmotionParamsV1(emotion);
  if (!live) {
    return {
      emotion: "neutral",
      activation: 0.08,
      reach: 0,
      coil: 0,
      speed: 0,
      textLen: 0,
      words: 0,
      accent,
      color,
      draftOnly: false,
      swimMode: "idle",
      live: false
    };
  }
  return {
    emotion,
    activation,
    reach,
    coil,
    speed,
    textLen,
    words,
    accent,
    color,
    draftOnly,
    swimMode,
    live: true
  };
}

/**
 * @param {THREE.Object3D} model
 */
/** Hedef görünür boyut — kompakt chat şeridi (yuva altında kalsın). */
export const OCTO_CONVERSATION_TARGET_SIZE_V1 = 0.42;

/** Yuva tabanı — octo ayaklarının altında (createOctoYuvaNestV1 ile uyumlu). */
export const OCTO_YUVA_FLOOR_Y_V1 = -0.2;

/**
 * @param {THREE.Object3D} model
 * @param {{ targetSize?: number }} [opts]
 */
export function fitOctoConversationModelV1(model, opts = {}) {
  const targetSize = opts.targetSize ?? OCTO_CONVERSATION_TARGET_SIZE_V1;
  // Bbox her zaman scale=1 iken ölçülür (0.001 preload scale fit'i bozuyordu).
  model.scale.setScalar(1);
  model.position.set(0, 0, 0);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const s = targetSize / maxDim;
  model.scale.setScalar(s);
  const homeX = -0.16;
  model.position.set(-center.x * s + homeX, -center.y * s + targetSize * 0.12, -center.z * s);
  model.userData.homeX = homeX;
  model.userData.baseY = model.position.y;
  model.userData.baseX = model.position.x;
  model.userData.baseZ = model.position.z;
  model.userData.fitScale = s;
  model.userData.fitHeight = size.y * s;
  model.userData.fitRadius = Math.max(size.y * 0.55 * s, size.length() * 0.5 * s, 0.24);
  model.userData.fitMaxDim = maxDim;
  model.userData.swimBounds = {
    x: Math.max(size.x * s * 1.05, 0.32),
    y: Math.max(size.y * s * 0.07, 0.014),
    z: Math.max(size.z * s * 0.32, 0.06)
  };

  const bodyRig = model.getObjectByName("BODY_RIG");
  if (bodyRig) {
    bodyRig.rotation.set(-0.22, 0.78, 0.04);
    model.userData.bodyRig = bodyRig;
    model.userData.baseBodyYaw = 0.78;
  }
}

function lerpAngleV1(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/**
 * @param {THREE.Object3D} body
 */
export function initOctoSwimStateV1(body) {
  if (body.userData.swim) return body.userData.swim;
  const bx = body.userData.baseX ?? 0;
  const by = body.userData.baseY ?? 0;
  const bz = body.userData.baseZ ?? 0;
  body.userData.swim = {
    x: bx,
    y: by,
    z: bz,
    scale: body.userData.fitScale ?? 1,
    yaw: 0,
    pitch: 0,
    lastX: bx,
    lastY: by,
    lastZ: bz
  };
  return body.userData.swim;
}

/**
 * Yazı/konuşma sırasında hedef yüzme konumu — X/Y/Z serbest, şerit içi.
 * @param {ReturnType<typeof deriveOctoMotionDriveV1>} drive
 * @param {number} time
 * @param {{ baseX: number, baseY: number, baseZ: number, swimBounds?: { x: number, y: number, z: number } }} layout
 */
export function computeOctoSwimTargetsV1(drive, time, layout, carry = null) {
  const { baseX, baseY, baseZ } = layout;
  const bounds = layout.swimBounds ?? { x: 0.1, y: 0.05, z: 0.08 };
  const coastSwim =
    carry?.coastSwim === true ||
    carry?.touched === true ||
    carry?.sessionSwim === true ||
    drive.swimMode === "coast" ||
    Boolean(carry?.touchAmount);
  const typingSwim = carry?.freeSwim === true || drive.swimMode === "typing";
  const sessionSwim = carry?.sessionSwim === true || carry?.allowBodySwim === true;
  const swimming =
    sessionSwim ||
    (drive.live !== false &&
      (typingSwim || coastSwim || carry?.allowBodySwim === true || drive.swimMode !== "idle"));
  const phaseSign = carry?.octoSwimPhaseSign ?? 1;
  const ecologyMul = carry?.ecologySwimSpeedMul ?? 1;
  const speedMul = (carry?.octoSwimSpeedMul ?? 1) * ecologyMul * (sessionSwim && !typingSwim ? 1.18 : 1);
  const spdMul = (coastSwim ? 0.68 : typingSwim ? 0.82 : 0.72) * speedMul;
  const spd = Math.max(0.72, drive.speed || 0.72) * spdMul;
  const t = time * spd * phaseSign;
  const wordPhase = drive.words * 0.9 + drive.textLen * 0.018;
  const energy = sessionSwim
    ? Math.max(0.56, coastSwim ? 0.44 + drive.activation * 0.48 : 0.5 + drive.activation * 0.55)
    : coastSwim
      ? 0.36 + drive.activation * 0.42
      : 0.42 + drive.activation * 0.58;

  const xFactor = swimming ? (coastSwim ? 1.22 : 1.48) : 1;
  const zFactor = swimming ? (coastSwim ? 1.05 : 1.18) : 0.9;
  const yFactor = swimming ? (coastSwim ? 0.05 : 0.08) : 0.35;

  const ampX = bounds.x * energy * xFactor * (0.9 + Math.sin(wordPhase * 0.55) * 0.18);
  const ampZ = bounds.z * energy * zFactor * (0.84 + Math.cos(wordPhase * 0.45) * 0.12);
  const ampY = bounds.y * energy * yFactor * (0.4 + Math.sin(wordPhase * 0.3) * 0.15);

  let rawX =
    baseX +
    Math.sin(t * 0.48 + wordPhase) * ampX +
    Math.cos(t * 0.29 + wordPhase * 0.5) * ampX * 0.46;
  let rawZ =
    baseZ +
    Math.sin(t * 0.38 + 1.05) * ampZ +
    Math.sin(t * 0.62 + wordPhase * 0.38) * ampZ * 0.5;
  let rawY = baseY + Math.sin(t * 0.52 + 0.2) * ampY * 0.65;

  if (swimming) {
    const jetPhase = t * (coastSwim ? 0.95 : 1.45);
    const jet = Math.pow(Math.max(0, Math.sin(jetPhase)), coastSwim ? 1.6 : 2);
    const jetDir = Math.sign(Math.cos(jetPhase * 0.82 + wordPhase * 0.25)) || 1;
    rawX += jet * ampX * (coastSwim ? 0.32 : 0.44) * jetDir;
    rawZ += Math.sin(jetPhase * 0.78 + 0.5) * ampZ * (coastSwim ? 0.28 : 0.34);
  }

  const reachBias = carry?.ecologyReachBias;
  if (carry?.orbPos && Number.isFinite(reachBias) && reachBias !== 0) {
    const orb = carry.orbPos;
    const pull = Math.max(0, reachBias);
    const push = Math.max(0, -reachBias);
    if (pull > 0) {
      rawX = THREE.MathUtils.lerp(rawX, orb.x + (baseX - orb.x) * 0.22, pull * 0.42);
      rawZ = THREE.MathUtils.lerp(rawZ, orb.z - 0.06, pull * 0.36);
    }
    if (push > 0) {
      rawX = THREE.MathUtils.lerp(rawX, baseX - (orb.x - baseX) * 0.35, push * 0.34);
      rawZ = THREE.MathUtils.lerp(rawZ, baseZ - (orb.z - baseZ) * 0.28, push * 0.3);
    }
  }

  if (carry?.ecologyOrbit && carry?.orbPos) {
    const orbitR = bounds.x * 0.72;
    rawX = carry.orbPos.x + Math.cos(t * 0.55) * orbitR;
    rawZ = carry.orbPos.z + Math.sin(t * 0.55) * orbitR * 0.68;
    rawY = baseY + Math.sin(t * 0.42) * bounds.y * 0.35;
  }

  const clamp = (base, val, bound) => base + THREE.MathUtils.clamp(val - base, -bound, bound);

  return {
    x: clamp(baseX, rawX, bounds.x),
    y: clamp(baseY, rawY, bounds.y * (swimming ? 0.42 : 0.75)),
    z: clamp(baseZ, rawZ, bounds.z),
    ampX,
    ampZ,
    ampY,
    freeSwim: swimming,
    coastSwim
  };
}

/**
 * Varsayılan duruş — yazı yokken sabit boyut/konum.
 * @param {THREE.Object3D} body
 * @param {number} [delta]
 */
export function holdOctoAtRestV1(body, delta = 1 / 60) {
  if (!body) return { velX: 0, velZ: 0, speed: 0 };
  const fitScale = body.userData.fitScale ?? 1;
  const baseX = body.userData.baseX ?? 0;
  const baseY = body.userData.baseY ?? 0;
  const baseZ = body.userData.baseZ ?? 0;
  const swim = initOctoSwimStateV1(body);
  const smooth = Math.min(1, delta * 5);

  swim.x += (baseX - swim.x) * smooth;
  swim.y += (baseY - swim.y) * smooth;
  swim.z += (baseZ - swim.z) * smooth;
  swim.scale += (fitScale - swim.scale) * smooth;
  swim.yaw *= 1 - smooth * 0.85;
  swim.pitch *= 1 - smooth * 0.85;
  swim.lastX = swim.x;
  swim.lastZ = swim.z;

  body.position.set(swim.x, swim.y, swim.z);
  body.scale.setScalar(swim.scale);
  body.rotation.x = swim.pitch;
  body.rotation.y = swim.yaw;
  body.userData.depthPhase = 0.5;

  return { velX: 0, velZ: 0, speed: 0 };
}

/**
 * Yumuşak yüzme — konum/ölçek lerp; kafa hareket yönüne döner (ışınlanma yok).
 * @param {THREE.Object3D} body
 * @param {number} time
 * @param {ReturnType<typeof deriveOctoMotionDriveV1> | string} driveOrEmotion
 * @param {number} [delta]
 * @returns {{ velX: number, velZ: number, speed: number } | null}
 */
export function animateOctoBodyV1(body, time, driveOrEmotion, delta = 1 / 60, carry = null) {
  if (!body) return null;
  const drive =
    typeof driveOrEmotion === "string"
      ? deriveOctoMotionDriveV1({ fieldState: driveOrEmotion })
      : driveOrEmotion;

  if (drive.live === false && !carry?.allowBodySwim && !carry?.sessionSwim) {
    return holdOctoAtRestV1(body, delta);
  }

  const activeDrive =
    drive.live === false && (carry?.sessionSwim || carry?.allowBodySwim)
      ? {
          ...drive,
          live: true,
          swimMode: carry?.freeSwim ? "typing" : "coast",
          speed: Math.max(0.95, drive.speed || 0.95),
          activation: Math.max(0.42, drive.activation || 0.42),
          textLen: Math.max(drive.textLen || 0, 28),
          words: Math.max(drive.words || 0, 4)
        }
      : drive;

  const fitScale = body.userData.fitScale ?? 1;
  const baseX = body.userData.baseX ?? 0;
  const baseY = body.userData.baseY ?? 0;
  const baseZ = body.userData.baseZ ?? 0;
  const swim = initOctoSwimStateV1(body);
  const targets = computeOctoSwimTargetsV1(
    activeDrive,
    time,
    {
      baseX,
      baseY,
      baseZ,
      swimBounds: body.userData.swimBounds
    },
    carry
  );

  const coast = targets.coastSwim === true;
  const xSmooth = Math.min(1, delta * (coast ? 2.4 : 3.2 + drive.activation * 1.4));
  const smooth = Math.min(1, delta * (coast ? 2.1 : 3.2 + drive.activation * 1.2));
  swim.x += (targets.x - swim.x) * xSmooth;
  swim.z += (targets.z - swim.z) * smooth;
  swim.y += (targets.y - swim.y) * smooth;

  const velX = (swim.x - swim.lastX) / Math.max(delta, 1e-4);
  const velY = (swim.y - swim.lastY) / Math.max(delta, 1e-4);
  const velZ = (swim.z - swim.lastZ) / Math.max(delta, 1e-4);
  swim.lastX = swim.x;
  swim.lastY = swim.y;
  swim.lastZ = swim.z;
  const speed = Math.hypot(velX, velZ, velY * 0.6);

  const leanYaw = carry?.headLeanX ?? 0;
  const leanPitch = carry?.bodyPitch ?? 0;
  const horizontalSwim = targets.freeSwim === true;
  const baseYaw = body.userData.baseBodyYaw ?? 0.55;
  const headSign = carry?.octoHeadSign ?? 1;
  const orbYaw =
    carry?.orbPos != null
      ? Math.atan2(carry.orbPos.x - swim.x, Math.max(carry.orbPos.z - swim.z + 0.12, 0.08)) +
        headSign * 0.72
      : baseYaw + headSign * 0.18;
  if (speed > 0.004 || Math.abs(leanYaw) > 0.02 || Math.abs(leanPitch) > 0.01 || carry?.orbPos) {
    const targetYaw =
      Math.abs(leanYaw) > 0.02 ? baseYaw + leanYaw * 0.35 : horizontalSwim ? orbYaw : Math.atan2(velX, Math.max(velZ, 0.08));
    swim.yaw = lerpAngleV1(swim.yaw, targetYaw, Math.min(1, delta * (leanYaw ? 5 : coast ? 3.8 : 4.2)));
    const swimPitch = horizontalSwim
      ? THREE.MathUtils.clamp(-velZ * 0.14, -0.04, 0.04)
      : THREE.MathUtils.clamp(-velZ * 0.3 + velY * 0.12, -0.12, 0.1);
    const targetPitch = Math.abs(leanPitch) > 0.01 ? leanPitch * 0.55 : swimPitch;
    swim.pitch = lerpAngleV1(swim.pitch, targetPitch, Math.min(1, delta * (leanPitch ? 5 : coast ? 2.5 : 3.5)));
  }

  const depthNorm = THREE.MathUtils.clamp((swim.z - baseZ + targets.ampZ) / (targets.ampZ * 2 + 1e-4), 0, 1);
  const targetScale = fitScale * THREE.MathUtils.lerp(0.94, 1.04, depthNorm);
  swim.scale += (targetScale - swim.scale) * Math.min(1, delta * 2.2);

  body.position.set(swim.x, swim.y, swim.z);
  body.scale.setScalar(swim.scale);
  body.rotation.y = swim.yaw;
  body.rotation.x = swim.pitch;
  const rollTarget = carry?.bodyRoll ?? 0;
  body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, rollTarget, Math.min(1, delta * 5.5));
  body.userData.depthPhase = depthNorm;

  return { velX, velY, velZ, speed };
}

/**
 * Boost emissive visibility; tame albedo wash from bright GLB maps.
 * @param {THREE.Object3D} root
 */
export function prepareOctoConversationMaterialsV1(root) {
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (mat.color) mat.color.multiplyScalar(0.72);
      if (mat.emissive) {
        mat.emissive.setHex(0x003344);
        mat.emissiveIntensity = 0.22;
      }
      mat.metalness = Math.min(mat.metalness ?? 0.3, 0.2);
      mat.roughness = Math.max(mat.roughness ?? 0.5, 0.55);
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    }
  });
}

/**
 * @param {THREE.Object3D} root
 * @returns {THREE.Vector3}
 */
export function getOctoHeadFocusV1(root) {
  let headMesh = null;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const n = String(obj.name || "").toLowerCase();
    if (/head|mantle|eye|beak|brain/i.test(n) && !/tent|arm|leg/i.test(n)) headMesh = obj;
  });
  const focus = new THREE.Vector3();
  if (headMesh) {
    headMesh.getWorldPosition(focus);
    return focus;
  }
  const box = new THREE.Box3().setFromObject(root);
  const sz = new THREE.Vector3();
  box.getCenter(focus);
  box.getSize(sz);
  focus.y += sz.y * 0.22;
  return focus;
}

/**
 * Sabit kadraj — octo bbox merkezine bak; mesafe üst+kafa ile yuva tabanını sığdırır.
 * @param {THREE.Object3D} root
 * @param {number} aspectHint
 */
export function resolveOctoRestShotV1(root, aspectHint = 3.2) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const viewTop = center.y + size.y * 0.55 + 0.06;
  const viewBottom = OCTO_YUVA_FLOOR_Y_V1 - 0.12;
  const viewH = Math.max(viewTop - viewBottom, 0.35);

  const wide = aspectHint > 2.2;
  const fov = wide ? 50 : 48;
  const vFovRad = (fov * Math.PI) / 180;
  const dist = Math.max(((viewH * 0.52) / Math.tan(vFovRad / 2)) * 1.22, 1.05);

  const look = new THREE.Vector3(center.x, center.y + size.y * 0.06, center.z);
  const pos = new THREE.Vector3(look.x, look.y, look.z + dist);

  return { pos, look, fov, radius: root.userData.fitRadius ?? size.y * 0.5 };
}

/** @deprecated use resolveOctoRestShotV1 */
export function getOctoStageFocusV1(root) {
  return resolveOctoRestShotV1(root, 3.2).look;
}

/** Kompakt şerit — octo + yuva tek kadrajda. */
export function aimOctoConversationCameraV1(root, camera, aspectHint = 3.2) {
  const shot = resolveOctoRestShotV1(root, aspectHint);
  camera.fov = shot.fov;
  camera.position.copy(shot.pos);
  camera.lookAt(shot.look);
  camera.near = Math.max(0.02, shot.radius * 0.04);
  camera.far = Math.max(shot.radius * 14, 40);
  camera.updateProjectionMatrix();
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
 * Konuşma yokken varsayılan kadraja dön.
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta
 */
export function holdOctoDefaultCameraV1(root, camera, delta) {
  if (!camera.userData.rest) {
    aimOctoConversationCameraV1(root, camera, camera.aspect);
  }
  const rest = camera.userData.rest;
  if (!rest) return;
  const ac = camera.userData.action;
  if (!ac) return;
  const smooth = Math.min(1, delta * 4.5);
  ac.pos.lerp(rest.pos, smooth);
  ac.look.lerp(rest.look, smooth);
  ac.fov += (rest.fov - ac.fov) * smooth;
  camera.position.copy(ac.pos);
  camera.lookAt(ac.look);
  camera.fov = ac.fov;
  camera.updateProjectionMatrix();
}

/**
 * Action cam — Octo'yu takip, hafif sallanma, hıza göre FOV.
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta
 * @param {ReturnType<typeof deriveOctoMotionDriveV1>} drive
 * @param {{ velX?: number, velZ?: number, speed?: number }} [swimVel]
 */
export function updateOctoActionCameraV1(root, camera, delta, drive, swimVel = {}) {
  if (drive.live === false) {
    holdOctoDefaultCameraV1(root, camera, delta);
    return;
  }
  const head = getOctoHeadFocusV1(root);
  if (!camera.userData.action) {
    aimOctoConversationCameraV1(root, camera, camera.aspect);
  }
  const ac = camera.userData.action;
  const velX = swimVel.velX ?? 0;
  const velY = swimVel.velY ?? 0;
  const velZ = swimVel.velZ ?? 0;
  const speed = swimVel.speed ?? 0;
  const radius = root.userData.fitRadius ?? 0.42;
  const dist = radius * (1.88 - drive.activation * 0.05) - Math.min(speed * 0.035, 0.04);
  const wobble = 0.008 + drive.speed * 0.005;
  const now = performance.now() * 0.001;

  const lead = new THREE.Vector3(velX * 0.16, velY * 0.22, velZ * 0.16);
  const targetLook = head.clone().add(lead);
  const desiredPos = new THREE.Vector3(
    head.x - velX * 0.12 + Math.sin(now * 2.2) * wobble,
    head.y + 0.1 + velY * 0.08 + Math.sin(now * 1.6) * wobble * 0.5,
    head.z + dist + Math.cos(now * 1.9) * wobble
  );

  const a = Math.min(1, delta * 5.5);
  ac.pos.lerp(desiredPos, a);
  ac.look.lerp(targetLook, a * 1.15);
  const targetFov = 38 + drive.reach * 3 + Math.min(speed * 5, 2.5) + drive.activation * 1.5;
  ac.fov += (targetFov - ac.fov) * Math.min(1, delta * 3.5);

  camera.position.copy(ac.pos);
  camera.lookAt(ac.look);
  camera.fov = ac.fov;
  camera.updateProjectionMatrix();
}

/**
 * @param {THREE.PerspectiveCamera} camera
 * @param {ReturnType<typeof deriveOctoMotionDriveV1>} drive
 * @param {number} delta
 */
export function stepOctoCameraLiveBlendV1(camera, drive, delta) {
  if (camera.userData.camBlend == null) camera.userData.camBlend = 0;
  const target = drive.live ? 0.14 : 0;
  const rate = target > camera.userData.camBlend ? 1.8 : 5;
  camera.userData.camBlend += (target - camera.userData.camBlend) * Math.min(1, delta * rate);
  return camera.userData.camBlend;
}

/**
 * Sabit kadraj ↔ action cam — yazı yazılırken yumuşak geçiş.
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta
 * @param {ReturnType<typeof deriveOctoMotionDriveV1>} drive
 * @param {{ velX?: number, velY?: number, velZ?: number, speed?: number }} [swimVel]
 */
export function updateOctoConversationCameraV1(root, camera, delta, drive, swimVel = {}) {
  const blend = stepOctoCameraLiveBlendV1(camera, drive, delta);
  if (!camera.userData.rest) aimOctoConversationCameraV1(root, camera, camera.aspect);

  const restShot = resolveOctoRestShotV1(root, camera.aspect);
  const restPos = restShot.pos;
  const restLook = restShot.look;
  const restFov = restShot.fov;

  const ac = camera.userData.action;
  if (!ac) return;

  const head = getOctoHeadFocusV1(root);
  const radius = root.userData.fitRadius ?? 0.42;

  if (drive.live) {
    const pan = Math.min(1, blend * 0.22);
    const desiredPos = restPos.clone();
    desiredPos.x += (swimVel.velX ?? 0) * 0.025;
    desiredPos.y += (swimVel.velY ?? 0) * 0.02;
    const targetLook = restLook.clone().lerp(head, pan * 0.35);
    const a = Math.min(1, delta * 3.2);
    ac.pos.lerp(desiredPos, a);
    ac.look.lerp(targetLook, a);
    ac.fov += (restFov - ac.fov) * Math.min(1, delta * 2.5);
  } else {
    const smooth = Math.min(1, delta * 4.5);
    ac.pos.lerp(restPos, smooth);
    ac.look.lerp(restLook, smooth);
    ac.fov += (restFov - ac.fov) * smooth;
  }

  camera.position.lerpVectors(restPos, ac.pos, blend);
  const finalLook = restLook.clone().lerp(ac.look, blend);
  camera.lookAt(finalLook);
  camera.fov = THREE.MathUtils.lerp(restFov, ac.fov, blend);
  camera.updateProjectionMatrix();

  camera.userData.rest = { pos: restPos, look: restLook, fov: restFov };
}

/**
 * @param {THREE.Object3D} root
 */
export function collectOctoTentacleNodesV1(root) {
  /** @type {{ node: THREE.Object3D, originalRotation: THREE.Euler, originalPosition: THREE.Vector3, phase: number, reachBias: number, coilBias: number }[]} */
  const bones = [];
  const meshes = [];

  root.traverse((obj) => {
    const name = String(obj.name || "").toLowerCase();
    if (OCTO_BODY_HEAD_RE.test(name)) return;
    if (!TENTACLE_NAME_RE.test(name)) return;

    const entry = {
      node: obj,
      originalRotation: obj.rotation.clone(),
      originalPosition: obj.position.clone(),
      phase: 0,
      reachBias: name.includes("front") || name.includes("ön") ? 1.25 : 1,
      coilBias: name.includes("back") || name.includes("arka") ? 1.15 : 1
    };

    if (obj.isBone) {
      entry.phase = bones.length * 0.7;
      bones.push(entry);
      return;
    }
    if (obj.isMesh && obj.parent?.isBone) return;
    if (obj.isMesh) {
      entry.phase = meshes.length * 0.55;
      meshes.push(entry);
    }
  });

  let list = bones.length >= 3 ? bones : meshes;
  if (list.length < 3) {
    const fallback = [];
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const name = String(obj.name || "").toLowerCase();
      if (OCTO_BODY_HEAD_RE.test(name)) return;
      fallback.push({
        node: obj,
        originalRotation: obj.rotation.clone(),
        originalPosition: obj.position.clone(),
        phase: fallback.length * 0.6,
        reachBias: 1,
        coilBias: 1
      });
    });
    list = fallback;
  }
  return list.slice(0, 18);
}

/**
 * Kavrama için 2 ön tentacle seç.
 * @param {ReturnType<typeof collectOctoTentacleNodesV1>} tentacles
 */
export function pickOctoGrabTentacleIndicesV1(tentacles) {
  const n = tentacles?.length ?? 0;
  if (n < 2) return [0, 0];
  const ranked = tentacles
    .map((t, i) => ({
      i,
      score:
        (t.reachBias ?? 1) +
        (/front|ön|right|sağ|1|2|3/i.test(String(t.node?.name || "")) ? 1.4 : 0)
    }))
    .sort((a, b) => b.score - a.score);
  const picks = [];
  for (const row of ranked) {
    if (picks.includes(row.i)) continue;
    picks.push(row.i);
    if (picks.length >= Math.min(4, n)) break;
  }
  while (picks.length < 2) picks.push(Math.min(n - 1, picks.length));
  return picks.slice(0, Math.min(4, n));
}

const _octoReachVecA = new THREE.Vector3();
const _octoReachVecB = new THREE.Vector3();

/**
 * Tentacle'ı orb yönüne çevir — kavrama görünürlüğü.
 */
function aimOctoTentacleAtOrbV1(mesh, origR, origP, orbPos, amount) {
  if (!orbPos || amount < 0.05) return false;
  mesh.getWorldPosition(_octoReachVecA);
  _octoReachVecB.copy(orbPos).sub(_octoReachVecA);
  const dist = _octoReachVecB.length();
  if (dist < 1e-4) return false;
  _octoReachVecB.divideScalar(dist);
  const yaw = Math.atan2(_octoReachVecB.x, _octoReachVecB.z) * amount;
  const pitch = Math.asin(THREE.MathUtils.clamp(_octoReachVecB.y, -1, 1)) * amount * 0.75;
  mesh.rotation.y = origR.y + yaw;
  mesh.rotation.x = origR.x + pitch;
  mesh.rotation.z = origR.z + amount * 0.22;
  if (mesh.position) {
    mesh.position.x = origP.x + _octoReachVecB.x * amount * 0.42;
    mesh.position.y = origP.y + _octoReachVecB.y * amount * 0.22;
    mesh.position.z = origP.z + _octoReachVecB.z * amount * 0.42;
  }
  return true;
}

/**
 * Wave + reach + coil — tentacleController.js + yuva council arms (simplified).
 * @param {ReturnType<typeof collectOctoTentacleNodesV1>} tentacles
 * @param {number} time
 * @param {ReturnType<typeof deriveOctoMotionDriveV1> | keyof typeof OCTO_EMOTION_MAP_V1} driveOrEmotion
 */
export function animateOctoTentaclesV1(tentacles, time, driveOrEmotion, carry = null) {
  const drive =
    typeof driveOrEmotion === "string"
      ? deriveOctoMotionDriveV1({ fieldState: driveOrEmotion })
      : driveOrEmotion;
  if (drive.live === false && !carry?.allowBodySwim && !carry?.sessionSwim) return;
  const { frequency, amplitude } = getOctoEmotionParamsV1(drive.emotion);
  const count = Math.max(tentacles.length, 1);
  const phaseOffset = (Math.PI * 2) / count;
  const coast = carry?.coastSwim === true || drive.swimMode === "coast";
  const freqMul = coast ? 0.28 : drive.swimMode === "typing" ? 0.72 : 0.5;
  const waveMul = coast ? 0.32 : drive.swimMode === "typing" ? 0.78 : 0.55;
  const freq = frequency * drive.speed * freqMul;
  const waveAmp = amplitude * 0.28 * waveMul * (0.38 + drive.activation * 0.28);
  const grab = carry?.grab ?? 0;
  const ecologyCoil = carry?.ecologyCoilBias ?? 0;
  const extend = Math.max(carry?.tentacleExtend ?? 0, carry?.reach ?? 0);
  const leanX = carry?.headLeanX ?? 0;
  const phase = carry?.phase ?? "";
  const grabSet = new Set(carry?.grabTentacleIndices ?? []);
  const orbPos = carry?.orbPos;
  const grabbing = phase === "extend" || phase === "grasp" || phase === "carry" || grab > 0.15;

  tentacles.forEach((t, i) => {
    const mesh = t.node;
    if (!mesh?.rotation) return;

    const wavePhase = time * freq + i * phaseOffset + t.phase;
    const origR = t.originalRotation;
    const origP = t.originalPosition;
    const isGrabber = grabSet.has(i);

    let reachPulse =
      Math.sin(wavePhase * 0.85 + drive.words * 0.06) * (drive.reach + extend * 0.35) * 0.08 * t.reachBias;
    let coilWrap =
      Math.sin(wavePhase * 0.38 + i * 0.5) * (drive.coil + ecologyCoil * 0.4) * 0.14 * t.coilBias;
    const lag = Math.sin(wavePhase * 0.72 + i * 0.35) * waveAmp;

    if (isGrabber && grabbing && orbPos) {
      const extAmp = Math.min(1.35, extend * 1.05 + grab * 0.95);
      if (aimOctoTentacleAtOrbV1(mesh, origR, origP, orbPos, extAmp)) {
        if (grab > 0.45) {
          mesh.rotation.z = origR.z + grab * 0.42 * t.coilBias;
          if (mesh.position) {
            mesh.position.x += leanX * grab * 0.04;
          }
        }
        return;
      }
    }

    if (phase === "orient") {
      reachPulse *= 0.2;
      coilWrap *= 0.45;
    } else if (phase === "extend" || phase === "grasp") {
      coilWrap += 0.06;
      reachPulse *= 0.3;
    } else if ((phase === "carry" || phase === "release") && grab > 0.2) {
      reachPulse *= isGrabber ? 0.15 : 0.55;
      coilWrap += isGrabber ? 0.22 : 0.08;
    }

    mesh.rotation.x = origR.x + reachPulse * 0.42 + coilWrap * 0.22 + lag * 0.18;
    mesh.rotation.y = origR.y + reachPulse * 0.5 + lag * 0.1 + (coast ? Math.sin(wavePhase * 0.5) * 0.04 : 0);
    mesh.rotation.z = origR.z + coilWrap * 0.85 + lag * 0.08;

    if (mesh.position) {
      mesh.position.x = origP.x + reachPulse * 0.04 + lag * 0.02;
      mesh.position.y = origP.y + lag * 0.012;
      mesh.position.z = origP.z + reachPulse * 0.05 - coilWrap * 0.02;
    }
  });
}

/** Kavrama nesnesi rengi — octo bu tona dönüşür. */
export const OCTO_ORB_COLOR_V1 = 0xff6b6b;

/**
 * Enter/kavrama sırasında octo'yu nesne rengine boyar.
 * @param {THREE.Object3D} root
 * @param {number} grabAmount 0..1
 * @param {number} [dt]
 */
export function applyOctoOrbTintV1(root, grabAmount, dt = 0.08) {
  const amount = THREE.MathUtils.clamp(grabAmount, 0, 1);
  if (amount < 0.02) return;
  const main = new THREE.Color(OCTO_ORB_COLOR_V1);
  const accent = new THREE.Color(0xff3366);
  const lerp = Math.min(0.62, dt * 4.8) * amount;

  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const name = String(obj.name || "").toLowerCase();
    const isTentacle = TENTACLE_NAME_RE.test(name) && !OCTO_BODY_HEAD_RE.test(name);
    const isHead = OCTO_BODY_HEAD_RE.test(name) && !isTentacle;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    for (const mat of mats) {
      if (!mat.color) continue;
      const target = isTentacle
        ? main.clone().lerp(accent, 0.42)
        : isHead
          ? main.clone().lerp(accent, 0.28)
          : main.clone().lerp(accent, 0.18);
      mat.color.lerp(target, lerp);
      if (mat.emissive) {
        mat.emissive.copy(accent);
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity ?? 0, 0.55 + amount * 0.45, lerp);
      }
      mat.needsUpdate = true;
    }
  });
}

/**
 * Emotion color + emissive — octo-renderer.js + octo3d-scene colors
 * @param {THREE.Object3D} root
 * @param {keyof typeof OCTO_EMOTION_MAP_V1} emotion
 * @param {number} dt
 */
export function applyOctoEmotionColorsV1(root, emotion, dt = 0.08, drive = null) {
  const d = drive || deriveOctoMotionDriveV1({ fieldState: emotion });
  const { color, accent } = getOctoEmotionParamsV1(d.emotion || emotion);
  const main = new THREE.Color(color);
  const acc = new THREE.Color(accent);
  const lerp = Math.min(0.38, dt * 2.2);
  const emo = d.emotion || emotion;

  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const name = String(obj.name || "").toLowerCase();
    const isTentacle = TENTACLE_NAME_RE.test(name) && !OCTO_BODY_HEAD_RE.test(name);
    const isHead = OCTO_BODY_HEAD_RE.test(name) && !isTentacle;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    for (const mat of mats) {
      if (!mat.color) continue;
      const target = isTentacle
        ? main.clone().lerp(acc, 0.55 + d.reach * 0.25)
        : isHead
          ? main.clone().lerp(acc, 0.35)
          : main.clone().lerp(acc, 0.2);
      mat.color.lerp(target, lerp);
      if (mat.emissive) {
        mat.emissive.copy(acc);
        const pulse =
          emo === "speaking" || emo === "excited"
            ? 0.75 + Math.sin(performance.now() * 0.01 * d.speed) * 0.35 * d.activation
            : emo === "listening"
              ? 0.45 + d.coil * 0.15
              : 0.35 + d.activation * 0.35;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity ?? 0, pulse, lerp);
      }
      mat.metalness = THREE.MathUtils.lerp(mat.metalness ?? 0.2, 0.15, lerp);
      mat.roughness = THREE.MathUtils.lerp(mat.roughness ?? 0.6, 0.42, lerp);
      mat.side = THREE.DoubleSide;
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.needsUpdate = true;
    }
  });
}

/**
 * @param {THREE.AnimationClip[]} clips
 * @param {keyof typeof OCTO_EMOTION_MAP_V1} emotion
 * @returns {THREE.AnimationClip | null}
 */
export function pickOctoAnimationClipV1(clips, emotion) {
  if (!clips?.length) return null;
  const hints = EMOTION_CLIP_HINTS_V1[emotion] || EMOTION_CLIP_HINTS_V1.neutral;
  for (const hint of hints) {
    const found = clips.find((c) => c.name.toLowerCase().includes(hint.toLowerCase()));
    if (found) return found;
  }
  return clips[0];
}
