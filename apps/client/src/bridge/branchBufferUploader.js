/**
 * Pack lineage / river segments for GPU storage (deterministic, compact).
 */

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const KIND = { fork: 0, merge: 1, pruned: 2, mainline: 3 };

/**
 * @param {import("../kernel/render/branchRiverRenderer.js").BranchRiverSegment[]} segments
 * @returns {Float32Array} 4 floats per segment
 */
export function packBranchSegmentsForGpu(segments) {
  const seg = segments || [];
  const out = new Float32Array(Math.max(1, seg.length) * 4);
  let j = 0;
  for (let i = 0; i < seg.length; i++) {
    const s = seg[i];
    out[j++] = KIND[s.kind] ?? 0;
    out[j++] = Math.max(0, Math.min(1, s.strength ?? 0));
    out[j++] = (hashStr(s.fromHash || "") % 16777216) / 16777216;
    out[j++] = (hashStr(s.toHash || "") % 16777216) / 16777216;
  }
  if (seg.length === 0) {
    out[0] = -1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * @param {GPUDevice} device
 * @param {Float32Array} packed
 */
export function createBranchBuffer(device, packed) {
  const size = Math.max(16, packed.byteLength);
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
}

/**
 * @param {GPUQueue} queue
 * @param {GPUBuffer} buf
 * @param {Float32Array} packed
 */
export function writeBranchBuffer(queue, buf, packed) {
  queue.writeBuffer(buf, 0, packed);
}
