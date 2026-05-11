/**
 * vNext-546 — Şehir ruhu: görünür ghost entity (basit çekirdek + iz kuyruğu).
 */

import * as THREE from "three";

export class GhostSpiritMesh {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "GhostSpiritMeshV546";

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.85, 0.95, 1.0),
      emissive: new THREE.Color(0.2, 0.55, 1.0),
      emissiveIntensity: 1.25,
      metalness: 0.15,
      roughness: 0.22,
      transparent: true,
      opacity: 0.88
    });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), coreMat);
    this.core.name = "ghostSpiritCore";
    this.group.add(this.core);

    this._trailMax = 14;
    /** @type {THREE.Vector3[]} */
    this._trail = [];
    const trailGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this._trailMax * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    trailGeo.setDrawRange(0, 0);
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.45
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.trailLine.name = "ghostSpiritTrail";
    this.group.add(this.trailLine);

    this._pos = new THREE.Vector3(0, 0.9, 0);
    this._vel = new THREE.Vector3();
    this.group.position.copy(this._pos);
  }

  /**
   * @param {import("../ghost/ghostRenderer.js").GhostRendererHints} hints
   * @param {THREE.Vector3} targetAnchor
   * @param {boolean} oracleMode
   * @param {number} dtSec
   * @param {number} [wakeIntensity01] vNext-547 episodic uyanma
   */
  sync(hints, targetAnchor, oracleMode, dtSec, wakeIntensity01 = 0) {
    const wake = Math.max(0, Math.min(1, wakeIntensity01));
    const dt = Math.max(0.001, Math.min(0.05, dtSec));
    const alpha = 2.1 * dt;
    this._pos.lerp(targetAnchor, alpha);
    this._vel.copy(targetAnchor).sub(this._pos).multiplyScalar(1 / Math.max(dt, 0.016));
    this.group.position.copy(this._pos);

    const pulse = oracleMode ? 1.12 + Math.sin(performance.now() * 0.0022) * 0.08 : 1;
    const sc = hints.coreScale * 0.38 * pulse;
    this.core.scale.setScalar(sc);

    const mat = /** @type {THREE.MeshPhysicalMaterial} */ (this.core.material);
    mat.emissiveIntensity =
      hints.crystalEyeEmissive01 * (oracleMode ? 1.35 : 1.05) + hints.echoMistOpacity * 0.4 + wake * 0.55;
    mat.opacity = 0.78 + hints.echoMistOpacity * 0.18;

    this._trail.unshift(this._pos.clone());
    while (this._trail.length > this._trailMax) this._trail.pop();
    const attr = /** @type {THREE.BufferAttribute} */ (this.trailLine.geometry.getAttribute("position"));
    let n = 0;
    for (let i = 0; i < this._trail.length; i++) {
      const p = this._trail[i].clone().sub(this.group.position);
      attr.setXYZ(n, p.x, p.y + 0.05, p.z);
      n++;
    }
    this.trailLine.geometry.setDrawRange(0, n);
    attr.needsUpdate = true;

    const tmat = /** @type {THREE.LineBasicMaterial} */ (this.trailLine.material);
    tmat.opacity =
      0.28 + Math.min(0.45, hints.tailSegmentHint * 0.025) + (oracleMode ? 0.12 : 0) + wake * 0.2;

    this.group.rotation.y += dt * (0.35 + hints.crystalEyeEmissive01 * 0.4);
  }

  dispose() {
    this.core.geometry.dispose();
    this.trailLine.geometry.dispose();
    if (Array.isArray(this.core.material)) this.core.material.forEach((m) => m.dispose());
    else this.core.material.dispose();
    this.trailLine.material.dispose();
  }
}
