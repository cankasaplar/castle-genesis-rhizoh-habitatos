import React, { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "../studio/assetRegistryV1.js";

function makeMedusaFallbackV0() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6d28d9,
    emissive: 0xa78bfa,
    emissiveIntensity: 0.45,
    metalness: 0.35,
    roughness: 0.5
  });
  const bust = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.7, 12), mat);
  bust.position.y = 0.35;
  g.add(bust);
  for (let i = 0; i < 6; i += 1) {
    const snake = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 10), mat);
    snake.position.set(Math.cos(i) * 0.25, 0.75 + i * 0.02, Math.sin(i) * 0.25);
    snake.rotation.x = Math.PI / 2;
    g.add(snake);
  }
  g.scale.setScalar(0.9);
  return g;
}

/**
 * Bottom-left Medusa companion — motion-responsive placeholder for media camera.
 * Properties / lore TBD; placement + reactivity first.
 */
export const MedusaCompanionOverlayV0 = memo(function MedusaCompanionOverlayV0({
  active = false,
  mediaStream = null,
  className = ""
}) {
  const hostRef = useRef(null);
  const streamRef = useRef(mediaStream);
  streamRef.current = mediaStream;

  useEffect(() => {
    if (!active || !hostRef.current) return undefined;
    const container = hostRef.current;
    const w = 112;
    const h = 112;

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

    let root = makeMedusaFallbackV0();
    scene.add(root);

    const loader = new GLTFLoader();
    loader.load(
      ASSETS.ambient.medusa,
      (gltf) => {
        scene.remove(root);
        root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const scale = 0.85 / (size.y || 1);
        root.scale.setScalar(scale);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center.multiplyScalar(scale));
        root.position.y += 0.1;
        scene.add(root);
      },
      undefined,
      () => {
        /* keep fallback */
      }
    );

    let raf = 0;
    let t = 0;
    let motion = 0;
    let audioCtx = null;
    let analyser = null;

    if (mediaStream?.getAudioTracks?.().length) {
      try {
        audioCtx = new AudioContext();
        const src = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
      } catch {
        /* noop */
      }
    }

    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

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
      const sway = 0.08 + motion * 0.35;
      root.rotation.y = Math.sin(t * 1.2) * sway;
      root.rotation.z = Math.sin(t * 0.9) * sway * 0.35;
      root.position.y = Math.sin(t * 1.6) * (0.02 + motion * 0.06);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      if (audioCtx) void audioCtx.close();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [active, mediaStream]);

  if (!active) return null;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute bottom-3 left-3 z-20 overflow-hidden rounded-2xl border border-violet-400/35 bg-violet-950/30 shadow-[0_0_24px_rgba(139,92,246,0.25)] backdrop-blur-sm ${className}`}
      style={{ width: 112, height: 112 }}
      data-rhizoh-medusa-companion="1"
      aria-hidden
    />
  );
});
