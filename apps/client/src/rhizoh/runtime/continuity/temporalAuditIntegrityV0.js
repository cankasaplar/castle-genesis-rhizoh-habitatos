/**
 * Temporal Audit Integrity V0 (Faz 2.7) — audit of audit.
 *
 * "Audit doğru mu, yoksa sadece geçmişte doğru kabul edilmiş bir yorum mu?"
 * Seals each audit to grounding fingerprint + hash chain; re-validates prior interpretation.
 */

import { FIXATION_AUDIT_VERDICT_V0 } from "./temporalAuditRefixationV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./walHashChainV0.js";

export const TEMPORAL_AUDIT_INTEGRITY_SCHEMA_V0 =
  "castle.rhizoh.temporal_audit_integrity.v0";

export const AUDIT_INTEGRITY_VERDICT_V0 = Object.freeze({
  INTEGRITY_VALID: "integrity_valid",
  STALE_AUDIT_INTERPRETATION: "stale_audit_interpretation",
  GROUNDING_SHIFT: "grounding_shift",
  VERDICT_CONTRADICTION: "verdict_contradiction",
  CHAIN_BREACH: "chain_breach",
  FIRST_SEAL: "first_seal"
});

export const AUDIT_INTEGRITY_TRIGGER_V0 = Object.freeze({
  NONE: "none",
  FORCE_RE_AUDIT: "force_re_audit",
  INVALIDATE_PRIOR_INTERPRETATION: "invalidate_prior_interpretation"
});

export const DEFAULT_AUDIT_INTEGRITY_POLICY_V0 = Object.freeze({
  maxSealAgeMs: 7 * 24 * 60 * 60 * 1000
});

/**
 * @typedef {Object} AuditIntegrityChainStateV0
 * @property {string} diskKey
 * @property {string} chainHeadHash
 * @property {number} seq
 * @property {AuditSealV0|null} lastSeal
 */

/**
 * @typedef {Object} AuditSealV0
 * @property {number} seq
 * @property {number} atMs
 * @property {string} verdict
 * @property {string} trigger
 * @property {string} groundingDigest
 * @property {string} recordHash
 * @property {string|null} epistemicExecutorNodeId
 * @property {string|null} fixedExecutorNodeId
 */

/** @type {Map<string, AuditIntegrityChainStateV0>} */
const auditChainByDiskKeyV0 = new Map();

/**
 * @param {string} diskKey
 */
export function getAuditIntegrityChainStateV0(diskKey) {
  return auditChainByDiskKeyV0.get(String(diskKey || "default")) ?? null;
}

/**
 * @param {string} [diskKey]
 */
export function clearAuditIntegrityChainStateV0(diskKey) {
  if (!diskKey) {
    auditChainByDiskKeyV0.clear();
    return;
  }
  auditChainByDiskKeyV0.delete(String(diskKey));
}

/**
 * Deterministic grounding fingerprint — audit is only valid relative to this ground.
 *
 * @param {{
 *   stabilization?: object,
 *   fixationState?: object | null,
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[]
 * }} input
 */
export function buildAuditGroundingFingerprintV0(input) {
  const stabilization = input.stabilization || {};
  const fixationState = input.fixationState || null;
  const local = input.localContract || {};
  const peers = input.peerContracts || [];

  return {
    epistemicExecutorNodeId: stabilization.networkExecutorNodeId ?? null,
    stabilizationVerdict: stabilization.verdict ?? null,
    mutatorNodeIds: [...(stabilization.mutatorNodeIds || [])].map(String).sort(),
    fixedExecutorNodeId: fixationState?.fixedExecutorNodeId ?? null,
    fixationPhase: fixationState?.phase ?? null,
    checkpointAnchor: Number(local.trustedCheckpointTick) || 0,
    peerCheckpointTicks: peers
      .filter((c) => c && c !== local)
      .map((c) => Number(c.trustedCheckpointTick) || 0)
      .sort((a, b) => a - b),
    epistemicPast: String(local.epistemicPast || "")
  };
}

/**
 * @param {ReturnType<typeof buildAuditGroundingFingerprintV0>} fingerprint
 */
export function digestAuditGroundingV0(fingerprint) {
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, fingerprint);
}

/**
 * @param {string} diskKey
 * @param {{
 *   audit: object,
 *   groundingDigest: string,
 *   nowMs?: number,
 *   fixationState?: object | null
 * }} input
 */
export function sealAuditRecordV0(diskKey, input) {
  const key = String(diskKey || "default");
  const nowMs = Number(input.nowMs) || Date.now();
  let state = auditChainByDiskKeyV0.get(key);
  if (!state) {
    state = {
      diskKey: key,
      chainHeadHash: WAL_HASH_CHAIN_GENESIS_V0,
      seq: 0,
      lastSeal: null
    };
    auditChainByDiskKeyV0.set(key, state);
  }

  const seq = state.seq + 1;
  const payload = {
    seq,
    atMs: nowMs,
    verdict: String(input.audit?.verdict || ""),
    trigger: String(input.audit?.trigger || ""),
    groundingDigest: String(input.groundingDigest || ""),
    epistemicExecutorNodeId: input.audit?.epistemicExecutorNodeId ?? null,
    fixedExecutorNodeId: input.audit?.fixedExecutorNodeId ?? null
  };

  const recordHash = foldWalSegmentHashV0(state.chainHeadHash, payload);
  /** @type {AuditSealV0} */
  const seal = {
    ...payload,
    recordHash
  };

  state.seq = seq;
  state.chainHeadHash = recordHash;
  state.lastSeal = seal;

  return {
    schema: TEMPORAL_AUDIT_INTEGRITY_SCHEMA_V0,
    seal,
    chainHeadHash: recordHash,
    seq
  };
}

