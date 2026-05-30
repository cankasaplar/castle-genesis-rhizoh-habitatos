/**
 * Phase 3D — Dynamical Attractor Intelligence Layer (OBSERVATION ONLY).
 * Must not be imported by phase3ControlledDivergenceRuntimeV0 or live execution paths.
 * @see docs/ops/PHASE3D_ATTRACTOR_INTELLIGENCE_V1.0.md
 * @see docs/ops/PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md
 */
import { buildAttractorPerturbationSensitivityMapV0 } from "./phase3DPerturbationSensitivityV0.js";

/** Region ids + optimal centroid (inlined — avoid ESM circular init with operability/runtime). */
const OPTIMAL_CENTROID_V0 = Object.freeze({ u: 0.75, s: 0.75, g: 0.9 });

const TRAJECTORY_CLASS_V0 = Object.freeze({
  STABLE_ATTRACTOR: "stable_attractor",
  LOCK_RECOVERY: "lock_recovery",
  STRESS_DEFLECTION: "stress_induced_deflection",
  BLIND_EXPOSURE: "blind_exposure",
  OSCILLATORY: "oscillatory",
  DRIFT_FROM_OPTIMAL: "drift_away_from_optimal",
  MIXED: "mixed_dynamics"
});

/** Region ids (string literals — avoid circular init with operability balance). */
const REGION_V0 = Object.freeze({
  OPTIMAL: "optimal",
  ALIVE: "canli",
  LOCKED: "kilitli",
  BLIND: "kor",
  UNSTABLE: "kararsiz",
  TRANSITION: "gecis"
});

export const PHASE3D_SCHEMA_V0 = "rhizoh.phase3d.attractor_intelligence.v0";
export const PHASE3D_KIND_V0 = "dynamical_attractor_intelligence";

/** Design-time attractor centroids in (u,s,g) — derived from region geometry. */
export const ATTRACTOR_CATALOG_V0 = Object.freeze({
  [REGION_V0.OPTIMAL]: Object.freeze({
    id: "attractor_optimal",
    region: REGION_V0.OPTIMAL,
    labelTr: "optimal",
    centroid: Object.freeze([OPTIMAL_CENTROID_V0.u, OPTIMAL_CENTROID_V0.s, OPTIMAL_CENTROID_V0.g]),
    basinRadius: 0.35,
    stabilityMechanism: "high_usefulness_stability_guard_balance"
  }),
  [REGION_V0.ALIVE]: Object.freeze({
    id: "attractor_alive",
    region: REGION_V0.ALIVE,
    labelTr: "canlı",
    centroid: Object.freeze([0.6, 0.6, 0.65]),
    basinRadius: 0.4,
    stabilityMechanism: "execution_allowed_moderate_lock"
  }),
  [REGION_V0.LOCKED]: Object.freeze({
    id: "attractor_locked",
    region: REGION_V0.LOCKED,
    labelTr: "kilitli",
    centroid: Object.freeze([0.55, 0.32, 0.82]),
    basinRadius: 0.45,
    stabilityMechanism: "containment_dominant_low_stability_axis"
  }),
  [REGION_V0.BLIND]: Object.freeze({
    id: "attractor_blind",
    region: REGION_V0.BLIND,
    labelTr: "kör",
    centroid: Object.freeze([0.72, 0.52, 0.22]),
    basinRadius: 0.4,
    stabilityMechanism: "under_sensitive_guard_failure"
  })
});

const STRESSOR_SCENARIO_PREFIX_V0 = /^F\d/;

/**
 * @param {ReturnType<import("./phase3OperabilityBalanceV0.js").buildOperabilityPhaseTrajectoryV0>} trajectory
 * @param {ReturnType<import("./phase3OperabilityBalanceV0.js").buildOperabilityPhaseSpaceMapV0>} [phaseSpaceMap]
 * @param {{ id: string, mode?: string, divergence?: number, expectedToGate?: boolean }[]} [scenarioContext]
 */
