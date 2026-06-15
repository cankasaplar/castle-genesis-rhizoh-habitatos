/**
 * SpiralMMO session cube accumulation — stacks across handoffs within one 6:44 window.
 */

export const RHIZOH_SPIRAL_MMO_SESSION_ACCUM_KEY_V0 = "rhizoh_spiral_mmo_cube_accum_session_v0";

/** @type {{ byContinent: Record<string, number> }} */
let memoryAccumV0 = { byContinent: {} };

/**
 * @returns {{ byContinent: Record<string, number> }}
 */
export function readSpiralMMOSessionCubeAccumV0() {
  if (typeof window === "undefined") {
    return { byContinent: { ...memoryAccumV0.byContinent } };
  }
  try {
    const raw = window.sessionStorage.getItem(RHIZOH_SPIRAL_MMO_SESSION_ACCUM_KEY_V0);
    if (!raw) return { byContinent: { ...memoryAccumV0.byContinent } };
    const parsed = JSON.parse(raw);
    const byContinent =
      parsed?.byContinent && typeof parsed.byContinent === "object" ? { ...parsed.byContinent } : {};
    memoryAccumV0 = { byContinent };
    return { byContinent: { ...byContinent } };
  } catch {
    return { byContinent: { ...memoryAccumV0.byContinent } };
  }
}

/**
 * @param {{ byContinent: Record<string, number> }} next
 */
function writeSpiralMMOSessionCubeAccumV0(next) {
  const byContinent = next?.byContinent && typeof next.byContinent === "object" ? { ...next.byContinent } : {};
  memoryAccumV0 = { byContinent };
  if (typeof window === "undefined") return byContinent;
  try {
    window.sessionStorage.setItem(
      RHIZOH_SPIRAL_MMO_SESSION_ACCUM_KEY_V0,
      JSON.stringify({ schema: "rhizoh.spiral_mmo_session_accum.v0", byContinent })
    );
  } catch {
    /* noop */
  }
  return byContinent;
}

/**
 * @param {string} continent
 * @returns {number}
 */
export function takeSpiralMMOSessionAccumIndexV0(continent) {
  const key = String(continent || "unknown");
  const state = readSpiralMMOSessionCubeAccumV0();
  const index = Number(state.byContinent[key]) || 0;
  state.byContinent[key] = index + 1;
  writeSpiralMMOSessionCubeAccumV0(state);
  return index;
}

export function resetSpiralMMOSessionCubeAccumV0() {
  memoryAccumV0 = { byContinent: {} };
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RHIZOH_SPIRAL_MMO_SESSION_ACCUM_KEY_V0);
  } catch {
    /* noop */
  }
}
