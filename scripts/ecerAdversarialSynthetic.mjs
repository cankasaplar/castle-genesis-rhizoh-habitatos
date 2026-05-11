/**
 * Deterministic synthetic adversarial proposals for empty (𝒟 × axis) cells.
 * SCG öncü katmanı — tam kısıt şeması: docs/ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md (SCG-I1: executable τ hedefi).
 * @see docs/ECER_ADVERSARIAL_META_ADV_1_1.md
 */

import { DIVERGENCE_CLASS } from "./classifyDivergence.mjs";
import { ADVERSARIAL_AXIS } from "./ecerAdversarialCompleteness.mjs";

/** Features that yield each D under current `classifyDivergence` priority. */
const CLASSIFY_PRESERVE = Object.freeze({
  [DIVERGENCE_CLASS.W_INDEPENDENT]: { witnessRelation: "INDEPENDENT" },
  [DIVERGENCE_CLASS.W_EXCLUSIVE]: { witnessRelation: "EXCLUSIVE" },
  [DIVERGENCE_CLASS.W_VOID]: { witnessRelation: "VOID" },
  [DIVERGENCE_CLASS.PI_SPLIT_NON_BREAKING]: { piSplitClass: "NON_BREAKING" },
  [DIVERGENCE_CLASS.PI_SPLIT_BREAKING]: { piSplitClass: "BREAKING" },
  [DIVERGENCE_CLASS.PI_SPLIT_INCOMPARABLE]: { piSplitClass: "INCOMPARABLE" },
  [DIVERGENCE_CLASS.EPOCH_FORK]: { epochFork: true, epochA: "E0", epochB: "E1" },
  [DIVERGENCE_CLASS.NONE]: { explicitNone: true },
  [DIVERGENCE_CLASS.UNKNOWN]: {}
});

/**
 * @param {string} axis
 * @returns {{ kind: string; steps: string[]; expectedGateFamily: string }}
 */
function axisMutationRecipe(axis) {
  switch (axis) {
    case ADVERSARIAL_AXIS.WITNESS:
      return {
        kind: "minimal_witness_mutation",
        steps: [
          "Hold classify features fixed; seal same payload with ±1 witnessSet member or ±1ms observedAt.",
          "Bind τ; compare rblWitnessCommitment / finalHash vs baseline (contextual determinism).",
          "Expect RBL gate or structural τ delta before πEFC when witness contract violated."
        ],
        expectedGateFamily: "RBL / τ binding"
      };
    case ADVERSARIAL_AXIS.AUTHORITY:
      return {
        kind: "minimal_authority_drift",
        steps: [
          "Start from aligned canonical bundle; flip one field: resolutionPolicyRef, bundleHash nibble, or epochId vs context.",
          "Or pass legacy bundle with PAG_ERR / RBL_A_ERR closure path.",
          "Expect PAG or RBL_A_ERR before full πEFC."
        ],
        expectedGateFamily: "PAG / RBL-A1"
      };
    case ADVERSARIAL_AXIS.EPOCH:
      return {
        kind: "minimal_epoch_shift",
        steps: [
          "Offset authorityEpochId vs trace.projectionEpochId; toggle dualReadRequired.",
          "Adjust compat matrix cell (Ei,Ej) one step: SELF / NON_BREAKING / UNDEFINED.",
          "Expect MK1_ERR_* or explicit DECISION_* under πEFC."
        ],
        expectedGateFamily: "πEFC / MK-1"
      };
    default:
      return {
        kind: "unknown_axis",
        steps: [],
        expectedGateFamily: "?"
      };
  }
}

/**
 * @param {string} divergenceClass
 * @param {string} axis
 * @returns {Record<string, unknown>}
 */
export function syntheticProposalForCell(divergenceClass, axis) {
  const preserve = CLASSIFY_PRESERVE[divergenceClass] ?? {};
  const mut = axisMutationRecipe(axis);
  return {
    divergenceClass,
    axis,
    classifyPreserve: { ...preserve },
    minimalMutation: mut,
    implementationChecklist: [
      "Add row to coverageRegistry VERIFIED_COVERAGE after assert passes.",
      "Mirror scenario in ecerAdversarialSuite or mk1StressHarness.",
      "Re-run: npm run epistemic:ecer-adv-check"
    ]
  };
}

/**
 * @param {Array<{ divergenceClass: string; axis: string }>} cells
 */
export function syntheticProposalsForMissing(cells) {
  return cells.map((c) => syntheticProposalForCell(c.divergenceClass, c.axis));
}
