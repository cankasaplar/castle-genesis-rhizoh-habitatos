/**
 * Behavioral Drift Engine v0 — long-term calibration observability (RESEARCH-ONLY).
 * Does NOT influence authority selection — read-only drift report for founder/ops.
 */

import { getTurnSovereigntyTraceV0 } from "./behavioralTurnSovereigntyV0.js";
import { buildTurnBehaviorConsistencyFieldV0 } from "./turnBehaviorConsistencyFieldV0.js";
import { SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0 } from "./turnSovereigntyObservationExecutionInvariantV0.js";
import { publishCalibrationGovernorV0 } from "./rhizohCalibrationGovernorV0.js";

export const TURN_BEHAVIORAL_DRIFT_ENGINE_SCHEMA_V0 = "castle.rhizoh.behavioral_drift_engine.v0";

const DRIFT_SNAPSHOT_STORAGE_KEY_V0 = "rhizoh.behavioral_drift_snapshots.v0";
const MAX_SNAPSHOTS_V0 = 96;

function readEnvOnV0(name) {
  try {
    return String(import.meta.env?.[name] || "") === "1";
  } catch {
    return false;
  }
}

/**
 * @param {object[]} trace
 */
function authorityVolatilityScoreV0(trace) {
  if (trace.length < 2) return 0;
  let flips = 0;
  for (let i = 1; i < trace.length; i++) {
    if (trace[i]?.sovereignReality !== trace[i - 1]?.sovereignReality) flips += 1;
  }
  return Math.round((flips / (trace.length - 1)) * 1000) / 1000;
}

/**
 * @param {Record<string, number>} dist
 */
function distributionEntropyV0(dist) {
  const entries = Object.entries(dist || {}).filter(([, v]) => Number(v) > 0);
  const total = entries.reduce((a, [, v]) => a + Number(v), 0);
  if (!total) return 0;
  let h = 0;
  for (const [, v] of entries) {
    const p = Number(v) / total;
    h -= p * Math.log2(p);
  }
  return h;
}

/**
 * @param {object[]} trace
 */
function identityCoherenceMetricV0(trace) {
  if (!trace.length) return 1;
  const dist = {};
  for (const t of trace) {
    const r = String(t?.sovereignReality || "unknown");
    dist[r] = (dist[r] || 0) + 1;
  }
  const entropy = distributionEntropyV0(dist);
  const maxEntropy = Math.log2(Math.max(2, Object.keys(dist).length));
  const norm = maxEntropy > 0 ? entropy / maxEntropy : 0;
  return Math.round((1 - norm) * 1000) / 1000;
}

/**
 * @param {object[]} trace
 */
function presenceStabilityIndexV0(trace) {
  if (trace.length < 4) return 1;
  const window = 4;
  const rates = [];
  for (let i = window; i <= trace.length; i++) {
    const slice = trace.slice(i - window, i);
    const rate = slice.filter((t) => t?.sovereignReality === "presence_ack").length / window;
    rates.push(rate);
  }
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, r) => a + (r - mean) ** 2, 0) / rates.length;
  return Math.round(Math.max(0, 1 - Math.min(1, variance * 4)) * 1000) / 1000;
}

/**
 * @param {object[]} trace
 */
function cubeFoxInfluenceSnapshotV0(trace) {
  let fox = 0;
  let octo = 0;
  let none = 0;
  for (const t of trace) {
    const sp = t?.advisory?.cubeFox?.observerSpecies;
    if (sp === "fox_v1") fox += 1;
    else if (sp === "octo_v1") octo += 1;
    else none += 1;
  }
  const n = trace.length || 1;
  return Object.freeze({
    foxShare: Math.round((fox / n) * 1000) / 1000,
    octoShare: Math.round((octo / n) * 1000) / 1000,
    unattributedShare: Math.round((none / n) * 1000) / 1000
  });
}

/**
 * @param {object[]} history
 * @param {object} currentFox
 */
function cubeFoxInfluenceDecayV0(history, currentFox) {
  if (!history.length) {
    return Object.freeze({ decay: 0, trend: "insufficient_data", note: "no_prior_snapshots" });
  }
  const prior = history[history.length - 1]?.cubeFox || currentFox;
  const deltaFox = (currentFox.foxShare || 0) - (prior.foxShare || 0);
  const deltaOcto = (currentFox.octoShare || 0) - (prior.octoShare || 0);
  const decay = Math.round((Math.abs(deltaFox) + Math.abs(deltaOcto)) * 1000) / 1000;
  const trend =
    Math.abs(deltaFox) < 0.05 && Math.abs(deltaOcto) < 0.05
      ? "stable"
      : deltaFox > 0.08
        ? "fox_bias_rising"
        : deltaFox < -0.08
          ? "fox_bias_falling"
          : "shifting";
  return Object.freeze({ decay, trend, deltaFox, deltaOcto });
}

