/**
 * Disk continuity meta — tek okuma noktası (snapshot + identity merge paylaşır).
 */

/**
 * @returns {Record<string, unknown>}
 */
export function readRhizohContinuityMetaDiskV0() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("rhizoh.continuity.v1") || "" : "";
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {};
  } catch {
    return {};
  }
}
