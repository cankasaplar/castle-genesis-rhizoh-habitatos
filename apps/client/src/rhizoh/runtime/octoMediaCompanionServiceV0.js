/**
 * Octo media companion — full-viewport float + audio-reactive color (v0).
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "../../studio/assetRegistryV1.js";
import {
  animateOctoBodyV1,
  animateOctoTentaclesV1,
  applyOctoEmotionColorsV1,
  collectOctoTentacleNodesV1,
  fitOctoConversationModelV1,
  pickOctoAnimationClipV1,
  prepareOctoConversationMaterialsV1
} from "../../studio/octoConversationMotionV1.js";
import {
  deriveOctoMediaAudioDriveV0,
  octoMediaFloatToSceneXYV0,
  sampleOctoMediaAudioBandsV0,
  stepOctoMediaFloatV0
} from "./octoMediaCompanionMotionV0.js";

/**
 * @param {HTMLElement} container
 * @param {{ mediaStream?: MediaStream | null }} [opts]
 */
export function mountOctoMediaCompanionV0(container, opts = {}) {
  let disposed = false;
  let raf = 0;
  let w = Math.max(120, container.clientWidth || 320);
  let h = Math.max(120, container.clientHeight || 240);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.08, 40);
  camera.position.set(0, 0.35, 2.4);
  camera.lookAt(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.pointerEvents = "none";
  renderer.domElement.style.background = "transparent";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x88bbcc, 0.42));
  const key = new THREE.DirectionalLight(0x00e5ff, 0.62);
  key.position.set(1.2, 2.5, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0x33eeff, 0.32, 8);
  rim.position.set(-0.8, 0.6, 1.2);
  scene.add(rim);

  /** @type {THREE.Object3D | null} */
  let root = null;
  /** @type {THREE.Object3D[]} */
  let tentacles = [];
  let mixer = null;
  let activeAction = null;
  let body = null;

  const loader = new GLTFLoader();
  loader.load(
    ASSETS.octo,
    (gltf) => {
      if (disposed) return;
      root = gltf.scene;
      prepareOctoConversationMaterialsV1(root);
      fitOctoConversationModelV1(root, { targetSize: 0.52 });
      tentacles = collectOctoTentacleNodesV1(root);
      body = root;
      scene.add(root);
      const clips = gltf.animations || [];
      if (clips.length) {
        mixer = new THREE.AnimationMixer(root);
        const clip = pickOctoAnimationClipV1(clips, "neutral");
        if (clip) {
          activeAction = mixer.clipAction(clip);
          activeAction.reset().fadeIn(0.3).play();
          activeAction.setEffectiveWeight(0.35);
        }
      }
    },
    undefined,
    () => {
      /* placeholder stays empty — glass layer still visible */
    }
  );

  let t = 0;
  let audioCtx = null;
  let analyser = null;
  /** @type {Uint8Array | null} */
  let freqData = null;
  const floatState = {
    x: 0.5,
    y: 0.55,
    vx: 0,
    vy: 0,
    targetX: 0.62,
    targetY: 0.38
  };
  let lastEmotion = "neutral";
  const clock = new THREE.Clock();
  let tentacleCarry = null;
  let bodyCarry = null;

  const bindMotionStream = (mediaStream) => {
    if (disposed) return;
    if (audioCtx) {
      void audioCtx.close();
      audioCtx = null;
      analyser = null;
      freqData = null;
    }
    if (mediaStream?.getAudioTracks?.().length) {
      try {
        audioCtx = new AudioContext();
        void audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        /* noop */
      }
    }
  };

  bindMotionStream(opts.mediaStream || null);

  const resize = () => {
    if (disposed) return;
    w = Math.max(120, container.clientWidth || w);
    h = Math.max(120, container.clientHeight || h);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null;
  ro?.observe(container);
  resize();

  const tick = () => {
    if (disposed) return;
    const dt = Math.min(0.05, clock.getDelta());
    t += dt;

    if (analyser && freqData) analyser.getByteFrequencyData(freqData);
    const bands = sampleOctoMediaAudioBandsV0(freqData);
    const idleMotion = 0.18 + Math.sin(t * 1.6) * 0.06;
    const drive = deriveOctoMediaAudioDriveV0({
      motion: freqData ? bands.motion : idleMotion,
      centroid: bands.centroid
    });

    const nextFloat = stepOctoMediaFloatV0(floatState, {
      motion: drive.audioMotion,
      centroid: drive.audioCentroid,
      dt
    });
    Object.assign(floatState, nextFloat);

    if (root) {
      const { sceneX, sceneY } = octoMediaFloatToSceneXYV0(floatState.x, floatState.y, w / h);
      root.position.x = sceneX;
      root.position.y = sceneY + Math.sin(t * 2.1) * 0.04 * drive.swayBoost;
      root.rotation.y = Math.atan2(floatState.vx, floatState.vy) * 0.35;
      root.rotation.z = Math.sin(t * 1.4) * 0.06 * drive.swayBoost;

      if (drive.emotion !== lastEmotion) {
        applyOctoEmotionColorsV1(root, drive.emotion, 0.12, drive);
        lastEmotion = drive.emotion;
      } else {
        applyOctoEmotionColorsV1(root, drive.emotion, dt, drive);
      }

      bodyCarry = animateOctoBodyV1(body, t, drive, dt, bodyCarry);
      tentacleCarry = animateOctoTentaclesV1(tentacles, t, drive, tentacleCarry);
      rim.intensity = 0.22 + drive.colorPulse * 0.35;
      const accentHex = drive.accent ?? 0x33eeff;
      rim.color.setHex(accentHex);
    }

    if (mixer) mixer.update(dt);
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
      ro?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      if (audioCtx) void audioCtx.close();
      audioCtx = null;
      analyser = null;
      freqData = null;
      root = null;
      tentacles = [];
      renderer.dispose();
      scene.clear();
      container.replaceChildren();
    }
  });
}
