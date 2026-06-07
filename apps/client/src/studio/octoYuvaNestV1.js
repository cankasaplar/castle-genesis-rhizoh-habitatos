/**
 * Compact Octo "yuva" nest — from Desktop `yuva.js` + `main.js` updateYuvalar().
 * Energy rings, spiral floor, pulsing core; activation driven by conversation drive.
 */

import * as THREE from "three";

function drawSpiralTexture(ctx, size, colorHex) {
  ctx.clearRect(0, 0, size, size);
  const c = new THREE.Color(colorHex);
  ctx.strokeStyle = `#${c.getHexString()}`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < 420; i++) {
    const angle = 0.12 * i;
    const r = 8 + angle * 1.8;
    const x = size / 2 + r * Math.cos(angle);
    const y = size / 2 + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * @param {THREE.Scene} scene
 * @param {{ accent?: number, spiral?: number }} [palette]
 */
export function createOctoYuvaNestV1(scene, palette = {}, opts = {}) {
  const accent = palette.accent ?? 0x00d4ff;
  const spiral = palette.spiral ?? 0xff6b6b;
  const compact = Boolean(opts.compact);
  const ringScale = compact ? 0.44 : 1;

  const group = new THREE.Group();
  group.name = "octoYuvaNest";

  /** @type {{ mesh: THREE.Mesh, spinSign: number }[]} */
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const inner = (0.5 + i * 0.16) * ringScale;
    const outer = inner + 0.055 * ringScale;
    const geo = new THREE.RingGeometry(inner, outer, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? accent : spiral,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.2 - i * 0.012;
    group.add(mesh);
    rings.push({ mesh, spinSign: i % 2 === 0 ? 1 : -1 });
  }

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) drawSpiralTexture(ctx, size, accent);
  const spiralTex = new THREE.CanvasTexture(canvas);
  spiralTex.colorSpace = THREE.SRGBColorSpace;

  const floorMat = new THREE.MeshBasicMaterial({
    map: spiralTex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const spiralFloor = new THREE.Mesh(new THREE.CircleGeometry(1.35 * ringScale, 64), floorMat);
  spiralFloor.rotation.x = -Math.PI / 2;
  spiralFloor.position.y = -0.19;
  group.add(spiralFloor);

  const coreMat = new THREE.MeshBasicMaterial({
    color: spiral,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), coreMat);
  core.position.set(0, -0.16, 0.12);
  group.add(core);

  const nestLight = new THREE.PointLight(accent, 0, 6);
  nestLight.position.set(0, 0.2, 0.5);
  group.add(nestLight);

  scene.add(group);

  return {
    group,
    rings,
    spiralFloor,
    spiralTex,
    core,
    nestLight,
    /**
     * @param {number} delta
     * @param {number} t
     * @param {{ activation?: number, speed?: number, reach?: number, coil?: number }} drive
     */
    update(delta, t, drive = {}) {
      const act = drive.activation ?? 0.35;
      const spd = drive.speed ?? 1;
      const reach = drive.reach ?? 0.4;

      rings.forEach((r, i) => {
        r.mesh.rotation.z += delta * (0.28 + reach * 0.2) * r.spinSign * spd * act;
        const target = 0.08 + act * (0.1 + i * 0.035) + reach * 0.08;
        r.mesh.material.opacity += (target - r.mesh.material.opacity) * 0.09;
        const scale = 1 + Math.sin(t * spd + i) * 0.02 * act;
        r.mesh.scale.set(scale, scale, scale);
      });

      if (spiralTex) spiralTex.rotation += delta * (0.18 + reach * 0.12) * act * spd;
      const floorTarget = Math.max(0.05, act * (0.15 + reach * 0.1));
      floorMat.opacity += (floorTarget - floorMat.opacity) * 0.07;

      const pulse = 0.3 + Math.sin(t * spd * 2.2) * 0.25 * act;
      coreMat.opacity += (pulse - coreMat.opacity) * 0.1;
      const coreScale = 0.7 + act * 0.6 + Math.sin(t * 3.5 * spd) * 0.12;
      core.scale.setScalar(coreScale);

      const lightTarget = act * (0.35 + reach * 0.4);
      nestLight.intensity += (lightTarget - nestLight.intensity) * 0.08;
      nestLight.color.lerp(new THREE.Color(accent), 0.05);
    },
    setPalette(accentHex, spiralHex) {
      if (ctx) drawSpiralTexture(ctx, size, accentHex);
      spiralTex.needsUpdate = true;
      nestLight.color.setHex(accentHex);
      coreMat.color.setHex(spiralHex);
      rings.forEach((r, i) => r.mesh.material.color.setHex(i % 2 === 0 ? accentHex : spiralHex));
    },
    dispose() {
      scene.remove(group);
      rings.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
      });
      spiralFloor.geometry.dispose();
      floorMat.dispose();
      spiralTex.dispose();
      core.geometry.dispose();
      coreMat.dispose();
    }
  };
}
