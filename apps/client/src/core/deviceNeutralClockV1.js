/**
 * Device-neutral clock v1 — same canonical tick index on all devices.
 */

export const RHIZOH_DEVICE_NEUTRAL_CLOCK_SCHEMA_V1 = "castle.rhizoh.device_neutral_clock.v1";

/**
 * @param {number} serverTick
 * @param {number} [localOffset]
 */
export function deviceNeutralClockV1(serverTick, localOffset = 0) {
  const tick = Math.max(0, Math.floor(Number(serverTick) || 0));
  const offset = Math.max(0, Math.floor(Number(localOffset) || 0));
  return Math.max(0, tick - offset);
}

/**
 * Deterministic tick seed for layer replay.
 * @param {number} seed
 * @param {number} tick
 */
export function hashTickSeedV1(seed, tick) {
  const base = Number(seed) || 0;
  const t = Math.max(0, Number(tick) || 0);
  let h = base ^ (t * 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
