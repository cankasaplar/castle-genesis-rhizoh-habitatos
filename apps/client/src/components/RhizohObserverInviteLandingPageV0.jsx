import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildObserverInviteLandingBundleV0,
  dispatchObserverInviteProceedV0,
  normalizeObserverInviteLangV0,
  OBSERVER_INVITE_LANDING_LOCALES_V0,
  parseObserverInviteFromSearchV0,
  persistObserverInviteContextV0
} from "../rhizoh/ingress/observerInviteLandingV0.js";
import { resolveInvitePerceptionLensV0 } from "../rhizoh/ingress/observerInvitePerceptionLensV0.js";
import {
  getMeaningLayerSurfacesV0,
  getWhyAmIHerePanelV0
} from "../rhizoh/ingress/observerInviteMeaningLayerV0.js";
import { recordVisitorSurfaceV0 } from "../rhizoh/ingress/visitorEpistemicTraceV0.js";
import { INGRESS_SURFACE_V0 } from "../rhizoh/ingress/ingressFlowStylesV0.js";
import {
  readUiLocaleV0,
  subscribeUiLocaleV0,
  writeUiLocaleV0
} from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { runDomainGateForPathV0 } from "../rhizoh/runtime/rhizohDomainNervousSystemV0.js";
import { requestEarlyWorldMapGeoBootstrapV0 } from "../rhizoh/runtime/worldMapEarlyGeoBootstrapV0.js";

const cardStyle = {
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  background: "rgba(2,6,23,0.62)"
};

const expectationBannerStyle = {
  ...cardStyle,
  borderColor: "rgba(56,189,248,0.35)",
  background: "rgba(8,47,73,0.45)"
};

function readInviteLandingLocaleV0(searchParams) {
  const fromUrl = normalizeObserverInviteLangV0(searchParams.get("lang"));
  if (fromUrl) return fromUrl;
  const stored = readUiLocaleV0();
  return OBSERVER_INVITE_LANDING_LOCALES_V0.includes(stored) ? stored : "en";
}

