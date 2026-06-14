/**
 * Tower-scoped LLM turns — chat + optional vision frame.
 */

import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { resolveRhizohLlmLanguageV0 } from "./rhizohLanguagePropagationV0.js";
import { parseTowerImageDataUrlV0 } from "./rhizohTowerMediaCaptureV0.js";
import {
  resolveRhizohTowerLabelV0,
  resolveRhizohTowerProviderV0
} from "./rhizohTowerProviderRegistryV0.js";
import {
  beginRhizohTowerLlmFlightV0,
  endRhizohTowerLlmFlightV0
} from "./rhizohTowerLiveStatusV0.js";

/**
 * @param {{
 *   towerId: string,
 *   message: string,
 *   surface?: string,
 *   imageDataUrl?: string | null,
 *   voiceTurn?: boolean,
 *   idToken?: string,
 *   maxTokens?: number
 * }} input
 */
export async function postRhizohTowerLlmTurnV0(input = {}) {
  const towerId = String(input.towerId || "tower").trim();
  const message = String(input.message || "").trim();
  if (!message) return Object.freeze({ ok: false, error: "empty_message" });

  const providerRow = resolveRhizohTowerProviderV0(towerId);
  const tr = resolveOutputLanguageCodeV0() === "tr";
  const llmLang = resolveRhizohLlmLanguageV0();
  const label = resolveRhizohTowerLabelV0(towerId, tr);
  const surface = String(input.surface || "tower_chat").trim();

  /** @type {Record<string, unknown>} */
  const context = {
    towerId,
    surface,
    towerLabel: label
  };

  const parsedImage = input.imageDataUrl ? parseTowerImageDataUrlV0(input.imageDataUrl) : null;
  if (parsedImage && providerRow.provider === "gemini") {
    context.towerVision = Object.freeze({
      mimeType: parsedImage.mimeType,
      base64: parsedImage.base64
    });
  }

  beginRhizohTowerLlmFlightV0();
  try {
    const turn = await postRhizohLlmTurnV0({
      message,
      provider: providerRow.provider,
      llmKeySource: "env",
      voiceTurn: input.voiceTurn === true,
      idToken: input.idToken,
      context,
      options: {
        maxTokens: input.maxTokens ?? (parsedImage ? 220 : 512),
        language: llmLang.bcp47
      },
      sourcePath: `tower_${towerId}`
    });
    return turn;
  } finally {
    endRhizohTowerLlmFlightV0();
  }
}
