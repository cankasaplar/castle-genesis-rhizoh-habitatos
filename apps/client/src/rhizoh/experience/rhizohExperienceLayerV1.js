/**
 * Rhizoh Experience Layer — faz anlatısı, progress, capability görünürlüğü, hafif kullanıcı-niyet ipucu.
 */

import {
  RHIZOH_CONVERSATION_PHASE,
  rhizohConversationPhaseShortLabelTr
} from "../product/rhizohConversationOrchestratorV1.js";

export const RHIZOH_EXPERIENCE_LAYER_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {string} message
 * @returns {{ bucket: string, label: string }}
 */
export function inferRhizohUserGoalHint(message = "") {
  const m = String(message || "")
    .trim()
    .toLowerCase()
    .slice(0, 800);
  if (!m) return { bucket: "open", label: "Henüz mesaj yok — özgür sohbet veya bir soruyla başlayabilirsin." };
  if (/^(merhaba|selam|hey|hi)\b/.test(m)) return { bucket: "greeting", label: "Karşılama ve ilk bağ kurma." };
  if (/nasıl|yardım|ne yap|kurulum|bağlan/.test(m)) return { bucket: "how_to", label: "Yönlendirme / kullanım / bağlantı." };
  if (/istanbul|harita|konum|rota|şehir/.test(m)) return { bucket: "world_anchor", label: "Şehir ve harita bağlamı." };
  if (/komut|kernel|agent|intent|araç/.test(m)) return { bucket: "power_tools", label: "Teknik komut ve araç katmanı." };
  if (/güven|tanış|kimlik|öz(?:el)?|veri|gizlilik/.test(m)) return { bucket: "trust_privacy", label: "Güven, kimlik ve mahremiyet." };
  return { bucket: "dialog", label: "Genel sohbet akışı." };
}

/**
 * @param {string | undefined} phase
 * @returns {{ whyHere: string, narrativeLead: string }}
 */
export function buildRhizohPhaseStory(phase) {
  const p = String(phase || RHIZOH_CONVERSATION_PHASE.NEW_USER);
  const map = {
    [RHIZOH_CONVERSATION_PHASE.NEW_USER]: {
      whyHere: "İlk temas: sistem seni tanımıyor; kısa mesajlar güvenli başlangıç sağlar.",
      narrativeLead: "Rhizoh önce seni dinliyor — henüz derin paneller kapalı."
    },
    [RHIZOH_CONVERSATION_PHASE.INTRO]: {
      whyHere: "Tanışma evresi: kimlik ve amaç netleşene kadar sohbet yüzeysel kalır.",
      narrativeLead: "Ağır teknik görünümler kapalı; sohbet ve omurgalı bağlam öncelikli."
    },
    [RHIZOH_CONVERSATION_PHASE.TRUST_BUILD]: {
      whyHere: "Güven inşası: bağ ve tur sayısı arttıkça bellek özeti ve karar gözlemi açılır.",
      narrativeLead: "Hafif üretim özeti görünür; tam çekirdek hâlâ kısıtlı."
    },
    [RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT]: {
      whyHere: "Normal sohbet: tam etkileşim bandı — çekirdek ve epistemik yoğunluk aktif.",
      narrativeLead: "Rhizoh ile dünya + araçlar birlikte kullanılabilir."
    },
    [RHIZOH_CONVERSATION_PHASE.POWER_MODE]: {
      whyHere: "Gelişmiş mod: governance ve geri bildirim yüzeyleri görünür.",
      narrativeLead: "Ürün politikası ve operasyon görünürlüğü açık — dikkatli kullan."
    }
  };
  return map[p] || map[RHIZOH_CONVERSATION_PHASE.NEW_USER];
}

/**
 * Geçiş kullanıcıya tek cümle — faz değişince toast için.
 * @param {string | undefined} fromPhase
 * @param {string | undefined} toPhase
 */
export function explainRhizohPhaseTransition(fromPhase, toPhase) {
  const a = String(fromPhase || "");
  const b = String(toPhase || "");
  if (!a || !b || a === b) return "";
  const key = `${a}->${b}`;
  const table = {
    "NEW_USER->INTRO": "Tanışma fazına geçtin — Rhizoh seni tanımaya başlayabilir.",
    "INTRO->TRUST_BUILD": "Güven fazı açıldı: bellek özeti ve hafif karar görünümü aktifleşti.",
    "TRUST_BUILD->NORMAL_CHAT": "Tam sohbet bandı açıldı: çekirdek ve epistemik yüzeyler kullanılabilir.",
    "NORMAL_CHAT->POWER_MODE": "Gelişmiş mod: governance ve geri bildirim rozetleri görünür.",
    "NEW_USER->TRUST_BUILD": "Doğrudan güven fazına sıçradın — önceki evreler atlandı (yüksek tur/bağ sinyali)."
  };
  if (table[key]) return table[key];
  return `Konuşma evresi güncellendi: ${rhizohConversationPhaseShortLabelTr(a)} → ${rhizohConversationPhaseShortLabelTr(b)}.`;
}

