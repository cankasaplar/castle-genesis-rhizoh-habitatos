/**
 * Medusa companion service — UI-agnostic mount/motion lifecycle.
 * Sprint 37.5: disposed guard + no RAF after unmount.
 */

import * as THREE from "three";
import {
  loadMedusaCompanionModelV0,
  MEDUSA_COMPANION_DEFAULT_SIZE_V0
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
    idleAmp: opts.motionProfile?.idleAmp ?? 0.05,
    audioGain: opts.motionProfile?.audioGain ?? 1
  });

  let disposed = false;
  let raf = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0.55, 2.2);

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
  loadMedusaCompanionModelV0(scene, (nextRoot) => {
    if (disposed) return;
    root = nextRoot;
  });

  let t = 0;
  let motion = 0;
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
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      motion = sum / (data.length * 255);
    } else {
      motion = 0.15 + Math.sin(t * 2) * motionProfile.idleAmp;
    }
    if (root) {
      const sway = (0.14 + motion * 0.5 * motionProfile.audioGain) * motionProfile.swayScale;
      const breathe = Math.sin(t * 1.1) * 0.04 * motionProfile.swayScale;
      root.rotation.y = Math.sin(t * 1.2) * sway + Math.sin(t * 0.35) * 0.06;
      root.rotation.z = Math.sin(t * 0.9) * sway * 0.35;
      root.rotation.x = Math.sin(t * 0.7) * sway * 0.12;
      root.position.y = Math.sin(t * 1.6) * (0.03 + motion * 0.08) + breathe;
      root.position.x = Math.sin(t * 0.85) * sway * 0.04;
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
      renderer.dispose();
      scene.clear();
      container.replaceChildren();
    }
  });
}
