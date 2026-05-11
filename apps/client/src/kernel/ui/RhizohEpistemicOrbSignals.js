/**
 * Living constitution display — maps constitutional state → orb channels.
 *
 * Orb ring → composite metric
 * core glow → confidence
 * pulse distortion → contradiction
 * shell noise → seal entropy
 * harmonic aura → resonance field
 * tilt vector → drift
 * outer crown → sovereign tier
 * inner crown → mutation pending/sealed state
 * inner shimmer → discomfort
 */

/**
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} state
 * @param {{ discomfort?: number, resonanceVector?: { truthResonance: number, contradictionResonance: number, memoryResonance: number, legitimacyResonance: number, noveltyResonance: number }, mutationPending?: boolean, mutationSealed?: boolean }} [runtime]
 */
export function mapConstitutionToOrbSignals(state, runtime = {}) {
  const discomfort = Math.max(0, Math.min(1, runtime.discomfort ?? 0));
  const rv = runtime.resonanceVector || {
    truthResonance: state.resonance,
    contradictionResonance: state.contradiction,
    memoryResonance: state.resonance,
    legitimacyResonance: 1 - state.sealEntropy,
    noveltyResonance: 1 - state.resonance * 0.6
  };
  const mutationPending = !!runtime.mutationPending;
  const mutationSealed = !!runtime.mutationSealed;
  const innerCrown = mutationSealed ? 1 : mutationPending ? 0.55 : 0.1;
  const ringMetric =
    0.18 * state.confidence +
    0.18 * (1 - state.contradiction) +
    0.16 * (1 - state.sealEntropy) +
    0.12 * rv.truthResonance +
    0.1 * rv.memoryResonance +
    0.1 * rv.legitimacyResonance +
    0.06 * (1 - rv.contradictionResonance) +
    0.17 * (1 - state.drift) +
    0.08 * (1 - discomfort) +
    0.03 * innerCrown;

  return Object.freeze({
    ringMetric,
    coreGlow: state.confidence,
    pulseDistortion: state.contradiction,
    shellNoise: state.sealEntropy,
    harmonicAura: rv.memoryResonance,
    harmonicLayers: Object.freeze({
      lowHum: rv.truthResonance,
      shimmer: rv.noveltyResonance,
      ripple: rv.contradictionResonance,
      stableRing: rv.legitimacyResonance,
      ghostEcho: rv.memoryResonance
    }),
    tiltVector: state.drift,
    crownRing: state.sovereignTier,
    outerCrown: state.sovereignTier,
    innerCrown,
    mutationPending,
    mutationSealed,
    innerShimmer: discomfort
  });
}
