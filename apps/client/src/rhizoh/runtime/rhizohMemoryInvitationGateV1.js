/**
 * Memory Invitation Gate v1 — Rhizoh asks; scheduler persists only after consent.
 * RESEARCH-ONLY · cognition bridge · not execution authority.
 */

import { foldCanonicalSurfaceV1, probeEmotionalStateUtteranceV1 } from "./rhizohCanonicalIntentV1.js";

export const RHIZOH_MEMORY_INVITATION_GATE_SCHEMA_V1 = "castle.rhizoh.memory_invitation_gate.v1";

export const MEMORY_TIER_V1 = Object.freeze({
  SOFT: "soft_memory",
  COGNITIVE: "cognitive_memory",
  SPATIAL: "spatial_anchor"
});

export const MEMORY_CONSENT_STATUS_V1 = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  GRANTED: "granted",
  DECLINED: "declined"
});

export const SPATIAL_SIGNIFICANCE_THRESHOLD_V1 = 0.75;

const FUTURE_ORIENTATION_RE_V1 =
  /\b(yarin|gelecek|onumuzde|onumuzdeki|planliyorum|planlıyorum|gorusmem|görüşme|gorusme|hafta|ay icinde|ay içinde|next week|tomorrow|upcoming|scheduled|randevu|toplanti|toplantı|is degisikligi|iş değişikliği)\b/i;

const CONSENT_YES_RE_V1 =
  /\b(evet|olur|tamam|kaydet|not al|hatirla|hatırla|isterim|yes|sure|please do)\b/i;
const CONSENT_NO_RE_V1 =
  /\b(hayir|hayır|gerek yok|gerekmez|kaydetme|not alma|no thanks|no)\b/i;

/**
 * @param {string} raw
 */
export function probeFutureOrientationV1(raw) {
  const n = foldCanonicalSurfaceV1(String(raw || "").trim());
  if (!n) return Object.freeze({ active: false, score: 0, reason: "empty" });
  const active = FUTURE_ORIENTATION_RE_V1.test(n);
  const wordCount = n.split(/\s+/).filter(Boolean).length;
  const score = active ? Math.min(1, 0.55 + Math.min(wordCount, 8) * 0.04) : 0;
  return Object.freeze({
    active,
    score: Math.round(score * 1000) / 1000,
    reason: active ? "future_lexicon" : "none"
  });
}

/**
 * @param {string} raw
 * @param {{ significanceScore?: number, significanceField?: Record<string, unknown> | null, emotionalCharge?: number }} [ctx]
 */
export function probeMemoryInvitationCandidateV1(raw, ctx = {}) {
  const message = String(raw || "").trim();
  if (!message) {
    return Object.freeze({ active: false, tier: MEMORY_TIER_V1.SOFT, reason: "empty" });
  }

  const significance = Number(ctx.significanceScore ?? ctx.significanceField?.score ?? 0);
  const future = probeFutureOrientationV1(message);
  const emotional =
    Number(ctx.emotionalCharge) ||
    (probeEmotionalStateUtteranceV1(message) ? 0.72 : 0) ||
    Number(ctx.significanceField?.relationshipImpact ?? 0) * 0.5;

  const spatialEligible =
    significance >= SPATIAL_SIGNIFICANCE_THRESHOLD_V1 && future.active === true;

  if (spatialEligible) {
    return Object.freeze({
      active: true,
      tier: MEMORY_TIER_V1.SPATIAL,
      reason: "significance_future",
      significanceScore: significance,
      futureOrientation: future,
      emotionalCharge: emotional,
      invitationCopyTr:
        "Bunu ileride hatırlamamı — ve dünyana yumuşak bir işaret olarak yerleştirmemi ister misin?",
      invitationCopyEn:
        "Would you like me to remember this later — and place a soft marker in your world?"
    });
  }

  if (significance >= 0.55 || emotional >= 0.6 || future.active) {
    return Object.freeze({
      active: true,
      tier: MEMORY_TIER_V1.COGNITIVE,
      reason: "cognitive_weight",
      significanceScore: significance,
      futureOrientation: future,
      emotionalCharge: emotional,
      invitationCopyTr: "Bunu senin için not almamı ister misin?",
      invitationCopyEn: "Would you like me to note this for you?"
    });
  }

  return Object.freeze({
    active: false,
    tier: MEMORY_TIER_V1.SOFT,
    reason: "conversation_only",
    significanceScore: significance,
    futureOrientation: future,
    emotionalCharge: emotional
  });
}

/**
 * @param {string} raw
 */
export function parseMemoryConsentReplyV1(raw) {
  const n = foldCanonicalSurfaceV1(String(raw || "").trim());
  if (!n) return Object.freeze({ status: MEMORY_CONSENT_STATUS_V1.NONE, reason: "empty" });
  if (CONSENT_YES_RE_V1.test(n) && !CONSENT_NO_RE_V1.test(n)) {
    return Object.freeze({ status: MEMORY_CONSENT_STATUS_V1.GRANTED, reason: "affirmative" });
  }
  if (CONSENT_NO_RE_V1.test(n)) {
    return Object.freeze({ status: MEMORY_CONSENT_STATUS_V1.DECLINED, reason: "declined" });
  }
  return Object.freeze({ status: MEMORY_CONSENT_STATUS_V1.NONE, reason: "ambiguous" });
}

/**
 * @param {ReturnType<typeof probeMemoryInvitationCandidateV1>} candidate
 * @param {string} [locale]
 */
export function formatMemoryInvitationPromptBlockV1(candidate, locale = "tr") {
  if (!candidate?.active) return "";
  const tr = String(locale).toLowerCase().startsWith("tr");
  const copy = tr ? candidate.invitationCopyTr : candidate.invitationCopyEn;
  if (!copy) return "";
  return [
    "MEMORY INVITATION (Rhizoh cognition — ask once, never auto-save):",
    `- tier: ${candidate.tier}`,
    `- significance: ${candidate.significanceScore ?? "?"}`,
    `- If user already consented in-thread, acknowledge; else offer exactly once: "${copy}"`,
    "- Do NOT say you saved until consent is explicit.",
    "- Spatial tier = future event + high significance only."
  ].join("\n");
}
