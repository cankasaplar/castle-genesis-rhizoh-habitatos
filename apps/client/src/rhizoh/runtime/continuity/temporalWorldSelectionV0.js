/**
 * Temporal World Selection V0 (Faz 2.8)
 *
 * Multiple epistemically-valid pasts → which becomes the living runtime world?
 * Audit finds "correct" branches; this layer picks the one reality to bootstrap.
 */

import { EPISTEMIC_PAST_V0, REHYDRATE_GATE_V0 } from "./replayCorruptionTaxonomyV0.js";
import {
  computeTemporalAuthorityScoreV0,
  mapEpistemicPastToIssuancePathV0
} from "./temporalConflictResolutionV0.js";
import { electSingleExecutorNodeIdV0 } from "./temporalExecutionBindingV0.js";
import { assertNodeExecutionJurisdictionV0 } from "./temporalIdentityBindingV0.js";
import { FIXATION_AUDIT_VERDICT_V0 } from "./temporalAuditRefixationV0.js";

export const TEMPORAL_WORLD_SELECTION_SCHEMA_V0 =
  "castle.rhizoh.temporal_world_selection.v0";

export const WORLD_SELECTION_VERDICT_V0 = Object.freeze({
  LIVING_WORLD_SELECTED: "living_world_selected",
  AMBIGUOUS_MULTI_VALID: "ambiguous_multi_valid",
  NO_ELIGIBLE_WORLD: "no_eligible_world",
  DEFERRED_SELECTION: "deferred_selection"
});

export const DEFAULT_WORLD_SELECTION_POLICY_V0 = Object.freeze({
  /** Prefer world aligned with network executor when scores tie. */
  preferNetworkExecutorAlignment: true,
  /** Score gap at or below this triggers tie resolution (0 = equal scores only). */
  minAuthorityGap: 0,
  /** Prefer canonical_chain over repaired/truncated at equal score. */
  preferCanonicalPast: true
});

/**
 * @typedef {Object} EpistemicWorldCandidateV0
 * @property {string} worldId
 * @property {string} nodeId
 * @property {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} contract
 * @property {string} epistemicPast
 * @property {number} authorityScore
 * @property {boolean} epistemicallyValid
 * @property {string} source
 */

/**
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} contract
 * @param {string} [source]
 */
export function buildWorldIdFromContractV0(contract, source = "local") {
  const diskKey = String(contract?.diskKey || "default");
  const nodeId = String(contract?.nodeId || "node:unknown");
  const past = String(contract?.epistemicPast || EPISTEMIC_PAST_V0.NO_TRUSTED_PAST);
  const tick = Number(contract?.trustedCheckpointTick) || 0;
  return `world:${diskKey}:${nodeId}:${past}:${tick}:${source}`;
}

/**
 * @param {{
 *   selfNodeId: string,
 *   localContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[],
 *   nowMs?: number
 * }} input
 */
export function buildEpistemicWorldCandidatesV0(input) {
  const nowMs = Number(input.nowMs) || Date.now();
  const rows = [];

  const push = (contract, source) => {
    if (!contract) return;
    const jurisdiction = assertNodeExecutionJurisdictionV0(
      contract.executionPermitted === false ? null : contract
    );
    const epistemicallyValid =
      contract.epistemicPast !== EPISTEMIC_PAST_V0.NO_TRUSTED_PAST &&
      contract.executionPermitted !== false &&
      jurisdiction.ok === true;

    const authorityScore = computeTemporalAuthorityScoreV0(contract, { nowMs }).score;

    rows.push({
      worldId: buildWorldIdFromContractV0(contract, source),
      nodeId: String(contract.nodeId || ""),
      contract,
      epistemicPast: String(contract.epistemicPast || ""),
      authorityScore,
      epistemicallyValid,
      source
    });
  };

  push(input.localContract, "local");
  for (const peer of input.peerContracts || []) {
    if (peer && peer !== input.localContract) {
      push(peer, "peer");
    }
  }

  return rows;
}

/**
 * @param {EpistemicWorldCandidateV0[]} candidates
 */
export function filterEpistemicallyValidWorldsV0(candidates) {
  return (candidates || []).filter((c) => c.epistemicallyValid === true);
}

