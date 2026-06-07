/**
 * Rhizoh Safety Reflex Layer v0 — emergency mini-signal core.
 * Parallel to transcript acceptance: may be wrong, cannot be late.
 * Observation + lightweight notify only — never normal chat / LLM turn.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { getContinuityKernelSnapshotV0, CONTINUITY_STATE_V0 } from "./rhizohContinuityKernelV0.js";
import { speakVoiceInstantAckV0 } from "./voiceInstantAckV0.js";

export const RHIZOH_EMERGENCY_SIGNAL_LAYER_SCHEMA_V0 = "rhizoh.emergency_signal_layer.v0";

export const EMERGENCY_EVENT_KIND_V0 = Object.freeze({
  AUDIO_SPIKE_IMPACT: "AUDIO_SPIKE_IMPACT",
  AUDIO_SUSTAINED_DISTRESS: "AUDIO_SUSTAINED_DISTRESS",
  AUDIO_REPEATED_IMPACT: "AUDIO_REPEATED_IMPACT",
  AUDIO_SILENCE_ANOMALY: "AUDIO_SILENCE_ANOMALY",
  EMERGENCY_KEYWORD_MATCH: "EMERGENCY_KEYWORD_MATCH",
  BEHAVIORAL_ANOMALY_CLUSTER: "BEHAVIORAL_ANOMALY_CLUSTER"
});

export const EMERGENCY_SEVERITY_V0 = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

export const EMERGENCY_ACTION_V0 = Object.freeze({
  SILENT_LOG: "silent_log",
  NOTIFY: "notify",
  ESCALATE: "escalate"
});

const EMIT_THRESHOLD_V0 = 0.75;
const HIGH_THRESHOLD_V0 = 0.88;
const EMIT_COOLDOWN_MS_V0 = 120_000;
const ACOUSTIC_RING_MAX_V0 = 24;
const BEHAVIOR_RING_MAX_V0 = 16;
const SIGNAL_RING_MAX_V0 = 32;

/** Partial / fuzzy emergency lexicon — transcript perfection not required. */
const EMERGENCY_KEYWORD_PATTERNS_V0 = [
  { re: /\b(yard[iı]m|yard\.{0,3}|yar\.{0,3})\b/i, weight: 0.82, label: "yardim" },
  { re: /\b(imdat|imd\.{0,3}|imda\.{0,3})\b/i, weight: 0.9, label: "imdat" },
  { re: /\b(d[uü]şt[uü]m|dustu|d[uü]s\.{0,3})\b/i, weight: 0.86, label: "dustu" },
  { re: /\b(acil|aci\.{0,3})\b/i, weight: 0.78, label: "acil" },
  { re: /\b(help|emergency|mayday)\b/i, weight: 0.84, label: "help_en" },
  { re: /\b(kurtar|kurtar[iı]n)\b/i, weight: 0.8, label: "kurtar" }
];

const NOTIFY_PHRASE_TR_V0 = "Yardım sinyali algıladım. Güvende misin?";
const NOTIFY_PHRASE_EN_V0 = "I detected a help signal. Are you safe?";

/** @type {object[]} */
const acousticRingV0 = [];
/** @type {object[]} */
const behaviorRingV0 = [];
/** @type {object[]} */
const signalRingV0 = [];
/** @type {object | null} */
let lastEmitV0 = null;
/** @type {number} */
let lastEmitAtMsV0 = 0;
/** @type {number} */
let micRestartCountWindowV0 = 0;
/** @type {number} */
let micRestartWindowStartMsV0 = 0;

function publishEmergencyV0() {
  if (typeof window === "undefined") return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.emergencySignals = getEmergencySignalsSnapshotV0();
  } catch {
    /* noop */
  }
}