export function buildPhase3DAttractorIntelligenceV0(input) {
  const { trajectory, rollingTrajectory, phaseSpaceMap, scenarioContext = [] } = input;
  const samples = trajectory?.samples ?? [];

  const empirical = detectEmpiricalAttractorsV0(samples);
  const catalog = mapEmpiricalToCatalogV0(empirical);
  const primary = selectPrimaryAttractorV0(catalog, trajectory?.dynamics, phaseSpaceMap);
  const stability = analyzeAttractorStabilityV0(samples, catalog, trajectory?.dynamics);
  const stressorExits = analyzeStressorExitsV0(samples, scenarioContext);
  const frontier = Object.freeze({
    layer: PHASE3D_KIND_V0,
    question: "which_attractors_why_stable_which_stressor_ejects",
    extension: "perturbation_sensitivity_map",
    supersedes: "phase3_static_phase_map_only",
    retains: "phase3_execution_runtime_gates"
  });

  const perturbationSensitivityMap = buildAttractorPerturbationSensitivityMapV0({
    trajectory,
    attractors: catalog,
    stressorExitAnalysis: stressorExits,
    scenarioContext
  });

  const phase3dGate = derivePhase3DGateV0({
    catalog,
    primary,
    stability,
    stressorExits,
    trajectoryDynamics: trajectory?.dynamics,
    perturbationSensitivityMap
  });

  return Object.freeze({
    schema: PHASE3D_SCHEMA_V0,
    kind: PHASE3D_KIND_V0,
    atMs: new Date().toISOString(),
    frontier,
    primaryAttractor: primary,
    attractors: catalog,
    empiricalBasins: empirical,
    stabilityAnalysis: stability,
    stressorExitAnalysis: stressorExits,
    perturbationSensitivityMap,
    rollingAttractor: rollingTrajectory
      ? summarizeRollingAttractorV0(rollingTrajectory)
      : null,
    phase3dGate,
    /** @deprecated use phase3dObservationGate — never feeds execution */
    phase3dObservationGate: phase3dGate,
    distinction: "attractor_intelligence_not_epistemic_truth"
  });
}

/**
 * @param {ReturnType<typeof buildOperabilityPhaseTrajectoryV0>["samples"]} samples
 */
function detectEmpiricalAttractorsV0(samples) {
  const byRegion = new Map();
  for (const s of samples) {
    const bucket = byRegion.get(s.region) || { region: s.region, points: [], indices: [] };
    bucket.points.push(s.coords);
    bucket.indices.push(s.t);
    byRegion.set(s.region, bucket);
  }

  const basins = [];
  for (const [, bucket] of byRegion) {
    const n = bucket.points.length;
    if (n < 1) continue;
    const centroid = mean3(bucket.points);
    const spread = meanDistance3(bucket.points, centroid);
    const dwellFraction = Number((n / Math.max(1, samples.length)).toFixed(4));
    const meanVelocity = meanVelocityInBasinV0(samples, bucket.indices);

    basins.push(
      Object.freeze({
        region: bucket.region,
        sampleCount: n,
        dwellFraction,
        empiricalCentroid: centroid,
        basinSpread: Number(spread.toFixed(4)),
        meanIntraBasinVelocity: Number(meanVelocity.toFixed(4)),
        isStableBasin: spread < 0.25 && meanVelocity < 0.5
      })
    );
  }

  return Object.freeze(basins.sort((a, b) => b.dwellFraction - a.dwellFraction));
}

function mapEmpiricalToCatalogV0(empirical) {
  return Object.freeze(
    empirical.map((basin) => {
      const catalogEntry = ATTRACTOR_CATALOG_V0[basin.region];
      const catalogCentroid = catalogEntry?.centroid ?? basin.empiricalCentroid;
      const distToCatalog = euclidean3(basin.empiricalCentroid, catalogCentroid);
      return Object.freeze({
        ...basin,
        attractorId: catalogEntry?.id ?? `attractor_${basin.region}`,
        labelTr: catalogEntry?.labelTr ?? basin.region,
        catalogCentroid,
        distanceToCatalog: Number(distToCatalog.toFixed(4)),
        stabilityMechanism: catalogEntry?.stabilityMechanism ?? "unknown_region",
        inDesignBasin: distToCatalog <= (catalogEntry?.basinRadius ?? 0.5)
      });
    })
  );
}

