/**
 * Voice v3 — resilient transcription transport (preflight route + retry + split).
 * Dependency boundary: gateway ASR proxy; not layer decision authority.
 */

import { queryRhizohVoiceTranscribeV3 } from "./queryRhizohVoiceTranscribeV3.js";
import { emitVoiceEngineTelemetryV3 } from "./voiceEngineTelemetryV3.js";
import {
  planVoiceTranscribePreflightV3,
  resolveTranscribeRetryPathV3,
  VOICE_TRANSCRIBE_PREFLIGHT_V3
} from "./voiceTranscribePreflightV3.js";
import { buildWebmSegmentBlobsV3, mergeSegmentTranscriptsV3 } from "./voiceWebmSegmentSplitV3.js";

export const VOICE_TRANSCRIBE_TRANSPORT_V3 = Object.freeze({
  maxAttempts: 3,
  fetchTimeoutMs: 45_000,
  /** @deprecated use VOICE_TRANSCRIBE_PREFLIGHT_V3.directFastMinBytes */
  largeAudioBytes: VOICE_TRANSCRIBE_PREFLIGHT_V3.directFastMinBytes,
  retryBaseMs: 420,
  retryJitterMs: 780
});

const RETRYABLE_HTTP = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * @param {string | undefined} error
 * @param {number | undefined} status
 */
export function isRetryableTranscribeFailureV3(error, status) {
  const code = String(error || "");
  if (code === "transcribe_network" || code === "fetch_failed" || code === "fetch_timeout") {
    return true;
  }
  if (typeof status === "number" && RETRYABLE_HTTP.has(status)) return true;
  if (/^http_5\d\d$/.test(code)) return true;
  return false;
}

/** @deprecated use planVoiceTranscribePreflightV3 + resolveTranscribeRetryPathV3 */
export function resolveTranscribePathStrategyV3(bytes, attempt) {
  const plan = planVoiceTranscribePreflightV3({ bytes, recordedMs: 0, chunkCount: 0 });
  return resolveTranscribeRetryPathV3(plan, attempt);
}

function sleepWithJitterV3(attempt) {
  const base = VOICE_TRANSCRIBE_TRANSPORT_V3.retryBaseMs * (attempt + 1);
  const jitter = Math.floor(Math.random() * VOICE_TRANSCRIBE_TRANSPORT_V3.retryJitterMs);
  return new Promise((resolve) => setTimeout(resolve, base + jitter));
}

/**
 * @param {ArrayBuffer | Blob} audio
 * @param {string} path
 * @param {object} opts
 * @param {number} attempt
 */
async function postTranscribeOnceV3(audio, path, opts, attempt) {
  return queryRhizohVoiceTranscribeV3(audio, {
    path,
    mimeType: opts.mimeType,
    languageCode: opts.languageCode,
    traceId: opts.traceId,
    sessionId: opts.sessionId,
    timeoutMs: VOICE_TRANSCRIBE_TRANSPORT_V3.fetchTimeoutMs
  });
}

/**
 * @param {ArrayBuffer | Blob} audio
 * @param {ReturnType<typeof planVoiceTranscribePreflightV3>} plan
 * @param {object} opts
 */
async function executeDirectTranscribeV3(audio, plan, opts) {
  const bytes =
    typeof opts.bytes === "number"
      ? opts.bytes
      : audio instanceof Blob
        ? audio.size
        : audio?.byteLength || 0;

  let last = { ok: false, error: "transcribe_failed" };

  for (let attempt = 0; attempt < VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts; attempt += 1) {
    const path = resolveTranscribeRetryPathV3(plan, attempt);
    emitVoiceEngineTelemetryV3("TRANSCRIBE_ATTEMPT", {
      attempt: attempt + 1,
      path,
      bytes,
      preflightMode: plan.mode,
      preflightReason: plan.reason
    });

    try {
      const res = await postTranscribeOnceV3(audio, path, opts, attempt);
      if (res.ok) {
        if (attempt > 0 || path !== plan.path) {
          emitVoiceEngineTelemetryV3("TRANSCRIBE_RECOVERED", {
            attempt: attempt + 1,
            path,
            strategy: res.merged?.strategy || path,
            preflightMode: plan.mode
          });
        }
        return {
          ...res,
          transportAttempt: attempt + 1,
          transportPath: path,
          preflight: plan
        };
      }

      last = res;
      const retryable = isRetryableTranscribeFailureV3(res.error, res.status);
      emitVoiceEngineTelemetryV3("TRANSCRIBE_ATTEMPT_FAIL", {
        attempt: attempt + 1,
        path,
        error: res.error,
        status: res.status,
        retryable,
        preflightMode: plan.mode
      });

      if (!retryable || attempt >= VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts - 1) {
        return { ...res, transportAttempt: attempt + 1, transportPath: path, preflight: plan };
      }
    } catch (e) {
      const detail = String(e?.message || e);
      last = { ok: false, error: "transcribe_network", detail };
      emitVoiceEngineTelemetryV3("TRANSCRIBE_ATTEMPT_FAIL", {
        attempt: attempt + 1,
        path,
        error: "transcribe_network",
        detail,
        retryable: true,
        preflightMode: plan.mode
      });
      if (attempt >= VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts - 1) {
        return { ...last, transportAttempt: attempt + 1, transportPath: path, preflight: plan };
      }
    }

    await sleepWithJitterV3(attempt);
  }

  return { ...last, transportAttempt: VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts, preflight: plan };
}

