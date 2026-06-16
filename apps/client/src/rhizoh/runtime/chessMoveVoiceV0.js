/**
 * Chess move voice — Rhizoh announces played moves (non-authoritative, observation layer).
 */

import { pickSpeechVoiceForLocaleV0 } from "./rhizohSpeechLocaleV0.js";
import { formatChessMoveSanV0 } from "./chessMoveSanV0.js";

export const CHESS_MOVE_VOICE_SCHEMA_V0 = "rhizoh.chess_move_voice.v0";

/**
 * @param {{ san: string, color?: 'w'|'b', locale?: string, engine?: string }} opts
 */
export function speakChessMoveV0(opts = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const san = formatChessMoveSanV0(opts.san);
  if (!san) return false;
  const tr = opts.locale === "tr";
  const side =
    opts.color === "b"
      ? tr
        ? "Siyah"
        : "Black"
      : tr
        ? "Beyaz"
        : "White";
  const engine = opts.engine?.startsWith("rhizoh") ? "Rhizoh" : opts.engine === "stockfish_wasm" ? "Stockfish" : "";
  const phrase = engine ? `${side}, ${san}. ${engine}.` : `${side}, ${san}.`;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase);
    u.rate = 1.05;
    u.pitch = opts.color === "w" ? 1.05 : 0.95;
    const voice = pickSpeechVoiceForLocaleV0(window.speechSynthesis.getVoices(), opts.locale || "tr");
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}
