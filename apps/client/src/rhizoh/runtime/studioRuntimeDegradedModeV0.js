/**
 * Studio / render ortamı — tek hataya indirgeme yerine degrade katmanı (GPU yok, adapter yok, vb.).
 */

/**
 * @param {{ webgl: boolean, webgl2: boolean, webgpuApi: boolean }} sync
 * @param {{ device?: string, computePath?: string } | null | undefined} warm
 */
export function resolveStudioDegradationProfile(sync, warm) {
  const reasons = [];
  let tier = "full";
  if (!sync?.webgl && !sync?.webgl2) {
    tier = "minimal";
    reasons.push("no_webgl_context");
  }
  if (!sync?.webgpuApi) {
    reasons.push("no_webgpu_api");
    if (tier === "full") tier = "degraded_render";
  }
  const dev = warm && typeof warm === "object" ? String(warm.device || "") : "";
  if (dev === "unavailable") {
    reasons.push("webgpu_device_unavailable");
    if (tier === "full" || tier === "degraded_render") tier = "degraded_gpu";
  }
  return {
    tier,
    reasons,
    at: Date.now(),
    note:
      "Browser 'No available adapters' / MetaMask / COOP are environment signals — not a single Studio exception; use tier for UX not one fatal."
  };
}
