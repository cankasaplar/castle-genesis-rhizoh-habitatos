/**
 * Pass 4.5 GPU decision finalize v1 — compact intent buffer (WGSL ile aynı semantik).
 */

export const RHIZOH_GPU_DECISION_MAGIC_V1 = 0x52484f31;

export function modeQuantaFromMaxCellCount(maxC) {
  const m = maxC >>> 0;
  if (m >= 64) return 3;
  if (m >= 24) return 2;
  return 1;
}

/** @param {Uint8Array} bytes — 16 byte readback */
export function decodeGpuDecisionFinalizeV1(bytes) {
  if (!bytes || bytes.byteLength < 16) return null;
  const u = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
  return {
    magic: u[0],
    maxCellCount: u[1],
    uniqueCells: u[2],
    modeQuanta: u[3]
  };
}

export function isValidGpuDecisionFinalizeV1(decoded) {
  if (!decoded || decoded.magic !== RHIZOH_GPU_DECISION_MAGIC_V1) return false;
  if (decoded.modeQuanta !== modeQuantaFromMaxCellCount(decoded.maxCellCount)) return false;
  return true;
}

/**
 * Cell density istatistiklerinden beklenen GPU çıktısı (doğrulama / CPU konsensüsü).
 * @param {{ maxParticleCountInCell?: number, uniqueCellCount?: number }} stats
 */
export function expectedGpuDecisionFinalizeFromCellStats(stats) {
  const maxC = Math.max(0, Math.floor(Number(stats?.maxParticleCountInCell) || 0));
  const u = Math.max(0, Math.floor(Number(stats?.uniqueCellCount) || 0));
  const mq = modeQuantaFromMaxCellCount(maxC);
  return Object.freeze({
    magic: RHIZOH_GPU_DECISION_MAGIC_V1,
    maxCellCount: maxC >>> 0,
    uniqueCells: u >>> 0,
    modeQuanta: mq >>> 0
  });
}
