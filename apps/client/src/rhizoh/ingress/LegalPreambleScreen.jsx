import React, { useState } from "react";
import {
  acknowledgeLegalAccessV0,
  getLegalDocumentPathsV0,
  getLegalPreambleCopyV0
} from "./ingress_router.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";
import { CookieConsentBanner } from "./CookieConsentBanner.jsx";

const checkboxStyle = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  fontSize: 13,
  lineHeight: 1.5,
  cursor: "pointer",
  marginBottom: 12
};

/**
 * Access consent layer — separate checkboxes, audit timestamp on accept.
 * @param {{ onProceed: () => void, specSha256?: string | null }} props
 */
export function LegalPreambleScreen({ onProceed, specSha256 = null }) {
  const copy = getLegalPreambleCopyV0();
  const docs = getLegalDocumentPathsV0();
  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);

  const canProceed = terms && kvkk && aiConsent;

  return (
    <>
      <div style={INGRESS_SURFACE_V0.page}>
        <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
        <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
        <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>
        <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, margin: "0 0 16px" }}>
          {copy.dataController}
        </p>
        <p style={{ fontSize: 12, letterSpacing: "0.06em", opacity: 0.7, margin: "0 0 8px" }}>
          {copy.docsLabel}
        </p>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, fontSize: 13 }}>
          <a href={docs.terms} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            Kullanım Şartları
          </a>
          <a href={docs.privacy} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            Gizlilik
          </a>
          <a href={docs.kvkk} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            KVKK Aydınlatma
          </a>
          <a href={docs.aiOpenConsent} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            Açık Rıza (AI)
          </a>
          <a href={docs.cookies} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            Çerezler
          </a>
        </nav>
        <label style={checkboxStyle}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 4 }} />
          <span>{copy.checkboxes.terms}</span>
        </label>
        <label style={checkboxStyle}>
          <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} style={{ marginTop: 4 }} />
          <span>{copy.checkboxes.kvkk}</span>
        </label>
        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(e) => setAiConsent(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>{copy.checkboxes.ai}</span>
        </label>
        <button
          type="button"
          disabled={!canProceed}
          onClick={() => {
            acknowledgeLegalAccessV0({
              specSha256,
              acceptances: { terms, kvkkAydinlatma: kvkk, aiCrossBorderConsent: aiConsent }
            });
            onProceed();
          }}
          style={{ ...INGRESS_SURFACE_V0.primaryBtn(canProceed), marginTop: 8 }}
        >
          {copy.acceptLabel}
        </button>
      </div>
      <CookieConsentBanner />
    </>
  );
}
