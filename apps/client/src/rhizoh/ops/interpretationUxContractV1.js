/**
 * Client mirror of gateway interpretation UX contract v1.
 * @see docs/ops/INTERPRETATION_UX_CONTRACT_V1.0.md
 */

export const INTERPRETATION_UX_CONTRACT_SCHEMA_V1 = "rhizoh.interpretation_ux_contract.v1";

export const STATE_LAYER_V1 = Object.freeze({
  RAW: "raw",
  DERIVED: "derived",
  POLICY: "policy"
});

export const LAYER_VISUAL_RANK_V1 = Object.freeze({
  [STATE_LAYER_V1.RAW]: 100,
  [STATE_LAYER_V1.POLICY]: 70,
  [STATE_LAYER_V1.DERIVED]: 40,
  narrative_sub_block: 15
});

export const INTERPRETATION_UX_CONTRACT_V1 = Object.freeze({
  schema: INTERPRETATION_UX_CONTRACT_SCHEMA_V1,
  layerOrder: Object.freeze([STATE_LAYER_V1.RAW, STATE_LAYER_V1.DERIVED, STATE_LAYER_V1.POLICY]),
  narrativeNeverVisuallyDominant: true
});

/** Tailwind class bundles enforcing visual rank (narrative subordinate). */
export const LAYER_UI_CLASSES_V1 = Object.freeze({
  raw: "text-[11px] font-mono text-emerald-100/90",
  derived: "text-[10px] text-white/55",
  derivedNarrative: "text-[8px] leading-snug text-white/35 normal-case",
  policy: "text-[9px] text-amber-100/80",
  disclaimer: "text-[9px] font-medium text-amber-200/90 normal-case",
  nonDominantHeadline: "text-[9px] font-normal text-white/40 line-through decoration-white/10"
});

/**
 * @param {unknown} hardeningPayload
 */
export function resolveUxContractFromHardeningV1(hardeningPayload) {
  const c =
    hardeningPayload?.unifiedState?.interpretationUxContract ||
    hardeningPayload?.unifiedState?.governance?.interpretationUxContract;
  if (c?.schema === INTERPRETATION_UX_CONTRACT_SCHEMA_V1) return c;
  return INTERPRETATION_UX_CONTRACT_V1;
}

/**
 * @param {unknown} policy
 */
export function shouldCollapseDerivedByDefaultV1(policy) {
  return policy?.displayRules?.collapseDerivedByDefault !== false;
}
