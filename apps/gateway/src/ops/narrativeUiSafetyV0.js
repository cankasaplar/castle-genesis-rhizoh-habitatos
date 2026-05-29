/**
 * Narrative UI safety v0 — anti trust-amplification in product surfaces.
 * Prevents headline confidence / stressed badges from reading as go-ahead.
 */

export const NARRATIVE_UI_SAFETY_SCHEMA_V0 = "rhizoh.narrative_ui_safety.v0";

/**
 * @param {object} narrativeExport — buildUnifiedStateNarrativeV0 output
 */
export function buildNarrativeUiDisplayPolicyV0(narrativeExport) {
  const validation = narrativeExport?.validation || {};
  const governance = narrativeExport?.governance || {};
  const state = narrativeExport?.systemState || {};
  const trust = validation.trustPosture || governance.trustPosture || "narrative_hypothesis_only";
  const overtrust = validation.confidenceDecomposition?.composite?.overtrustRisk || "medium";

  return Object.freeze({
    schema: NARRATIVE_UI_SAFETY_SCHEMA_V0,
    displayRules: Object.freeze({
      showRawStateFirst: true,
      collapseDerivedByDefault: trust !== "narrative_trusted_with_caveats",
      neverShowHeadlineConfidenceAlone: true,
      primaryMetricLabel: "trustworthy_confidence",
      primaryMetricValue: state.confidenceTrustworthy ?? state.confidenceAdjusted,
      suppressGreenOnStressed: true,
      requireDisclaimerBanner: true
    }),
    disclaimer: Object.freeze({
      tr: "Bu panel karar vermez; yalnızca operasyonel hipotez sunar. Aksiyon insan veya harici ops'a aittir.",
      en: "This panel does not decide; operational hypothesis only. Actions belong to humans or external ops."
    }),
    prohibitedUiPatterns: Object.freeze([
      "go_live_button_driven_by_narrative_headline",
      "auto_apply_suggested_action",
      "confidence_badge_as_approval",
      "hide_raw_state_behind_narrative",
      "single_number_confidence_hero"
    ]),
    trustAmplificationRisk: Object.freeze({
      level: overtrust === "high" ? "elevated" : "normal",
      mitigations: Object.freeze([
        "dual_confidence_display",
        "divergence_flag_chips",
        "policy_prohibitions_tooltip"
      ])
    }),
    trustPosture: trust,
    colorSemantics: Object.freeze({
      stable: "neutral_info",
      stressed: "warning_not_approval",
      degraded: "alert_requires_human"
    })
  });
}
