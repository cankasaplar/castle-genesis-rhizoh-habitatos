/**
 * Rhizoh ingress router v0.1 — legal preamble turnstile (rhizoh.com entry).
 *
 * Calm boundary screen before app shell — MANIFESTO_DISTRIBUTION_PACK tone, official legal refs.
 * @see docs/LEGAL_REALITY_SPEC_V0.1.md
 */

import {
  evaluateClosedAdmissionV0,
  getAdmittedSubjectReportV0,
  isSubjectAdmittedV0
} from "./closedUserAdmissionEngineV0.js";
import { formatDataControllerLineV0 } from "./legalEntityConstantsV0.js";

export const INGRESS_ROUTER_SCHEMA_V0 = "castle.rhizoh.ingress_router.v0";

/** Aligns with MANIFESTO_DISTRIBUTION_PACK_V0.1 checksum spine — not a legal contract by itself */
export const MANIFESTO_PACK_ACK_ID_V0 = "manifesto_distribution_pack_v0.1";

export const LEGAL_REALITY_SPEC_REF_V0 = "LEGAL_REALITY_SPEC_V0.1";

export const INGRESS_ROUTE_V0 = Object.freeze({
  LEGAL_PREAMBLE: "legal_preamble",
  COHORT: "cohort",
  HOLD: "hold",
  APP: "app",
  ERROR: "error"
});

const VALID_INGRESS_PHASES_V0 = Object.freeze([
  INGRESS_ROUTE_V0.LEGAL_PREAMBLE,
  INGRESS_ROUTE_V0.COHORT,
  INGRESS_ROUTE_V0.HOLD,
  INGRESS_ROUTE_V0.APP,
  INGRESS_ROUTE_V0.ERROR
]);

const STORAGE_KEY_V0 = "rhizoh_legal_access_ack_v0.2";
const COOKIE_CONSENT_KEY_V0 = "rhizoh_cookie_consent_v0.1";
const LEGAL_AUDIT_KEY_V0 = "rhizoh_legal_acceptance_audit_v0.1";
const LEGAL_AUDIT_MAX_V0 = 32;

export const LEGAL_ACCESS_ACK_SCHEMA_V0 = "castle.rhizoh.legal_access_ack.v0.2";
const CLOSED_ADMISSION_SUBJECT_KEY_V0 = "rhizoh_closed_admission_subject_ref_v0.1";
const CLOSED_ADMISSION_DONE_KEY_V0 = "rhizoh_closed_admission_done_v0.1";
/** UI decision gate only — not an admission engine input. */
const COHORT_GATE_DECISION_KEY_V0 = "rhizoh_cohort_gate_decision_v0.1";

export const COHORT_GATE_DECISION_V0 = Object.freeze({
  ACCEPTED: "accepted",
  DECLINED: "declined"
});

const LEGAL_DOC_PATHS_V0 = Object.freeze({
  terms: "/legal/terms-tr.html",
  privacy: "/legal/privacy-tr.html",
  kvkk: "/legal/kvkk-aydinlatma-tr.html",
  cookies: "/legal/cookies-tr.html",
  aiOpenConsent: "/legal/ai-open-consent-tr.html",
  spec: "/legal/legal-reality-spec.html"
});

export const LEGAL_DOC_VERSIONS_V0 = Object.freeze({
  terms: "v1.0",
  privacy: "v1.0",
  kvkk: "v1.0",
  cookies: "v1.0",
  aiOpenConsent: "v1.0"
});

/**
 * Production rhizoh.com or explicit env → preamble required unless acked.
 */
export function isLegalPreambleRequiredV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_LEGAL_PREAMBLE === "0") {
    return false;
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_LEGAL_PREAMBLE === "1") {
    return true;
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) {
    return true;
  }
  if (typeof window !== "undefined") {
    const host = String(window.location?.hostname || "").toLowerCase();
    if (host === "rhizoh.com" || host.endsWith(".rhizoh.com")) return true;
  }
  return false;
}

