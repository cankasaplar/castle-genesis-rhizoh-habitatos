import React, { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import { preloadConversationAnchorGlbV0 } from "./conversationAnchorGlbPreloadV0.js";
import {
  isOctoAnchorSpeciesV0,
  resolveConversationAnchorModelUrlV0
} from "./conversationAnchorSpeciesV0.js";
import {
  aimFoxCubeConversationCameraV0,
  aimFoxLabConversationCameraV0,
  fitConversationAnchorInNestV0,
  updateFoxCubeConversationCameraV0
} from "./fitConversationAnchorInNestV0.js";
import {
  foxClipTimeScaleV1,
  isFoxLocomotionClipV1,
  pickFoxAnimationClipV1,
  resolveFoxMotionStateV1,
  shouldLoopFoxClipV1
} from "./foxConversationMotionV1.js";
import { animateFoxCompanionSpatialV1 } from "./foxCompanionSpatialV1.js";
import {
  animateOctoBodyV1,
  animateOctoTentaclesV1,
  applyOctoEmotionColorsV1,
  collectOctoTentacleNodesV1,
  deriveOctoMotionDriveV1,
  fitOctoConversationModelV1,
  pickOctoAnimationClipV1,
  pickOctoGrabTentacleIndicesV1,
  prepareOctoConversationMaterialsV1
} from "./octoConversationMotionV1.js";
import {
  aimCubeCentricConversationCameraV1,
  updateCubeCentricConversationCameraV1
} from "./octoCubeCentricCameraV1.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createOctoYuvaNestV1 } from "./octoYuvaNestV1.js";
import {
  createOctoSpeakingCrystalV1,
  updateOctoSpeakingCrystalV1
} from "./octoSpeakingCrystalV1.js";
import { animateOctoGlbRigV1, extractOctoGlbRigV1 } from "./octoGlbRigV1.js";
import {
  applyOctoTouchColorV1,
  initOctoTouchColorStateV1,
  isOctoTouchColorLockedV1,
  stepOctoTouchColorStateV1
} from "./octoOrbTouchColorV1.js";
import {
  OCTO_ROOM_DEFAULT_HEIGHT_PX_V1,
  resolveOctoRoomHeightPxV1
} from "./octoRoomLayoutV1.js";
import { publishFoxAnchorFrameBindingV0 } from "../castleFlight/foxFrameAnchorBindingV0.js";
import { OBSERVER_SPECIES_OCTO_V1 } from "./observerSpeciesRegistryV0.js";
import {
  attachFoxConversationEyesV0,
  disposeFoxConversationEyesV0,
  updateFoxConversationEyesV0
} from "./foxConversationEyesV0.js";
import {
  deriveFoxCompanionBehaviorDriveV1,
  isCompanionBehaviorOnlyV0
} from "./companionBehaviorOnlyV0.js";
import { isFoxAnchorSpeciesV0 } from "./conversationAnchorSpeciesV0.js";
import {
  maybePublishOctoYuvaActivationV1,
  readOctoLabPerformanceIntensityV1
} from "../rhizoh/runtime/octoYuvaMediaLabBridgeV1.js";
import { sampleOctoMediaAudioBandsV0 } from "../rhizoh/runtime/octoMediaCompanionMotionV0.js";

if (typeof window !== "undefined") {
  preloadConversationAnchorGlbV0().catch(() => {});
}

function createOctoPlaceholderV1() {
  const g = new THREE.Group();
  g.scale.setScalar(0.62);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x0e3d52,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.35
    })
  );
  core.position.y = 0.18;
  g.add(core);
  return g;
}

function buildDrive(fieldState, replyText, draftText, busy, speciesId, engagementProxy = 0, audioMotion = 0) {
  const mergedEngagement = Math.min(1, Math.max(engagementProxy, audioMotion * 0.85));
  const base = { fieldState, draftText, busy, engagementProxy: mergedEngagement };
  if (isCompanionBehaviorOnlyV0(speciesId) && isFoxAnchorSpeciesV0(speciesId)) {
    return deriveFoxCompanionBehaviorDriveV1(base);
  }
  return deriveOctoMotionDriveV1({ ...base, replyText });
}

/**
 * Kompakt yuva — varsayılan sabit; yazı/konuşma sırasında Octo + kamera hareket eder.
 * @param {{
 *   fieldState?: string,
 *   replyText?: string,
 *   draftText?: string,
 *   busy?: boolean,
 *   height?: number,
 *   heightMax?: number,
 *   labMode?: boolean,
 *   submitPulse?: number,
 *   mediaStream?: MediaStream | null,
 *   onLoadStateChange?: (state: string) => void,
 *   className?: string
 * }} props
 */
