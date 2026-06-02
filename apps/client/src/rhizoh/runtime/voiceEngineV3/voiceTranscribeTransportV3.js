/**

 * Voice v3 — resilient transcription transport (preflight + coordinator + cascade).

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

import {

  acquireTranscribeSessionV1,

  coerceTranscribePlanForGatewayV1,

  noteTranscribeSegmentHealthV1,

  noteTranscribeTransportFailureV1,

  releaseTranscribeSessionV1,

  waitForTranscribeGatewayReadyV1,

  TRANSCRIBE_COORDINATOR_V1

} from "../voiceTranscribeSessionCoordinatorV1.js";

import {

  noteTranscribeLatencySampleV1,

  predictTranscribeRouteV1

} from "../voiceTranscribePredictivePreflightV1.js";



export const VOICE_TRANSCRIBE_TRANSPORT_V3 = Object.freeze({

  maxAttempts: 3,

  fetchTimeoutMs: 45_000,

  largeAudioBytes: VOICE_TRANSCRIBE_PREFLIGHT_V3.directFastMinBytes,

  retryBaseMs: 420,

  retryJitterMs: 780

});



const RETRYABLE_HTTP = new Set([408, 425, 429, 500, 502, 503, 504]);



export function isRetryableTranscribeFailureV3(error, status) {

  const code = String(error || "");

  if (code === "transcribe_network" || code === "fetch_failed" || code === "fetch_timeout") {

    return true;

  }

  if (typeof status === "number" && RETRYABLE_HTTP.has(status)) return true;

  if (/^http_5\d\d$/.test(code)) return true;

  return false;

}



/** @deprecated */

export function resolveTranscribePathStrategyV3(bytes, attempt) {

  const plan = planVoiceTranscribePreflightV3({ bytes, recordedMs: 0, chunkCount: 0 });

  return resolveTranscribeRetryPathV3(plan, attempt);

}



function sleepWithJitterV3(attempt) {

  const base = VOICE_TRANSCRIBE_TRANSPORT_V3.retryBaseMs * (attempt + 1);

  const jitter = Math.floor(Math.random() * VOICE_TRANSCRIBE_TRANSPORT_V3.retryJitterMs);

  return new Promise((resolve) => window.setTimeout(resolve, base + jitter));

}



async function postTranscribeOnceV3(audio, path, opts) {

  const started = Date.now();

  try {

    const res = await queryRhizohVoiceTranscribeV3(audio, {

      path,

      mimeType: opts.mimeType,

      languageCode: opts.languageCode,

      traceId: opts.traceId,

      sessionId: opts.transcribeSessionId || opts.sessionId,

      timeoutMs: VOICE_TRANSCRIBE_TRANSPORT_V3.fetchTimeoutMs

    });

    noteTranscribeLatencySampleV1({ latencyMs: Date.now() - started, ok: res.ok === true });

    return res;

  } catch (e) {

    noteTranscribeLatencySampleV1({ latencyMs: Date.now() - started, ok: false });

    throw e;

  }

}



