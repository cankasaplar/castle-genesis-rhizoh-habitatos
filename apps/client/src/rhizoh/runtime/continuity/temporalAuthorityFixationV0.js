/**
 * Temporal Authority Fixation V0 (Faz 2.5.4)
 *
 * Damps authority oscillation — execution executor locks after stable passes;
 * challenger must beat incumbent by margin + cooldown before flip.
 */

import { computeTemporalAuthorityScoreV0 } from "./temporalConflictResolutionV0.js";
import { NETWORK_STABILIZATION_VERDICT_V0, bindingForNetworkExecutorV0 } from "./temporalExecutionSyncV0.js";
import { TEMPORAL_EXECUTION_BINDING_SCHEMA_V0, TEMPORAL_EXECUTION_MODE_V0 } from "./temporalExecutionBindingV0.js";

export const TEMPORAL_AUTHORITY_FIXATION_SCHEMA_V0 =
  "castle.rhizoh.temporal_authority_fixation.v0";

export const FIXATION_PHASE_V0 = Object.freeze({
  PROVISIONAL: "provisional",
  FIXED: "fixed"
});

export const FIXATION_VERDICT_V0 = Object.freeze({
  PROVISIONAL: "provisional",
  NEWLY_FIXED: "newly_fixed",
  HELD_FIXED: "held_fixed",
  DAMPED_OSCILLATION: "damped_oscillation",
  OSCILLATION_FREEZE: "oscillation_freeze",
  PASSTHROUGH: "passthrough"
});

export const DEFAULT_AUTHORITY_FIXATION_POLICY_V0 = Object.freeze({
  /** Stable sync passes before lock. */
  minStablePassesToLock: 3,
  /** Minimum ms between accepting executor flips. */
  fixationCooldownMs: 30_000,
  /** Challenger score must exceed incumbent × ratio. */
  authorityFlipMarginRatio: 1.15,
  /** Min ms between sync passes (pass-rate damping). */
  minPassIntervalMs: 500,
  /** Flips inside window → oscillation freeze. */
  maxOscillationFlips: 4,
  oscillationWindowMs: 60_000,
  /** Checkpoint spread across peers before drift re-open (ticks). */
  maxCheckpointDriftTicks: 8
});

/** @type {Map<string, FixationStateV0>} */
const fixationByDiskKeyV0 = new Map();

/**
 * @typedef {Object} FixationStateV0
 * @property {string} diskKey
 * @property {string} phase
 * @property {string|null} fixedExecutorNodeId
 * @property {string|null} lastProposedExecutor
 * @property {number} consecutiveStablePasses
 * @property {number} lockedAtMs
 * @property {number} lastPassAtMs
 * @property {number} lastFlipAtMs
 * @property {{ atMs: number, from: string|null, to: string|null }[]} flipLog
 */

/**
 * @param {string} diskKey
 */
export function getTemporalAuthorityFixationStateV0(diskKey) {
  const key = String(diskKey || "default");
  return fixationByDiskKeyV0.get(key) ?? null;
}

/**
 * @param {string} [diskKey]
 */
export function clearTemporalAuthorityFixationStateV0(diskKey) {
  if (!diskKey) {
    fixationByDiskKeyV0.clear();
    return;
  }
  fixationByDiskKeyV0.delete(String(diskKey));
}

/**
 * Re-fixation trigger — drop lock; next pass re-derives from fresh sync.
 *
 * @param {string} diskKey
 * @param {string} [reason]
 */
export function invalidateTemporalAuthorityFixationV0(diskKey, reason = "audit_refixation") {
  const key = String(diskKey || "default");
  const state = fixationByDiskKeyV0.get(key);
  if (!state) {
    return { ok: true, code: "no_state", reason };
  }
  state.phase = FIXATION_PHASE_V0.PROVISIONAL;
  state.fixedExecutorNodeId = null;
  state.consecutiveStablePasses = 0;
  state.lockedAtMs = 0;
  state.lastProposedExecutor = null;
  return { ok: true, diskKey: key, reason };
}

/**
 * @param {string} diskKey
 */