export const RhizohObserverInviteLandingPageV0 = memo(function RhizohObserverInviteLandingPageV0() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocale] = useState(() => readInviteLandingLocaleV0(searchParams));
  const tr = locale === "tr";
  const [bundle, setBundle] = useState(null);

  const invite = useMemo(
    () => parseObserverInviteFromSearchV0(searchParams),
    [searchParams]
  );

  useEffect(() => subscribeUiLocaleV0(() => setLocale(readInviteLandingLocaleV0(searchParams))), [searchParams]);

  useEffect(() => {
    const fromUrl = normalizeObserverInviteLangV0(searchParams.get("lang"));
    if (!fromUrl) return;
    if (fromUrl !== readUiLocaleV0()) {
      writeUiLocaleV0(fromUrl);
    }
    setLocale(fromUrl);
  }, [searchParams]);

  const onPickLocale = useCallback(
    (code) => {
      const next = writeUiLocaleV0(code);
      setLocale(next);
      const params = new URLSearchParams(searchParams);
      params.set("lang", next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const role = invite?.role || "observer";
  const lens = useMemo(
    () => resolveInvitePerceptionLensV0(role, tr ? "tr" : "en"),
    [role, tr]
  );
  const copy = lens.copy;
  const panels = lens.panels;
  const whyHere = useMemo(() => getWhyAmIHerePanelV0(tr ? "tr" : "en"), [tr]);
  const meaningLayer = useMemo(() => getMeaningLayerSurfacesV0(tr ? "tr" : "en"), [tr]);

  useEffect(() => {
    if (invite) persistObserverInviteContextV0(invite);
    try {
      runDomainGateForPathV0("/invite", { coreOnly: true });
    } catch {
      /* nervous system optional on first paint */
    }
    const next = buildObserverInviteLandingBundleV0(invite, tr ? "tr" : "en");
    setBundle(next);
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.invitePerceptionLens = next.perceptionLens;
    }
  }, [invite, tr]);

  const onEnter = useCallback(() => {
    if (invite) {
      persistObserverInviteContextV0({ ...invite, perceptionMode: lens.mode });
    }
    recordVisitorSurfaceV0("invite");
    dispatchObserverInviteProceedV0({ invite, target: "/", perceptionMode: lens.mode });
    void requestEarlyWorldMapGeoBootstrapV0({ source: "invite_landing_cta" });
    navigate("/");
  }, [invite, lens.mode, navigate]);

  const manifest = bundle?.manifest;
  const timeline = bundle?.causalTimeline?.timeline || [];
  const subjectId = manifest?.subjectId || (tr ? "bağlı değil" : "unbound");

  return (
    <div style={INGRESS_SURFACE_V0.page} data-rhizoh-observer-invite-landing="1" data-perception-mode={lens.mode}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {OBSERVER_INVITE_LANDING_LOCALES_V0.map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onPickLocale(code)}
              style={{
                ...INGRESS_SURFACE_V0.primaryBtn(active),
                background: active ? "#38bdf8" : "rgba(15,23,42,0.85)",
                color: active ? "#041018" : "#e2e8f0",
                border: active ? "none" : "1px solid #334155",
                padding: "8px 14px",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}
              aria-pressed={active}
            >
              {code === "tr" ? "Türkçe" : "English"}
            </button>
          );
        })}
      </div>

      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>

      <div style={{ ...expectationBannerStyle, borderColor: "rgba(167,139,250,0.4)" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.75, margin: "0 0 8px" }}>
          {whyHere.title.toUpperCase()}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 8px", fontWeight: 500 }}>{whyHere.body}</p>
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px", opacity: 0.85, fontStyle: "italic" }}>
          {whyHere.axiom}
        </p>
        <p style={{ fontSize: 11, opacity: 0.55, margin: 0 }}>{whyHere.footnote}</p>
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 10px" }}>
          {meaningLayer.title.toUpperCase()}
        </p>
        {meaningLayer.surfaces.map((surface) => (
          <div key={surface.id} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              {surface.label} — <span style={{ opacity: 0.75, fontWeight: 500 }}>{surface.role}</span>
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>{surface.description}</p>
          </div>
        ))}
      </div>

      {panels.showExpectationBanner ? (
        <div style={expectationBannerStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.7, margin: "0 0 8px" }}>
            {copy.sectionExpectation}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{copy.expectation}</p>
        </div>
      ) : null}

      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>

      {invite ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.7, margin: "0 0 8px" }}>
            {copy.sectionInvite} · {invite.inviteToken?.slice(0, 32)}
            {invite.inviteToken?.length > 32 ? "…" : ""}
          </p>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>
            {copy.perceptionModeLabel}: <strong>{copy.perceptionModeName}</strong>
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
            {tr
              ? "Davet kodu bulunamadı. Kaptan size özel bir bağlantı göndermeli."
              : "No invite code found. You need a personal link from the host."}
          </p>
        </div>
      )}

      {panels.showActivities ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 10px" }}>
            {copy.sectionActivities}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, opacity: 0.9 }}>
            {copy.activities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {panels.showInfrastructureSummary ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
            {copy.sectionInfrastructure}
          </p>
          <p style={{ fontSize: 13, margin: "0 0 6px" }}>
            {bundle?.causalTimeline?.nodeCount ?? 0} {copy.eventNodesLabel} ·{" "}
            {bundle?.causalTimeline?.edgeCount ?? 0} {copy.causalEdgesLabel}
          </p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{copy.infrastructureReplay}</p>
        </div>
      ) : null}

      {panels.showEpistemicSubject ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
            {copy.sectionEpistemicSubject}
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", fontFamily: "monospace" }}>
            {subjectId}
          </p>
          {manifest?.epistemicSubject ? (
            <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
              repro={manifest.epistemicSubject.reproConsistent ? "ok" : "drift"} · chain=
              {manifest.epistemicSubject.fingerprintChainLength}
            </p>
          ) : (
            <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
              {tr ? "Denetim paketi henüz çalıştırılmadı." : "Audit bundle not run yet."}
            </p>
          )}
        </div>
      ) : null}

      {panels.showCausalTimeline ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
            {copy.sectionCausalTimeline}
          </p>
          <div style={{ maxHeight: 220, overflowY: "auto", fontSize: 11, fontFamily: "monospace" }}>
            {timeline.length ? (
              timeline.map((row) => (
                <div
                  key={row.id}
                  style={{ padding: "6px 0", borderBottom: "1px solid rgba(148,163,184,0.12)" }}
                >
                  <span style={{ opacity: 0.55 }}>
                    {row.atMs ? new Date(row.atMs).toISOString().slice(11, 19) : "—"}
                  </span>
                  {" · "}
                  <span style={{ color: "#a5f3fc" }}>{row.kind}</span>
                  {" · "}
                  {row.label}
                </div>
              ))
            ) : (
              <p style={{ opacity: 0.5, margin: 0 }}>
                {tr ? "Henüz nedensel iz yok." : "No causal trail yet."}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
        <button type="button" style={INGRESS_SURFACE_V0.primaryBtn(true)} onClick={onEnter}>
          {copy.cta}
        </button>
        {lens.mode === "research" ? (
          <a href="/academy/observe" style={{ ...INGRESS_SURFACE_V0.link, fontSize: 14, alignSelf: "center" }}>
            {tr ? "Akademik gözlem merkezi" : "Academic observatory"}
          </a>
        ) : null}
      </div>

      <p style={{ fontSize: 11, opacity: 0.45, marginTop: 20, lineHeight: 1.5 }}>
        Observation ≠ Execution · {tr ? "Aynı sistem, farklı algı merceği" : "Same system, different epistemic lens"}
      </p>
    </div>
  );
});

RhizohObserverInviteLandingPageV0.displayName = "RhizohObserverInviteLandingPageV0";
