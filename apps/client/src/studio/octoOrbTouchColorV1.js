import * as THREE from "three";
import { OCTO_ORB_COLOR_V1 } from "./octoConversationMotionV1.js";

const TENTACLE_NAME_RE =
  /tent|tentacle|arm|leg|sucker|hair|fin|append|digit|tentáculo|kol|bacak|^11|^12|^13|^14|^15|^21|^22|^23|^24|^25|^31|^32|^33|^34|^35/i;
const OCTO_BODY_HEAD_RE =
  /head|body|mantle|bell|torso|abdomen|sac|brain|beak|eye|mouth|pupil|lid|cornea|ringed|bone/i;

/**
 * @param {THREE.Object3D} root
 */
export function initOctoTouchColorStateV1(root) {
  if (!root.userData.touchColor) {
    root.userData.touchColor = {
      touchProgress: 0,
      tentacleProgress: 0,
      bodyProgress: 0,
      locked: false,
      colorRevision: 0,
      orbColor: OCTO_ORB_COLOR_V1,
      emissive: 0xff3366
    };
  }
  return root.userData.touchColor;
}

/**
 * Yeni cümle / renk revizyonu — kalıcı kilit aç.
 * @param {THREE.Object3D} root
 */
export function releaseOctoTouchColorLockV1(root) {
  const state = initOctoTouchColorStateV1(root);
  state.locked = false;
  state.touchProgress = Math.max(state.touchProgress, 0.72);
  state.tentacleProgress = Math.max(state.tentacleProgress, 0.72);
  state.bodyProgress = Math.max(state.bodyProgress, 0.72);
  return state;
}

/**
 * @param {THREE.Object3D} root
 * @param {{ touchAmount?: number, grab?: number, phase?: string }} carry
 * @param {number} delta
 */
export function stepOctoTouchColorStateV1(root, carry, delta) {
  const state = initOctoTouchColorStateV1(root);

  if (carry?.colorRevision != null && carry.colorRevision !== state.colorRevision) {
    state.colorRevision = carry.colorRevision;
    state.locked = false;
    state.touchProgress = Math.max(state.touchProgress, 0.55);
    state.tentacleProgress = Math.max(state.tentacleProgress, 0.55);
    state.bodyProgress = Math.max(state.bodyProgress, 0.45);
  }

  if (carry?.crystalColor != null) state.orbColor = carry.crystalColor;
  if (carry?.crystalEmissive != null) state.emissive = carry.crystalEmissive;

  if (carry?.continuousColor || carry?.sessionSwim) {
    state.locked = false;
    state.liveBlend = true;
    state.touchProgress = 1;
    state.tentacleProgress = 1;
    state.bodyProgress = 1;
    return state;
  }
  state.liveBlend = false;

  const touchSignal = carry?.octoTintRequested ? 1 : Math.max(carry?.touchAmount ?? 0, carry?.grab ?? 0);
  const touching =
    carry?.octoTintRequested === true ||
    touchSignal > 0.05 ||
    carry?.phase === "octo_tint";

  if (state.locked) {
    state.touchProgress = 1;
    state.tentacleProgress = 1;
    state.bodyProgress = 1;
    return state;
  }

  if (touching) {
    state.touchProgress = Math.min(1, state.touchProgress + delta * 0.55);
    state.tentacleProgress = Math.min(1, state.tentacleProgress + delta * 0.72);
    if (state.tentacleProgress > 0.82) {
      state.bodyProgress = Math.min(1, state.bodyProgress + delta * 0.48);
    }
    if (state.touchProgress >= 0.98 && state.bodyProgress >= 0.95 && !carry?.continuousColor) {
      state.locked = true;
      state.touchProgress = 1;
      state.tentacleProgress = 1;
      state.bodyProgress = 1;
    }
  }

  return state;
}

/**
 * Tentacle → gövde renk yayılımı; kilitlenince kalıcı orb rengi.
 * @param {THREE.Object3D} root
 * @param {ReturnType<typeof initOctoTouchColorStateV1>} state
 * @param {number} delta
 */
export function applyOctoTouchColorV1(root, state, delta = 0.08) {
  if (!root || !state) return;
  const main = new THREE.Color(state.orbColor ?? OCTO_ORB_COLOR_V1);
  const accent = new THREE.Color(state.emissive ?? 0xff3366);
  const locked = Boolean(state.locked);
  const tentAmt = locked ? 1 : THREE.MathUtils.clamp(state.tentacleProgress, 0, 1);
  const bodyAmt = locked ? 1 : THREE.MathUtils.clamp(state.bodyProgress, 0, 1);

  if (!locked && tentAmt < 0.02 && bodyAmt < 0.02) return;

  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const name = String(obj.name || "").toLowerCase();
    const isTentacle = TENTACLE_NAME_RE.test(name) && !OCTO_BODY_HEAD_RE.test(name);
    const isHead = OCTO_BODY_HEAD_RE.test(name) && !isTentacle;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    for (const mat of mats) {
      if (!mat.color) continue;
      const partAmt = isTentacle || !isHead ? tentAmt : bodyAmt;
      const lerp = state.liveBlend
        ? Math.min(0.92, Math.max(0.28, delta * 6.5))
        : locked
          ? Math.min(0.42, delta * 5.5)
          : Math.min(0.88, Math.max(0.14, delta * 4.2) * Math.max(partAmt, 0.55));
      const target = main.clone().lerp(accent, isTentacle ? 0.38 : isHead ? 0.22 : 0.15);
      mat.color.lerp(target, lerp);
      if (mat.emissive) {
        mat.emissive.copy(accent);
        const emTarget = locked ? 0.62 : 0.28 + partAmt * 0.45;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity ?? 0, emTarget, lerp);
      }
      mat.needsUpdate = true;
    }
  });
}

/**
 * @param {THREE.Object3D} root
 */
export function isOctoTouchColorLockedV1(root) {
  return Boolean(root?.userData?.touchColor?.locked);
}
