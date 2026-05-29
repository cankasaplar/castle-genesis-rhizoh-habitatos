/**
 * Interpretation UX Contract v1 — RAW / DERIVED / POLICY separation in ops surfaces.
 * Narrative must never be the visually dominant layer.
 * @see docs/ops/INTERPRETATION_UX_CONTRACT_V1.0.md
 */

export const INTERPRETATION_UX_CONTRACT_SCHEMA_V1 = "rhizoh.interpretation_ux_contract.v1";

export const STATE_LAYER_V1 = Object.freeze({
  RAW: "raw",
  DERIVED: "derived",
  POLICY: "policy"
});

/** Visual rank: higher = more prominent (narrative capped below raw metrics). */
export const LAYER_VISUAL_RANK_V1 = Object.freeze({
  [STATE_LAYER_V1.RAW]: 100,
  [STATE_LAYER_V1.POLICY]: 70,
  [STATE_LAYER_V1.DERIVED]: 40,
  narrative_sub_block: 15
});

export const INTERPRETATION_UX_CONTRACT_V1 = Object.freeze({
  schema: INTERPRETATION_UX_CONTRACT_SCHEMA_V1,
  layerOrder: Object.freeze([STATE_LAYER_V1.RAW, STATE_LAYER_V1.DERIVED, STATE_LAYER_V1.POLICY]),
  enforceLayerSeparation: true,
  narrativeNeverVisuallyDominant: true,
  displayOrderMustMatch: true,
  derivedDefaults: Object.freeze({
    collapseNarrativeBlock: true,
    narrativeMaxVisualRank: LAYER_VISUAL_RANK_V1.narrative_sub_block,
    showHeadlineInDerivedOnly: true,
    headlineMustNotBeHero: true
  }),
  rawDefaults: Object.freeze({
    showFirst: true,
    primaryMetricsFromRaw: true,
    minVisualRank: LAYER_VISUAL_RANK_V1.RAW
  }),
  policyDefaults: Object.freeze({
    disclaimerRequired: true,
    prohibitionsVisible: true,
    suggestedActionsNonExecutableStyle: true
  }),
  prohibitedDominancePatterns: Object.freeze([
    "narrative_headline_larger_than_raw_metrics",
    "confidence_hero_above_fold_without_raw",
    "derived_expanded_by_default_over_raw",
    "policy_collapsed_while_narrative_expanded"
  ])
});

/**
 * @param {unknown} hardeningOrNarrative — hardening status or full narrative export
 */
export function resolveUxContractFromPayloadV1(hardeningOrNarrative) {
  const p = hardeningOrNarrative;
  const embedded =
    p?.unifiedState?.interpretationUxContract ||
    p?.interpretationUxContract ||
    p?.governance?.interpretationUxContract;
  if (embedded?.schema === INTERPRETATION_UX_CONTRACT_SCHEMA_V1) return embedded;
  return INTERPRETATION_UX_CONTRACT_V1;
}

/**
 * Validates ops payload obeys UX contract (throws on violation).
 * @param {unknown} payload
 */
export function assertInterpretationUxContractV1(payload) {
  const layers = payload?.stateLayers || payload?.unifiedState?.stateLayers;
  const governance = payload?.governance || payload?.unifiedState?.governance;
  const contract = payload?.interpretationSafetyContract || payload?.unifiedState?.interpretationSafetyContract;

  if (!layers?.raw || !layers?.derived || !layers?.policy) {
    throw new Error("interpretation_ux_contract_v1:missing_state_layers");
  }
  if (layers.derived?.notDecision !== true) {
    throw new Error("interpretation_ux_contract_v1:derived_must_be_not_decision");
  }
  if (layers.policy?.binding !== false && layers.policy?.isNotExecutablePolicy !== true) {
    throw new Error("interpretation_ux_contract_v1:policy_must_be_non_binding");
  }
  if (contract?.can_execute !== false) {
    throw new Error("interpretation_ux_contract_v1:safety_contract_can_execute");
  }
  const order = governance?.displayOrder || INTERPRETATION_UX_CONTRACT_V1.layerOrder;
  const expected = INTERPRETATION_UX_CONTRACT_V1.layerOrder;
  for (let i = 0; i < expected.length; i++) {
    if (order[i] !== expected[i]) {
      throw new Error("interpretation_ux_contract_v1:display_order_violation");
    }
  }
  return true;
}

/**
 * @param {unknown} narrativeExport
 */
export function buildInterpretationUxContractExportV1(narrativeExport) {
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  return Object.freeze({
    ...INTERPRETATION_UX_CONTRACT_V1,
    boundTo: Object.freeze({
      narrativeUiSafetySchema: ui?.schema || null,
      displayRules: ui?.displayRules || null
    }),
    runtimeChecks: Object.freeze({
      assertLayers: () => assertInterpretationUxContractV1(narrativeExport)
    })
  });
}
