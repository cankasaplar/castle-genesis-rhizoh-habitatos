/**
 * Rhizoh vNext-530 — Constitutional state factory + bounds.
 * Scalars (except version) live in [0, 1] to avoid runaway drift.
 */

/** @typedef {{ id: string, tier: number, confidence: number, entropy: number, timestamp: number }} Seal */

export const CONSTITUTION_VECTOR_DIM = 8;
export const POLICY_WEIGHT_DIM = 5;

export function clamp01(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x;
}

/**
 * @param {number} [now]
 * @returns {ConstitutionalState}
 */
export function createInitialConstitutionalState(now = 0) {
  const constitutionVector = new Float32Array(CONSTITUTION_VECTOR_DIM);
  constitutionVector.fill(0.5);
  const policyWeights = new Float32Array(POLICY_WEIGHT_DIM);
  policyWeights[0] = 0.72; // trustThreshold
  policyWeights[1] = 0.48; // noveltyBias
  policyWeights[2] = 0.42; // contradictionTolerance
  policyWeights[3] = 0.35; // memoryDecay
  policyWeights[4] = 0.55; // verificationDepth
  return {
    version: 0,
    confidence: 0.5,
    contradiction: 0.15,
    sealEntropy: 0.45,
    resonance: 0.5,
    drift: 0.08,
    sovereignTier: 1 / 3,
    constitutionVector,
    policyWeights,
    lastMutationAt: 0,
    lastVerifiedAt: now,
    activeSeal: null
  };
}

/**
 * @param {ConstitutionalState} s
 * @returns {ConstitutionalState}
 */
export function cloneConstitutionalState(s) {
  return {
    version: s.version,
    confidence: s.confidence,
    contradiction: s.contradiction,
    sealEntropy: s.sealEntropy,
    resonance: s.resonance,
    drift: s.drift,
    sovereignTier: s.sovereignTier,
    constitutionVector: new Float32Array(s.constitutionVector),
    policyWeights: new Float32Array(s.policyWeights),
    lastMutationAt: s.lastMutationAt,
    lastVerifiedAt: s.lastVerifiedAt,
    activeSeal: s.activeSeal ? { ...s.activeSeal } : null
  };
}

/**
 * @typedef {object} ConstitutionalState
 * @property {number} version
 * @property {number} confidence
 * @property {number} contradiction
 * @property {number} sealEntropy
 * @property {number} resonance
 * @property {number} drift
 * @property {number} sovereignTier
 * @property {Float32Array} constitutionVector
 * @property {Float32Array} policyWeights
 * @property {number} lastMutationAt
 * @property {number} lastVerifiedAt
 * @property {Seal | null} activeSeal
 */
