import React, { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "./assetRegistryV1.js";
import { aimCameraAtGltfPreviewV0, fitGltfSceneForPreviewV0 } from "./fitGltfSceneForPreviewV0.js";

/** Preview tuning — Octo blue-ringed in chat chrome */
export const OCTO_AVATAR_PREVIEW_TUNING_V0 = Object.freeze({
  targetSize: 1.85,
  tint: 0x5eead4,
  emissive: 0x22d3ee,
  emissiveIntensity: 0.55,
  cameraFov: 32
});

/**
 * Compact animated Octo GLB for conversation chrome.
 * @param {{ size?: number, fieldState?: string, className?: string }} props
 */
export const OctoBlueRingedAvatarV0 = memo(function OctoBlueRingedAvatarV0({
  size = 72,
  fieldState = "idle",
  className = ""
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const fieldRef = useRef(fieldState);
  const [loadState, setLoadState] = useState("loading");
  fieldRef.current = fieldState;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    let dead = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(OCTO_AVATAR_PREVIEW_TUNING_V0.cameraFov, 1, 0.01, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xa5f3fc, 1.15);
    key.position.set(2, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf472b6, 0.35);
    rim.position.set(-2, 1, -2);
    scene.add(rim);

    let root = null;
    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      const t = (now - start) / 1000;
      const fs = fieldRef.current;
      const active =
        fs === "listening" ||
        fs === "thinking" ||
        fs === "speaking" ||
        fs === "interpreting" ||
        fs === "generating" ||
        fs === "LISTENING" ||
        fs === "THINKING" ||
        fs === "SPEAKING";
      if (root) {
        root.rotation.y = Math.sin(t * (active ? 0.95 : 0.4)) * (active ? 0.28 : 0.1);
        const baseY = root.userData.baseY ?? 0;
        root.position.y = baseY + Math.sin(t * 1.5) * (active ? 0.08 : 0.03);
      }
      renderer.render(scene, camera);
    };

    const loader = new GLTFLoader();
    loader.load(
      ASSETS.octo,
      (gltf) => {
        if (dead) return;
        root = gltf.scene;
        fitGltfSceneForPreviewV0(root, OCTO_AVATAR_PREVIEW_TUNING_V0);
        root.userData.baseY = root.position.y;
        scene.add(root);
        aimCameraAtGltfPreviewV0(root, camera);
        sceneRef.current = { root, renderer, camera, scene };
        setLoadState("ready");
        tick(start);
      },
      undefined,
      () => {
        if (dead) return;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshStandardMaterial({
            color: OCTO_AVATAR_PREVIEW_TUNING_V0.tint,
            emissive: OCTO_AVATAR_PREVIEW_TUNING_V0.emissive,
            emissiveIntensity: 0.5
          })
        );
        root = cube;
        scene.add(cube);
        camera.position.set(0, 0.3, 2.2);
        camera.lookAt(0, 0.2, 0);
        setLoadState("fallback");
        tick(start);
      }
    );

    sceneRef.current = { renderer, camera, scene };

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) m.dispose?.();
        }
      });
      sceneRef.current = null;
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={`relative shrink-0 overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-b from-cyan-950/80 to-black/70 shadow-[0_0_20px_rgba(34,211,238,0.2)] ${className}`}
      style={{ width: size, height: size }}
      data-octo-conversation-avatar="1"
      data-field-state={fieldState}
      data-load-state={loadState}
      aria-hidden
    >
      {loadState === "loading" ? (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-cyan-300/50">
          …
        </span>
      ) : null}
    </div>
  );
});
