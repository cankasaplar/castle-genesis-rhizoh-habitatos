import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFounderCircleCopyV0 } from "../rhizoh/ingress/academyFounderLandingCopyV0.js";
import {
  buildFounderCircleMailtoV0,
  mountFounderCircleConsoleV0,
  recordFounderCircleInterestV0
} from "../rhizoh/ingress/founderCircleInterestV0.js";
import { INGRESS_SURFACE_V0 } from "../rhizoh/ingress/ingressFlowStylesV0.js";
import {
  readUiLocaleV0,
  subscribeUiLocaleV0,
  writeUiLocaleV0
} from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { recordVisitorSurfaceV0 } from "../rhizoh/ingress/visitorEpistemicTraceV0.js";

const cardStyle = {
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  background: "rgba(2,6,23,0.62)"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "rgba(2,6,23,0.8)",
  color: "#e2e8f0",
  padding: "10px 12px",
  fontSize: 14,
  marginBottom: 10
};

export const RhizohFounderCirclePageV0 = memo(function RhizohFounderCirclePageV0() {
  const [locale, setLocale] = useState(() => readUiLocaleV0() || "en");
  const tr = locale === "tr";
  const copy = useMemo(() => getFounderCircleCopyV0(tr ? "tr" : "en"), [tr]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeUiLocaleV0(() => setLocale(readUiLocaleV0() || "en")), []);

  useEffect(() => {
    mountFounderCircleConsoleV0();
    recordVisitorSurfaceV0("founder_circle");
  }, []);

  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setError("");
      try {
        recordFounderCircleInterestV0({
          email,
          note,
          locale: tr ? "tr" : "en",
          source: "founder_circle_page"
        });
        setSaved(true);
      } catch (err) {
        setSaved(false);
        setError(String(err?.message || "interest_failed"));
      }
    },
    [email, note, tr]
  );

  const mailHref = useMemo(
    () => buildFounderCircleMailtoV0({ locale: tr ? "tr" : "en" }),
    [tr]
  );

  return (
    <main style={INGRESS_SURFACE_V0.page} data-rhizoh-founder-circle="1">
      <p style={{ marginBottom: 16 }}>
        <Link to="/academy" style={INGRESS_SURFACE_V0.link}>
          {copy.backAcademy}
        </Link>
      </p>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>

      <section style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#7dd3fc" }}>
          {copy.price}
          <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.75 }}>{copy.pricePeriod}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>{copy.cap}</div>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.promiseTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65, opacity: 0.92 }}>
          {copy.promises.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{copy.notBuyingTitle}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65, opacity: 0.92 }}>
          {copy.notBuying.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{copy.interestTitle}</h2>
        <p style={{ margin: "0 0 14px", lineHeight: 1.6, opacity: 0.88, fontSize: 14 }}>
          {copy.interestBody}
        </p>
        <form onSubmit={onSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            style={inputStyle}
            autoComplete="email"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={copy.notePlaceholder}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" style={INGRESS_SURFACE_V0.primaryBtn(true)}>
              {copy.submitCta}
            </button>
            <a href={mailHref} style={{ ...INGRESS_SURFACE_V0.link, alignSelf: "center", fontSize: 14 }}>
              {copy.mailCta}
            </a>
          </div>
        </form>
        {saved ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "#86efac" }}>{copy.exportedNote}</p>
        ) : null}
        {error ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "#fca5a5" }}>{error}</p>
        ) : null}
      </section>

      <p style={{ fontSize: 12, opacity: 0.55, lineHeight: 1.5 }}>{copy.honestyNote}</p>
    </main>
  );
});
