/**
 * Phase 3D extension — Attractor perturbation sensitivity map
 * Input→attractor influence, basin boundary fragility, transition probability field.
 * No new measurement primitives — derived from trajectory + stressor exits.
 * @see docs/ops/PHASE3D_PERTURBATION_SENSITIVITY_V1.0.md
 */
export const PERTURBATION_SENSITIVITY_SCHEMA_V0 = "rhizoh.phase3d.perturbation_sensitivity_map.v0";

/** Design basin radii (inlined — avoid ESM cycle with attractor intelligence). */
const BASIN_RADIUS_V0 = Object.freeze({
  optimal: 0.35,
  canli: 0.4,
  kilitli: 0.45,
  kor: 0.4,
  kararsiz: 0.5,
  gecis: 0.5
});

const ALL_REGIONS_V0 = Object.freeze(["optimal", "canli", "kilitli", "kor", "kararsiz", "gecis"]);

/**
 * @param {{
 *   trajectory: { samples: { t: number, scenarioId?: string, coords: number[], region: string, displacement: number }[] },
 *   attractors: { region: string, attractorId: string, empiricalCentroid?: number[], catalogCentroid?: number[], basinSpread?: number, dwellFraction?: number, inDesignBasin?: boolean }[],
 *   stressorExitAnalysis: { exits: { stressorId: string, ejectedFrom: string, deflectedTo: string, exitVector: number[], exitMagnitude: number, stressorClass?: string, divergence?: number }[] },
 *   scenarioContext?: { id: string, divergence?: number, mode?: string }[]
 * }} input
 */
export function buildAttractorPerturbationSensitivityMapV0(input) {
  const { trajectory, attractors, stressorExitAnalysis, scenarioContext = [] } = input;
  const samples = trajectory?.samples ?? [];
  const exits = stressorExitAnalysis?.exits ?? [];

  const inputAttractorInfluence = buildInputAttractorInfluenceV0(exits, attractors, scenarioContext);
  const basinBoundaryFragility = buildBasinBoundaryFragilityV0(samples, attractors, exits);
  const transitionProbabilityField = buildTransitionProbabilityFieldV0(samples, exits);

  const mostFragileBasin = basinBoundaryFragility
    .slice()
    .sort((a, b) => b.fragilityScore - a.fragilityScore)[0];

  return Object.freeze({
    schema: PERTURBATION_SENSITIVITY_SCHEMA_V0,
    analysisKind: "attractor_perturbation_sensitivity",
    noNewPrimitives: true,
    inputAttractorInfluence,
    basinBoundaryFragility,
    transitionProbabilityField,
    summary: Object.freeze({
      dominantPerturbation: inputAttractorInfluence.rankings[0]?.inputId ?? null,
      mostFragileBasin: mostFragileBasin?.attractorId ?? null,
      highestTransitionProbability:
        transitionProbabilityField.rankings[0]?.label ?? null
    })
  });
}

function buildInputAttractorInfluenceV0(exits, attractors, scenarioContext) {
  const ctxById = new Map(scenarioContext.map((c) => [c.id, c]));
  const attractorRegions = new Set(attractors.map((a) => a.region));
  const targetRegions = new Set([
    ...attractorRegions,
    ...exits.map((e) => e.deflectedTo),
    ...exits.map((e) => e.ejectedFrom)
  ]);

  const matrix = new Map();
  const rows = [];

  for (const exit of exits) {
    const inputId = exit.stressorId;
    const ctx = ctxById.get(inputId) ?? {};
    const basinR = BASIN_RADIUS_V0[exit.deflectedTo] ?? 0.4;
    const divergence = Number(ctx.divergence ?? exit.divergence ?? 0);
    const influenceScore = Number(
      ((exit.exitMagnitude / basinR) * (1 + Math.min(1, divergence * 5))).toFixed(4)
    );

    const key = `${inputId}→${exit.deflectedTo}`;
    const existing = matrix.get(key);
    if (!existing || influenceScore > existing.influenceScore) {
      matrix.set(
        key,
        Object.freeze({
          inputId,
          sourceAttractor: exit.ejectedFrom,
          targetAttractor: exit.deflectedTo,
          targetAttractorId: `attractor_${exit.deflectedTo}`,
          influenceScore,
          exitMagnitude: exit.exitMagnitude,
          axisDelta: Object.freeze({
            u: exit.exitVector[0],
            s: exit.exitVector[1],
            g: exit.exitVector[2]
          }),
          stressorClass: exit.stressorClass,
          divergence
        })
      );
    }

    rows.push(matrix.get(key));
  }

  const rankings = [...rows]
    .filter(Boolean)
    .sort((a, b) => b.influenceScore - a.influenceScore);

  const byInput = aggregateInfluenceByInputV0(rankings, [...targetRegions]);

  return Object.freeze({
    schema: "rhizoh.phase3d.input_attractor_influence.v0",
    description: "which_input_pushes_which_attractor_how_much",
    matrix: Object.freeze(rankings),
    byInput: Object.freeze(byInput),
    rankings: Object.freeze(rankings),
    targetRegions: Object.freeze([...targetRegions])
  });
}

function aggregateInfluenceByInputV0(rankings, targetRegions) {
  const byInput = new Map();
  for (const r of rankings) {
    const cur = byInput.get(r.inputId) || {
      inputId: r.inputId,
      totalInfluence: 0,
      targets: {}
    };
    cur.totalInfluence += r.influenceScore;
    cur.targets[r.targetAttractor] = Math.max(cur.targets[r.targetAttractor] ?? 0, r.influenceScore);
    byInput.set(r.inputId, cur);
  }

  return [...byInput.values()].map((x) => {
    const normalized = {};
    const sum = x.totalInfluence || 1;
    for (const region of targetRegions) {
      if (x.targets[region] != null) {
        normalized[region] = Number((x.targets[region] / sum).toFixed(4));
      }
    }
    return Object.freeze({
      inputId: x.inputId,
      totalInfluence: Number(x.totalInfluence.toFixed(4)),
      targetDistribution: Object.freeze(normalized),
      primaryTarget: Object.entries(normalized).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    });
  });
}