/**
 * Env flags — on/off only; does not alter runtime semantics.
 */
export function getIngressEnvFlagsV0() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : {};
  return Object.freeze({
    legalPreamble: env?.VITE_RHIZOH_LEGAL_PREAMBLE ?? null,
    closedAdmission: env?.VITE_RHIZOH_CLOSED_ADMISSION ?? null,
    closedAdmissionEnforce: env?.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE ?? null,
    prod: Boolean(env?.PROD)
  });
}

export function isClosedAdmissionEnabledV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_CLOSED_ADMISSION === "1") {
    return true;
  }
  return false;
}

export function isClosedAdmissionEnforcedV0() {
  return (
    isClosedAdmissionEnabledV0() &&
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE === "1"
  );
}

function getClosedAdmissionSubjectRefV0() {
  if (typeof sessionStorage === "undefined") return "session_anonymous";
  try {
    return sessionStorage.getItem(CLOSED_ADMISSION_SUBJECT_KEY_V0) || "session_anonymous";
  } catch {
    return "session_anonymous";
  }
}

export function ensureClosedAdmissionSubjectRefV0() {
  if (typeof sessionStorage === "undefined") return "session_anonymous";
  let ref = getClosedAdmissionSubjectRefV0();
  if (ref === "session_anonymous") {
    ref =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `subj_${crypto.randomUUID()}`
        : `subj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(CLOSED_ADMISSION_SUBJECT_KEY_V0, ref);
  }
  return ref;
}

export function hasClosedAdmissionSessionDoneV0() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CLOSED_ADMISSION_DONE_KEY_V0) === "1";
  } catch {
    return false;
  }
}

export function markClosedAdmissionSessionDoneV0() {
  if (typeof sessionStorage === "undefined") return false;
  sessionStorage.setItem(CLOSED_ADMISSION_DONE_KEY_V0, "1");
  return true;
}

export function getCohortGateDecisionV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem(COHORT_GATE_DECISION_KEY_V0);
    if (v === COHORT_GATE_DECISION_V0.ACCEPTED || v === COHORT_GATE_DECISION_V0.DECLINED) return v;
    return null;
  } catch {
    return null;
  }
}

export function isCohortGateAcceptedV0() {
  return getCohortGateDecisionV0() === COHORT_GATE_DECISION_V0.ACCEPTED;
}

/**
 * UI-only no-op evaluation hook — does NOT call admission engine or emit signals.
 * @param {{ decision: 'accepted' | 'declined' }} opts
 */
export function completeCohortGateNoOpV0(opts) {
  if (typeof sessionStorage === "undefined") return false;
  const decision =
    opts?.decision === COHORT_GATE_DECISION_V0.DECLINED
      ? COHORT_GATE_DECISION_V0.DECLINED
      : COHORT_GATE_DECISION_V0.ACCEPTED;
  sessionStorage.setItem(COHORT_GATE_DECISION_KEY_V0, decision);
  markClosedAdmissionSessionDoneV0();
  if (typeof window !== "undefined") {
    if (!window.__rhizoh) window.__rhizoh = {};
    window.__rhizoh.cohortGate = Object.freeze({
      hook: "no_op_evaluation",
      decision,
      engineOutputIgnored: true
    });
  }
  return true;
}

export function isClosedAdmissionCohortStepRequiredV0() {
  if (!isClosedAdmissionEnabledV0()) return false;
  if (!hasLegalPreambleAckV0()) return false;
  return getCohortGateDecisionV0() === null;
}

/**
 * Clears transient ingress/cohort session — preserves legal preamble ack.
 * Used on unknown phase / hard reset (no state carry).
 */
export function resetIngressTransientStateV0() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(CLOSED_ADMISSION_SUBJECT_KEY_V0);
  sessionStorage.removeItem(CLOSED_ADMISSION_DONE_KEY_V0);
  sessionStorage.removeItem(COHORT_GATE_DECISION_KEY_V0);
}

export function clearClosedAdmissionSessionForTestV0() {
  resetIngressTransientStateV0();
}

/**
 * Hard reset → ingress entry (legal ack kept). Returns fresh UI phase.
 */
export function hardResetIngressToEntryPhaseV0() {
  resetIngressTransientStateV0();
  return deriveIngressPhaseV0();
}

/**
 * Closed cohort metadata (interpretation-only). Does not grant IAM.
 * @returns {{ enabled: boolean, enforced: boolean, admitted: boolean, subjectRef: string, lastReport: object | null }}
 */
export function resolveClosedAdmissionStatusV0() {
  const enabled = isClosedAdmissionEnabledV0();
  const enforced = isClosedAdmissionEnforcedV0();
  const subjectRef = getClosedAdmissionSubjectRefV0();
  const admitted = enabled ? isCohortGateAcceptedV0() : true;
  return Object.freeze({
    enabled,
    enforced,
    admitted,
    subjectRef,
    cohortGate: getCohortGateDecisionV0(),
    lastReport: null
  });
}

/**
 * Harness / sim only — NOT the UI cohort path (UI uses completeCohortGateNoOpV0).
 * @param {{ signals?: Record<string, unknown>, riskFlags?: Record<string, boolean> }} [opts]
 */
export function evaluateClosedAdmissionForSessionV0(opts = {}) {
  const subjectRef = ensureClosedAdmissionSubjectRefV0();
  const report = evaluateClosedAdmissionV0({
    subjectRef,
    signals: opts.signals || {},
    riskFlags: opts.riskFlags || {},
    invite: opts.invite
  });
  if (typeof window !== "undefined") {
    if (!window.__rhizoh) window.__rhizoh = {};
    window.__rhizoh.closedAdmission = report;
  }
  return report;
}

function parseLegalAccessAckV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasLegalAccessAckV0() {
  const parsed = parseLegalAccessAckV0();
  if (!parsed || parsed.schema !== LEGAL_ACCESS_ACK_SCHEMA_V0) return false;
  const a = parsed.acceptances;
  if (!Boolean(a?.terms && a?.kvkkAydinlatma && a?.aiCrossBorderConsent)) return false;
  const stored = parsed.docVersions || {};
  for (const [key, version] of Object.entries(LEGAL_DOC_VERSIONS_V0)) {
    if (stored[key] !== version) return false;
  }
  return true;
}

/** @deprecated alias */
export function hasLegalPreambleAckV0() {
  return hasLegalAccessAckV0();
}

/**
 * Safe phase — unknown → hard reset (no transient state carry) → fresh entry phase.
 * Fallback never advances cohort/admission engine state.
 * @param {string | null | undefined} phase
 */
export function normalizeIngressPhaseV0(phase) {
  if (phase && VALID_INGRESS_PHASES_V0.includes(phase)) return phase;
  return hardResetIngressToEntryPhaseV0();
}

/**
 * UI phase for RhizohIngressFlow (not an execution route).
 */
export function deriveIngressPhaseV0() {
  const ingress = resolveIngressRouteV0();
  if (ingress.route === INGRESS_ROUTE_V0.LEGAL_PREAMBLE) return INGRESS_ROUTE_V0.LEGAL_PREAMBLE;
  if (ingress.route === "closed_admission_hold") return INGRESS_ROUTE_V0.HOLD;
  if (isClosedAdmissionCohortStepRequiredV0()) return INGRESS_ROUTE_V0.COHORT;
  return INGRESS_ROUTE_V0.APP;
}

export function resolveIngressRouteV0() {
  const required = isLegalPreambleRequiredV0();
  const acked = hasLegalPreambleAckV0();
  const closed = resolveClosedAdmissionStatusV0();
  const fallbackRoute = required ? INGRESS_ROUTE_V0.LEGAL_PREAMBLE : INGRESS_ROUTE_V0.APP;

  let route = required && !acked ? INGRESS_ROUTE_V0.LEGAL_PREAMBLE : INGRESS_ROUTE_V0.APP;
  if (route === INGRESS_ROUTE_V0.APP && closed.enforced && !closed.admitted) {
    route = "closed_admission_hold";
  }

  return Object.freeze({
    schema: INGRESS_ROUTER_SCHEMA_V0,
    route,
    fallbackRoute,
    fallbackCarriesState: false,
    required,
    acked,
    legalDocs: LEGAL_DOC_PATHS_V0,
    closedAdmission: closed,
    env: getIngressEnvFlagsV0()
  });
}

function appendLegalAcceptanceAuditV0(record) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LEGAL_AUDIT_KEY_V0);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...list, record] : [record];
    while (next.length > LEGAL_AUDIT_MAX_V0) next.shift();
    localStorage.setItem(LEGAL_AUDIT_KEY_V0, JSON.stringify(next));
  } catch {
    /* audit best-effort */
  }
}

export const LEGAL_REALITY_SPEC_SHA256_V0 =
  "5dbeb7ee93e8b3ff40be73d569f93c9cec73eee37a7a3535205d87883a885972";

/**
 * @param {{ specSha256?: string | null, acceptances: { terms: boolean, kvkkAydinlatma: boolean, aiCrossBorderConsent: boolean } }} opts
 */
export function acknowledgeLegalAccessV0(opts = {}) {
  if (typeof sessionStorage === "undefined") return false;
  const atMs = Date.now();
  const payload = Object.freeze({
    schema: LEGAL_ACCESS_ACK_SCHEMA_V0,
    ackId: MANIFESTO_PACK_ACK_ID_V0,
    specRef: LEGAL_REALITY_SPEC_REF_V0,
    specSha256: opts.specSha256 ?? null,
    atMs,
    acceptances: Object.freeze({
      terms: Boolean(opts.acceptances?.terms),
      kvkkAydinlatma: Boolean(opts.acceptances?.kvkkAydinlatma),
      aiCrossBorderConsent: Boolean(opts.acceptances?.aiCrossBorderConsent)
    }),
    docVersions: LEGAL_DOC_VERSIONS_V0,
    host: typeof window !== "undefined" ? window.location?.hostname ?? null : null
  });
  sessionStorage.setItem(STORAGE_KEY_V0, JSON.stringify(payload));
  appendLegalAcceptanceAuditV0(payload);
  if (typeof window !== "undefined") {
    if (!window.__rhizoh) window.__rhizoh = {};
    window.__rhizoh_ingress_ack = payload;
    window.__rhizoh_legal_acceptance_audit = getLegalAcceptanceAuditV0();
  }
  return true;
}

/**
 * @param {{ specSha256?: string | null, acceptances?: object }} [opts]
 */
export function acknowledgeLegalPreambleV0(opts = {}) {
  return acknowledgeLegalAccessV0({
    specSha256: opts.specSha256,
    acceptances: opts.acceptances ?? {
      terms: true,
      kvkkAydinlatma: true,
      aiCrossBorderConsent: true
    }
  });
}

export function getLegalAcceptanceAuditV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGAL_AUDIT_KEY_V0);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function clearLegalAcceptanceAuditForTestV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LEGAL_AUDIT_KEY_V0);
  }
}

export function getCookieConsentV0() {
  if (typeof localStorage === "undefined") {
    return Object.freeze({ necessary: true, analytics: false, decided: false });
  }
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY_V0);
    if (!raw) return Object.freeze({ necessary: true, analytics: false, decided: false });
    const p = JSON.parse(raw);
    return Object.freeze({
      necessary: true,
      analytics: Boolean(p.analytics),
      decided: true,
      atMs: p.atMs ?? null
    });
  } catch {
    return Object.freeze({ necessary: true, analytics: false, decided: false });
  }
}

/**
 * @param {{ analytics?: boolean }} opts — default analytics false
 */
export function setCookieConsentV0(opts = {}) {
  if (typeof localStorage === "undefined") return false;
  const payload = Object.freeze({
    schema: "castle.rhizoh.cookie_consent.v0.1",
    necessary: true,
    analytics: Boolean(opts.analytics),
    atMs: Date.now()
  });
  localStorage.setItem(COOKIE_CONSENT_KEY_V0, JSON.stringify(payload));
  return true;
}

export function clearCookieConsentForTestV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(COOKIE_CONSENT_KEY_V0);
  }
}

export function clearLegalPreambleAckForTestV0() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY_V0);
  }
  clearLegalAcceptanceAuditForTestV0();
  clearCookieConsentForTestV0();
}

export function getLegalDocumentPathsV0() {
  return LEGAL_DOC_PATHS_V0;
}

export function getIngressErrorCopyV0(kind = "unknown") {
  const base = Object.freeze({
    kicker: "BAĞLANTI",
    retryLabel: "Yeniden dene"
  });
  const byKind = {
    offline: Object.freeze({
      title: "İnternet bağlantısı yok",
      lead: "Rhizoh’a devam etmek için ağ bağlantısı gerekir. Bağlantınızı kontrol edip tekrar deneyin."
    }),
    timeout: Object.freeze({
      title: "Yanıt süresi aşıldı",
      lead: "Sunucu zamanında yanıt vermedi. Lütfen bir süre sonra tekrar deneyin."
    }),
    gateway: Object.freeze({
      title: "Hizmet geçici olarak kapalı",
      lead: "Ağ geçidi veya kenar hizmeti şu an erişilemiyor. Bu bir yürütme hatası değildir; bağlantı düzelince tekrar deneyin."
    }),
    unknown: Object.freeze({
      title: "Giriş tamamlanamadı",
      lead: "Beklenmeyen bir bağlantı sorunu oluştu. Sayfayı yenileyin veya daha sonra tekrar deneyin."
    })
  };
  const part = byKind[kind] || byKind.unknown;
  return Object.freeze({ ...base, ...part });
}

export function getClosedAdmissionCohortCopyV0() {
  return Object.freeze({
    kicker: "ERİŞİM ONAYI",
    title: "Devam etmek istiyor musunuz?",
    lead:
      "Bu bir kayıt veya onboarding formu değildir; yalnızca tek seferlik erişim onayıdır. Skor veya profil oluşturulmaz.",
    acceptLabel: "Evet, devam et",
    declineLabel: "Hayır",
    declineTitle: "Devam edilmedi",
    declineLead: "Erişim onayı verilmedi. Sayfayı yenileyerek tekrar seçim yapabilirsiniz."
  });
}

export function getClosedAdmissionHoldCopyV0() {
  return Object.freeze({
    kicker: "BETA",
    title: "Erişim beklemede",
    lead: "Kapalı beta için operatör onayı veya yeniden deneme gerekir.",
    retryLabel: "Tekrar dene"
  });
}

export function getLegalPreambleCopyV0() {
  return Object.freeze({
    kicker: "HUKUKİ GEÇİT",
    title: "Erişim ve onay",
    lead:
      "Bu ekran bir kayıt veya pazarlama akışı değildir. Hizmete geçmeden önce aşağıdaki metinleri okuyup ayrı onay kutularını işaretlemeniz gerekir.",
    dataController: formatDataControllerLineV0(),
    checkboxes: Object.freeze({
      terms:
        "Kullanım Şartları’nı okudum ve kabul ediyorum.",
      kvkk:
        "KVKK Aydınlatma Metni ve Gizlilik Politikası’nı okudum; kişisel verilerimin aydınlatmada belirtilen amaçlarla işlenmesini kabul ediyorum.",
      ai:
        "Yapay zekâ özelliklerinin ileride yurtdışındaki potansiyel sağlayıcılar (ör. OpenAI, Anthropic, Google, xAI) üzerinden çalışabileceğini okudum; Açık Rıza metni kapsamında onay veriyorum."
    }),
    acceptLabel: "Onayla ve devam et",
    docsLabel: "Tam metinler"
  });
}