function getOrCreateFixationStateV0(diskKey) {
  const key = String(diskKey || "default");
  let state = fixationByDiskKeyV0.get(key);
  if (!state) {
    state = {
      diskKey: key,
      phase: FIXATION_PHASE_V0.PROVISIONAL,
      fixedExecutorNodeId: null,
      lastProposedExecutor: null,
      consecutiveStablePasses: 0,
      lockedAtMs: 0,
      lastPassAtMs: 0,
      lastFlipAtMs: 0,
      flipLog: []
    };
    fixationByDiskKeyV0.set(key, state);
  }
  return state;
}

/**
 * @param {{ nodeId: string, contract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 }[]} participants
 * @param {string} incumbentId
 * @param {string} challengerId
 * @param {{ nowMs?: number, authorityFlipMarginRatio?: number }} [opts]
 */
export function challengerBeatsFixationMarginV0(participants, incumbentId, challengerId, opts = {}) {
  const ratio = Number(opts.authorityFlipMarginRatio) || DEFAULT_AUTHORITY_FIXATION_POLICY_V0.authorityFlipMarginRatio;
  const rows = participants || [];
  const scoreOf = (nodeId) => {
    const row = rows.find((r) => String(r.nodeId) === String(nodeId));
    if (!row?.contract) return 0;
    return computeTemporalAuthorityScoreV0(row.contract, { nowMs: opts.nowMs }).score;
  };
  const incumbentScore = scoreOf(incumbentId);
  const challengerScore = scoreOf(challengerId);
  if (challengerScore <= incumbentScore) return false;
  if (incumbentScore <= 0) return challengerScore > 0;
  return challengerScore >= incumbentScore * ratio;
}

/**
 * Normalize peer checkpoint spread — drift within band does not reopen fixation.
 *
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} local
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[]} peerContracts
 * @param {number} [maxDriftTicks]
 */
export function normalizeCheckpointDriftV0(local, peerContracts, maxDriftTicks) {
  const maxDrift =
    Number(maxDriftTicks) || DEFAULT_AUTHORITY_FIXATION_POLICY_V0.maxCheckpointDriftTicks;
  const anchor = Number(local?.trustedCheckpointTick) || 0;
  const peers = peerContracts || [];
  let maxSpread = 0;
  for (const c of peers) {
    const tick = Number(c?.trustedCheckpointTick) || 0;
    maxSpread = Math.max(maxSpread, Math.abs(tick - anchor));
  }
  return {
    withinBand: maxSpread <= maxDrift,
    anchorTick: anchor,
    maxSpreadTicks: maxSpread,
    maxDriftTicks: maxDrift
  };
}

/**
 * @param {FixationStateV0} state
 * @param {string|null} proposed
 * @param {number} nowMs
 * @param {typeof DEFAULT_AUTHORITY_FIXATION_POLICY_V0} policy
 */
function recordOscillationFlipV0(state, proposed, nowMs, policy) {
  const from = state.fixedExecutorNodeId || state.lastProposedExecutor;
  if (from && proposed && from !== proposed) {
    state.flipLog.push({ atMs: nowMs, from, to: proposed });
    state.lastFlipAtMs = nowMs;
    const windowStart = nowMs - policy.oscillationWindowMs;
    state.flipLog = state.flipLog.filter((f) => f.atMs >= windowStart);
  }
}

/**
 * @param {Awaited<ReturnType<typeof import('./temporalExecutionSyncV0.js').stabilizeNetworkExecutionAuthorityV0>>} stabilization
 * @param {{
 *   selfNodeId: string,
 *   diskKey?: string,
 *   nowMs?: number,
 *   policy?: Partial<typeof DEFAULT_AUTHORITY_FIXATION_POLICY_V0>,
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[]
 * }} ctx
 */