function cascadeToDirectV3(fullBlob, opts, plan, reason, detail = {}) {

  emitVoiceEngineTelemetryV3("TRANSCRIBE_CASCADE_DIRECT", {

    reason,

    bytes: fullBlob.size,

    ...detail

  });

  return executeDirectTranscribeV3(

    fullBlob,

    planVoiceTranscribePreflightV3({

      bytes: fullBlob.size,

      recordedMs: opts.recordedMs,

      chunkCount: 0

    }),

    { ...opts, bytes: fullBlob.size, cascadeReason: reason }

  );

}



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

      preflightReason: plan.reason,

      transcribeSessionId: opts.transcribeSessionId

    });



    try {

      const res = await postTranscribeOnceV3(audio, path, opts);

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



      if (retryable) noteTranscribeTransportFailureV1({ error: res.error, mode: "direct" });



      if (!retryable || attempt >= VOICE_TRANSCRIBE_TRANSPORT_V3.maxAttempts - 1) {

        return { ...res, transportAttempt: attempt + 1, transportPath: path, preflight: plan };

      }

    } catch (e) {

      const detail = String(e?.message || e);

      last = { ok: false, error: "transcribe_network", detail };

      noteTranscribeTransportFailureV1({ error: "transcribe_network", mode: "direct" });

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



async function executeSplitTranscribeV3(chunks, plan, opts) {

  const fullBlob =

    opts.fullBlob instanceof Blob

      ? opts.fullBlob

      : chunks?.length

        ? new Blob(chunks, { type: opts.mimeType || "audio/webm" })

        : null;



  const segments = buildWebmSegmentBlobsV3(chunks, opts.mimeType || "audio/webm", plan.maxSegmentBytes);

  if (!segments?.length) {

    emitVoiceEngineTelemetryV3("TRANSCRIBE_PREFLIGHT_FALLBACK", {

      reason: "split_build_failed",

      preflightMode: plan.mode

    });

    if (!fullBlob) return { ok: false, error: "split_build_failed" };

    return cascadeToDirectV3(fullBlob, opts, plan, "split_build_failed");

  }



  emitVoiceEngineTelemetryV3("TRANSCRIBE_SPLIT_PLAN", {

    segmentCount: segments.length,

    bytes: plan.bytes,

    recordedMs: plan.recordedMs,

    reason: plan.reason,

    transcribeSessionId: opts.transcribeSessionId

  });



  /** @type {{ text?: string, confidence?: number }[]} */

  const mergedParts = [];



  for (let i = 0; i < segments.length; i += 1) {

    const segment = segments[i];

    const path = i === 0 ? plan.path : "fast";

    let segmentOk = false;

    let lastSegErr = "transcribe_failed";



    emitVoiceEngineTelemetryV3("TRANSCRIBE_SEGMENT_ATTEMPT", {

      segment: i + 1,

      segmentCount: segments.length,

      attempt: 1,

      path,

      bytes: segment.size,

      transcribeSessionId: opts.transcribeSessionId

    });



    try {

      const res = await postTranscribeOnceV3(segment, path, opts);

      if (res.ok && res.merged?.text) {

        noteTranscribeSegmentHealthV1(i, "ok", { path, attempt: 1 });

        mergedParts.push(res.merged);

        segmentOk = true;

      } else {

        lastSegErr = res.error || "transcribe_failed";

        noteTranscribeSegmentHealthV1(i, "fail", { error: lastSegErr, path, attempt: 1 });

      }

    } catch (e) {

      lastSegErr = "transcribe_network";

      noteTranscribeSegmentHealthV1(i, "fail", { error: lastSegErr, path, attempt: 1 });

    }



    if (!segmentOk) {

      noteTranscribeTransportFailureV1({

        error: lastSegErr,

        segmentIndex: i,

        cascade: i === 0 ? "segment0_immediate" : "segment_fail"

      });



      emitVoiceEngineTelemetryV3("TRANSCRIBE_SEGMENT_CASCADE", {

        failedSegment: i + 1,

        segmentCount: segments.length,

        error: lastSegErr,

        policy: i === 0 ? "segment0_no_isolated_loop" : "segment_fail"

      });



      if (fullBlob) {

        return cascadeToDirectV3(fullBlob, opts, plan, "segment_cascade", {

          failedSegment: i + 1,

          error: lastSegErr

        });

      }



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

    if (fullBlob) {

      return cascadeToDirectV3(fullBlob, opts, plan, "split_empty_merge");

    }

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

  const voiceSessionId = String(opts.sessionId || "");



  const gatewayReady = await waitForTranscribeGatewayReadyV1({ bytes });

  if (!gatewayReady.ok) {

    emitVoiceEngineTelemetryV3("TRANSCRIBE_GATEWAY_BLOCK", {

      error: gatewayReady.error,

      bytes,

      recordedMs

    });

    return { ok: false, error: gatewayReady.error || "gateway_unstable", preflight: null };

  }



  const lock = acquireTranscribeSessionV1(voiceSessionId);

  if (!lock.ok) {

    emitVoiceEngineTelemetryV3("TRANSCRIBE_SESSION_DENIED", {

      error: lock.error,

      waitMs: lock.waitMs,

      activeVoiceSessionId: lock.activeVoiceSessionId

    });

    return { ok: false, error: lock.error || "transcribe_session_denied", waitMs: lock.waitMs };

  }



  const transportOpts = {

    ...opts,

    bytes,

    recordedMs,

    transcribeSessionId: lock.transcribeSessionId

  };



  try {

    const predictive = predictTranscribeRouteV1({

      bytes,

      recordedMs,

      chunkCount,

      warmProbe: opts.warmProbe

    });

    let plan = predictive.plan;

    plan = coerceTranscribePlanForGatewayV1(plan);



    emitVoiceEngineTelemetryV3("TRANSCRIBE_PREDICTIVE", {

      warmScore: predictive.warmScore,

      minWarmScore: predictive.minWarmScore,

      latencyRisk: predictive.latencyRisk,

      predictiveAction: predictive.predictiveAction,

      mode: plan.mode,

      path: plan.path,

      reason: plan.reason

    });



    emitVoiceEngineTelemetryV3("TRANSCRIBE_PREFLIGHT", {

      mode: plan.mode,

      path: plan.path,

      reason: plan.reason,

      bytes: plan.bytes,

      recordedMs: plan.recordedMs,

      chunkCount: plan.chunkCount,

      segmentCount: plan.segmentCount,

      transcribeSessionId: lock.transcribeSessionId,

      gatewayReady: gatewayReady.reason

    });



    if (typeof window !== "undefined") {

      try {

        window.__CASTLE_VOICE_TRANSCRIBE_PREFLIGHT__ = Object.freeze({

          ...plan,

          transcribeSessionId: lock.transcribeSessionId,

          atMs: Date.now()

        });

      } catch {

        /* noop */

      }

    }



    if (plan.mode === "split" && chunks.length >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinChunks) {

      return await executeSplitTranscribeV3(chunks, plan, {

        ...transportOpts,

        fullBlob: audio

      });

    }



    return await executeDirectTranscribeV3(audio, plan, transportOpts);

  } finally {

    releaseTranscribeSessionV1(voiceSessionId);

  }

}



export { TRANSCRIBE_COORDINATOR_V1 };


