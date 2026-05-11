/**
 * ETK-1 — Epistemic Transition Kernel (TTA-1 runtime core).
 * Verifier + classifier + ledger writer; locks onto TLOA-1 snapshots.
 * @see docs/ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md
 * @see docs/ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md — §5 ETK-2 (Θ-dynamics coupling, meta-governance, ECPT)
 * @see docs/ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md — MetaΔ composition / ECPT closure (HOGA-1) · `hogaComposition.mjs`
 * @see docs/ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md
 *
 *   node scripts/ecerEpistemicTransitionKernel.mjs
 *   npm run epistemic:etk-verify
 */

import { pathToFileURL } from "node:url";
import { stableStringifyForDeterminism } from "./evaluateBind.mjs";
import {
  buildTriLayerObservableSnapshot,
  snapshotContentDigest
} from "./ecerTriLayerObservableArtifact.mjs";

export const ETK_VERSION = "ETK_1_0";
export const TTA_VERSION = "TTA_1_0";

/** @typedef {ReturnType<typeof buildTriLayerObservableSnapshot>} TloaSnapshot */

export const TTA_ERR = Object.freeze({
  ILLEGAL_TRANSITION: "TTA_ERR_ILLEGAL_TRANSITION",
  DRIFT_UNBOUNDED: "TTA_ERR_DRIFT_UNBOUNDED",
  ECDM_BYPASS: "TTA_ERR_ECDM_BYPASS",
  DIGEST_DISCONTINUITY: "TTA_ERR_DIGEST_DISCONTINUITY",
  EBL_INFEASIBLE: "TTA_ERR_EBL_INFEASIBLE",
  PAG_CONSTRAINT: "TTA_ERR_PAG_CONSTRAINT"
});

/** Kapalı geçiş uzayı 𝒯 — ontolojik gramer (TTA-1). */
export const TRANSITION_SPACE = Object.freeze({
  TRIVIAL: "TRIVIAL",
  EBL_LEDGER_SHIFT: "EBL_LEDGER_SHIFT",
  EBE_POLICY_SHIFT: "EBE_POLICY_SHIFT",
  ECDM_SIGNAL_SHIFT: "ECDM_SIGNAL_SHIFT",
  CLOSURE_REBAND: "CLOSURE_REBAND",
  COMPOUND_REGULATED: "COMPOUND_REGULATED",
  CUT_OVER: "CUT_OVER"
});

export const TRANSITION_CLASSIFICATION = Object.freeze({
  VALID: "VALID",
  PARTIAL: "PARTIAL",
  ILLEGAL: "ILLEGAL",
  DRIFTED: "DRIFTED"
});

/**
 * @param {unknown} a
 * @param {unknown} b
 */
function deepEqualCanon(a, b) {
  return stableStringifyForDeterminism(a) === stableStringifyForDeterminism(b);
}

/**
 * @param {Record<string, unknown>} before
 * @param {Record<string, unknown>} after
 */
function layerPatch(before, after) {
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ]);
  /** @type {Record<string, { from: unknown; to: unknown }>} */
  const patch = {};
  for (const k of keys) {
    const vb = before[k];
    const va = after[k];
    if (!deepEqualCanon(vb, va)) {
      patch[k] = { from: vb, to: va };
    }
  }
  return Object.keys(patch).length ? patch : null;
}

/**
 * Tri-layer semantic delta: EBE / EBL / ECDM / closure (TLOA-1 projections).
 * @param {TloaSnapshot} s0
 * @param {TloaSnapshot} s1
 */
export function epistemicDiff(s0, s1) {
  const fromDigest = snapshotContentDigest(s0);
  const toDigest = snapshotContentDigest(s1);

  const ebeDelta = layerPatch(s0.ebe, s1.ebe);
  const eblDelta = layerPatch(s0.ebl, s1.ebl);
  const ecdmDelta = layerPatch(s0.ecdm, s1.ecdm);
  const closureDelta = layerPatch(s0.closure, s1.closure);

  const layers = { ebe: ebeDelta, ebl: eblDelta, ecdm: ecdmDelta, closure: closureDelta };
  const touched = /** @type {const} */ (["ebe", "ebl", "ecdm", "closure"]).filter(
    (k) => layers[k] !== null
  );

  let transitionSpaceKind = TRANSITION_SPACE.TRIVIAL;
  if (touched.length === 1) {
    const k = touched[0];
    if (k === "ebe") transitionSpaceKind = TRANSITION_SPACE.EBE_POLICY_SHIFT;
    else if (k === "ebl") transitionSpaceKind = TRANSITION_SPACE.EBL_LEDGER_SHIFT;
    else if (k === "ecdm") transitionSpaceKind = TRANSITION_SPACE.ECDM_SIGNAL_SHIFT;
    else transitionSpaceKind = TRANSITION_SPACE.CLOSURE_REBAND;
  } else if (touched.length > 1) {
    transitionSpaceKind = TRANSITION_SPACE.COMPOUND_REGULATED;
  }

  const enteringDrift =
    s0.ecdm.legitimacyClass !== "CONSTITUTIONAL_DRIFT" &&
    s1.ecdm.legitimacyClass === "CONSTITUTIONAL_DRIFT";
  const worseningInDrift =
    s0.ecdm.legitimacyClass === "CONSTITUTIONAL_DRIFT" &&
    s1.ecdm.legitimacyClass === "CONSTITUTIONAL_DRIFT" &&
    ecdmDelta !== null;
  const requiresCutOverWitness =
    fromDigest !== toDigest &&
    s1.ecdm.legitimacyClass === "CONSTITUTIONAL_DRIFT" &&
    (enteringDrift || worseningInDrift);

  if (requiresCutOverWitness) {
    transitionSpaceKind = TRANSITION_SPACE.CUT_OVER;
  }

  return {
    ttaVersion: TTA_VERSION,
    etkVersion: ETK_VERSION,
    fromDigest,
    toDigest,
    unchanged: fromDigest === toDigest,
    layers,
    touchedLayers: touched,
    transitionSpaceKind,
    requiresCutOverWitness
  };
}

