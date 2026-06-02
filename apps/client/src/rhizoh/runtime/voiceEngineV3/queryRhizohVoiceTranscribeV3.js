/**
 * Voice Engine v3 — gateway transcribe client.
 */

import { getCastleFlightConfig } from "../../../castleFlight/castleFlightConfig.js";
import { readSttLanguageCodeHintV0 } from "../rhizohConversationLanguageV0.js";
import { throttleVoiceTranscribePostV3 } from "./voiceThrottleV3.js";

export const RHIZOH_VOICE_TRANSCRIBE_ROUTE_V3 = "/rhizoh/voice/transcribe/v3";

function gatewayBaseUrl() {
  const cfg = getCastleFlightConfig();
  const llm = String(cfg?.rhizohLlmHttp || "").trim();
  if (!llm) {
    const env = import.meta.env;
    const base = String(env.VITE_LIVE_GATEWAY_BASE || env.VITE_GATEWAY_HTTP || "").trim();
    if (!base) return "";
    return base.replace(/\/rhizoh\/llm\/?$/i, "").replace(/\/+$/, "");
  }
  return llm.replace(/\/rhizoh\/llm\/?$/i, "").replace(/\/+$/, "");
}

function gatewayToken() {
  return String(getCastleFlightConfig()?.gatewayToken || import.meta.env?.VITE_GATEWAY_TOKEN || "").trim();
}

/**
 * @param {ArrayBuffer | Blob} audio
 * @param {{
 *   path?: "fast" | "accurate" | "both",
 *   mimeType?: string,
 *   languageCode?: string,
 *   traceId?: string,
 *   sessionId?: string,
 *   timeoutMs?: number
 * }} [opts]
 */
export async function queryRhizohVoiceTranscribeV3(audio, opts = {}) {
  const base = gatewayBaseUrl();
  if (!base) return { ok: false, error: "no_gateway_base" };

  let bytes;
  let mimeType = String(opts.mimeType || "audio/webm");
  if (audio instanceof Blob) {
    mimeType = audio.type || mimeType;
    bytes = await audio.arrayBuffer();
  } else {
    bytes = audio;
  }
  if (!bytes || !bytes.byteLength) return { ok: false, error: "audio_empty" };

  await throttleVoiceTranscribePostV3();

  const b64 = arrayBufferToBase64V3(bytes);

  const headers = { "Content-Type": "application/json" };
  const token = gatewayToken();
  if (token) headers["X-Castle-Gateway-Token"] = token;

  const path = String(opts.path || "both");
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 0;
  /** @type {AbortController | null} */
  let abortCtl = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null;
  const fetchOpts = { method: "POST", headers, body: JSON.stringify({
      path,
      audioBase64: b64,
      mimeType,
      languageCode: opts.languageCode || readSttLanguageCodeHintV0(),
      traceId: opts.traceId || "",
      sessionId: opts.sessionId || ""
    }) };

  if (timeoutMs > 0 && typeof AbortController !== "undefined") {
    abortCtl = new AbortController();
    fetchOpts.signal = abortCtl.signal;
    timeoutId = setTimeout(() => abortCtl?.abort(), timeoutMs);
  }

  let res;
  try {
    res = await fetch(`${base}${RHIZOH_VOICE_TRANSCRIBE_ROUTE_V3}`, fetchOpts);
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId);
    const aborted = abortCtl?.signal?.aborted || String(e?.name || "") === "AbortError";
    return {
      ok: false,
      error: aborted ? "fetch_timeout" : "transcribe_network",
      detail: String(e?.message || e)
    };
  }
  if (timeoutId) clearTimeout(timeoutId);

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: String(json?.error || `http_${res.status}`),
      status: res.status,
      detail: json
    };
  }
  return { ok: true, ...json };
}

/** @param {ArrayBuffer} buffer */
function arrayBufferToBase64V3(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof btoa !== "function") throw new Error("btoa_unavailable");
  return btoa(binary);
}
