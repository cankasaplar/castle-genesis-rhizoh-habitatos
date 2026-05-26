/**
 * Temporal Execution Synchronization V0 (Faz 2.5.3)
 *
 * Local execution policy → network-stabilized authority.
 * Resolves split-brain: node A local_sovereign + node B local_sovereign.
 */

import {
  computeTemporalAuthorityScoreV0,
  mapEpistemicPastToIssuancePathV0
} from "./temporalConflictResolutionV0.js";
import {
  CONCURRENCY_MODEL_V0,
  EXECUTION_GATE_EFFECT_V0,
  TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
  TEMPORAL_EXECUTION_MODE_V0,
  bindTemporalExecutionFromConflictV0,
  deriveEffectiveExecutionPermissionV0,
  electSingleExecutorNodeIdV0,
  resolveAndBindTemporalExecutionV0
} from "./temporalExecutionBindingV0.js";

export const TEMPORAL_EXECUTION_SYNC_SCHEMA_V0 =
  "castle.rhizoh.temporal_execution_sync.v0";

export const TEMPORAL_EXECUTION_ADVERT_SCHEMA_V0 =
  "castle.rhizoh.temporal_execution_advert.v0";

export const NETWORK_STABILIZATION_VERDICT_V0 = Object.freeze({
  /** Single mutator on the network view. */
  CONSENSUS_SOVEREIGN: "consensus_sovereign",
  /** Multiple sovereign claims resolved to one executor. */
  SPLIT_BRAIN_RESOLVED: "split_brain_resolved",
  /** Pairwise agreement — no global mutation needed. */
  PAIRWISE_STABLE: "pairwise_stable",
  /** Unresolved global tie — freeze cluster. */
  NETWORK_FREEZE: "network_freeze",
  NO_MUTATORS: "no_mutators"
});

/** @type {Map<string, { advertisement: object, receivedAtMs: number }>} */
const peerPolicyByCastleIdV0 = new Map();

/**
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} contract
 * @param {import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0} binding
 * @param {{ policyEpoch?: number, castleId?: string }} [meta]
 */
export function buildTemporalExecutionAdvertisementV0(contract, binding, meta = {}) {
  return {
    schema: TEMPORAL_EXECUTION_ADVERT_SCHEMA_V0,
    nodeId: String(contract?.nodeId || ""),
    castleId: String(meta.castleId || contract?.nodeId || "").slice(0, 64),
    diskKey: String(contract?.diskKey || ""),
    policyEpoch: Number(meta.policyEpoch) || Date.now(),
    observedAtMs: Date.now(),
    contract: {
      nodeId: contract?.nodeId,
      diskKey: contract?.diskKey,
      epistemicPast: contract?.epistemicPast,
      trustedCheckpointTick: contract?.trustedCheckpointTick,
      trustedThroughTick: contract?.trustedThroughTick,
      replayFromTick: contract?.replayFromTick,
      executionPermitted: contract?.executionPermitted,
      issuedAtMs: contract?.issuedAtMs,
      issuancePath: contract?.issuancePath || mapEpistemicPastToIssuancePathV0(contract?.epistemicPast),
      lineageDepth: contract?.lineageDepth,
      witnessStrength: contract?.witnessStrength
    },
    binding: {
      executionMode: binding?.executionMode,
      gateEffect: binding?.gateEffect,
      concurrencyModel: binding?.concurrencyModel,
      mayMutateSubstrate: binding?.mayMutateSubstrate,
      mayRehydrate: binding?.mayRehydrate,
      mayAppendWal: binding?.mayAppendWal,
      electedExecutorNodeId: binding?.electedExecutorNodeId,
      conflictResolution: binding?.conflictResolution
    }
  };
}

/**
 * @param {object} advertisement
 */
export function recordPeerTemporalExecutionAdvertisementV0(advertisement) {
  const castleId = String(advertisement?.castleId || advertisement?.nodeId || "").trim();
  if (!castleId) return { ok: false, code: "missing_castle_id" };
  peerPolicyByCastleIdV0.set(castleId, {
    advertisement,
    receivedAtMs: Date.now()
  });
  return { ok: true, castleId };
}