export function applyTemporalAuthorityFixationV0(stabilization, ctx) {
  const policy = { ...DEFAULT_AUTHORITY_FIXATION_POLICY_V0, ...ctx.policy };
  const nowMs = Number(ctx.nowMs) || Date.now();
  const selfNodeId = String(ctx.selfNodeId || "");
  const diskKey = String(ctx.diskKey || "default");
  const state = getOrCreateFixationStateV0(diskKey);
  const proposed = stabilization?.networkExecutorNodeId ?? null;
  const participants = stabilization?.authorityParticipants || [];

  if (stabilization?.verdict === NETWORK_STABILIZATION_VERDICT_V0.NETWORK_FREEZE) {
    return buildFixationResult({
      stabilization,
      selfNodeId,
      state,
      verdict: FIXATION_VERDICT_V0.OSCILLATION_FREEZE,
      effectiveExecutor: null,
      selfBinding: stabilization.selfBinding,
      oscillationDamped: true,
      statement: "Network freeze — fixation holds cluster mutation closed."
    });
  }

  if (!proposed) {
    return buildFixationResult({
      stabilization,
      selfNodeId,
      state,
      verdict: FIXATION_VERDICT_V0.PASSTHROUGH,
      effectiveExecutor: null,
      selfBinding: stabilization.selfBinding,
      oscillationDamped: false,
      statement: "No proposed executor — passthrough binding."
    });
  }

  const localContract = ctx.localContract || ctx.peerContracts?.[0] || { trustedCheckpointTick: 0 };
  const drift = normalizeCheckpointDriftV0(
    localContract,
    (ctx.peerContracts || []).filter((c) => c !== localContract),
    policy.maxCheckpointDriftTicks
  );

  if (state.flipLog.length >= policy.maxOscillationFlips) {
    const frozenBinding = buildOscillationFreezeBindingV0(selfNodeId, state.fixedExecutorNodeId);
    return buildFixationResult({
      stabilization,
      selfNodeId,
      state,
      verdict: FIXATION_VERDICT_V0.OSCILLATION_FREEZE,
      effectiveExecutor: state.fixedExecutorNodeId,
      selfBinding: frozenBinding,
      oscillationDamped: true,
      drift,
      statement: "Authority oscillation limit — fixation freeze."
    });
  }

  let effectiveExecutor = proposed;
  let verdict = FIXATION_VERDICT_V0.PROVISIONAL;
  let oscillationDamped = false;

  if (state.lastPassAtMs > 0 && nowMs - state.lastPassAtMs < policy.minPassIntervalMs) {
    if (state.lastProposedExecutor) {
      effectiveExecutor = state.lastProposedExecutor;
      oscillationDamped = true;
      verdict = FIXATION_VERDICT_V0.DAMPED_OSCILLATION;
    }
  }

  if (state.phase === FIXATION_PHASE_V0.FIXED && state.fixedExecutorNodeId) {
    const incumbent = state.fixedExecutorNodeId;
    recordOscillationFlipV0(state, proposed, nowMs, policy);

    if (String(proposed) !== String(incumbent)) {
      const cooldownOk = nowMs - state.lastFlipAtMs >= policy.fixationCooldownMs;
      const marginOk = challengerBeatsFixationMarginV0(participants, incumbent, proposed, {
        nowMs,
        authorityFlipMarginRatio: policy.authorityFlipMarginRatio
      });

      if (cooldownOk && marginOk && drift.withinBand) {
        state.phase = FIXATION_PHASE_V0.PROVISIONAL;
        state.fixedExecutorNodeId = proposed;
        state.consecutiveStablePasses = 1;
        state.lastProposedExecutor = proposed;
        effectiveExecutor = proposed;
        verdict = FIXATION_VERDICT_V0.PROVISIONAL;
      } else {
        effectiveExecutor = incumbent;
        oscillationDamped = true;
        verdict = FIXATION_VERDICT_V0.DAMPED_OSCILLATION;
      }
    } else {
      state.consecutiveStablePasses += 1;
      effectiveExecutor = incumbent;
      verdict = FIXATION_VERDICT_V0.HELD_FIXED;
    }
  } else {
    if (String(proposed) === String(state.lastProposedExecutor)) {
      state.consecutiveStablePasses += 1;
    } else {
      state.consecutiveStablePasses = 1;
      state.lastProposedExecutor = proposed;
      recordOscillationFlipV0(state, proposed, nowMs, policy);
    }

    effectiveExecutor = oscillationDamped ? effectiveExecutor : proposed;

    if (state.consecutiveStablePasses >= policy.minStablePassesToLock) {
      state.phase = FIXATION_PHASE_V0.FIXED;
      state.fixedExecutorNodeId = effectiveExecutor;
      state.lockedAtMs = nowMs;
      verdict =
        verdict === FIXATION_VERDICT_V0.DAMPED_OSCILLATION
          ? FIXATION_VERDICT_V0.DAMPED_OSCILLATION
          : FIXATION_VERDICT_V0.NEWLY_FIXED;
    } else {
      verdict = oscillationDamped ? FIXATION_VERDICT_V0.DAMPED_OSCILLATION : FIXATION_VERDICT_V0.PROVISIONAL;
    }
  }

  state.lastPassAtMs = nowMs;
  if (!oscillationDamped) {
    state.lastProposedExecutor = effectiveExecutor;
  }

  const selfBinding = bindingForNetworkExecutorV0(selfNodeId, effectiveExecutor);

  return buildFixationResult({
    stabilization,
    selfNodeId,
    state,
    verdict,
    effectiveExecutor,
    selfBinding,
    oscillationDamped,
    drift,
    proposedExecutor: proposed,
    statement: fixationStatement(verdict, effectiveExecutor, proposed, oscillationDamped)
  });
}

