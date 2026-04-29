/**
 * crossOriginIsolated + SharedArrayBuffer — Safari / tarayıcı farkları için feature detect.
 * COEP: credentialless Cesium + harici karolar ile daha uyumlu; tam SAB için ortam değişir.
 */

export function isCrossOriginIsolated() {
  return typeof globalThis !== "undefined" && globalThis.crossOriginIsolated === true;
}

export function isSharedArrayBufferAvailable() {
  return typeof SharedArrayBuffer !== "undefined";
}

/** SAB kullanılabilir mi (yalnız boolean; gerçek kullanımda ek politika kontrolü). */
export function getSabReadiness() {
  const isolated = isCrossOriginIsolated();
  const sab = isSharedArrayBufferAvailable();
  return {
    crossOriginIsolated: isolated,
    sharedArrayBuffer: sab,
    recommendedWorkerMode: isolated && sab ? "shared_array_buffer" : "structured_clone_fallback",
    note: "Safari ve bazı ortamlarda isolation tam değil; structured clone fallback şart."
  };
}

/** Chronos kalite seçimi için çalışma zamanı yetenek tablosu (kaba; SIMD ayrı ölçüm gerektirir). */
export function getRuntimeCapabilityMap() {
  return {
    sab: isSharedArrayBufferAvailable(),
    crossOriginIsolated: isCrossOriginIsolated(),
    workers: typeof Worker !== "undefined",
    webgpu: typeof navigator !== "undefined" && !!navigator.gpu,
    atomics: typeof Atomics !== "undefined",
    // Gerçek SIMD: küçük simd .wasm derlemesi ile probe (şimdilik kapalı).
    wasmSimd: false
  };
}

export const QUALITY_TIERS = ["ultra", "high", "medium", "fallback"];

/** Yeteneklere göre dinamik degrade hedefi. */
export function selectQualityTier(cap = getRuntimeCapabilityMap()) {
  if (cap.webgpu && cap.workers && cap.sab && cap.crossOriginIsolated && cap.atomics) return "ultra";
  if (cap.webgpu && cap.workers) return "high";
  if (cap.workers) return "medium";
  return "fallback";
}
