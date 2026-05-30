import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LAYER_UI_CLASSES_V1,
  STATE_LAYER_V1,
  resolveUxContractFromHardeningV1
} from "./interpretationUxContractV1.js";
import {
  pickDisplayConfidenceV0,
  resolveNarrativeUiPolicyFromHardeningV0,
  shouldSuppressApprovalChromeV0
} from "./narrativeUiDisplayPolicyV0.js";
import { resolveScreenshotWatermarkFromHardeningV1 } from "./narrativeScreenshotWatermarkV1.js";

function LayerBadge({ layer }) {
  const tone =
    layer === STATE_LAYER_V1.RAW
      ? "border-emerald-500/30 text-emerald-200/90"
      : layer === STATE_LAYER_V1.POLICY
        ? "border-amber-500/35 text-amber-200/90"
        : "border-violet-500/25 text-violet-200/70";
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${tone}`}>
      {layer}
    </span>
  );
}

function MetricRow({ k, v }) {
  return (
    <div className="flex justify-between gap-2 border-b border-white/[0.04] py-0.5">
      <span className="text-white/45">{k}</span>
      <span className="font-mono text-white/75">{v == null ? "—" : String(v)}</span>
    </div>
  );
}

/**
 * Ops panel: RAW → DERIVED (collapsed narrative) → POLICY. Narrative never hero.
 * @param {{ gatewayOrigin: string }} props
 */
export function RhizohInterpretationOpsPanel({ gatewayOrigin }) {
  const [payload, setPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [derivedOpen, setDerivedOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!gatewayOrigin) {
      setErr("gateway_origin_missing");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const url = `${gatewayOrigin.replace(/\/$/, "")}/rhizoh/ops/hardening/status`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`http_${res.status}`);
      const json = await res.json();
      setPayload(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "fetch_failed");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [gatewayOrigin]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const unified = payload?.unifiedState;
  const layers = unified?.stateLayers;
  const uiPolicy = useMemo(() => resolveNarrativeUiPolicyFromHardeningV0(payload), [payload]);
  const ux = useMemo(() => resolveUxContractFromHardeningV1(payload), [payload]);
  const collapseDerived = uiPolicy?.displayRules?.collapseDerivedByDefault !== false;

  useEffect(() => {
    setDerivedOpen(!collapseDerived);
  }, [collapseDerived]);

  const displayConfidence = pickDisplayConfidenceV0(unified);
  const health = unified?.systemState?.health || layers?.derived?.systemState?.health;
  const suppressGreen = shouldSuppressApprovalChromeV0(uiPolicy, { health });
  const humanOps = unified?.humanOps;
  const watermark = useMemo(() => resolveScreenshotWatermarkFromHardeningV1(payload), [payload]);
  const tenantScope = unified?.tenantScope;
  const fingerprint = unified?.narrativeFingerprint;
  const disclaimer = uiPolicy?.disclaimer?.tr || uiPolicy?.disclaimer?.en;
  const ecl = unified?.epistemicCoherence;
  const eclUx = ecl?.uxCompression;
  const cab = unified?.coherenceAuthorityBoundary;
  const dlgl = unified?.decisionLatencyGovernance;
  const humanPacket = dlgl?.humanDecisionPacket;
  const dpub = unified?.decisionPacketUncertaintyBoundary;
  const edpl = unified?.epistemicDecisionPacing;
  const etcl = unified?.epistemicTemporalCoherence;
  const rdol = unified?.realityDriftObserver;
  const dcl = unified?.driftCausality;

  if (!gatewayOrigin) {
    return (
      <p className="text-[9px] text-amber-200/80 normal-case">
        Gateway origin yok — interpretation contract paneli yalnız canlı hardening ile yüklenir.
      </p>
    );
  }

  return (
    <div className="relative space-y-2" data-interpretation-ux-contract={ux?.schema}>
      <div
        className="pointer-events-none select-none rounded border border-dashed border-amber-400/35 bg-amber-950/30 px-2 py-1 font-mono text-[7px] leading-snug text-amber-100/85"
        data-screenshot-watermark={watermark?.schema}
        aria-hidden="true"
      >
        {watermark?.lines?.tr}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`${LAYER_UI_CLASSES_V1.disclaimer}`}>{disclaimer}</p>
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-0.5 text-[8px] text-white/50 hover:bg-white/5"
          onClick={() => fetchStatus()}
          disabled={loading}
        >
          {loading ? "…" : "Yenile"}
        </button>
      </div>

      {err ? <p className="text-[9px] text-rose-200/90 normal-case">{err}</p> : null}

      {eclUx ? (
        <section
          className="rounded-lg border border-cyan-500/25 bg-cyan-950/20 p-2.5"
          data-layer="ECL"
          data-coherence-verdict={ecl?.systemCoherence?.verdict}
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded border border-cyan-500/35 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-cyan-200/90">
              ECL
            </span>
            <span className="text-[8px] text-white/45 normal-case">Tek karar yüzeyi (ASGL+ACRL+GCL+World)</span>
          </div>
          <p className="text-[9px] leading-snug text-cyan-100/90 normal-case">{eclUx.headline?.tr}</p>
          <div className="mt-1.5 space-y-0.5 font-mono text-[8px] text-white/55">
            <MetricRow k="coherence" v={`${ecl?.systemCoherence?.score ?? "—"} · ${ecl?.systemCoherence?.verdict}`} />
            <MetricRow k="decision" v={eclUx.operatorDecision} />
            <MetricRow k="meaning" v={eclUx.layersOneLine?.meaning} />
            <MetricRow k="permission" v={eclUx.layersOneLine?.permission} />
            <MetricRow k="control" v={eclUx.layersOneLine?.control} />
            <MetricRow k="world" v={eclUx.layersOneLine?.world} />
          </div>
          {eclUx.falseSafetyWarning ? (
            <p className="mt-1 text-[8px] text-amber-200/80 normal-case">{eclUx.falseSafetyWarning.tr}</p>
          ) : null}
          {ecl?.crossLayerContradictions?.count > 0 ? (
            <p className="mt-1 text-[8px] text-rose-200/60 normal-case">
              Çapraz katman çelişkisi: {ecl.crossLayerContradictions.count}
            </p>
          ) : null}
          {cab?.disclaimers?.mandatoryBanner?.tr ? (
            <p
              className="mt-1.5 rounded border border-amber-500/30 bg-amber-950/25 px-1.5 py-1 text-[8px] text-amber-100/85 normal-case"
              data-layer="CAB"
            >
              <span className="font-mono text-[7px] uppercase text-amber-200/70">CAB · </span>
              {cab.disclaimers.mandatoryBanner.tr}
            </p>
          ) : null}
          {humanPacket ? (
            <div
              className="mt-1.5 rounded border border-emerald-500/25 bg-emerald-950/20 px-1.5 py-1"
              data-layer="DLGL"
            >
              <p className="font-mono text-[7px] uppercase text-emerald-200/70">DLGL · insan paketi</p>
              <MetricRow k="tier" v={dlgl?.latencyTier} />
              <MetricRow k="certainty" v={humanPacket.certaintyCap} />
              <MetricRow k="next" v={humanPacket.primaryActionId} />
              <MetricRow k="sla_ack_min" v={humanPacket.ackSlaMinutes} />
              <p className="mt-0.5 text-[8px] text-white/55 normal-case">{humanPacket.actionHint}</p>
              {humanPacket.mandatoryBanner?.tr ? (
                <p className="mt-1 text-[7px] text-violet-200/70 normal-case">{humanPacket.mandatoryBanner.tr}</p>
              ) : null}
              {humanPacket.slaQualification?.disclaimer?.tr ? (
                <p className="text-[7px] text-amber-200/65 normal-case">{humanPacket.slaQualification.disclaimer.tr}</p>
              ) : null}
              {(humanPacket.contradictionDigest?.crossLayerCount ?? 0) > 0 ? (
                <p className="text-[7px] text-rose-200/60 normal-case">
                  Çelişki özeti: {humanPacket.contradictionDigest.crossLayerCount} cross-layer
                </p>
              ) : null}
              {(humanPacket.uncertaintyEnvelope?.knownUnknowns?.length ?? 0) > 0 ? (
                <p className="text-[7px] text-white/40 normal-case">
                  Bilinmeyen: {humanPacket.uncertaintyEnvelope.knownUnknowns.slice(0, 3).join(" · ")}
                </p>
              ) : null}
              {dlgl?.fastPath?.eligible ? (
                <p className="text-[7px] text-emerald-200/60 normal-case">
                  Fast path — özet; RAW + çelişki özeti yine gerekli
                </p>
              ) : null}
              {dpub?.invariantCheck?.valid === false ? (
                <p className="text-[7px] text-rose-300/80 normal-case">DPUB invariant ihlali</p>
              ) : null}
              {edpl ? (
                <div className="mt-1.5 border-t border-white/[0.06] pt-1" data-layer="EDPL">
                  <p className="font-mono text-[7px] uppercase text-fuchsia-200/70">EDPL · tempo</p>
                  <MetricRow
                    k="queue_saturation"
                    v={`${edpl.operatorPacingControl?.queueSaturation?.tier} · ${edpl.operatorPacingControl?.queueSaturation?.queueSaturationIndex}`}
                  />
                  <MetricRow
                    k="op_latency"
                    v={edpl.operatorPacingControl?.queueSaturation?.operatorProcessingLatency}
                  />
                  <MetricRow
                    k="posture_windows"
                    v={edpl.temporaryStaticPostureWindows?.temporaryStaticPostureWindows?.windowCount}
                  />
                  <p className="text-[7px] text-white/45 normal-case">
                    {edpl.operatorPacingControl?.operatorGuidance?.tr}
                  </p>
                  {(
                    edpl.temporaryStaticPostureWindows?.temporaryStaticPostureWindows?.windows ?? []
                  )
                    .slice(0, 2)
                    .map((w) => (
                      <p key={w.windowId} className="text-[7px] text-fuchsia-200/50 normal-case">
                        TSPW: {w.actionId} ({w.validForMinutes}dk) — RAW akış açık
                      </p>
                    ))}
                  {etcl ? (
                    <div className="mt-1 border-t border-white/[0.06] pt-1" data-layer="ETCL">
                      <p className="font-mono text-[7px] uppercase text-sky-200/70">ETCL · temporal</p>
                      <MetricRow k="align" v={String(etcl.invariants?.temporalAlignment?.valid)} />
                      <MetricRow k="cross_win" v={String(etcl.invariants?.crossWindowContradictionGuard?.valid)} />
                      <MetricRow k="delayed_truth" v={String(etcl.invariants?.delayedTruthRule?.valid)} />
                      {etcl.invariants?.crossWindowContradictionGuard?.reconciliation?.required ? (
                        <p className="text-[7px] text-amber-200/70 normal-case">{etcl.operatorGuidance?.tr}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {rdol ? (
                    <div className="mt-1 border-t border-white/[0.06] pt-1" data-layer="RDOL">
                      <p className="font-mono text-[7px] uppercase text-orange-200/70">RDOL · drift</p>
                      <MetricRow k="shapes" v={rdol.misapprehensionShapeCatalog?.shapeCount} />
                      <MetricRow k="critical" v={rdol.driftObserverSummary?.criticalShapeCount} />
                      <MetricRow k="robotics_mm" v={String(rdol.roboticsFeedbackMismatch?.active)} />
                      <MetricRow k="prop_gap" v={String(rdol.propagationLiveDivergence?.propagationLiveGap)} />
                      <p className="text-[7px] text-white/45 normal-case">{rdol.operatorGuidance?.tr}</p>
                    </div>
                  ) : null}
                  {dcl ? (
                    <div className="mt-1 border-t border-white/[0.06] pt-1" data-layer="DCL">
                      <p className="font-mono text-[7px] uppercase text-rose-200/60">DCL · neden</p>
                      <MetricRow
                        k="explained"
                        v={`${dcl.rdolLinkage?.shapesWithCausalExplanation}/${dcl.rdolLinkage?.driftShapesObserved}`}
                      />
                      <MetricRow k="domains" v={dcl.causalitySummary?.activeDomainCount} />
                      <p className="text-[7px] text-white/40 normal-case">
                        prop: {dcl.causalDomains?.propagation?.causes?.[0] || "—"}
                      </p>
                      <p className="text-[7px] text-white/40 normal-case">{dcl.operatorGuidance?.tr}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="rounded border border-white/[0.06] bg-black/30 px-2 py-1 font-mono text-[8px] text-white/45">
        <MetricRow k="tenant.scope" v={tenantScope?.scope} />
        <MetricRow k="tenant.id" v={tenantScope?.tenantId} />
        <MetricRow k="narrative.fp" v={fingerprint?.shortCode} />
        <MetricRow k="derived.global" v={layers?.derived?.globalDerivedState === false ? "false" : "—"} />
      </div>

      <section className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-2.5" data-layer={STATE_LAYER_V1.RAW}>
        <div className="mb-1.5 flex items-center gap-2">
          <LayerBadge layer={STATE_LAYER_V1.RAW} />
          <span className="text-[8px] uppercase tracking-wider text-white/40">Ne oldu (ölçüm)</span>
        </div>
        <div className={LAYER_UI_CLASSES_V1.raw}>
          <MetricRow k="rollout.activeTurns" v={layers?.raw?.rollout?.activeTurns ?? payload?.phasedRollout?.activeTurns} />
          <MetricRow k="rollout.limit" v={layers?.raw?.rollout?.limit ?? payload?.phasedRollout?.limit} />
          <MetricRow k="gcl.health" v={layers?.raw?.gcl?.health?.ok ?? payload?.gcl?.snapshot?.health} />
          <MetricRow k="coordination.sim" v={layers?.raw?.rollout?.coordinationSim ?? payload?.coordination?.sim} />
          <MetricRow k="loadTest.mode" v={layers?.raw?.loadTest?.executionMode} />
        </div>
      </section>

      <section className="rounded-lg border border-violet-500/15 bg-violet-950/10 p-2.5" data-layer={STATE_LAYER_V1.DERIVED}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LayerBadge layer={STATE_LAYER_V1.DERIVED} />
            <span className="text-[8px] text-white/35 normal-case">Hipotez — karar değil</span>
          </div>
          <button
            type="button"
            className="text-[8px] text-white/45 underline"
            onClick={() => setDerivedOpen((o) => !o)}
          >
            {derivedOpen ? "Daralt" : "Genişlet"}
          </button>
        </div>
        {derivedOpen ? (
          <div className={LAYER_UI_CLASSES_V1.derived}>
            <MetricRow
              k={uiPolicy?.displayRules?.primaryMetricLabel || "trustworthy_confidence"}
              v={displayConfidence}
            />
            <MetricRow k="health" v={health} />
            <div className="mt-1 rounded border border-white/[0.06] bg-black/20 p-1.5">
              <div className={LAYER_UI_CLASSES_V1.derivedNarrative}>
                <span className="font-mono text-[7px] text-white/25">narrative · subordinate</span>
                <p className={LAYER_UI_CLASSES_V1.nonDominantHeadline}>
                  {layers?.derived?.narrative?.headline || unified?.interpretation?.headline || "—"}
                </p>
                <p>{layers?.derived?.narrative?.narrativeTr || unified?.interpretation?.narrativeTr || ""}</p>
              </div>
            </div>
            {!suppressGreen ? null : (
              <p className="mt-1 text-[8px] text-amber-200/70 normal-case">
                Stressed/degraded — onay rengi bastırıldı (UX contract).
              </p>
            )}
          </div>
        ) : (
          <p className="text-[8px] text-white/35 normal-case">DERIVED kapalı — önce RAW okunur.</p>
        )}
      </section>

      <section className="rounded-lg border border-amber-500/25 bg-amber-950/12 p-2.5" data-layer={STATE_LAYER_V1.POLICY}>
        <div className="mb-1.5 flex items-center gap-2">
          <LayerBadge layer={STATE_LAYER_V1.POLICY} />
          <span className="text-[8px] uppercase tracking-wider text-white/40">Sınırlar (yürütme yok)</span>
        </div>
        <div className={LAYER_UI_CLASSES_V1.policy}>
          <MetricRow k="can_execute" v={unified?.interpretationSafetyContract?.can_execute ?? false} />
          <MetricRow k="decision_owner" v={humanOps?.humanDecisionScaling?.decisionOwner} />
          <MetricRow k="ops.route" v={humanOps?.humanDecisionOpsRunbook?.routing?.routeId} />
          <MetricRow k="sla.ack_min" v={humanOps?.humanDecisionOpsRunbook?.sla?.ackMinutes} />
        </div>
        <ul className="mt-1 max-h-24 list-inside list-disc overflow-y-auto text-[8px] text-white/40 normal-case">
          {(layers?.policy?.prohibitedActions || unified?.governance?.doNotUseAs || [])
            .slice(0, 6)
            .map((item) => (
              <li key={String(item)}>{String(item)}</li>
            ))}
        </ul>
      </section>

      {humanOps?.misreadSimulation ? (
        <p className="text-[8px] text-white/30 normal-case">
          Misread sim: {humanOps.misreadSimulation.highResidualCount} high-residual /{" "}
          {humanOps.misreadSimulation.scenarioCount} scenarios
        </p>
      ) : null}
      {humanOps?.socialPropagationSimulation ? (
        <p className="text-[8px] text-white/30 normal-case">
          Propagation: {humanOps.socialPropagationSimulation.highResidualCount} high-risk paths · watermark min{" "}
          {humanOps.socialPropagationSimulation.aggregate?.worstWatermarkSurvivability} · distortion:{" "}
          {humanOps.socialPropagationSimulation.aggregate?.dominantDistortionSource}
        </p>
      ) : null}
      {payload?.unifiedState?.culturalRisk?.trustDynamics ? (
        <p className="text-[8px] text-violet-200/50 normal-case">
          Trust fork: {payload.unifiedState.culturalRisk.trustDynamics.fork} · decay{" "}
          {payload.unifiedState.culturalRisk.trustDynamics.scores?.trustDecay} · myth{" "}
          {payload.unifiedState.culturalRisk.trustDynamics.scores?.mythology} —{" "}
          {payload.unifiedState.culturalRisk.trustDynamics.humanResponse?.tr}
        </p>
      ) : null}
    </div>
  );
}
