/**
 * Ingress copy — localized legal / cohort / error surfaces.
 * Legal HTML remains TR-authoritative on rhizoh.com; UI may show translations.
 */

import { formatDataControllerLineV0 } from "./legalEntityConstantsV0.js";
import { normalizeUiLocaleV0, readUiLocaleV0 } from "../runtime/rhizohUiLocaleV0.js";

/** @typedef {'en'|'tr'|'fi'|'fr'|'es'|'zh'|'ja'} IngressLocaleV0 */

const LEGAL_DOCS_NOTE_EN =
  "Full binding legal documents are published in Turkish; English UI text is for orientation only.";

/** @type {Record<string, object>} */
const LANGUAGE_PICKER_COPY = Object.freeze({
  en: Object.freeze({
    kicker: "LANGUAGE",
    title: "App language",
    lead: "Menus, buttons, and the legal screen. You can change this later in settings.",
    continueLabel: "Continue",
    rhizohKicker: "RHIZOH SPEECH",
    rhizohTitle: "How should Rhizoh listen?",
    rhizohLead:
      "Voice recognition and commands use this profile — separate from app language. Auto is recommended.",
    rhizohAutoLabel: "Auto (recommended)",
    rhizohMirrorLabel: "Same as app language",
    rhizohManualLabel: "Choose speech language",
    rhizohFinishLabel: "Continue to legal gate"
  }),
  tr: Object.freeze({
    kicker: "DİL",
    title: "Uygulama dili",
    lead: "Menüler, düğmeler ve hukuki geçit. Bunu daha sonra ayarlardan değiştirebilirsiniz.",
    continueLabel: "Devam et",
    rhizohKicker: "RHIZOH KONUŞMA",
    rhizohTitle: "Rhizoh nasıl dinlesin?",
    rhizohLead:
      "Ses tanıma ve komutlar bu profili kullanır — uygulama dilinden ayrıdır. Otomatik önerilir.",
    rhizohAutoLabel: "Otomatik (önerilen)",
    rhizohMirrorLabel: "Uygulama diliyle aynı",
    rhizohManualLabel: "Konuşma dilini seç",
    rhizohFinishLabel: "Hukuki geçide devam"
  }),
  fi: Object.freeze({
    kicker: "KIELI",
    title: "Valitse kieli",
    lead: "Rhizoh käyttää tätä sovelluksessa, oikeudellisessa portissa ja keskustelussa.",
    continueLabel: "Jatka"
  }),
  fr: Object.freeze({
    kicker: "LANGUE",
    title: "Choisissez votre langue",
    lead: "Rhizoh l'utilisera pour l'application, le passage juridique et la conversation.",
    continueLabel: "Continuer"
  }),
  es: Object.freeze({
    kicker: "IDIOMA",
    title: "Elige tu idioma",
    lead: "Rhizoh lo usará en la app, la puerta legal y la conversación.",
    continueLabel: "Continuar"
  }),
  zh: Object.freeze({
    kicker: "语言",
    title: "选择语言",
    lead: "Rhizoh 将以此用于应用、法律门控与对话。",
    continueLabel: "继续"
  }),
  ja: Object.freeze({
    kicker: "言語",
    title: "言語を選択",
    lead: "Rhizoh はアプリ、法務ゲート、会話にこの言語を使います。",
    continueLabel: "続ける"
  })
});

