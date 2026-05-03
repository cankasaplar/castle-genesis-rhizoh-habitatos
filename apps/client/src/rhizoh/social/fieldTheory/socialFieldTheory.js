import { computeAttentionVectorField } from "./attentionVectorField.js";
import { computeTrustScalarDensity } from "./trustScalarDensity.js";
import { computePresenceWaves } from "./presenceWave.js";
import { computeInterferencePattern } from "./interactionInterference.js";

export function createInitialSocialFieldTheoryState() {
  return {
    attentionField: { vx: 0, vy: 0, magnitude: 0, directionLabel: "self_anchor" },
    trustDensity: { meanRho: 0, totalMass: 0, samples: [] },
    presenceWaves: [],
    interference: {
      intensity: 0,
      contrast: 0.5,
      pattern: "flat",
      coherentEnergy: 0,
      incoherentEnergy: 0,
      rawRatio: 1
    },
    updatedAt: Date.now()
  };
}

/**
 * Compose Social Physics + CSIL registry into a field-theoretic snapshot.
 * @param {unknown} prev
 * @param {{
 *   socialPhysics?: unknown,
 *   relationships?: unknown,
 *   entities?: unknown,
 *   presenceTelemetry?: unknown
 * }} input
 */
export function advanceSocialFieldTheory(prev, input) {
  const base = createInitialSocialFieldTheoryState();
  const p = prev && typeof prev === "object" ? prev : {};
  const ins = input && typeof input === "object" ? input : {};
  const sp = ins.socialPhysics && typeof ins.socialPhysics === "object" ? ins.socialPhysics : {};
  const rel = ins.relationships && typeof ins.relationships === "object" ? ins.relationships : {};
  const ent = ins.entities && typeof ins.entities === "object" ? ins.entities : {};
  const now = Date.now();

  const attentionField = computeAttentionVectorField(sp);
  const trustDensity = computeTrustScalarDensity(rel);
  const presenceWaves = computePresenceWaves(ent, rel, now);
  const interference = computeInterferencePattern(presenceWaves);

  return {
    attentionField,
    trustDensity,
    presenceWaves,
    interference,
    updatedAt: now,
    priorContrast: p.interference && typeof p.interference === "object" ? p.interference.contrast : null
  };
}
