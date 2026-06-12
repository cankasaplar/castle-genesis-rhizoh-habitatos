/**
 * Voice Engine v3 — gateway live media lane.
 *
 * This is the single WebSocket media path for live/multimodal voice attempts.
 * The gateway owns provider secrets and returns the same transcript payload shape
 * as the HTTP ASR path, so downstream orchestration stays unchanged.
 */

import {
  WS_MESSAGE,
  createEnvelope,
  createRhizohVoiceLiveChunkPayloadV0,
  safeJsonParse
} from "@castle/protocol";
import { getCastleFlightConfig } from "../../../castleFlight/castleFlightConfig.js";
import { emitVoiceEngineTelemetryV3 } from "./voiceEngineTelemetryV3.js";
import { recordVoiceImmutableEventV0 } from "./voiceImmutableEventTimelineV0.js";

export const RHIZOH_GEMINI_LIVE_VOICE_TRANSPORT_SCHEMA_V0 =
  "castle.rhizoh.voice.gemini_live_gateway_lane.v0";

const LIVE_OPEN_TIMEOUT_MS_V0 = 1800;
const LIVE_FINAL_TIMEOUT_MS_V0 = 28_000;
const LIVE_MAX_CHUNKS_V0 = 96;

function resolveGatewayWsUrlV0() {
  const cfg = getCastleFlightConfig();
  const url = String(cfg.gatewayWsUrl || "").trim();
  if (!url || typeof WebSocket === "undefined") return "";
  const token = String(cfg.gatewayToken || "").trim();
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

/** @param {ArrayBuffer} buffer */
function arrayBufferToBase64V0(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof btoa !== "function") throw new Error("btoa_unavailable");
  return btoa(binary);
}

function waitForOpenV0(ws, timeoutMs = LIVE_OPEN_TIMEOUT_MS_V0) {
  if (ws.readyState === WebSocket.OPEN) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      ws.removeEventListener?.("open", onOpen);
      ws.removeEventListener?.("error", onError);
      resolve(ok);
    };
    const onOpen = () => finish(true);
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    ws.addEventListener?.("open", onOpen);
    ws.addEventListener?.("error", onError);
  });
}

/**
 * @param {{
 *   sessionId?: string,
 *   traceId?: string,
 *   languageCode?: string,
 *   mimeType?: string,
 *   path?: string
 * }} [opts]
 */
