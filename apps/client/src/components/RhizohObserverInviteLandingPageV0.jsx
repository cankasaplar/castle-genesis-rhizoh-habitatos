import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildObserverInviteLandingBundleV0,
  dispatchObserverInviteProceedV0,
  parseObserverInviteFromSearchV0,
  persistObserverInviteContextV0
} from "../rhizoh/ingress/observerInviteLandingV0.js";
import { resolveInvitePerceptionLensV0 } from "../rhizoh/ingress/observerInvitePerceptionLensV0.js";
import { INGRESS_SURFACE_V0 } from "../rhizoh/ingress/ingressFlowStylesV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { runDomainGateForPathV0 } from "../rhizoh/runtime/rhizohDomainNervousSystemV0.js";

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

export const RhizohObserverInviteLandingPageV0 = memo(function RhizohObserverInviteLandingPageV0() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locale = readUiLocaleV0();
  const tr = locale === "tr";
  const [bundle, setBundle] = useState(null);

  const invite = useMemo(
    () => parseObserverInviteFromSearchV0(searchParams),
    [searchParams]
  );

  const role = invite?.role || "observer";
  const lens = useMemo(
    () => bundle?.perceptionLens || resolveInvitePerceptionLensV0(role, tr ? "tr" : "en"),
    [bundle?.perceptionLens, role, tr]
  );
  const copy = lens.copy;
  const panels = lens.panels;

  useEffect(() => {
    if (invite) persistObserverInviteContextV0(invite);
    try {
      runDomainGateForPathV0("/invite", { coreOnly: true });
    } catch {
      /* nervous system optional on first paint */
    }
    const next = buildObserverInviteLandingBundleV0(invite);
    setBundle(next);
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.invitePerceptionLens = next.perceptionLens;
    }
  }, [invite]);

  const onEnter = useCallback(() => {
    if (invite) persistObserverInviteContextV0(invite);
    dispatchObserverInviteProceedV0({ invite, target: "/world/space", perceptionMode: lens.mode });
    navigate("/world/space");
  }, [invite, lens.mode, navigate]);

  const manifest = bundle?.manifest;
  const timeline = bundle?.causalTimeline?.timeline || [];
  const subjectId = manifest?.subjectId || "unbound";

  return (
    <div style={INGRESS_SURFACE_V0.page} data-rhizoh-observer-invite-landing="1" data-perception-mode={lens.mode}>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>

      {panels.showExpectationBanner ? (
        <div style={expectationBannerStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.7, margin: "0 0 8px" }}>
            {tr ? "BEKLENTİ" : "EXPECTATION"}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{copy.expectation}</p>
        </div>
      ) : null}

      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>

      {invite ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.7, margin: "0 0 8px" }}>
            INVITE · {invite.inviteToken?.slice(0, 32)}
            {invite.inviteToken?.length > 32 ? "…" : ""}
          </p>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>
            {tr ? "Algı modu" : "Perception mode"}: <strong>{lens.mode}</strong>
            {invite.legacyCohort ? ` · reviewer:${invite.reviewerId || invite.inviteToken}` : ""}
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
            {tr
              ? "Davet token'ı bulunamadı. Kaptan size özel bir bağlantı göndermeli."
              : "No invite token found. You need a personal link from the host."}
          </p>
        </div>
      )}

      {panels.showActivities ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 10px" }}>
            {tr ? "BURADA NE YAPACAKSIN?" : "WHAT WILL YOU DO HERE?"}
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
            INFRASTRUCTURE SIGNAL
          </p>
          <p style={{ fontSize: 13, margin: "0 0 6px" }}>
            {bundle?.causalTimeline?.nodeCount ?? 0} {tr ? "olay düğümü" : "event nodes"} ·{" "}
            {bundle?.causalTimeline?.edgeCount ?? 0} {tr ? "nedensel kenar" : "causal edges"}
          </p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
            {tr
              ? "Event-sourced replay aktif · admission hold · observer-only"
              : "Event-sourced replay active · admission hold · observer-only"}
          </p>
        </div>
      ) : null}

      {panels.showEpistemicSubject ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
            EPISTEMIC SUBJECT (READ ONLY)
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
              {tr ? "Audit bundle henüz çalıştırılmadı." : "Audit bundle not run yet."}
            </p>
          )}
        </div>
      ) : null}

      {panels.showCausalTimeline ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
            CAUSAL SNAPSHOT TIMELINE
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
