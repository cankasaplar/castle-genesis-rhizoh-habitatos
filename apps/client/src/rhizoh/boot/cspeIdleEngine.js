/**
 * CSPE idle layer — probability-of-presence / entropy sampler (pre-breath only).
 * Not a full physics step; ontological sandbox substrate for controlled drift.
 */

/** @param {number} x @param {number} a @param {number} b */
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

/**
 * @param {{
 *   micActive?: boolean,
 *   cursorActivity?: boolean,
 *   tabFocused?: boolean,
 *   windowFocused?: boolean,
 *   pointerVelocity?: number,
 *   prevEntropy?: number
 * }} input
 * @returns {{ presenceProbability: number, entropyEstimate: number, sampledAt: number }}
 */
export function sampleCspeIdleField(input = {}) {
  const mic = !!input.micActive;
  const cur = !!input.cursorActivity;
  const tab = input.tabFocused !== false;
  const win = input.windowFocused !== false;
  const pv = Math.max(0, Number(input.pointerVelocity) || 0);
  const prevE = clamp(Number(input.prevEntropy) || 0, 0, 0.85);

  const activity =
    (mic ? 0.24 : 0) +
    (cur ? 0.2 : 0) +
    Math.min(0.22, pv / 3800) +
    (tab ? 0.05 : 0.14) +
    (win ? 0.04 : 0.1);

  const presenceProbability = clamp(0.1 + activity * 0.95, 0.08, 0.93);
  let entropy = prevE * 0.93 + activity * 0.085 + Math.sin(Date.now() / 98_341) * 0.011;
  entropy = clamp(entropy, 0, 0.82);

  return {
    presenceProbability: Math.round(presenceProbability * 1000) / 1000,
    entropyEstimate: Math.round(entropy * 1000) / 1000,
    sampledAt: Date.now()
  };
}
