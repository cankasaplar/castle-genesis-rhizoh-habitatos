import React, { memo, useMemo } from "react";
import { BarChart3, GitBranch, Timer, Scale, Shield } from "lucide-react";
import { RHIZOH_CONVERSATION_PHASE } from "../rhizoh/product/rhizohConversationOrchestratorV1.js";

const FUNNEL_ORDER = [
  RHIZOH_CONVERSATION_PHASE.NEW_USER,
  RHIZOH_CONVERSATION_PHASE.INTRO,
  RHIZOH_CONVERSATION_PHASE.TRUST_BUILD,
  RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT,
  RHIZOH_CONVERSATION_PHASE.POWER_MODE
];

/**
 * @param {{
 *   snapshot: { rollup?: object, derived?: object },
 *   milestones?: { atMs?: number, headline?: string, toPhase?: string, fromPhase?: string }[],
 *   turns?: { ts?: number, user?: string }[],
 *   phaseLabel?: string,
 *   decisionOverlay?: {
 *     ux?: object,
 *     phaseTuning?: object,
 *     capabilityGates?: object,
 *     rationale?: string[],
 *     learnedPolicyActive?: boolean,
 *     policyTruth?: {
 *       finalizeLane?: string,
 *       counterfactual?: { passes?: boolean, confidence01?: number },
 *       cohort?: { learningBucket?: string },
 *       truthAnchor?: { drift01?: number }
 *     }
 *   } | null,
 *   effectivenessRows?: { id: string, recordedAt: number, evaluatedAt?: number, rationale: string[], scores: object[] }[],
 *   policyAudit?: { ts?: number, action?: string }[],
 *   policyLearningGuard?: {
 *     holdout?: boolean,
 *     holdoutPct?: number,
 *     shadowPromote?: boolean,
 *     shadowFinalize?: boolean,
 *     promoteBlock?: string | null,
 *     promotePeek?: { count?: number, lastPromoteAt?: number, windowStartMs?: number } | null,
 *     cohort?: { learningBucket?: string, promoteLane?: string, serverPopulationCohort?: string | null } | null,
 *     truthAnchorPanel?: { drift01?: number, hasAnchor?: boolean } | null,
 *     strictCounterfactual?: boolean,
 *     anchorFinalize?: boolean,
 *     externalGroundTruthPanel?: { cacheStatus?: string, populationCohort?: string | null } | null,
 *     externalLossSummary?: { penalty01?: number, reward01?: number, net01?: number, negativeCount?: number } | null
 *   } | null,
 *   className?: string
 * }} props
 */
