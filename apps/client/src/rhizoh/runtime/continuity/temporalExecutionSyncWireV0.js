/**
 * Temporal execution policy propagation on peer WAL feed (Faz 2.5.3 wire).
 */

import {
  buildTemporalExecutionAdvertisementV0,
  recordPeerTemporalExecutionAdvertisementV0,
  runTemporalExecutionSyncPassV0
} from "./temporalExecutionSyncV0.js";
import { runTemporalExecutionPipelineV0 } from "./temporalAuditRefixationV0.js";

export const TEMPORAL_EXECUTION_SYNC_WIRE_SCHEMA_V0 =
  "castle.rhizoh.temporal_execution_sync_wire.v0";

/**
 * Attach local policy to outbound WAL peer feed (additive field).
 *
 * @param {Record<string, unknown>} walPeerFeed
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} contract
 * @param {import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0} binding
 * @param {{ castleId?: string, policyEpoch?: number }} [meta]
 */
export function attachTemporalExecutionPolicyToWalPeerFeedV0(walPeerFeed, contract, binding, meta = {}) {
  const policy = buildTemporalExecutionAdvertisementV0(contract, binding, meta);
  return {
    ...walPeerFeed,
    temporalExecutionPolicy: policy
  };
}

/**
 * @param {Record<string, unknown>} walPeerFeed
 */
export function extractTemporalExecutionPolicyFromWalPeerFeedV0(walPeerFeed) {
  const policy = walPeerFeed?.temporalExecutionPolicy;
  return policy && typeof policy === "object" ? policy : null;
}

/**
 * Ingest peer policy from WAL feed + run stabilization against local view.
 *
 * @param {Record<string, unknown>} walPeerFeed
 * @param {{
 *   castleId: string,
 *   selfNodeId: string,
 *   localContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   localBinding: import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0,
 *   remoteContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   nowMs?: number,
 *   allowSpeculativeBranch?: boolean
 * }} ctx
 */
export function ingestPeerWalFeedTemporalExecutionPolicyV0(walPeerFeed, ctx) {
  const policy = extractTemporalExecutionPolicyFromWalPeerFeedV0(walPeerFeed);
  if (!policy) {
    return { ok: false, code: "no_temporal_policy" };
  }

  recordPeerTemporalExecutionAdvertisementV0({
    ...policy,
    castleId: String(policy.castleId || ctx.castleId || "").slice(0, 64)
  });

  const remoteContract =
    ctx.remoteContract ||
    /** @type {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} */ ({
      ...policy.contract,
      nodeId: policy.nodeId || policy.contract?.nodeId
    });

  const syncInput = {
    selfNodeId: ctx.selfNodeId,
    localContract: ctx.localContract,
    remoteContract,
    peerAdvertisements: [policy],
    nowMs: ctx.nowMs,
    allowSpeculativeBranch: ctx.allowSpeculativeBranch
  };

  const withPipeline = ctx.useFixation !== false;
  const result = withPipeline
    ? runTemporalExecutionPipelineV0(syncInput)
    : runTemporalExecutionSyncPassV0(syncInput);

  const syncPass = withPipeline ? result.syncPass : result;

  return {
    ok: true,
    schema: TEMPORAL_EXECUTION_SYNC_WIRE_SCHEMA_V0,
    policy,
    syncPass,
    audit: withPipeline ? result.audit : null,
    auditIntegrity: withPipeline ? result.auditIntegrity : null,
    auditSeal: withPipeline ? result.auditSeal : null,
    worldSelection: withPipeline ? result.worldSelection : null,
    livingWorldBootstrap: withPipeline ? result.livingWorldBootstrap : null,
    activeContract: withPipeline ? result.activeContract : null,
    refixation: withPipeline ? result.refixation : null,
    fixation: withPipeline ? result.fixation : null,
    networkExecutorNodeId: result.networkExecutorNodeId,
    stabilizedSelfBinding: result.stabilizedSelfBinding,
    falseStabilityPrevented: withPipeline ? result.falseStabilityPrevented : false
  };
}
