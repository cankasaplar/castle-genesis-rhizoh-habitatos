/**
 * RESEARCH-ONLY — cross-layer visibility probe (interpretation; no execution authority).
 * Answers: is academy passive, shadow, or actively influencing this LLM turn?
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";

/** @typedef {"passive"|"shadow"|"active"} LayerInfluenceVerdict */

/**
 * @param {Record<string, unknown>} cont
 */
function narrativePresenceFromContinuityV0(cont) {
  const thread = cont.rhizohNarrativeThread;
  const arc = cont.rhizohNarrativeArc;
  const hasThread = thread != null && typeof thread === "object" && Object.keys(thread).length > 0;
  const hasArc = arc != null && typeof arc === "object" && Object.keys(arc).length > 0;
  const identityNarr = String(cont.identityNarrative || cont.identity?.narrative || "").trim();
  return {
    hasThread,
    hasArc,
    identityNarrativeChars: identityNarr.length,
    threadKeys: hasThread ? Object.keys(thread).slice(0, 8) : [],
    arcPhase: hasArc ? String(arc.phase || arc.trajectory || "") : null
  };
}

/**
 * @param {{
 *   traceId?: string,
 *   layerSpec?: { id?: number, code?: string, name?: string },
 *   conversationPhase?: string,
 *   continuity?: Record<string, unknown>,
 *   conversationDepth?: { storySnapshot?: Record<string, unknown> | null, conversationMode?: string },
 *   sourcePath?: string
 * }} input
 */
export function auditRhizohTurnLayerPresenceV0(input = {}) {
  const traceId = String(input.traceId || "").slice(0, 128);
  const cont = input.continuity && typeof input.continuity === "object" ? input.continuity : {};
  const layerId = Number(input.layerSpec?.id);
  const layerCode = String(input.layerSpec?.code || "");
  const narrative = narrativePresenceFromContinuityV0(cont);
  const storySnap =
    input.conversationDepth?.storySnapshot && typeof input.conversationDepth.storySnapshot === "object"
      ? input.conversationDepth.storySnapshot
      : null;

  const academySignals = {
    layerFocusL11: layerId === 11 || layerCode === "L11",
    eventIntent: String(cont.eventIntent || "").trim() || null,
    queuedEventId: cont.queuedEvent && typeof cont.queuedEvent === "object" ? cont.queuedEvent.id ?? null : null,
    brainV2Source: String(cont.source || input.sourcePath || "").includes("rhizoh-brain"),
    academicsInRuntime: Boolean(cont.runtime?.academicsDistrict || cont.runtime?.academicsTier)
  };

  /** @type {LayerInfluenceVerdict} */
  let academyInfluence = "passive";
  if (academySignals.queuedEventId || academySignals.eventIntent) academyInfluence = "active";
  else if (academySignals.layerFocusL11 || academySignals.brainV2Source) academyInfluence = "active";
  else if (academySignals.academicsInRuntime) academyInfluence = "shadow";

  /** @type {LayerInfluenceVerdict} */
  let narrativeInfluence = "passive";
  if (narrative.hasThread || narrative.hasArc || narrative.identityNarrativeChars > 40) {
    narrativeInfluence = "partial";
  }
  if (storySnap?.lastScene || (Array.isArray(storySnap?.unresolvedThreads) && storySnap.unresolvedThreads.length)) {
    narrativeInfluence = "partial";
  }

  const crossLayerRisk =
    academyInfluence === "passive" && narrativeInfluence === "partial"
      ? "invisible_academy_dependency"
      : academyInfluence === "passive"
        ? "academy_unobserved"
        : "visible";

  return Object.freeze({
    schema: "castle.rhizoh.layer_cross_visibility.v0",
    traceId,
    conversationPhase: String(input.conversationPhase || "").slice(0, 32),
    layer: { id: layerId, code: layerCode },
    academy: Object.freeze({
      influence: academyInfluence,
      signals: Object.freeze(academySignals),
      verdict:
        academyInfluence === "passive"
          ? "no_academy_execution_on_this_turn_path"
          : academyInfluence === "shadow"
            ? "academy_fields_present_low_impact"
            : "academy_actively_wired"
    }),
    narrative: Object.freeze({
      influence: narrativeInfluence,
      presence: Object.freeze(narrative),
      storySnapshotAttached: storySnap != null,
      verdict:
        narrativeInfluence === "partial"
          ? "continuity_narrative_enrichment_only"
          : "no_narrative_thread_in_context"
    }),
    observation: Object.freeze({
      influence: "passive",
      verdict: "observation_does_not_mutate_execution_state",
      traceBinding: traceId ? "single_trace_per_turn" : "missing_trace"
    }),
    crossLayerRisk
  });
}

/**
 * @param {ReturnType<typeof auditRhizohTurnLayerPresenceV0>} audit
 */
export function emitRhizohAcademyTickV0(audit) {
  const a = audit?.academy && typeof audit.academy === "object" ? audit.academy : {};
  const payload = Object.freeze({
    traceId: audit?.traceId ?? null,
    influence: a.influence ?? "passive",
    verdict: a.verdict ?? null,
    layerFocusL11: a.signals?.layerFocusL11 ?? false,
    eventIntent: a.signals?.eventIntent ?? null,
    queuedEventId: a.signals?.queuedEventId ?? null,
    brainV2Source: a.signals?.brainV2Source ?? false
  });
  logCastleLifecycleV0("academy_tick", payload);
  if (typeof window !== "undefined" && import.meta.env?.DEV) {
    window.__CASTLE_RHIZOH_ACADEMY_LAST_TICK__ = payload;
  }
  return payload;
}

/**
 * @param {ReturnType<typeof auditRhizohTurnLayerPresenceV0>} audit
 */
export function emitRhizohNarrativeTickV0(audit) {
  const n = audit?.narrative && typeof audit.narrative === "object" ? audit.narrative : {};
  const payload = Object.freeze({
    traceId: audit?.traceId ?? null,
    influence: n.influence ?? "passive",
    verdict: n.verdict ?? null,
    hasThread: n.presence?.hasThread ?? false,
    hasArc: n.presence?.hasArc ?? false,
    identityNarrativeChars: n.presence?.identityNarrativeChars ?? 0,
    storySnapshotAttached: n.storySnapshotAttached ?? false
  });
  logCastleLifecycleV0("narrative_tick", payload);
  if (typeof window !== "undefined" && import.meta.env?.DEV) {
    window.__CASTLE_RHIZOH_NARRATIVE_LAST_TICK__ = payload;
  }
  return payload;
}

/**
 * @param {ReturnType<typeof auditRhizohTurnLayerPresenceV0>} audit
 */
export function emitRhizohLayerVisibilityTickV0(audit) {
  const payload = Object.freeze({
    traceId: audit?.traceId ?? null,
    conversationPhase: audit?.conversationPhase ?? null,
    layer: audit?.layer ?? null,
    crossLayerRisk: audit?.crossLayerRisk ?? null,
    academyInfluence: audit?.academy?.influence ?? null,
    narrativeInfluence: audit?.narrative?.influence ?? null
  });
  logCastleLifecycleV0("layer_visibility", payload);
  return payload;
}