function pushRingV0(ring, row, max) {
  ring.push(Object.freeze(row));
  while (ring.length > max) ring.shift();
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {{ maxRms?: number, recordedMs?: number, sessionId?: string, source?: string }} sample
 */
export function noteAcousticSampleV0(sample = {}) {
  const maxRms = Number(sample.maxRms);
  const recordedMs = Number(sample.recordedMs) || 0;
  const atMs = Date.now();
  const row = Object.freeze({
    atMs,
    maxRms: Number.isFinite(maxRms) ? maxRms : null,
    recordedMs,
    sessionId: sample.sessionId ? String(sample.sessionId) : undefined,
    source: sample.source ? String(sample.source) : "mic_v3"
  });
  pushRingV0(acousticRingV0, row, ACOUSTIC_RING_MAX_V0);

  const events = detectAcousticEventsV0(row);
  for (const ev of events) {
    pushSignalV0(ev);
  }
  publishEmergencyV0();
  return row;
}

function detectAcousticEventsV0(sample) {
  const events = [];
  const rms = Number(sample.maxRms);
  if (!Number.isFinite(rms)) return events;

  const recent = acousticRingV0.slice(-8);
  const baseline =
    recent.length > 1
      ? recent.slice(0, -1).reduce((s, r) => s + (Number(r.maxRms) || 0), 0) / (recent.length - 1)
      : 0;

  if (rms >= 0.16 || (rms >= 0.1 && rms - baseline >= 0.08)) {
    events.push(
      buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.AUDIO_SPIKE_IMPACT, clamp01(rms / 0.22), {
        maxRms: rms,
        baseline: Number(baseline.toFixed(4)),
        channel: "audio"
      })
    );
  }

  if (rms >= 0.06 && sample.recordedMs >= 3500) {
    events.push(
      buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.AUDIO_SUSTAINED_DISTRESS, clamp01(0.55 + rms * 1.2), {
        maxRms: rms,
        recordedMs: sample.recordedMs,
        channel: "audio"
      })
    );
  }

  const spikeTimes = recent
    .filter((r) => Number(r.maxRms) >= 0.12)
    .map((r) => r.atMs);
  if (spikeTimes.length >= 3 && sample.atMs - spikeTimes[0] <= 10_000) {
    events.push(
      buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.AUDIO_REPEATED_IMPACT, 0.78, {
        spikeCount: spikeTimes.length,
        windowMs: sample.atMs - spikeTimes[0],
        channel: "audio"
      })
    );
  }

  const prev = recent.length >= 2 ? recent[recent.length - 2] : null;
  if (
    prev &&
    Number(prev.maxRms) >= 0.05 &&
    rms <= 0.015 &&
    sample.recordedMs >= 1500
  ) {
    events.push(
      buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.AUDIO_SILENCE_ANOMALY, 0.62, {
        priorRms: prev.maxRms,
        maxRms: rms,
        channel: "audio"
      })
    );
  }

  return events;
}

/**
 * Fuzzy emergency keyword match — works on partial / low-confidence STT.
 * @param {{ text?: string, confidence?: number, source?: string }} opts
 */
export function notePartialTranscriptForEmergencyV0(opts = {}) {
  const text = String(opts.text || "").trim();
  if (text.length < 3) return null;

  let best = null;
  for (const pat of EMERGENCY_KEYWORD_PATTERNS_V0) {
    if (pat.re.test(text)) {
      const conf = clamp01(
        pat.weight * (Number.isFinite(Number(opts.confidence)) ? 0.65 + Number(opts.confidence) * 0.35 : 0.72)
      );
      if (!best || conf > best.confidence) {
        best = { label: pat.label, confidence: conf };
      }
    }
  }
  if (!best) return null;

  const ev = buildSignalEventV0(
    EMERGENCY_EVENT_KIND_V0.EMERGENCY_KEYWORD_MATCH,
    best.confidence,
    {
      preview: text.slice(0, 96),
      keyword: best.label,
      sttConfidence: Number.isFinite(Number(opts.confidence)) ? Number(opts.confidence) : undefined,
      source: opts.source || "partial_transcript",
      channel: "speech"
    }
  );
  pushSignalV0(ev);
  publishEmergencyV0();
  return ev;
}

/**
 * @param {{ kind?: string, context?: string, meta?: object }} marker
 */
export function noteBehavioralMarkerV0(marker = {}) {
  const row = Object.freeze({
    atMs: Date.now(),
    kind: String(marker.kind || "unknown"),
    context: marker.context ? String(marker.context) : undefined,
    meta: marker.meta && typeof marker.meta === "object" ? Object.freeze({ ...marker.meta }) : undefined
  });
  pushRingV0(behaviorRingV0, row, BEHAVIOR_RING_MAX_V0);

  if (marker.kind === "mic_restart") {
    const now = Date.now();
    if (now - micRestartWindowStartMsV0 > 60_000) {
      micRestartWindowStartMsV0 = now;
      micRestartCountWindowV0 = 0;
    }
    micRestartCountWindowV0 += 1;
  }

  publishEmergencyV0();
  return row;
}

/**
 * Cluster: mic restarts + STT failures + distress audio within window.
 */
