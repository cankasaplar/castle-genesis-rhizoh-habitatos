/**
 * Rhizoh — konuşma & capability orkestrasyonu (saf fonksiyonlar).
 * Backend motorundan ayrı; istemci ürün yüzeyi + gateway context besler.
 */

export const RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION = "1.0.0";

/** @typedef {"NEW_USER"|"INTRO"|"TRUST_BUILD"|"NORMAL_CHAT"|"POWER_MODE"} RhizohConversationPhase */

export const RHIZOH_CONVERSATION_PHASE = Object.freeze({
  NEW_USER: "NEW_USER",
  INTRO: "INTRO",
  TRUST_BUILD: "TRUST_BUILD",
  NORMAL_CHAT: "NORMAL_CHAT",
  POWER_MODE: "POWER_MODE"
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampIntPrefer(value, fallback, min = 1, max = 999) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampBondGate(value, fallback, lo = 0.12, hi = 0.55) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {RhizohConversationPhase | string | undefined} prevPhase
 * @param {{
 *   trust?: number,
 *   familiarity?: number,
 *   userTurnCount?: number,
 *   introSeen?: boolean,
 *   explicitPowerUnlock?: boolean
 * }} signals — userTurnCount bu tur için effective sayım (genelde önceki + 1)
 * @param {{
 *   introTurnsForTrust?: number,
 *   introSeenTurnsForTrust?: number,
 *   trustBondForNormal?: number,
 *   trustTurnsForNormal?: number
 * }} [tuning] — ürün karar katmanından gelen opsiyonel eşikler
 * @returns {RhizohConversationPhase}
 */
export function advanceRhizohConversationPhase(prevPhase, signals = {}, tuning = {}) {
  if (signals.explicitPowerUnlock === true) return RHIZOH_CONVERSATION_PHASE.POWER_MODE;

  const introTurnsForTrust = clampIntPrefer(tuning.introTurnsForTrust, 6, 2, 24);
  const introSeenTurnsForTrust = clampIntPrefer(tuning.introSeenTurnsForTrust, 3, 1, 16);
  const trustBondForNormal = clampBondGate(tuning.trustBondForNormal, 0.34, 0.15, 0.55);
  const trustTurnsForNormal = clampIntPrefer(tuning.trustTurnsForNormal, 12, 4, 48);

  const prev = prevPhase && typeof prevPhase === "string" ? prevPhase : RHIZOH_CONVERSATION_PHASE.NEW_USER;
  const bond = (clamp01(signals.trust) + clamp01(signals.familiarity)) / 2;
  const turns = Math.max(0, Math.floor(Number(signals.userTurnCount) || 0));
  const introSeen = signals.introSeen === true;

  if (prev === RHIZOH_CONVERSATION_PHASE.POWER_MODE) return RHIZOH_CONVERSATION_PHASE.POWER_MODE;

  if (prev === RHIZOH_CONVERSATION_PHASE.NEW_USER) {
    if (turns >= 1 || introSeen) return RHIZOH_CONVERSATION_PHASE.INTRO;
    return RHIZOH_CONVERSATION_PHASE.NEW_USER;
  }

  if (prev === RHIZOH_CONVERSATION_PHASE.INTRO) {
    if ((introSeen && turns >= introSeenTurnsForTrust) || turns >= introTurnsForTrust)
      return RHIZOH_CONVERSATION_PHASE.TRUST_BUILD;
    return RHIZOH_CONVERSATION_PHASE.INTRO;
  }

  if (prev === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) {
    if (bond >= trustBondForNormal && turns >= trustTurnsForNormal)
      return RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT;
    return RHIZOH_CONVERSATION_PHASE.TRUST_BUILD;
  }

  if (prev === RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT) return RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT;

  return RHIZOH_CONVERSATION_PHASE.INTRO;
}

/**
 * @param {RhizohConversationPhase | string} phase
 * @param {{
 *   governanceBond01?: number | null,
 *   suppressGovernanceOpsBadgeUnlessBond01?: number | null
 * }} [opts] — ürün karar katmanı governance görünürlüğünü bağa göre yumuşatabilir
 * @returns {{
 *   schemaVersion: string,
 *   conversationPhase: string,
 *   surfaces: Record<string, boolean>,
 *   backendHints: Record<string, boolean>
 * }}
 */
export function buildRhizohProductCapabilityEnvelope(phase, opts = {}) {
  const p = String(phase || RHIZOH_CONVERSATION_PHASE.NEW_USER);

  /** @type {Record<string, boolean>} */
  const surfaces = {
    basicCompanionChat: true,
    intentRoutingFull: false,
    kernelHeavyPanels: false,
    constitutionalProductionDrawer: false,
    feedbackOutcomeChip: false,
    governanceOpsBadge: false,
    epistemicHeavyHud: false
  };

  /** @type {Record<string, boolean>} */
  const backendHints = {
    attachFullRhizohProduction: false,
    sendConstitutionalFeedbackField: false,
    exposeGovernanceShadowUi: false
  };

  if (p === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) {
    surfaces.intentRoutingFull = true;
    surfaces.constitutionalProductionDrawer = true;
    backendHints.attachFullRhizohProduction = true;
    backendHints.sendConstitutionalFeedbackField = true;
  }

  if (p === RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT || p === RHIZOH_CONVERSATION_PHASE.POWER_MODE) {
    surfaces.intentRoutingFull = true;
    surfaces.kernelHeavyPanels = true;
    surfaces.constitutionalProductionDrawer = true;
    surfaces.epistemicHeavyHud = true;
    backendHints.attachFullRhizohProduction = true;
    backendHints.sendConstitutionalFeedbackField = true;
  }

  if (p === RHIZOH_CONVERSATION_PHASE.POWER_MODE) {
    surfaces.feedbackOutcomeChip = true;
    surfaces.governanceOpsBadge = true;
    backendHints.exposeGovernanceShadowUi = true;
  }

  const bondGate = opts.suppressGovernanceOpsBadgeUnlessBond01;
  const bond01 = opts.governanceBond01 != null ? clamp01(opts.governanceBond01) : null;
  if (
    p === RHIZOH_CONVERSATION_PHASE.POWER_MODE &&
    bondGate != null &&
    bond01 != null &&
    bond01 < clamp01(bondGate)
  ) {
    surfaces.governanceOpsBadge = false;
    backendHints.exposeGovernanceShadowUi = false;
  }

  return {
    schemaVersion: "1.0.0",
    conversationPhase: p,
    surfaces,
    backendHints
  };
}

/**
 * Kısa Türkçe talimat — LLM bağlamına eklenir (ürün davranışı).
 * @param {RhizohConversationPhase | string} phase
 */
export function buildRhizohConversationLlmDirective(phase) {
  const p = String(phase || "");
  if (p === RHIZOH_CONVERSATION_PHASE.NEW_USER) {
    return (
      "[Ürün fazı: ilk temas] Önce güvenli karşılama; gereksiz sistem içi jargon kullanma. " +
      "Kullanıcıyı kısa sorularla tanış; uzun teknik anayasal liste verme."
    );
  }
  if (p === RHIZOH_CONVERSATION_PHASE.INTRO) {
    return (
      "[Ürün fazı: tanışma] Kimlik ve amaç sor; continuity içeriğini doğal biçimde özetle. " +
      "Derin tool / kernel komutları önerme."
    );
  }
  if (p === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) {
    return (
      "[Ürün fazı: güven inşası] Samimi ama sınırlı derinlikte konuş; R5 gözlemi sessiz kalmalı hissi — " +
      "kullanıcıya politika fişi dökme. İleri özellikleri nazikçe ima et."
    );
  }
  if (p === RHIZOH_CONVERSATION_PHASE.POWER_MODE) {
    return (
      "[Ürün fazı: güçlü mod] Deneyimli kullanıcı: daha teknik terimler ve gelişmiş yönlendirmeler mümkün; " +
      "yine de zararlı talimat reddi."
    );
  }
  return (
    "[Ürün fazı: normal sohbet] Tam arkadaşlık akışı; continuity ve episodic belleğe sadık kal. " +
    "İleri governance detayını ancak kullanıcı sorarsa aç."
  );
}

/** @param {string | undefined} phase */
export function rhizohConversationPhaseShortLabelTr(phase) {
  const map = {
    [RHIZOH_CONVERSATION_PHASE.NEW_USER]: "İlk temas",
    [RHIZOH_CONVERSATION_PHASE.INTRO]: "Tanışma",
    [RHIZOH_CONVERSATION_PHASE.TRUST_BUILD]: "Güven",
    [RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT]: "Sohbet",
    [RHIZOH_CONVERSATION_PHASE.POWER_MODE]: "Gelişmiş"
  };
  return map[String(phase)] || "—";
}
