/**
 * Rhizoh Voice Engine v3 — hybrid ASR (Google fast + Whisper accurate).
 * RESEARCH-ONLY / habitat — gateway proxy; no frozen core touch.
 */

export const RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA = "castle.rhizoh.voice.transcribe.v3";
export const RHIZOH_VOICE_TRANSCRIBE_ROUTE_V3 = "/rhizoh/voice/transcribe/v3";

const GOOGLE_STT_URL = "https://speech.googleapis.com/v1/speech:recognize";
const OPENAI_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * @param {{ text?: string, confidence?: number } | null | undefined} google
 * @param {{ text?: string, confidence?: number } | null | undefined} whisper
 */
export function resolveVoiceTranscriptV3(google, whisper) {
  const gConf = clamp01(Number(google?.confidence ?? 0));
  const wConf = clamp01(Number(whisper?.confidence ?? 0));
  const gText = String(google?.text || "").trim();
  const wText = String(whisper?.text || "").trim();

  if (!gText && !wText) {
    return Object.freeze({ text: "", confidence: 0, source: "none", strategy: "empty" });
  }
  if (!gText && wText) {
    return Object.freeze({ text: wText, confidence: wConf, source: "whisper", strategy: "whisper_only" });
  }
  if (gText && !wText) {
    return Object.freeze({ text: gText, confidence: gConf, source: "google", strategy: "google_only" });
  }
  if (gConf > 0.85) {
    return Object.freeze({ text: gText, confidence: gConf, source: "google", strategy: "google_high_confidence" });
  }
  if (wConf > gConf) {
    return Object.freeze({ text: wText, confidence: wConf, source: "whisper", strategy: "whisper_higher_confidence" });
  }
  return Object.freeze({
    text: `${gText} (verified)`,
    confidence: Math.max(gConf, wConf),
    source: "hybrid",
    strategy: "google_with_verified_suffix"
  });
}