/**
 * @param {EpistemicWorldCandidateV0} a
 * @param {EpistemicWorldCandidateV0} b
 * @param {typeof DEFAULT_WORLD_SELECTION_POLICY_V0} policy
 */
function compareWorldCandidatesV0(a, b, policy) {
  if (b.authorityScore !== a.authorityScore) {
    return b.authorityScore - a.authorityScore;
  }
  if (policy.preferCanonicalPast) {
    const rank = (past) => {
      if (past === EPISTEMIC_PAST_V0.CANONICAL_CHAIN) return 3;
      if (past === EPISTEMIC_PAST_V0.REPAIRED_CHAIN) return 2;
      if (past === EPISTEMIC_PAST_V0.TRUNCATED_TAIL) return 1;
      return 0;
    };
    const dr = rank(b.epistemicPast) - rank(a.epistemicPast);
    if (dr !== 0) return dr;
  }
  const pathRank = (c) => {
    const path = mapEpistemicPastToIssuancePathV0(c.epistemicPast);
    return path === "canonical_boot" ? 3 : path === "repaired_reanchor" ? 2 : 1;
  };
  const pr = pathRank(b) - pathRank(a);
  if (pr !== 0) return pr;
  return String(a.nodeId).localeCompare(String(b.nodeId));
}

/**
 * @param {EpistemicWorldCandidateV0[]} valid
 * @param {string|null} networkExecutorNodeId
 * @param {typeof DEFAULT_WORLD_SELECTION_POLICY_V0} policy
 */
function resolveAmbiguousWorldsV0(valid, networkExecutorNodeId, policy) {
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];

  const topScore = valid[0].authorityScore;
  const tied = valid.filter((c) => c.authorityScore === topScore);

  if (tied.length === 1) {
    return tied[0];
  }

  if (policy.preferNetworkExecutorAlignment && networkExecutorNodeId) {
    const aligned = tied.find((c) => String(c.nodeId) === String(networkExecutorNodeId));
    if (aligned) return aligned;
  }

  let elected = tied[0].contract;
  for (let i = 1; i < tied.length; i += 1) {
    const winnerId = electSingleExecutorNodeIdV0(
      { ...elected, nodeId: elected.nodeId || tied[0].nodeId },
      { ...tied[i].contract, nodeId: tied[i].nodeId }
    );
    elected =
      winnerId === tied[i].nodeId ? tied[i].contract : elected;
  }
  return tied.find((c) => String(c.nodeId) === String(elected.nodeId)) || tied[0];
}

/**
 * Select living runtime world among epistemically-valid branches.
 *
 * @param {{
 *   candidates: EpistemicWorldCandidateV0[],
 *   networkExecutorNodeId?: string | null,
 *   selfNodeId?: string,
 *   auditVerdict?: string,
 *   policy?: Partial<typeof DEFAULT_WORLD_SELECTION_POLICY_V0>
 * }} input
 */
