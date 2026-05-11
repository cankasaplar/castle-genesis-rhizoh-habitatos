import { RHIZOH_WEIGHTED_MEMORY_CAP } from "./constants.js";
import { computeTurnImportance } from "./computeTurnImportance.js";
import { computeEmotionalSalience } from "./computeEmotionalSalience.js";
import { inferRhizohMemoryTags } from "./inferRhizohMemoryTags.js";
import { normalizeEmotionState } from "../emotion/emotionState.js";

/**
 * @param {{
 *   userText: string,
 *   assistantText: string,
 *   router?: { intent?: string, subIntent?: string },
 *   source?: string,
 *   outcomeResonance?: number,
 *   emotionsAfter?: Record<string, unknown>,
 *   emotionsBefore?: Record<string, unknown>,
 *   relationship?: { trust?: number, familiarity?: number },
 *   epistemic?: Record<string, unknown>,
 *   modelRoute?: { provider?: string | null, model?: string | null }
 * }} payload
 */
export function buildRhizohWeightedTurnRecord(payload) {
  const userText = String(payload.userText || "");
  const assistantText = String(payload.assistantText || "");
  const router = payload.router && typeof payload.router === "object" ? payload.router : {};
  const intent = String(router.intent || "CHAT");
  const before = normalizeEmotionState(payload.emotionsBefore || {});
  const after = normalizeEmotionState(payload.emotionsAfter || {});
  const tensionDelta = after.tension - before.tension;
  const importance = computeTurnImportance(intent, { tensionDelta });
  const emotionalSalience = computeEmotionalSalience(after);
  const rel = payload.relationship && typeof payload.relationship === "object" ? payload.relationship : {};
  const trust = Number(rel.trust) || 0;
  const familiarity = Number(rel.familiarity) || 0;
  const bond = Math.min(1, Math.max(0, (trust + familiarity) / 2));
  const resonance =
    typeof payload.outcomeResonance === "number" && Number.isFinite(payload.outcomeResonance)
      ? Math.min(1, Math.max(0, payload.outcomeResonance))
      : 0.42;

  const row = {
    id: `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    ts: Date.now(),
    text: userText.slice(0, 400),
    user: userText.slice(0, 500),
    assistant: assistantText.slice(0, 900),
    intent,
    subIntent: String(router.subIntent || "NONE"),
    importance,
    emotionalSalience,
    resonance,
    bond,
    tags: inferRhizohMemoryTags(userText, assistantText),
    source: String(payload.source || "")
  };
  if (payload.epistemic && typeof payload.epistemic === "object") {
    row.epistemic = payload.epistemic;
  }
  if (payload.modelRoute && typeof payload.modelRoute === "object") {
    row.modelRoute = payload.modelRoute;
  }
  return row;
}

/**
 * @param {unknown[] | undefined} prev
 * @param {ReturnType<buildRhizohWeightedTurnRecord>} entry
 */
export function appendRhizohWeightedTurn(prev, entry) {
  const arr = Array.isArray(prev) ? prev.concat([entry]) : [entry];
  return arr.slice(-RHIZOH_WEIGHTED_MEMORY_CAP);
}
