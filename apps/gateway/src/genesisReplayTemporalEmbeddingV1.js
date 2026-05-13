/**
 * Bounded deterministic 3D linear projection of per-window replay features (manifold sketch).
 */
export const GENESIS_REPLAY_TEMPORAL_EMBED_SCHEMA = "castle.genesis.replay_temporal_embed.v1";

/** @type {number[][]} rows = x,y,z; cols = 5 features */
const PROJ_5X3 = [
  [0.31, -0.22, 0.17, 0.41, -0.09],
  [-0.18, 0.37, 0.29, -0.11, 0.33],
  [0.12, 0.09, -0.44, 0.26, 0.19]
];

/**
 * @param {unknown[]} entropyField
 * @param {number} wf
 * @param {number} wt
 */
function meanHInRange(entropyField, wf, wt) {
  let s = 0;
  let c = 0;
  for (const b of entropyField || []) {
    const a = Math.floor(Number(/** @type {{ fromSeq?: unknown }} */ (b).fromSeq) || 0);
    const z = Math.floor(Number(/** @type {{ toSeq?: unknown }} */ (b).toSeq) || 0);
    if (z < wf || a > wt) continue;
    s += Number(/** @type {{ hBits?: unknown }} */ (b).hBits) || 0;
    c += 1;
  }
  return c > 0 ? s / c : 0;
}

/**
 * @param {string} fp
 */
function fpMix01(fp) {
  let h = 0;
  const str = String(fp || "");
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
}

/**
 * @param {{ from: number, to: number, replayFingerprint: string, continuityEventCount: number }[]} windows
 * @param {number} outerFrom
 * @param {number} outerTo
 * @param {unknown[]} entropyField
 */
export function computeTemporalEmbeddingProjectionV1(windows, outerFrom, outerTo, entropyField) {
  const spanFull = Math.max(1, Math.floor(Number(outerTo) || 0) - Math.floor(Number(outerFrom) || 0) + 1);
  const wins = Array.isArray(windows) ? windows : [];
  const n = wins.length;
  const ef = Array.isArray(entropyField) ? entropyField : [];

  /** @type {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number, feature: number[] }[]} */
  const points = [];
  for (let i = 0; i < n; i += 1) {
    const w = wins[i];
    const wf = Math.floor(Number(w.from) || 0);
    const wt = Math.floor(Number(w.to) || 0);
    const wspan = Math.max(1, wt - wf + 1);
    const f0 = wspan / spanFull;
    const f1 = Math.min(1, Math.floor(Number(w.continuityEventCount) || 0) / 64);
    const f2 = n > 1 ? i / (n - 1) : 0.5;
    const f3 = Math.min(1, meanHInRange(ef, wf, wt) / 2);
    const f4 = fpMix01(String(w.replayFingerprint || ""));
    const feat = [f0, f1, f2, f3, f4];
    let x = 0;
    let y = 0;
    let z = 0;
    for (let c = 0; c < 5; c += 1) {
      x += PROJ_5X3[0][c] * feat[c];
      y += PROJ_5X3[1][c] * feat[c];
      z += PROJ_5X3[2][c] * feat[c];
    }
    points.push({
      windowIndex: i,
      from: wf,
      to: wt,
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      z: Math.round(z * 10000) / 10000,
      feature: feat.map((v) => Math.round(v * 10000) / 10000)
    });
  }

  return {
    schema: GENESIS_REPLAY_TEMPORAL_EMBED_SCHEMA,
    dim: 3,
    projection: "fixed_linear_v1",
    points
  };
}