export function selectLivingTemporalWorldV0(input) {
  const policy = { ...DEFAULT_WORLD_SELECTION_POLICY_V0, ...input.policy };
  const valid = filterEpistemicallyValidWorldsV0(input.candidates || []);
  const sorted = [...valid].sort((a, b) => compareWorldCandidatesV0(a, b, policy));

  const base = {
    schema: TEMPORAL_WORLD_SELECTION_SCHEMA_V0,
    question:
      "Birden fazla epistemically-valid geçmiş varsa, hangisi yaşayan gerçeklik olarak başlatılır?",
    candidateCount: (input.candidates || []).length,
    validCount: valid.length,
    candidates: sorted
  };

  if (valid.length === 0) {
    return {
      ...base,
      verdict: WORLD_SELECTION_VERDICT_V0.NO_ELIGIBLE_WORLD,
      livingWorld: null,
      activeContract: null,
      mayBootstrapRuntime: false,
      rehydrateGate: REHYDRATE_GATE_V0.CLOSED,
      statement: "No epistemically-valid world — runtime bootstrap denied."
    };
  }

  const top = sorted[0];
  const second = sorted[1];
  const gap = second ? top.authorityScore - second.authorityScore : top.authorityScore;

  let selected = top;
  let verdict = WORLD_SELECTION_VERDICT_V0.LIVING_WORLD_SELECTED;

  if (second && (gap === 0 || gap <= policy.minAuthorityGap)) {
    const resolved = resolveAmbiguousWorldsV0(
      sorted.filter((c) => c.authorityScore === top.authorityScore),
      input.networkExecutorNodeId ?? null,
      policy
    );
    if (resolved) {
      selected = resolved;
      verdict =
        gap === 0
          ? WORLD_SELECTION_VERDICT_V0.AMBIGUOUS_MULTI_VALID
          : WORLD_SELECTION_VERDICT_V0.LIVING_WORLD_SELECTED;
    } else {
      return {
        ...base,
        verdict: WORLD_SELECTION_VERDICT_V0.DEFERRED_SELECTION,
        livingWorld: null,
        activeContract: null,
        mayBootstrapRuntime: false,
        rehydrateGate: REHYDRATE_GATE_V0.CLOSED,
        statement: "Ambiguous multi-valid worlds — selection deferred."
      };
    }
  }

  if (
    input.auditVerdict &&
    input.auditVerdict !== FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID &&
    input.auditVerdict !== FIXATION_AUDIT_VERDICT_V0.NOT_FIXED
  ) {
    return {
      ...base,
      verdict: WORLD_SELECTION_VERDICT_V0.DEFERRED_SELECTION,
      livingWorld: selected,
      activeContract: selected.contract,
      mayBootstrapRuntime: false,
      rehydrateGate: REHYDRATE_GATE_V0.CLOSED,
      statement: "Audit not clean — living world chosen but bootstrap deferred."
    };
  }

  return {
    ...base,
    verdict,
    livingWorld: selected,
    activeContract: selected.contract,
    livingWorldId: selected.worldId,
    livingNodeId: selected.nodeId,
    mayBootstrapRuntime: true,
    rehydrateGate: REHYDRATE_GATE_V0.OPEN,
    authorityGap: gap,
    statement:
      verdict === WORLD_SELECTION_VERDICT_V0.AMBIGUOUS_MULTI_VALID
        ? `Living world selected among tied valid branches: ${selected.worldId}.`
        : `Living world: ${selected.worldId} (authority ${selected.authorityScore}).`
  };
}

/**
 * @param {{
 *   selfNodeId: string,
 *   localContract: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[],
 *   stabilization?: object,
 *   audit?: object,
 *   nowMs?: number,
 *   policy?: Partial<typeof DEFAULT_WORLD_SELECTION_POLICY_V0>
 * }} input
 */
export function runTemporalWorldSelectionV0(input) {
  const candidates = buildEpistemicWorldCandidatesV0({
    selfNodeId: input.selfNodeId,
    localContract: input.localContract,
    peerContracts: input.peerContracts,
    nowMs: input.nowMs
  });

  return selectLivingTemporalWorldV0({
    candidates,
    networkExecutorNodeId: input.stabilization?.networkExecutorNodeId ?? null,
    selfNodeId: input.selfNodeId,
    auditVerdict: input.audit?.verdict,
    policy: input.policy
  });
}

/**
 * @param {Awaited<ReturnType<typeof selectLivingTemporalWorldV0>>} selection
 */
export function buildLivingWorldBootstrapV0(selection) {
  const contract = selection.activeContract;
  return {
    schema: TEMPORAL_WORLD_SELECTION_SCHEMA_V0,
    worldId: selection.livingWorldId ?? null,
    nodeId: selection.livingNodeId ?? contract?.nodeId ?? null,
    diskKey: contract?.diskKey ?? null,
    epistemicPast: contract?.epistemicPast ?? null,
    trustedCheckpointTick: contract?.trustedCheckpointTick ?? null,
    replayFromTick: contract?.replayFromTick ?? null,
    mayBootstrapRuntime: selection.mayBootstrapRuntime === true,
    rehydrateGate: selection.rehydrateGate ?? REHYDRATE_GATE_V0.CLOSED,
    verdict: selection.verdict,
    statement: selection.statement
  };
}
