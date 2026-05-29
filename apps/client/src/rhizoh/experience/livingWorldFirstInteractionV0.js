/**
 * First interaction flow — reduces "what can I do here?" noise for cohort + zen UX.
 */

import { getRhizohUiTextModeV0, RHIZOH_UI_TEXT_MODE_V0 } from "../runtime/rhizohUiTextModeV0.js";
import { isCohortReviewSessionV0 } from "../cohort/cohortInvitePackV0.js";

export const COHORT_FIRST_INTENT_SEEDS_V0 = Object.freeze([
  "Burada ne yapabilirsin?",
  "Kendi alanını kur"
]);

/**
 * @param {string[]} fullIntents
 */
export function resolveFirstInteractionIntentsV0(fullIntents = []) {
  const cohort = isCohortReviewSessionV0();
  const mode = getRhizohUiTextModeV0();
  if (cohort || mode === RHIZOH_UI_TEXT_MODE_V0.ZEN) {
    return COHORT_FIRST_INTENT_SEEDS_V0.slice();
  }
  if (mode === RHIZOH_UI_TEXT_MODE_V0.CLEAN) {
    return fullIntents.slice(0, 3);
  }
  return fullIntents.slice();
}

/**
 * @param {{ thinking?: boolean, quiet?: boolean, fullPlaceholder?: string }} [ctx]
 */
export function resolveCommandPlaceholderV0(ctx = {}) {
  if (ctx.quiet) return "Rhizoh dinliyor…";
  if (ctx.thinking) return "Düşünceni sürdür.";
  if (isCohortReviewSessionV0()) {
    return "Burada ne yapabilirsin? veya kendi alanını kur…";
  }
  const mode = getRhizohUiTextModeV0();
  if (mode === RHIZOH_UI_TEXT_MODE_V0.ZEN) return "Rhizoh'a yaz…";
  return ctx.fullPlaceholder || "Ne yaratmak istiyorsunuz?";
}

/**
 * @param {{ fullHint?: string }} [ctx]
 */
export function resolveCommandHintV0(ctx = {}) {
  if (isCohortReviewSessionV0() || getRhizohUiTextModeV0() === RHIZOH_UI_TEXT_MODE_V0.ZEN) {
    return "Yaz veya konuş — Rhizoh tepki verir.";
  }
  return ctx.fullHint || "";
}

export function shouldShowSemanticHintChipsV0() {
  return getRhizohUiTextModeV0() === RHIZOH_UI_TEXT_MODE_V0.FULL && !isCohortReviewSessionV0();
}

export function shouldShowVerboseCommandHintV0() {
  return getRhizohUiTextModeV0() === RHIZOH_UI_TEXT_MODE_V0.FULL && !isCohortReviewSessionV0();
}

/** Cohort / zen: short LLM + faster spoken reply. */
export function resolveDefaultRhizohGenerationModeV0() {
  if (isCohortReviewSessionV0() || getRhizohUiTextModeV0() === RHIZOH_UI_TEXT_MODE_V0.ZEN) {
    return "FAST_DIALOGUE";
  }
  return "STANDARD";
}

export function shouldPreferFastDialogueForSessionV0() {
  return resolveDefaultRhizohGenerationModeV0() === "FAST_DIALOGUE";
}
