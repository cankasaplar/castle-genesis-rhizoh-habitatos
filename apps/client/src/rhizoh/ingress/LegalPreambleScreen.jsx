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
            {copy.docLinks?.terms || "Terms"}
          </a>
          <a href={docs.privacy} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            {copy.docLinks?.privacy || "Privacy"}
          </a>
          <a href={docs.kvkk} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            {copy.docLinks?.kvkk || "KVKK"}
          </a>
          <a href={docs.aiOpenConsent} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            {copy.docLinks?.ai || "AI consent"}
          </a>
          <a href={docs.cookies} target="_blank" rel="noopener noreferrer" style={INGRESS_SURFACE_V0.link}>
            {copy.docLinks?.cookies || "Cookies"}
          </a>
        </nav>
        {copy.docsNote ? (
          <p style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.75, margin: "0 0 16px" }}>{copy.docsNote}</p>
        ) : null}
        {copy.observability ? (
          <section
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(148, 163, 184, 0.25)",
              background: "rgba(15, 23, 42, 0.45)"
            }}
          >
            <p style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.75, margin: "0 0 8px", textTransform: "uppercase" }}>
              {copy.observability.title}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.55, opacity: 0.88 }}>
              {copy.observability.bullets.map((line) => (
                <li key={line} style={{ marginBottom: 6 }}>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {copy.desktopOs ? (
          <section
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(34, 211, 238, 0.35)",
              background: "rgba(6, 182, 212, 0.08)"
            }}
          >
            <p style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.75, margin: "0 0 6px", textTransform: "uppercase" }}>
              {copy.desktopOs.title}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, margin: "0 0 10px" }}>{copy.desktopOs.lead}</p>
            <a
              href={copy.desktopOs.downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...INGRESS_SURFACE_V0.link, fontSize: 13, fontWeight: 600 }}
            >
              {copy.desktopOs.downloadLabel}
            </a>
          </section>
        ) : null}
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
