/**
 * Stress Geometry v0 — Phase 3 mathematical layer.
 * Entropy vector space · execution drift heatmap · behavioral consistency score (BCS).
 * @see docs/ops/STRESS_GEOMETRY_PHASE3_V1.0.md
 */
import crypto from "node:crypto";
import {
  classifyStressResponseV0,
  canonicalizeStressInputV0,
  collectStressSignalsV0,
  STRESS_CLASS_V0,
  ACTION_CONFIDENCE_DEAD_BAND_V0,
  ACTION_CONFIDENCE_SOFTEN_ENTER_V0,
  ACTION_CONFIDENCE_STRICT_FULL_V0
} from "./stressResponseTaxonomyV0.js";
import {
  fingerprintStressResolutionV0,
  probeResolutionStabilityV0,
  verifyConfidenceBoundaryHysteresisV0
} from "./resolutionStabilityEnvelopeV0.js";

export const STRESS_GEOMETRY_SCHEMA_V0 = "rhizoh.stress_geometry.v0";

/** Engineering SSOT — no ontological claims. */
export const RHIZOH_ENGINEERING_IDENTITY_V0 = "bounded_observability_and_execution_system";
export const RHIZOH_ENGINEERING_DEFINITION_V0 =
  "Measures divergence between modeled state and observed state under controlled constraints";
export const PHASE3_ENGINEERING_KIND_V0 = "controlled_mismatch_measurement_layer";
export const PHASE3_ENGINEERING_OUTCOME_V0 =
  "divergence_instrumentation_under_constrained_execution";

/** @readonly Entropy axes e = (e1..e5) in [0,1]^5. */
export const ENTROPY_AXIS_V0 = Object.freeze({
  INPUT_DIVERSITY: "input_diversity",
  BOUNDARY_DENSITY: "boundary_density",
  ADVERSARIAL_MIX: "adversarial_mix",
  ECONOMIC_PRESSURE: "economic_pressure",
  BASELINE_DEVIATION: "baseline_deviation"
});

/** @readonly Axis order for vector serialization. */
export const ENTROPY_AXIS_ORDER_V0 = Object.freeze([
  ENTROPY_AXIS_V0.INPUT_DIVERSITY,
  ENTROPY_AXIS_V0.BOUNDARY_DENSITY,
  ENTROPY_AXIS_V0.ADVERSARIAL_MIX,
  ENTROPY_AXIS_V0.ECONOMIC_PRESSURE,
  ENTROPY_AXIS_V0.BASELINE_DEVIATION
]);

/** Weights for ||e||_w (entropy expansion magnitude). */
export const ENTROPY_AXIS_WEIGHTS_V0 = Object.freeze({
  [ENTROPY_AXIS_V0.INPUT_DIVERSITY]: 1.0,
  [ENTROPY_AXIS_V0.BOUNDARY_DENSITY]: 1.2,
  [ENTROPY_AXIS_V0.ADVERSARIAL_MIX]: 1.4,
  [ENTROPY_AXIS_V0.ECONOMIC_PRESSURE]: 1.1,
  [ENTROPY_AXIS_V0.BASELINE_DEVIATION]: 0.9
});

const STRESS_CLASS_SET = new Set(Object.values(STRESS_CLASS_V0));
const COST_CODES = new Set(["cost_hard_limit", "cost_soft_downgrade"]);

/**
 * Truth-layer fingerprint (invariant label geometry).
 * @param {ReturnType<typeof classifyStressResponseV0>} t
 */
