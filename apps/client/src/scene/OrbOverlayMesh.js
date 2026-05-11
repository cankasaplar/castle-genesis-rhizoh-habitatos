/**
 * vNext-540 — Rhizoh sovereign orb: tier, drift, discomfort, legitimacy resonance, mutation.
 */

import * as THREE from "three";

export class OrbOverlayMesh {
  constructor(options = {}) {
    this.options = options;
    /** Headless / CI: skip canvas sprite labels */
    this.labelsEnabled = options.labelsEnabled !== false;
    this.group = new THREE.Group();
    this.group.name = "OrbOverlayMeshV540";
    this.group.position.set(0, 1.35, 0);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.12, 0.2, 0.45),
      emissive: new THREE.Color(0.15, 0.55, 1.0),
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15
    });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 2), coreMat);
    this.core.name = "rhizohSovereignCore";
    this.group.add(this.core);

    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.4, 0.75, 1.0),
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    this.halo = new THREE.Mesh(new THREE.SphereGeometry(0.92, 24, 18), haloMat);
    this.halo.name = "rhizohSovereignHalo";
    this.group.add(this.halo);

    /** @type {THREE.Sprite | null} */
    this._label = null;
  }

  /**
   * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} bridgeFrame
   * @param {{ sovereign?: Partial<{ tier: string, drift: number, discomfort: number, legitimacyResonance: number, mutation: string }> }} [ctx]
   */
  sync(bridgeFrame, ctx = {}) {
    const base = bridgeFrame.overlayState?.rhizohSovereign || {};
    const s = { ...base, ...ctx.sovereign };
    const drift = typeof s.drift === "number" ? s.drift : 0.08;
    const discomfort = typeof s.discomfort === "number" ? s.discomfort : 0.12;
    const leg = typeof s.legitimacyResonance === "number" ? s.legitimacyResonance : 0.72;
    const tier = s.tier != null ? String(s.tier) : "L1";
    const mutation = s.mutation != null ? String(s.mutation) : "sealed";

    const scale = 1 + drift * 0.65 + discomfort * 0.15;
    this.core.scale.setScalar(scale);
    this.halo.scale.setScalar(1.05 + leg * 0.25);

    const coreMat = /** @type {THREE.MeshPhysicalMaterial} */ (this.core.material);
    const unease = new THREE.Color(0.15, 0.45, 1.0).lerp(new THREE.Color(1.0, 0.25, 0.15), discomfort);
    coreMat.emissive.copy(unease);
    coreMat.emissiveIntensity = 0.85 + leg * 0.55;

    this.group.rotation.y += 0.012 + drift * 0.04;
    this.group.rotation.x = Math.sin(performance.now() * 0.0008) * 0.08 * drift;

    const text = `${tier} · drift ${drift.toFixed(2)} · Δ ${discomfort.toFixed(2)} · leg ${leg.toFixed(2)} · ${mutation}`;
    this._setLabelSprite(text, mutation === "pending");
  }

  /**
   * @param {string} text
   * @param {boolean} pending
   */
  _setLabelSprite(text, pending) {
    if (!this.labelsEnabled) return;
    if (this._label) {
      this.group.remove(this._label);
      if (this._label.material.map) this._label.material.map.dispose();
      this._label.material.dispose();
      this._label = null;
    }
    const canvas = document.createElement("canvas");
    const w = 1024;
    const h = 160;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, w, h);
    c.fillStyle = pending ? "rgba(120,40,20,0.85)" : "rgba(12,24,48,0.82)";
    if (typeof c.roundRect === "function") {
      c.roundRect(24, 24, w - 48, h - 48, 18);
      c.fill();
    } else {
      c.fillRect(24, 24, w - 48, h - 48);
    }
    c.fillStyle = "#e8f2ff";
    c.font = "bold 44px system-ui,Segoe UI,sans-serif";
    c.fillText(text, 48, 98);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(0, 1.15, 0);
    sprite.scale.set(4.2, 0.65, 1);
    this._label = sprite;
    this.group.add(sprite);
  }

  dispose() {
    if (this._label) {
      this.group.remove(this._label);
      if (this._label.material.map) this._label.material.map.dispose();
      this._label.material.dispose();
    }
    this.core.geometry.dispose();
    this.halo.geometry.dispose();
    if (Array.isArray(this.core.material)) this.core.material.forEach((m) => m.dispose());
    else this.core.material.dispose();
    if (Array.isArray(this.halo.material)) this.halo.material.forEach((m) => m.dispose());
    else this.halo.material.dispose();
  }
}
