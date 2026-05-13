/**
 * Embedding-space metric tensor sketch: covariance of (x,y,z) windows + axis coupling (off-diagonal mass).
 */
export const GENESIS_REPLAY_METRIC_TENSOR_FIELD_SCHEMA = "castle.genesis.replay_metric_tensor_field.v1";

/**
 * @param {{ x: number, y: number, z: number }[]} points
 */
export function computeMetricTensorFieldV1(points) {
  const pts = Array.isArray(points) ? points : [];
  const n = pts.length;
  if (n < 2) {
    return {
      schema: GENESIS_REPLAY_METRIC_TENSOR_FIELD_SCHEMA,
      sampleCount: n,
      mean: { x: 0, y: 0, z: 0 },
      tensor: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
      offDiagonalFrobenius: 0,
      diagonalFrobenius: 0,
      axisCouplingIndex: 0,
      totalVariance: 0,
      anisotropyRatio: 1
    };
  }

  let mx = 0;
  let my = 0;
  let mz = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
    mz += p.z;
  }
  mx /= n;
  my /= n;
  mz /= n;

  let cxx = 0;
  let cyy = 0;
  let czz = 0;
  let cxy = 0;
  let cxz = 0;
  let cyz = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = p.y - my;
    const dz = p.z - mz;
    cxx += dx * dx;
    cyy += dy * dy;
    czz += dz * dz;
    cxy += dx * dy;
    cxz += dx * dz;
    cyz += dy * dz;
  }
  const inv = 1 / (n - 1);
  cxx *= inv;
  cyy *= inv;
  czz *= inv;
  cxy *= inv;
  cxz *= inv;
  cyz *= inv;

  const round4 = (v) => Math.round(v * 10000) / 10000;
  const G = [
    [round4(cxx), round4(cxy), round4(cxz)],
    [round4(cxy), round4(cyy), round4(cyz)],
    [round4(cxz), round4(cyz), round4(czz)]
  ];

  const offF = Math.sqrt(cxy * cxy + cxz * cxz + cyz * cyz);
  const diagF = Math.sqrt(cxx * cxx + cyy * cyy + czz * czz);
  const axisCouplingIndex =
    diagF > 1e-12 ? Math.round((offF / diagF) * 10000) / 10000 : Math.round(offF * 10000) / 10000;
  const totalVariance = Math.round((cxx + cyy + czz) * 10000) / 10000;
  const dmin = Math.min(cxx, cyy, czz);
  const dmax = Math.max(cxx, cyy, czz);
  const anisotropyRatio =
    dmin > 1e-12 ? Math.round((dmax / dmin) * 10000) / 10000 : Math.round(dmax * 10000) / 10000;

  return {
    schema: GENESIS_REPLAY_METRIC_TENSOR_FIELD_SCHEMA,
    sampleCount: n,
    mean: { x: round4(mx), y: round4(my), z: round4(mz) },
    tensor: G,
    offDiagonalFrobenius: Math.round(offF * 10000) / 10000,
    diagonalFrobenius: Math.round(diagF * 10000) / 10000,
    axisCouplingIndex,
    totalVariance,
    anisotropyRatio
  };
}
