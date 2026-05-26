/**
 * Temporal Execution Binding V0 (Faz 2.5.2)
 *
 * Conflict resolution → execution policy (not another decision).
 * Same reality may fork epistemically; execution behavior must be singular per node.
 */

import { REHYDRATE_GATE_V0 } from "./replayCorruptionTaxonomyV0.js";
import {
  JURISDICTION_VERDICT_V0,
  assertNodeExecutionJurisdictionV0
} from "./temporalIdentityBindingV0.js";
import {
  TEMPORAL_CONFLICT_VERDICT_V0,
  resolveTemporalConflictV0
} from "./temporalConflictResolutionV0.js";

export const TEMPORAL_EXECUTION_BINDING_SCHEMA_V0 =
  "castle.rhizoh.temporal_execution_binding.v0";

/** What this node is allowed to do on the substrate. */
export const TEMPORAL_EXECUTION_MODE_V0 = Object.freeze({
  /** Full local execution sovereignty. */
  LOCAL_SOVEREIGN: "local_sovereign",
  /** Local frozen; remote holds execution right. */
  REMOTE_SOVEREIGN: "remote_sovereign",
  /** Shared jurisdiction — one elected executor, others observe. */
  SINGLE_EXECUTOR_SHARED: "single_executor_shared",
  /** Unresolved conflict — mutations frozen (default prod). */
  TEMPORAL_FREEZE: "temporal_freeze",
  /** Lab-only dual-lane observation; still no shared mutation authority. */
  SPECULATIVE_BRANCH_LAB: "speculative_branch_lab",
  /** Read-only witness lane. */
  OBSERVE_ONLY: "observe_only",
  DENIED: "denied"
});

export const EXECUTION_GATE_EFFECT_V0 = Object.freeze({
  OPEN: "open",
  CLOSED: "closed",
  OBSERVE_ONLY: "observe_only",
  MUTATION_FROZEN: "mutation_frozen"
});

export const CONCURRENCY_MODEL_V0 = Object.freeze({
  SOVEREIGN_SINGLE: "sovereign_single",
  SINGLE_EXECUTOR_ELECTED: "single_executor_elected",
  NONE_FROZEN: "none_frozen",
  SPECULATIVE_DUAL_OBSERVE: "speculative_dual_observe"
});

/**
 * @typedef {Object} TemporalExecutionBindingV0
 * @property {string} schema
 * @property {string} role
 * @property {string} executionMode
 * @property {string} gateEffect
 * @property {string} concurrencyModel
 * @property {boolean} mayExecuteLocally
 * @property {boolean} mayMutateSubstrate
 * @property {boolean} mayRehydrate
 * @property {boolean} mayAppendWal
 * @property {string|null} electedExecutorNodeId
 * @property {string} conflictResolution
 * @property {string} statement
 */

/**
 * Deterministic single-executor election for shared jurisdiction.
 *
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} a
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} b
 */
export function electSingleExecutorNodeIdV0(a, b) {
  const aId = String(a?.nodeId || "");
  const bId = String(b?.nodeId || "");
  if (aId && bId && aId !== bId) {
    return aId < bId ? aId : bId;
  }
  const aJ = String(a?.jurisdictionId || aId);
  const bJ = String(b?.jurisdictionId || bId);
  if (aJ !== bJ) {
    return aJ < bJ ? aId || aJ : bId || bJ;
  }
  const aIssued = Number(a?.issuedAtMs) || 0;
  const bIssued = Number(b?.issuedAtMs) || 0;
  return aIssued <= bIssued ? aId || aJ : bId || bJ;
}

/**
 * Map conflict resolution → execution policy for one node role.
 *
 * @param {Awaited<ReturnType<typeof resolveTemporalConflictV0>>} conflict
 * @param {{
 *   role?: 'local' | 'remote',
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   remoteContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   allowSpeculativeBranch?: boolean
 * }} [ctx]
 * @returns {TemporalExecutionBindingV0}
 */
export function bindTemporalExecutionFromConflictV0(conflict, ctx = {}) {
  const role = ctx.role === "remote" ? "remote" : "local";
  const local = ctx.localContract;
  const remote = ctx.remoteContract;
  const contract = role === "remote" ? remote : local;
  const resolution = String(conflict?.resolution || "");
  const allowSpeculative = ctx.allowSpeculativeBranch === true;

  let draft = buildDeniedBinding(role, resolution, "unknown_conflict_resolution");

  if (resolution === TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY) {
    draft =
      role === "local"
        ? sovereignLocalBinding(role, resolution)
        : observeOnlyBinding(role, resolution, "remote_observe_local_executes");
  } else if (resolution === TEMPORAL_CONFLICT_VERDICT_V0.REMOTE_WINS_AUTHORITY) {
    draft =
      role === "remote"
        ? sovereignLocalBinding("remote", resolution)
        : remoteSovereignBinding(role, resolution);
  } else if (resolution === TEMPORAL_CONFLICT_VERDICT_V0.SHARED_JURISDICTION_EQUAL_RIGHTS) {
    draft = sharedJurisdictionBinding(role, resolution, local, remote);
  } else if (resolution === TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT) {
    draft = allowSpeculative
      ? speculativeBranchBinding(role, resolution)
      : temporalFreezeBinding(role, resolution);
  } else if (resolution === TEMPORAL_CONFLICT_VERDICT_V0.PRIMARY_JURISDICTION) {
    draft = bindFromPrimaryJurisdiction(conflict?.primary, role, resolution);
  }

  return finalizeBindingWithContract(draft, contract);
}

