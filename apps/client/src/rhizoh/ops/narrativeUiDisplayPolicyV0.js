/**
 * Client-side narrative UI display policy v0 — mirrors gateway narrativeUiSafety.
 * Use when rendering ops/hardening panels; never treat narrative as approval.
 */

export const NARRATIVE_UI_DISPLAY_POLICY_SCHEMA_V0 = "rhizoh.narrative_ui_display_policy.v0";

/** Default when API has not yet returned humanOps.narrativeUiSafety */
export const DEFAULT_NARRATIVE_UI_SAFETY_V0 = Object.freeze({
  schema: NARRATIVE_UI_DISPLAY_POLICY_SCHEMA_V0,
  displayRules: Object.freeze({
    showRawStateFirst: true,
    collapseDerivedByDefault: true,
    neverShowHeadlineConfidenceAlone: true,
    primaryMetricLabel: "trustworthy_confidence",
    suppressGreenOnStressed: true,
    requireDisclaimerBanner: true
  }),
  disclaimer: Object.freeze({
    tr: "Bu panel karar vermez; yalnızca operasyonel hipotez sunar.",
    en: "This panel does not decide; operational hypothesis only."
  }),
  prohibitedUiPatterns: Object.freeze([
    "go_live_button_driven_by_narrative_headline",
    "auto_apply_suggested_action",
    "confidence_badge_as_approval"
  ])
});

/**
 * @param {unknown} hardeningPayload — GET /rhizoh/ops/hardening/status JSON
 */
export function resolveNarrativeUiPolicyFromHardeningV0(hardeningPayload) {
  const ui = hardeningPayload?.unifiedState?.humanOps?.narrativeUiSafety;
  if (ui?.schema) return ui;
  return DEFAULT_NARRATIVE_UI_SAFETY_V0;
}

/**
 * @param {unknown} policy
 * @param {{ health?: string }} state
 */
export function shouldSuppressApprovalChromeV0(policy, state = {}) {
  const p = policy || DEFAULT_NARRATIVE_UI_SAFETY_V0;
  if (p.displayRules?.suppressGreenOnStressed && state.health === "stressed") return true;
  if (p.displayRules?.suppressGreenOnStressed && state.health === "degraded") return true;
  return false;
}

/**
 * Confidence value safe for display (never headline alone).
 * @param {unknown} unifiedState
 */
export function pickDisplayConfidenceV0(unifiedState) {
  const s = unifiedState?.systemState || unifiedState?.stateLayers?.derived?.systemState;
  if (!s) return null;
  return s.confidenceTrustworthy ?? s.confidenceAdjusted ?? s.confidenceHeadline ?? s.confidence;
}