/**
 * Bir sonraki faza yakınlık (0–1) — orchestrator eşikleriyle uyumlu basit model.
 * @param {string | undefined} phase
 * @param {{ trust?: number, familiarity?: number, userTurnCount?: number, introSeen?: boolean }} signals
 */
export function buildRhizohConversationGoals(phase, signals = {}) {
  const bond = (clamp01(signals.trust) + clamp01(signals.familiarity)) / 2;
  const turns = Math.max(0, Math.floor(Number(signals.userTurnCount) || 0));
  const introSeen = signals.introSeen === true;
  const p = String(phase || RHIZOH_CONVERSATION_PHASE.NEW_USER);

  /** @type {{ headline: string, progress01: number, nextStopLabel: string }} */
  let out = {
    headline: "Rhizoh ile akışını sürdür.",
    progress01: 0,
    nextStopLabel: "İleri"
  };

  if (p === RHIZOH_CONVERSATION_PHASE.NEW_USER) {
    const needIntro = introSeen || turns >= 1;
    out = {
      headline: "İlk bağlantı — kısa bir mesaj veya intro tamamlama.",
      progress01: needIntro ? 1 : 0.35,
      nextStopLabel: "Tanışma"
    };
  } else if (p === RHIZOH_CONVERSATION_PHASE.INTRO) {
    const towardTrust =
      (introSeen && turns >= 3) || turns >= 6
        ? 1
        : introSeen
          ? Math.min(1, (turns - 1) / 5)
          : Math.min(1, turns / 6);
    out = {
      headline: "Tanışmayı derinleştir — güven fazına geçiş için birkaç tur daha.",
      progress01: towardTrust,
      nextStopLabel: "Güven fazı"
    };
  } else if (p === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) {
    const bondOk = bond >= 0.34 ? 1 : bond / 0.34;
    const turnOk = turns >= 12 ? 1 : turns / 12;
    out = {
      headline: "Bağ güçlendikçe tam etkileşim bandı açılır.",
      progress01: Math.min(1, (bondOk + turnOk) / 2),
      nextStopLabel: "Tam sohbet"
    };
  } else if (p === RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT) {
    out = {
      headline: "Tam sohbet bandındasın — gelişmiş mod isteğe bağlı.",
      progress01: 1,
      nextStopLabel: "İyi kullanımlar"
    };
  } else if (p === RHIZOH_CONVERSATION_PHASE.POWER_MODE) {
    out = {
      headline: "Gelişmiş governance görünürlüğü açık.",
      progress01: 1,
      nextStopLabel: "Operasyon"
    };
  }

  return {
    schemaVersion: "1.0.0",
    experienceLayerVersion: RHIZOH_EXPERIENCE_LAYER_VERSION,
    conversationPhase: p,
    bondScore: Math.round(bond * 1000) / 1000,
    turnsLogged: turns,
    ...out
  };
}

/**
 * Capability yüzey tablosu — UI listesi için.
 * @param {Record<string, boolean>} surfaces
 */
export function buildRhizohCapabilitySurfaceRows(surfaces = {}) {
  const s = surfaces && typeof surfaces === "object" ? surfaces : {};
  const rows = [
    { key: "basicCompanionChat", label: "Sohbet", lockedHint: "" },
    {
      key: "intentRoutingFull",
      label: "Niyet yönlendirme",
      lockedHint: "Güven fazına gelince."
    },
    {
      key: "constitutionalProductionDrawer",
      label: "Üretim / karar özeti",
      lockedHint: "Güven fazında."
    },
    {
      key: "kernelHeavyPanels",
      label: "KERNEL konsolu",
      lockedHint: "Tam sohbet bandında."
    },
    {
      key: "epistemicHeavyHud",
      label: "Epistemik HUD",
      lockedHint: "Tam sohbet bandında."
    },
    {
      key: "feedbackOutcomeChip",
      label: "Geri bildirim rozeti",
      lockedHint: "Gelişmiş modda."
    },
    {
      key: "governanceOpsBadge",
      label: "Governance görünürlüğü",
      lockedHint: "Gelişmiş modda."
    }
  ];
  return rows.map((r) => ({
    ...r,
    enabled: !!s[r.key]
  }));
}
