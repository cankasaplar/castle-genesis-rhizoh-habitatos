/**
 * RHIZOH Claim Contract Layer v1 — what may be claimed, under what evidence, liability, rollback.
 * Pairs with `actionPolicyMatrixV1` (who may act × what may be said/done as epistemic contract).
 * Not legal advice.
 */

import { getRhizohPolicyEnvelopeForKernelAction } from "./actionPolicyMatrixV1.js";

/** @typedef {'speculation' | 'simulation' | 'belief' | 'model_inference' | 'verified_fact' | 'committed_action'} RhizohClaimClass */

/** @typedef {'none' | 'personal' | 'economic' | 'governance' | 'physical'} RhizohLiabilitySurface */

/** @typedef {'none' | 'soft_retract' | 'hard_retract' | 'compensate'} RhizohClaimRollbackPolicy */

/**
 * @typedef {{
 *   class: RhizohClaimClass,
 *   evidenceFloor: number,
 *   confidence: number,
 *   liabilitySurface: RhizohLiabilitySurface,
 *   rollbackPolicy: RhizohClaimRollbackPolicy,
 *   auditRequired: boolean
 * }} RhizohClaimContractEnvelope
 */

/** @typedef {'ghost' | 'trusted' | 'verified' | 'sovereign_verified'} RhizohIdentityFloor */

/** @typedef {'allow' | 'bounded' | 'deny'} RhizohLatticeOutcome */

export const RHIZOH_CLAIM_CONTRACT_VERSION = "1.0.0";

export const RHIZOH_CLAIM_CLASS_RANK = Object.freeze(
  /** @type {Record<RhizohClaimClass, number>} */ ({
    speculation: 0,
    simulation: 1,
    belief: 2,
    model_inference: 3,
    verified_fact: 4,
    committed_action: 5
  })
);

/**
 * Minimum evidence [0,1], mandatory audit, and forbidden rollback = none for executable claims of this class.
 */
export const RHIZOH_CLAIM_EXECUTABLE_INVARIANT_V1 = Object.freeze(
  /** @type {Record<RhizohClaimClass, { minEvidence: number; requiresAudit: boolean; rollbackNoneAllowed: boolean }>} */ ({
    speculation: { minEvidence: 0, requiresAudit: false, rollbackNoneAllowed: true },
    simulation: { minEvidence: 0.08, requiresAudit: false, rollbackNoneAllowed: true },
    belief: { minEvidence: 0.12, requiresAudit: false, rollbackNoneAllowed: true },
    model_inference: { minEvidence: 0.28, requiresAudit: false, rollbackNoneAllowed: false },
    verified_fact: { minEvidence: 0.62, requiresAudit: true, rollbackNoneAllowed: false },
    committed_action: { minEvidence: 0.78, requiresAudit: true, rollbackNoneAllowed: false }
  })
);

/**
 * Action membrane floor × claim class — semantic constitution (not ACL).
 * `bounded`: allowed under tighter downstream checks / UX / economics.
 */
export const RHIZOH_ACTION_CLAIM_LATTICE_V1 = Object.freeze(
  /** @type {Record<RhizohIdentityFloor, Record<RhizohClaimClass, RhizohLatticeOutcome>>} */ ({
    ghost: Object.freeze({
      speculation: "allow",
      simulation: "allow",
      belief: "allow",
      model_inference: "bounded",
      verified_fact: "deny",
      committed_action: "deny"
    }),
    trusted: Object.freeze({
      speculation: "allow",
      simulation: "allow",
      belief: "allow",
      model_inference: "allow",
      verified_fact: "bounded",
      committed_action: "bounded"
    }),
    verified: Object.freeze({
      speculation: "allow",
      simulation: "allow",
      belief: "allow",
      model_inference: "allow",
      verified_fact: "allow",
      committed_action: "allow"
    }),
    sovereign_verified: Object.freeze({
      speculation: "allow",
      simulation: "allow",
      belief: "allow",
      model_inference: "allow",
      verified_fact: "allow",
      committed_action: "allow"
    })
  })
);

const CLAIM_CLASSES = Object.keys(RHIZOH_CLAIM_CLASS_RANK);
const LIABILITY_SURFACES = /** @type {const} */ ([
  "none",
  "personal",
  "economic",
  "governance",
  "physical"
]);
const ROLLBACK_POLICIES = /** @type {const} */ ([
  "none",
  "soft_retract",
  "hard_retract",
  "compensate"
]);

