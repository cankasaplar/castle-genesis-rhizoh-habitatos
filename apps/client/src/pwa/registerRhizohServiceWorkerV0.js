/**
 * Rhizoh PWA — service worker registration (production only).
 */

import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_PWA_SHELL_VERSION_V0 = "rhizoh-shell-v4";
export const RHIZOH_PWA_SW_URL_V0 = "/service-worker.js";

/**
 * @returns {Promise<{ ok: boolean, reason?: string, registration?: ServiceWorkerRegistration }>}
 */
export async function registerRhizohServiceWorkerV0() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Object.freeze({ ok: false, reason: "unsupported" });
  }
  if (import.meta.env.DEV) {
    return Object.freeze({ ok: false, reason: "dev_skip" });
  }

  try {
    const registration = await navigator.serviceWorker.register(RHIZOH_PWA_SW_URL_V0, {
      scope: "/",
      updateViaCache: "none"
    });

    try {
      await registration.update();
    } catch {
      /* non-fatal */
    }

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          logCastleLifecycleV0("pwa_sw_update", { version: RHIZOH_PWA_SHELL_VERSION_V0 });
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.pwaShell = Object.freeze({
        version: RHIZOH_PWA_SHELL_VERSION_V0,
        registered: true,
        scope: registration.scope
      });
    }

    logCastleLifecycleV0("pwa_sw_registered", {
      version: RHIZOH_PWA_SHELL_VERSION_V0,
      scope: registration.scope
    });

    return Object.freeze({ ok: true, registration });
  } catch (err) {
    logCastleLifecycleV0("pwa_sw_register_fail", {
      message: String(err?.message || err)
    });
    return Object.freeze({ ok: false, reason: String(err?.message || err) });
  }
}

/**
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function unregisterRhizohServiceWorkerV0() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Object.freeze({ ok: false, reason: "unsupported" });
  }
  const reg = await navigator.serviceWorker.getRegistration(RHIZOH_PWA_SW_URL_V0);
  if (!reg) return Object.freeze({ ok: true, reason: "not_registered" });
  const ok = await reg.unregister();
  return Object.freeze({ ok });
}
