/**
 * CORE-ELIGIBLE: Boot-time ontological gate (pre-render).
 */

import { openSubstrateContinuityIdbV0 } from "../substrateContinuityIdbV0.js";
import {
  commitLastAppliedBootSealVersionV0,
  getBootAtomicSealV0
} from "./bootValidityTokenV0.js";
import {
  enforceHydrateGateFromDiskV0,
  readLivingWorldBootstrapV0
} from "./worldSealerV0.js";

export const ONTOLOGICAL_GATE_SCHEMA_V0 = "castle.rhizoh.ontological_gate.v0";

export const ONTOLOGICAL_BLOCK_REASON_V0 = Object.freeze({
  EPISTEMIC_LEGITIMACY_BREACH: "EPISTEMIC_LEGITIMACY_BREACH",
  DATABASE_FATAL_COLLAPSE: "DATABASE_FATAL_COLLAPSE",
  COLD_NO_LIVING_WORLD: "COLD_NO_LIVING_WORLD"
});

/**
 * @returns {boolean}
 */
export function isOntologicalBootGateEnabledV0() {
  if (typeof import.meta === "undefined") return true;
  const env = import.meta.env || {};
  if (env.VITE_ONTOLOGICAL_BOOT_GATE === "0") return false;
  if (env.VITE_SUBSTRATE_CONTINUITY_IDB === "1") return true;
  return env.VITE_ONTOLOGICAL_BOOT_GATE === "1" || env.PROD === true;
}

/**
 * Pre-render gate — read sealed living world before visual layer.
 */
export async function bootstrapRhizohOntologicalGateV0() {
  if (!isOntologicalBootGateEnabledV0()) {
    return {
      schema: ONTOLOGICAL_GATE_SCHEMA_V0,
      proceed: true,
      skipped: true,
      bootContext: null
    };
  }

  try {
    const gateVerdict = await enforceHydrateGateFromDiskV0();

    if (!gateVerdict.allowExecution || gateVerdict.mode === "QUARANTINE") {
      const reason =
        gateVerdict.mode === "COLD"
          ? ONTOLOGICAL_BLOCK_REASON_V0.COLD_NO_LIVING_WORLD
          : ONTOLOGICAL_BLOCK_REASON_V0.EPISTEMIC_LEGITIMACY_BREACH;
      return {
        schema: ONTOLOGICAL_GATE_SCHEMA_V0,
        proceed: false,
        reason,
        gateVerdict,
        bootContext: null
      };
    }

    const bootContext = {
      replayOrigin: gateVerdict.replayOrigin,
      targetTick: gateVerdict.targetTick,
      livingWorldId: gateVerdict.livingWorldId,
      livingNodeId: gateVerdict.livingNodeId,
      mode: gateVerdict.mode
    };

    let bootValidityToken = null;
    let bootSealVersion = 0;
    if (typeof indexedDB !== "undefined") {
      const db = await openSubstrateContinuityIdbV0();
      try {
        const atomic = await getBootAtomicSealV0(db);
        bootValidityToken = atomic.token;
        bootSealVersion = atomic.bootSealVersion;
      } finally {
        db.close();
      }
    } else {
      const atomic = await getBootAtomicSealV0(null);
      bootValidityToken = atomic.token;
      bootSealVersion = atomic.bootSealVersion;
    }

    commitLastAppliedBootSealVersionV0(bootSealVersion, bootValidityToken);
    if (typeof window !== "undefined") {
      window.__rhizoh_boot_context = bootContext;
    }

    return {
      schema: ONTOLOGICAL_GATE_SCHEMA_V0,
      proceed: true,
      reason: null,
      gateVerdict,
      bootContext,
      bootValidityToken,
      bootSealVersion
    };
  } catch (error) {
    return {
      schema: ONTOLOGICAL_GATE_SCHEMA_V0,
      proceed: false,
      reason: ONTOLOGICAL_BLOCK_REASON_V0.DATABASE_FATAL_COLLAPSE,
      error: String(error?.message || error),
      bootContext: null
    };
  }
}

/**
 * @param {string} [diskKey]
 */
export async function peekPersistedLivingWorldBootstrapV0(diskKey) {
  if (typeof indexedDB === "undefined") return null;
  const db = await openSubstrateContinuityIdbV0();
  try {
    return await readLivingWorldBootstrapV0(db, diskKey);
  } finally {
    db.close();
  }
}