export const RhizohProductInsightsDashboard = memo(function RhizohProductInsightsDashboard({
  snapshot,
  milestones = [],
  turns = [],
  phaseLabel = "—",
  decisionOverlay = null,
  effectivenessRows = [],
  policyAudit = [],
  policyLearningGuard = null,
  className = ""
}) {
  const rollup = snapshot?.rollup && typeof snapshot.rollup === "object" ? snapshot.rollup : {};
  const derived = snapshot?.derived && typeof snapshot.derived === "object" ? snapshot.derived : {};

  const funnel = useMemo(() => {
    const enters = rollup.phaseEnterCount && typeof rollup.phaseEnterCount === "object" ? rollup.phaseEnterCount : {};
    const rows = FUNNEL_ORDER.map((id) => ({
      id,
      n: Math.max(0, Math.floor(Number(enters[id]) || 0))
    }));
    const max = Math.max(1, ...rows.map((r) => r.n));
    return rows.map((r) => ({ ...r, pct: Math.round((r.n / max) * 100) }));
  }, [rollup.phaseEnterCount]);

  const survival = useMemo(() => {
    const dwell =
      rollup.phaseDwellMs && typeof rollup.phaseDwellMs === "object" ? rollup.phaseDwellMs : {};
    let acc = 0;
    const chunks = FUNNEL_ORDER.map((id) => {
      const ms = Math.max(0, Number(dwell[id]) || 0);
      acc += ms;
      return { id, ms };
    });
    const total = Math.max(1, acc);
    return chunks.map((c) => ({
      ...c,
      share01: Math.round((c.ms / total) * 1000) / 1000
    }));
  }, [rollup.phaseDwellMs]);

  const timeline = useMemo(() => {
    const m = Array.isArray(milestones) ? milestones.slice(-16) : [];
    const t = Array.isArray(turns) ? turns.slice(-16) : [];
    const merged = [
      ...m.map((row) => ({
        kind: "milestone",
        atMs: Number(row.atMs) || 0,
        label: String(row.toPhase || ""),
        detail: String(row.headline || "").slice(0, 120)
      })),
      ...t.map((row) => ({
        kind: "turn",
        atMs: Number(row.ts) || 0,
        label: "turn",
        detail: String(row.user || "").slice(0, 80)
      }))
    ];
    merged.sort((a, b) => a.atMs - b.atMs);
    return merged.slice(-24);
  }, [milestones, turns]);

  const policyTruth =
    decisionOverlay?.policyTruth && typeof decisionOverlay.policyTruth === "object"
      ? decisionOverlay.policyTruth
      : null;
  const drift01 =
    typeof policyTruth?.truthAnchor?.drift01 === "number"
      ? policyTruth.truthAnchor.drift01
      : typeof policyLearningGuard?.truthAnchorPanel?.drift01 === "number"
        ? policyLearningGuard.truthAnchorPanel.drift01
        : null;

  return (
    <section
      role="region"
      aria-label="Ürün içgörüleri"
      className={`rounded-2xl border border-cyan-500/25 bg-[#071428]/90 px-3 py-3 text-left normal-case ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2 mb-2">
        <BarChart3 className="h-4 w-4 text-cyan-300/90 shrink-0" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
          Insight dashboard
        </span>
        <span className="text-[9px] text-white/45">Faz: {phaseLabel}</span>
        {decisionOverlay?.learnedPolicyActive ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/35 bg-emerald-950/40 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-emerald-100/95">
            <Shield className="h-3 w-3 text-emerald-300 shrink-0" aria-hidden />
            Öğrenilmiş policy aktif
          </span>
        ) : null}
        {policyLearningGuard?.holdout ? (
          <span className="rounded-md border border-amber-500/35 bg-amber-950/35 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-100/90">
            Kohort holdout %{policyLearningGuard.holdoutPct ?? "—"}
          </span>
        ) : null}
        {policyLearningGuard?.shadowPromote ? (
          <span className="rounded-md border border-violet-500/35 bg-violet-950/35 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-100/90">
            Promote shadow
          </span>
        ) : null}
        {policyLearningGuard?.shadowFinalize ? (
          <span className="rounded-md border border-violet-500/35 bg-violet-950/35 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-100/90">
            Finalize shadow
          </span>
        ) : null}
        {policyLearningGuard?.promoteBlock ? (
          <span className="rounded-md border border-orange-500/35 bg-orange-950/30 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-orange-100/90">
            Promote: {policyLearningGuard.promoteBlock}
          </span>
        ) : null}
        {policyLearningGuard?.cohort?.learningBucket ? (
          <span className="rounded-md border border-sky-500/30 bg-sky-950/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-sky-100/90">
            Yerel {policyLearningGuard.cohort.learningBucket}
          </span>
        ) : null}
        {policyLearningGuard?.cohort?.serverPopulationCohort ? (
          <span className="rounded-md border border-lime-500/25 bg-lime-950/20 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-lime-100/90">
            Sunucu {policyLearningGuard.cohort.serverPopulationCohort}
          </span>
        ) : null}
        {policyLearningGuard?.truthAnchorPanel?.hasAnchor && drift01 != null ? (
          <span className="rounded-md border border-teal-500/30 bg-teal-950/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-teal-100/90">
            Truth drift {(drift01 * 100).toFixed(0)}%
          </span>
        ) : null}
        {policyLearningGuard?.strictCounterfactual ? (
          <span className="rounded-md border border-rose-500/35 bg-rose-950/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-rose-100/90">
            CF strict
          </span>
        ) : null}
        {policyLearningGuard?.anchorFinalize ? (
          <span className="rounded-md border border-fuchsia-500/30 bg-fuchsia-950/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-fuchsia-100/90">
            Anchor finalize
          </span>
        ) : null}
        {policyTruth?.finalizeLane ? (
          <span className="rounded-md border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[8px] text-white/65">
            Lane: {policyTruth.finalizeLane}
          </span>
        ) : null}
        {typeof policyLearningGuard?.externalLossSummary?.net01 === "number" ? (
          <span className="rounded-md border border-white/12 bg-black/35 px-2 py-0.5 text-[8px] font-mono text-white/65">
            Ext kayıp net {(policyLearningGuard.externalLossSummary.net01 * 100).toFixed(0)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wide text-white/50">
            <GitBranch className="h-3 w-3" aria-hidden />
            Funnel (phase enters)
          </div>
          <ul className="mt-2 space-y-1.5">
            {funnel.map((row) => (
              <li key={row.id} className="text-[9px] text-white/75">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-mono text-[8px] text-white/55">{row.id}</span>
                  <span>{row.n}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600/80 to-violet-500/70"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wide text-white/50">
            <Timer className="h-3 w-3" aria-hidden />
            Phase survival (dwell share)
          </div>
          <ul className="mt-2 space-y-1">
            {survival.map((row) => (
              <li key={row.id} className="flex justify-between gap-2 text-[9px] text-white/72">
                <span className="font-mono text-[8px] text-white/50 truncate">{row.id}</span>
                <span className="shrink-0">{(row.share01 * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[8px] leading-relaxed text-white/40">
            Yerel rollup’taki faz kalış sürelerinin oranı — kesin cohort retention değil, ürün içi proxy.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 sm:col-span-1">
          <div className="text-[8px] font-semibold uppercase tracking-wide text-white/50">
            Replay timeline
          </div>
          <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-1">
            {timeline.length === 0 ? (
              <li className="text-[9px] text-white/45">Henüz tur veya kilometre taşı yok.</li>
            ) : (
              timeline.map((row, i) => (
                <li key={`${row.kind}-${row.atMs}-${i}`} className="border-l border-white/15 pl-2 text-[9px] text-white/78">
                  <span className="text-white/40">{row.kind === "milestone" ? "◇" : "·"}</span>{" "}
                  <span className="text-white/50">{row.label}</span>
                  {row.detail ? (
                    <>
                      {" "}
                      <span className="text-white/55">—</span> {row.detail}
                    </>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-2">
        <div className="text-[8px] font-semibold uppercase tracking-wide text-emerald-200/80">
          Derived metrics
        </div>
        <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] text-white/75">
          <div>
            Ø turn depth{" "}
            <span className="font-mono text-emerald-100/90">{derived.avgTurnDepth ?? "—"}</span>
          </div>
          <div>
            Ø closure görünür ms{" "}
            <span className="font-mono text-emerald-100/90">{derived.avgClosureVisibleMs ?? "—"}</span>
          </div>
          <div>
            Ø trust Δ (faz sınırı){" "}
            <span className="font-mono text-emerald-100/90">{derived.avgTrustDelta ?? "—"}</span>
          </div>
          <div>
            Closure görüntü{" "}
            <span className="font-mono text-emerald-100/90">{rollup.closureViewCount ?? 0}</span>
          </div>
        </div>
      </div>

      {Array.isArray(policyAudit) && policyAudit.length > 0 ? (
        <div className="mt-2 rounded-lg border border-sky-400/25 bg-sky-950/20 px-2.5 py-2">
          <div className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wide text-sky-200/85">
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Guard’lı policy otomasyonu (audit)
          </div>
          <p className="mt-1 text-[8px] leading-relaxed text-white/45">
            Effectiveness <span className="text-white/55">supporting</span> (+min skor) ile LS patch — aynı boyutta{" "}
            <span className="text-white/55">contrary</span> varsa bu boyutta promote yapılmaz.
          </p>
          <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto">
            {policyAudit.map((a, i) => (
              <li key={`${a.ts}-${i}`} className="text-[9px] text-white/72 font-mono">
                <span className="text-white/40">{a.ts ? new Date(a.ts).toLocaleString() : "—"}</span>{" "}
                <span className="text-sky-200/90">{a.action || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {decisionOverlay && Array.isArray(decisionOverlay.rationale) && decisionOverlay.rationale.length > 0 ? (
        <div className="mt-2 rounded-lg border border-violet-400/25 bg-violet-950/25 px-2.5 py-2">
          <div className="text-[8px] font-semibold uppercase tracking-wide text-violet-200/85">
            Aktif ürün kararları
          </div>
          <ul className="mt-1 list-disc pl-4 text-[9px] text-white/70 space-y-0.5">
            {decisionOverlay.rationale.map((r, i) => (
              <li key={`${r}-${i}`}>{r}</li>
            ))}
          </ul>
          <div className="mt-1.5 text-[8px] text-white/45 font-mono leading-relaxed">
            UX closureMs={decisionOverlay.ux?.closureBannerMs ?? "—"} · trustBond≥
            {decisionOverlay.phaseTuning?.trustBondForNormal ?? "—"} · govGate=
            {decisionOverlay.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01 ?? "off"}
          </div>
        </div>
      ) : null}

      {Array.isArray(effectivenessRows) && effectivenessRows.length > 0 ? (
        <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-950/20 px-2.5 py-2">
          <div className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wide text-amber-200/85">
            <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Karar etkinliği (geri bildirim)
          </div>
          <p className="mt-1 text-[8px] leading-relaxed text-white/45">
            Baseline anında rollup + sonrasında biriken olaylarla karşılaştırma — gerçek A/B değil; ürün hipotezi doğrulama ipucu.
          </p>
          <ul className="mt-2 space-y-2">
            {effectivenessRows.map((row) => (
              <li key={row.id} className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5">
                <div className="text-[8px] text-white/40 font-mono">
                  {new Date(row.recordedAt).toLocaleString()} · {row.rationale?.[0] || "karar"}
                </div>
                <ul className="mt-1 space-y-1">
                  {(row.scores || []).map((s, i) => (
                    <li key={`${row.id}-${i}-${s.tag}`} className="text-[9px] text-white/78 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span
                        className={
                          s.verdict === "supporting"
                            ? "text-emerald-300/95 font-semibold"
                            : s.verdict === "contrary"
                              ? "text-rose-300/95 font-semibold"
                              : "text-white/55"
                        }
                      >
                        {s.verdict === "supporting"
                          ? "✓ destekliyor"
                          : s.verdict === "contrary"
                            ? "✗ ters"
                            : "~ nötr"}
                      </span>
                      <span className="text-white/45">{s.dimension}</span>
                      {typeof s.score01 === "number" ? (
                        <span className="font-mono text-white/60">score≈{s.score01.toFixed(2)}</span>
                      ) : null}
                      <span className="text-white/35 truncate max-w-full">{s.tag}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
});
