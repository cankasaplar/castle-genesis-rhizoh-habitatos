/**
 * Voice Engine v3 — gateway transcribe client.
 */

import { getCastleFlightConfig } from "../../../castleFlight/castleFlightConfig.js";

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
 *   sessionId?: string
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

  const b64 = arrayBufferToBase64V3(bytes);

  const headers = { "Content-Type": "application/json" };
  const token = gatewayToken();
  if (token) headers["X-Castle-Gateway-Token"] = token;

  const path = String(opts.path || "both");
  const res = await fetch(`${base}${RHIZOH_VOICE_TRANSCRIBE_ROUTE_V3}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      path,
      audioBase64: b64,
      mimeType,
      languageCode: opts.languageCode || "tr-TR",
      traceId: opts.traceId || "",
      sessionId: opts.sessionId || ""
    })
  });

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
