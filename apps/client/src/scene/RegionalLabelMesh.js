/**
 * vNext-540 — District labels (sprites) above regional field nodes.
 */

import * as THREE from "three";

/**
 * @typedef {import("./istanbulBiomePresetV540.js").IstanbulDistrictAnchor} IstanbulDistrictAnchor
 */

export class RegionalLabelMesh {
  /**
   * @param {object} options
   * @param {IstanbulDistrictAnchor[]} [options.districts]
   */
  constructor(options = {}) {
    this.districts = options.districts || [];
    this.labelsEnabled = options.labelsEnabled !== false;
    this.group = new THREE.Group();
    this.group.name = "RegionalLabelMeshV540";
    /** @type {THREE.Sprite[]} */
    this._sprites = [];
    if (!this.labelsEnabled) return;
    for (const d of this.districts) {
      const sprite = this._makeLabelSprite(d.label);
      sprite.position.copy(d.position).add(new THREE.Vector3(0, 0.85, 0));
      sprite.name = `label:${d.regionId}`;
      this._sprites.push(sprite);
      this.group.add(sprite);
    }
  }

  /**
   * @param {string} label
   */
  _makeLabelSprite(label) {
    const canvas = document.createElement("canvas");
    const w = 512;
    const h = 128;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    if (!c) {
      const mat = new THREE.SpriteMaterial({ opacity: 0 });
      return new THREE.Sprite(mat);
    }
    c.clearRect(0, 0, w, h);
    c.fillStyle = "rgba(8,16,32,0.75)";
    if (typeof c.roundRect === "function") {
      c.roundRect(16, 28, w - 32, 72, 12);
      c.fill();
    } else {
      c.fillRect(16, 28, w - 32, 72);
    }
    c.fillStyle = "#cfe6ff";
    c.font = "bold 40px system-ui,Segoe UI,sans-serif";
    c.fillText(label, 36, 82);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }

  /** @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} _bridgeFrame */
  sync(_bridgeFrame) {
    /* Labels static; field motion reads from sibling FieldVolumeMesh */
  }

  dispose() {
    for (const s of this._sprites) {
      this.group.remove(s);
      if (s.material.map) s.material.map.dispose();
      s.material.dispose();
    }
    this._sprites.length = 0;
  }
}
