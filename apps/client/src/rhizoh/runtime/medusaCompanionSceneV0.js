/**
 * Medusa companion scene — shared Three.js mesh builder (overlay + studio).
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "../../studio/assetRegistryV1.js";

export const MEDUSA_COMPANION_DEFAULT_SIZE_V0 = 136;
/** Face camera (+Z) when GLTF default profile faces +X. */
export const MEDUSA_COMPANION_FACE_Y_V0 = -Math.PI / 2;

export function makeMedusaFallbackMeshV0() {
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
    snake.userData.medusaSnake = true;
    snake.userData.snakePhase = i * 0.9;
    g.add(snake);
  }
  g.scale.setScalar(0.9);
  g.rotation.y = MEDUSA_COMPANION_FACE_Y_V0;
  return g;
}

/**
 * @param {THREE.Scene} scene
 * @param {(root: THREE.Object3D) => void} onRoot
 */
export function loadMedusaCompanionModelV0(scene, onRoot) {
  let root = makeMedusaFallbackMeshV0();
  scene.add(root);
  onRoot(root);

  const loader = new GLTFLoader();
  loader.load(
    ASSETS.ambient.medusa,
    (gltf) => {
      scene.remove(root);
      root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = 0.92 / (size.y || 1);
      root.scale.setScalar(scale);
      const center = new THREE.Vector3();
      box.getCenter(center);
      root.position.sub(center.multiplyScalar(scale));
      root.position.y += 0.08;
      root.rotation.y = MEDUSA_COMPANION_FACE_Y_V0;
      root.traverse((obj) => {
        const name = String(obj.name || "").toLowerCase();
        if (obj.userData?.medusaSnake || /snake|hair|serpent|lock/.test(name)) {
          obj.userData.medusaSnake = true;
          if (obj.userData.snakePhase == null) {
            obj.userData.snakePhase = Math.random() * Math.PI * 2;
          }
        }
      });
      scene.add(root);
      onRoot(root);
    },
    undefined,
    () => {
      /* keep fallback */
    }
  );
}
