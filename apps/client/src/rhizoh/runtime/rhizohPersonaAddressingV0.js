/**
 * Persona addressing — preferred form of address (hitap) with disk continuity SSOT.
 * Auth/email name is fallback only until user confirms addressing.
 */

import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";
import { parseSelfIntroductionName } from "../social/csil/introductionProtocol.js";

export const RHIZOH_PERSONA_ADDRESSING_SCHEMA_V0 = "castle.rhizoh.persona_addressing.v0";

const ADDRESSING_PROMPT_DIRECTIVE_V0 =
  "Addressing (hitap): preferred form of address is NOT confirmed yet. Ask once, warmly, how the user wishes to be addressed (first name, nickname, or formal style). Do not assume email or account metadata. After they answer, use their choice consistently.";

/**
 * @param {string} raw
 */
export function normalizeForAddressingV0(raw) {
  return foldCanonicalSurfaceV1(String(raw || "").trim());
}

/**
 * @param {string} raw
 * @returns {{ firstName?: string, preferredAddress?: string, style?: string } | null}
 */
export function parsePreferredAddressFromTextV0(raw) {
  const n = normalizeForAddressingV0(raw);
  if (!n) return null;

  const intro = parseSelfIntroductionName(raw);
  if (intro) {
    return { firstName: intro, preferredAddress: intro, style: "first_name" };
  }

  const patterns = [
    /\b(?:bana|hitap(?:\s+et)?(?:\s+memi)?)\s+([a-z]{2,24})\s+(?:de|diye|olarak)\b/i,
    /\b(?:call\s+me|address\s+me\s+as)\s+([a-z]{2,24})\b/i,
    /\b(?:preferred\s+name|nickname)\s+(?:is\s+)?([a-z]{2,24})\b/i,
    /\b([a-z]{2,24})\s+olarak\s+hitap\b/i
  ];
  for (const re of patterns) {
    const m = n.match(re);
    if (m?.[1] && m[1].length >= 2) {
      const name = String(m[1]).slice(0, 48);
      const cap = name.charAt(0).toUpperCase() + name.slice(1);
      return { firstName: cap, preferredAddress: cap, style: "preferred" };
    }
  }

  if (/^(evet|tamam|olur|yes|ok|sure)\b/.test(n) && n.length <= 24) {
    return { style: "consent_only" };
  }

  return null;
}

/**
 * @param {Record<string, unknown>} [diskPersona]
 * @param {{ authFirstName?: string, authDisplayName?: string, conversationPhase?: string, userTurnCount?: number }} [ctx]
 */
export function resolveRhizohEffectivePersonaV0(diskPersona = {}, ctx = {}) {
  const disk = diskPersona && typeof diskPersona === "object" ? diskPersona : {};
  const authFirst = String(ctx.authFirstName || "").trim();
  const authDisplay = String(ctx.authDisplayName || "").trim();
  const userFirst = String(disk.firstName || "").trim();
  const preferredAddress = String(disk.preferredAddress || "").trim();
  const addressingConfirmed = disk.addressingConfirmed === true;
  const phase = String(ctx.conversationPhase || "").toUpperCase();
  const turns = Math.max(0, Math.floor(Number(ctx.userTurnCount) || 0));

  const effectiveFirstName = userFirst || preferredAddress || (addressingConfirmed ? authFirst : "");
  const effectiveAddress = preferredAddress || userFirst || (addressingConfirmed ? authFirst : "");

  const introPhase = phase === "INTRO" || phase === "NEW_USER";
  const needsAddressingPrompt =
    !addressingConfirmed && (introPhase || turns <= 2) && !preferredAddress && !userFirst;

  return Object.freeze({
    schema: RHIZOH_PERSONA_ADDRESSING_SCHEMA_V0,
    firstName: effectiveFirstName,
    preferredAddress: effectiveAddress,
    displayName: String(disk.displayName || authDisplay || effectiveFirstName || "").trim(),
    addressingConfirmed,
    needsAddressingPrompt,
    authFirstNameHint: authFirst || null,
    mayUseNameInReply: addressingConfirmed || Boolean(preferredAddress || userFirst)
  });
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} diskPersona
 */
export function applyAddressingFromUserMessageV0(message, diskPersona = {}) {
  const parsed = parsePreferredAddressFromTextV0(message);
  if (!parsed || parsed.style === "consent_only") return null;

  const prev = diskPersona && typeof diskPersona === "object" ? diskPersona : {};
  const firstName = String(parsed.firstName || prev.firstName || "").trim();
  const preferredAddress = String(parsed.preferredAddress || parsed.firstName || prev.preferredAddress || "").trim();
  if (!firstName && !preferredAddress) return null;

  return Object.freeze({
    ...prev,
    firstName: firstName || prev.firstName,
    preferredAddress: preferredAddress || firstName,
    addressingConfirmed: true,
    addressingUpdatedAt: Date.now(),
    addressingSource: "user_utterance"
  });
}

/**
 * @param {ReturnType<typeof resolveRhizohEffectivePersonaV0>} persona
 */
export function buildAddressingPromptDirectiveV0(persona) {
  if (!persona?.needsAddressingPrompt) return null;
  return ADDRESSING_PROMPT_DIRECTIVE_V0;
}

/**
 * @param {ReturnType<typeof resolveRhizohEffectivePersonaV0>} persona
 * @param {Record<string, unknown>} [basePersona]
 */
export function mergePersonaForLlmV0(persona, basePersona = {}) {
  const base = basePersona && typeof basePersona === "object" ? basePersona : {};
  const p = persona && typeof persona === "object" ? persona : {};
  return Object.freeze({
    ...base,
    firstName: p.firstName || base.firstName || "",
    preferredAddress: p.preferredAddress || base.preferredAddress || "",
    displayName: p.displayName || base.displayName || "",
    addressingConfirmed: p.addressingConfirmed === true,
    mayUseNameInReply: p.mayUseNameInReply === true
  });
}
