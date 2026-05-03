import { RHIZOH_INTENT } from "../router/intentTypes.js";

/**
 * A: mevcut sorgu niyeti ile tur niyeti hizası (0.7–1.18).
 * @param {string} turnIntent
 * @param {string} queryIntent
 */
export function intentAlignmentFactor(turnIntent, queryIntent) {
  const a = String(turnIntent || "");
  const b = String(queryIntent || "");
  if (!b) return 1;
  if (a === b) return 1.14;
  if (a === RHIZOH_INTENT.CRISIS && b === RHIZOH_INTENT.BUILD) return 0.9;
  if (a === RHIZOH_INTENT.BUILD && b === RHIZOH_INTENT.CRISIS) return 0.88;
  if (a === RHIZOH_INTENT.CHAT && (b === RHIZOH_INTENT.REFLECT || b === RHIZOH_INTENT.PLAY)) return 0.95;
  if (a === RHIZOH_INTENT.REFLECT && b === RHIZOH_INTENT.CHAT) return 0.92;
  return 0.94;
}