export function evaluateBehavioralAnomalyClusterV0() {
  const now = Date.now();
  const windowMs = 45_000;
  const recentBehavior = behaviorRingV0.filter((b) => now - b.atMs <= windowMs);
  const recentAudio = acousticRingV0.filter((a) => now - a.atMs <= windowMs);

  const restarts = recentBehavior.filter((b) => b.kind === "mic_restart").length;
  const shadowDrops = recentBehavior.filter((b) => b.kind === "stt_shadow_drop").length;
  const strongAudio = recentAudio.filter((a) => Number(a.maxRms) >= 0.07).length;
  const listening = getContinuityKernelSnapshotV0().state === CONTINUITY_STATE_V0.LISTENING;

  if (restarts >= 2 && (shadowDrops >= 1 || strongAudio >= 1)) {
    const score = clamp01(0.45 + restarts * 0.08 + shadowDrops * 0.1 + strongAudio * 0.12);
    return buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.BEHAVIORAL_ANOMALY_CLUSTER, score, {
      restarts,
      shadowDrops,
      strongAudio,
      listening,
      channel: "behavior"
    });
  }
  if (listening && restarts >= 3 && strongAudio >= 2) {
    return buildSignalEventV0(EMERGENCY_EVENT_KIND_V0.BEHAVIORAL_ANOMALY_CLUSTER, 0.74, {
      restarts,
      strongAudio,
      listening,
      channel: "behavior"
    });
  }
  return null;
}

function buildSignalEventV0(kind, confidence, extra = {}) {
  return Object.freeze({
    schema: RHIZOH_EMERGENCY_SIGNAL_LAYER_SCHEMA_V0,
    event: kind,
    confidence: clamp01(confidence),
    atMs: Date.now(),
    ...extra
  });
}

function pushSignalV0(ev) {
  pushRingV0(signalRingV0, ev, SIGNAL_RING_MAX_V0);
}

/**
 * Compute composite risk from recent signals (last 30s).
 */
export function computeEmergencyRiskScoreV0() {
  const now = Date.now();
  const recent = signalRingV0.filter((s) => now - s.atMs <= 30_000);

  let audioSpike = 0;
  let keywordMatch = 0;
  let behaviorAnomaly = 0;

  for (const s of recent) {
    if (
      s.event === EMERGENCY_EVENT_KIND_V0.AUDIO_SPIKE_IMPACT ||
      s.event === EMERGENCY_EVENT_KIND_V0.AUDIO_SUSTAINED_DISTRESS ||
      s.event === EMERGENCY_EVENT_KIND_V0.AUDIO_REPEATED_IMPACT ||
      s.event === EMERGENCY_EVENT_KIND_V0.AUDIO_SILENCE_ANOMALY
    ) {
      audioSpike = Math.max(audioSpike, s.confidence);
    }
    if (s.event === EMERGENCY_EVENT_KIND_V0.EMERGENCY_KEYWORD_MATCH) {
      keywordMatch = Math.max(keywordMatch, s.confidence);
    }
    if (s.event === EMERGENCY_EVENT_KIND_V0.BEHAVIORAL_ANOMALY_CLUSTER) {
      behaviorAnomaly = Math.max(behaviorAnomaly, s.confidence);
    }
  }

  const cluster = evaluateBehavioralAnomalyClusterV0();
  if (cluster) {
    pushSignalV0(cluster);
    behaviorAnomaly = Math.max(behaviorAnomaly, cluster.confidence);
  }

  const riskScore = clamp01(audioSpike * 0.4 + keywordMatch * 0.3 + behaviorAnomaly * 0.3);

  return Object.freeze({
    riskScore: Number(riskScore.toFixed(3)),
    audioSpike: Number(audioSpike.toFixed(3)),
    keywordMatch: Number(keywordMatch.toFixed(3)),
    behaviorAnomaly: Number(behaviorAnomaly.toFixed(3)),
    signalCount: recent.length,
    atMs: now
  });
}

function resolveSeverityAndActionV0(riskScore) {
  if (riskScore >= HIGH_THRESHOLD_V0) {
    return Object.freeze({
      severity: EMERGENCY_SEVERITY_V0.HIGH,
      action: EMERGENCY_ACTION_V0.NOTIFY
    });
  }
  if (riskScore >= EMIT_THRESHOLD_V0) {
    return Object.freeze({
      severity: EMERGENCY_SEVERITY_V0.MEDIUM,
      action: EMERGENCY_ACTION_V0.NOTIFY
    });
  }
  if (riskScore >= 0.55) {
    return Object.freeze({
      severity: EMERGENCY_SEVERITY_V0.LOW,
      action: EMERGENCY_ACTION_V0.SILENT_LOG
    });
  }
  return null;
}

function collectSourcesV0(recent) {
  const sources = new Set();
  for (const s of recent) {
    if (s.channel === "audio") sources.add("audio");
    if (s.channel === "speech") sources.add("speech");
    if (s.channel === "behavior") sources.add("behavior");
  }
  return Object.freeze([...sources]);
}

/**
 * Evaluate and maybe emit EMERGENCY_PRESENCE_EVENT (never normal chat).
 * @param {{ pulseSeq?: number }} [ctx]
 */