/**
 * @param {Blob[]} chunks
 * @param {ReturnType<typeof planVoiceTranscribePreflightV3>} plan
 * @param {object} opts
 */
async function executeSplitTranscribeV3(chunks, plan, opts) {
  const segments = buildWebmSegmentBlobsV3(chunks, opts.mimeType || "audio/webm", plan.maxSegmentBytes);
  if (!segments?.length) {
    emitVoiceEngineTelemetryV3("TRANSCRIBE_PREFLIGHT_FALLBACK", {
      reason: "split_build_failed",
      preflightMode: plan.mode
    });
    const blob = new Blob(chunks, { type: opts.mimeType || "audio/webm" });
    return executeDirectTranscribeV3(
      blob,
      planVoiceTranscribePreflightV3({
        bytes: opts.bytes,
        recordedMs: opts.recordedMs,
        chunkCount: 0
      }),
      opts
    );
  }

  emitVoiceEngineTelemetryV3("TRANSCRIBE_SPLIT_PLAN", {
    segmentCount: segments.length,
    bytes: plan.bytes,
    recordedMs: plan.recordedMs,
    reason: plan.reason
  });

  /** @type {{ text?: string, confidence?: number }[]} */
  const mergedParts = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    let segmentOk = false;
    let lastSegErr = "transcribe_failed";

    for (let attempt = 0; attempt < VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts; attempt += 1) {
      const path = attempt === 0 ? plan.path : "fast";
      emitVoiceEngineTelemetryV3("TRANSCRIBE_SEGMENT_ATTEMPT", {
        segment: i + 1,
        segmentCount: segments.length,
        attempt: attempt + 1,
        path,
        bytes: segment.size
      });

      try {
        const res = await postTranscribeOnceV3(segment, path, opts, attempt);
        if (res.ok && res.merged?.text) {
          mergedParts.push(res.merged);
          segmentOk = true;
          break;
        }
        lastSegErr = res.error || "transcribe_failed";
        if (!isRetryableTranscribeFailureV3(res.error, res.status)) break;
      } catch (e) {
        lastSegErr = "transcribe_network";
        if (attempt >= VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts - 1) break;
      }
      await sleepWithJitterV3(attempt);
    }

    if (!segmentOk) {
      return {
        ok: false,
        error: lastSegErr,
        preflight: plan,
        failedSegment: i + 1,
        segmentCount: segments.length
      };
    }
  }

  const merged = mergeSegmentTranscriptsV3(mergedParts);
  if (!merged.text) {
    return { ok: false, error: "no_transcript", preflight: plan, segmentCount: segments.length };
  }

  emitVoiceEngineTelemetryV3("TRANSCRIBE_SPLIT_MERGED", {
    segmentCount: segments.length,
    chars: merged.text.length,
    strategy: merged.strategy
  });

  return {
    ok: true,
    merged,
    whisper: merged,
    path: "split",
    preflight: plan,
    segmentCount: segments.length,
    transportPath: "split",
    transportAttempt: 1
  };
}

/**
 * @param {ArrayBuffer | Blob} audio
 * @param {{
 *   mimeType?: string,
 *   languageCode?: string,
 *   traceId?: string,
 *   sessionId?: string,
 *   bytes?: number,
 *   recordedMs?: number,
 *   chunks?: Blob[],
 *   chunkCount?: number
 * }} [opts]
 */
export async function queryRhizohVoiceTranscribeResilientV3(audio, opts = {}) {
  const bytes =
    typeof opts.bytes === "number"
      ? opts.bytes
      : audio instanceof Blob
        ? audio.size
        : audio?.byteLength || 0;
  const recordedMs = Math.max(0, Number(opts.recordedMs) || 0);
  const chunks = Array.isArray(opts.chunks) ? opts.chunks : [];
  const chunkCount = Number(opts.chunkCount) > 0 ? Number(opts.chunkCount) : chunks.length;

  const plan = planVoiceTranscribePreflightV3({ bytes, recordedMs, chunkCount });

  emitVoiceEngineTelemetryV3("TRANSCRIBE_PREFLIGHT", {
    mode: plan.mode,
    path: plan.path,
    reason: plan.reason,
    bytes: plan.bytes,
    recordedMs: plan.recordedMs,
    chunkCount: plan.chunkCount,
    segmentCount: plan.segmentCount
  });

  if (typeof window !== "undefined") {
    try {
      window.__CASTLE_VOICE_TRANSCRIBE_PREFLIGHT__ = Object.freeze({
        ...plan,
        atMs: Date.now()
      });
    } catch {
      /* noop */
    }
  }

  if (plan.mode === "split" && chunks.length >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinChunks) {
    return executeSplitTranscribeV3(chunks, plan, { ...opts, bytes, recordedMs });
  }

  return executeDirectTranscribeV3(audio, plan, { ...opts, bytes, recordedMs });
}
