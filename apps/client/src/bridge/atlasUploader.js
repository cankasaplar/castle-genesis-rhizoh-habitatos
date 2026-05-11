/**
 * Atlas GPU upload with optional delta (dirty cell indices) to save bandwidth.
 */

const FLOATS_PER_CELL = 8;
const BYTES_PER_CELL = FLOATS_PER_CELL * 4;

/**
 * @param {GPUDevice} device
 * @param {number} byteLength
 */
export function createFieldAtlasBuffer(device, byteLength) {
  const size = Math.max(256, byteLength);
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

/**
 * @param {GPUDevice} device
 * @param {GPUQueue} queue
 * @param {GPUBuffer} gpuBuffer
 * @param {{ texels: Float32Array, cellCount: number }} atlas from buildFieldAtlas
 * @param {number[] | null} dirtyCellIndices cell row indices 0..cellCount-1; null = full upload
 */
export function writeAtlasToGpu(device, queue, gpuBuffer, atlas, dirtyCellIndices) {
  const tex = atlas.texels;
  if (!dirtyCellIndices || dirtyCellIndices.length === 0) {
    queue.writeBuffer(gpuBuffer, 0, tex);
    return;
  }
  for (const i of dirtyCellIndices) {
    if (i < 0 || i >= atlas.cellCount) continue;
    const offsetBytes = i * BYTES_PER_CELL;
    const sub = tex.subarray(i * FLOATS_PER_CELL, i * FLOATS_PER_CELL + FLOATS_PER_CELL);
    queue.writeBuffer(gpuBuffer, offsetBytes, sub);
  }
}
