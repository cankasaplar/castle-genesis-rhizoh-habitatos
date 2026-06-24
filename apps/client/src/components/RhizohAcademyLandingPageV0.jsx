import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAcademyLandingCopyV0 } from "../rhizoh/ingress/academyFounderLandingCopyV0.js";
import { INGRESS_SURFACE_V0 } from "../rhizoh/ingress/ingressFlowStylesV0.js";
import {
  readUiLocaleV0,
  subscribeUiLocaleV0,
  writeUiLocaleV0
} from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { recordVisitorSurfaceV0 } from "../rhizoh/ingress/visitorEpistemicTraceV0.js";
import { runDomainGateForPathV0 } from "../rhizoh/runtime/rhizohDomainNervousSystemV0.js";

const cardStyle = {
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  background: "rgba(2,6,23,0.62)"
};

const badgeStyle = {
  display: "inline-block",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(56,189,248,0.35)",
  color: "#7dd3fc",
  marginBottom: 12
};

function LocaleToggle({ locale, onPick }) {
  const pill = (code) => ({
    border: "1px solid rgba(148,163,184,0.25)",
    background: locale === code ? "rgba(56,189,248,0.2)" : "transparent",
    color: locale === code ? "#e0f2fe" : "#94a3b8",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer"
  });
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      <button type="button" style={pill("en")} onClick={() => onPick("en")}>
        EN
      </button>
      <button type="button" style={pill("tr")} onClick={() => onPick("tr")}>
        TR
      </button>
    </div>
  );
}

export const RhizohAcademyLandingPageV0 = memo(function RhizohAcademyLandingPageV0() {
  const [locale, setLocale] = useState(() => readUiLocaleV0() || "en");
  const tr = locale === "tr";
  const copy = useMemo(() => getAcademyLandingCopyV0(tr ? "tr" : "en"), [tr]);

  useEffect(() => subscribeUiLocaleV0(() => setLocale(readUiLocaleV0() || "en")), []);

  useEffect(() => {
    recordVisitorSurfaceV0("academy_landing");
    try {
      runDomainGateForPathV0("/academy", { coreOnly: true });
    } catch {
      /* optional on first paint */
    }
  }, []);

  const onPickLocale = useCallback((code) => {
    setLocale(writeUiLocaleV0(code));
  }, []);

  return (
    <main style={INGRESS_SURFACE_V0.page} data-rhizoh-academy-landing="1">
      <LocaleToggle locale={locale} onPick={onPickLocale} />
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.whatIsTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65, opacity: 0.92 }}>
          {copy.whatIs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.whatIsNotTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65, opacity: 0.92 }}>
          {copy.whatIsNot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <span style={badgeStyle}>{copy.stageBadge}</span>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.stageTitle}</h2>
        <p style={{ margin: 0, lineHeight: 1.65, opacity: 0.9 }}>{copy.stageBody}</p>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.evidenceTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65, opacity: 0.92 }}>
          {copy.evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.paperTitle}</h2>
        <p style={{ margin: "0 0 12px", lineHeight: 1.6, opacity: 0.9 }}>{copy.paperBody}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <a href={copy.paperHref} style={INGRESS_SURFACE_V0.link} download>
            {copy.paperCta}
          </a>
          <a href={copy.paperHtmlHref} style={INGRESS_SURFACE_V0.link} target="_blank" rel="noopener noreferrer">
            {copy.paperReadCta}
          </a>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>
          {copy.paperConsoleHint}
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.roadmapTitle}</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {copy.roadmap.map((row) => (
            <li
              key={row.item}
              style={{
                display: "grid",
                gridTemplateColumns: "88px 1fr",
                gap: 10,
                padding: "8px 0",
                borderTop: "1px solid rgba(148,163,184,0.12)"
              }}
            >
              <span style={{ fontSize: 11, letterSpacing: "0.06em", opacity: 0.65, textTransform: "uppercase" }}>
                {row.phase}
              </span>
              <span style={{ lineHeight: 1.55, opacity: 0.92 }}>{row.item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{copy.linksTitle}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link to="/founder-circle" style={INGRESS_SURFACE_V0.link}>
            {copy.founderCircleCta}
          </Link>
          <Link to="/academy/observe" style={INGRESS_SURFACE_V0.link}>
            {copy.observeCta}
          </Link>
          <Link to="/academy/research" style={INGRESS_SURFACE_V0.link}>
            {copy.researchCta}
          </Link>
          <Link to="/" style={INGRESS_SURFACE_V0.link}>
            {copy.shellCta}
          </Link>
        </div>
      </section>

      <p style={{ fontSize: 12, opacity: 0.55, marginTop: 8, lineHeight: 1.5 }}>{copy.honestyNote}</p>
    </main>
  );
});
