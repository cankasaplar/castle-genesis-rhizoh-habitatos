/**
 * Voice transcribe predictive preflight v1 — route BEFORE upload using warm score + latency trend.
 * Observation / routing only; not layer execution authority.
 */

import { computeGatewayFlapPressure } from "./runtimeFrameCorrelationV0.js";
import { isGatewaySessionStableV1 } from "./gatewaySessionKeeperV1.js";
import { planVoiceTranscribePreflightV3 } from "./voiceEngineV3/voiceTranscribePreflightV3.js";

export const PREDICTIVE_PREFLIGHT_V1 = Object.freeze({
  minWarmScoreToRecord: 0.38,
  maxStartDeferMs: 3_200,
  probeIntervalMs: 900,
  latencyRingMax: 8
});

/** @type {{ sessionId: string, samples: number[], timer: ReturnType<typeof setInterval> | null } | null} */
let recordingProbe = null;

/** @type {{ latencyMs: number, ok: boolean, atMs: number }[]} */
const latencyRing = [];

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function readCoordinatorSnapshotV1() {
  if (typeof window === "undefined") return null;
  return window.__CASTLE_VOICE_TRANSCRIBE_COORDINATOR__ || null;
}

function readKeeperSnapshotV1() {
  if (typeof window === "undefined") return null;
  return window.__CASTLE_GATEWAY_SESSION_KEEPER__ || null;
}

/**
 * Gateway warm readiness score 0..1 (higher = safer to upload).
 */
export function scoreGatewayWarmReadinessV1() {
  const keeper = readKeeperSnapshotV1();
  const coord = readCoordinatorSnapshotV1();
  const flap = computeGatewayFlapPressure();

  let score = 1;
  const now = Date.now();
  const sinceHealth = keeper?.lastHealthOkAt ? now - Number(keeper.lastHealthOkAt) : Infinity;
  const sinceConnect = coord?.lastGatewayConnectAtMs ? now - Number(coord.lastGatewayConnectAtMs) : Infinity;

  if (!isGatewaySessionStableV1()) score -= 0.55;
  if (sinceHealth > 25_000) score -= 0.22;
  if (sinceConnect < 2_800) score -= 0.32;
  if (Number(flap.flips90s) >= 4) score -= 0.18;
  if (flap.level === "hot") score -= 0.12;
  if (Number(coord?.globalBackoffUntilMs) > now) score -= 0.28;

  const warmScore = clamp01(score);
  return Object.freeze({
    warmScore,
    sinceHealthMs: Number.isFinite(sinceHealth) ? sinceHealth : null,
    sinceConnectMs: Number.isFinite(sinceConnect) ? sinceConnect : null,
    flapLevel: flap.level,
    flips90s: flap.flips90s,
    stable: isGatewaySessionStableV1()
  });
}

/**
 * @param {{ latencyMs?: number, ok?: boolean }} sample
 */
export function noteTranscribeLatencySampleV1(sample = {}) {
  const latencyMs = Math.max(0, Number(sample.latencyMs) || 0);
  const ok = sample.ok === true;
  latencyRing.push(Object.freeze({ latencyMs, ok, atMs: Date.now() }));
  while (latencyRing.length > PREDICTIVE_PREFLIGHT_V1.latencyRingMax) latencyRing.shift();
}

export function scoreNetworkLatencyTrendV1() {
  if (!latencyRing.length) {
    return Object.freeze({ risk: "unknown", failRate: 0, avgLatencyMs: 0, samples: 0 });
  }
  const fails = latencyRing.filter((s) => !s.ok).length;
  const failRate = fails / latencyRing.length;
  const avgLatencyMs =
    latencyRing.reduce((sum, s) => sum + s.latencyMs, 0) / Math.max(1, latencyRing.length);
  let risk = "low";
  if (failRate >= 0.5 || avgLatencyMs > 12_000) risk = "high";
  else if (failRate >= 0.25 || avgLatencyMs > 7_000) risk = "medium";
  return Object.freeze({ risk, failRate, avgLatencyMs, samples: latencyRing.length });
}

/**
 * Predict route before upload — merges bytes/duration plan with warm + latency signals.
 * @param {{
 *   bytes?: number,
 *   recordedMs?: number,
 *   chunkCount?: number,
 *   warmProbe?: { avgWarmScore?: number, minWarmScore?: number } | null
 * }} input
 */
