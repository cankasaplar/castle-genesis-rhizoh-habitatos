import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {object} o
 * @param {{ truthResonance: number, contradictionResonance: number, memoryResonance: number, legitimacyResonance: number, noveltyResonance: number }} o.resonanceField
 * @param {number} [o.contradiction]
 * @param {number} [o.discomfort]
 */
export function deriveConstitutionalPressure(o) {
  const r = o.resonanceField;
  const contradiction = clamp01(o.contradiction ?? r.contradictionResonance);
  const discomfort = clamp01(o.discomfort ?? contradiction * 0.7);
  const truthPressure = clamp01(r.truthResonance * 0.72 + r.legitimacyResonance * 0.18);
  const contradictionPressure = clamp01(contradiction * 0.62 + r.contradictionResonance * 0.38);
  const legitimacyPressure = clamp01(r.legitimacyResonance * 0.85 + (1 - contradictionPressure) * 0.1);
  const memoryPressure = clamp01(r.memoryResonance * 0.8 + discomfort * 0.1);
  const noveltyPressure = clamp01(r.noveltyResonance * 0.78 + (1 - r.memoryResonance) * 0.12);
  return Object.freeze([
    truthPressure,
    contradictionPressure,
    legitimacyPressure,
    memoryPressure,
    noveltyPressure
  ]);
}

/**
 * @param {number[]} prev
 * @param {number[]} next
 */
export function pressureDelta(prev, next) {
  return Object.freeze(next.map((v, i) => clamp01(v - (prev[i] ?? 0))));
}

/**
 * Constitution → pressure: stable regime dampens tension; fragile regime amplifies.
 * @param {number[]} pressureVector length 5
 * @param {Pick<import('../constitutional/constitutionalState.js').ConstitutionalState, 'confidence' | 'contradiction' | 'drift' | 'sealEntropy' | 'resonance'>} snapshot
 */
export function blendPressureWithConstitution(pressureVector, snapshot) {
  const c = clamp01(snapshot.confidence ?? 0.5);
  const k = clamp01(snapshot.contradiction ?? 0.2);
  const d = clamp01(snapshot.drift ?? 0.1);
  const h = clamp01(snapshot.sealEntropy ?? 0.5);
  const stability = clamp01(c * (1 - d * 0.5) * (1 - h * 0.35));
  const amplify = clamp01(k * 0.35 + d * 0.3 + h * 0.2 + (1 - c) * 0.15);
  const damp = clamp01(stability * 0.12);
  const boost = clamp01(amplify * 0.1);
  const p = pressureVector.slice();
  p[0] = clamp01(p[0] + damp * 0.3 - boost * 0.15);
  p[1] = clamp01(p[1] + boost - damp * 0.25);
  p[2] = clamp01(p[2] + damp * 0.35 - boost * 0.1);
  p[3] = clamp01(p[3] + boost * 0.2 - damp * 0.15);
  p[4] = clamp01(p[4] - damp * 0.2 + boost * 0.15);
  return Object.freeze(p);
}

/**
 * Apply additive feedback from injectConstitutionalFeedback.pressureRebalance.
 * @param {number[]} pressureVector
 * @param {number[]} rebalance length 5
 */
export function mergePressureRebalance(pressureVector, rebalance) {
  const r = rebalance || [0, 0, 0, 0, 0];
  return Object.freeze(
    pressureVector.map((v, i) => clamp01(v + (r[i] ?? 0)))
  );
}