/** @type {Record<string, object>} */
const LEGAL_COPY = Object.freeze({
  en: Object.freeze({
    kicker: "LEGAL GATE",
    title: "Access and consent",
    lead: "This is not registration or marketing. Before entering, read the documents and check each box separately.",
    dataController: formatDataControllerLineV0(),
    docsNote: LEGAL_DOCS_NOTE_EN,
    docLinks: Object.freeze({
      terms: "Terms of Use",
      privacy: "Privacy",
      kvkk: "KVKK Notice (TR)",
      ai: "AI Consent (TR)",
      cookies: "Cookies"
    }),
    checkboxes: Object.freeze({
      terms: "I have read and accept the Terms of Use.",
      kvkk: "I have read the Privacy Policy and KVKK notice; I consent to processing as described.",
      ai: "I understand AI features may use cross-border providers (OpenAI, Anthropic, Google, xAI) per the consent text."
    }),
    acceptLabel: "Accept and continue",
    docsLabel: "Full documents"
  }),
  tr: Object.freeze({
    kicker: "HUKUKİ GEÇİT",
    title: "Erişim ve onay",
    lead:
      "Bu ekran bir kayıt veya pazarlama akışı değildir. Hizmete geçmeden önce aşağıdaki metinleri okuyup ayrı onay kutularını işaretlemeniz gerekir.",
    dataController: formatDataControllerLineV0(),
    docsNote: null,
    docLinks: Object.freeze({
      terms: "Kullanım Şartları",
      privacy: "Gizlilik",
      kvkk: "KVKK Aydınlatma",
      ai: "Açık Rıza (AI)",
      cookies: "Çerezler"
    }),
    checkboxes: Object.freeze({
      terms: "Kullanım Şartları'nı okudum ve kabul ediyorum.",
      kvkk:
        "KVKK Aydınlatma Metni ve Gizlilik Politikası'nı okudum; kişisel verilerimin aydınlatmada belirtilen amaçlarla işlenmesini kabul ediyorum.",
      ai: "Yapay zekâ özelliklerinin yurtdışı sağlayıcılar üzerinden çalışabileceğini okudum; Açık Rıza metni kapsamında onay veriyorum."
    }),
    acceptLabel: "Onayla ve devam et",
    docsLabel: "Tam metinler"
  })
});

/** @type {Record<string, object>} */
const COHORT_COPY = Object.freeze({
  en: Object.freeze({
    kicker: "ACCESS",
    title: "Continue?",
    lead: "One-time access confirmation — not registration. No score or profile is created.",
    acceptLabel: "Yes, continue",
    declineLabel: "No",
    declineTitle: "Not continued",
    declineLead: "Access was not confirmed. Refresh to choose again."
  }),
  tr: Object.freeze({
    kicker: "ERİŞİM ONAYI",
    title: "Devam etmek istiyor musunuz?",
    lead:
      "Bu bir kayıt formu değildir; yalnızca tek seferlik erişim onayıdır. Skor veya profil oluşturulmaz.",
    acceptLabel: "Evet, devam et",
    declineLabel: "Hayır",
    declineTitle: "Devam edilmedi",
    declineLead: "Erişim onayı verilmedi. Sayfayı yenileyerek tekrar seçim yapabilirsiniz."
  }),
  fi: Object.freeze({
    kicker: "PÄÄSY",
    title: "Jatketaanko?",
    lead: "Kertaluonteinen pääsyn vahvistus — ei rekisteröitymistä.",
    acceptLabel: "Kyllä, jatka",
    declineLabel: "Ei",
    declineTitle: "Ei jatkettu",
    declineLead: "Pääsyä ei vahvistettu. Päivitä sivu valitaksesi uudelleen."
  }),
  fr: Object.freeze({
    kicker: "ACCÈS",
    title: "Continuer ?",
    lead: "Confirmation d'accès unique — pas d'inscription.",
    acceptLabel: "Oui, continuer",
    declineLabel: "Non",
    declineTitle: "Non poursuivi",
    declineLead: "Accès non confirmé. Actualisez pour choisir à nouveau."
  }),
  es: Object.freeze({
    kicker: "ACCESO",
    title: "¿Continuar?",
    lead: "Confirmación de acceso única — no es registro.",
    acceptLabel: "Sí, continuar",
    declineLabel: "No",
    declineTitle: "No continuado",
    declineLead: "Acceso no confirmado. Actualiza para elegir de nuevo."
  }),
  zh: Object.freeze({
    kicker: "访问",
    title: "是否继续？",
    lead: "一次性访问确认 — 非注册流程。",
    acceptLabel: "是，继续",
    declineLabel: "否",
    declineTitle: "未继续",
    declineLead: "未确认访问。请刷新后重选。"
  }),
  ja: Object.freeze({
    kicker: "アクセス",
    title: "続けますか？",
    lead: "一度きりのアクセス確認 — 登録ではありません。",
    acceptLabel: "はい、続ける",
    declineLabel: "いいえ",
    declineTitle: "続行しませんでした",
    declineLead: "アクセスが確認されませんでした。更新して再選択してください。"
  })
});

