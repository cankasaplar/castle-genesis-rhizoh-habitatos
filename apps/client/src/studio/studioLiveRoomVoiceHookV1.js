import { extractSpeechRecognitionTranscriptV0 } from "../rhizoh/runtime/extractSpeechRecognitionTranscriptV0.js";

export const STUDIO_VOICE_EVENT_V1 = "castle:studio-voice-v1";

/** @type {AudioContext | null} */
let sharedAudioContext = null;

function getSharedAudioContextV1() {
  if (typeof window === "undefined") return null;
  if (!sharedAudioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) sharedAudioContext = new Ctx();
  }
  return sharedAudioContext;
}

function getSpeechCtorV1() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function publishVoiceStateV1(detail) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.studioVoice = detail;
  try {
    window.dispatchEvent(new CustomEvent(STUDIO_VOICE_EVENT_V1, { detail }));
  } catch {
    /* noop */
  }
}

/**
 * Minimal studio voice loop — single STT session, no Cesium / spatial engine.
 * @param {{
 *   onTranscript?: (text: string, isFinal: boolean) => void,
 *   onRhizohReply?: (text: string) => void,
 *   onPresence?: (presence: string) => void,
 *   lang?: string
 * }} handlers
 */
export function attachStudioLiveRoomVoiceHookV1(handlers = {}) {
  const Ctor = getSpeechCtorV1();
  if (!Ctor) {
    const snap = { ok: false, reason: "stt_unavailable", listening: false };
    publishVoiceStateV1(snap);
    return () => {};
  }

  getSharedAudioContextV1()?.resume?.().catch(() => {});

  /** @type {SpeechRecognition | null} */
  let rec = null;
  let listening = false;

  const setPresence = (p) => handlers.onPresence?.(p);

  const stop = () => {
    listening = false;
    try {
      rec?.stop();
    } catch {
      /* noop */
    }
    rec = null;
    setPresence("observing");
    publishVoiceStateV1({ ok: true, listening: false, lastTranscript: null });
  };

  const start = () => {
    if (listening) return;
    rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = handlers.lang || "tr-TR";
    listening = true;
    setPresence("listening");
    publishVoiceStateV1({ ok: true, listening: true });

    rec.onresult = (ev) => {
      const { text, isFinal } = extractSpeechRecognitionTranscriptV0(ev);
      if (!text) return;
      handlers.onTranscript?.(text, isFinal);
      publishVoiceStateV1({ ok: true, listening: true, lastTranscript: text, isFinal });
      if (isFinal) {
        setPresence("thinking");
        window.setTimeout(() => {
          const reply = `Rhizoh: "${text}" üzerine düşünüyorum.`;
          handlers.onRhizohReply?.(reply);
          setPresence("speaking");
          publishVoiceStateV1({ ok: true, listening: true, lastReply: reply });
          window.setTimeout(() => setPresence("observing"), 2200);
        }, 600);
      }
    };

    rec.onerror = () => {
      setPresence("observing");
      publishVoiceStateV1({ ok: false, listening: false, reason: "stt_error" });
      listening = false;
    };

    rec.onend = () => {
      if (listening) {
        try {
          rec?.start();
        } catch {
          listening = false;
        }
      }
    };

    try {
      rec.start();
    } catch {
      listening = false;
      publishVoiceStateV1({ ok: false, listening: false, reason: "stt_start_failed" });
    }
  };

  return Object.freeze({ start, stop, isListening: () => listening });
}
