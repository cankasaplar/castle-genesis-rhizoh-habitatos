/**
 * Phase 9.4.4b — Replay-only Feedback Analysis Layer.
 *
 * Post-hoc trace correlation + pattern detection.
 * Does NOT write witness semantics, navigation physics, or execution state.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15.4b
 */

import { EPISTEMIC_EVENT_CLASS_V0 } from "./epistemicEventBusV0.js";
import { OBSERVER_ACTION_KIND_V0 } from "./epistemicObserverTelemetryContractV0.js";
import { EPISTEMIC_PHYSICS_EVENT_KIND_V0 } from "./epistemicPhysicsEventContractV0.js";

export const REPLAY_FEEDBACK_ANALYSIS_SCHEMA_V0 =
  "castle.rhizoh.replay_feedback_analysis.v0.4.4b";

export const REPLAY_ANALYSIS_MODE_V0 = "replay_only";

const DEFAULT_CORRELATION_WINDOW_MS_V0 = 800;
const DEFAULT_CORRELATION_WINDOW_FRAMES_V0 = 12;

/**
 * @typedef {Object} TraceCorrelationV0
 * @property {number} observerSeq
 * @property {number} physicsSeq
 * @property {number} deltaMs
 * @property {number} deltaFrame
 * @property {string} observerAction
 * @property {string} physicsKind
 * @property {string} nodeId
 * @property {number} strength
 */

/**
 * @typedef {Object} EpistemicPatternV0
 * @property {string} id
 * @property {string} kind
 * @property {number} severity
 * @property {string} summary
 * @property {number[]} evidenceSeqs
 */

/**
 * @typedef {Object} ReplayFeedbackAnalysisReportV0
 * @property {string} schema
 * @property {string} mode
 * @property {boolean} witnessWrite
 * @property {boolean} feedbackLoop
 * @property {number} analyzedAtMs
 * @property {number} traceLength
 * @property {{ min: number, max: number }} seqRange
 * @property {{ observerCount: number, physicsCount: number, correlationCount: number, patternCount: number, dominantPattern: string|null }} summary
 * @property {TraceCorrelationV0[]} correlations
 * @property {EpistemicPatternV0[]} patterns
 */

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 * @param {{ correlationWindowMs?: number, correlationWindowFrames?: number }} [opts]
 * @returns {TraceCorrelationV0[]}
 */
export function correlateObserverToPhysicsV0(trace, opts = {}) {
  const windowMs = Number(opts.correlationWindowMs) || DEFAULT_CORRELATION_WINDOW_MS_V0;
  const windowFrames =
    Number(opts.correlationWindowFrames) || DEFAULT_CORRELATION_WINDOW_FRAMES_V0;

  const sorted = [...trace].sort((a, b) => a.seq - b.seq);
  const observers = sorted.filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER);
  const physics = sorted.filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS);

  /** @type {TraceCorrelationV0[]} */
  const correlations = [];

  for (const obs of observers) {
    const action = obs.observerAction?.action || "";
    for (const phy of physics) {
      if (phy.seq <= obs.seq) continue;
      const deltaMs = phy.atMs - obs.atMs;
      const deltaFrame = phy.atFrame - obs.atFrame;
      if (deltaMs > windowMs || deltaFrame > windowFrames) break;

      const nodeMatch =
        phy.nodeId === obs.nodeId ||
        phy.focusNodeId === obs.focusNodeId ||
        phy.nodeId === obs.focusNodeId;
      if (!nodeMatch && obs.nodeId !== "node:observer") continue;

      const strength = Math.min(
        1,
        (phy.severity || 0.3) * (1 / (1 + deltaMs / 200))
      );
      correlations.push({
        observerSeq: obs.seq,
        physicsSeq: phy.seq,
        deltaMs,
        deltaFrame,
        observerAction: action,
        physicsKind: phy.kind,
        nodeId: phy.nodeId,
        strength: Number(strength.toFixed(4))
      });
    }
  }

  return correlations.sort((a, b) => b.strength - a.strength);
}

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 * @param {TraceCorrelationV0[]} correlations
 * @returns {EpistemicPatternV0[]}
 */