/**
 * @typedef {{
 *   pagAuthoritySatisfied: boolean;
 *   eblBudgetFeasible: boolean;
 *   ecdmMaxLegitimacyDrift: "NONE" | "SIGNAL_ONLY" | "ALLOW_CONSTITUTIONAL_WITH_WITNESS";
 *   requireDigestContinuity: boolean;
 *   priorChainTipDigest: string | null;
 *   transitionWitnessRef: string | null;
 * }} EpistemicAdmissibilityPolicy
 */

/**
 * Epistemic admissibility predicate (transition legitimacy kernel).
 * @param {ReturnType<typeof epistemicDiff>} diff
 * @param {EpistemicAdmissibilityPolicy} policy
 */
export function evaluateTransitionAdmissibility(diff, policy) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (policy.requireDigestContinuity) {
    const tip = policy.priorChainTipDigest;
    if (tip != null && tip !== diff.fromDigest) {
      errors.push(TTA_ERR.DIGEST_DISCONTINUITY);
    }
  }

  if (diff.layers.ebl && policy.eblBudgetFeasible === false) {
    errors.push(TTA_ERR.EBL_INFEASIBLE);
  }

  const governanceTouch =
    diff.layers.ebe !== null ||
    diff.layers.ecdm !== null ||
    diff.transitionSpaceKind === TRANSITION_SPACE.CUT_OVER ||
    diff.transitionSpaceKind === TRANSITION_SPACE.COMPOUND_REGULATED;

  if (governanceTouch && policy.pagAuthoritySatisfied === false) {
    errors.push(TTA_ERR.PAG_CONSTRAINT);
  }

  if (diff.requiresCutOverWitness) {
    const w = policy.transitionWitnessRef;
    if (w == null || String(w).trim() === "") {
      errors.push(TTA_ERR.ECDM_BYPASS);
    }
  }

  const ecdmPatch = diff.layers.ecdm;
  if (ecdmPatch && policy.ecdmMaxLegitimacyDrift === "NONE") {
    if ("legitimacyClass" in ecdmPatch || "bottleneckSignal" in ecdmPatch) {
      errors.push(TTA_ERR.DRIFT_UNBOUNDED);
    }
  }

  if (
    ecdmPatch &&
    "legitimacyClass" in ecdmPatch &&
    /** @type {{ to?: string }} */ (ecdmPatch.legitimacyClass).to ===
      "CONSTITUTIONAL_DRIFT" &&
    policy.ecdmMaxLegitimacyDrift === "SIGNAL_ONLY"
  ) {
    errors.push(TTA_ERR.DRIFT_UNBOUNDED);
  }

  if (
    errors.includes(TTA_ERR.ECDM_BYPASS) ||
    errors.includes(TTA_ERR.PAG_CONSTRAINT) ||
    errors.includes(TTA_ERR.DIGEST_DISCONTINUITY) ||
    errors.includes(TTA_ERR.EBL_INFEASIBLE)
  ) {
    if (!errors.includes(TTA_ERR.ILLEGAL_TRANSITION)) {
      errors.push(TTA_ERR.ILLEGAL_TRANSITION);
    }
  }

  if (
    diff.transitionSpaceKind === TRANSITION_SPACE.COMPOUND_REGULATED &&
    !diff.requiresCutOverWitness &&
    (policy.transitionWitnessRef == null || policy.transitionWitnessRef === "")
  ) {
    warnings.push("TTA_WARN_COMPOUND_WITHOUT_WITNESS");
  }

  /** @type {typeof TRANSITION_CLASSIFICATION[keyof typeof TRANSITION_CLASSIFICATION]} */
  let classification = TRANSITION_CLASSIFICATION.VALID;
  const hardIllegal =
    errors.includes(TTA_ERR.ILLEGAL_TRANSITION) ||
    errors.includes(TTA_ERR.ECDM_BYPASS) ||
    errors.includes(TTA_ERR.PAG_CONSTRAINT) ||
    errors.includes(TTA_ERR.DIGEST_DISCONTINUITY) ||
    errors.includes(TTA_ERR.EBL_INFEASIBLE);
  if (hardIllegal) {
    classification = TRANSITION_CLASSIFICATION.ILLEGAL;
  } else if (errors.includes(TTA_ERR.DRIFT_UNBOUNDED)) {
    classification = TRANSITION_CLASSIFICATION.DRIFTED;
  } else if (warnings.length > 0) {
    classification = TRANSITION_CLASSIFICATION.PARTIAL;
  }

  const admissible =
    errors.length === 0 &&
    classification !== TRANSITION_CLASSIFICATION.ILLEGAL &&
    classification !== TRANSITION_CLASSIFICATION.DRIFTED;

  return {
    admissible,
    classification,
    errors: [...new Set(errors)],
    warnings
  };
}

