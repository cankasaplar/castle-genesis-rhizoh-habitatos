/**
 * Disk continuity meta — tek okuma noktası (snapshot + identity merge paylaşır).
 */

const CONTINUITY_KEY_V0 = "rhizoh.continuity.v1";

/**
 * @returns {{ turns: object[], persona: Record<string, unknown>, meta: Record<string, unknown> }}
 */
export function readRhizohContinuityDiskV0() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CONTINUITY_KEY_V0) || "" : "";
    if (!raw) return { turns: [], persona: {}, meta: {} };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed?.turns) ? parsed.turns : [],
      persona: parsed?.persona && typeof parsed.persona === "object" ? parsed.persona : {},
      meta: parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {}
    };
  } catch {
    return { turns: [], persona: {}, meta: {} };
  }
}

/**
 * @returns {Record<string, unknown>}
 */
export function readRhizohContinuityMetaDiskV0() {
  return readRhizohContinuityDiskV0().meta;
}

/**
 * @param {Record<string, unknown>} personaPatch
 */
export function writeRhizohContinuityPersonaV0(personaPatch) {
  if (typeof window === "undefined" || !personaPatch || typeof personaPatch !== "object") return false;
  try {
    const disk = readRhizohContinuityDiskV0();
    const next = {
      turns: disk.turns,
      persona: { ...disk.persona, ...personaPatch },
      meta: { ...disk.meta, updatedAt: Date.now() }
    };
    window.localStorage.setItem(CONTINUITY_KEY_V0, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
