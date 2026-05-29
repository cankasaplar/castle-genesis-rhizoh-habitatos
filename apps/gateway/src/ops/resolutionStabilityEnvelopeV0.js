/**
 * Resolution Stability Envelope v0 — same perception → same decision (Phase 3 gate).
 * Mitigates resolution instability risk under borderline / mixed-signal inputs.
 * @see docs/ops/RESOLUTION_STABILITY_ENVELOPE_V1.0.md
 */
import crypto from "node:crypto";
import {
  classifyStressResponseV0,
  canonicalizeStressInputV0,
  applyActionConfidenceSofteningV0,
  ACTION_CONFIDENCE_DEAD_BAND_V0,
  ACTION_CONFIDENCE_THRESHOLD_V0,
  RESPONSE_ACTION_V0
} from "./stressResponseTaxonomyV0.js";

export const RESOLUTION_STABILITY_SCHEMA_V0 = "rhizoh.resolution_stability.envelope.v0";

/** Iterations per probe — must be bit-identical across runs. */
export const STABILITY_PROBE_ITERATIONS_V0 = 64;

/**
 * Deterministic fingerprint of resolved decision (not wall-clock).
 * @param {ReturnType<typeof classifyStressResponseV0>} taxonomy
 */
export function fingerprintStressResolutionV0(taxonomy) {
  const payload = JSON.stringify({
    stressClass: taxonomy.stressClass,
    stressSecondary: taxonomy.stressSecondary,
    responseAction: taxonomy.responseAction,
    responseActionStrict: taxonomy.responseActionStrict,
    actionSoftened: taxonomy.actionSoftened,
    actionBorderline: taxonomy.actionBorderline,
    userFacingAction: taxonomy.userFacingAction,
    conflictResolution: taxonomy.conflictResolution,
    stressConfidence: taxonomy.stressConfidence,
    actionConfidence: taxonomy.actionConfidence
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

/**
 * @param {Parameters<typeof classifyStressResponseV0>[0]} input
 * @param {number} [iterations]
 */
export function probeResolutionStabilityV0(input, iterations = STABILITY_PROBE_ITERATIONS_V0) {
  const canonical = canonicalizeStressInputV0(input);
  /** @type {string[]} */
  const fingerprints = [];
  let first = null;

  for (let i = 0; i < iterations; i++) {
    const t = classifyStressResponseV0(input);
    const fp = fingerprintStressResolutionV0(t);
    fingerprints.push(fp);
    if (!first) first = { taxonomy: t, fingerprint: fp };
  }

  const unique = [...new Set(fingerprints)];
  const stable = unique.length === 1;

  return {
    stable,
    iterations,
    canonical,
    fingerprint: unique[0] || null,
    uniqueFingerprints: unique,
    sample: first
      ? {
          stressClass: first.taxonomy.stressClass,
          responseAction: first.taxonomy.responseAction,
          responseActionStrict: first.taxonomy.responseActionStrict,
          actionSoftened: first.taxonomy.actionSoftened,
          actionBorderline: first.taxonomy.actionBorderline,
          stressConfidence: first.taxonomy.stressConfidence,
          actionConfidence: first.taxonomy.actionConfidence
        }
      : null
  };
}

/** Borderline + mixed-signal catalog for Phase 3 stability envelope. */
export const STABILITY_ENVELOPE_SCENARIOS_V0 = Object.freeze([
  { name: "single_overload", input: { code: "phased_rollout_capacity" } },
  { name: "single_cost", input: { code: "cost_hard_limit" } },
  { name: "attack_cost_mixed", input: { codes: ["prompt_abuse_detected", "cost_hard_limit"] } },
  { name: "drift_overload_hybrid", input: { codes: ["phased_rollout_capacity", "behavioral_drift_suspected"] } },
  { name: "camouflage_borderline", input: { code: "rate_limit_exceeded", injectionFlag: true } },
  { name: "outage_drift", input: { codes: ["provider_http_503", "behavioral_drift_suspected"] } },
  { name: "unknown_code_fallback", input: { code: "mystery_gateway_code_xyz" } }
]);

/**
 * Dead-band hysteresis: micro drift inside [0.68, 0.72) must not flip soften vs strict.
 */
export function verifyConfidenceBoundaryHysteresisV0() {
  const samples = [0.69, 0.71].map((ac) =>
    applyActionConfidenceSofteningV0(RESPONSE_ACTION_V0.ISOLATE, ac)
  );
  const sameApplied = samples[0].responseAction === samples[1].responseAction;
  const sameSoftened = samples[0].actionSoftened === samples[1].actionSoftened;
  const bothBorderline = samples.every((s) => s.actionBorderline === true);
  const highStrict = applyActionConfidenceSofteningV0(RESPONSE_ACTION_V0.ISOLATE, 0.79);

  return {
    pass:
      sameApplied &&
      sameSoftened &&
      bothBorderline &&
      samples[0].actionSoftened === true &&
      highStrict.actionSoftened === false,
    deadBand: ACTION_CONFIDENCE_DEAD_BAND_V0,
    samples: samples.map((s) => ({
      responseAction: s.responseAction,
      actionSoftened: s.actionSoftened,
      actionBorderline: s.actionBorderline
    }))
  };
}

/**
 * Phase 3 gate: every catalog scenario must be perfectly stable across probes.
 */
export function verifyResolutionStabilityEnvelopeV0() {
  const hysteresis = verifyConfidenceBoundaryHysteresisV0();
  const results = STABILITY_ENVELOPE_SCENARIOS_V0.map((s) => {
    const probe = probeResolutionStabilityV0(s.input);
    return {
      name: s.name,
      pass: probe.stable,
      fingerprint: probe.fingerprint,
      uniqueCount: probe.uniqueFingerprints.length,
      sample: probe.sample
    };
  });

  return {
    schema: RESOLUTION_STABILITY_SCHEMA_V0,
    actionConfidenceThreshold: ACTION_CONFIDENCE_THRESHOLD_V0,
    probeIterations: STABILITY_PROBE_ITERATIONS_V0,
    confidenceBoundaryHysteresis: hysteresis,
    pass: results.every((r) => r.pass) && hysteresis.pass,
    scenarios: results
  };
}
