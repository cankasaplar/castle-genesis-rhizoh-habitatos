import * as THREE from "three";

/**
 * Fit + tint a loaded GLTF scene for small preview viewers.
 * @param {THREE.Object3D} root
 * @param {{ targetSize?: number, tint?: number, emissive?: number, emissiveIntensity?: number }} [opts]
 */
export function fitGltfSceneForPreviewV0(root, opts = {}) {
  const targetSize = opts.targetSize ?? 1.4;
  const tint = opts.tint ?? 0x67e8f9;
  const emissive = opts.emissive ?? 0x22d3ee;
  const emissiveIntensity = opts.emissiveIntensity ?? 0.42;

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const s = targetSize / maxDim;
  root.scale.setScalar(s);
  root.position.set(-center.x * s, -center.y * s + targetSize * 0.42, -center.z * s);

  const tintColor = new THREE.Color(tint);
  const emColor = new THREE.Color(emissive);

  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      mat.side = THREE.DoubleSide;
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.needsUpdate = true;
      }
      if (mat.color) mat.color.lerp(tintColor, 0.22);
      if (!mat.emissive) mat.emissive = new THREE.Color();
      mat.emissive.copy(emColor);
      mat.emissiveIntensity = emissiveIntensity;
      mat.metalness = Math.min(mat.metalness ?? 0.2, 0.45);
      mat.roughness = Math.max(mat.roughness ?? 0.5, 0.35);
      mat.needsUpdate = true;
    }
  });

  return { scale: s, maxDim };
}

/**
 * @param {THREE.Object3D} root
 * @param {THREE.PerspectiveCamera} camera
 */
export function aimCameraAtGltfPreviewV0(root, camera) {
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const radius = Math.max(size.length() * 0.5, 0.5);
  camera.position.set(center.x, center.y + radius * 0.35, center.z + radius * 2.1);
  camera.near = 0.01;
  camera.far = Math.max(radius * 12, 50);
  camera.lookAt(center.x, center.y + size.y * 0.15, center.z);
  camera.updateProjectionMatrix();
}