/**
 * @param {string} [diskKey]
 */
export function listPeerTemporalExecutionAdvertisementsV0(diskKey) {
  const key = diskKey ? String(diskKey) : null;
  return [...peerPolicyByCastleIdV0.values()]
    .map((row) => row.advertisement)
    .filter((ad) => !key || String(ad?.diskKey || ad?.contract?.diskKey || "") === key);
}

/** @param {string} [diskKey] */
export function clearPeerTemporalExecutionAdvertisementsV0(diskKey) {
  if (!diskKey) {
    peerPolicyByCastleIdV0.clear();
    return;
  }
  for (const [id, row] of peerPolicyByCastleIdV0) {
    if (String(row.advertisement?.diskKey || row.advertisement?.contract?.diskKey || "") === diskKey) {
      peerPolicyByCastleIdV0.delete(id);
    }
  }
}

/**
 * @param {import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0 | null | undefined} binding
 * @param {string} nodeId
 */
export function claimsSubstrateMutationAuthorityV0(binding, nodeId) {
  if (!binding) return false;
  if (binding.mayMutateSubstrate === true) return true;
  if (binding.executionMode === TEMPORAL_EXECUTION_MODE_V0.LOCAL_SOVEREIGN) return true;
  return (
    binding.executionMode === TEMPORAL_EXECUTION_MODE_V0.SINGLE_EXECUTOR_SHARED &&
    String(binding.electedExecutorNodeId || "") === String(nodeId || "")
  );
}

/**
 * Deterministic network executor among competing contracts.
 *
 * @param {{ nodeId: string, contract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 }[]} participants
 * @param {{ nowMs?: number, witnessHalfLifeMs?: number }} [opts]
 */
export function computeNetworkExecutorNodeIdV0(participants, opts = {}) {
  const rows = (participants || []).filter((p) => p?.contract && p?.nodeId);
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0].nodeId;

  const scored = rows.map((p) => ({
    ...p,
    authority: computeTemporalAuthorityScoreV0(p.contract, opts)
  }));

  scored.sort((a, b) => {
    if (b.authority.score !== a.authority.score) return b.authority.score - a.authority.score;
    return String(a.nodeId).localeCompare(String(b.nodeId));
  });

  const topScore = scored[0].authority.score;
  const tied = scored.filter((s) => s.authority.score === topScore);

  if (tied.length === 1) {
    return tied[0].nodeId;
  }

  let winnerId = tied[0].nodeId;
  let winnerContract = tied[0].contract;
  for (let i = 1; i < tied.length; i += 1) {
    winnerId = electSingleExecutorNodeIdV0(
      { ...winnerContract, nodeId: winnerId },
      { ...tied[i].contract, nodeId: tied[i].nodeId }
    );
    winnerContract =
      winnerId === tied[i].nodeId ? tied[i].contract : winnerContract;
  }
  return winnerId;
}

/**
 * @param {{ nodeId: string, contract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 }[]} participants
 * @param {string} executorNodeId
 * @param {{ nowMs?: number }} [opts]
 */
export function detectUnresolvedGlobalAuthorityTieV0(participants, executorNodeId, opts = {}) {
  const scored = (participants || []).map((p) => ({
    nodeId: p.nodeId,
    path:
      p.contract?.issuancePath || mapEpistemicPastToIssuancePathV0(p.contract?.epistemicPast),
    score: computeTemporalAuthorityScoreV0(p.contract, opts).score
  }));
  const top = scored.find((s) => s.nodeId === executorNodeId)?.score;
  if (!Number.isFinite(top)) return false;
  const tied = scored.filter((s) => s.score === top);
  const paths = new Set(tied.map((t) => t.path));
  return tied.length > 1 && paths.size > 1;
}

/**
 * @param {{
 *   selfNodeId: string,
 *   selfContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   selfBinding: import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0,
 *   peers?: Array<{
 *     nodeId: string,
 *     castleId?: string,
 *     contract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *     binding: import('./temporalExecutionBindingV0.js').TemporalExecutionBindingV0
 *   }>,
 *   nowMs?: number,
 *   allowSpeculativeBranch?: boolean
 * }} input
 */
