/**
 * Reply rhythm diagnostic — compare chat (A) vs TTS (B) per turn.
 * DevTools: window.__CASTLE_RHIZOH_REPLY_RHYTHM__ · compareRhizohReplyRhythmV0()
 */

export const RHIZOH_REPLY_RHYTHM_DIAG_SCHEMA_V0 = "castle.rhizoh.reply_rhythm_diagnostic.v0";

/** @type {object | null} */
let lastTurn = null;

function readLlmMirrorV0() {
  if (typeof window === "undefined") return null;
  return window.__CASTLE_RHIZOH_LLM_LAST_RESPONSE__ || null;
}

/**
 * @param {{
 *   channel: "chat_ui" | "tts",
 *   text: string,
 *   traceId?: string,
 *   source?: string,
 *   meta?: Record<string, unknown>
 * }} input
 */
export function recordRhizohReplySurfaceV0(input) {
  const channel = String(input.channel || "");
  const text = String(input.text || "");
  const traceId = String(input.traceId || readLlmMirrorV0()?.traceId || "").trim();
  const atMs = Date.now();

  if (!lastTurn || (traceId && lastTurn.traceId && lastTurn.traceId !== traceId)) {
    lastTurn = {
      traceId: traceId || `local-${atMs}`,
      atMs,
      chatUi: null,
      tts: null,
      llmMirror: null
    };
  }

  const row = Object.freeze({
    text,
    chars: text.length,
    preview: text.slice(0, 160),
    atMs,
    source: String(input.source || ""),
    meta: input.meta && typeof input.meta === "object" ? Object.freeze({ ...input.meta }) : null
  });

  if (channel === "chat_ui") lastTurn.chatUi = row;
  else if (channel === "tts") lastTurn.tts = row;

  lastTurn.llmMirror = readLlmMirrorV0();
  lastTurn.comparedAtMs = atMs;

  const snap = publishRhizohReplyRhythmDiagnosticV0();
  return snap;
}

export function publishRhizohReplyRhythmDiagnosticV0() {
  const chat = lastTurn?.chatUi?.text || "";
  const tts = lastTurn?.tts?.text || "";
  const chatChars = chat.length;
  const ttsChars = tts.length;
  const llm = lastTurn?.llmMirror || readLlmMirrorV0();

  let verdict = "pending";
  let hint = "Record both chat_ui and tts for the same turn.";

  if (chat && tts) {
    if (chat === tts) {
      verdict = "aligned";
      hint = "Chat and TTS share the same string — if speech still feels cut off, suspect browser TTS or prosody gaps.";
    } else if (tts.length < chat.length && chat.startsWith(tts.slice(0, Math.min(32, tts.length)))) {
      verdict = "tts_truncated";
      hint = "TTS is shorter than chat — check speakRhizoh 1800 cap or speakRhizohReplyChunked segment limit.";
    } else if (chat.length < tts.length) {
      verdict = "chat_shorter";
      hint = "Chat shorter than TTS — unusual; check UI coercion vs speech path.";
    } else {
      verdict = "divergent";
      hint = "Different text on chat vs TTS — check materializeComms / language commit paths.";
    }
  } else if (chat && !tts) {
    verdict = "tts_missing";
    hint = "Chat recorded but no TTS yet — wait until speech starts or skipSpeech was true.";
  } else if (!chat && tts) {
    verdict = "chat_missing";
    hint = "TTS without chat snapshot — HUD may not have updated.";
  }

  const snap = Object.freeze({
    schema: RHIZOH_REPLY_RHYTHM_DIAG_SCHEMA_V0,
    traceId: lastTurn?.traceId || "",
    atMs: lastTurn?.atMs || Date.now(),
    verdict,
    hint,
    chatUi: lastTurn?.chatUi || null,
    tts: lastTurn?.tts || null,
    chatChars,
    ttsChars,
    charDelta: chatChars - ttsChars,
    llmReplyChars: Number(llm?.replyChars) || null,
    llmPreview: String(llm?.replyPreview || ""),
    llmDrift: llm?.replyContractDriftClass || null
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_REPLY_RHYTHM__ = snap;
    window.compareRhizohReplyRhythmV0 = compareRhizohReplyRhythmV0;
  }

  return snap;
}

/** Console-friendly A vs B report. */
export function compareRhizohReplyRhythmV0() {
  const snap = publishRhizohReplyRhythmDiagnosticV0();
  const lines = [
    `[Rhizoh reply rhythm] verdict=${snap.verdict}`,
    snap.hint,
    `traceId: ${snap.traceId || "—"}`,
    `LLM mirror: ${snap.llmReplyChars ?? "?"} chars · drift=${snap.llmDrift ?? "—"}`,
    "",
    "A · chat UI:",
    snap.chatUi?.preview || "(not recorded)",
    `   ${snap.chatChars} chars`,
    "",
    "B · TTS spoken:",
    snap.tts?.preview || "(not recorded)",
    `   ${snap.ttsChars} chars`,
    "",
    `delta (A−B): ${snap.charDelta} chars`
  ];
  const report = lines.join("\n");
  try {
    console.info(report);
  } catch {
    /* noop */
  }
  return Object.freeze({ ...snap, report });
}

/** @internal vitest */
export function __resetRhizohReplyRhythmDiagnosticForTestV0() {
  lastTurn = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_REPLY_RHYTHM__;
      delete window.compareRhizohReplyRhythmV0;
    } catch {
      /* noop */
    }
  }
}