export async function createGeminiLiveVoiceSessionV0(opts = {}) {
  const url = resolveGatewayWsUrlV0();
  if (!url) return { ok: false, error: "gateway_ws_unavailable" };

  /** @type {WebSocket | null} */
  let ws = null;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    return { ok: false, error: "gateway_ws_construct_failed", detail: String(e?.message || e) };
  }

  const opened = await waitForOpenV0(ws);
  if (!opened || ws.readyState !== WebSocket.OPEN) {
    try {
      ws.close();
    } catch {
      /* noop */
    }
    return { ok: false, error: "gateway_ws_open_failed" };
  }

  const sessionId = String(opts.sessionId || `live_${Date.now().toString(36)}`);
  const mimeType = String(opts.mimeType || "audio/webm");
  const languageCode = String(opts.languageCode || "tr-TR");
  const path = String(opts.path || "both");
  let stopped = false;
  let chunkCount = 0;
  let failedReason = "";
  /** @type {Promise<unknown>[]} */
  const pendingChunks = [];

  /** @type {(payload: object) => void} */
  let settleFinalV0 = () => {};
  const finalPromise = new Promise((resolve) => {
    let done = false;
    const timer = window.setTimeout(() => {
      finish({ ok: false, error: "live_final_timeout" });
    }, LIVE_FINAL_TIMEOUT_MS_V0);

    const finish = (payload) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(payload);
    };
    settleFinalV0 = finish;

    const onMessage = (ev) => {
      const msg = safeJsonParse(String(ev.data || ""));
      if (!msg?.type) return;
      if (msg.type === WS_MESSAGE.RHIZOH_VOICE_LIVE_FINAL) {
        finish(msg.payload || { ok: false, error: "live_final_empty" });
      }
      if (msg.type === WS_MESSAGE.RHIZOH_VOICE_LIVE_ERROR) {
        failedReason = String(msg.payload?.error || "gateway_ws_live_error");
        finish({ ok: false, ...(msg.payload || {}), transportPath: "gateway_ws_live" });
      }
    };
    const onError = () => {
      failedReason = failedReason || "gateway_ws_error";
      finish({ ok: false, error: failedReason, transportPath: "gateway_ws_live" });
    };
    const onClose = () => {
      failedReason = failedReason || "gateway_ws_closed";
      finish({ ok: false, error: failedReason, transportPath: "gateway_ws_live" });
    };

    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);
    ws.addEventListener("close", onClose);
  });

  try {
    ws.send(
      JSON.stringify(
        createEnvelope(WS_MESSAGE.RHIZOH_VOICE_LIVE_START, {
          schema: RHIZOH_GEMINI_LIVE_VOICE_TRANSPORT_SCHEMA_V0,
          sessionId,
          traceId: opts.traceId || "",
          languageCode,
          mimeType,
          path
        })
      )
    );
  } catch (e) {
    failedReason = "live_start_send_failed";
    settleFinalV0({ ok: false, error: failedReason, detail: String(e?.message || e) });
    try {
      ws.close();
    } catch {
      /* noop */
    }
    return { ok: false, error: failedReason, detail: String(e?.message || e) };
  }
  recordVoiceImmutableEventV0({
    type: "VOICE_LIVE_SESSION_STARTED",
    sessionId,
    traceId: opts.traceId || "",
    payloadRefSeed: `${sessionId}:live_session`,
    actorSeed: sessionId
  });

  const api = Object.freeze({
    ok: true,
    sessionId,
    sendChunk(blob) {
      if (stopped || failedReason || !blob || blob.size <= 0 || chunkCount >= LIVE_MAX_CHUNKS_V0) return;
      chunkCount += 1;
      const index = chunkCount;
      const job = blob
        .arrayBuffer()
        .then((buf) => {
          if (stopped || failedReason) return;
          if (ws?.readyState !== WebSocket.OPEN) {
            failedReason = "gateway_ws_closed";
            settleFinalV0({ ok: false, error: failedReason, transportPath: "gateway_ws_live" });
            return;
          }
          try {
            const payload = createRhizohVoiceLiveChunkPayloadV0({
              sessionId,
              traceId: opts.traceId || "",
              audioBase64: arrayBufferToBase64V0(buf),
              mimeType,
              chunkIndex: index
            });
            ws.send(
              JSON.stringify(
                createEnvelope(WS_MESSAGE.RHIZOH_VOICE_LIVE_CHUNK, payload)
              )
            );
            recordVoiceImmutableEventV0({
              type: "VOICE_LIVE_CHUNK_SENT",
              sessionId,
              traceId: opts.traceId || "",
              payloadRefSeed: `${sessionId}:chunk:${index}`,
              actorSeed: sessionId
            });
          } catch (e) {
            failedReason = "live_chunk_send_failed";
            settleFinalV0({
              ok: false,
              error: failedReason,
              detail: String(e?.message || e),
              transportPath: "gateway_ws_live"
            });
          }
        })
        .catch((e) => {
          failedReason = "live_chunk_encode_failed";
          settleFinalV0({
            ok: false,
            error: failedReason,
            detail: String(e?.message || e),
            transportPath: "gateway_ws_live"
          });
          emitVoiceEngineTelemetryV3("LIVE_WS_CHUNK_SKIP", { error: String(e?.message || e) });
        });
      pendingChunks.push(job);
    },
    async stopAndWaitFinal(stopOpts = {}) {
      stopped = true;
      await Promise.allSettled(pendingChunks);
      if (failedReason) {
        recordVoiceImmutableEventV0({
          type: "VOICE_LIVE_FALLBACK_REQUIRED",
          sessionId,
          traceId: stopOpts.traceId || opts.traceId || "",
          payloadRefSeed: `${sessionId}:fallback:${failedReason}`,
          actorSeed: sessionId
        });
        return { ok: false, error: failedReason, transportPath: "gateway_ws_live" };
      }
      if (ws?.readyState !== WebSocket.OPEN) {
        recordVoiceImmutableEventV0({
          type: "VOICE_LIVE_FALLBACK_REQUIRED",
          sessionId,
          traceId: stopOpts.traceId || opts.traceId || "",
          payloadRefSeed: `${sessionId}:fallback:gateway_ws_closed`,
          actorSeed: sessionId
        });
        return { ok: false, error: "gateway_ws_closed" };
      }
      try {
        ws.send(
          JSON.stringify(
            createEnvelope(WS_MESSAGE.RHIZOH_VOICE_LIVE_STOP, {
              sessionId,
              traceId: stopOpts.traceId || opts.traceId || "",
              languageCode: stopOpts.languageCode || languageCode,
              mimeType: stopOpts.mimeType || mimeType,
              path: stopOpts.path || path,
              lastChunkIndex: chunkCount
            })
          )
        );
        recordVoiceImmutableEventV0({
          type: "VOICE_LIVE_STOP_SENT",
          sessionId,
          traceId: stopOpts.traceId || opts.traceId || "",
          payloadRefSeed: `${sessionId}:stop:${chunkCount}`,
          actorSeed: sessionId
        });
      } catch (e) {
        return {
          ok: false,
          error: "live_stop_send_failed",
          detail: String(e?.message || e),
          transportPath: "gateway_ws_live"
        };
      }
      const result = await finalPromise;
      recordVoiceImmutableEventV0({
        type: result?.ok ? "VOICE_LIVE_FINAL_RECEIVED" : "VOICE_LIVE_FALLBACK_REQUIRED",
        sessionId,
        traceId: stopOpts.traceId || opts.traceId || "",
        payloadRefSeed: `${sessionId}:final:${result?.ok ? "ws" : "fallback"}`,
        actorSeed: sessionId
      });
      try {
        ws.close();
      } catch {
        /* noop */
      }
      return { transportPath: "gateway_ws_live", transportAttempt: 1, ...result };
    },
    close(reason = "client_close") {
      stopped = true;
      try {
        ws?.close(1000, reason);
      } catch {
        /* noop */
      }
    }
  });

  emitVoiceEngineTelemetryV3("LIVE_WS_READY", { sessionId, path });
  return api;
}