/** Defaults when minting an envelope from class only. */
export const RHIZOH_CLAIM_CLASS_DEFAULT_ENVELOPE_V1 = Object.freeze(
  /** @type {Record<RhizohClaimClass, Readonly<RhizohClaimContractEnvelope>>} */ ({
    speculation: Object.freeze({
      class: "speculation",
      evidenceFloor: 0,
      confidence: 0.35,
      liabilitySurface: "none",
      rollbackPolicy: "soft_retract",
      auditRequired: false
    }),
    simulation: Object.freeze({
      class: "simulation",
      evidenceFloor: 0.1,
      confidence: 0.42,
      liabilitySurface: "personal",
      rollbackPolicy: "soft_retract",
      auditRequired: false
    }),
    belief: Object.freeze({
      class: "belief",
      evidenceFloor: 0.15,
      confidence: 0.48,
      liabilitySurface: "personal",
      rollbackPolicy: "soft_retract",
      auditRequired: false
    }),
    model_inference: Object.freeze({
      class: "model_inference",
      evidenceFloor: 0.32,
      confidence: 0.58,
      liabilitySurface: "personal",
      rollbackPolicy: "hard_retract",
      auditRequired: false
    }),
    verified_fact: Object.freeze({
      class: "verified_fact",
      evidenceFloor: 0.68,
      confidence: 0.72,
      liabilitySurface: "governance",
      rollbackPolicy: "hard_retract",
      auditRequired: true
    }),
    committed_action: Object.freeze({
      class: "committed_action",
      evidenceFloor: 0.82,
      confidence: 0.78,
      liabilitySurface: "economic",
      rollbackPolicy: "compensate",
      auditRequired: true
    })
  })
);

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {Partial<RhizohClaimContractEnvelope> & { class: RhizohClaimClass }} partial
 * @returns {RhizohClaimContractEnvelope}
 */
export function normalizeRhizohClaimEnvelope(partial) {
  const c = partial?.class;
  if (!CLAIM_CLASSES.includes(c)) {
    throw new Error("rhizoh_claim_invalid_class");
  }
  const base = RHIZOH_CLAIM_CLASS_DEFAULT_ENVELOPE_V1[/** @type {RhizohClaimClass} */ (c)];
  const liability = LIABILITY_SURFACES.includes(/** @type {any} */ (partial.liabilitySurface))
    ? partial.liabilitySurface
    : base.liabilitySurface;
  const rollback = ROLLBACK_POLICIES.includes(/** @type {any} */ (partial.rollbackPolicy))
    ? partial.rollbackPolicy
    : base.rollbackPolicy;
  return {
    class: /** @type {RhizohClaimClass} */ (c),
    evidenceFloor: partial.evidenceFloor != null ? clamp01(partial.evidenceFloor) : base.evidenceFloor,
    confidence: partial.confidence != null ? clamp01(partial.confidence) : base.confidence,
    liabilitySurface: /** @type {RhizohLiabilitySurface} */ (liability),
    rollbackPolicy: /** @type {RhizohClaimRollbackPolicy} */ (rollback),
    auditRequired: partial.auditRequired != null ? !!partial.auditRequired : base.auditRequired
  };
}

/**
 * @param {RhizohIdentityFloor | string | null | undefined} actorFloor
 * @param {RhizohClaimClass} claimClass
 */
export function evaluateRhizohActionClaimLattice(actorFloor, claimClass) {
  const floor = /** @type {RhizohIdentityFloor} */ (String(actorFloor || "ghost"));
  const row = RHIZOH_ACTION_CLAIM_LATTICE_V1[floor];
  if (!row) return { outcome: /** @type {RhizohLatticeOutcome} */ ("deny"), reason: "unknown_membrane_floor" };
  const o = row[claimClass];
  return { outcome: o, reason: o === "deny" ? "lattice_deny" : o === "bounded" ? "lattice_bounded" : "lattice_allow" };
}

/**
 * Invariant: executable high-strength claims require evidence ∧ audit ∧ non-none rollback.
 * @param {RhizohClaimContractEnvelope} envelope
 */