/**
 * @param {AuditIntegrityChainStateV0} state
 */
export function verifyAuditIntegrityChainV0(state) {
  if (!state?.lastSeal) {
    return { ok: true, code: "empty_chain" };
  }
  if (state.lastSeal.recordHash !== state.chainHeadHash) {
    return {
      ok: false,
      code: "chain_breach",
      expected: state.chainHeadHash,
      got: state.lastSeal.recordHash
    };
  }
  return { ok: true, code: "chain_valid" };
}

/**
 * Meta-audit — is the prior audit interpretation still valid on current ground?
 *
 * @param {{
 *   diskKey: string,
 *   currentAudit: object,
 *   stabilization: object,
 *   fixationState?: object | null,
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[],
 *   nowMs?: number,
 *   policy?: Partial<typeof DEFAULT_AUDIT_INTEGRITY_POLICY_V0>
 * }} input
 */
export function validateAuditIntegrityV0(input) {
  const policy = { ...DEFAULT_AUDIT_INTEGRITY_POLICY_V0, ...input.policy };
  const nowMs = Number(input.nowMs) || Date.now();
  const diskKey = String(input.diskKey || "default");
  const state = auditChainByDiskKeyV0.get(diskKey);
  const priorSeal = state?.lastSeal ?? null;

  const fingerprint = buildAuditGroundingFingerprintV0({
    stabilization: input.stabilization,
    fixationState: input.fixationState,
    localContract: input.localContract,
    peerContracts: input.peerContracts
  });
  const groundingDigest = digestAuditGroundingV0(fingerprint);

  const base = {
    schema: TEMPORAL_AUDIT_INTEGRITY_SCHEMA_V0,
    question: "Audit doğru mu, yoksa sadece geçmişte doğru kabul edilmiş bir yorum mu?",
    groundingDigest,
    fingerprint,
    priorSeal
  };

  if (!priorSeal) {
    return {
      ...base,
      verdict: AUDIT_INTEGRITY_VERDICT_V0.FIRST_SEAL,
      trigger: AUDIT_INTEGRITY_TRIGGER_V0.NONE,
      statement: "First audit seal — no prior interpretation."
    };
  }

  const chainCheck = state ? verifyAuditIntegrityChainV0(state) : { ok: true };
  if (chainCheck.ok === false) {
    return {
      ...base,
      verdict: AUDIT_INTEGRITY_VERDICT_V0.CHAIN_BREACH,
      trigger: AUDIT_INTEGRITY_TRIGGER_V0.FORCE_RE_AUDIT,
      chainCheck,
      statement: "Audit chain breach — prior seals not trustworthy."
    };
  }

  if (priorSeal.atMs > 0 && nowMs - priorSeal.atMs > policy.maxSealAgeMs) {
    return {
      ...base,
      verdict: AUDIT_INTEGRITY_VERDICT_V0.STALE_AUDIT_INTERPRETATION,
      trigger: AUDIT_INTEGRITY_TRIGGER_V0.INVALIDATE_PRIOR_INTERPRETATION,
      statement: "Prior audit seal expired — historical interpretation only."
    };
  }

  const groundShifted = priorSeal.groundingDigest !== groundingDigest;

  if (groundShifted) {
    if (
      priorSeal.verdict === FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID &&
      input.currentAudit?.verdict !== FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID
    ) {
      return {
        ...base,
        verdict: AUDIT_INTEGRITY_VERDICT_V0.STALE_AUDIT_INTERPRETATION,
        trigger: AUDIT_INTEGRITY_TRIGGER_V0.INVALIDATE_PRIOR_INTERPRETATION,
        groundShifted: true,
        statement:
          "Prior audit was valid on old ground — current ground refutes that interpretation."
      };
    }
    return {
      ...base,
      verdict: AUDIT_INTEGRITY_VERDICT_V0.GROUNDING_SHIFT,
      trigger: AUDIT_INTEGRITY_TRIGGER_V0.FORCE_RE_AUDIT,
      groundShifted: true,
      statement: "Epistemic ground shifted — audit must be re-interpreted."
    };
  }

  if (
    priorSeal.groundingDigest === groundingDigest &&
    priorSeal.verdict !== String(input.currentAudit?.verdict || "")
  ) {
    return {
      ...base,
      verdict: AUDIT_INTEGRITY_VERDICT_V0.VERDICT_CONTRADICTION,
      trigger: AUDIT_INTEGRITY_TRIGGER_V0.FORCE_RE_AUDIT,
      statement: "Same ground, different audit verdict — non-deterministic audit detected."
    };
  }

  return {
    ...base,
    verdict: AUDIT_INTEGRITY_VERDICT_V0.INTEGRITY_VALID,
    trigger: AUDIT_INTEGRITY_TRIGGER_V0.NONE,
    statement: "Audit interpretation consistent with current ground and chain."
  };
}

/**
 * @param {AuditSealV0} seal
 */
function peelSealPayload(seal) {
  return {
    seq: seal.seq,
    atMs: seal.atMs,
    verdict: seal.verdict,
    trigger: seal.trigger,
    groundingDigest: seal.groundingDigest,
    epistemicExecutorNodeId: seal.epistemicExecutorNodeId,
    fixedExecutorNodeId: seal.fixedExecutorNodeId
  };
}
