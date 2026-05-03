/**
 * Introduction ritual — izin → isim → karşılama (LLM davranışı için durum + ipuçları).
 */

import { ENTITY_CLASS } from "./identityResolution.js";

export const INTRO_PHASE = Object.freeze({
  NONE: "none",
  PRESENCE_SENSED: "presence_sensed",
  AWAITING_CONSENT: "awaiting_consent",
  AWAITING_NAME: "awaiting_name",
  WELCOMED: "welcomed",
  OBSERVING: "observing"
});

/**
 * @param {string} text
 * @returns {string|null}
 */
export function parseSelfIntroductionName(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  const m =
    t.match(/\b(?:ben|adım|ismim|I'm|I am|my name is)\s+([A-Za-zğüşıöçĞÜŞİÖÇ]{2,24})/iu) ||
    t.match(/^([A-Za-zğüşıöçĞÜŞİÖÇ]{2,24})\s*\.?\s*$/u);
  if (!m) return null;
  const name = String(m[1] || "").trim();
  return name.length >= 2 ? name.slice(0, 48) : null;
}

/**
 * Pozitif rıza ipuçları (kısa).
 * @param {string} text
 */
export function parseConsentLikely(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return false;
  return /\b(evet|olur|tamam|isterim|yes|ok|sure)\b/.test(t);
}

/**
 * @param {string} phase
 * @param {{ entityClass?: string, displayName?: string }} ctx
 */
export function introductionGuidanceForLlm(phase, ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const cl = String(c.entityClass || "unknown");
  const lines = [
    "Introduction protocol (Castle Social Identity):",
    `- Phase: ${phase}`,
    `- Entity class: ${cl}`,
    "Do not open with a named greeting (e.g. «Merhaba X») until consent and name are established.",
    "If phase is presence_sensed: acknowledge softly; offer optional introduction («Burada yeni bir varlık hissediyorum — tanışmak ister misin?») without assuming identity."
  ];
  if (phase === INTRO_PHASE.AWAITING_NAME) {
    lines.push("Ask how they wish to be addressed; if they self-introduce, mirror once and invite purpose.");
  }
  if (phase === INTRO_PHASE.WELCOMED && c.displayName) {
    lines.push(`Welcomed — you may use ${c.displayName} naturally; stay proportional to relationship stage.`);
  }
  if (cl === ENTITY_CLASS.AMBIENT) {
    lines.push("Ambient source — do not address as a person.");
  }
  return lines.join("\n");
}

/**
 * @param {unknown} row
 * @param {{
 *   hasStrongIdentity?: boolean,
 *   consentLikely?: boolean,
 *   nameLearned?: boolean,
 *   suspicious?: boolean
 * }} ev
 */
export function advanceIntroductionPhase(row, ev) {
  const r = row && typeof row === "object" ? { ...row } : { phase: INTRO_PHASE.NONE };
  let phase = String(r.phase || INTRO_PHASE.NONE);
  const e = ev && typeof ev === "object" ? ev : {};

  if (e.suspicious) {
    return { ...r, phase: INTRO_PHASE.OBSERVING, updatedAt: Date.now() };
  }
  if (e.hasStrongIdentity) {
    return { ...r, phase: INTRO_PHASE.WELCOMED, updatedAt: Date.now() };
  }
  if (e.nameLearned) {
    return { ...r, phase: INTRO_PHASE.WELCOMED, updatedAt: Date.now() };
  }
  if (phase === INTRO_PHASE.NONE && e.presenceDetected) {
    phase = INTRO_PHASE.PRESENCE_SENSED;
  }
  if (phase === INTRO_PHASE.PRESENCE_SENSED && e.consentOffered) {
    phase = INTRO_PHASE.AWAITING_CONSENT;
  }
  if (phase === INTRO_PHASE.AWAITING_CONSENT && e.consentLikely) {
    phase = INTRO_PHASE.AWAITING_NAME;
  }
  return { ...r, phase, updatedAt: Date.now() };
}
