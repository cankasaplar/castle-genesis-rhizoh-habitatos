/**
 * Canonical rhizoh.com globe shell — küre + swarm + sol üst görünüm + epistemik metrik.
 * Product shell bar (Hall/Studio/Profile drawer) kalır; yalnızca “ayrı harita uygulaması” hissi kapatılır.
 */

/** @returns {boolean} */
export function isRhizohCanonicalGlobeUiV0() {
  try {
    if (String(import.meta.env?.VITE_RHIZOH_CANONICAL_GLOBE_UI || "") === "0") return false;
    if (String(import.meta.env?.VITE_RHIZOH_CANONICAL_GLOBE_UI || "") === "1") return true;
    if (import.meta.env?.PROD) return true;
    if (typeof window !== "undefined") {
      const host = String(window.location?.hostname || "").toLowerCase();
      if (host === "rhizoh.com" || host.endsWith(".rhizoh.com")) return true;
    }
  } catch {
    /* noop */
  }
  return false;
}
