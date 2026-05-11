/**
 * vNext-540 — Lineage “rivers” along Boğaz path from branch segments.
 */

import * as THREE from "three";

/**
 * @param {string} s
 */
function hashToUnit(s) {
  let h = 2166136261;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 1000000) / 1000000;
}

/**
 * @param {THREE.Vector3[]} path
 * @param {number} t01
 */
function pointOnPolyline(path, t01) {
  if (path.length === 0) return new THREE.Vector3();
  if (path.length === 1) return path[0].clone();
  const n = path.length - 1;
  const f = Math.max(0, Math.min(1, t01)) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const u = f - i;
  return new THREE.Vector3().lerpVectors(path[i], path[i + 1], u);
}

const KIND_COLOR = {
  fork: new THREE.Color(0.2, 0.85, 0.55),
  merge: new THREE.Color(0.35, 0.55, 1.0),
  pruned: new THREE.Color(0.45, 0.45, 0.5),
  mainline: new THREE.Color(1.0, 0.82, 0.25)
};

export class BranchRiverMesh {
  /**
   * @param {object} options
   * @param {THREE.Vector3[]} [options.bosphorusPath]
   */
  constructor(options = {}) {
    this.path = options.bosphorusPath || [];
    this.group = new THREE.Group();
    this.group.name = "BranchRiverMeshV540";
    /** @type {THREE.Mesh[]} */
    this._tubes = [];
  }

  _clearTubes() {
    for (const m of this._tubes) {
      this.group.remove(m);
      m.geometry.dispose();
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
      else m.material.dispose();
    }
    this._tubes.length = 0;
  }

  /**
   * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} bridgeFrame
   * @param {{ opacityMul?: number, emissiveIntensityMul?: number, kindOpacityMul?: Partial<Record<string, number>> }} [ghostMod] vNext-546/547
   */
  sync(bridgeFrame, ghostMod) {
    this._clearTubes();

    const segs = bridgeFrame.branchSegments || [];
    if (!this.path.length || !segs.length) return;

    const opMul = ghostMod?.opacityMul ?? 1;
    const emMul = ghostMod?.emissiveIntensityMul ?? 1;

    for (const seg of segs) {
      const kindMul = ghostMod?.kindOpacityMul?.[seg.kind] ?? 1;
      const t0 = hashToUnit(seg.fromHash);
      const t1 = hashToUnit(seg.toHash);
      const a = Math.min(t0, t1);
      const b = Math.max(t0, t1);
      const span = Math.max(0.04, b - a);
      const p0 = pointOnPolyline(this.path, a);
      const p1 = pointOnPolyline(this.path, Math.min(1, a + span));
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      mid.y -= 0.15 + (1 - (seg.strength ?? 0.5)) * 0.25;
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const col = KIND_COLOR[seg.kind] || KIND_COLOR.fork;
      const mat = new THREE.MeshPhysicalMaterial({
        color: col,
        emissive: col.clone().multiplyScalar(0.35),
        emissiveIntensity: 0.9 * emMul,
        transparent: true,
        opacity: Math.min(1, (0.55 + (seg.strength ?? 0.5) * 0.35) * opMul * kindMul),
        metalness: 0.05,
        roughness: 0.25
      });
      const geo = new THREE.TubeGeometry(curve, 16, 0.05 + (seg.strength ?? 0.5) * 0.06, 6, false);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `branch:${seg.kind}`;
      this._tubes.push(mesh);
      this.group.add(mesh);
    }
  }

  dispose() {
    this._clearTubes();
  }
}
