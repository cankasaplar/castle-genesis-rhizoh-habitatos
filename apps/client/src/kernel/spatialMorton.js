/**
 * 3B Morton (Z-order) hücre anahtarı — önbellek lokalitesi; hiyerarşik katmanlar XOR ile karıştırılır.
 * Koordinatlar hücre indeksleri (cx,cy,cz) tamsayı; negatif desteklenir (bias ile pozitif aralığa).
 */

const SPATIAL_BIAS = 4096;
const MORTON_BITS = 10;
const MORTON_MASK = (1 << MORTON_BITS) - 1;

function clampCell(c) {
  const v = c + SPATIAL_BIAS;
  return v & MORTON_MASK;
}

function splitBy3(x) {
  let v = x & 0x3ff;
  v = (v | (v << 16)) & 0x30000ff;
  v = (v | (v << 8)) & 0x300f00f;
  v = (v | (v << 4)) & 0x30c30c3;
  v = (v | (v << 2)) & 0x49249249;
  return v;
}

export function morton3D16(cx, cy, cz) {
  const x = splitBy3(clampCell(cx));
  const y = splitBy3(clampCell(cy));
  const z = splitBy3(clampCell(cz));
  return (x | (y << 1) | (z << 2)) >>> 0;
}

/** Makro / meso / mikro hücre indeksleri (m, t, s metre ölçekleri). */
export function hierarchicalCellIndices(x, y, z, macroSize, mesoSize, microSize) {
  return {
    mx: Math.floor(x / macroSize),
    my: Math.floor(y / macroSize),
    mz: Math.floor(z / macroSize),
    tx: Math.floor(x / mesoSize),
    ty: Math.floor(y / mesoSize),
    tz: Math.floor(z / mesoSize),
    ux: Math.floor(x / microSize),
    uy: Math.floor(y / microSize),
    uz: Math.floor(z / microSize)
  };
}

/**
 * Dünya konumundan hash tablosu yuvası (0..hashSize).
 * Hiyerarşi: 2048m / 256m / microCell boyutu Morton parçalarının XOR’u ile karıştırılır (hotspot yayma).
 */
export function worldToSpatialBucket(x, y, z, microCellSize, hashSize) {
  const h = hierarchicalCellIndices(x, y, z, 2048, 256, microCellSize);
  const macro = morton3D16(h.mx, h.my, h.mz);
  const meso = morton3D16(h.tx, h.ty, h.tz);
  const micro = morton3D16(h.ux, h.uy, h.uz);
  let mix = (macro * 0x9e3779b1) ^ (meso * 0x85ebca6b) ^ micro;
  mix >>>= 0;
  return mix % hashSize;
}