/**
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} local
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} remote
 * @param {{ nowMs?: number, allowSpeculativeBranch?: boolean, witnessHalfLifeMs?: number }} [opts]
 */
export function resolveAndBindTemporalExecutionV0(local, remote, opts = {}) {
  const conflict = resolveTemporalConflictV0(local, remote, opts);
  const ctx = { localContract: local, remoteContract: remote, allowSpeculativeBranch: opts.allowSpeculativeBranch };
  return {
    schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
    conflict,
    local: bindTemporalExecutionFromConflictV0(conflict, { ...ctx, role: "local" }),
    remote: bindTemporalExecutionFromConflictV0(conflict, { ...ctx, role: "remote" })
  };
}

/**
 * Merge orchestrator permission with temporal execution binding.
 *
 * @param {{
 *   mayRehydrate?: boolean,
 *   rehydrateGate?: string,
 *   executionPermission?: { granted?: boolean | null, basis?: string }
 * }} recovery
 * @param {TemporalExecutionBindingV0} binding
 */
export function deriveEffectiveExecutionPermissionV0(recovery, binding) {
  const orchestratorOpen =
    recovery?.mayRehydrate === true && recovery?.rehydrateGate === REHYDRATE_GATE_V0.OPEN;
  const temporalAllows =
    binding?.mayRehydrate === true &&
    binding?.gateEffect === EXECUTION_GATE_EFFECT_V0.OPEN &&
    binding?.mayMutateSubstrate === true;

  const granted = orchestratorOpen && temporalAllows;
  const basis = !orchestratorOpen
    ? recovery?.executionPermission?.basis || "orchestrator_gate_closed"
    : !temporalAllows
      ? `temporal_${binding?.executionMode || "denied"}`
      : "orchestrator_and_temporal_open";

  return {
    mayRehydrate: granted,
    rehydrateGate: granted ? REHYDRATE_GATE_V0.OPEN : REHYDRATE_GATE_V0.CLOSED,
    executionPermission: {
      granted,
      basis,
      orchestratorOpen,
      temporalMode: binding?.executionMode ?? null,
      temporalGate: binding?.gateEffect ?? null,
      concurrencyModel: binding?.concurrencyModel ?? null
    },
    temporalBinding: binding
  };
}

/**
 * @param {Awaited<ReturnType<typeof resolveAndBindTemporalExecutionV0>>} bundle
 * @param {Awaited<ReturnType<typeof import('./continuityRecoveryOrchestratorV0.js').runContinuityRecoveryOrchestratorV0>>} localRecovery
 * @param {Awaited<ReturnType<typeof import('./continuityRecoveryOrchestratorV0.js').runContinuityRecoveryOrchestratorV0>>} [remoteRecovery]
 */
export function applyTemporalExecutionToRecoveryV0(bundle, localRecovery, remoteRecovery) {
  const localEffective = deriveEffectiveExecutionPermissionV0(localRecovery, bundle.local);
  const remoteEffective = remoteRecovery
    ? deriveEffectiveExecutionPermissionV0(remoteRecovery, bundle.remote)
    : null;

  return {
    ...localRecovery,
    mayRehydrate: localEffective.mayRehydrate,
    rehydrateGate: localEffective.rehydrateGate,
    executionPermission: localEffective.executionPermission,
    temporalExecution: bundle.local,
    temporalConflict: bundle.conflict,
    peerTemporalExecution: bundle.remote,
    peerEffective: remoteEffective
  };
}

function bindFromPrimaryJurisdiction(primary, role, resolution) {
  const verdict = primary?.verdict;
  if (verdict === JURISDICTION_VERDICT_V0.LOCAL_EXECUTES) {
    return role === "local"
      ? sovereignLocalBinding(role, resolution)
      : observeOnlyBinding(role, resolution, "primary_remote_observe");
  }
  if (verdict === JURISDICTION_VERDICT_V0.REMOTE_EXECUTES) {
    return role === "remote"
      ? sovereignLocalBinding("remote", resolution)
      : remoteSovereignBinding(role, resolution);
  }
  if (verdict === JURISDICTION_VERDICT_V0.NO_EXECUTION_RIGHT) {
    return buildDeniedBinding(role, resolution, "no_execution_right");
  }
  return temporalFreezeBinding(role, resolution);
}

