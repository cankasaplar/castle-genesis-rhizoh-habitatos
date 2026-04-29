/**
 * Mean-field continuum (L6/L7): ρ, v, intent, threat, knowledge alanları.
 * Hibrit hedef: yakın tarafta K komşu örneği + uzak tarafta alan örneği — bkz. kernel/rhizohExecutionRoadmap.js MEAN_FIELD_HYBRID.
 *
 * Dört atlas — fizik + biliş + şehir + governance: force field + policy field birlikte örneklenir (RHIZOH ayrıştırıcısı).
 */
export const MEAN_FIELD_ATLAS_SPEC = {
  flowRgba: { r: "rho", g: "velocity_magnitude", b: "intent", a: "threat" },
  cognitionRgba: { r: "K", g: "policy", b: "novelty", a: "risk" },
  cityRgba: { r: "energy", g: "traffic", b: "signal", a: "climate" },
  policyRgba: { r: "authority", g: "restriction", b: "priority", a: "hazard" },
  sample: "bilinear_world_xy_or_xz",
  fusedSample: "four_atlas_bindless_or_array_texture; agent_legal_field_sample",
  governanceNote: "Ajan yalnızca fiziksel alanı değil çevresel hukuk / kısıt alanını da sample eder"
};

export class MeanFieldContinuum2D {
  /**
   * @param {number} nx
   * @param {number} nz
   * @param {number} worldSizeX half-extent benzeri ölçek
   * @param {number} worldSizeZ
   */
  constructor(nx = 64, nz = 64, worldSizeX = 8000, worldSizeZ = 8000) {
    this.nx = nx;
    this.nz = nz;
    this.sx = worldSizeX;
    this.sz = worldSizeZ;
    const len = nx * nz;
    this.rho = new Float32Array(len);
    this.vx = new Float32Array(len);
    this.vz = new Float32Array(len);
    this.intent = new Float32Array(len);
    this.threat = new Float32Array(len);
    this.knowledge = new Float32Array(len);
  }

  _idx(ix, iz) {
    return ix + iz * this.nx;
  }

  /** Dünya x,z → hücre indeksi (0..n-1) */
  worldToCell(x, z) {
    const fx = (x / this.sx + 0.5) * this.nx;
    const fz = (z / this.sz + 0.5) * this.nz;
    const ix = Math.max(0, Math.min(this.nx - 1, fx | 0));
    const iz = Math.max(0, Math.min(this.nz - 1, fz | 0));
    return { ix, iz, fx: fx - ix, fz: fz - iz };
  }

  /** Bilinear örnek — organic hareket için düşük maliyet. */
  sampleFields(x, z) {
    const { ix, iz, fx, fz } = this.worldToCell(x, z);
    const ix1 = Math.min(ix + 1, this.nx - 1);
    const iz1 = Math.min(iz + 1, this.nz - 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const q = (buf) => {
      const v00 = buf[this._idx(ix, iz)];
      const v10 = buf[this._idx(ix1, iz)];
      const v01 = buf[this._idx(ix, iz1)];
      const v11 = buf[this._idx(ix1, iz1)];
      const v0 = lerp(v00, v10, fx);
      const v1 = lerp(v01, v11, fx);
      return lerp(v0, v1, fz);
    };
    return {
      rho: q(this.rho),
      vx: q(this.vx),
      vz: q(this.vz),
      intent: q(this.intent),
      threat: q(this.threat),
      knowledge: q(this.knowledge)
    };
  }

  /** Örnek: bir olayı alana yay (Gaussian benzeri tek hücre bump — genişletilebilir). */
  injectPulse(x, z, amplitude = 1, channel = "rho") {
    const { ix, iz } = this.worldToCell(x, z);
    const i = this._idx(ix, iz);
    const buf =
      channel === "rho"
        ? this.rho
        : channel === "threat"
          ? this.threat
          : channel === "knowledge"
            ? this.knowledge
            : channel === "intent"
              ? this.intent
              : this.rho;
    buf[i] += amplitude;
  }
}
