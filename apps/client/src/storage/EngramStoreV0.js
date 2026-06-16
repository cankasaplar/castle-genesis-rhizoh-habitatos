/**
 * Engram store (prep) — semantic compression / Castle personality biases.
 */

import { canPersistUserMemoryN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { idbSimGetV0, idbSimPutV0, SIM_STORE_ENGRAMS_V0, withRhizohSimulationDbV0 } from "./rhizohSimulationDbV0.js";

export const RHIZOH_ENGRAM_STORE_SCHEMA_V0 = "castle.rhizoh.engram_store.v0";
export const RHIZOH_ENGRAM_LATEST_ID_V0 = "engram_latest";

/**
 * @param {{
 *   orderBias?: number,
 *   chaosBias?: number,
 *   mirrorBias?: number,
 *   favoriteRegion?: string,
 *   dominantGhost?: string
 * }} engram
 */
export async function saveLatestEngramV0(engram = {}) {
  if (!canPersistUserMemoryN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_memory_denied" });
  }
  const record = Object.freeze({
    schema: RHIZOH_ENGRAM_STORE_SCHEMA_V0,
    id: RHIZOH_ENGRAM_LATEST_ID_V0,
    orderBias: clamp01(engram.orderBias ?? 0.5),
    chaosBias: clamp01(engram.chaosBias ?? 0.25),
    mirrorBias: clamp01(engram.mirrorBias ?? 0.25),
    favoriteRegion: String(engram.favoriteRegion || ""),
    dominantGhost: String(engram.dominantGhost || ""),
    updatedAt: Date.now()
  });

  return withRhizohSimulationDbV0(async (db) => {
    await idbSimPutV0(db, SIM_STORE_ENGRAMS_V0, record);
    return Object.freeze({ ok: true, engram: record });
  });
}

export async function readLatestEngramV0() {
  if (!canPersistUserMemoryN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_memory_denied", engram: null });
  }
  return withRhizohSimulationDbV0(async (db) => {
    const engram = await idbSimGetV0(db, SIM_STORE_ENGRAMS_V0, RHIZOH_ENGRAM_LATEST_ID_V0);
    return Object.freeze({ ok: true, engram });
  });
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