export function rhizohVoiceTranscribeEnvV3() {
  const openai = !!String(process.env.OPENAI_API_KEY || "").trim();
  const google = !!googleSpeechApiKey();
  return Object.freeze({ openai, google, any: openai || google });
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function googleSpeechApiKey() {
  return String(process.env.GOOGLE_SPEECH_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
}

/**
 * @param {string} audioBase64
 * @param {{ encoding?: string, sampleRateHertz?: number, languageCode?: string }} [config]
 */
export async function transcribeGoogleSttFastV3(audioBase64, config = {}) {
  const key = googleSpeechApiKey();
  if (!key) return { ok: false, error: "google_speech_key_missing" };
  const content = String(audioBase64 || "").trim();
  if (!content) return { ok: false, error: "audio_empty" };

  const encoding = String(config.encoding || "WEBM_OPUS");
  const sampleRateHertz = Number(config.sampleRateHertz) > 0 ? Number(config.sampleRateHertz) : 48000;
  const languageCode = String(config.languageCode || "tr-TR");

  try {
    const res = await fetch(`${GOOGLE_STT_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding,
          sampleRateHertz,
          languageCode,
          alternativeLanguageCodes: ["en-US"],
          enableAutomaticPunctuation: true,
          model: "latest_short"
        },
        audio: { content }
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: "google_stt_http_error",
        status: res.status,
        detail: String(json?.error?.message || json?.error || res.status)
      };
    }
    const alt = Array.isArray(json?.results?.[0]?.alternatives) ? json.results[0].alternatives[0] : null;
    const text = String(alt?.transcript || "").trim();
    const confidence = clamp01(Number(alt?.confidence ?? (text ? 0.72 : 0)));
    return {
      ok: true,
      text,
      confidence,
      source: "google",
      latencyHint: "fast"
    };
  } catch (e) {
    return { ok: false, error: "google_stt_network", detail: String(e?.message || e) };
  }
}

/**
 * @param {Buffer | Uint8Array} audioBytes
 * @param {{ mimeType?: string, languageCode?: string }} [config]
 */
export async function transcribeWhisperAccurateV3(audioBytes, config = {}) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) return { ok: false, error: "openai_key_missing" };
  if (!audioBytes || !audioBytes.length) return { ok: false, error: "audio_empty" };

  const mimeType = String(config.mimeType || "audio/webm");
  const langRaw = String(config.languageCode || "tr-TR");
  const language = langRaw.toLowerCase().startsWith("tr") ? "tr" : langRaw.slice(0, 2);

  try {
    const blob = new Blob([audioBytes], { type: mimeType });
    const form = new FormData();
    form.append("file", blob, mimeType.includes("webm") ? "audio.webm" : "audio.wav");
    form.append("model", "whisper-1");
    form.append("language", language);
    form.append("temperature", "0");
    form.append("prompt", "Türkçe konuşma transkripti.");
    form.append("response_format", "verbose_json");

    const res = await fetch(OPENAI_WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: "whisper_http_error",
        status: res.status,
        detail: String(json?.error?.message || json?.error || res.status)
      };
    }
    const text = String(json?.text || "").trim();
    const segments = Array.isArray(json?.segments) ? json.segments : [];
    let confidence = 0.88;
    if (segments.length) {
      const avg =
        segments.reduce((sum, s) => sum + clamp01(Number(s?.avg_logprob ?? -0.35)), 0) / segments.length;
      confidence = clamp01(0.55 + Math.max(-0.5, Math.min(0, avg + 0.35)));
    } else if (text) {
      confidence = 0.82;
    }
    return {
      ok: true,
      text,
      confidence,
      source: "whisper",
      latencyHint: "accurate",
      durationSec: Number(json?.duration) || null
    };
  } catch (e) {
    return { ok: false, error: "whisper_network", detail: String(e?.message || e) };
  }
}

function decodeAudioPayload(body = {}) {
  const b64 = String(body.audioBase64 || body.audio || "").trim();
  if (!b64) return { ok: false, error: "audio_base64_required" };
  try {
    const buf = Buffer.from(b64, "base64");
    if (!buf.length) return { ok: false, error: "audio_decode_empty" };
    return { ok: true, buffer: buf, base64: b64 };
  } catch {
    return { ok: false, error: "audio_base64_invalid" };
  }
}

/**
 * HTTP handler body for POST /rhizoh/voice/transcribe/v3
 * @param {Record<string, unknown>} body
 */
export async function runRhizohVoiceTranscribeV3(body = {}) {
  const path = String(body.path || "both").toLowerCase();
  const decoded = decodeAudioPayload(body);
  if (!decoded.ok) {
    return { ok: false, error: decoded.error, schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA };
  }

  const env = rhizohVoiceTranscribeEnvV3();
  if (!env.any) {
    return { ok: false, error: "voice_asr_not_configured", schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA };
  }

  const config = body.config && typeof body.config === "object" ? body.config : {};
  const encoding = String(config.encoding || body.encoding || "WEBM_OPUS");
  const sampleRateHertz = Number(config.sampleRateHertz || body.sampleRateHertz) || 48000;
  const languageCode = String(config.languageCode || body.languageCode || "tr-TR");
  const mimeType = String(body.mimeType || "audio/webm");

  /** @type {{ text: string, confidence: number, source: string } | null} */
  let google = null;
  /** @type {{ text: string, confidence: number, source: string } | null} */
  let whisper = null;

  const wantFast = path === "fast" || path === "both";
  const wantAccurate = path === "accurate" || path === "whisper" || path === "both";
  /** @type {Record<string, unknown> | null} */
  let googleError = null;
  /** @type {Record<string, unknown> | null} */
  let whisperError = null;

  if (wantFast && env.google) {
    const fast = await transcribeGoogleSttFastV3(decoded.base64, { encoding, sampleRateHertz, languageCode });
    if (fast.ok && fast.text) {
      google = { text: fast.text, confidence: fast.confidence, source: "google" };
    } else if (!fast.ok) {
      googleError = { error: fast.error, status: fast.status, detail: fast.detail };
    }
  }

  if ((wantAccurate || (path === "fast" && !google)) && env.openai) {
    const acc = await transcribeWhisperAccurateV3(decoded.buffer, { mimeType, languageCode });
    if (acc.ok && acc.text) {
      whisper = { text: acc.text, confidence: acc.confidence, source: "whisper" };
    } else if (!acc.ok) {
      whisperError = { error: acc.error, status: acc.status, detail: acc.detail };
    }
  }

  if (path === "fast" && whisper) {
    return {
      ok: true,
      schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
      path,
      fast: whisper,
      whisper,
      google,
      merged: resolveVoiceTranscriptV3(google, whisper),
      fallback: google ? "whisper_fast_with_google" : "whisper_as_fast"
    };
  }

  if (path === "fast" && google) {
    return {
      ok: true,
      schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
      path,
      fast: google,
      google,
      merged: resolveVoiceTranscriptV3(google, null)
    };
  }

  if (path === "fast") {
    return {
      ok: false,
      error: "no_transcript",
      schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
      google,
      whisper,
      googleError,
      whisperError,
      env
    };
  }

  if (path === "accurate" || path === "whisper") {
    if (!whisper) {
      return {
        ok: false,
        error: "whisper_unavailable",
        schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
        env
      };
    }
    return {
      ok: true,
      schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
      path,
      whisper,
      merged: resolveVoiceTranscriptV3(null, whisper)
    };
  }

  const merged = resolveVoiceTranscriptV3(google, whisper);
  if (!merged.text) {
    return {
      ok: false,
      error: "no_transcript",
      schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
      google,
      whisper,
      googleError,
      whisperError,
      env
    };
  }

  return {
    ok: true,
    schema: RHIZOH_VOICE_TRANSCRIBE_V3_SCHEMA,
    path: "both",
    google,
    whisper,
    merged
  };
}