export function satisfiesRhizohClaimExecutableInvariant(envelope) {
  const inv = RHIZOH_CLAIM_EXECUTABLE_INVARIANT_V1[envelope.class];
  if (envelope.evidenceFloor + 1e-6 < inv.minEvidence) {
    return { ok: false, code: "claim_invariant_evidence" };
  }
  if (inv.requiresAudit && !envelope.auditRequired) {
    return { ok: false, code: "claim_invariant_audit" };
  }
  if (!inv.rollbackNoneAllowed && (envelope.rollbackPolicy === "none" || envelope.rollbackPolicy == null)) {
    return { ok: false, code: "claim_invariant_rollback" };
  }
  return { ok: true };
}

/**
 * Physical liability only on sovereign stratum; sovereign + physical ⇒ heavy audit + high evidence.
 * @param {RhizohClaimContractEnvelope} envelope
 * @param {RhizohIdentityFloor | string | null | undefined} actorFloor
 */
export function evaluateRhizohLiabilityMembraneGate(envelope, actorFloor) {
  const floor = String(actorFloor || "ghost");
  if (envelope.liabilitySurface === "physical") {
    if (floor !== "sovereign_verified") {
      return { ok: false, code: "claim_liability_physical_floor" };
    }
    if (!envelope.auditRequired || envelope.evidenceFloor < 0.85) {
      return { ok: false, code: "claim_liability_physical_heavy_audit" };
    }
  }
  return { ok: true };
}

/**
 * Optional: kernel semantic kind vs claim strength (high-impact actions want strong claims).
 * @param {string} kernelActionId
 * @param {RhizohClaimContractEnvelope} envelope
 */
export function evaluateRhizohKernelClaimCoherence(kernelActionId, envelope) {
  const policy = getRhizohPolicyEnvelopeForKernelAction(kernelActionId);
  if (policy.semanticKind === "high_impact_act") {
    const rank = RHIZOH_CLAIM_CLASS_RANK[envelope.class];
    if (rank < RHIZOH_CLAIM_CLASS_RANK.verified_fact) {
      return { ok: false, code: "claim_kernel_high_impact_class" };
    }
    if (!envelope.auditRequired) {
      return { ok: false, code: "claim_kernel_high_impact_audit" };
    }
  }
  return { ok: true };
}

/**
 * Full claim gate: field normalization, executable invariant, lattice, liability membrane, optional kernel coherence.
 *
 * @param {Partial<RhizohClaimContractEnvelope> & { class: RhizohClaimClass }} partial
 * @param {{
 *   actorMembraneFloor?: RhizohIdentityFloor | string | null,
 *   kernelActionId?: string | null,
 *   skipLattice?: boolean,
 *   skipLiabilityGate?: boolean,
 *   skipKernelCoherence?: boolean
 * }} [opts]
 */
export function evaluateRhizohClaimGate(partial, opts = {}) {
  let envelope;
  try {
    envelope = normalizeRhizohClaimEnvelope(
      /** @type {Partial<RhizohClaimContractEnvelope> & { class: RhizohClaimClass }} */ (partial)
    );
  } catch {
    return { ok: false, error: "invalid_claim_envelope", code: "claim_invalid_field" };
  }

  const inv = satisfiesRhizohClaimExecutableInvariant(envelope);
  if (!inv.ok) {
    return { ok: false, error: inv.code, code: inv.code, envelope };
  }

  if (!opts.skipLattice && opts.actorMembraneFloor != null && String(opts.actorMembraneFloor).length > 0) {
    const lat = evaluateRhizohActionClaimLattice(opts.actorMembraneFloor, envelope.class);
    if (lat.outcome === "deny") {
      return { ok: false, error: "claim_lattice_deny", code: "claim_lattice_deny", envelope, lattice: lat };
    }
  }

  if (!opts.skipLiabilityGate && opts.actorMembraneFloor != null && String(opts.actorMembraneFloor).length > 0) {
    const liab = evaluateRhizohLiabilityMembraneGate(envelope, opts.actorMembraneFloor);
    if (!liab.ok) {
      return { ok: false, error: liab.code, code: liab.code, envelope };
    }
  }

  if (!opts.skipKernelCoherence && opts.kernelActionId) {
    const coh = evaluateRhizohKernelClaimCoherence(opts.kernelActionId, envelope);
    if (!coh.ok) {
      return { ok: false, error: coh.code, code: coh.code, envelope };
    }
  }

  const latFinal =
    opts.actorMembraneFloor != null && String(opts.actorMembraneFloor).length > 0
      ? evaluateRhizohActionClaimLattice(opts.actorMembraneFloor, envelope.class)
      : null;

  return {
    ok: true,
    envelope,
    lattice: latFinal
  };
}