function selectPrimaryAttractorV0(catalog, dynamics, phaseSpaceMap) {
  const top = catalog[0];
  const aggregateRegion = phaseSpaceMap?.aggregate?.region?.region;
  const endRegion = dynamics?.classification === TRAJECTORY_CLASS_V0.STABLE_ATTRACTOR
    ? REGION_V0.OPTIMAL
    : null;

  const region = endRegion ?? aggregateRegion ?? top?.region ?? REGION_V0.TRANSITION;
  const match = catalog.find((a) => a.region === region) ?? top;

  return Object.freeze({
    attractorId: match?.attractorId ?? "none",
    region,
    labelTr: match?.labelTr ?? region,
    selectionBasis: endRegion
      ? "trajectory_converged_optimal"
      : aggregateRegion
        ? "aggregate_phase_map"
        : "max_dwell_empirical",
    dwellFraction: match?.dwellFraction ?? 0,
    whyDominant: explainDominanceV0(match, dynamics)
  });
}

function explainDominanceV0(attractor, dynamics) {
  if (!attractor) return "insufficient_samples";
  if (attractor.region === REGION_V0.OPTIMAL) {
    return "operational_window_balanced_high_u_s_g";
  }
  if (attractor.region === REGION_V0.LOCKED) {
    return "drill_containment_elevates_lock_dwell_not_operational_inertness";
  }
  if (dynamics?.classification === TRAJECTORY_CLASS_V0.OSCILLATORY) {
    return "multi_attractor_cycle_optimal_and_locked_basin_alternation";
  }
  return `dominant_dwell_${attractor.dwellFraction}`;
}

function analyzeAttractorStabilityV0(samples, catalog, dynamics) {
  const reports = catalog.map((a) => {
    const reasons = [];
    if (a.isStableBasin) reasons.push("low_intra_basin_spread_and_velocity");
    if (a.dwellFraction >= 0.25) reasons.push("sufficient_dwell_mass");
    if (a.region === REGION_V0.OPTIMAL && a.inDesignBasin)
      reasons.push("proximate_to_design_centroid_p_star");
    if (a.region === REGION_V0.LOCKED)
      reasons.push("containment_mode_stability_envelope");

    const holdsBecause = reasons.length
      ? reasons.join("; ")
      : "transient_visit_not_stable_attractor";

    const isStable =
      (a.isStableBasin && a.dwellFraction >= 0.15) ||
      (a.dwellFraction >= 0.25 && a.inDesignBasin) ||
      (a.region === REGION_V0.OPTIMAL && a.dwellFraction >= 0.15);

    return Object.freeze({
      attractorId: a.attractorId,
      region: a.region,
      labelTr: a.labelTr,
      holdsBecause,
      isStable,
      dwellFraction: a.dwellFraction,
      meanIntraBasinVelocity: a.meanIntraBasinVelocity
    });
  });

  return Object.freeze({
    schema: "rhizoh.phase3d.stability_analysis.v0",
    globalClassification: dynamics?.classification ?? "unknown",
    whySystemStays: Object.freeze(
      reports
        .filter((r) => r.dwellFraction >= 0.15)
        .map((r) => `${r.attractorId}:${r.holdsBecause}`)
    ),
    transientBasins: Object.freeze(
      reports.filter((r) => r.dwellFraction < 0.15).map((r) => r.attractorId)
    ),
    reports: Object.freeze(reports)
  });
}

/**
 * @param {ReturnType<typeof buildOperabilityPhaseTrajectoryV0>["samples"]} samples
 * @param {{ id: string, mode?: string, divergence?: number, expectedToGate?: boolean }[]} scenarioContext
 */
