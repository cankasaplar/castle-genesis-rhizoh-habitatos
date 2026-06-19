import React, { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "../studio/assetRegistryV1.js";
import { aimCameraAtGltfPreviewV0, fitGltfSceneForPreviewV0 } from "../studio/fitGltfSceneForPreviewV0.js";
import { pickFoxAnimationClipV1 } from "../studio/foxConversationMotionV1.js";
import {
  fitOctoConversationModelV1,
  pickOctoAnimationClipV1,
  prepareOctoConversationMaterialsV1
} from "../studio/octoConversationMotionV1.js";

const ACTOR_TUNING_V0 = Object.freeze({
  octo: Object.freeze({
    url: ASSETS.octo,
    tint: 0x5eead4,
    emissive: 0x22d3ee,
    targetSize: 1.65,
    motion: "idle"
  }),
  fox: Object.freeze({
    url: ASSETS.ambient.fox,
    tint: 0xfbbf24,
    emissive: 0xf59e0b,
    targetSize: 1.55,
    motion: "idle"
  })
});

/**
 * Mini GLB nest preview for Octo / Fox camera lab (replaces emoji placeholders).
 */
export const ActorGlbNestPreviewV0 = memo(function ActorGlbNestPreviewV0({
  actor = "octo",
  tr = false,
  compact = false,
  facing = "other",
  className = ""
}) {
  const mountRef = useRef(null);
  const [loadState, setLoadState] = useState("loading");
  const isOcto = actor === "octo";
  const tuning = isOcto ? ACTOR_TUNING_V0.octo : ACTOR_TUNING_V0.fox;
  const label = isOcto
    ? tr
      ? "Octo · karşı yuva"
      : "Octo · counterpart nest"
    : tr
      ? "Fox · karşı yuva"
      : "Fox · counterpart nest";

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    let dead = false;
    let raf = 0;
    let mixer = null;
    let activeAction = null;

    const w = compact ? 160 : 240;
    const h = compact ? 112 : 160;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, w / h, 0.01, 80);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const key = new THREE.DirectionalLight(isOcto ? 0xa5f3fc : 0xfcd34d, 1.1);
    key.position.set(2, 4, 3);
    scene.add(key);

    const clock = new THREE.Clock();
    let root = null;

    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      mixer?.update(dt);
      if (root) {
        const t = performance.now() / 1000;
        root.rotation.y = Math.sin(t * 0.45) * 0.12;
      }
      renderer.render(scene, camera);
    };
    tick();

    new GLTFLoader().load(
      tuning.url,
      (gltf) => {
        if (dead) return;
        root = gltf.scene;
        if (isOcto) {
          prepareOctoConversationMaterialsV1(root);
          fitOctoConversationModelV1(root, { targetSize: tuning.targetSize * 0.28 });
        } else {
          fitGltfSceneForPreviewV0(root, {
            targetSize: tuning.targetSize,
            tint: tuning.tint,
            emissive: tuning.emissive,
            emissiveIntensity: 0.38
          });
        }
        scene.add(root);
        aimCameraAtGltfPreviewV0(root, camera);
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(root);
          const clip = isOcto
            ? pickOctoAnimationClipV1(gltf.animations, "neutral")
            : pickFoxAnimationClipV1(gltf.animations, "idle");
          if (clip) {
            activeAction = mixer.clipAction(clip);
            activeAction.reset().fadeIn(0.35).play();
          }
        }
        setLoadState("ready");
      },
      undefined,
      () => {
        if (!dead) setLoadState("fallback");
      }
    );

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      activeAction?.stop?.();
      mixer = null;
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [actor, compact, isOcto, tuning]);

  return (
    <div
      className={`flex flex-col items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-br ${
        isOcto
          ? "border-cyan-400/35 from-cyan-950/50 to-black/70"
          : "border-amber-400/35 from-amber-950/50 to-black/70"
      } ${compact ? "min-h-[7rem] p-2" : "min-h-[10rem] p-4"} ${className}`}
      data-rhizoh-octo-lab-facing={facing}
      data-rhizoh-octo-lab-actor={actor}
      data-rhizoh-glb-load={loadState}
    >
      <div
        ref={mountRef}
        className={`flex items-center justify-center ${compact ? "h-28 w-40" : "h-40 w-60"}`}
        aria-hidden
      />
      {loadState === "fallback" ? (
        <p className="text-2xl">{isOcto ? "🐙" : "🦊"}</p>
      ) : null}
      <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/80">
        {label}
      </p>
      <p className="mt-0.5 text-center text-[9px] normal-case text-white/45">
        {loadState === "loading"
          ? tr
            ? "Model yükleniyor…"
            : "Loading model…"
          : tr
            ? "GLB önizleme"
            : "GLB preview"}
      </p>
    </div>
  );
});
