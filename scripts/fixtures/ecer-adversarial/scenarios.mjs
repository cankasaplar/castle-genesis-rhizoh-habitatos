/**
 * ECER-ADV-1 — adversarial scenario definitions (classify + resolve + gate expectations).
 * @see docs/ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md
 */

import { sealWitnessArtifact, SOURCE_CLASS, RBL_ERR } from "../../witnessArtifact.mjs";
import { sealCanonicalAuthorityBundle, PAG_ERR, LIFECYCLE_STATE } from "../../authorityBundle.mjs";
import { DIVERGENCE_CLASS } from "../../classifyDivergence.mjs";
import { RESOLUTION_ACTION } from "../../resolutionPolicy.mjs";
import { MK1_ERR, DECISION_CLASS } from "../../mk1Validate.mjs";

/** @typedef {import("../../evaluateBindIndexed.mjs").evaluateBindIndexed} EvaluateBindIndexed */

/** Closed scenario ids — extend only with spec bump (ECER-ADV-1.1+). */
export const ECER_ADVERSARIAL_SCENARIO = Object.freeze({
  DUAL_READ_CONFLICT: "DUAL_READ_CONFLICT",
  AUTHORITY_SPLIT_TEMPORAL: "AUTHORITY_SPLIT_TEMPORAL",
  MALICIOUS_BUNDLE_INJECTION: "MALICIOUS_BUNDLE_INJECTION",
  EPOCH_BACKWARD_REPLAY: "EPOCH_BACKWARD_REPLAY",
  WITNESS_COLLAPSE: "WITNESS_COLLAPSE"
});

const STRESS_GCS_HASH =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

/**
 * @param {string} PI_HASH_TRACE
 * @param {string} resolutionPolicyRef
 */
export function makeAlignedCanonicalBundle(PI_HASH_TRACE, resolutionPolicyRef) {
  return sealCanonicalAuthorityBundle({
    piHash: PI_HASH_TRACE,
    epochId: "E0",
    governanceConstraintSetId: "GCS:ecer-adv",
    governanceConstraintHash: STRESS_GCS_HASH,
    resolutionPolicyRef,
    resolutionPolicyEpoch: "E0",
    lifecycleState: LIFECYCLE_STATE.ACTIVE,
    authorityWitness: { suite: "ECER-ADV-1" }
  });
}

/**
 * @param {{
 *   trace: object;
 *   manifest: object;
 *   clock: object;
 *   PI_HASH_TRACE: string;
 *   evaluateBindIndexed: EvaluateBindIndexed;
 * }} ctx
 */