function analyzeStressorExitsV0(samples, scenarioContext) {
  const exits = [];
  const ctxById = new Map(scenarioContext.map((c) => [c.id, c]));

  for (let i = 1; i < samples.length; i++) {
    if (!samples[i].regionChanged) continue;
    const from = samples[i - 1].region;
    const to = samples[i].region;
    const stressorId = samples[i].scenarioId ?? `step_${i}`;
    const ctx = ctxById.get(stressorId) ?? {};
    const exitVector = samples[i].coords.map((v, j) =>
      Number((v - samples[i - 1].coords[j]).toFixed(4))
    );
    const magnitude = Number(euclidean3(samples[i - 1].coords, samples[i].coords).toFixed(4));

    exits.push(
      Object.freeze({
        at: i,
        stressorId,
        stressorClass: classifyStressorV0(stressorId, ctx),
        ejectedFrom: from,
        deflectedTo: to,
        exitVector,
        exitMagnitude: magnitude,
        mode: ctx.mode,
        divergence: ctx.divergence,
        narrative: `stressor_${stressorId}_ejected_${from}_to_${to}`
      })
    );
  }

  const byStressor = aggregateStressorImpactV0(exits);

  return Object.freeze({
    schema: "rhizoh.phase3d.stressor_exit_analysis.v0",
    exitCount: exits.length,
    exits: Object.freeze(exits),
    stressorImpactRank: Object.freeze(byStressor),
    primaryEjector: byStressor[0]?.stressorId ?? null
  });
}

function classifyStressorV0(stressorId, ctx) {
  if (STRESSOR_SCENARIO_PREFIX_V0.test(stressorId)) return "synthetic_failure_drill";
  if (ctx.expectedToGate) return "expected_gate_stressor";
  if (stressorId.includes("NORMAL")) return "baseline_reset";
  return "operational_cycle";
}

function aggregateStressorImpactV0(exits) {
  const m = new Map();
  for (const e of exits) {
    const cur = m.get(e.stressorId) || { stressorId: e.stressorId, ejections: 0, totalMagnitude: 0 };
    cur.ejections += 1;
    cur.totalMagnitude += e.exitMagnitude;
    m.set(e.stressorId, cur);
  }
  return [...m.values()]
    .map((x) =>
      Object.freeze({
        ...x,
        totalMagnitude: Number(x.totalMagnitude.toFixed(4)),
        meanMagnitude: Number((x.totalMagnitude / x.ejections).toFixed(4))
      })
    )
    .sort((a, b) => b.totalMagnitude - a.totalMagnitude);
}

function summarizeRollingAttractorV0(rollingTrajectory) {
  const last = rollingTrajectory.samples?.at(-1);
  return Object.freeze({
    seriesId: rollingTrajectory.seriesId,
    terminalRegion: last?.region ?? null,
    terminalCoords: last?.coords ?? null,
    classification: rollingTrajectory.dynamics?.classification,
    note: "operational_prefix_attractor_not_instant_cycle"
  });
}

function derivePhase3DGateV0({
  catalog,
  primary,
  stability,
  stressorExits,
  trajectoryDynamics,
  perturbationSensitivityMap
}) {
  const hasOptimal = catalog.some((a) => a.region === REGION_V0.OPTIMAL);
  const noBlindStable = !stability.reports.some(
    (r) => r.region === REGION_V0.BLIND && r.isStable
  );
  const stressorsDocumented = stressorExits.exitCount >= 0;
  const sensitivityMapped =
    (perturbationSensitivityMap?.inputAttractorInfluence?.matrix?.length ?? 0) > 0 &&
    (perturbationSensitivityMap?.transitionProbabilityField?.marginalTransitions?.length ?? 0) > 0;

  const pass =
    hasOptimal &&
    noBlindStable &&
    stressorsDocumented &&
    sensitivityMapped &&
    primary?.attractorId !== "none" &&
    trajectoryDynamics?.classification !== TRAJECTORY_CLASS_V0.BLIND_EXPOSURE;

  return pass ? "phase3d_attractor_layer_ready" : "hold_phase3d_attractor_calibration";
}

function mean3(points) {
  const n = points.length || 1;
  return [
    Number((points.reduce((s, p) => s + p[0], 0) / n).toFixed(4)),
    Number((points.reduce((s, p) => s + p[1], 0) / n).toFixed(4)),
    Number((points.reduce((s, p) => s + p[2], 0) / n).toFixed(4))
  ];
}

function meanDistance3(points, centroid) {
  const n = points.length || 1;
  return points.reduce((s, p) => s + euclidean3(p, centroid), 0) / n;
}

function meanVelocityInBasinV0(samples, indices) {
  const idxSet = new Set(indices);
  let sum = 0;
  let count = 0;
  for (let i = 1; i < samples.length; i++) {
    if (idxSet.has(samples[i].t) || idxSet.has(samples[i - 1].t)) {
      sum += samples[i].displacement;
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

function euclidean3(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}
