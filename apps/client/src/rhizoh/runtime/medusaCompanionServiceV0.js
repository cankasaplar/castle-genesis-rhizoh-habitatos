/**
 * Medusa companion service — UI-agnostic mount/motion lifecycle.
 * Sprint 37.5: disposed guard + no RAF after unmount.
 */

import * as THREE from "three";
import {
  loadMedusaCompanionModelV0,
  MEDUSA_COMPANION_DEFAULT_SIZE_V0,
  MEDUSA_COMPANION_FACE_Y_V0,
  attachMedusaHairStrandsV0
} from "./medusaCompanionSceneV0.js";

/**
 * @param {HTMLElement} container
 * @param {{ width?: number, height?: number, mediaStream?: MediaStream | null, motionProfile?: { swayScale?: number, idleAmp?: number, audioGain?: number } }} [opts]
 */
export function mountMedusaCompanionV0(container, opts = {}) {
  const w = opts.width || MEDUSA_COMPANION_DEFAULT_SIZE_V0;
  const h = opts.height || MEDUSA_COMPANION_DEFAULT_SIZE_V0;
  const motionProfile = Object.freeze({
    swayScale: opts.motionProfile?.swayScale ?? 1,
    idleAmp: opts.motionProfile?.idleAmp ?? 0.09,
    audioGain: opts.motionProfile?.audioGain ?? 1
  });

  let disposed = false;
  let raf = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0.52, 2.05);
  camera.lookAt(0, 0.42, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xc4b5fd, 1.1);
  key.position.set(1, 2, 2);
  scene.add(key);

  /** @type {THREE.Object3D | null} */
  let root = null;
  /** @type {THREE.Object3D[]} */
  let snakeMeshes = [];
  const collectSnakes = (nextRoot) => {
    if (!nextRoot) return;
    attachMedusaHairStrandsV0(nextRoot);
    snakeMeshes = [];
    nextRoot.traverse((obj) => {
      if (obj.userData?.medusaSnake) snakeMeshes.push(obj);
    });
    if (!snakeMeshes.length) {
      nextRoot.traverse((obj) => {
        if (obj.isMesh && obj !== nextRoot) snakeMeshes.push(obj);
      });
    }
  };

  loadMedusaCompanionModelV0(scene, (nextRoot) => {
    if (disposed) return;
    root = nextRoot;
    collectSnakes(root);
  });

  let t = 0;
  let motion = 0;
  let headYawTarget = 0;
  let audioCtx = null;
  let analyser = null;
  let data = null;

  const bindMotionStream = (mediaStream) => {
    if (disposed) return;
    if (audioCtx) {
      void audioCtx.close();
      audioCtx = null;
      analyser = null;
      data = null;
    }
    if (mediaStream?.getAudioTracks?.().length) {
      try {
        audioCtx = new AudioContext();
        void audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        /* noop */
      }
    }
  };

  bindMotionStream(opts.mediaStream || null);

  const tick = () => {
    if (disposed) return;
    t += 0.016;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      let low = 0;
      let mid = 0;
      let high = 0;
      const third = Math.max(1, Math.floor(data.length / 3));
      for (let i = 0; i < data.length; i += 1) {
        sum += data[i];
        if (i < third) low += data[i];
        else if (i < third * 2) mid += data[i];
        else high += data[i];
      }
      motion = sum / (data.length * 255);
      const centroid = (low * 0.25 + mid * 0.55 + high * 0.95) / (low + mid + high + 1);
      if (motion > 0.12) {
        headYawTarget += (centroid - 0.48) * motion * 0.14;
        headYawTarget = Math.max(-0.62, Math.min(0.62, headYawTarget));
      }
    } else {
      motion = 0.28 + Math.sin(t * 2.1) * motionProfile.idleAmp;
    }
    headYawTarget *= 0.972;
    if (root) {
      const sway = (0.28 + motion * 0.85 * motionProfile.audioGain) * motionProfile.swayScale;
      const breathe = Math.sin(t * 1.1) * 0.07 * motionProfile.swayScale;
      const idleYaw = Math.sin(t * 1.2) * sway * 0.38 + Math.sin(t * 0.35) * 0.06;
      root.rotation.y = MEDUSA_COMPANION_FACE_Y_V0 + headYawTarget + idleYaw;
      root.rotation.z = Math.sin(t * 0.9) * sway * 0.32;
      root.rotation.x = Math.sin(t * 0.7) * sway * 0.14 - headYawTarget * 0.08;
      root.position.y = Math.sin(t * 1.6) * (0.06 + motion * 0.14) + breathe;
      root.position.x = Math.sin(t * 0.85) * sway * 0.07 + headYawTarget * 0.04;
      for (let i = 0; i < snakeMeshes.length; i += 1) {
        const snake = snakeMeshes[i];
        const phase = Number(snake.userData?.snakePhase) || i * 0.7;
        const wiggle = (0.48 + motion * 0.95) * motionProfile.swayScale;
        const hairLift = motion * 0.18;
        snake.rotation.z = Math.sin(t * 2.8 + phase) * wiggle + hairLift;
        snake.rotation.x = Math.sin(t * 2.1 + phase * 1.3) * wiggle * 0.78;
        snake.rotation.y = Math.cos(t * 2.4 + phase * 0.8) * wiggle * 0.55 + headYawTarget * 0.35;
      }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return Object.freeze({
    isDisposed() {
      return disposed;
    },
    setMotionStream(stream) {
      if (disposed) return;
      bindMotionStream(stream);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      if (audioCtx) void audioCtx.close();
      audioCtx = null;
      analyser = null;
      data = null;
      root = null;
      snakeMeshes = [];
      renderer.dispose();
      scene.clear();
      container.replaceChildren();
    }
  });
}
