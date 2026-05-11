/**
 * vNext-543 — Ağ örneklemesi ve anlatım için rastgele jitter’lı cadence (ambient computing).
 */

/**
 * @param {number} minMs
 * @param {number} maxMs
 */
export function randomDelayMs(minMs, maxMs) {
  const a = Math.min(minMs, maxMs);
  const b = Math.max(minMs, maxMs);
  return a + Math.random() * (b - a);
}

/**
 * @param {object} [opts]
 * @param {number} [opts.minMs] default 30s
 * @param {number} [opts.maxMs] default 90s
 * @param {number} [opts.lowPowerMultiplier] >1 daha seyrek
 */
export function nextNetworkSampleDelayMs(opts = {}) {
  const mul = opts.lowPowerMultiplier ?? 1;
  const min = (opts.minMs ?? 30_000) * mul;
  const max = (opts.maxMs ?? 90_000) * mul;
  return randomDelayMs(min, max);
}

/**
 * @param {object} [opts]
 * @param {number} [opts.minMs] default 2 dk
 * @param {number} [opts.maxMs] default 8 dk
 */
export function nextNarrationCadenceDelayMs(opts = {}) {
  const min = opts.minMs ?? 120_000;
  const max = opts.maxMs ?? 480_000;
  return randomDelayMs(min, max);
}
