/**
 * Device / runtime capability probe for field embodiment (WebGPU, bandwidth mode).
 */

/**
 * @typedef {object} FieldDeviceProfile
 * @property {boolean} hasWebGpu
 * @property {boolean} prefersDeltaStream
 * @property {"webgpu" | "cpu_fallback"} tier
 * @property {boolean} ambientModeHint smart TV / reduced motion style
 */

/**
 * @param {object} [opts]
 * @param {boolean} [opts.forceCpu]
 * @param {boolean} [opts.ambientTarget] e.g. smart TV
 */
export function probeFieldDevice(opts = {}) {
  const hasWebGpu =
    !opts.forceCpu &&
    typeof navigator !== "undefined" &&
    typeof navigator.gpu !== "undefined" &&
    navigator.gpu !== null;
  return Object.freeze({
    hasWebGpu,
    prefersDeltaStream: true,
    tier: hasWebGpu ? /** @type {const} */ ("webgpu") : "cpu_fallback",
    ambientModeHint: !!opts.ambientTarget
  });
}

/**
 * @returns {Promise<{ device: GPUDevice | null, adapter: GPUAdapter | null }>}
 */
export async function requestFieldDevice() {
  if (typeof navigator === "undefined" || !navigator.gpu) {
    return { device: null, adapter: null };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    const device = adapter ? await adapter.requestDevice() : null;
    return { device, adapter };
  } catch {
    return { device: null, adapter: null };
  }
}
