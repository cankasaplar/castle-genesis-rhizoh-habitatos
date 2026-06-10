/**
 * Companion behavior-only policy — FOX (and future anchors) observe via motion;
 * no companion speech, no reply-as-speech motion. Rhizoh owns dialogue + cube sync.
 */

import { isFoxAnchorSpeciesV0 } from "./conversationAnchorSpeciesV0.js";
import {
  deriveOctoMotionDriveV1,
  mapFieldStateToOctoEmotionV1
} from "./octoConversationMotionV1.js";
import { applyGhostPresentationToCompanionDriveV1 } from "../rhizoh/runtime/ghostStateEngineV1.js";

export const COMPANION_BEHAVIOR_ONLY_SCHEMA_V0 = "castle.companion_behavior_only.v0";
export const COMPANION_BEHAVIOR_ONLY_ENV_V0 = "VITE_RHIZOH_COMPANION_BEHAVIOR_ONLY";

/**
 * @param {string} [speciesId]
 */
export function isCompanionBehaviorOnlyV0(speciesId) {
  const raw = String(import.meta.env?.[COMPANION_BEHAVIOR_ONLY_ENV_V0] ?? "").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return isFoxAnchorSpeciesV0(speciesId);
}

/**
 * Map session field → companion observer field (never "speaking").
 * @param {string} fieldState
 */
export function mapRhizohFieldToCompanionObserverFieldV0(fieldState) {
  const fs = String(fieldState || "idle").toLowerCase();
  if (fs === "speaking" || fs === "executing") return "listening";
  if (fs === "generating" || fs === "interpreting") return "thinking";
  return fs;
}

/**
 * Motion drive for behavior-only companion — replyText ignored for anchor motion.
 * @param {{ fieldState?: string, draftText?: string, busy?: boolean }} input
 */
export function deriveFoxCompanionBehaviorDriveV1(input = {}) {
  const fs = String(input.fieldState || "idle").toLowerCase();
  const draft = String(input.draftText || "").trim();
  const busy = Boolean(input.busy);
  const observerField = mapRhizohFieldToCompanionObserverFieldV0(fs);

  const drive = deriveOctoMotionDriveV1({
    fieldState: observerField,
    replyText: "",
    draftText: input.draftText,
    busy
  });

  const attentive =
    fs === "listening" ||
    fs === "speaking" ||
    fs === "executing" ||
    fs === "generating" ||
    fs === "interpreting" ||
    fs === "thinking" ||
    busy ||
    draft.length > 0;

  if (!attentive) {
    return applyGhostPresentationToCompanionDriveV1(
      drive,
      typeof window !== "undefined" ? window.__rhizoh?.ghostPresentationBias : null
    );
  }

  const emotion = mapFieldStateToOctoEmotionV1(observerField);
  let reach = drive.reach ?? 0.35;
  if (fs === "speaking" || fs === "executing") reach = 0.52;
  else if (observerField === "listening") reach = 0.58;
  else if (observerField === "thinking") reach = -0.14;
  else if (draft.length > 0) reach = 0.62;

  const patched = applyGhostPresentationToCompanionDriveV1(
    Object.freeze({
      ...drive,
      draftText: input.draftText,
      live: true,
      emotion,
      reach,
      companionBehaviorOnly: true,
      observerField
    }),
    typeof window !== "undefined" ? window.__rhizoh?.ghostPresentationBias : null
  );
  return patched;
}

/**
 * @param {string} [locale]
 */
export function resolveCompanionBehaviorStripCopyV0(locale = "tr") {
  const lang = String(locale || "tr").toLowerCase();
  if (lang.startsWith("tr")) {
    return Object.freeze({
      title: "Companion · davranış temsili",
      detail: "Konuşmaz — dinler, cube'a yaklaşır / uzaklaşır"
    });
  }
  return Object.freeze({
    title: "Companion · behavior only",
    detail: "Does not speak — observes and accompanies"
  });
}
