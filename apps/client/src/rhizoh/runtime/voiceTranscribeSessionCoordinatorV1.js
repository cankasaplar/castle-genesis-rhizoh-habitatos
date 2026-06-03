/**
 * Voice transcribe session coordinator v1 — global upload lock + segment health + cascade policy.
 * Transport-only; not layer execution authority.
 */

import { isGatewaySessionStableV1 } from "./gatewaySessionKeeperV1.js";

export const TRANSCRIBE_COORDINATOR_V1 = Object.freeze({
  /** Min quiet period after gateway (re)connect before first large upload. */
  gatewayWarmupMs: 2_800,
  /** Global backoff after transport boundary failure. */
  globalBackoffMs: 1_800,
  /** Per-segment attempts before cascade (not 3× on same segment). */
  maxSegmentAttempts: 1,
  /** Wait up to this long for gateway stability before upload. */
  gatewayReadyWaitMs: 4_500
});

/** @type {string | null} */
let activeVoiceSessionId = null;

/** @type {string | null} */
let activeTranscribeSessionId = null;

/** @type {Record<number, { status: string, error?: string, atMs: number }>} */
let segmentHealthMap = {};

let globalBackoffUntilMs = 0;
let lastTransportFailAtMs = 0;
let lastGatewayConnectAtMs = 0;

function publishCoordinatorSnapshot(extra = {}) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_VOICE_TRANSCRIBE_COORDINATOR__ = Object.freeze({
      schema: "castle.voice_transcribe_coordinator.v1",
      activeVoiceSessionId,
      activeTranscribeSessionId,
      segmentHealthMap: { ...segmentHealthMap },
      globalBackoffUntilMs,
      lastTransportFailAtMs,
      lastGatewayConnectAtMs,
      atMs: Date.now(),
      ...extra
    });
  } catch {
    /* noop */
  }
}

export function noteTranscribeGatewayConnectV1(atMs = Date.now()) {
  lastGatewayConnectAtMs = Number(atMs) || Date.now();
  publishCoordinatorSnapshot({ event: "gateway_connect" });
}

/**
 * @param {string} voiceSessionId
 */
export function acquireTranscribeSessionV1(voiceSessionId) {
  const voiceId = String(voiceSessionId || "").trim();
  if (!voiceId) return { ok: false, error: "voice_session_required" };

  const now = Date.now();
  if (now < globalBackoffUntilMs) {
    return {
      ok: false,
      error: "transcribe_global_backoff",
      waitMs: globalBackoffUntilMs - now
    };
  }

  if (activeTranscribeSessionId && activeVoiceSessionId !== voiceId) {
    return {
      ok: false,
      error: "transcribe_session_overlap",
      activeVoiceSessionId,
      activeTranscribeSessionId
    };
  }

  activeVoiceSessionId = voiceId;
  activeTranscribeSessionId = `${voiceId}_tx_${now.toString(36)}`;
  segmentHealthMap = {};
  publishCoordinatorSnapshot({ event: "acquire" });
  return { ok: true, transcribeSessionId: activeTranscribeSessionId };
}

/**
 * @param {string} voiceSessionId
 */
export function releaseTranscribeSessionV1(voiceSessionId) {
  if (activeVoiceSessionId === String(voiceSessionId || "")) {
    activeVoiceSessionId = null;
    activeTranscribeSessionId = null;
  }
  publishCoordinatorSnapshot({ event: "release" });
}

/** @returns {string | null} */
export function getActiveTranscribeVoiceSessionIdV1() {
  return activeVoiceSessionId;
}

/**
 * @param {number} segmentIndex zero-based
 * @param {"ok" | "fail" | "skipped"} status
 * @param {{ error?: string, attempt?: number, path?: string }} [detail]
 */
export function noteTranscribeSegmentHealthV1(segmentIndex, status, detail = {}) {
  segmentHealthMap[segmentIndex] = Object.freeze({
    status: String(status),
    error: detail.error ? String(detail.error) : undefined,
    attempt: detail.attempt,
    path: detail.path,
    atMs: Date.now()
  });
  publishCoordinatorSnapshot({ event: "segment_health", segmentIndex, status });
}

/**
 * @param {{ error?: string, segmentIndex?: number, cascade?: string }} [detail]
 */
export function noteTranscribeTransportFailureV1(detail = {}) {
  const now = Date.now();
  lastTransportFailAtMs = now;
  globalBackoffUntilMs = now + TRANSCRIBE_COORDINATOR_V1.globalBackoffMs;
  publishCoordinatorSnapshot({ event: "transport_fail", ...detail });
}

export function resetTranscribeCoordinatorForTestV1() {
  activeVoiceSessionId = null;
  activeTranscribeSessionId = null;
  segmentHealthMap = {};
  globalBackoffUntilMs = 0;
  lastTransportFailAtMs = 0;
  lastGatewayConnectAtMs = 0;
}

function sleepMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Hard preflight — gateway session must be warm before upload.
 * @param {{ bytes?: number }} [opts]
 */
export async function waitForTranscribeGatewayReadyV1(opts = {}) {
  const bytes = Number(opts.bytes) || 0;
  const largePayload = bytes >= 96_000;
  const deadline = Date.now() + TRANSCRIBE_COORDINATOR_V1.gatewayReadyWaitMs;

  while (Date.now() < deadline) {
    const stable = isGatewaySessionStableV1();
    const sinceConnect = lastGatewayConnectAtMs > 0 ? Date.now() - lastGatewayConnectAtMs : Infinity;
    const warmupDone = sinceConnect >= TRANSCRIBE_COORDINATOR_V1.gatewayWarmupMs;

    if (stable && (!largePayload || warmupDone)) {
      return { ok: true, reason: largePayload ? "gateway_warm" : "gateway_stable" };
    }

    await sleepMs(350);
  }

  if (!isGatewaySessionStableV1()) {
    return { ok: false, error: "gateway_unstable" };
  }

  return { ok: false, error: "gateway_warmup_pending" };
}

/**
 * Split policy — avoid split during gateway flap; prefer direct fast when unstable warmup.
 * @param {ReturnType<typeof import("./voiceEngineV3/voiceTranscribePreflightV3.js").planVoiceTranscribePreflightV3>} plan
 */
export function coerceTranscribePlanForGatewayV1(plan) {
  if (!plan || plan.mode !== "split") return plan;
  const sinceConnect = lastGatewayConnectAtMs > 0 ? Date.now() - lastGatewayConnectAtMs : Infinity;
  if (sinceConnect < TRANSCRIBE_COORDINATOR_V1.gatewayWarmupMs) {
    return Object.freeze({
      ...plan,
      mode: "direct",
      path: "fast",
      reason: "gateway_warmup_direct",
      segmentCount: 1
    });
  }
  return plan;
}