function buildBasinBoundaryFragilityV0(samples, attractors, exits) {
  return Object.freeze(
    attractors.map((a) => {
      const R = BASIN_RADIUS_V0[a.region] ?? 0.4;
      const centroid = a.empiricalCentroid ?? a.catalogCentroid ?? [0.5, 0.5, 0.5];
      const distToCatalog = a.distanceToCatalog ?? 0;
      const distToCatalogEdge = Math.max(0, R - distToCatalog);
      const margin = Math.max(0.02, distToCatalogEdge);

      const leaving = exits.filter((e) => e.ejectedFrom === a.region);
      const boundaryPressure = leaving.length
        ? Number(
            (leaving.reduce((s, e) => s + e.exitMagnitude, 0) / leaving.length).toFixed(4)
          )
        : 0;

      const crossBasinProximity = computeCrossBasinProximityV0(samples, a.region);
      const spreadRatio = Number(((a.basinSpread ?? 0) / R).toFixed(4));

      const fragilityScore = Number(
        clamp01(0.35 * spreadRatio + 0.35 * (boundaryPressure / 0.9) + 0.3 * (1 - margin / R)).toFixed(4)
      );

      let fragilityClass = "robust";
      if (fragilityScore >= 0.65) fragilityClass = "fragile";
      else if (fragilityScore >= 0.4) fragilityClass = "moderate";

      return Object.freeze({
        attractorId: a.attractorId,
        region: a.region,
        labelTr: a.labelTr ?? a.region,
        basinRadius: R,
        boundaryMargin: Number(margin.toFixed(4)),
        boundaryPressure,
        crossBasinProximity: Number(crossBasinProximity.toFixed(4)),
        spreadRatio,
        fragilityScore,
        fragilityClass,
        interpretation:
          fragilityClass === "fragile"
            ? "small_perturbation_likely_ejects_from_basin"
            : fragilityClass === "moderate"
              ? "monitor_stressor_rank_at_boundary"
              : "basin_boundary_robust_in_observed_window"
      });
    })
  );
}

function computeCrossBasinProximityV0(samples, region) {
  let minDist = 1;
  const inBasin = samples.filter((s) => s.region === region);
  const outBasin = samples.filter((s) => s.region !== region);
  if (!inBasin.length || !outBasin.length) return 0.5;

  for (const inner of inBasin) {
    for (const outer of outBasin) {
      const d = euclidean3(inner.coords, outer.coords);
      if (d < minDist) minDist = d;
    }
  }
  return Number((1 - Math.min(1, minDist)).toFixed(4));
}

function buildTransitionProbabilityFieldV0(samples, exits) {
  const regions = [...new Set(samples.map((s) => s.region))];
  const count = {};
  const conditional = {};

  for (let i = 1; i < samples.length; i++) {
    if (!samples[i].regionChanged) continue;
    const from = samples[i - 1].region;
    const to = samples[i].region;
    count[from] = count[from] || {};
    count[from][to] = (count[from][to] || 0) + 1;

    const stressorId = samples[i].scenarioId ?? "unknown";
    const ckey = `${from}|${to}|${stressorId}`;
    conditional[ckey] = (conditional[ckey] || 0) + 1;
  }

  const field = [];
  const marginal = [];

  for (const from of regions) {
    const outs = count[from] || {};
    const total = Object.values(outs).reduce((a, b) => a + b, 0);
    for (const to of ALL_REGIONS_V0) {
      const n = outs[to] || 0;
      const p = total ? Number((n / total).toFixed(4)) : 0;
      if (total > 0 || n > 0) {
        marginal.push(
          Object.freeze({
            from,
            to,
            count: n,
            probability: p,
            conditionalOn: "from_region_only"
          })
        );
      }
    }
  }

  for (const [key, n] of Object.entries(conditional)) {
    const [from, to, stressorId] = key.split("|");
    const fromTotal = Object.values(count[from] || {}).reduce((a, b) => a + b, 0) || 1;
    field.push(
      Object.freeze({
        from,
        to,
        stressorId,
        count: n,
        probability: Number((n / fromTotal).toFixed(4)),
        conditionalOn: "from_region_and_stressor"
      })
    );
  }

  const rankings = marginal
    .filter((e) => e.probability > 0)
    .sort((a, b) => b.probability - a.probability)
    .map((e) =>
      Object.freeze({
        label: `${e.from}→${e.to}`,
        probability: e.probability
      })
    );

  return Object.freeze({
    schema: "rhizoh.phase3d.transition_probability_field.v0",
    description: "P(to|from) and P(to|from,input) from observed trajectory",
    regions: Object.freeze(regions),
    marginalTransitions: Object.freeze(marginal),
    stressorConditioned: Object.freeze(field),
    transitionMatrix: Object.freeze(buildTransitionMatrixV0(regions, count)),
    rankings: Object.freeze(rankings)
  });
}

function buildTransitionMatrixV0(regions, count) {
  const matrix = {};
  for (const from of regions) {
    matrix[from] = {};
    const total = Object.values(count[from] || {}).reduce((a, b) => a + b, 0);
    for (const to of regions) {
      const n = count[from]?.[to] || 0;
      matrix[from][to] = total ? Number((n / total).toFixed(4)) : 0;
    }
  }
  return matrix;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function euclidean3(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - (b[i] ?? 0)) ** 2, 0));
}