function loadDriftSnapshotsV0() {
  if (typeof localStorage === "undefined" || !readEnvOnV0("VITE_RHIZOH_BEHAVIORAL_DRIFT_PERSIST")) {
    return [];
  }
  try {
    const raw = localStorage.getItem(DRIFT_SNAPSHOT_STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistDriftSnapshotV0(snapshot) {
  if (typeof localStorage === "undefined" || !readEnvOnV0("VITE_RHIZOH_BEHAVIORAL_DRIFT_PERSIST")) {
    return;
  }
  try {
    const prev = loadDriftSnapshotsV0();
    prev.push(snapshot);
    while (prev.length > MAX_SNAPSHOTS_V0) prev.shift();
    localStorage.setItem(DRIFT_SNAPSHOT_STORAGE_KEY_V0, JSON.stringify(prev));
  } catch {
    /* noop */
  }
}

/**
 * @param {object[]} history
 */
function sevenDayPatternHintV0(history) {
  if (history.length < 8) {
    return Object.freeze({
      window: "session",
      ready: false,
      note: "Enable VITE_RHIZOH_BEHAVIORAL_DRIFT_PERSIST=1 for multi-session 7d window"
    });
  }
  const recent = history.slice(-24);
  const older = history.slice(0, Math.max(0, history.length - 24));
  const avg = (arr, key) =>
    arr.length ? arr.reduce((a, s) => a + (Number(s?.rates?.[key]) || 0), 0) / arr.length : 0;
  const silentDelta = avg(recent, "silentObserve") - avg(older, "silentObserve");
  const presenceDelta = avg(recent, "presenceAck") - avg(older, "presenceAck");
  return Object.freeze({
    window: history.length >= 48 ? "extended" : "building",
    ready: true,
    silentObserveDelta: Math.round(silentDelta * 1000) / 1000,
    presenceAckDelta: Math.round(presenceDelta * 1000) / 1000,
    interpretation:
      silentDelta > 0.12
        ? "Rhizoh trending quieter over observed window"
        : presenceDelta > 0.15
          ? "Presence-dominant drift — check wake/presence testing load"
          : "Behavior curve stable over observed window"
  });
}

export function buildTurnBehavioralDriftReportV0() {
  const trace = getTurnSovereigntyTraceV0();
  const consistency = buildTurnBehaviorConsistencyFieldV0();
  const cubeFox = cubeFoxInfluenceSnapshotV0(trace);
  const history = loadDriftSnapshotsV0();

  const snapshot = Object.freeze({
    atMs: Date.now(),
    rates: consistency.rates,
    cubeFox,
    authorityVolatility: authorityVolatilityScoreV0(trace),
    presenceStability: presenceStabilityIndexV0(trace),
    identityCoherence: identityCoherenceMetricV0(trace)
  });
  persistDriftSnapshotV0(snapshot);

  const selfExplanation = buildSelfExplanationV0(trace, consistency);
  const report = Object.freeze({
    schema: TURN_BEHAVIORAL_DRIFT_ENGINE_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesAuthority: false,
    layerWeightPolicy: SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0,
    metrics: Object.freeze({
      presenceStabilityIndex: presenceStabilityIndexV0(trace),
      authorityVolatilityScore: authorityVolatilityScoreV0(trace),
      identityCoherenceMetric: identityCoherenceMetricV0(trace),
      cubeFoxInfluenceDecay: cubeFoxInfluenceDecayV0(history, cubeFox)
    }),
    consistency: consistency,
    sevenDayPattern: sevenDayPatternHintV0([...history, snapshot]),
    selfExplanation,
    founderOnly: Object.freeze({
      selfExplanation,
      executionSurfaceSafe: false,
      note: "Never inject into system prompt / LLM context / TTS — founder console only."
    }),
    snapshotCount: history.length + (readEnvOnV0("VITE_RHIZOH_BEHAVIORAL_DRIFT_PERSIST") ? 1 : 0)
  });

  return report;
}

/**
 * @param {object[]} trace
 * @param {object} consistency
 */
function buildSelfExplanationV0(trace, consistency) {
  if (!trace.length) {
    return "No turns observed yet — behavioral curve not established.";
  }
  const top = Object.entries(consistency.realityDistribution || {}).sort((a, b) => b[1] - a[1])[0];
  const dominant = top ? top[0] : "unknown";
  const signals = (consistency.driftSignals || []).map((s) => s.code).join(", ") || "none";
  return [
    `Dominant reality: ${dominant}.`,
    `Presence stability: ${presenceStabilityIndexV0(trace).toFixed(2)}, authority volatility: ${authorityVolatilityScoreV0(trace).toFixed(2)}.`,
    `Identity coherence: ${identityCoherenceMetricV0(trace).toFixed(2)}.`,
    `Drift signals: ${signals}.`,
    "Observation layer does not influence authority selection."
  ].join(" ");
}

export function publishTurnBehavioralDriftReportV0() {
  const report = buildTurnBehavioralDriftReportV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.behavioralDrift = report;
    window.__rhizoh.exportBehavioralDriftReportV0 = () => buildTurnBehavioralDriftReportV0();
  }
  publishCalibrationGovernorV0();
  return report;
}
