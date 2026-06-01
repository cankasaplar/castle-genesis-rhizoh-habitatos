/**
 * T0 continuity pulse stream — living surface log (not tutorial; curiosity feed).
 * @see docs/RHIZOH_T0_CONTINUITY_SURFACE_V0.md
 */

export const T0_CONTINUITY_PULSE_EVENT_V0 = "rhizoh:t0-continuity-pulse";

const MAX_PULSES = 16;

/** @type {{ at: number, line: string, kind: string }[]} */
const pulses = [];

/**
 * @param {string} line
 * @param {string} [kind]
 */
export function pushT0ContinuityPulseV0(line, kind = "pulse") {
  const text = String(line || "").trim();
  if (!text) return;
  const row = Object.freeze({
    at: Date.now(),
    line: text,
    kind: String(kind || "pulse")
  });
  pulses.push(row);
  while (pulses.length > MAX_PULSES) pulses.shift();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(T0_CONTINUITY_PULSE_EVENT_V0, { detail: Object.freeze({ ...row }) })
    );
  }
}

/**
 * @returns {readonly { at: number, line: string, kind: string }[]}
 */
export function readT0ContinuityPulseStreamV0() {
  return Object.freeze([...pulses]);
}

export function resetT0ContinuityPulseStreamV0() {
  pulses.length = 0;
}

/**
 * Seed stream on session — honest, non-performative voice.
 */
export function seedT0ContinuityPulseStreamV0() {
  if (pulses.length > 0) return;
  pushT0ContinuityPulseV0("Süreklilik yüzeyi hazır · harita ve sohbet açık", "ready");
  pushT0ContinuityPulseV0("İstersen kale kur · anı ekle · dünyaya bağlan", "affordance");
}
