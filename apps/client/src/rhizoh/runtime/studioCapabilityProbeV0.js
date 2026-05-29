/**
 * Render / compute capability — WebGL surface vs WebGPU API (adapter lifecycle is separate; see warmSwarmGpu).
 * "No available adapters" (Chrome) = `navigator.gpu.requestAdapter()` resolved null — **soft capability signal**,
 * not a continuity / Firestore failure; surface tiering (mobile / observer node) should tolerate null adapters.
 */

/**
 * @returns {{ webgl: boolean, webgl2: boolean, webgpuApi: boolean, at: number }}
 */
export function syncStudioRenderCapabilityProbe() {
  let webgl = false;
  let webgl2 = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!c.getContext("webgl");
    webgl2 = !!c.getContext("webgl2");
  } catch {
    /* noop */
  }
  const webgpuApi = typeof navigator !== "undefined" && !!navigator.gpu;
  return { webgl, webgl2, webgpuApi, at: Date.now() };
}
