/**
 * Shadow timeline — temporal cognition view (observation-only).
 * Ring = spatial memory; timeline = when rejection/execution phases emerge.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { VOICE_ROUTER_REJECTION_LAYER_V0 } from "./voiceTranscriptConfidenceRouterV0.js";

export const VOICE_SHADOW_TIMELINE_SCHEMA = "castle.rhizoh.voice_shadow_timeline.v0";

export const VOICE_TIMELINE_EVENT_KIND_V0 = Object.freeze({
  SHADOW_FORWARD: "shadow_forward",
  EXECUTION_DISPATCH: "execution_dispatch",
  EXECUTION_BLOCKED: "execution_blocked",
  SHADOW_ACK: "shadow_ack",
  NOOP: "noop",
  ROUTER_PROBE: "router_probe"
});

export const VOICE_TIMELINE_PHASE_LABEL_V0 = Object.freeze({
  INTERACTION_REJECTION_SPIKE: "interaction_rejection_spike",
  SANITY_REJECTION_FIELD: "sanity_rejection_field",
  CONFIDENCE_STABILIZATION: "confidence_stabilization",
  EXECUTION_EMERGENCE: "execution_emergence",
  AMBIENT_NOISE_FIELD: "ambient_noise_field",
  OBSERVATION_ACCUMULATION: "observation_accumulation",
  MIXED_OBSERVATION: "mixed_observation",
  IDLE: "idle"
});

const DEFAULT_BUCKET_MS = 5000;
const MAX_EVENTS = 96;
const PHASE_EMIT_GAP_MS = 8000;

/** @type {number | null} */
let sessionAnchorMs = null;
/** @type {object[]} */
const events = [];
let lastPhaseEmitAtMs = 0;

/**
 * @param {{ bucketMs?: number }} [opts]
 */
export function getVoiceTimelineBucketMsV0(opts = {}) {
  const env =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_VOICE_TIMELINE_BUCKET_MS;
  const parsed = Number(env);
  if (Number.isFinite(parsed) && parsed >= 2000) return parsed;
  return Number(opts.bucketMs) > 0 ? Number(opts.bucketMs) : DEFAULT_BUCKET_MS;
}

/**
 * @param {{
 *   kind?: string,
 *   atMs?: number,
 *   preview?: string,
 *   band?: string,
 *   reason?: string,
 *   rejectionLayer?: string,
 *   executionAccepted?: boolean,
 *   observationForward?: boolean,
 *   confidence?: number,
 *   source?: string,
 *   stage?: string,
 *   ackMode?: string
 * }} evt
 */
export function recordVoiceTimelineEventV0(evt = {}) {
  const atMs = Number(evt.atMs) > 0 ? Number(evt.atMs) : Date.now();
  if (sessionAnchorMs == null) sessionAnchorMs = atMs;

  const entry = Object.freeze({
    kind: String(evt.kind || VOICE_TIMELINE_EVENT_KIND_V0.ROUTER_PROBE),
    atMs,
    offsetMs: Math.max(0, atMs - sessionAnchorMs),
    preview: String(evt.preview || "").slice(0, 72),
    band: evt.band || undefined,
    reason: evt.reason || undefined,
    rejectionLayer: evt.rejectionLayer || undefined,
    executionAccepted: evt.executionAccepted === true,
    observationForward: evt.observationForward === true,
    confidence: Number.isFinite(Number(evt.confidence)) ? Number(evt.confidence) : undefined,
    source: evt.source || undefined,
    stage: evt.stage || undefined,
    ackMode: evt.ackMode || undefined
  });

  events.push(entry);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

  publishTimelineWindowV0();
  maybeEmitTimelinePhaseSummaryV0();
  return entry;
}

/**
 * @param {ReturnType<import("./voiceTranscriptConfidenceRouterV0.js").routeVoiceTranscriptConfidenceV0>} route
 * @param {{ preview?: string, source?: string, stage?: string, atMs?: number }} [detail]
 */
export function recordVoiceTimelineFromRouteV0(route, detail = {}) {
  if (!route) return null;
  const kind = route.executionAccepted
    ? VOICE_TIMELINE_EVENT_KIND_V0.EXECUTION_DISPATCH
    : route.observationForward
      ? VOICE_TIMELINE_EVENT_KIND_V0.SHADOW_FORWARD
      : VOICE_TIMELINE_EVENT_KIND_V0.NOOP;
  return recordVoiceTimelineEventV0({
    kind,
    preview: detail.preview,
    source: detail.source || route.source,
    stage: detail.stage,
    atMs: detail.atMs,
    band: route.band,
    reason: route.reason,
    rejectionLayer: route.rejectionLayer,
    executionAccepted: route.executionAccepted,
    observationForward: route.observationForward,
    confidence: route.confidence
  });
}