/**
 * @param {TloaSnapshot} s0
 * @param {TloaSnapshot} s1
 * @param {EpistemicAdmissibilityPolicy} policy
 */
export function verifyEpistemicTransition(s0, s1, policy) {
  const diff = epistemicDiff(s0, s1);
  const admissibility = evaluateTransitionAdmissibility(diff, policy);
  const ledgerEntry = {
    etkVersion: ETK_VERSION,
    fromDigest: diff.fromDigest,
    toDigest: diff.toDigest,
    transitionSpaceKind: diff.transitionSpaceKind,
    classification: admissibility.classification,
    errors: admissibility.errors,
    warnings: admissibility.warnings,
    admissible: admissibility.admissible
  };
  return { diff, admissibility, ledgerEntry };
}

/**
 * @param {{ entries: object[] }} ledger
 * @param {object} entry
 */
export function appendTransitionLedger(ledger, entry) {
  const prev = ledger.entries;
  const seq = prev.length ? /** @type {{ seq: number }} */ (prev[prev.length - 1]).seq + 1 : 0;
  const row = {
    seq,
    ...entry,
    recordedAt: new Date().toISOString()
  };
  return { entries: [...prev, row] };
}

/** Varsayılan smoke politikası: geçişlere izin ver (witness CUT_OVER için). */
export function defaultAdmissibilityPolicy(overrides = {}) {
  return {
    pagAuthoritySatisfied: true,
    eblBudgetFeasible: true,
    ecdmMaxLegitimacyDrift: "ALLOW_CONSTITUTIONAL_WITH_WITNESS",
    requireDigestContinuity: false,
    priorChainTipDigest: null,
    transitionWitnessRef: "WITNESS:smoke",
    ...overrides
  };
}

export function runEtKSmoke() {
  const base = buildTriLayerObservableSnapshot({
    snapshotId: "S0",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const sameContent = buildTriLayerObservableSnapshot({
    snapshotId: "S0-prime",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const d0 = epistemicDiff(base, sameContent);
  if (!d0.unchanged || d0.fromDigest !== d0.toDigest) {
    throw new Error("ETK_SMOKE_FAIL: trivial digest mismatch");
  }

  const evolved = buildTriLayerObservableSnapshot({
    snapshotId: "S1",
    ebe: { evolutionGate: "FROZEN" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const badPag = verifyEpistemicTransition(base, evolved, {
    ...defaultAdmissibilityPolicy(),
    pagAuthoritySatisfied: false
  });
  if (badPag.admissibility.classification !== TRANSITION_CLASSIFICATION.ILLEGAL) {
    throw new Error("ETK_SMOKE_FAIL: expected ILLEGAL under PAG false");
  }

  const drifted = buildTriLayerObservableSnapshot({
    snapshotId: "S2",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: {
      legitimacyClass: "CONSTITUTIONAL_DRIFT",
      bottleneckSignal: true
    },
    closure: { stableBandHint: "DRIFT_RISK" }
  });
  const noWitness = verifyEpistemicTransition(base, drifted, {
    ...defaultAdmissibilityPolicy(),
    transitionWitnessRef: null
  });
  if (!noWitness.admissibility.errors.includes(TTA_ERR.ECDM_BYPASS)) {
    throw new Error("ETK_SMOKE_FAIL: expected ECDM_BYPASS without witness");
  }

  return { ok: true, etkVersion: ETK_VERSION };
}

export function runEtKCli() {
  try {
    const smoke = runEtKSmoke();
    console.log(JSON.stringify(smoke, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(String(e && e.message ? e.message : e));
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runEtKCli();
}