export function stabilizeNetworkExecutionAuthorityV0(input) {
  const selfNodeId = String(input.selfNodeId || input.selfContract?.nodeId || "");
  const selfContract = input.selfContract;
  const selfBinding = input.selfBinding;
  const diskKey = String(selfContract?.diskKey || "");
  const opts = { nowMs: input.nowMs, allowSpeculativeBranch: input.allowSpeculativeBranch };

  const peers = (input.peers || []).filter(
    (p) => String(p?.contract?.diskKey || "") === diskKey || !diskKey
  );

  const selfParticipant = {
    nodeId: selfNodeId,
    contract: selfContract,
    binding: selfBinding
  };

  const mutators = [selfParticipant, ...peers].filter((p) =>
    claimsSubstrateMutationAuthorityV0(p.binding, p.nodeId)
  );

  if (mutators.length === 0) {
    return {
      schema: TEMPORAL_EXECUTION_SYNC_SCHEMA_V0,
      verdict: NETWORK_STABILIZATION_VERDICT_V0.NO_MUTATORS,
      networkExecutorNodeId: null,
      selfBinding: freezeBindingForNetwork(selfNodeId, "no_network_mutator"),
      splitBrainDetected: false,
      mutatorNodeIds: [],
      statement: "No node claims substrate mutation — cluster observe/freeze."
    };
  }

  if (mutators.length === 1) {
    const executor = mutators[0].nodeId;
    return {
      schema: TEMPORAL_EXECUTION_SYNC_SCHEMA_V0,
      verdict: NETWORK_STABILIZATION_VERDICT_V0.CONSENSUS_SOVEREIGN,
      networkExecutorNodeId: executor,
      selfBinding: bindingForNetworkExecutor(selfNodeId, executor, opts),
      splitBrainDetected: false,
      mutatorNodeIds: [executor],
      authorityParticipants: [{ nodeId: executor, contract: mutators[0].contract }],
      statement: "Single network mutator — consensus sovereign."
    };
  }

  const participants = mutators.map((m) => ({ nodeId: m.nodeId, contract: m.contract }));
  const executor = computeNetworkExecutorNodeIdV0(participants, opts);

  if (
    detectUnresolvedGlobalAuthorityTieV0(participants, executor, opts) &&
    !opts.allowSpeculativeBranch
  ) {
    return {
      schema: TEMPORAL_EXECUTION_SYNC_SCHEMA_V0,
      verdict: NETWORK_STABILIZATION_VERDICT_V0.NETWORK_FREEZE,
      networkExecutorNodeId: null,
      selfBinding: freezeBindingForNetwork(selfNodeId, "global_authority_tie"),
      splitBrainDetected: true,
      mutatorNodeIds: mutators.map((m) => m.nodeId),
      statement:
        "Split-brain with unresolved global authority tie — network freeze until merge policy."
    };
  }

  return {
    schema: TEMPORAL_EXECUTION_SYNC_SCHEMA_V0,
    verdict: NETWORK_STABILIZATION_VERDICT_V0.SPLIT_BRAIN_RESOLVED,
    networkExecutorNodeId: executor,
    selfBinding: bindingForNetworkExecutor(selfNodeId, executor, opts),
    splitBrainDetected: true,
    mutatorNodeIds: mutators.map((m) => m.nodeId),
    authorityParticipants: participants,
    statement: `Split-brain resolved — network executor: ${executor}.`
  };
}

/**
 * Local pairwise bind + peer advertisements → stabilized self binding.
 *
 * @param {{
 *   selfNodeId: string,
 *   localContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   remoteContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerAdvertisements?: object[],
 *   nowMs?: number,
 *   allowSpeculativeBranch?: boolean
 * }} input
 */
