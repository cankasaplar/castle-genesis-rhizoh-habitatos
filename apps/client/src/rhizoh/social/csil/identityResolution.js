/**
 * Identity Resolution — sinyal önceliği ile sınıf + entityId.
 * Hard/Soft/Social hiyerarşisi + confidence fusion.
 */

export const ENTITY_CLASS = Object.freeze({
  HUMAN_USER: "human_user",
  HUMAN_GUEST: "human_guest",
  AI_AGENT: "ai_agent",
  GHOST_PET: "ghost_pet",
  AMBIENT: "ambient",
  UNKNOWN: "unknown"
});

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function hardIdentity(signals) {
  const s = signals && typeof signals === "object" ? signals : {};
  if (s.hasFirebaseUser && String(s.firebaseUid || "").trim()) {
    return {
      entityId: `u_${String(s.firebaseUid).trim()}`,
      class: ENTITY_CLASS.HUMAN_USER,
      confidence: 0.93,
      source: "firebase_auth",
      displayNameHint: String(s.displayName || "").trim() || undefined
    };
  }
  if (s.signedAgentKey && String(s.agentId || "").trim()) {
    return {
      entityId: `agent_${String(s.agentId).trim()}`,
      class: ENTITY_CLASS.AI_AGENT,
      confidence: 0.9,
      source: "signed_agent_key"
    };
  }
  return null;
}

/**
 * @param {{
 *   hasFirebaseUser?: boolean,
 *   firebaseUid?: string,
 *   displayName?: string,
 *   signedAgentKey?: boolean,
 *   agentId?: string,
 *   voiceSignatureMatch?: boolean,
 *   avatarContinuityScore?: number,
 *   behavioralScore?: number,
 *   sessionKey?: string,
 *   selfIntroductionName?: string,
 *   ambientHint?: boolean,
 *   ghostPetActive?: boolean
 * }} signals
 * @param {{ entityId?: string, class?: string } | null} [prior]
 */
export function resolveEntityFromSignals(signals, prior = null) {
  const s = signals && typeof signals === "object" ? signals : {};
  const pr = prior && typeof prior === "object" ? prior : {};

  if (s.ambientHint) {
    return {
      entityId: "ambient_room",
      class: ENTITY_CLASS.AMBIENT,
      confidence: 0.55,
      source: "ambient_hint"
    };
  }
  if (s.ghostPetActive) {
    return {
      entityId: "ghost_pet",
      class: ENTITY_CLASS.GHOST_PET,
      confidence: 0.78,
      source: "ghost_pet"
    };
  }

  const hard = hardIdentity(s);
  if (hard) {
    return {
      ...hard,
      hierarchy: "hard",
      confidenceBreakdown: {
        auth: hard.source === "firebase_auth" ? 0.95 : 0,
        signedAgent: hard.source === "signed_agent_key" ? 0.94 : 0,
        voice: 0,
        avatar: 0,
        behavior: 0,
        introduction: 0,
        socialClaim: 0
      }
    };
  }

  const breakdown = {
    auth: 0,
    signedAgent: 0,
    voice: s.voiceSignatureMatch && pr.entityId ? 0.72 : 0,
    avatar: clamp01(s.avatarContinuityScore),
    behavior: clamp01(s.behavioralScore),
    introduction: String(s.selfIntroductionName || "").trim() ? 0.84 : 0,
    socialClaim: String(s.displayName || "").trim() ? 0.46 : 0
  };
  const weightedFusion = clamp01(
    breakdown.voice * 0.34 +
      breakdown.avatar * 0.22 +
      breakdown.behavior * 0.18 +
      breakdown.introduction * 0.2 +
      breakdown.socialClaim * 0.06
  );

  if (breakdown.voice > 0.65 && pr.entityId) {
    return {
      entityId: String(pr.entityId),
      class: pr.class || ENTITY_CLASS.HUMAN_USER,
      confidence: Math.max(0.62, weightedFusion),
      source: "voice_signature",
      hierarchy: "soft",
      confidenceBreakdown: breakdown
    };
  }
  const av = clamp01(s.avatarContinuityScore);
  if (av > 0.62 && pr.entityId) {
    return {
      entityId: String(pr.entityId),
      class: pr.class || ENTITY_CLASS.HUMAN_GUEST,
      confidence: Math.max(0.55, weightedFusion),
      source: "avatar_continuity",
      hierarchy: "soft",
      confidenceBreakdown: breakdown
    };
  }
  const bh = clamp01(s.behavioralScore);
  if (bh > 0.5 && pr.entityId) {
    return {
      entityId: String(pr.entityId),
      class: pr.class || ENTITY_CLASS.UNKNOWN,
      confidence: Math.max(0.45, weightedFusion),
      source: "behavioral_fingerprint",
      hierarchy: "soft",
      confidenceBreakdown: breakdown
    };
  }
  const intro = String(s.selfIntroductionName || "").trim();
  if (intro) {
    const sk = String(s.sessionKey || "session").slice(0, 64);
    return {
      entityId: `guest_${sk}`,
      class: ENTITY_CLASS.HUMAN_GUEST,
      confidence: Math.max(0.64, weightedFusion),
      source: "self_introduction",
      displayNameHint: intro,
      hierarchy: "social_claim",
      confidenceBreakdown: breakdown
    };
  }
  const sk = String(s.sessionKey || "anon").slice(0, 64);
  return {
    entityId: `guest_${sk}`,
    class: ENTITY_CLASS.UNKNOWN,
    confidence: Math.max(0.32, weightedFusion),
    source: "session_or_unknown",
    hierarchy: "soft",
    confidenceBreakdown: breakdown
  };
}