function sovereignLocalBinding(role, resolution) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.LOCAL_SOVEREIGN,
    gateEffect: EXECUTION_GATE_EFFECT_V0.OPEN,
    concurrencyModel: CONCURRENCY_MODEL_V0.SOVEREIGN_SINGLE,
    mayExecuteLocally: true,
    mayMutateSubstrate: true,
    mayRehydrate: true,
    mayAppendWal: true,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement: "Local sovereign execution — full gate open."
  };
}

function remoteSovereignBinding(role, resolution) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.REMOTE_SOVEREIGN,
    gateEffect: EXECUTION_GATE_EFFECT_V0.MUTATION_FROZEN,
    concurrencyModel: CONCURRENCY_MODEL_V0.SOVEREIGN_SINGLE,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement: "Remote sovereign — local mutations frozen, observe only."
  };
}

function observeOnlyBinding(role, resolution, reason) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.OBSERVE_ONLY,
    gateEffect: EXECUTION_GATE_EFFECT_V0.OBSERVE_ONLY,
    concurrencyModel: CONCURRENCY_MODEL_V0.SOVEREIGN_SINGLE,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement: `Non-executor witness lane (${reason}).`
  };
}

function sharedJurisdictionBinding(role, resolution, local, remote) {
  const elected = electSingleExecutorNodeIdV0(local, remote);
  const selfId = role === "remote" ? remote?.nodeId : local?.nodeId;
  const isExecutor = String(selfId) === String(elected);

  if (isExecutor) {
    return {
      role,
      executionMode: TEMPORAL_EXECUTION_MODE_V0.SINGLE_EXECUTOR_SHARED,
      gateEffect: EXECUTION_GATE_EFFECT_V0.OPEN,
      concurrencyModel: CONCURRENCY_MODEL_V0.SINGLE_EXECUTOR_ELECTED,
      mayExecuteLocally: true,
      mayMutateSubstrate: true,
      mayRehydrate: true,
      mayAppendWal: true,
      electedExecutorNodeId: elected,
      conflictResolution: resolution,
      statement: "Shared jurisdiction — elected single executor (local role)."
    };
  }

  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.OBSERVE_ONLY,
    gateEffect: EXECUTION_GATE_EFFECT_V0.OBSERVE_ONLY,
    concurrencyModel: CONCURRENCY_MODEL_V0.SINGLE_EXECUTOR_ELECTED,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: elected,
    conflictResolution: resolution,
    statement: "Shared jurisdiction — peer is elected executor; observe-only."
  };
}

function temporalFreezeBinding(role, resolution) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.TEMPORAL_FREEZE,
    gateEffect: EXECUTION_GATE_EFFECT_V0.MUTATION_FROZEN,
    concurrencyModel: CONCURRENCY_MODEL_V0.NONE_FROZEN,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement:
      "Temporal conflict unresolved — system freeze (no speculative branch in prod default)."
  };
}

function speculativeBranchBinding(role, resolution) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.SPECULATIVE_BRANCH_LAB,
    gateEffect: EXECUTION_GATE_EFFECT_V0.OBSERVE_ONLY,
    concurrencyModel: CONCURRENCY_MODEL_V0.SPECULATIVE_DUAL_OBSERVE,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement:
      "Lab speculative dual-observe — replay/compare allowed; substrate mutations still frozen."
  };
}

function buildDeniedBinding(role, resolution, reason) {
  return {
    role,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.DENIED,
    gateEffect: EXECUTION_GATE_EFFECT_V0.CLOSED,
    concurrencyModel: CONCURRENCY_MODEL_V0.NONE_FROZEN,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    electedExecutorNodeId: null,
    conflictResolution: resolution,
    statement: `Execution denied (${reason}).`
  };
}

/**
 * @param {Omit<TemporalExecutionBindingV0, 'schema'>} draft
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 | undefined} contract
 */
function finalizeBindingWithContract(draft, contract) {
  const jurisdiction = assertNodeExecutionJurisdictionV0(contract);
  const contractDenied = jurisdiction.ok === false;

  const binding = {
    schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
    ...draft
  };

  if (!contractDenied) {
    return binding;
  }

  return {
    ...binding,
    executionMode: TEMPORAL_EXECUTION_MODE_V0.DENIED,
    gateEffect: EXECUTION_GATE_EFFECT_V0.CLOSED,
    concurrencyModel: CONCURRENCY_MODEL_V0.NONE_FROZEN,
    mayExecuteLocally: false,
    mayMutateSubstrate: false,
    mayRehydrate: false,
    mayAppendWal: false,
    statement: `${binding.statement} Contract jurisdiction denied (${jurisdiction.code}).`
  };
}