export function runTemporalExecutionSyncPassV0(input) {
  const pairwise = resolveAndBindTemporalExecutionV0(
    input.localContract,
    input.remoteContract,
    {
      nowMs: input.nowMs,
      allowSpeculativeBranch: input.allowSpeculativeBranch
    }
  );

  const peersFromAds = (input.peerAdvertisements || [])
    .map((ad) => advertisementToPeerParticipant(ad))
    .filter(Boolean);

  const remoteFromPair = {
    nodeId: String(input.remoteContract?.nodeId || ""),
    contract: input.remoteContract,
    binding: pairwise.remote
  };
  const peerMap = new Map();
  if (remoteFromPair.nodeId) peerMap.set(remoteFromPair.nodeId, remoteFromPair);
  for (const p of peersFromAds) {
    peerMap.set(p.nodeId, p);
  }

  const stabilization = stabilizeNetworkExecutionAuthorityV0({
    selfNodeId: input.selfNodeId,
    selfContract: input.localContract,
    selfBinding: pairwise.local,
    peers: [...peerMap.values()],
    nowMs: input.nowMs,
    allowSpeculativeBranch: input.allowSpeculativeBranch
  });

  return {
    schema: TEMPORAL_EXECUTION_SYNC_SCHEMA_V0,
    pairwise,
    stabilization,
    networkExecutorNodeId: stabilization.networkExecutorNodeId,
    stabilizedSelfBinding: stabilization.selfBinding
  };
}

/**
 * @param {Awaited<ReturnType<typeof runTemporalExecutionSyncPassV0>>} syncPass
 * @param {Awaited<ReturnType<typeof import('./temporalExecutionBindingV0.js').deriveEffectiveExecutionPermissionV0>> extends infer T ? { mayRehydrate?: boolean, rehydrateGate?: string, executionPermission?: object } : never} recovery
 */
export function deriveStabilizedEffectiveExecutionPermissionV0(recovery, syncPass) {
  return deriveEffectiveExecutionPermissionV0(recovery, syncPass.stabilizedSelfBinding);
}

/**
 * @param {object} ad
 */
function advertisementToPeerParticipant(ad) {
  if (!ad || ad.schema !== TEMPORAL_EXECUTION_ADVERT_SCHEMA_V0) return null;
  const contract = ad.contract;
  const binding = {
    schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
    role: "remote",
    ...ad.binding
  };
  return {
    nodeId: String(ad.nodeId || contract?.nodeId || ""),
    castleId: ad.castleId,
    contract,
    binding
  };
}

/**
 * @param {string} selfNodeId
 * @param {string} networkExecutorNodeId
 * @param {{ allowSpeculativeBranch?: boolean }} [opts]
 */
/** @public — used by authority fixation layer. */
export function bindingForNetworkExecutorV0(selfNodeId, networkExecutorNodeId) {
  return bindingForNetworkExecutor(selfNodeId, networkExecutorNodeId, {});
}

function bindingForNetworkExecutor(selfNodeId, networkExecutorNodeId, opts = {}) {
  if (String(selfNodeId) === String(networkExecutorNodeId)) {
    return {
      schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
      role: "local",
      executionMode: TEMPORAL_EXECUTION_MODE_V0.LOCAL_SOVEREIGN,
      gateEffect: EXECUTION_GATE_EFFECT_V0.OPEN,
      concurrencyModel: CONCURRENCY_MODEL_V0.SOVEREIGN_SINGLE,
      mayExecuteLocally: true,
      mayMutateSubstrate: true,
      mayRehydrate: true,
      mayAppendWal: true,
      electedExecutorNodeId: networkExecutorNodeId,
      conflictResolution: "network_stabilized",
      statement: "Network-stabilized local sovereign executor."
    };
  }

  return {
    schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
    role: "local",
    executionMode: TEMPORAL_EXECUTION_MODE_V0.REMOTE_SOVEREIGN,
    gateEffect: EXECUTION_GATE_EFFECT_V0.MUTATION_FROZEN,
    concurrencyModel: CONCURRENCY_MODEL_V0.SOVEREIGN_SINGLE,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: networkExecutorNodeId,
    conflictResolution: "network_stabilized",
    statement: `Network delegate — executor is ${networkExecutorNodeId}.`
  };
}

function freezeBindingForNetwork(selfNodeId, reason) {
  const conflict = { resolution: "temporal_conflict", primary: { verdict: "divergent_jurisdiction" } };
  return bindTemporalExecutionFromConflictV0(conflict, {
    role: "local",
    localContract: { nodeId: selfNodeId, executionPermitted: false },
    allowSpeculativeBranch: false
  });
}
