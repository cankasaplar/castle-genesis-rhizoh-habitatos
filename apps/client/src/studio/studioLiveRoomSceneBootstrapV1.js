import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { installWebglContextLostReporter } from "../boot/castleCrashTelemetry.js";
import { ASSETS, STUDIO_ASSET_MANIFEST_V1 } from "./assetRegistryV1.js";
import { applyStudioPresenceVisualToRootV1 } from "./studioLiveRoomPresenceVisualV1.js";

const PLACEMENT_V1 = Object.freeze({
  rhizoh: { x: -0.8, z: -4, height: 2.4, layer: "stage" },
  octo: { x: 2.2, z: -1.2, height: 2.2, layer: "stage" },
  fox: { x: -5.5, z: 3.5, height: 0.9, layer: "ambient" },
  medusa: { x: -4, z: 5.5, height: 2.8, layer: "ambient" },
  robot: { x: 5, z: 4.5, height: 2.1, layer: "ambient" }
});

function fitModelToHeight(root, targetHeight) {
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

function makeFallbackCube(color, height = 1.2) {
  const geo = new THREE.BoxGeometry(0.5, height, 0.5);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.35,
    metalness: 0.3,
    roughness: 0.55
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  return mesh;
}

function loadGltf(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/**
 * @param {HTMLElement} container
 * @param {{ onAssetStatus?: (status: object) => void }} [opts]
 */
export async function bootstrapStudioLiveRoomSceneV1(container, opts = {}) {
  const onStatus = opts.onAssetStatus || (() => {});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060810);
  scene.fog = new THREE.FogExp2(0x060810, 0.022);

  const w = Math.max(320, container.clientWidth || 640);
  const h = Math.max(240, container.clientHeight || 480);
  const camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 220);
  camera.position.set(6, 5, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  installWebglContextLostReporter(renderer.domElement, "studio_live_room_v1");

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.minDistance = 2.5;
  controls.maxDistance = 32;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.4, -2);
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xcffafe, 1.05);
  key.position.set(6, 14, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x22d3ee, 0.4);
  rim.position.set(-6, 8, -8);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92, metalness: 0.04 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  scene.add(new THREE.GridHelper(28, 28, 0x1e3a5f, 0x0f172a));

  const stageRing = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.1, 64),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  stageRing.rotation.x = -Math.PI / 2;
  stageRing.position.set(-0.2, 0.03, -2.6);
  scene.add(stageRing);

  const loader = new GLTFLoader();
  /** @type {Record<string, THREE.Object3D>} */
  const entities = {};
  /** @type {{ key: string, ok: boolean, url: string, error?: string }[]} */
  const loadReport = [];

  const fallbackColors = {
    rhizoh: 0x22d3ee,
    octo: 0xf472b6,
    fox: 0xfbbf24,
    medusa: 0xa78bfa,
    robot: 0x94a3b8
  };

  for (const entry of STUDIO_ASSET_MANIFEST_V1) {
    const place = PLACEMENT_V1[entry.key];
    let root;
    try {
      const gltf = await loadGltf(loader, entry.url);
      root = gltf.scene;
      fitModelToHeight(root, place.height);
      loadReport.push({ key: entry.key, ok: true, url: entry.url });
    } catch (err) {
      root = makeFallbackCube(fallbackColors[entry.key] || 0x64748b, place.height * 0.5);
      loadReport.push({
        key: entry.key,
        ok: false,
        url: entry.url,
        error: String(err?.message || err)
      });
    }

    root.position.set(place.x, 0, place.z);
    root.userData.studioKey = entry.key;
    root.userData.studioLayer = place.layer;
    root.userData.studioRole = entry.role;
    root.userData.interactionDisabled = place.layer === "ambient";

    if (place.layer === "ambient") {
      root.traverse((o) => {
        if (o.isMesh) {
          o.renderOrder = 0;
          if (o.material && !Array.isArray(o.material)) {
            o.material.transparent = true;
            o.material.opacity = Math.min(0.92, o.material.opacity ?? 1);
          }
        }
      });
    } else {
      root.traverse((o) => {
        if (o.isMesh) o.renderOrder = 10;
      });
    }

    scene.add(root);
    entities[entry.key] = root;
    onStatus({ type: "asset", entry, ok: loadReport[loadReport.length - 1].ok });
  }

  applyStudioPresenceVisualToRootV1(entities.rhizoh, "observing");
  applyStudioPresenceVisualToRootV1(entities.octo, "observing");

  return {
    schema: "castle.studio.scene_bootstrap.v1",
    scene,
    camera,
    renderer,
    controls,
    entities,
    loadReport,
    assets: ASSETS,
    dispose() {
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose?.();
        }
      });
    },
    resize() {
      const rw = Math.max(320, container.clientWidth || 640);
      const rh = Math.max(240, container.clientHeight || 480);
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    }
  };
}
