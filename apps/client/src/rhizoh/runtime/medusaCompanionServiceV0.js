/**
 * Medusa companion service — UI-agnostic mount/motion lifecycle.
 * Sprint 37.5: disposed guard + no RAF after unmount.
 */

import * as THREE from "three";
import {
  loadMedusaCompanionModelV0,
  MEDUSA_COMPANION_DEFAULT_SIZE_V0
} from "./medusaCompanionSceneV0.js";
import {
  animateMedusaCompanionRootV0,
  collectMedusaSnakeMeshesV0,
  tagMedusaGltfSnakeMeshesV0
} from "./medusaCompanionMotionV0.js";

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
    tagMedusaGltfSnakeMeshesV0(nextRoot);
    snakeMeshes = collectMedusaSnakeMeshesV0(nextRoot);
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
      const out = animateMedusaCompanionRootV0(root, t, {
        motion,
        headYawTarget,
        swayScale: motionProfile.swayScale,
        idleAmp: motionProfile.idleAmp,
        audioGain: motionProfile.audioGain,
        snakeMeshes
      });
      headYawTarget = out.headYawTarget;
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
