/**
 * Ambient energy witness — session room baseline vs clip maxRms (Faz 1 label only).
 * No turn authority; separates near mic speech from distant/TV-like energy.
 */

export const VOICE_AMBIENT_ENERGY_WITNESS_SCHEMA = "castle.rhizoh.voice_ambient_energy_witness.v0";

export const VOICE_AMBIENT_ENERGY_TIER = Object.freeze({
  SILENT: "silent",
  DISTANT: "distant",
  ROOM: "room",
  NEAR: "near"
});

/** EMA room baseline (normalized RMS). */
let sessionBaselineRms = 0.018;
const EMA_ALPHA = 0.08;
const NEAR_RATIO = 1.45;
const DISTANT_RATIO = 0.55;
const MIN_BASELINE = 0.008;

/**
 * @param {{ maxRms?: number }} [meta]
 */
export function observeAmbientEnergyV0(meta = {}) {
  const rms = Number(meta.maxRms);
  if (!Number.isFinite(rms) || rms <= 0) {
    return Object.freeze({
      tier: VOICE_AMBIENT_ENERGY_TIER.SILENT,
      ratio: null,
      baseline: sessionBaselineRms,
      maxRms: undefined,
      hints: ["energy:silent", "no_rms"]
    });
  }

  const cappedForBaseline = Math.min(rms, 0.08);
  sessionBaselineRms =
    sessionBaselineRms * (1 - EMA_ALPHA) + cappedForBaseline * EMA_ALPHA;
  const baseline = Math.max(MIN_BASELINE, sessionBaselineRms);
  const ratio = rms / baseline;

  let tier = VOICE_AMBIENT_ENERGY_TIER.ROOM;
  if (rms < 0.012) {
    tier = VOICE_AMBIENT_ENERGY_TIER.SILENT;
  } else if (ratio >= NEAR_RATIO) {
    tier = VOICE_AMBIENT_ENERGY_TIER.NEAR;
  } else if (ratio <= DISTANT_RATIO) {
    tier = VOICE_AMBIENT_ENERGY_TIER.DISTANT;
  }

  return Object.freeze({
    tier,
    ratio: Math.round(ratio * 100) / 100,
    baseline: Math.round(baseline * 10000) / 10000,
    maxRms: Math.round(rms * 10000) / 10000,
    hints: [`energy:${tier}`, `rms_ratio:${ratio.toFixed(2)}`]
  });
}

export function resetAmbientEnergyWitnessForTestV0() {
  sessionBaselineRms = 0.018;
}

export function getAmbientEnergyBaselineForDebugV0() {
  return sessionBaselineRms;
}
