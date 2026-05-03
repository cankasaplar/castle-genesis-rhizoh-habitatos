import { memo } from "react";

/**
 * @param {{ diagnostics?: Record<string, unknown> | null }} props
 */
const InspectorPanel = memo(function InspectorPanel({ diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const tsge = d.tsge && typeof d.tsge === "object" ? d.tsge : {};
  const field = d.field && typeof d.field === "object" ? d.field : {};
  const cm = d.capabilityManifest && typeof d.capabilityManifest === "object" ? d.capabilityManifest : null;
  const ge = d.ghostEcology && typeof d.ghostEcology === "object" ? d.ghostEcology : null;
  const chorus = d.chorus && typeof d.chorus === "object" ? d.chorus : null;
  const mb = chorus?.mergedBias && typeof chorus.mergedBias === "object" ? chorus.mergedBias : null;
  const ua = d.userAgent && typeof d.userAgent === "object" ? d.userAgent : null;
  const uap = ua?.perception && typeof ua.perception === "object" ? ua.perception : null;
  const uar = ua?.reactiveLayer && typeof ua.reactiveLayer === "object" ? ua.reactiveLayer : null;
  const uagp = ua?.ghostPerceptionV1 && typeof ua.ghostPerceptionV1 === "object" ? ua.ghostPerceptionV1 : null;
  const uarb = ua?.perceptionArbitrationV1 && typeof ua.perceptionArbitrationV1 === "object" ? ua.perceptionArbitrationV1 : null;
  const uifc = ua?.intentFeedbackClosureV1 && typeof ua.intentFeedbackClosureV1 === "object" ? ua.intentFeedbackClosureV1 : null;

  const rows = [
    ["Phase", String(field.phase || "—")],
    ["ρ mean (local gravity)", String(tsge.localGravityMean ?? "—")],
    ["TSGE mean |F| (edges)", String(tsge.edgeForceMean ?? "—")],
    ["Saturation pressure", String(tsge.saturationPressure ?? "—")],
    ["σ streak", String(tsge.saturationStreak ?? 0)],
    ["Var curvature", String(tsge.attentionCurvatureVariance ?? 0)],
    ["Protos (gestating)", String(Array.isArray(d.protoAgents) ? d.protoAgents.length : 0)],
    ["Chorus threads", String(Array.isArray(d.cognitiveThreads) ? d.cognitiveThreads.length : 0)],
    ["Court rows (gate)", String(Array.isArray(d.embodimentCourt) ? d.embodimentCourt.length : 0)],
    ["Court candidates", String(Array.isArray(d.embodimentCandidates) ? d.embodimentCandidates.length : 0)],
    ["Chorus dominant", String(chorus?.dominantTheme || "—")],
    [
      "Chorus bias",
      mb ? `B${mb.BUILD} C${mb.CRISIS} P${mb.PLAY} O${mb.OBSERVE}` : "—"
    ],
    [
      "Conflict",
      chorus?.conflictNote
        ? String(chorus.conflictNote).length > 80
          ? `${String(chorus.conflictNote).slice(0, 78)}…`
          : String(chorus.conflictNote)
        : "—"
    ],
    [
      "Ghost affinity (∩≤12)",
      ge && Array.isArray(ge.affinityEdges) ? String(ge.affinityEdges.length) : "—"
    ],
    [
      "Ghost rivalry (∩≤6)",
      ge && Array.isArray(ge.rivalryEdges) ? String(ge.rivalryEdges.length) : "—"
    ],
    [
      "Ghost coalitions (≤3)",
      ge && Array.isArray(ge.coalitions) ? String(ge.coalitions.length) : "—"
    ],
    ["Ghost pollen (TTL 6m)", ge && Array.isArray(ge.pollenTransfers) ? String(ge.pollenTransfers.length) : "—"],
    [
      "Ghost dormancy clusters",
      ge && Array.isArray(ge.dormancyClusters) ? String(ge.dormancyClusters.length) : "—"
    ],
    ["Ghost mimic chains", ge && Array.isArray(ge.mimicChains) ? String(ge.mimicChains.length) : "—"],
    ["Ghost ecology ver", ge?.version != null ? String(ge.version) : "—"],
    [
      "Ghost snapshot (pollen sigs)",
      ge?.snapshot?.dominantPollenSignatures?.length != null
        ? String(ge.snapshot.dominantPollenSignatures.length)
        : "—"
    ],
    [
      "Dynamics v1.1",
      ge?.meta?.dynamics
        ? `fatiguePairs=${ge.meta.dynamics.affinityFatiguePairs ?? "—"} · rivalryHeat=${ge.meta.dynamics.rivalryHeatPairs ?? "—"}`
        : "—"
    ],
    ["UA skeleton", ua?.skeleton?.contractVersion ? `v${ua.skeleton.contractVersion} · ${ua.skeleton.autonomyTier}` : "—"],
    ["UA subject", uap?.subjectThreadId ? String(uap.subjectThreadId).slice(0, 22) : "—"],
    [
      "UA perception (R/A/P)",
      uap
        ? `riv=${uap.rivalryPressure ?? "—"} · aff=${uap.affinityPulse ?? "—"} · pol=${uap.pollenLoad ?? "—"}`
        : "—"
    ],
    ["Reactive layer", uar?.contract?.version ? `v${uar.contract.version} · ${uar.contract.autonomyTier}` : "—"],
    [
      "UA attention steer",
      uar?.attentionSteering?.focusThreadId
        ? `${String(uar.attentionSteering.focusThreadId).slice(0, 14)} · u=${uar.attentionSteering.urgency ?? "—"}`
        : "—"
    ],
    ["UA chorus accent", uar?.chorusSoftBias?.suggestedAccent ?? "—"],
    ["UA narrative tone", uar?.narrativeFraming?.toneHint ?? "—"],
    [
      "Ghost perception v1",
      uagp?.contract?.version ? `v${uagp.contract.version} · ${uagp.overallTone ?? "—"}` : "—"
    ],
    [
      "Ghost perc. preview",
      uagp?.semanticBullets?.length
        ? `${String(uagp.semanticBullets[0]).slice(0, 72)}${String(uagp.semanticBullets[0]).length > 72 ? "…" : ""}`
        : "—"
    ],
    [
      "Perception arbitration",
      uarb?.dominantFrame
        ? `${uarb.dominantFrame}${uarb.fallbackNeutral ? " · neutral" : ""} · conflict=${uarb.conflictScore != null ? Number(uarb.conflictScore).toFixed(2) : "—"}`
        : "—"
    ],
    [
      "Frame dominance G/C/A",
      uarb?.dominanceScores
        ? `${Number(uarb.dominanceScores.ghost).toFixed(2)}/${Number(uarb.dominanceScores.chorus).toFixed(2)}/${Number(uarb.dominanceScores.agent).toFixed(2)}`
        : "—"
    ],
    [
      "Arb. governor",
      uarb?.governorV1?.disabled
        ? "off (L10 preview)"
        : uarb?.governorV1?.stabilityMetrics
          ? `stab=${Number(uarb.governorV1.stabilityMetrics.stabilityIndex).toFixed(2)} vol=${Number(uarb.governorV1.stabilityMetrics.frameVolatility).toFixed(2)} stick=${Number(uarb.governorV1.stabilityMetrics.dominanceStickiness).toFixed(2)}`
          : "—"
    ],
    [
      "Oscillation",
      uarb?.governorV1 && !uarb.governorV1.disabled && uarb.governorV1.oscillation?.pattern
        ? String(uarb.governorV1.oscillation.pattern)
        : "—"
    ],
    [
      "Intent closure posture",
      uifc?.patternIntentPosture ? String(uifc.patternIntentPosture) : "—"
    ],
    [
      "Intent closure preview",
      uifc?.intentBiasLine
        ? String(uifc.intentBiasLine).length > 72
          ? `${String(uifc.intentBiasLine).slice(0, 72)}…`
          : String(uifc.intentBiasLine)
        : "—"
    ]
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
      <div className="text-[8px] tracking-[0.25em] text-white/45 mb-2">INSPECTOR</div>
      <div className="grid gap-1 text-[9px] font-mono text-white/75">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-0.5 last:border-0">
            <span className="text-white/40">{k}</span>
            <span className="text-cyan-100/90 truncate max-w-[11rem]">{v}</span>
          </div>
        ))}
      </div>
      {cm?.manifestVersion ? (
        <div className="mt-2 text-[8px] text-white/40 normal-case">
          Capability manifest v{cm.manifestVersion} — mutable zone roadmap only; no runtime physics.
        </div>
      ) : null}
    </div>
  );
});

InspectorPanel.displayName = "InspectorPanel";
export default InspectorPanel;