export function fingerprintTruthLayerV0(t) {
  const payload = JSON.stringify({
    stressClass: t.stressClass,
    stressSecondary: [...(t.stressSecondary || [])].sort(),
    conflictResolution: t.conflictResolution
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/**
 * Execution-layer fingerprint (applied reflex geometry).
 * @param {ReturnType<typeof classifyStressResponseV0>} t
 */
export function fingerprintExecutionLayerV0(t) {
  const payload = JSON.stringify({
    userFacingAction: t.userFacingAction ?? t.responseAction,
    actionSoftened: t.actionSoftened === true,
    actionBorderline: t.actionBorderline === true
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/**
 * e1 — normalized signal/class diversity (Shannon over stress classes in signals).
 * @param {ReturnType<typeof collectStressSignalsV0>} signals
 * @param {ReturnType<typeof classifyStressResponseV0>} taxonomy
 */
function axisInputDiversityV0(signals, taxonomy) {
  const classes = new Set();
  for (const s of signals) {
    const mapped = classifyStressResponseV0({ code: s.code });
    classes.add(mapped.stressClass);
  }
  classes.add(taxonomy.stressClass);
  for (const sec of taxonomy.stressSecondary || []) classes.add(sec);
  const k = classes.size;
  const maxK = STRESS_CLASS_SET.size;
  return Number(Math.min(1, (k - 1) / Math.max(1, maxK - 1)).toFixed(4));
}

/**
 * e2 — proximity to hysteresis dead-band (1 at center, 0 far from band).
 * @param {number} actionConfidence
 */
function axisBoundaryDensityV0(actionConfidence) {
  const ac = Number(actionConfidence) || 0;
  const { enter, exit } = ACTION_CONFIDENCE_DEAD_BAND_V0;
  if (ac >= enter && ac < exit) {
    const mid = (enter + exit) / 2;
    const half = (exit - enter) / 2;
    return Number((1 - Math.abs(ac - mid) / half).toFixed(4));
  }
  if (ac < enter) return Number(Math.max(0, 1 - (enter - ac) / enter).toFixed(4));
  return Number(Math.max(0, 1 - (ac - exit) / (1 - exit)).toFixed(4));
}

/**
 * e3 — adversarial mixture intensity [0,1].
 * @param {Parameters<typeof classifyStressResponseV0>[0]} input
 */
function axisAdversarialMixV0(input) {
  let score = 0;
  if (input.injectionFlag === true) score += 0.5;
  const flags = input.riskFlags || [];
  if (flags.some((f) => /abuse|attack|jailbreak|injection/i.test(String(f)))) score += 0.35;
  const signals = collectStressSignalsV0(input);
  if (signals.some((s) => s.code === "prompt_abuse_detected")) score += 0.4;
  if (
    signals.some((s) => /rate_limit|phased_rollout|overload/i.test(s.code)) &&
    score > 0
  ) {
    score += 0.15;
  }
  return Number(Math.min(1, score).toFixed(4));
}

/**
 * e4 — economic pressure proxy from cost signals.
 * @param {ReturnType<typeof collectStressSignalsV0>} signals
 */
function axisEconomicPressureV0(signals) {
  const costHits = signals.filter((s) => COST_CODES.has(s.code)).length;
  if (costHits === 0) return 0;
  return Number(Math.min(1, 0.5 + 0.25 * costHits).toFixed(4));
}

/**
 * e5 — deviation from baseline tool entropy (optional baseline JSON).
 * @param {object | null | undefined} baseline
 * @param {ReturnType<typeof collectStressSignalsV0>} signals
 */
function axisBaselineDeviationV0(baseline, signals) {
  if (!baseline?.cohorts?.length) {
    return signals.length > 2 ? 0.35 : 0.1;
  }
  const ref = baseline.cohorts[baseline.cohorts.length - 1];
  const refEntropy = Number(ref.toolEntropyBits ?? 1);
  const signalEntropy = shannonBitsFromCodesV0(signals.map((s) => s.code));
  const delta = Math.abs(signalEntropy - refEntropy);
  return Number(Math.min(1, delta / Math.max(refEntropy, 0.5)).toFixed(4));
}

/**
 * @param {string[]} codes
 */
function shannonBitsFromCodesV0(codes) {
  const hist = {};
  for (const c of codes) hist[c] = (hist[c] || 0) + 1;
  const total = codes.length || 1;
  let h = 0;
  for (const n of Object.values(hist)) {
    const p = n / total;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Entropy vector e ∈ [0,1]^5 for probe point.
 * @param {Parameters<typeof classifyStressResponseV0>[0]} input
 * @param {{ baseline?: object | null }} [opts]
 */
export function encodeEntropyVectorV0(input, opts = {}) {
  const taxonomy = classifyStressResponseV0(input);
  const signals = collectStressSignalsV0(input);
  const actionConfidence =
    taxonomy.actionConfidence ?? taxonomy.stressConfidence ?? 0;

  const components = {
    [ENTROPY_AXIS_V0.INPUT_DIVERSITY]: axisInputDiversityV0(signals, taxonomy),
    [ENTROPY_AXIS_V0.BOUNDARY_DENSITY]: axisBoundaryDensityV0(actionConfidence),
    [ENTROPY_AXIS_V0.ADVERSARIAL_MIX]: axisAdversarialMixV0(input),
    [ENTROPY_AXIS_V0.ECONOMIC_PRESSURE]: axisEconomicPressureV0(signals),
    [ENTROPY_AXIS_V0.BASELINE_DEVIATION]: axisBaselineDeviationV0(opts.baseline, signals)
  };

  const vector = ENTROPY_AXIS_ORDER_V0.map((axis) => components[axis]);
  return Object.freeze({
    axes: ENTROPY_AXIS_ORDER_V0,
    components,
    vector,
    magnitude: entropyMagnitudeV0(components),
    canonical: canonicalizeStressInputV0(input),
    taxonomySummary: {
      stressClass: taxonomy.stressClass,
      userFacingAction: taxonomy.userFacingAction ?? taxonomy.responseAction,
      actionSoftened: taxonomy.actionSoftened,
      stressConfidence: taxonomy.stressConfidence,
      actionConfidence
    }
  });
}

/**
 * Weighted L2 norm ||e||_w — entropy expansion magnitude.
 * @param {Record<string, number>} components
 */
export function entropyMagnitudeV0(components) {
  let sum = 0;
  for (const axis of ENTROPY_AXIS_ORDER_V0) {
    const w = ENTROPY_AXIS_WEIGHTS_V0[axis] ?? 1;
    const v = components[axis] ?? 0;
    sum += w * v * v;
  }
  return Number(Math.sqrt(sum).toFixed(4));
}

/**
 * Phase 3 entropy lattice — structured points in input space.
 */
export function buildPhase3EntropyLatticeV0() {
  return Object.freeze([
    { id: "p3_01_single_overload", input: { code: "phased_rollout_capacity" } },
    { id: "p3_02_single_cost", input: { code: "cost_hard_limit" } },
    { id: "p3_03_single_attack", input: { code: "prompt_abuse_detected" } },
    { id: "p3_04_drift_only", input: { driftSuspected: true } },
    { id: "p3_05_outage", input: { providerHttpStatus: 503 } },
    { id: "p3_06_attack_cost", input: { codes: ["prompt_abuse_detected", "cost_hard_limit"] } },
    { id: "p3_07_overload_drift", input: { codes: ["phased_rollout_capacity", "behavioral_drift_suspected"] } },
    { id: "p3_08_outage_drift", input: { codes: ["provider_http_503", "behavioral_drift_suspected"] } },
    { id: "p3_09_camouflage", input: { code: "rate_limit_exceeded", injectionFlag: true } },
    { id: "p3_10_cost_soft", input: { code: "cost_soft_downgrade" } },
    { id: "p3_11_emergency", input: { code: "agent_emergency_disable" } },
    { id: "p3_12_unknown", input: { code: "synthetic_unknown_stress_xyz" } },
    { id: "p3_13_triple_mix", input: { codes: ["rate_limit_exceeded", "cost_hard_limit", "behavioral_drift_suspected"], injectionFlag: true } },
    { id: "p3_14_policy_block", input: { rhizohFailureKind: "policy_block" } },
    { id: "p3_15_rate_only", input: { code: "rate_limit_exceeded" } }
  ]);
}

/**
 * Probe one lattice point: stability + geometry.
 * @param {{ id: string, input: object }} point
 * @param {{ baseline?: object | null, stabilityIterations?: number }} [opts]
 */
export function probeStressGeometryPointV0(point, opts = {}) {
  const stability = probeResolutionStabilityV0(
    point.input,
    opts.stabilityIterations ?? 16
  );
  const entropy = encodeEntropyVectorV0(point.input, { baseline: opts.baseline });
  const taxonomy = classifyStressResponseV0(point.input);
  const truthKey = fingerprintTruthLayerV0(taxonomy);
  const executionKey = fingerprintExecutionLayerV0(taxonomy);
  const fullKey = fingerprintStressResolutionV0(taxonomy);

  return {
    id: point.id,
    stable: stability.stable,
    fingerprint: fullKey,
    truthKey,
    executionKey,
    canonical: entropy.canonical,
    entropy,
    taxonomy: {
      stressClass: taxonomy.stressClass,
      stressSecondary: taxonomy.stressSecondary,
      responseAction: taxonomy.responseAction,
      responseActionStrict: taxonomy.responseActionStrict,
      userFacingAction: taxonomy.userFacingAction,
      actionSoftened: taxonomy.actionSoftened,
      actionBorderline: taxonomy.actionBorderline,
      stressConfidence: taxonomy.stressConfidence,
      actionConfidence: taxonomy.actionConfidence
    }
  };
}

/**
 * Perception heatmap H_c[canonical][execution] — gate metric (stable truth = stable perception).
 * Truth spread heatmap H_t[truth][execution] — audit only (same label, different inputs).
 * @param {ReturnType<typeof probeStressGeometryPointV0>[]} probes
 */
export function buildExecutionDriftHeatmapV0(probes) {
  /**
   * @param {string} rowKey
   * @param {string} rowKind
   */
  function buildLayer(rowKey, rowKind) {
    /** @type {Record<string, Record<string, number>>} */
    const matrix = {};
    /** @type {Record<string, number>} */
    const totals = {};

    for (const p of probes) {
      const key = rowKey === "canonical" ? p.canonical : p.truthKey;
      if (!matrix[key]) matrix[key] = {};
      matrix[key][p.executionKey] = (matrix[key][p.executionKey] || 0) + 1;
      totals[key] = (totals[key] || 0) + 1;
    }

    /** @type {{ rowKey: string, executionKey: string, count: number, rowShare: number, rowKind: string }[]} */
    const cells = [];
    /** @type {{ rowKey: string, drift: number, dominantExecution: string, rowMass: number, rowKind: string }[]} */
    const rowDrift = [];

    for (const [rk, cols] of Object.entries(matrix)) {
      const rowTotal = totals[rk] || 1;
      let maxCount = 0;
      let dominantExecution = "";
      for (const [executionKey, count] of Object.entries(cols)) {
        cells.push({
          rowKey: rk,
          rowKind,
          executionKey,
          count,
          rowShare: Number((count / rowTotal).toFixed(4))
        });
        if (count > maxCount) {
          maxCount = count;
          dominantExecution = executionKey;
        }
      }
      const drift = Number((1 - maxCount / rowTotal).toFixed(4));
      rowDrift.push({ rowKey: rk, rowKind, drift, dominantExecution, rowMass: rowTotal });
    }

    const meanDrift =
      rowDrift.length > 0
        ? Number((rowDrift.reduce((a, r) => a + r.drift, 0) / rowDrift.length).toFixed(4))
        : 0;

    return {
      matrix,
      cells,
      rowDrift,
      meanDrift,
      maxDrift: rowDrift.length ? Math.max(...rowDrift.map((r) => r.drift)) : 0
    };
  }

  const perception = buildLayer("canonical", "perception");
  const truthSpread = buildLayer("truth", "truth_label");

  return Object.freeze({
    schema: "rhizoh.stress_geometry.heatmap.v0",
    perception: Object.freeze({
      rowKind: "canonical_perception",
      matrix: perception.matrix,
      cells: perception.cells,
      rowDrift: perception.rowDrift,
      meanExecutionDrift: perception.meanDrift,
      maxExecutionDrift: perception.maxDrift
    }),
    truthLabelSpread: Object.freeze({
      rowKind: "truth_class",
      matrix: truthSpread.matrix,
      cells: truthSpread.cells,
      rowDrift: truthSpread.rowDrift,
      meanExecutionSpread: truthSpread.meanDrift,
      maxExecutionSpread: truthSpread.maxDrift
    }),
    meanExecutionDrift: perception.meanDrift,
    maxExecutionDrift: perception.maxDrift,
    executionUnderStablePerception: perception.meanDrift === 0
  });
}

/**
 * Behavioral Consistency Score (BCS) ∈ [0,1].
 * BCS = w_t·T + w_e·E + w_d·(1-D) + w_s·S + w_h·H
 * @param {{
 *   probes: ReturnType<typeof probeStressGeometryPointV0>[],
 *   heatmap: ReturnType<typeof buildExecutionDriftHeatmapV0>,
 *   hysteresisPass: boolean
 * }} input
 */
export function computeBehavioralConsistencyScoreV0(input) {
  const { probes, heatmap, hysteresisPass } = input;
  const n = probes.length || 1;

  /** @type {Map<string, Set<string>>} */
  const canonicalTruth = new Map();
  /** @type {Map<string, Set<string>>} */
  const canonicalExecution = new Map();

  for (const p of probes) {
    if (!canonicalTruth.has(p.canonical)) canonicalTruth.set(p.canonical, new Set());
    canonicalTruth.get(p.canonical).add(p.truthKey);

    if (!canonicalExecution.has(p.canonical)) canonicalExecution.set(p.canonical, new Set());
    canonicalExecution.get(p.canonical).add(p.executionKey);
  }

  let truthCollisions = 0;
  let executionCollisions = 0;
  for (const set of canonicalTruth.values()) {
    if (set.size > 1) truthCollisions += 1;
  }
  for (const set of canonicalExecution.values()) {
    if (set.size > 1) executionCollisions += 1;
  }

  const T = 1 - truthCollisions / n;
  const E = 1 - executionCollisions / n;
  const D = heatmap.meanExecutionDrift;
  const S = probes.filter((p) => p.stable).length / n;
  const H = hysteresisPass ? 1 : 0;

  const w_t = 0.25;
  const w_e = 0.3;
  const w_d = 0.25;
  const w_s = 0.12;
  const w_h = 0.08;

  const bcs = Number(
    (w_t * T + w_e * E + w_d * (1 - D) + w_s * S + w_h * H).toFixed(4)
  );

  return Object.freeze({
    schema: "rhizoh.stress_geometry.bcs.v0",
    bcs,
    components: Object.freeze({
      truthStability: Number(T.toFixed(4)),
      executionConsistency: Number(E.toFixed(4)),
      antiDrift: Number((1 - D).toFixed(4)),
      probeStability: Number(S.toFixed(4)),
      hysteresisOk: H
    }),
    weights: Object.freeze({ w_t, w_e, w_d, w_s, w_h }),
    collisions: Object.freeze({
      truthCanonicalCollisions: truthCollisions,
      executionCanonicalCollisions: executionCollisions
    }),
    pass: bcs >= 0.85 && D === 0 && truthCollisions === 0 && executionCollisions === 0
  });
}

export const REALITY_RESIDUAL_SIGNAL_SCHEMA_V0 = "rhizoh.reality_residual.signal.v0";
export const MODEL_COMPLETENESS_SCHEMA_V0 = "rhizoh.model_completeness.v0";
export const MODEL_REALITY_DIVERGENCE_SCHEMA_V0 = "rhizoh.model_reality_divergence.v0";

/**
 * Reality residual as first-class signal (not error / bug / exception).
 * @param {{
 *   probes: ReturnType<typeof probeStressGeometryPointV0>[],
 *   heatmap: ReturnType<typeof buildExecutionDriftHeatmapV0>
 * }} input
 */
export function buildRealityResidualSignalsV0(input) {
  const { probes, heatmap } = input;
  const n = probes.length || 1;
  const latticeById = Object.fromEntries(
    buildPhase3EntropyLatticeV0().map((pt) => [pt.id, pt.input])
  );
  const interpretableRate = Number(
    (
      probes.filter((p) => classifyStressResponseV0(latticeById[p.id] || {}).interpretable)
        .length / n
    ).toFixed(4)
  );
  const borderlineRate = Number(
    (probes.filter((p) => p.taxonomy.actionBorderline).length / n).toFixed(4)
  );
  const softenedRate = Number(
    (probes.filter((p) => p.taxonomy.actionSoftened).length / n).toFixed(4)
  );

  return Object.freeze({
    schema: REALITY_RESIDUAL_SIGNAL_SCHEMA_V0,
    semantics: "natural_measurable_system_behavior",
    truthLabelSpread: heatmap.truthLabelSpread,
    borderlineRate,
    interpretableRate,
    nonInterpretableRate: Number((1 - interpretableRate).toFixed(4)),
    actionSoftenedRate: softenedRate,
    perceptionExecutionDrift: heatmap.perception.meanExecutionDrift,
    shadowSampling: Object.freeze({
      status: "required_post_phase3",
      purpose: "collect_live_canonical_keys_not_in_lattice"
    }),
    cohorts: Object.freeze({
      borderline: "strain_zone_not_failure",
      softened: "execution_adaptation_not_label_change",
      nonInterpretable: "explicit_limit_of_rule_based_v1"
    })
  });
}

/**
 * Model completeness (not correctness): how much world the instrument documents.
 * @param {{
 *   probes: ReturnType<typeof probeStressGeometryPointV0>[],
 *   heatmap: ReturnType<typeof buildExecutionDriftHeatmapV0>,
 *   bcs: ReturnType<typeof computeBehavioralConsistencyScoreV0>,
 *   residual: ReturnType<typeof buildRealityResidualSignalsV0>
 * }} input
 */
export function computeModelCompletenessScoreV0(input) {
  const { probes, heatmap, bcs, residual } = input;
  const n = probes.length || 1;

  const C_interp = residual.interpretableRate;
  const C_strain = Number((1 - residual.borderlineRate).toFixed(4));
  const C_exec = heatmap.perception.meanExecutionDrift === 0 ? 1 : 0;
  const C_internal = bcs.bcs;
  const C_audit = residual.truthLabelSpread.meanExecutionSpread >= 0 ? 1 : 0;

  const w_i = 0.22;
  const w_s = 0.13;
  const w_e = 0.25;
  const w_b = 0.3;
  const w_a = 0.1;

  const mcs = Number(
    (w_i * C_interp + w_s * C_strain + w_e * C_exec + w_b * C_internal + w_a * C_audit).toFixed(4)
  );

  return Object.freeze({
    schema: MODEL_COMPLETENESS_SCHEMA_V0,
    framing: "instrument_coverage_not_model_correctness",
    mcs,
    components: Object.freeze({
      interpretableCoverage: C_interp,
      strainHeadroom: C_strain,
      perceptionExecutionMap: C_exec,
      internalConsistency: C_internal,
      divergenceAudited: C_audit
    }),
    weights: Object.freeze({ w_i, w_s, w_e, w_b, w_a }),
    pass: mcs >= 0.75,
    note: "High MCS on lattice = instrument self-consistent; live shadow required for world completeness"
  });
}

/**
 * Model–reality divergence mapping (Phase 3 primary artifact).
 */
export function buildModelRealityDivergenceMapV0(input) {
  const { latticeSize, entropyExpansion, bcs, residual, mcs, heatmap } = input;

  return Object.freeze({
    schema: MODEL_REALITY_DIVERGENCE_SCHEMA_V0,
    principle: "modeled_observed_divergence_measurable_under_constraints",
    lattice: Object.freeze({
      role: "controlled_entropy_space",
      projection: "deterministic",
      size: latticeSize,
      entropySpan: entropyExpansion.span,
      behavioralConsistency: bcs.bcs
    }),
    reality: Object.freeze({
      role: "residual_space",
      field: "stochastic_deviation",
      truthLabelSpreadMean: residual.truthLabelSpread.meanExecutionSpread,
      shadowSampling: residual.shadowSampling
    }),
    divergence: Object.freeze({
      measurable: true,
      requiresLatticeCollision: false,
      residualFirstClass: true,
      perceptionGateDrift: heatmap.perception.meanExecutionDrift
    }),
    overInterpretationRisk: Object.freeze({
      risk: "over_interpretation_of_residual_as_structured_pattern",
      guardrails: Object.freeze([
        "dual_layer_execution",
        "hysteresis_band",
        "fingerprint_replay",
        "borderline_cohort_separation",
        "shadow_sampling_before_lattice_expansion"
      ])
    }),
    residualOverfittingRisk: Object.freeze({
      risk: "residual_overfitting",
      definition: "treating_residual_noise_as_structure",
      controlledBy: Object.freeze([
        "dual_layer_execution",
        "hysteresis_band",
        "replay_determinism",
        "divergence_audit",
        "shadow_sampling_not_lattice_expansion_without_evidence"
      ]),
      note: "instrument_coverage_not_ontological_completeness"
    }),
    modelCompleteness: mcs
  });
}

/**
 * Full Phase 3 stress geometry run.
 * @param {{ baseline?: object | null }} [opts]
 */
export function runStressGeometryPhase3V0(opts = {}) {
  const lattice = buildPhase3EntropyLatticeV0();
  const probes = lattice.map((pt) => probeStressGeometryPointV0(pt, { baseline: opts.baseline }));
  const heatmap = buildExecutionDriftHeatmapV0(probes);
  const hysteresis = verifyConfidenceBoundaryHysteresisV0();
  const bcs = computeBehavioralConsistencyScoreV0({
    probes,
    heatmap,
    hysteresisPass: hysteresis.pass
  });

  const entropyVectors = probes.map((p) => ({
    id: p.id,
    magnitude: p.entropy.magnitude,
    vector: p.entropy.vector,
    components: p.entropy.components
  }));

  const magnitudes = entropyVectors.map((e) => e.magnitude);
  const entropyExpansion = {
    min: Math.min(...magnitudes),
    max: Math.max(...magnitudes),
    mean: Number((magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length).toFixed(4)),
    span: Number((Math.max(...magnitudes) - Math.min(...magnitudes)).toFixed(4))
  };

  const residualSignals = buildRealityResidualSignalsV0({ probes, heatmap });
  const modelCompleteness = computeModelCompletenessScoreV0({
    probes,
    heatmap,
    bcs,
    residual: residualSignals
  });

  const executionPass = bcs.pass && probes.every((p) => p.stable);
  const phase3Gate = executionPass
    ? "execution_consistent_under_entropy"
    : "hold_stress_geometry_gaps";

  const phase3Outcome = executionPass
    ? PHASE3_ENGINEERING_OUTCOME_V0
    : "hold_phase3_geometry";

  const modelRealityDivergence = buildModelRealityDivergenceMapV0({
    latticeSize: lattice.length,
    entropyExpansion,
    bcs,
    residual: residualSignals,
    mcs: modelCompleteness,
    heatmap
  });

  return Object.freeze({
    schema: STRESS_GEOMETRY_SCHEMA_V0,
    atMs: new Date().toISOString(),
    latticeSize: lattice.length,
    entropyVectorSpace: Object.freeze({
      model: "R^5 weighted L2",
      axes: ENTROPY_AXIS_ORDER_V0,
      weights: ENTROPY_AXIS_WEIGHTS_V0,
      deadBand: ACTION_CONFIDENCE_DEAD_BAND_V0,
      expansion: entropyExpansion,
      probes: entropyVectors
    }),
    executionDriftHeatmap: heatmap,
    behavioralConsistencyScore: bcs,
    confidenceBoundaryHysteresis: hysteresis,
    probes: probes.map((p) => ({
      id: p.id,
      stable: p.stable,
      truthKey: p.truthKey,
      executionKey: p.executionKey,
      entropyMagnitude: p.entropy.magnitude,
      stressClass: p.taxonomy.stressClass,
      userFacingAction: p.taxonomy.userFacingAction
    })),
    phase3Gate,
    phase3Kind: PHASE3_ENGINEERING_KIND_V0,
    phase3Outcome,
    phase3Artifact: "modeled_observed_divergence_mapped",
    engineeringSsot: Object.freeze({
      identity: RHIZOH_ENGINEERING_IDENTITY_V0,
      definition: RHIZOH_ENGINEERING_DEFINITION_V0,
      layers: Object.freeze(["model", "observation", "execution"])
    }),
    interpretationLayer: Object.freeze({
      notEngineeringSsot: true,
      doNotUseInLegalOrProductionContracts: true,
      seeDoc: "docs/ops/RHIZOH_INTERPRETATION_LAYER_V1.0.md"
    }),
    distinction: "stress_geometry ≠ global_readiness",
    coordinateSystem: "entropy_axes_for_stress_probe_coordinates",
    systemIdentity: RHIZOH_ENGINEERING_IDENTITY_V0,
    realityResidualSignals: residualSignals,
    modelCompletenessScore: modelCompleteness,
    modelRealityDivergence,
    modeledObservedDivergence: modelRealityDivergence
  });
}