function buildFixationResult(fields) {
  const {
    stabilization,
    selfNodeId,
    state,
    verdict,
    effectiveExecutor,
    selfBinding,
    oscillationDamped,
    drift,
    proposedExecutor,
    statement
  } = fields;

  return {
    schema: TEMPORAL_AUTHORITY_FIXATION_SCHEMA_V0,
    verdict,
    fixationPhase: state.phase,
    fixedExecutorNodeId: state.fixedExecutorNodeId,
    effectiveExecutorNodeId: effectiveExecutor,
    proposedExecutorNodeId: proposedExecutor ?? stabilization?.networkExecutorNodeId ?? null,
    consecutiveStablePasses: state.consecutiveStablePasses,
    oscillationDamped: Boolean(oscillationDamped),
    oscillationFlipCount: state.flipLog.length,
    drift: drift ?? null,
    selfBinding,
    stabilization,
    statement: statement || ""
  };
}

function fixationStatement(verdict, effective, proposed, damped) {
  if (verdict === FIXATION_VERDICT_V0.HELD_FIXED) {
    return `Authority held fixed on ${effective}.`;
  }
  if (verdict === FIXATION_VERDICT_V0.DAMPED_OSCILLATION) {
    return `Oscillation damped — kept ${effective} (proposed ${proposed}).`;
  }
  if (verdict === FIXATION_VERDICT_V0.NEWLY_FIXED) {
    return `Authority newly fixed on ${effective}.`;
  }
  if (verdict === FIXATION_VERDICT_V0.OSCILLATION_FREEZE) {
    return "Oscillation freeze — mutation authority withdrawn.";
  }
  return damped
    ? `Provisional damped — executor ${effective}.`
    : `Provisional — executor ${effective} (${stateStablePassesHint()}).`;
}

function stateStablePassesHint() {
  return "awaiting stable passes";
}

/**
 * @param {string} selfNodeId
 * @param {string|null} lastExecutor
 */
function buildOscillationFreezeBindingV0(selfNodeId, lastExecutor) {
  if (lastExecutor) {
    const delegate = bindingForNetworkExecutorV0(selfNodeId, lastExecutor);
    return {
      ...delegate,
      mayMutateSubstrate: false,
      mayAppendWal: false,
      mayRehydrate: false,
      mayExecuteLocally: false,
      executionMode: TEMPORAL_EXECUTION_MODE_V0.TEMPORAL_FREEZE,
      conflictResolution: "oscillation_freeze",
      statement: "Oscillation freeze — observe only until cluster stabilizes."
    };
  }
  return {
    schema: TEMPORAL_EXECUTION_BINDING_SCHEMA_V0,
    role: "local",
    executionMode: TEMPORAL_EXECUTION_MODE_V0.TEMPORAL_FREEZE,
    mayMutateSubstrate: false,
    mayAppendWal: false,
    mayRehydrate: false,
    mayExecuteLocally: false,
    electedExecutorNodeId: null,
    conflictResolution: "oscillation_freeze",
    statement: "Oscillation freeze — no executor."
  };
}