export const OctoConversationStageV1 = memo(function OctoConversationStageV1({
  fieldState = "idle",
  replyText = "",
  draftText = "",
  busy = false,
  submitPulse = 0,
  height = OCTO_ROOM_DEFAULT_HEIGHT_PX_V1,
  heightMax = 140,
  labMode = false,
  mediaStream = null,
  onLoadStateChange,
  /** Read-only post-render phase offset (ms) — fracture sync only, no camera authority. */
  fracturePhaseMs = 0,
  /** Anchor species for projection sync (octo_v1 → fox_v1 swap = prop only). */
  anchorSpeciesId = OBSERVER_SPECIES_OCTO_V1.id,
  /** Lab/dev — doğrudan walk | trot | idle … */
  foxMotionOverride = null,
  className = ""
}) {
  const mountRef = useRef(null);
  const fracturePhaseRef = useRef(fracturePhaseMs);
  const fieldRef = useRef(fieldState);
  const replyRef = useRef(replyText);
  const draftRef = useRef(draftText);
  const busyRef = useRef(busy);
  const submitPulseRef = useRef(submitPulse);
  const mediaStreamRef = useRef(mediaStream);
  const audioMotionRef = useRef(0);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const audioCtxRef = useRef(null);
  const foxMotionOverrideRef = useRef(foxMotionOverride);
  const runtimeRef = useRef(null);
  const anchorSpeciesRef = useRef(anchorSpeciesId);
  const onLoadRef = useRef(onLoadStateChange);
  const roomHeight = resolveOctoRoomHeightPxV1(height, { max: heightMax });

  fieldRef.current = fieldState;
  replyRef.current = replyText;
  draftRef.current = draftText;
  busyRef.current = busy;
  submitPulseRef.current = submitPulse;
  mediaStreamRef.current = mediaStream;

  useEffect(() => {
    const stream = mediaStream;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      freqDataRef.current = null;
    }
    if (!stream?.getAudioTracks?.().length) return undefined;
    try {
      const ctx = new AudioContext();
      void ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      /* noop */
    }
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      freqDataRef.current = null;
    };
  }, [mediaStream]);
  foxMotionOverrideRef.current = foxMotionOverride;
  onLoadRef.current = onLoadStateChange;
  anchorSpeciesRef.current = anchorSpeciesId;
  fracturePhaseRef.current = Number(fracturePhaseMs) || 0;

  const reportLoad = (state) => {
    onLoadRef.current?.(state);
  };

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    let dead = false;
    const speciesAtMount = anchorSpeciesId;
    const isOctoAnchor = isOctoAnchorSpeciesV0(speciesAtMount);
    const companionBehaviorOnly =
      isCompanionBehaviorOnlyV0(speciesAtMount) && isFoxAnchorSpeciesV0(speciesAtMount);
    const modelUrl = resolveConversationAnchorModelUrlV0(speciesAtMount);
    el.dataset.conversationAnchorSpecies = speciesAtMount;
    el.dataset.companionBehaviorOnly = companionBehaviorOnly ? "1" : "0";
    el.dataset.octoLoadState = "loading";
    reportLoad("loading");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, Math.max(2, el.clientWidth || 400) / roomHeight, 0.05, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !labMode, powerPreference: "high-performance" });
    renderer.setClearColor(labMode ? 0x0a1628 : 0x000000, labMode ? 1 : 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = labMode ? 1.28 : 1.05;

    const resize = () => {
      const w = Math.max(240, el.clientWidth || 400);
      renderer.setSize(w, roomHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      camera.aspect = w / roomHeight;
      camera.updateProjectionMatrix();
      delete camera.userData.rest;
      if (runtimeRef.current?.crystal) {
        if (runtimeRef.current?.isOctoAnchor !== false) {
          aimCubeCentricConversationCameraV1(runtimeRef.current.crystal, camera, w / roomHeight);
        } else if (runtimeRef.current?.root) {
          if (runtimeRef.current?.labMode) {
            aimFoxLabConversationCameraV0(
              runtimeRef.current.crystal,
              runtimeRef.current.root,
              camera,
              w / roomHeight
            );
          } else {
            aimFoxCubeConversationCameraV0(
              runtimeRef.current.crystal,
              runtimeRef.current.root,
              camera,
              w / roomHeight
            );
          }
        }
      }
      runtimeRef.current?.crystal?.setAspect?.(w / roomHeight);
    };
    resize();
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x7788aa, labMode ? 0.85 : 0.65));
    if (labMode) {
      const hemi = new THREE.HemisphereLight(0x88bbff, 0x0a1020, 0.55);
      scene.add(hemi);
    }
    const key = new THREE.DirectionalLight(0xffffff, labMode ? 1.05 : 0.9);
    key.position.set(1.5, 4, 3);
    scene.add(key);
    const accent = new THREE.PointLight(0x00d4ff, 0.55, 8);
    accent.position.set(0, 0.8, 1.5);
    scene.add(accent);

    const foxCompactDock = !isOctoAnchor && !labMode;
    const nest = createOctoYuvaNestV1(scene, { accent: 0x00d4ff, spiral: 0xff6b6b }, { compact: foxCompactDock });
    const crystal = createOctoSpeakingCrystalV1(scene, camera.aspect);
    const placeholder = createOctoPlaceholderV1();
    scene.add(placeholder);

    let root = null;
    let body = null;
    let tentacles = [];
    let glbRig = null;
    let mixer = null;
    let activeAction = null;
    let raf = 0;
    const clock = new THREE.Clock();
    let lastEmotion = "neutral";
    let lastFoxMotion = "idle";
    let lastSubmitPulseSeen = 0;
    let foxEyes = null;

    runtimeRef.current = { nest, crystal, placeholder };

    const playFoxMotionClip = (motionState) => {
      if (!mixer || !runtimeRef.current?.clips?.length) return;
      const clip = pickFoxAnimationClipV1(runtimeRef.current.clips, motionState);
      if (!clip) return;
      if (activeAction?.getClip?.()?.name === clip.name) return;
      activeAction?.fadeOut?.(0.38);
      activeAction = mixer.clipAction(clip);
      activeAction.reset();
      activeAction.setLoop(shouldLoopFoxClipV1(clip) ? THREE.LoopRepeat : THREE.LoopOnce);
      activeAction.clampWhenFinished = !shouldLoopFoxClipV1(clip);
      activeAction.setEffectiveTimeScale(
        foxClipTimeScaleV1(clip, buildDrive(fieldRef.current, replyRef.current, draftRef.current, busyRef.current, speciesAtMount)) * 0.82
      );
      activeAction.fadeIn(0.42).play();
      runtimeRef.current.locomotionActive = isFoxLocomotionClipV1(clip);
      lastFoxMotion = motionState;
    };

    const playEmotionClip = (emotion) => {
      if (!mixer || !runtimeRef.current?.clips?.length) return;
      const clip = pickOctoAnimationClipV1(runtimeRef.current.clips, emotion);
      if (!clip) return;
      if (activeAction?.getClip?.()?.name === clip.name) return;
      activeAction?.fadeOut?.(0.2);
      activeAction = mixer.clipAction(clip);
      activeAction.reset().fadeIn(0.2).play();
    };

    const attachModel = (gltf) => {
      if (dead) return;
      try {
      scene.remove(placeholder);
      root = gltf.scene;
      root.visible = false;
      if (isOctoAnchor) {
        prepareOctoConversationMaterialsV1(root);
        fitOctoConversationModelV1(root);
        tentacles = collectOctoTentacleNodesV1(root);
        glbRig = extractOctoGlbRigV1(root);
        initOctoTouchColorStateV1(root);
      } else {
        fitConversationAnchorInNestV0(root, {
          targetSize: labMode ? 1.08 : 0.84,
          homeX: labMode ? -0.2 : -0.1,
          preserveOriginalMaterials: true,
          baseYaw: labMode ? 0.38 : 0.32
        });
        foxEyes = attachFoxConversationEyesV0(root);
        crystal.group.scale.setScalar(labMode ? 1.14 : 1.12);
        if (crystal.cubeWire?.material) crystal.cubeWire.material.opacity = labMode ? 0.78 : 0.62;
        if (crystal.cubeGlass?.material) {
          crystal.cubeGlass.material.opacity = labMode ? 0.32 : 0.22;
          crystal.cubeGlass.material.emissiveIntensity = labMode ? 0.55 : 0.45;
        }
        if (crystal.linkLines?.material) crystal.linkLines.material.opacity = labMode ? 0.62 : 0.48;
        tentacles = [];
        glbRig = null;
      }
      root.visible = true;
      body = root;
      const grabTentacleIndices = isOctoAnchor ? pickOctoGrabTentacleIndicesV1(tentacles) : [];
      scene.add(root);

      const clips = gltf.animations || [];
      mixer = clips.length ? new THREE.AnimationMixer(root) : null;
      runtimeRef.current = {
        clips: clips || [],
        mixer,
        tentacles,
        grabTentacleIndices,
        glbRig,
        root,
        nest,
        crystal,
        isOctoAnchor,
        speciesId: speciesAtMount,
        locomotionActive: false,
        labMode,
        foxEyes
      };
      if (mixer) {
        if (isOctoAnchor) {
          playEmotionClip("neutral");
          if (activeAction) activeAction.setEffectiveWeight(0.22);
        } else {
          playFoxMotionClip("idle");
          if (activeAction) activeAction.setEffectiveWeight(0.88);
        }
      }

      if (typeof window !== "undefined" && !isOctoAnchor && clips?.length) {
        window.__rhizoh = window.__rhizoh || {};
        window.__rhizoh.foxAnchorClips = clips.map((c) => c.name);
      }

      const drive = buildDrive(fieldRef.current, replyRef.current, draftRef.current, busyRef.current, speciesAtMount);
      if (isOctoAnchor) {
        applyOctoEmotionColorsV1(root, drive.emotion, 1, drive);
        nest.setPalette(drive.accent, 0xff6b6b);
        aimCubeCentricConversationCameraV1(crystal, camera, camera.aspect);
      } else {
        accent.color.setHex(0xfbbf24);
        nest.setPalette(0xfbbf24, 0xd97706);
        if (labMode) {
          aimFoxLabConversationCameraV0(crystal, root, camera, camera.aspect);
        } else {
          aimFoxCubeConversationCameraV0(crystal, root, camera, camera.aspect);
        }
      }
      el.dataset.octoLoadState = "ready";
      reportLoad("ready");
      } catch (err) {
        console.warn("[OctoConversationStageV1] attach failed", err);
        if (!scene.children.includes(placeholder)) scene.add(placeholder);
        el.dataset.octoLoadState = "fallback";
        reportLoad("fallback");
      }
    };

    const loader = new GLTFLoader();
    const tryLoad = () =>
      new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });

    preloadConversationAnchorGlbV0(speciesAtMount)
      .then(attachModel)
      .catch(() => tryLoad().then(attachModel).catch(() => {
        if (!dead) {
          el.dataset.octoLoadState = "error";
          reportLoad("error");
        }
      }));

    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      const delta = clock.getDelta();
      const t = clock.elapsedTime + fracturePhaseRef.current / 1000;
      if (analyserRef.current && freqDataRef.current) {
        analyserRef.current.getByteFrequencyData(freqDataRef.current);
        audioMotionRef.current = sampleOctoMediaAudioBandsV0(freqDataRef.current).motion;
      } else {
        audioMotionRef.current *= 0.92;
      }
      const drive = buildDrive(
        fieldRef.current,
        replyRef.current,
        draftRef.current,
        busyRef.current,
        speciesAtMount,
        readOctoLabPerformanceIntensityV1(),
        audioMotionRef.current
      );

      maybePublishOctoYuvaActivationV1(drive, { source: "octo_conversation_stage" });

      if (drive.emotion !== lastEmotion) {
        lastEmotion = drive.emotion;
        if (runtimeRef.current?.isOctoAnchor !== false) {
          playEmotionClip(drive.emotion);
        }
      }

      if (
        runtimeRef.current?.isOctoAnchor === false &&
        submitPulseRef.current > 0 &&
        submitPulseRef.current !== lastSubmitPulseSeen
      ) {
        lastSubmitPulseSeen = submitPulseRef.current;
        playFoxMotionClip("settle");
      }

      nest.update(delta, t, drive);
      nest.setPalette(drive.accent, 0xff6b6b);
      accent.intensity = drive.live ? 0.45 + drive.activation * 0.55 : 0.35;

      const rt = runtimeRef.current;
      const activeRoot = rt?.root ?? null;
      const activeGlbRig = rt?.glbRig ?? null;
      const activeTentacles = rt?.tentacles ?? tentacles;
      const activeMixer = rt?.mixer ?? mixer;

      if (!activeRoot) {
        if (!drive.live) {
          placeholder.position.set(0, 0.18, 0);
          placeholder.rotation.set(0, 0, 0);
          placeholder.scale.setScalar(0.62);
        }
      } else if (rt?.isOctoAnchor === false) {
        try {
          const carry = updateOctoSpeakingCrystalV1(
            crystal,
            drive,
            delta,
            t,
            camera.aspect,
            submitPulseRef.current,
            draftRef.current,
            replyRef.current,
            { fieldState: fieldRef.current }
          );
          if (activeMixer) {
            activeMixer.update(delta);
            if (activeAction) {
              activeAction.setEffectiveWeight(
                drive.live || carry.sessionSwim ? 0.92 : 0.82
              );
            }
          }
          const spatial = animateFoxCompanionSpatialV1(
            activeRoot,
            t,
            drive,
            delta,
            carry,
            crystal,
            { motionOverride: foxMotionOverrideRef.current }
          );
          const foxMotion = spatial.motionState ?? resolveFoxMotionStateV1(drive, spatial);
          if (foxMotion !== lastFoxMotion && foxMotion !== "settle") {
            playFoxMotionClip(foxMotion);
          }
          updateFoxConversationEyesV0(rt?.foxEyes ?? foxEyes, t, delta, drive);
          nest.setPalette(drive.live ? 0xfbbf24 : 0xf59e0b, 0xd97706);
          activeRoot.updateMatrixWorld(true);
          updateFoxCubeConversationCameraV0(
            crystal,
            activeRoot,
            camera,
            delta,
            drive,
            camera.aspect
          );
        } catch (err) {
          console.warn("[OctoConversationStageV1] fox tick failed", err);
        }
      } else {
        try {
          const carry = updateOctoSpeakingCrystalV1(
            crystal,
            drive,
            delta,
            t,
            camera.aspect,
            submitPulseRef.current,
            draftRef.current,
            replyRef.current,
            { fieldState: fieldRef.current }
          );
          if (activeMixer) {
            if (activeAction) {
              activeAction.setEffectiveWeight(
                drive.live || carry.sessionSwim || carry.allowBodySwim ? 0.52 : 0.85
              );
            }
            activeMixer.update(delta);
          }
          const swimVel = animateOctoBodyV1(activeRoot, t, drive, delta, carry) || {};
          activeRoot.updateMatrixWorld(true);
          if (activeGlbRig) {
            animateOctoGlbRigV1(activeGlbRig, t, drive, carry, delta);
          } else if (activeTentacles.length) {
            animateOctoTentaclesV1(activeTentacles, t, drive, carry);
          }
          const colorState = stepOctoTouchColorStateV1(activeRoot, carry, delta);
          if (
            carry.continuousColor ||
            carry.sessionSwim ||
            isOctoTouchColorLockedV1(activeRoot) ||
            colorState.tentacleProgress > 0.03
          ) {
            applyOctoTouchColorV1(activeRoot, colorState, delta);
          } else if (!drive.live && !carry.allowBodySwim) {
            applyOctoEmotionColorsV1(activeRoot, drive.emotion, 0.05, drive);
          } else {
            applyOctoTouchColorV1(activeRoot, colorState, delta);
          }
          updateCubeCentricConversationCameraV1(
            crystal,
            camera,
            delta,
            drive,
            crystal.engine?.currentTopology ?? {}
          );
        } catch (err) {
          console.warn("[OctoConversationStageV1] tick failed", err);
        }
      }

      publishFoxAnchorFrameBindingV0({
        atMs: Date.now(),
        speciesId: anchorSpeciesRef.current,
        mountId: labMode ? "octo_lab" : "conversation_dock"
      });

      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposeFoxConversationEyesV0(foxEyes);
      activeAction?.stop?.();
      mixer?.stopAllAction?.();
      nest.dispose();
      crystal.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) m.dispose?.();
        }
      });
      runtimeRef.current = null;
    };
  }, [roomHeight, labMode, anchorSpeciesId]);

  return (
    <div
      className={`pointer-events-none relative z-[2] w-full overflow-hidden rounded-t-2xl border border-b-0 border-cyan-400/25 ${
        labMode ? "bg-[#0a1628]" : "bg-[#0a1628]"
      } ${className}`}
      style={{ height: roomHeight }}
      data-octo-conversation-stage="1"
      data-conversation-anchor-species={anchorSpeciesId}
      data-companion-behavior-only={isCompanionBehaviorOnlyV0(anchorSpeciesId) ? "1" : "0"}
      data-octo-room={labMode ? "lab" : "compact-default"}
      data-field-state={fieldState}
      aria-hidden={!labMode}
    >
      <div
        ref={mountRef}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full [&>canvas]:pointer-events-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      />
    </div>
  );
});