/**
 * @param {string} locale
 * @param {Record<string, object>} table
 */
function pickLocalePackV0(locale, table) {
  const loc = normalizeUiLocaleV0(locale);
  if (table[loc]) return table[loc];
  if (loc !== "tr" && table.en) return table.en;
  return table.tr || table.en;
}

/**
 * @param {string} [locale]
 */
export function getLanguagePickerCopyV0(locale) {
  return Object.freeze({
    ...pickLocalePackV0(locale ?? readUiLocaleV0(), LANGUAGE_PICKER_COPY),
    pickerSelfLocale: normalizeUiLocaleV0(locale ?? readUiLocaleV0())
  });
}

/**
 * @param {string} [locale]
 */
export function getLegalPreambleCopyForLocaleV0(locale) {
  const loc = normalizeUiLocaleV0(locale ?? readUiLocaleV0());
  const pack = pickLocalePackV0(loc, LEGAL_COPY);
  return Object.freeze({ ...pack, uiLocale: loc });
}

/**
 * @param {string} [locale]
 */
export function getClosedAdmissionCohortCopyForLocaleV0(locale) {
  return Object.freeze(pickLocalePackV0(locale ?? readUiLocaleV0(), COHORT_COPY));
}

/**
 * @param {string} kind
 * @param {string} [locale]
 */
export function getIngressErrorCopyForLocaleV0(kind = "unknown", locale) {
  const loc = normalizeUiLocaleV0(locale ?? readUiLocaleV0());
  const tr = loc === "tr";
  const base = Object.freeze({
    kicker: tr ? "BAĞLANTI" : "CONNECTION",
    retryLabel: tr ? "Yeniden dene" : "Retry"
  });
  const en = {
    offline: { title: "No internet connection", lead: "Rhizoh needs a network connection. Check and retry." },
    timeout: { title: "Response timed out", lead: "The server did not respond in time. Try again later." },
    gateway: { title: "Service temporarily unavailable", lead: "Gateway or edge service is unreachable. Retry when connection is restored." },
    unknown: { title: "Could not complete entry", lead: "Unexpected connection issue. Refresh or try later." }
  };
  const trMap = {
    offline: { title: "İnternet bağlantısı yok", lead: "Rhizoh'a devam etmek için ağ bağlantısı gerekir." },
    timeout: { title: "Yanıt süresi aşıldı", lead: "Sunucu zamanında yanıt vermedi." },
    gateway: { title: "Hizmet geçici olarak kapalı", lead: "Ağ geçidi şu an erişilemiyor." },
    unknown: { title: "Giriş tamamlanamadı", lead: "Beklenmeyen bir bağlantı sorunu oluştu." }
  };
  const part = (tr ? trMap : en)[kind] || (tr ? trMap.unknown : en.unknown);
  return Object.freeze({ ...base, ...part });
}

/**
 * @param {string} [locale]
 */
export function getClosedAdmissionHoldCopyForLocaleV0(locale) {
  const tr = normalizeUiLocaleV0(locale ?? readUiLocaleV0()) === "tr";
  return Object.freeze(
    tr
      ? {
          kicker: "BETA",
          title: "Erişim beklemede",
          lead: "Kapalı beta için operatör onayı veya yeniden deneme gerekir.",
          retryLabel: "Tekrar dene"
        }
      : {
          kicker: "BETA",
          title: "Access pending",
          lead: "Closed beta may require operator approval or retry.",
          retryLabel: "Retry"
        }
  );
}

/**
 * @param {string} [locale]
 */
export function getCookieConsentCopyForLocaleV0(locale) {
  const tr = normalizeUiLocaleV0(locale ?? readUiLocaleV0()) === "tr";
  return Object.freeze(
    tr
      ? {
          message: "Zorunlu çerezler çalışır. Analitik çerezler isteğe bağlıdır.",
          acceptAll: "Kabul et",
          necessaryOnly: "Yalnızca zorunlu"
        }
      : {
          message: "Necessary cookies always run. Analytics cookies are optional.",
          acceptAll: "Accept",
          necessaryOnly: "Necessary only"
        }
  );
}
