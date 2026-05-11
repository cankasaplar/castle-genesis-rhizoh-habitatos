/**
 * vNext-540 — Regional field volumes: truth / contradiction / legitimacy / novelty / memory → Three materials.
 */

import * as THREE from "three";
import { fieldSampleToCell } from "../kernel/render/fieldAtlasBuilder.js";
import { sampleConstitutionalWeather } from "../kernel/render/constitutionalWeather.js";

/**
 * @typedef {import("./istanbulBiomePresetV540.js").IstanbulDistrictAnchor} IstanbulDistrictAnchor
 */

export class FieldVolumeMesh {
  /**
   * @param {object} options
   * @param {IstanbulDistrictAnchor[]} [options.districts]
   */
  constructor(options = {}) {
    /** @type {IstanbulDistrictAnchor[]} */
    this.districts = options.districts || [];
    this.group = new THREE.Group();
    this.group.name = "FieldVolumeMeshV540";
    /** @type {{ mesh: THREE.Mesh, mini: THREE.Mesh, district: IstanbulDistrictAnchor }[]} */
    this._entries = [];
    for (const d of this.districts) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0.22, 0.38, 0.62),
        emissive: new THREE.Color(0, 0, 0),
        emissiveIntensity: 1.15,
        metalness: 0.12,
        roughness: 0.38,
        transparent: true,
        opacity: 0.92,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 20), mat);
      mesh.position.copy(d.position);
      mesh.name = `fieldCell:${d.regionId}`;

      const miniMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0.35, 0.75, 1.0),
        emissive: new THREE.Color(0.2, 0.55, 1.0),
        emissiveIntensity: 1.35,
        metalness: 0.25,
        roughness: 0.2,
        transparent: true,
        opacity: 0.88
      });
      const mini = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), miniMat);
      mini.position.copy(d.position).add(new THREE.Vector3(0, 0.68, 0));
      mini.name = `districtOrb:${d.regionId}`;

      this._entries.push({ mesh, mini, district: d });
      this.group.add(mesh);
      this.group.add(mini);
    }
  }

  /**
   * Tek gerçeklik: `bridgeFrame.regionalMap` (vNext-541+).
   * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} bridgeFrame
   * @param {{ fieldDistortionMul?: number, perDistrict?: Record<string, { scaleMul?: number, opacityMul?: number }>, emphasis?: { districtId: string, strength01: number } }} [ghostFieldMod] vNext-546/547
   */
  sync(bridgeFrame, ghostFieldMod) {
    const map = bridgeFrame.regionalMap;
    if (!(map instanceof Map)) return;

    const distMul = ghostFieldMod?.fieldDistortionMul ?? 1;

    for (const { mesh, mini, district } of this._entries) {
      const sample = map.get(district.regionId);
      if (!sample) continue;
      const cell = fieldSampleToCell(sample);
      const w = sampleConstitutionalWeather(cell);
      const mat = /** @type {THREE.MeshPhysicalMaterial} */ (mesh.material);
      const miniMat = /** @type {THREE.MeshPhysicalMaterial} */ (mini.material);

      const crystal = new THREE.Color(0.18, 0.42, 0.72).lerp(new THREE.Color(0.88, 0.95, 1.0), w.crystalStability);
      const warm = new THREE.Color(0.25, 0.1, 0.05).lerp(new THREE.Color(1.0, 0.48, 0.12), w.glowDensity);
      const spark = new THREE.Color(1, 1, 1).multiplyScalar(w.sparks * 0.55);
      mat.color.copy(crystal);
      mat.emissive.copy(warm.clone().add(spark));
      mat.emissiveIntensity = 0.85 + w.glowDensity * 0.9;

      const storm = w.turbulence;
      const pd = ghostFieldMod?.perDistrict?.[district.regionId];
      const em = ghostFieldMod?.emphasis;
      const emBoost =
        em?.districtId === district.regionId ? 1 + (em.strength01 ?? 0) * 0.38 : 1;
      const s = (0.82 + storm * 0.55 + w.sparks * 0.12) * distMul * (pd?.scaleMul ?? 1) * emBoost;
      mesh.scale.setScalar(s);

      const baseOp = 0.45 + (1 - w.echoMist) * 0.5;
      mat.opacity = Math.max(0.35, Math.min(1, baseOp * (pd?.opacityMul ?? 1) * (emBoost > 1 ? 1 + (emBoost - 1) * 0.25 : 1)));
      mat.transparent = mat.opacity < 0.995;

      mesh.rotation.y += storm * 0.04;
      mesh.rotation.x += storm * 0.02;

      miniMat.emissive.copy(warm.clone().multiplyScalar(0.4).add(new THREE.Color(0.15, 0.45, 1.0).multiplyScalar(w.crystalStability)));
      miniMat.emissiveIntensity = 1.1 + w.sparks * 1.2 + storm * 0.35;
      const ms =
        (0.72 + w.glowDensity * 0.45 + Math.sin(storm * 4.2) * 0.06) *
        distMul *
        (pd?.scaleMul ?? 1) *
        emBoost;
      mini.scale.setScalar(ms);
      mini.rotation.z += 0.03 + storm * 0.05;
      mini.rotation.y += 0.04 + cell.novelty * 0.06;
    }
  }

  dispose() {
    for (const { mesh, mini } of this._entries) {
      mesh.geometry.dispose();
      mini.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material.dispose();
      if (Array.isArray(mini.material)) mini.material.forEach((m) => m.dispose());
      else mini.material.dispose();
    }
    this._entries.length = 0;
  }
}