/**
 * @param {object[]} [evts]
 * @param {{ bucketMs?: number }} [opts]
 */
export function buildVoiceShadowTimelineSegmentsV0(evts = events, opts = {}) {
  const bucketMs = getVoiceTimelineBucketMsV0(opts);
  if (!evts.length || sessionAnchorMs == null) {
    return Object.freeze({
      bucketMs,
      sessionAnchorMs,
      segments: Object.freeze([]),
      spanMs: 0
    });
  }

  const lastAt = evts[evts.length - 1].atMs;
  const spanMs = Math.max(0, lastAt - sessionAnchorMs);
  const bucketCount = Math.max(1, Math.ceil(spanMs / bucketMs) || 1);

  /** @type {object[]} */
  const segments = [];

  for (let i = 0; i < bucketCount; i += 1) {
    const startMs = i * bucketMs;
    const endMs = (i + 1) * bucketMs;
    const slice = evts.filter((e) => e.offsetMs >= startMs && e.offsetMs < endMs);
    if (!slice.length) continue;

    const counts = {
      interaction: 0,
      sanity: 0,
      execution: 0,
      noop: 0,
      shadow_forward: 0,
      execution_dispatch: 0
    };

    for (const e of slice) {
      const layer = String(e.rejectionLayer || "");
      if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION) counts.interaction += 1;
      else if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.SANITY) counts.sanity += 1;
      else if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.EXECUTION) counts.execution += 1;
      else if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.NOOP) counts.noop += 1;
      if (e.kind === VOICE_TIMELINE_EVENT_KIND_V0.SHADOW_FORWARD) counts.shadow_forward += 1;
      if (e.kind === VOICE_TIMELINE_EVENT_KIND_V0.EXECUTION_DISPATCH) counts.execution_dispatch += 1;
    }

    const total = slice.length;
    const phaseLabel = labelTimelineSegmentV0(counts, slice);
    const dominantLayer = dominantLayerFromCountsV0(counts);

    segments.push(
      Object.freeze({
        index: i,
        startMs,
        endMs,
        label: `${formatTimelineOffsetV0(startMs)}–${formatTimelineOffsetV0(endMs)}`,
        phaseLabel,
        narrative: narrativeForPhaseV0(phaseLabel),
        eventCount: total,
        dominantLayer,
        counts: Object.freeze({ ...counts }),
        avgConfidence: averageConfidenceV0(slice),
        samplePreviews: Object.freeze(slice.slice(-3).map((e) => e.preview).filter(Boolean))
      })
    );
  }

  return Object.freeze({
    bucketMs,
    sessionAnchorMs,
    spanMs,
    segments: Object.freeze(segments)
  });
}

/**
 * @param {Record<string, number>} counts
 * @param {object[]} slice
 */
function labelTimelineSegmentV0(counts, slice) {
  const ambient = slice.filter((e) => e.band === "ambient").length;
  if (ambient >= Math.max(2, slice.length * 0.6)) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.AMBIENT_NOISE_FIELD;
  }
  if (counts.execution_dispatch >= 1) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.EXECUTION_EMERGENCE;
  }
  if (counts.interaction >= 2 && counts.interaction >= counts.sanity) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.INTERACTION_REJECTION_SPIKE;
  }
  if (counts.sanity >= 2 && counts.sanity > counts.interaction) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.SANITY_REJECTION_FIELD;
  }
  if (counts.interaction >= 1 && counts.sanity >= 1) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.CONFIDENCE_STABILIZATION;
  }
  if (counts.shadow_forward >= 1 && counts.execution_dispatch === 0) {
    return VOICE_TIMELINE_PHASE_LABEL_V0.OBSERVATION_ACCUMULATION;
  }
  if (totalEvents(slice) > 0) return VOICE_TIMELINE_PHASE_LABEL_V0.MIXED_OBSERVATION;
  return VOICE_TIMELINE_PHASE_LABEL_V0.IDLE;
}

function totalEvents(slice) {
  return slice.length;
}

/**
 * @param {Record<string, number>} counts
 */
