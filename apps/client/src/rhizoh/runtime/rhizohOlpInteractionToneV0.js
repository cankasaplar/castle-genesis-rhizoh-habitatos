/**
 * OLP interaction tone — behavioral history only (never STT / UI locale inference).
 */

import { OLP_MODE_V0, readOutputLanguagePolicyV0 } from "./rhizohOutputLanguagePolicyV0.js";

/** @type {ReadonlyArray<{ atMs: number, channel: string, depthMode: string | null }>} */
let behavioralTurnRing = [];

/**
 * @param {{ channel?: string, depthMode?: string | null }} [turn]
 */
export function recordOlpBehavioralTurnV0(turn = {}) {
  const row = Object.freeze({
    atMs: Date.now(),
    channel: String(turn.channel || "voice"),
    depthMode: turn.depthMode ? String(turn.depthMode) : null
  });
  behavioralTurnRing = [...behavioralTurnRing.slice(-11), row];
  return row;
}

export function readOlpBehavioralTurnCountV0() {
  return behavioralTurnRing.length;
}

/**
 * Tone for instant ack / TTS shaping — decoupled from STT inferred locale.
 * @returns {"steady"|"adaptive"}
 */
export function readOlpInteractionToneV0() {
  const olp = readOutputLanguagePolicyV0();
  if (olp.mode !== OLP_MODE_V0.ADAPTIVE) {
    return "steady";
  }
  if (behavioralTurnRing.length >= 3) {
    return "adaptive";
  }
  return "steady";
}

/** @internal vitest */
export function __resetOlpBehavioralToneForTestV0() {
  behavioralTurnRing = [];
}