export function detectEpistemicPatternsV0(trace, correlations = []) {
  const sorted = [...trace].sort((a, b) => a.seq - b.seq);
  /** @type {EpistemicPatternV0[]} */
  const patterns = [];

  const physics = sorted.filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS);
  const observers = sorted.filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER);

  const collapseEvents = physics.filter(
    (e) => e.kind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.COHERENCE_COLLAPSE_ATTEMPT
  );
  for (let i = 0; i < collapseEvents.length - 1; i++) {
    const a = collapseEvents[i];
    const b = collapseEvents[i + 1];
    if (b.atFrame - a.atFrame <= 3) {
      patterns.push({
        id: `coherence_burst_${a.seq}`,
        kind: "coherence_collapse_burst",
        severity: Math.min(1, (a.severity + b.severity) / 2),
        summary: "Coherence collapse attempts clustered in causal time.",
        evidenceSeqs: [a.seq, b.seq]
      });
      break;
    }
  }

  const navStress = correlations.filter(
    (c) =>
      c.observerAction === OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV &&
      (c.physicsKind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.TERRAIN_STRESS_PEAK ||
        c.physicsKind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.DRIFT_SPIKE)
  );
  if (navStress.length >= 1) {
    const top = navStress[0];
    patterns.push({
      id: `manifold_nav_stress_${top.observerSeq}`,
      kind: "manifold_nav_precedes_stress",
      severity: top.strength,
      summary: `Manifold navigation followed by ${top.physicsKind} on ${top.nodeId}.`,
      evidenceSeqs: [top.observerSeq, top.physicsSeq]
    });
  }

  const surgeEvents = physics.filter(
    (e) => e.kind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.DISAGREEMENT_SURGE
  );
  if (surgeEvents.length > 0) {
    const e = surgeEvents[surgeEvents.length - 1];
    patterns.push({
      id: `disagreement_surge_${e.seq}`,
      kind: "disagreement_surge_active",
      severity: e.severity,
      summary: "Plural manifold disagreement surge in trace.",
      evidenceSeqs: [e.seq]
    });
  }

  /** @type {Map<string, number>} */
  const observerByNode = new Map();
  for (const o of observers) {
    const nid = o.nodeId || "node:unknown";
    observerByNode.set(nid, (observerByNode.get(nid) || 0) + 1);
  }
  for (const [nodeId, count] of observerByNode) {
    if (count >= 3) {
      patterns.push({
        id: `observer_density_${nodeId}`,
        kind: "observer_density_hotspot",
        severity: Math.min(1, count / 8),
        summary: `High observer action density on ${nodeId} (${count} actions).`,
        evidenceSeqs: observers.filter((o) => o.nodeId === nodeId).map((o) => o.seq)
      });
    }
  }

  const cameraCorr = correlations.filter(
    (c) => c.observerAction === OBSERVER_ACTION_KIND_V0.CAMERA_KEY
  );
  if (cameraCorr.length >= 2) {
    patterns.push({
      id: "camera_key_physics_coupling",
      kind: "camera_key_correlated_physics",
      severity: Math.min(1, cameraCorr.reduce((s, c) => s + c.strength, 0) / cameraCorr.length),
      summary: "Camera input temporally correlated with physics events (perceptual coupling).",
      evidenceSeqs: cameraCorr.slice(0, 4).flatMap((c) => [c.observerSeq, c.physicsSeq])
    });
  }

  return patterns.sort((a, b) => b.severity - a.severity);
}

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 * @param {{ correlationWindowMs?: number, correlationWindowFrames?: number }} [opts]
 * @returns {ReplayFeedbackAnalysisReportV0}
 */
export function runReplayFeedbackAnalysisV0(trace, opts = {}) {
  const events = Array.isArray(trace) ? trace : [];
  const sorted = [...events].sort((a, b) => a.seq - b.seq);

  const observerCount = sorted.filter(
    (e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER
  ).length;
  const physicsCount = sorted.filter(
    (e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS
  ).length;

  const correlations = correlateObserverToPhysicsV0(sorted, opts);
  const patterns = detectEpistemicPatternsV0(sorted, correlations);

  const seqs = sorted.map((e) => e.seq);
  const dominantPattern = patterns.length ? patterns[0].kind : null;

  const report = {
    schema: REPLAY_FEEDBACK_ANALYSIS_SCHEMA_V0,
    mode: REPLAY_ANALYSIS_MODE_V0,
    witnessWrite: false,
    feedbackLoop: false,
    analyzedAtMs: Date.now(),
    traceLength: sorted.length,
    seqRange: {
      min: seqs.length ? Math.min(...seqs) : 0,
      max: seqs.length ? Math.max(...seqs) : 0
    },
    summary: {
      observerCount,
      physicsCount,
      correlationCount: correlations.length,
      patternCount: patterns.length,
      dominantPattern
    },
    correlations,
    patterns
  };

  return Object.freeze(report);
}

/**
 * @param {string} traceJson
 * @returns {ReplayFeedbackAnalysisReportV0}
 */
export function runReplayFeedbackAnalysisFromTraceJsonV0(traceJson) {
  const parsed = JSON.parse(String(traceJson || "{}"));
  const events = Array.isArray(parsed?.events) ? parsed.events : parsed;
  return runReplayFeedbackAnalysisV0(events);
}

/**
 * @param {ReplayFeedbackAnalysisReportV0} [report]
 */
export function exportReplayFeedbackAnalysisJsonV0(report) {
  const r = report || null;
  return JSON.stringify(
    r || { schema: REPLAY_FEEDBACK_ANALYSIS_SCHEMA_V0, mode: REPLAY_ANALYSIS_MODE_V0, empty: true },
    null,
    2
  );
}
