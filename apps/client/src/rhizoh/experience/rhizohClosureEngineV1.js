/**
 * Conversation Progress Closure Engine — faz geçişinde kazanım hissi + somut “ne değişti”.
 */

import {
  buildRhizohProductCapabilityEnvelope,
  rhizohConversationPhaseShortLabelTr
} from "../product/rhizohConversationOrchestratorV1.js";

export const RHIZOH_CLOSURE_ENGINE_VERSION = "1.0.0";

/** @type {Record<string, string>} */
const SURFACE_UNLOCK_TR = {
  basicCompanionChat: "Temel sohbet",
  intentRoutingFull: "Niyet yönlendirme",
  constitutionalProductionDrawer: "Üretim / karar özeti paneli",
  kernelHeavyPanels: "KERNEL konsolu",
  epistemicHeavyHud: "Epistemik HUD ve küre",
  feedbackOutcomeChip: "Geri bildirim rozeti",
  governanceOpsBadge: "Governance görünürlüğü"
};

/**
 * @param {Record<string, boolean>} prev
 * @param {Record<string, boolean>} next
 * @returns {string[]}
 */
export function diffRhizohUnlockedSurfaceKeys(prev = {}, next = {}) {
  const keys = [];
  for (const k of Object.keys(next)) {
    if (next[k] === true && prev[k] !== true) keys.push(k);
  }
  return keys;
}

function unlockLabelsTR(keys) {
  return keys.map((k) => SURFACE_UNLOCK_TR[k] || k);
}

/**
 * @param {string | undefined} fromPhase
 * @param {string | undefined} toPhase
 * @returns {{
 *   schemaVersion: string,
 *   closureEngineVersion: string,
 *   fromPhase: string,
 *   toPhase: string,
 *   rewardHeadline: string,
 *   achievementLine: string,
 *   whatChangedForYou: string[],
 *   unlockedSurfaceKeys: string[],
 *   unlockedLabelsTr: string[]
 * }}
 */
export function buildRhizohPhaseClosure(fromPhase, toPhase) {
  const a = String(fromPhase || "");
  const b = String(toPhase || "");
  const prevEnv = buildRhizohProductCapabilityEnvelope(a);
  const nextEnv = buildRhizohProductCapabilityEnvelope(b);
  const unlockedSurfaceKeys = diffRhizohUnlockedSurfaceKeys(prevEnv.surfaces, nextEnv.surfaces);
  const unlockedLabelsTr = unlockLabelsTR(unlockedSurfaceKeys);

  /** Zengin geçiş şablonları (XP / RPG closure hissi) */
  const rich = {
    "NEW_USER->INTRO": {
      rewardHeadline: "İlk köprü kuruldu",
      achievementLine:
        "Karşılıklı tanınma başladı — Rhizoh artık seninle tanışma modunda; bir sonraki adımda bağ güçlendikçe daha fazla yüzey açılacak.",
      whatChangedForYou: [
        "Sohbet bağlamı “tanışma” bandına alındı.",
        "Uzun teknik paneller kapalı kalarak güvenli tempo korunuyor."
      ]
    },
    "INTRO->TRUST_BUILD": {
      rewardHeadline: "Güven seviyesi yükseldi",
      achievementLine:
        "İlerlemen somutlaştı — artık hafıza özeti ve daha derin analize uygun yüzeyler devreye giriyor.",
      whatChangedForYou: [
        "Bellek ve continuity özeti LLM tarafında daha anlamlı kullanılabilir.",
        "Üretim / karar özeti (hafif R5 görünümü) erişilebilir.",
        "Gözlemevi ve niyet omurgası bu fazda kullanıma açıldı."
      ]
    },
    "TRUST_BUILD->NORMAL_CHAT": {
      rewardHeadline: "Tam etkileşim bandı",
      achievementLine:
        "Bağın ve tur sayın tam sohbet eşiğini geçti — çekirdek, epistemik HUD ve KERNEL artık senin için aktif.",
      whatChangedForYou: [
        "Epistemik HUD ve dikkat tether’ı görünür.",
        "KERNEL sekmesi ve derin konsol erişimi açıldı.",
        "Tam üretim özeti ve gateway R5 yükü istemci tarafında gösterilebilir."
      ]
    },
    "NORMAL_CHAT->POWER_MODE": {
      rewardHeadline: "Operasyon görünürlüğü",
      achievementLine:
        "Gelişmiş mod kilidi açıldı — governance ve geri bildirim yüzeyleri senin için görünür.",
      whatChangedForYou: [
        "Politika / governance rozetleri görünür.",
        "Geri bildirim çıktıları için UI ipuçları açık."
      ]
    },
    "NEW_USER->TRUST_BUILD": {
      rewardHeadline: "Hızlı güven sıçraması",
      achievementLine:
        "Sistem seni doğrudan güven bandına taşıdı — bellek ve analiz yüzeyleri erken açıldı.",
      whatChangedForYou: ["Tanışma adımları kısaltıldı; güven fazı özellikleri aktif."]
    },
    "NEW_USER->NORMAL_CHAT": {
      rewardHeadline: "Tam band erken açıldı",
      achievementLine: "Oturum güçlü bağ sinyali ile doğrudan tam etkileşim bandına alındı.",
      whatChangedForYou: ["Tüm standart kullanıcı yüzeyleri kullanılabilir."]
    }
  };

  const key = `${a}->${b}`;
  const pack =
    rich[key] ||
    ({
      rewardHeadline: "Evre güncellendi",
      achievementLine: `Konuşma evresi ${rhizohConversationPhaseShortLabelTr(a)} → ${rhizohConversationPhaseShortLabelTr(b)} olarak ilerledi.`,
      whatChangedForYou: unlockedLabelsTr.length
        ? [`Yeni açılanlar: ${unlockedLabelsTr.join(" · ")}.`]
        : ["Özellik setin güncellendi — aşağıdaki listeden kontrol edebilirsin."]
    });

  return {
    schemaVersion: "1.0.0",
    closureEngineVersion: RHIZOH_CLOSURE_ENGINE_VERSION,
    fromPhase: a,
    toPhase: b,
    rewardHeadline: pack.rewardHeadline,
    achievementLine: pack.achievementLine,
    whatChangedForYou: pack.whatChangedForYou,
    unlockedSurfaceKeys,
    unlockedLabelsTr
  };
}
