import React, { useMemo, useState } from "react";
import {
  RHIZOH_UI_LAUNCH_LOCALES_V0,
  readUiLocaleV0,
  resolveLaunchLocaleLabelV0,
  writeUiLocaleV0
} from "../runtime/rhizohUiLocaleV0.js";
import {
  RHIZOH_SPEECH_MODE_V0,
  RHIZOH_SPEECH_WHEEL_LOCALES_V0,
  writeRhizohSpeechProfileV0
} from "../runtime/rhizohSpeechProfileV0.js";
import { resolveRhizohLanguageCatalogRowV0 } from "../runtime/rhizohMultilingualBridgeV0.js";
import {
  clearRhizohOutputLanguagePreferenceV0,
  writeRhizohOutputLanguagePreferenceV0
} from "../runtime/rhizohOutputLanguagePolicyV0.js";
import { getLanguagePickerCopyV0 } from "./ingressCopyI18nV0.js";
import {
  acknowledgeLegalAccessV0,
  getLegalDocumentPathsV0,
  getLegalPreambleCopyForLocaleV0,
  hasLegalAccessAckV0
} from "./ingress_router.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";
import { CookieConsentBanner } from "./CookieConsentBanner.jsx";

const sectionStyle = {
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 14,
  background: "rgba(2,6,23,0.62)"
};

const chipGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
  gap: 8
};

function pickButtonStyle(active) {
  return {
    ...INGRESS_SURFACE_V0.primaryBtn(active),
    background: active ? "#38bdf8" : "rgba(15,23,42,0.85)",
    color: active ? "#041018" : "#e2e8f0",
    border: active ? "none" : "1px solid #334155",
    textAlign: "left",
    padding: "10px 12px"
  };
}

/**
 * Single persistent entry surface: language + legal + optional identity.
 * @param {{ onProceed: () => void, specSha256?: string | null, legalRequired?: boolean }} props
 */
