/**
 * Medusa companion service — UI-agnostic mount/motion lifecycle.
 */

import * as THREE from "three";
import {
  loadMedusaCompanionModelV0,
  MEDUSA_COMPANION_DEFAULT_SIZE_V0
} from "./medusaCompanionSceneV0.js";

/**
 * @param {HTMLElement} container
 * @param {{ width?: number, height?: number, mediaStream?: MediaStream | null }} [opts]
 */
export function mountMedusaCompanionV0(container, opts = {}) {
  const w = opts.width || MEDUSA_COMPANION_DEFAULT_SIZE_V0;
  const h = opts.height || MEDUSA_COMPANION_DEFAULT_SIZE_V0;

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
    root = nextRoot;
  });

  let raf = 0;
  let t = 0;
  let motion = 0;
  let audioCtx = null;
  let analyser = null;
  let data = null;

  const bindMotionStream = (mediaStream) => {
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
    t += 0.016;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      motion = sum / (data.length * 255);
    } else {
      motion = 0.15 + Math.sin(t * 2) * 0.05;
    }
    if (root) {
      const sway = 0.08 + motion * 0.35;
      root.rotation.y = Math.sin(t * 1.2) * sway;
      root.rotation.z = Math.sin(t * 0.9) * sway * 0.35;
      root.position.y = Math.sin(t * 1.6) * (0.02 + motion * 0.06);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return Object.freeze({
    setMotionStream(stream) {
      bindMotionStream(stream);
    },
    dispose() {
      cancelAnimationFrame(raf);
      if (audioCtx) void audioCtx.close();
      renderer.dispose();
      container.innerHTML = "";
    }
  });
}