function dominantLayerFromCountsV0(counts) {
  const ranked = [
    ["interaction", counts.interaction],
    ["sanity", counts.sanity],
    ["execution", counts.execution],
    ["noop", counts.noop]
  ].sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 0 ? ranked[0][0] : "none";
}

/**
 * @param {string} phaseLabel
 */
function narrativeForPhaseV0(phaseLabel) {
  const map = Object.freeze({
    [VOICE_TIMELINE_PHASE_LABEL_V0.INTERACTION_REJECTION_SPIKE]:
      "Turn confidence blocks dominate; speech observed but not executed.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.SANITY_REJECTION_FIELD]:
      "Quality/artifact-safe rejection cluster; epistemic caution high.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.CONFIDENCE_STABILIZATION]:
      "Sanity and interaction layers alternate; system holding threshold.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.EXECUTION_EMERGENCE]:
      "Execution path opened; transcript entered dispatch/LLM channel.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.AMBIENT_NOISE_FIELD]:
      "Ambient band dominates; no-op observation only.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.OBSERVATION_ACCUMULATION]:
      "Shadow-forward only; memory ring grows without execution.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.MIXED_OBSERVATION]: "Mixed observation signals; no clear phase lock.",
    [VOICE_TIMELINE_PHASE_LABEL_V0.IDLE]: "No cognition events in window."
  });
  return map[phaseLabel] || phaseLabel;
}

/**
 * @param {object[]} slice
 */
function averageConfidenceV0(slice) {
  const vals = slice.map((e) => e.confidence).filter((c) => Number.isFinite(c));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * @param {number} ms
 */
function formatTimelineOffsetV0(ms) {
  const s = Math.round(ms / 1000);
  return `${s}s`;
}

/**
 * Full temporal cognition view for ops / export.
 */
export function buildVoiceShadowTimelineViewV0(opts = {}) {
  const segments = buildVoiceShadowTimelineSegmentsV0(events, opts);
  const trajectory = deriveTimelineTrajectoryV0(segments.segments);

  return Object.freeze({
    schema: VOICE_SHADOW_TIMELINE_SCHEMA,
    view: "temporal_cognition",
    policyAuthority: "observation_only",
    learningDecision: "none",
    atMs: Date.now(),
    eventCount: events.length,
    events: Object.freeze([...events]),
    ...segments,
    trajectory
  });
}

/**
 * @param {object[]} segments
 */
function deriveTimelineTrajectoryV0(segments = []) {
  if (!segments.length) {
    return Object.freeze({ summary: "insufficient_timeline", phases: Object.freeze([]) });
  }
  const phases = segments.map((s) =>
    Object.freeze({
      window: s.label,
      phaseLabel: s.phaseLabel,
      narrative: s.narrative
    })
  );
  const last = segments[segments.length - 1];
  const first = segments[0];
  let summary = "observation_session";
  if (last.phaseLabel === VOICE_TIMELINE_PHASE_LABEL_V0.EXECUTION_EMERGENCE) {
    summary = "observation_to_execution";
  } else if (first.phaseLabel === VOICE_TIMELINE_PHASE_LABEL_V0.INTERACTION_REJECTION_SPIKE) {
    summary = "interaction_friction_without_execution";
  }

  return Object.freeze({ summary, phases: Object.freeze(phases) });
}

function maybeEmitTimelinePhaseSummaryV0() {
  if (events.length < 2) return;
  const now = Date.now();
  if (now - lastPhaseEmitAtMs < PHASE_EMIT_GAP_MS) return;
  lastPhaseEmitAtMs = now;

  const view = buildVoiceShadowTimelineViewV0();
  const latest = view.segments[view.segments.length - 1];
  if (!latest) return;

  logVoiceInfoV0("SHADOW_TIMELINE_PHASE", {
    window: latest.label,
    phaseLabel: latest.phaseLabel,
    trajectory: view.trajectory.summary,
    eventCount: view.eventCount
  });
}

function publishTimelineWindowV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceShadowTimeline = buildVoiceShadowTimelineViewV0();
}

export function getVoiceShadowTimelineEventsV0() {
  return Object.freeze([...events]);
}

export function resetVoiceShadowTimelineForTestV0() {
  sessionAnchorMs = null;
  events.length = 0;
  lastPhaseEmitAtMs = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.voiceShadowTimeline;
  }
}

export function installVoiceShadowTimelineV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.getVoiceShadowTimelineViewV0 = () => buildVoiceShadowTimelineViewV0();
}
