import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildObserverInviteLandingBundleV0,
  dispatchObserverInviteProceedV0,
  parseObserverInviteFromSearchV0,
  persistObserverInviteContextV0
} from "../rhizoh/ingress/observerInviteLandingV0.js";
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

const ROLE_COPY_V0 = Object.freeze({
  observer: Object.freeze({
    tr: { kicker: "Kontrollü gözlem", title: "Rhizoh gözlem alanına davet" },
    en: { kicker: "Controlled observation", title: "Rhizoh observation invite" }
  }),
  reviewer: Object.freeze({
    tr: { kicker: "İnceleme kohortu", title: "Rhizoh inceleme daveti" },
    en: { kicker: "Review cohort", title: "Rhizoh review invite" }
  }),
  investor: Object.freeze({
    tr: { kicker: "Teknik özet", title: "Rhizoh altyapı gözlemi" },
    en: { kicker: "Technical briefing", title: "Rhizoh infrastructure observation" }
  })
});

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
  const copy = ROLE_COPY_V0[role]?.[tr ? "tr" : "en"] || ROLE_COPY_V0.observer[tr ? "tr" : "en"];

  useEffect(() => {
    if (invite) persistObserverInviteContextV0(invite);
    try {
      runDomainGateForPathV0("/invite", { coreOnly: true });
    } catch {
      /* nervous system optional on first paint */
    }
    setBundle(buildObserverInviteLandingBundleV0(invite));
  }, [invite]);

  const onEnter = useCallback(() => {
    if (invite) persistObserverInviteContextV0(invite);
    dispatchObserverInviteProceedV0({ invite, target: "/world/space" });
    navigate("/world/space");
  }, [invite, navigate]);

  const manifest = bundle?.manifest;
  const timeline = bundle?.causalTimeline?.timeline || [];
  const subjectId = manifest?.subjectId || "unbound";

  return (
    <div style={INGRESS_SURFACE_V0.page} data-rhizoh-observer-invite-landing="1">
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>
        {tr
          ? "Bu yüzey salt okunur gözlem ve epistemik özet sunar. Execution yetkisi vermez. Observation ≠ Execution."
          : "This surface provides read-only observation and epistemic summary. No execution authority. Observation ≠ Execution."}
      </p>

      {invite ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.7, margin: "0 0 8px" }}>
            INVITE · {invite.inviteToken?.slice(0, 32)}
            {invite.inviteToken?.length > 32 ? "…" : ""}
          </p>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>
            {tr ? "Rol" : "Role"}: <strong>{role}</strong>
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
            {tr
              ? "Audit bundle henüz çalıştırılmadı — unbound projection."
              : "Audit bundle not run yet — unbound projection."}
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" }}>
          CAUSAL SNAPSHOT
        </p>
        <p style={{ fontSize: 13, margin: "0 0 10px" }}>
          {bundle?.causalTimeline?.nodeCount ?? 0} {tr ? "düğüm" : "nodes"} ·{" "}
          {bundle?.causalTimeline?.edgeCount ?? 0} {tr ? "kenar" : "edges"}
        </p>
        <div style={{ maxHeight: 220, overflowY: "auto", fontSize: 11, fontFamily: "monospace" }}>
          {timeline.length ? (
            timeline.map((row) => (
              <div
                key={row.id}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(148,163,184,0.12)"
                }}
              >
                <span style={{ opacity: 0.55 }}>{row.atMs ? new Date(row.atMs).toISOString().slice(11, 19) : "—"}</span>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
        <button type="button" style={INGRESS_SURFACE_V0.primaryBtn(true)} onClick={onEnter}>
          {tr ? "Gözlem alanına gir" : "Enter observation area"}
        </button>
        <a href="/academy/observe" style={{ ...INGRESS_SURFACE_V0.link, fontSize: 14, alignSelf: "center" }}>
          {tr ? "Akademik gözlem merkezi" : "Academic observatory"}
        </a>
      </div>

      <p style={{ fontSize: 11, opacity: 0.45, marginTop: 20, lineHeight: 1.5 }}>
        {tr
          ? "Rhizoh kontrollü deney ortamıdır — startup pitch değil. Teknik özet: docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0"
          : "Rhizoh is a controlled experiment environment — not a startup pitch. Technical appendix: docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0"}
      </p>
    </div>
  );
});

RhizohObserverInviteLandingPageV0.displayName = "RhizohObserverInviteLandingPageV0";