export function evaluateEmergencyOnPulseV0(ctx = {}) {
  const risk = computeEmergencyRiskScoreV0();
  const now = Date.now();

  if (risk.riskScore < EMIT_THRESHOLD_V0) {
    return Object.freeze({ emitted: false, risk });
  }

  if (lastEmitAtMsV0 && now - lastEmitAtMsV0 < EMIT_COOLDOWN_MS_V0) {
    if (risk.riskScore <= (lastEmitV0?.riskScore ?? 0) + 0.05) {
      return Object.freeze({ emitted: false, risk, throttled: true });
    }
  }

  const recent = signalRingV0.filter((s) => now - s.atMs <= 30_000);
  const { severity, action } = resolveSeverityAndActionV0(risk.riskScore);
  const presenceEvent = Object.freeze({
    type: "EMERGENCY_PRESENCE_EVENT",
    schema: RHIZOH_EMERGENCY_SIGNAL_LAYER_SCHEMA_V0,
    severity,
    source: collectSourcesV0(recent),
    action,
    riskScore: risk.riskScore,
    audioSpike: risk.audioSpike,
    keywordMatch: risk.keywordMatch,
    behaviorAnomaly: risk.behaviorAnomaly,
    signals: Object.freeze(recent.slice(-6)),
    pulseSeq: ctx.pulseSeq ?? null,
    atMs: now,
    chatBypass: true,
    llmBypass: true
  });

  lastEmitV0 = presenceEvent;
  lastEmitAtMsV0 = now;

  logVoiceInfoV0("EMERGENCY_PRESENCE_EVENT", {
    severity,
    action,
    riskScore: risk.riskScore,
    sources: presenceEvent.source,
    signalCount: recent.length
  });

  if (action === EMERGENCY_ACTION_V0.NOTIFY && typeof window !== "undefined") {
    const tr =
      typeof document !== "undefined" && document.documentElement?.lang === "tr";
    speakVoiceInstantAckV0(tr ? NOTIFY_PHRASE_TR_V0 : NOTIFY_PHRASE_EN_V0, {
      traceId: `emergency_${now}`,
      moduleId: "emergency_signal_layer",
      semanticIntent: "emergency_notify"
    });
    try {
      window.dispatchEvent(
        new CustomEvent("rhizoh:emergency_presence", { detail: presenceEvent })
      );
    } catch {
      /* noop */
    }
  }

  publishEmergencyV0();
  return Object.freeze({ emitted: true, risk, event: presenceEvent });
}

/**
 * Ingest hook from voice pipeline — acoustic + partial transcript + behavior.
 * @param {{ text?: string, confidence?: number, maxRms?: number, recordedMs?: number, sessionId?: string, shadowDrop?: boolean, restartCtx?: string }} payload
 */
export function ingestVoiceSessionForEmergencyV0(payload = {}) {
  if (Number.isFinite(Number(payload.maxRms)) || Number.isFinite(Number(payload.recordedMs))) {
    noteAcousticSampleV0({
      maxRms: payload.maxRms,
      recordedMs: payload.recordedMs,
      sessionId: payload.sessionId,
      source: "mic_v3"
    });
  }

  if (payload.text) {
    notePartialTranscriptForEmergencyV0({
      text: payload.text,
      confidence: payload.confidence,
      source: payload.shadowDrop ? "partial_transcript_shadow" : "partial_transcript"
    });
  }

  if (payload.shadowDrop) {
    noteBehavioralMarkerV0({
      kind: "stt_shadow_drop",
      context: payload.restartCtx || "shadow_drop",
      meta: { preview: String(payload.text || "").slice(0, 48) }
    });
  }
  if (payload.restartCtx) {
    noteBehavioralMarkerV0({ kind: "mic_restart", context: payload.restartCtx });
  }

  return computeEmergencyRiskScoreV0();
}

export function getEmergencySignalsSnapshotV0() {
  const risk = computeEmergencyRiskScoreV0();
  return Object.freeze({
    schema: RHIZOH_EMERGENCY_SIGNAL_LAYER_SCHEMA_V0,
    risk,
    threshold: EMIT_THRESHOLD_V0,
    lastEmit: lastEmitV0,
    lastEmitAtMs: lastEmitAtMsV0 || null,
    signalTail: Object.freeze(signalRingV0.slice(-12)),
    acousticTail: Object.freeze(acousticRingV0.slice(-8)),
    behaviorTail: Object.freeze(behaviorRingV0.slice(-8)),
    policy: "false_positive_tolerated_false_negative_unacceptable"
  });
}

export function __resetEmergencySignalLayerForTestV0() {
  acousticRingV0.length = 0;
  behaviorRingV0.length = 0;
  signalRingV0.length = 0;
  lastEmitV0 = null;
  lastEmitAtMsV0 = 0;
  micRestartCountWindowV0 = 0;
  micRestartWindowStartMsV0 = 0;
  publishEmergencyV0();
}
