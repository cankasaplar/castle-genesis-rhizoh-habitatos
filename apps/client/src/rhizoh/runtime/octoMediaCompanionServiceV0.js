/**
 * Octo media companion — gerçek GLB + tül overlay + harmony tentacles (v0).
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
import { sampleOctoMediaAudioBandsV0 } from "./octoMediaCompanionMotionV0.js";
import {
  applyOctoMediaHarmonyTentaclesV0,
  buildOctoMediaHarmonyCarryV0,
  deriveOctoMediaElegantDriveV0,
  resolveOctoMediaElegantScaleV0,
  stepOctoMediaBirdFloatV0
} from "./octoMediaHarmonyV0.js";
import {
  buildOctoMediaTulleTargetBehaviorV0,
  cloneOctoMediaTulleBehaviorV0,
  deriveOctoMediaTulleDriveV0,
  lerpOctoMediaTulleBehaviorV0
} from "./octoMediaTulleBehaviorsV0.js";
import { drawOctoMediaTulleOverlayV0 } from "./octoMediaTulleDrawV0.js";

/**
 * @param {HTMLElement} container
 * @param {{ mediaStream?: MediaStream | null }} [opts]
 */
export function mountOctoMediaCompanionV0(container, opts = {}) {
  let disposed = false;
  let raf = 0;
  let w = Math.max(120, container.clientWidth || 320);
  let h = Math.max(120, container.clientHeight || 240);

  const glHost = document.createElement("div");
  glHost.style.cssText = "position:absolute;inset:0;pointer-events:none";
  const tulleCanvas = document.createElement("canvas");
  tulleCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  container.appendChild(glHost);
  container.appendChild(tulleCanvas);
  const tulleCtx = tulleCanvas.getContext("2d");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, w / h, 0.08, 40);
  camera.position.set(0, 0.28, 2.6);
  camera.lookAt(0, 0.15, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.pointerEvents = "none";
  glHost.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x99bbcc, 0.5));
  const key = new THREE.DirectionalLight(0x88eeff, 0.72);
  key.position.set(1, 2.2, 2.5);
  scene.add(key);
  const rim = new THREE.PointLight(0x44ddff, 0.38, 10);
  rim.position.set(-0.6, 0.5, 1.4);
  scene.add(rim);

  /** @type {THREE.Object3D | null} */
  let root = null;
  let tentacles = [];
  let body = null;
  let mixer = null;
  let activeAction = null;

  new GLTFLoader().load(
    ASSETS.octo,
    (gltf) => {
      if (disposed) return;
      root = gltf.scene;
      prepareOctoConversationMaterialsV1(root);
      fitOctoConversationModelV1(root, { targetSize: 0.44 });
      tentacles = collectOctoTentacleNodesV1(root);
      body = root;
      scene.add(root);
      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(root);
        const clip = pickOctoAnimationClipV1(gltf.animations, "neutral");
        if (clip) {
          activeAction = mixer.clipAction(clip);
          activeAction.reset().fadeIn(0.4).play();
          activeAction.setEffectiveWeight(0.28);
        }
      }
    },
    undefined,
    () => {
      /* glass + tulle still render */
    }
  );

  const floatState = {
    x: 0.5,
    y: 0.54,
    vx: 0,
    vy: 0,
    targetX: 0.6,
    targetY: 0.42,
    arcT: 1,
    arcMidX: 0.55,
    arcMidY: 0.48
  };

  const tulleBehavior = cloneOctoMediaTulleBehaviorV0("IDLE");
  let globalPhase = 0;
  let lastEmotion = "neutral";
  let colorHue = tulleBehavior.colorH;
  const clock = new THREE.Clock();
  let bodyCarry = null;
  let tentacleCarry = null;

  let audioCtx = null;
  let analyser = null;
  /** @type {Uint8Array | null} */
  let freqData = null;

  const bindMotionStream = (stream) => {
    if (disposed) return;
    if (audioCtx) {
      void audioCtx.close();
      audioCtx = null;
      analyser = null;
      freqData = null;
    }
    if (stream?.getAudioTracks?.().length) {
      try {
        audioCtx = new AudioContext();
        void audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaStreamSource(stream);
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    tulleCanvas.width = Math.floor(w * dpr);
    tulleCanvas.height = Math.floor(h * dpr);
    tulleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(container);
  resize();

  const tick = () => {
    if (disposed) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    if (analyser && freqData) analyser.getByteFrequencyData(freqData);
    const bands = sampleOctoMediaAudioBandsV0(freqData);
    const idleMotion = 0.14 + Math.sin(t * 1.4) * 0.04;
    const audioMotion = freqData ? bands.motion : idleMotion;

    Object.assign(
      floatState,
      stepOctoMediaBirdFloatV0(floatState, {
        motion: audioMotion,
        centroid: bands.centroid,
        dt
      })
    );

    const drive = deriveOctoMediaElegantDriveV0({
      audioMotion,
      centroid: bands.centroid,
      vx: floatState.vx,
      vy: floatState.vy
    });

    const tulleDrive = deriveOctoMediaTulleDriveV0({
      audioMotion,
      centroid: bands.centroid,
      vx: floatState.vx,
      vy: floatState.vy
    });
    const targetBehavior = buildOctoMediaTulleTargetBehaviorV0(tulleDrive.mode, tulleDrive.hueBias);
    lerpOctoMediaTulleBehaviorV0(tulleBehavior, targetBehavior, dt, drive.colorLerpSpeed);
    colorHue += (tulleBehavior.colorH - colorHue) * Math.min(1, dt * drive.colorLerpSpeed);
    tulleBehavior.colorH = colorHue;
    globalPhase += dt * tulleBehavior.freq;

    const spanX = Math.max(1.1, (w / h) * 1.02) * 2;
    const spanY = 1.02 * 2;
    const sceneX = (floatState.x - 0.5) * spanX;
    const sceneY = (0.5 - floatState.y) * spanY;
    const screenCx = floatState.x * w;
    const screenCy = floatState.y * h;
    const nestR = Math.min(w, h) * 0.19;

    if (root) {
      const scale = resolveOctoMediaElegantScaleV0(drive.elegantScale, t, drive.breatheHz);
      root.position.set(sceneX, sceneY + Math.sin(t * 1.8) * 0.025, 0);
      root.rotation.y = drive.swayYaw + Math.sin(t * 0.7) * 0.04;
      root.rotation.z = Math.sin(t * 1.1) * 0.03 * drive.harmonyCoupling;
      root.scale.setScalar(scale);

      const colorDt = Math.min(0.22, dt * drive.colorLerpSpeed * 0.35);
      if (drive.emotion !== lastEmotion) {
        applyOctoEmotionColorsV1(root, drive.emotion, colorDt, drive);
        lastEmotion = drive.emotion;
      } else {
        applyOctoEmotionColorsV1(root, drive.emotion, colorDt, drive);
      }

      const harmonyCarry = buildOctoMediaHarmonyCarryV0(t, drive, floatState, tentacles.length);
      bodyCarry = animateOctoBodyV1(body, t, drive, dt, bodyCarry);
      tentacleCarry = animateOctoTentaclesV1(tentacles, t, drive, {
        ...tentacleCarry,
        ...harmonyCarry
      });
      applyOctoMediaHarmonyTentaclesV0(tentacles, harmonyCarry, t);

      rim.intensity = 0.2 + drive.audioMotion * 0.28;
      rim.color.setHSL(((colorHue % 360) + 360) % 360 / 360, 0.75, 0.62);
    }

    if (mixer) mixer.update(dt);
    renderer.render(scene, camera);

    if (tulleCtx) {
      tulleCtx.clearRect(0, 0, w, h);
      drawOctoMediaTulleOverlayV0(tulleCtx, {
        cx: screenCx,
        cy: screenCy,
        nestR,
        behavior: tulleBehavior,
        globalPhase,
        waveFlow: tulleDrive.waveFlow,
        opacity: 0.62
      });
    }

    container.dataset.rhizohOctoRenderer = "glb+tulle-v0";
    container.dataset.rhizohOctoTulleMode = tulleDrive.mode;

    raf = requestAnimationFrame(tick);
  };
  tick();

  return Object.freeze({
    isDisposed() {
      return disposed;
    },
    setMotionStream(stream) {
      bindMotionStream(stream);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ro?.disconnect();
      cancelAnimationFrame(raf);
      if (audioCtx) void audioCtx.close();
      renderer.dispose();
      scene.clear();
      container.replaceChildren();
    }
  });
}

export { mountOctoMediaTulleStageV0 } from "./octoMediaTulleStageV0.js";
