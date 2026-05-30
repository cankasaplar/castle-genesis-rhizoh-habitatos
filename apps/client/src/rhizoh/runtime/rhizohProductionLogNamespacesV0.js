/**
 * Production log namespaces — keep STT, WebGPU probe, and Castle lifecycle separable in DevTools.
 * Chrome native "No available adapters" = WebGPU only; suppress during navigator.gpu.requestAdapter().
 */

const WEBGPU_ADAPTER_NOISE = /no available adapters/i;

/** @param {unknown[]} args */
function isWebGpuAdapterNoise(args) {
  try {
    return WEBGPU_ADAPTER_NOISE.test(args.map((a) => String(a ?? "")).join(" "));
  } catch {
    return false;
  }
}

/**
 * Filters Chrome's navigator.gpu "No available adapters" console noise during probe window.
 */
export function installChromeWebGpuNoiseSuppressV0() {
  if (typeof window === "undefined" || window.__CASTLE_WEBGPU_NOISE_SUPPRESS__) return;
  window.__CASTLE_WEBGPU_NOISE_SUPPRESS__ = true;
}

/**
 * @param {GPURequestAdapterOptions} [options]
 * @returns {Promise<GPUAdapter | null>}
 */
export async function requestWebGpuAdapterQuietlyV0(options = {}) {
  if (typeof navigator === "undefined" || !navigator.gpu?.requestAdapter) return null;
  installChromeWebGpuNoiseSuppressV0();
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;
  const wrap =
    (fn) =>
    (...args) => {
      if (isWebGpuAdapterNoise(args)) return;
      fn.apply(console, args);
    };
  console.warn = wrap(origWarn);
  console.error = wrap(origError);
  console.info = wrap(origInfo);
  try {
    return await navigator.gpu.requestAdapter(options);
  } catch {
    return null;
  } finally {
    console.warn = origWarn;
    console.error = origError;
    console.info = origInfo;
  }
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logVoiceInfoV0(tag, detail = {}) {
  console.info(`[VOICE_${String(tag || "INFO")}]`, detail);
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logVoiceWarnV0(tag, detail = {}) {
  console.warn(`[VOICE_${String(tag || "WARN")}]`, detail);
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logWebGpuInfoV0(tag, detail = {}) {
  console.info(`[WEBGPU_${String(tag || "INFO")}]`, detail);
}

/** Castle system lifecycle (LLM turn, boot-adjacent health — not STT / not GPU). */
export function logCastleLifecycleV0(stage, detail = {}) {
  const meta = detail && typeof detail === "object" ? detail : {};
  console.info(`[CASTLE_${String(stage || "unknown")}]`, meta);
}

export function createRhizohClientTraceIdV0() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TRC-${t}-${r}`;
}

/**
 * @param {string | null | undefined} serverTraceId
 * @param {string} clientTraceId
 */
export function resolveRhizohTurnTraceIdV0(serverTraceId, clientTraceId) {
  const server = String(serverTraceId || "").trim();
  if (server) return server;
  return String(clientTraceId || "").trim();
}