export function RhizohUnifiedEntryScreen({ onProceed, specSha256 = null, legalRequired = true }) {
  const [appLocale, setAppLocale] = useState(readUiLocaleV0());
  const [rhizohMode, setRhizohMode] = useState(RHIZOH_SPEECH_MODE_V0.AUTO);
  const [rhizohLocale, setRhizohLocale] = useState(appLocale === "tr" ? "tr" : "en");
  const [guestName, setGuestName] = useState("");
  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [legalCollapsed, setLegalCollapsed] = useState(!legalRequired || hasLegalAccessAckV0());

  const languageCopy = useMemo(() => getLanguagePickerCopyV0(appLocale), [appLocale]);
  const legalCopy = useMemo(() => getLegalPreambleCopyForLocaleV0(appLocale), [appLocale]);
  const docs = getLegalDocumentPathsV0();
  const legalAcked = hasLegalAccessAckV0();
  const legalReady = !legalRequired || legalAcked || (terms && kvkk && aiConsent);
  const tr = appLocale === "tr";

  const persistLanguage = () => {
    writeUiLocaleV0(appLocale);
    if (rhizohMode === RHIZOH_SPEECH_MODE_V0.MANUAL) {
      writeRhizohOutputLanguagePreferenceV0(rhizohLocale, "unified_entry_manual");
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MANUAL, manualLocale: rhizohLocale });
    } else if (rhizohMode === RHIZOH_SPEECH_MODE_V0.MIRROR_UI) {
      writeRhizohOutputLanguagePreferenceV0(appLocale, "unified_entry_mirror_ui");
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    } else {
      clearRhizohOutputLanguagePreferenceV0();
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.AUTO });
    }
    try {
      if (guestName.trim() && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("rhizoh.entry.guest_name.v1", guestName.trim().slice(0, 80));
      }
    } catch {
      /* noop */
    }
  };

  const proceed = () => {
    persistLanguage();
    if (legalRequired && !legalAcked) {
      acknowledgeLegalAccessV0({
        specSha256,
        acceptances: { terms, kvkkAydinlatma: kvkk, aiCrossBorderConsent: aiConsent }
      });
      setLegalCollapsed(true);
    }
    onProceed?.();
  };

  return (
    <>
      <div style={{ ...INGRESS_SURFACE_V0.page, maxWidth: 760 }}>
        <p style={INGRESS_SURFACE_V0.kicker}>{tr ? "RHIZOH GİRİŞ" : "RHIZOH ENTRY"}</p>
        <h1 style={INGRESS_SURFACE_V0.title}>{tr ? "Tek yüzeyden başla" : "Start from one surface"}</h1>
        <p style={INGRESS_SURFACE_V0.lead}>
          {tr
            ? "Dil, hukuki onay ve kimlik aynı ekranda kalır; sadece durum değişir."
            : "Language, legal consent, and identity stay on one screen; only state changes."}
        </p>

        <section style={sectionStyle} data-rhizoh-entry-section="language">
          <p style={INGRESS_SURFACE_V0.kicker}>{languageCopy.kicker}</p>
          <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{languageCopy.title}</h2>
          <p style={{ fontSize: 12, opacity: 0.7, margin: "0 0 12px" }}>
            {tr ? "UI dili butonları ve menüleri etkiler; Rhizoh cevap dili ayrı seçilir." : "UI language affects buttons and menus; Rhizoh response language is separate."}
          </p>
          <div style={chipGridStyle}>
            {RHIZOH_UI_LAUNCH_LOCALES_V0.map((code) => (
              <button
                key={code}
                type="button"
                style={pickButtonStyle(appLocale === code)}
                aria-pressed={appLocale === code}
                onClick={() => setAppLocale(code)}
              >
                <span style={{ display: "block", fontWeight: 700 }}>{resolveLaunchLocaleLabelV0(code)}</span>
                <span style={{ display: "block", fontSize: 10, opacity: 0.65 }}>{code}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={sectionStyle} data-rhizoh-entry-section="rhizoh-language">
          <p style={INGRESS_SURFACE_V0.kicker}>{tr ? "RHIZOH DİLİ" : "RHIZOH LANGUAGE"}</p>
          <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{tr ? "Rhizoh nasıl cevap versin?" : "How should Rhizoh respond?"}</h2>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            {[
              { id: RHIZOH_SPEECH_MODE_V0.AUTO, label: tr ? "Otomatik: kullanıcının son mesajını izle" : "Auto: follow the user's latest message" },
              { id: RHIZOH_SPEECH_MODE_V0.MIRROR_UI, label: tr ? "UI diliyle aynı" : "Same as UI language" },
              { id: RHIZOH_SPEECH_MODE_V0.MANUAL, label: tr ? "Manuel cevap dili seç" : "Choose response language" }
            ].map((row) => (
              <button
                key={row.id}
                type="button"
                style={pickButtonStyle(rhizohMode === row.id)}
                aria-pressed={rhizohMode === row.id}
                onClick={() => setRhizohMode(row.id)}
              >
                {row.label}
              </button>
            ))}
          </div>
          {rhizohMode === RHIZOH_SPEECH_MODE_V0.MANUAL ? (
            <div style={chipGridStyle}>
              {RHIZOH_SPEECH_WHEEL_LOCALES_V0.map((code) => (
                <button
                  key={code}
                  type="button"
                  style={pickButtonStyle(rhizohLocale === code)}
                  onClick={() => setRhizohLocale(code)}
                >
                  {resolveRhizohLanguageCatalogRowV0(code).label}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section style={{ ...sectionStyle, opacity: legalCollapsed ? 0.72 : 1 }} data-rhizoh-entry-section="legal">
          <button
            type="button"
            onClick={() => setLegalCollapsed((v) => !v)}
            style={{ ...INGRESS_SURFACE_V0.primaryBtn(false), width: "100%", justifyContent: "space-between" }}
          >
            {legalAcked || legalCollapsed ? (tr ? "Hukuki geçit kilitlendi" : "Legal gate locked") : legalCopy.title}
          </button>
          {!legalCollapsed ? (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 13, opacity: 0.82 }}>{legalCopy.lead}</p>
              <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12, fontSize: 12 }}>
                {[
                  [docs.terms, legalCopy.docLinks?.terms || "Terms"],
                  [docs.privacy, legalCopy.docLinks?.privacy || "Privacy"],
                  [docs.kvkk, legalCopy.docLinks?.kvkk || "KVKK"],
                  [docs.aiOpenConsent, legalCopy.docLinks?.ai || "AI consent"]
                ].map(([href, label]) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
                    {label}
                  </a>
                ))}
              </nav>
              {[
                ["terms", legalCopy.checkboxes.terms, terms, setTerms],
                ["kvkk", legalCopy.checkboxes.kvkk, kvkk, setKvkk],
                ["ai", legalCopy.checkboxes.ai, aiConsent, setAiConsent]
              ].map(([key, label, checked, setChecked]) => (
                <label key={key} style={{ display: "flex", gap: 10, fontSize: 12, lineHeight: 1.45, marginBottom: 8 }}>
                  <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : null}
        </section>

        <section style={sectionStyle} data-rhizoh-entry-section="identity">
          <p style={INGRESS_SURFACE_V0.kicker}>{tr ? "KİMLİK" : "IDENTITY"}</p>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={tr ? "İsim opsiyonel — misafir olarak devam edebilirsin" : "Name optional — continue as guest"}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "rgba(15,23,42,0.75)",
              color: "#e2e8f0",
              padding: "12px 14px"
            }}
          />
        </section>

        <button
          type="button"
          disabled={!legalReady}
          onClick={proceed}
          style={{ ...INGRESS_SURFACE_V0.primaryBtn(legalReady), width: "100%" }}
        >
          {tr ? "Rhizoh'a gir" : "Enter Rhizoh"}
        </button>
      </div>
      <CookieConsentBanner />
    </>
  );
}