export function predictTranscribeRouteV1(input = {}) {
  const bytes = Math.max(0, Number(input.bytes) || 0);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  const chunkCount = Math.max(0, Number(input.chunkCount) || 0);

  const liveWarm = scoreGatewayWarmReadinessV1();
  const probeAvg = Number(input.warmProbe?.avgWarmScore);
  const probeMin = Number(input.warmProbe?.minWarmScore);
  const warmScore = Number.isFinite(probeAvg)
    ? clamp01(probeAvg * 0.65 + liveWarm.warmScore * 0.35)
    : liveWarm.warmScore;
  const minWarmScore = Number.isFinite(probeMin) ? probeMin : warmScore;
  const trend = scoreNetworkLatencyTrendV1();

  let plan = planVoiceTranscribePreflightV3({ bytes, recordedMs, chunkCount });
  let reason = plan.reason;
  let predictiveAction = "keep";

  const coldGateway = warmScore < 0.45 || minWarmScore < 0.32;
  const hotLatency = trend.risk === "high";
  const warmGateway = warmScore >= 0.72 && trend.risk !== "high";

  if (coldGateway || hotLatency) {
    plan = Object.freeze({
      ...plan,
      mode: "direct",
      path: "fast",
      segmentCount: 1,
      reason: hotLatency ? "predictive_latency_direct" : "predictive_cold_gateway"
    });
    reason = plan.reason;
    predictiveAction = "coerce_direct_fast";
  } else if (
    warmGateway &&
    plan.mode === "direct" &&
    recordedMs >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinMs &&
    bytes >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinBytes &&
    chunkCount >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinChunks
  ) {
    plan = Object.freeze({
      ...plan,
      mode: "split",
      path: "accurate",
      segmentCount: 2,
      reason: "predictive_warm_split"
    });
    reason = plan.reason;
    predictiveAction = "promote_split";
  }

  const snapshot = Object.freeze({
    schema: "castle.voice_transcribe_predictive_preflight.v1",
    warmScore,
    minWarmScore,
    liveWarmScore: liveWarm.warmScore,
    latencyRisk: trend.risk,
    latencyFailRate: trend.failRate,
    predictiveAction,
    plan,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    try {
      window.__CASTLE_VOICE_TRANSCRIBE_PREDICTIVE__ = snapshot;
    } catch {
      /* noop */
    }
  }

  return snapshot;
}

/**
 * @param {string} sessionId
 */
export function beginRecordingWarmProbeV1(sessionId) {
  endRecordingWarmProbeV1();
  const sid = String(sessionId || "");
  recordingProbe = {
    sessionId: sid,
    samples: [scoreGatewayWarmReadinessV1().warmScore],
    timer: null
  };
  if (typeof window !== "undefined") {
    recordingProbe.timer = window.setInterval(() => {
      if (!recordingProbe || recordingProbe.sessionId !== sid) return;
      recordingProbe.samples.push(scoreGatewayWarmReadinessV1().warmScore);
    }, PREDICTIVE_PREFLIGHT_V1.probeIntervalMs);
  }
}

export function endRecordingWarmProbeV1() {
  if (recordingProbe?.timer) {
    window.clearInterval(recordingProbe.timer);
  }
  recordingProbe = null;
}

/**
 * @param {string} [sessionId]
 */
export function finalizeRecordingWarmProbeV1(sessionId) {
  const probe = recordingProbe;
  endRecordingWarmProbeV1();
  if (!probe?.samples?.length) {
    return Object.freeze({
      sessionId: String(sessionId || ""),
      samples: 0,
      avgWarmScore: scoreGatewayWarmReadinessV1().warmScore,
      minWarmScore: scoreGatewayWarmReadinessV1().warmScore
    });
  }
  if (sessionId && probe.sessionId !== sessionId) {
    return Object.freeze({
      sessionId: String(sessionId || ""),
      samples: 0,
      avgWarmScore: scoreGatewayWarmReadinessV1().warmScore,
      minWarmScore: scoreGatewayWarmReadinessV1().warmScore
    });
  }
  const avgWarmScore = probe.samples.reduce((a, b) => a + b, 0) / probe.samples.length;
  const minWarmScore = Math.min(...probe.samples);
  return Object.freeze({
    sessionId: probe.sessionId,
    samples: probe.samples.length,
    avgWarmScore,
    minWarmScore
  });
}

function sleepMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Optional defer before capture — closes decision vs readiness gap.
 * @param {{ maxWaitMs?: number, urgent?: boolean }} [opts]
 */
export async function deferRecordingUntilGatewayWarmV1(opts = {}) {
  const urgent = opts.urgent === true;
  const maxWaitMs = Number(opts.maxWaitMs) > 0 ? Number(opts.maxWaitMs) : PREDICTIVE_PREFLIGHT_V1.maxStartDeferMs;
  if (urgent) {
    return Object.freeze({ ok: true, deferredMs: 0, reason: "urgent_skip", warmScore: scoreGatewayWarmReadinessV1().warmScore });
  }

  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    const warm = scoreGatewayWarmReadinessV1();
    if (warm.warmScore >= PREDICTIVE_PREFLIGHT_V1.minWarmScoreToRecord) {
      return Object.freeze({
        ok: true,
        deferredMs: Date.now() - started,
        reason: "warm_ready",
        warmScore: warm.warmScore
      });
    }
    await sleepMs(280);
  }

  const warm = scoreGatewayWarmReadinessV1();
  return Object.freeze({
    ok: true,
    deferredMs: Date.now() - started,
    reason: "defer_cap_predictive_direct",
    warmScore: warm.warmScore
  });
}

export function resetPredictivePreflightForTestV1() {
  endRecordingWarmProbeV1();
  latencyRing.length = 0;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_VOICE_TRANSCRIBE_PREDICTIVE__;
    } catch {
      /* noop */
    }
  }
}
