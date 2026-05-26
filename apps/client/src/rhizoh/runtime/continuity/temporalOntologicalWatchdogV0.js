/**
 * CORE-ELIGIBLE: Runtime continuous re-legitimization (watchdog + sealer drain hook).
 */

import { REALITY_SEAL_DISK_KEY_V0 } from "../realitySealDiskV0.js";
import { openSubstrateContinuityIdbV0 } from "../substrateContinuityIdbV0.js";
import {
  commitLastAppliedBootSealVersionV0,
  enforceRuntimeBootValidityTokenV0,
  getBootAtomicSealV0,
  getLastAppliedBootSealVersionV0
} from "./bootValidityTokenV0.js";
import { runLivingWorldLegitimizationV0, RELEGITIMIZATION_VERDICT_V0 } from "./livingWorldDriftReelectionV0.js";
import { sealPipelineLivingWorldV0 } from "./worldSealerV0.js";
import { issueTimeOwnershipContractV0 } from "./temporalIdentityBindingV0.js";
import { EPISTEMIC_PAST_V0 } from "./replayCorruptionTaxonomyV0.js";

export const TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0 =
  "castle.rhizoh.temporal_ontological_watchdog.v0";

/**
 * @returns {boolean}
 */
export function isOntologicalWatchdogEnabledV0() {
  if (typeof import.meta === "undefined") return false;
  const env = import.meta.env || {};
  if (env.VITE_ONTOLOGICAL_WATCHDOG === "0") return false;
  return env.VITE_ONTOLOGICAL_WATCHDOG === "1" || env.VITE_SUBSTRATE_CONTINUITY_IDB === "1";
}

/**
 * @param {typeof window.__rhizoh_boot_context} bootCtx
 * @param {string} [diskKey]
 */
export function buildLocalContractFromBootContextV0(bootCtx, diskKey) {
  const ctx = bootCtx || (typeof window !== "undefined" ? window.__rhizoh_boot_context : null);
  if (!ctx) return null;
  return issueTimeOwnershipContractV0({
    nodeId:
      typeof window !== "undefined"
        ? String(window.__rhizoh_node_id || ctx.livingNodeId || "node:local")
        : String(ctx.livingNodeId || "node:local"),
    diskKey: diskKey || REALITY_SEAL_DISK_KEY_V0,
    epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
    trustedCheckpointTick: Number(ctx.targetTick) || 0,
    trustedThroughTick: Number(ctx.targetTick) || 0,
    replayFromTick: Number(ctx.replayOrigin) ?? Number(ctx.targetTick) - 8,
    executionPermitted: true
  });
}

/**
 * @param {{
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   remoteContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   selfNodeId?: string,
 *   diskKey?: string,
 *   persist?: boolean,
 *   hardReloadOnDrift?: boolean
 * }} [opts]
 */
export async function runTemporalOntologicalWatchdogPassV0(opts = {}) {
  if (!isOntologicalWatchdogEnabledV0()) {
    return { schema: TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0, skipped: true };
  }

  const diskKey = opts.diskKey || REALITY_SEAL_DISK_KEY_V0;

  const expectedToken =
    typeof window !== "undefined" ? window.__rhizoh_boot_validity_token ?? null : null;
  const lastApplied = getLastAppliedBootSealVersionV0();
  if (expectedToken) {
    let dbForValidity = null;
    if (typeof indexedDB !== "undefined") {
      dbForValidity = await openSubstrateContinuityIdbV0();
    }
    try {
      const validity = await enforceRuntimeBootValidityTokenV0(
        expectedToken,
        dbForValidity,
        diskKey,
        { lastAppliedBootSealVersion: lastApplied }
      );
      if (validity.hardReload) {
        return {
          schema: TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0,
          bootValidity: validity,
          hardReloadScheduled: true,
          statement: validity.statement
        };
      }
    } finally {
      dbForValidity?.close();
    }
  }

  const local =
    opts.localContract || buildLocalContractFromBootContextV0(null, diskKey);
  if (!local) {
    return { schema: TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0, skipped: true, reason: "no_local_contract" };
  }

  const remote =
    opts.remoteContract ||
    issueTimeOwnershipContractV0({
      nodeId: "node:peer",
      diskKey,
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: local.trustedCheckpointTick,
      trustedThroughTick: local.trustedThroughTick,
      replayFromTick: local.replayFromTick,
      executionPermitted: true
    });

  const leg = await runLivingWorldLegitimizationV0({
    selfNodeId: opts.selfNodeId || local.nodeId,
    localContract: local,
    remoteContract: remote,
    diskKey,
    persist: opts.persist !== false,
    nowMs: Date.now(),
    policy: { maxLegitimacyAgeMs: 60_000 }
  });

  const driftVerdict = leg.drift?.verdict;
  const needsHardStop =
    driftVerdict === RELEGITIMIZATION_VERDICT_V0.RE_ELECTION_REQUIRED ||
    driftVerdict === RELEGITIMIZATION_VERDICT_V0.QUARANTINE ||
    leg.bootstrapRevoked === true;

  if (needsHardStop && opts.hardReloadOnDrift !== false && typeof window !== "undefined") {
    return {
      schema: TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0,
      leg,
      hardReloadScheduled: true,
      statement: "Reality drift — bootstrap revoked; reload for clean world selection."
    };
  }

  if (driftVerdict === RELEGITIMIZATION_VERDICT_V0.STILL_LEGITIMATE && leg.pipeline) {
    let db = null;
    if (typeof indexedDB !== "undefined") {
      db = await openSubstrateContinuityIdbV0();
    }
    try {
      await sealPipelineLivingWorldV0(leg.pipeline, db ?? undefined);
      const fresh = await getBootAtomicSealV0(db ?? null, diskKey);
      commitLastAppliedBootSealVersionV0(fresh.bootSealVersion, fresh.token);
      if (typeof window !== "undefined" && fresh.bootSealChainHead) {
        window.__rhizoh_boot_seal_chain_head = fresh.bootSealChainHead;
      }
    } finally {
      db?.close();
    }
  }

  return {
    schema: TEMPORAL_ONTOLOGICAL_WATCHDOG_SCHEMA_V0,
    leg,
    hardReloadScheduled: false
  };
}

/**
 * Fire-and-forget hook from sealer drain (after continuity segment).
 */
export function maybeRunOntologicalWatchdogAfterSealerDrainV0() {
  if (!isOntologicalWatchdogEnabledV0()) return;
  void runTemporalOntologicalWatchdogPassV0({ persist: true }).then((out) => {
    if (out.hardReloadScheduled && typeof window !== "undefined") {
      window.location.reload();
    }
  });
}