export function buildAdversarialScenarios(ctx) {
  const { trace, manifest, clock, PI_HASH_TRACE, evaluateBindIndexed } = ctx;

  const matrixSelfNonBreaking = (/** @type {string} */ i, /** @type {string} */ j) => {
    if (i === j) {
      return "SELF";
    }
    if ((i === "E0" && j === "E1") || (i === "E1" && j === "E0")) {
      return "NON_BREAKING";
    }
    return "UNDEFINED";
  };

  const policyRef = "R1:ecer-adv:v1";
  const manifestAug = {
    ...manifest,
    resolutionPolicyRef: policyRef,
    governanceConstraintSetId: "GCS:ecer-adv"
  };

  const alignedBundle = makeAlignedCanonicalBundle(PI_HASH_TRACE, policyRef);

  return [
    {
      id: ECER_ADVERSARIAL_SCENARIO.DUAL_READ_CONFLICT,
      gate: "PIEFC",
      classifyFeatures: {
        epochFork: true,
        epochA: "E0",
        epochB: "E1"
      },
      expectedDivergenceClass: DIVERGENCE_CLASS.EPOCH_FORK,
      expectedResolutionAction: RESOLUTION_ACTION.SUNSET,
      runEvaluateBind: () =>
        evaluateBindIndexed(
          trace,
          PI_HASH_TRACE,
          {
            authorityEpochId: "E1",
            traceEpochId: "E0",
            dualReadRequired: true
          },
          clock,
          manifestAug,
          matrixSelfNonBreaking,
          undefined
        ),
      assertEvaluateBind: (/** @type {Record<string, unknown>} */ r) =>
        "mk1" in r &&
        r.piEfcCode === MK1_ERR.DUAL_READ_WITNESS_MISSING &&
        r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
    },
    {
      id: ECER_ADVERSARIAL_SCENARIO.AUTHORITY_SPLIT_TEMPORAL,
      gate: "PAG",
      classifyFeatures: {
        witnessRelation: "EXCLUSIVE",
        epochA: "E0",
        epochB: "E1"
      },
      expectedDivergenceClass: DIVERGENCE_CLASS.W_EXCLUSIVE,
      expectedResolutionAction: RESOLUTION_ACTION.NO_COLLAPSE,
      runEvaluateBind: () =>
        evaluateBindIndexed(
          trace,
          PI_HASH_TRACE,
          {
            authorityEpochId: "E1",
            traceEpochId: "E0",
            governanceConstraintSetId: "GCS:ecer-adv"
          },
          clock,
          manifestAug,
          matrixSelfNonBreaking,
          alignedBundle
        ),
      assertEvaluateBind: (/** @type {Record<string, unknown>} */ r) =>
        "mk1" in r &&
        r.piEfcCode === PAG_ERR.EPOCH_SCOPE_MISMATCH &&
        r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
    },
    {
      id: ECER_ADVERSARIAL_SCENARIO.MALICIOUS_BUNDLE_INJECTION,
      gate: "PAG",
      classifyFeatures: { piSplitClass: "INCOMPARABLE" },
      expectedDivergenceClass: DIVERGENCE_CLASS.PI_SPLIT_INCOMPARABLE,
      expectedResolutionAction: RESOLUTION_ACTION.REJECT,
      runEvaluateBind: () =>
        evaluateBindIndexed(
          trace,
          PI_HASH_TRACE,
          {
            authorityEpochId: "E0",
            traceEpochId: "E0",
            governanceConstraintSetId: "GCS:ecer-adv"
          },
          clock,
          manifestAug,
          matrixSelfNonBreaking,
          /** @type {unknown} */ ({ piHash: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz" })
        ),
      assertEvaluateBind: (/** @type {Record<string, unknown>} */ r) =>
        "mk1" in r &&
        r.piEfcCode === PAG_ERR.INVALID_BUNDLE &&
        r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
    },
    {
      id: ECER_ADVERSARIAL_SCENARIO.EPOCH_BACKWARD_REPLAY,
      gate: "PIEFC",
      classifyFeatures: {
        piSplitClass: "NON_BREAKING",
        epochA: "E0",
        epochB: "E1"
      },
      expectedDivergenceClass: DIVERGENCE_CLASS.PI_SPLIT_NON_BREAKING,
      expectedResolutionAction: RESOLUTION_ACTION.SELECT,
      runEvaluateBind: () =>
        evaluateBindIndexed(
          trace,
          PI_HASH_TRACE,
          {
            authorityEpochId: "E1",
            traceEpochId: "E0"
          },
          clock,
          manifestAug,
          matrixSelfNonBreaking,
          undefined
        ),
      assertEvaluateBind: (/** @type {Record<string, unknown>} */ r) =>
        "mk1" in r &&
        r.mk1 &&
        /** @type {{ valid: boolean }} */ (r.mk1).valid === true &&
        r.compatibility === "NON_BREAKING" &&
        r.decisionClass === DECISION_CLASS.ACCEPT_NON_BREAKING &&
        r.piEfcCode === undefined
    },
    {
      id: ECER_ADVERSARIAL_SCENARIO.WITNESS_COLLAPSE,
      gate: "RBL",
      classifyFeatures: { witnessRelation: "VOID" },
      expectedDivergenceClass: DIVERGENCE_CLASS.W_VOID,
      expectedResolutionAction: RESOLUTION_ACTION.REJECT,
      runEvaluateBind: null,
      assertEvaluateBind: null,
      runRblWitnessSeal: () =>
        sealWitnessArtifact(
          { x: 1 },
          {
            sourceClass: SOURCE_CLASS.HUMAN_ASSERTION,
            projectionEpochId: "E0",
            piHash: PI_HASH_TRACE,
            observedAt: "2026-05-10T12:00:02.000Z"
          },
          []
        ),
      assertRblWitnessSeal: (/** @type {{ ok: boolean, code?: string }} */ r) =>
        r.ok === false && r.code === RBL_ERR.WITNESSLESS
    }
  ];
}
