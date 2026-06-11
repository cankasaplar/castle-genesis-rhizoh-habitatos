import React, { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { installWebglContextLostReporter } from "../boot/castleCrashTelemetry.js";
import { RhizohThoughtField3DV0 } from "../rhizoh/runtime/RhizohThoughtField3DV0.jsx";
import {
  CASTLE_PWE_EVENT_V0,
  readCastlePweV0
} from "../castleFlight/castlePersistentWorldEntityV0.js";
import {
  defaultStudioLiveRoomModelUrlsV0,
  resolveStudioModelUrlV0
} from "./resolveStudioModelUrlV0.js";

const ZONE = Object.freeze({
  stage: { x: 0, z: -4, label: "Stage" },
  conversation: { x: 3.5, z: 0, label: "Conversation" },
  light: { x: -3.5, z: 2, label: "Light" }
});

function fitModelToHeight(root, targetHeight = 2.2) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const h = size.y || 1;
  const s = targetHeight / h;
  root.scale.setScalar(s);
  const center = new THREE.Vector3();
  box.getCenter(center);
  root.position.sub(center.multiplyScalar(s));
}

/**
 * Single Studio Scene MVP — Three.js only, no Cesium.
 * Route: `/studio-live`
 */
export const StudioLiveRoomV0 = memo(function StudioLiveRoomV0() {
  const mountRef = useRef(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadDetail, setLoadDetail] = useState("");
  const [rhizohField, setRhizohField] = useState("IDLE");

  useEffect(() => {
    const onPwe = () => {
      const pwe = readCastlePweV0();
      const st = pwe?.presence?.state;
      if (st === "speaking" || st === "reacting") setRhizohField("SPEAKING");
      else if (st === "observing" || st === "waiting") setRhizohField("OBSERVING");
      else setRhizohField("IDLE");
    };
    window.addEventListener(CASTLE_PWE_EVENT_V0, onPwe);
    onPwe();
    return () => window.removeEventListener(CASTLE_PWE_EVENT_V0, onPwe);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    const urls = defaultStudioLiveRoomModelUrlsV0();
    const pwe = readCastlePweV0();
    const stageAvatarUrl = resolveStudioModelUrlV0(pwe?.render?.modelRef) || urls.shane;

    let dead = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.028);

    const w = Math.max(320, el.clientWidth || 640);
    const h = Math.max(240, el.clientHeight || 480);
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 200);
    camera.position.set(6, 5.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    installWebglContextLostReporter(renderer.domElement, "studio_live_room");

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 3;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xcffafe, 1.1);
    key.position.set(6, 12, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x22d3ee, 0.45);
    rim.position.set(-5, 6, -6);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 18),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x0c1524,
        emissiveIntensity: 0.25,
        roughness: 0.92,
        metalness: 0.05
      })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x1e3a5f, 0x0f172a);
    grid.position.y = 0.01;
    scene.add(grid);

    const zoneMat = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.35,
        roughness: 0.8
      });

    const stagePad = new THREE.Mesh(new THREE.CircleGeometry(2.8, 48), zoneMat(0x4c1d95));
    stagePad.rotation.x = -Math.PI / 2;
    stagePad.position.set(ZONE.stage.x, 0.02, ZONE.stage.z);
    scene.add(stagePad);

    const convPad = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), zoneMat(0x0e7490));
    convPad.rotation.x = -Math.PI / 2;
    convPad.position.set(ZONE.conversation.x, 0.02, ZONE.conversation.z);
    scene.add(convPad);

    const lightPad = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), zoneMat(0xf59e0b));
    lightPad.rotation.x = -Math.PI / 2;
    lightPad.position.set(ZONE.light.x, 0.02, ZONE.light.z);
    scene.add(lightPad);

    const loader = new GLTFLoader();
    const entities = [];

    const placeLoaded = (gltf, zoneKey, label) => {
      const root = gltf.scene;
      fitModelToHeight(root, zoneKey === "conversation" ? 2.4 : 2);
      const z = ZONE[zoneKey];
      root.position.set(z.x, 0, z.z);
      root.userData.studioLabel = label;
      scene.add(root);
      entities.push(root);
      return root;
    };

    const loadOne = (url, zoneKey, label) =>
      new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(placeLoaded(gltf, zoneKey, label)),
          undefined,
          (err) => reject(err)
        );
      });

    let raf = 0;
    const clock = new THREE.Clock();

    const startLoop = () => {
      const tick = () => {
        if (dead) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        for (const root of entities) {
          if (root.userData.studioLabel === "Octo") {
            root.rotation.y = Math.sin(t * 0.35) * 0.08;
          } else {
            root.rotation.y = Math.sin(t * 0.22) * 0.05;
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      tick();
    };

    Promise.all([
      loadOne(stageAvatarUrl, "stage", "Stage avatar"),
      loadOne(urls.octo, "conversation", "Octo")
    ])
      .then(() => {
        if (dead) return;
        setLoadState("ready");
        setLoadDetail("");
        startLoop();
      })
      .catch((err) => {
        if (dead) return;
        setLoadState("error");
        setLoadDetail(String(err?.message || err));
      });

    const onResize = () => {
      const rw = Math.max(320, el.clientWidth || 640);
      const rh = Math.max(240, el.clientHeight || 480);
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose?.();
        }
      });
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[40] flex flex-col bg-[#060810] text-white"
      data-studio-live-room="1"
    >
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="pointer-events-auto rounded-lg border border-cyan-400/30 bg-black/50 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
            Studio Live Room
          </p>
          <p className="text-[9px] text-white/55">Three.js · GLB · orbit camera</p>
        </div>
        <a
          href="/"
          className="pointer-events-auto rounded border border-white/20 bg-black/40 px-2 py-1 text-[10px] text-white/80 hover:bg-white/10"
        >
          ← Rhizoh
        </a>
      </header>

      <div ref={mountRef} className="min-h-0 flex-1 w-full" />

      {loadState === "loading" ? (
        <p className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 text-[10px] text-white/60">
          GLB yükleniyor (stage avatar + Octo)…
        </p>
      ) : null}
      {loadState === "error" ? (
        <p className="absolute bottom-20 left-1/2 z-10 max-w-md -translate-x-1/2 rounded border border-red-400/40 bg-red-950/80 px-3 py-2 text-center text-[10px] text-red-100">
          Model yüklenemedi: {loadDetail}
        </p>
      ) : null}

      <RhizohThoughtField3DV0
        activeSurface="studio"
        rhizohFieldState={rhizohField}
        expanded={loadState === "ready"}
      />

      <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/45 px-4 py-2 text-[8px] text-white/45 font-mono">
        stage · conversation · light — rh-glowing + octo-blue-ringed
      </footer>
    </div>
  );
});
