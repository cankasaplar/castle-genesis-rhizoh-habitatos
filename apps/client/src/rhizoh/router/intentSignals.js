import { RHIZOH_INTENT } from "./intentTypes.js";

const EMOTIONAL = Object.freeze({
  NEUTRAL: "NEUTRAL",
  FOCUSED: "FOCUSED",
  CURIOUS: "CURIOUS",
  CONTEMPLATIVE: "CONTEMPLATIVE",
  ALERT: "ALERT",
  FATIGUED_BUT_DETERMINED: "FATIGUED_BUT_DETERMINED",
  WARM: "WARM",
  FRUSTRATED: "FRUSTRATED"
});

/**
 * 0–1 aciliyet: ünlem, büyük harf oranı, kısa feryat kalıpları
 */
export function computeUrgency(text) {
  const t = String(text || "");
  if (!t.length) return 0;
  let score = 0;
  const bangs = (t.match(/!/g) || []).length;
  score += Math.min(0.35, bangs * 0.09);
  const upper = (t.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
  const ratio = upper / Math.max(1, t.length);
  if (ratio > 0.35 && t.length > 8) score += 0.22;
  if (/\b(urgent|acil|hemen|asap|now|çabuk|derhal)\b/i.test(t)) score += 0.28;
  if (/\b(yardım|help|çökm|crash|bozuk|çalışmıyor)\b/i.test(t)) score += 0.18;
  return Math.min(1, Math.round(score * 100) / 100);
}

/** Dinleme / minimal giriş modu */
export function detectSilenceMode(text) {
  const t = String(text || "").trim();
  if (!t.length) return true;
  if (/^\.{1,4}$/.test(t)) return true;
  if (/^(sessiz|sus|dinle|bekle|…)+$/i.test(t)) return true;
  if (t.length <= 2 && /^[.…]+$/.test(t)) return true;
  return false;
}

/**
 * Metin + üst intent’ten duygu sinyali (kernel girdisi için; hafif sezgisel)
 */
export function inferEmotionalSignalFromLanguage(text, intent) {
  const t = String(text || "");
  const i = String(intent || "");

  if (i === RHIZOH_INTENT.CRISIS) {
    if (/\b(yoruldum|bitirdim|bıktım|umutsuz)\b/i.test(t)) return EMOTIONAL.FATIGUED_BUT_DETERMINED;
    return EMOTIONAL.ALERT;
  }
  if (i === RHIZOH_INTENT.REFLECT) return EMOTIONAL.CONTEMPLATIVE;
  if (i === RHIZOH_INTENT.PLAY) return EMOTIONAL.CURIOUS;
  if (i === RHIZOH_INTENT.BUILD) return EMOTIONAL.FOCUSED;
  if (/\b(teşekkür|sağol|harika|süper|sevindim)\b/i.test(t)) return EMOTIONAL.WARM;
  if (/\b(sinir|berbat|rezalet|nefret)\b/i.test(t)) return EMOTIONAL.FRUSTRATED;
  return EMOTIONAL.NEUTRAL;
}

export { EMOTIONAL as RHIZOH_EMOTIONAL_SIGNAL };
