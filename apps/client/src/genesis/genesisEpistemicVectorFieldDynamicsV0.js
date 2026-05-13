/**
 * Epistemic Vector Field Dynamics v0.1 — discrete, read-only observables over driftSamples.
 * Field continuity as integral + total variation; sequential samples as alignment operator; phase on 2-simplex.
 * Stability functional S ≈ Σ (||ΔT||_01 + TV_ch + (1−cos)) Δt — single scalar stress aggregate (not “truth stable”).
 * Regime = discretization of anomaly field over session (tertiles + EMA deviation), not raw S_norm gates.
 * Legacy absolute-threshold regime helper removed — use epistemicAnomalyField bundle instead.
 * No execution authority; partial observation reconstruction only.
 */

/** SSOT for export / observability surface lock; bump lock manifest when this identity changes. */
export const EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022 = /** @type {const} */ ("EpistemicVectorFieldDynamics_v0.2.2");

/**
 * @param {[number, number, number]} barycentricRL01 — R,L,O barycentric weights (sum ≈ 1)
 * @returns {number} phase in [0, 1) from equilateral 2-simplex embedding
 */
export function epistemicPhase01FromBarycentricV0(barycentricRL01) {
  const [br, bl, bo] = barycentricRL01;
  const s3 = Math.sqrt(3);
  const xr = 1;
  const yr = 0;
  const xl = -0.5;
  const yl = s3 / 2;
  const xo = -0.5;
  const yo = -s3 / 2;
  const x = br * xr + bl * xl + bo * xo;
  const y = br * yr + bl * yl + bo * yo;
  const theta = Math.atan2(y, x);
  return (theta + Math.PI) / (2 * Math.PI);
}

/**
 * Backward-Euler style cumulative ∫||ΔT||_01 dt (seconds) along drift index order.
 * @param {{ ts: number; tensorDifferenceNorm01?: number | null }[]} samples
 */
export function driftCumulativeIntegralTensorNorm01V0(samples) {
  let acc = 0;
  for (let i = 1; i < samples.length; i++) {
    const v = samples[i].tensorDifferenceNorm01;
    if (typeof v !== "number") continue;
    const dtMs = samples[i].ts - samples[i - 1].ts;
    if (dtMs <= 0) continue;
    acc += v * (dtMs / 1000);
  }
  return acc;
}

/**
 * Total variation of channel divergence vector along the drift chain (L1 on ℝ³).
 * @param {{ channelDivergenceVector01?: [number, number, number] | null }[]} samples
 */
export function driftChannelTotalVariationL1V0(samples) {
  let tv = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1].channelDivergenceVector01;
    const b = samples[i].channelDivergenceVector01;
    if (!a || !b || a.length !== 3 || b.length !== 3) continue;
    tv += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }
  return tv;
}

/**
 * Stability functional (discrete): S ≈ Σ_i (||ΔT||_01,i + TV_ch,i + A_i) Δt_i
 * — TV_ch,i = ||v_i − v_{i−1}||_1, A_i = (1 − cos) clamped to [0,2] when cosine exists, else 0.
 * S_norm = S / (1 + ∫dt) with ∫dt = sum of positive step durations (seconds) — intensity, not raw runtime penalty.
 * Larger S ⇒ heavier epistemic drift / channel jump / alignment loss over real time between samples.
 *
 * @param {{
 *   ts: number;
 *   tensorDifferenceNorm01?: number | null;
 *   channelDivergenceVector01?: [number, number, number] | null;
 * }[]} samples
 */
export function stabilityFunctional01V0(samples) {
  let integralTensorNorm01 = 0;
  let integralChannelTVL1 = 0;
  let integralAlignmentDrift01 = 0;
  let totalElapsedSeconds = 0;
  for (let i = 1; i < samples.length; i++) {
    const dtMs = samples[i].ts - samples[i - 1].ts;
    if (dtMs <= 0) continue;
    const dt = dtMs / 1000;
    totalElapsedSeconds += dt;
    const Ti = typeof samples[i].tensorDifferenceNorm01 === "number" ? samples[i].tensorDifferenceNorm01 : 0;
    const a = samples[i - 1].channelDivergenceVector01;
    const b = samples[i].channelDivergenceVector01;
    let tvInc = 0;
    let Ai = 0;
    if (a && b && a.length === 3 && b.length === 3) {
      tvInc = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
      const op = crossOriginChannelAlignmentOperatorV0(a, b);
      if (op && typeof op.cosine01 === "number") {
        const c = Math.max(-1, Math.min(1, op.cosine01));
        Ai = 1 - c;
      }
    }
    integralTensorNorm01 += Ti * dt;
    integralChannelTVL1 += tvInc * dt;
    integralAlignmentDrift01 += Ai * dt;
  }
  const S = integralTensorNorm01 + integralChannelTVL1 + integralAlignmentDrift01;
  const S_norm = S / (1 + totalElapsedSeconds);
  return {
    v: 0,
    S,
    S_norm,
    totalElapsedSeconds,
    breakdown: {
      integralTensorNorm01,
      integralChannelTVL1,
      integralAlignmentDrift01
    }
  };
}

/**
 * Prefix stability S(t_k) and discrete dS/dt on each new segment — observation only (not a control signal).
 * dS/dt_k = (S_prefix[k] − S_prefix[k−1]) / Δt_k with S_prefix[−1]≡0 for k=0 boundary.
 *
 * @param {{
 *   ts: number;
 *   tensorDifferenceNorm01?: number | null;
 *   channelDivergenceVector01?: [number, number, number] | null;
 * }[]} samples
 */
export function discreteStabilityGradientSeriesV01(samples) {
  /** @type {{ endIndex: number; ts: number; S_prefix: number; dS_dt: number | null }[]} */
  const series = [];
  if (samples.length < 2) {
    return { v: 0, series, last: null };
  }
  let S_prev = 0;
  for (let k = 1; k < samples.length; k++) {
    const slice = samples.slice(0, k + 1);
    const st = stabilityFunctional01V0(slice);
    const S_k = st.S;
    const dtMs = samples[k].ts - samples[k - 1].ts;
    const dt = dtMs / 1000;
    let dS_dt = null;
    if (dt > 0) {
      dS_dt = (S_k - S_prev) / dt;
    }
    series.push({ endIndex: k, ts: samples[k].ts, S_prefix: S_k, dS_dt });
    S_prev = S_k;
  }
  const last = series.length > 0 ? series[series.length - 1] : null;
  return { v: 0, series, last };
}

/** @type {const} */ export const ALPHA_ANOMALY_V01 = 1;
/** @type {const} */ export const BETA_ANOMALY_V01 = 1;
/** @type {const} */ export const EMA_LAMBDA_ANOMALY_V01 = 0.35;

/**
 * Epistemic stress density A = α·S_norm + β·|dS/dt| (same units as components; read-only scalar field sample).
 */
export function epistemicAnomalyDensityV01(S_norm, absDSDt, alpha = ALPHA_ANOMALY_V01, beta = BETA_ANOMALY_V01) {
  const sn = Number.isFinite(S_norm) ? S_norm : 0;
  const d = Number.isFinite(absDSDt) ? absDSDt : 0;
  return alpha * sn + beta * d;
}

/**
 * @param {number[]} values
 * @param {number} lambda smoothing in (0,1]
 */
export function emaOverValuesV01(values, lambda = EMA_LAMBDA_ANOMALY_V01) {
  if (!values.length) return [];
  const lam = Math.max(1e-6, Math.min(1, lambda));
  const out = [];
  let e = values[0];
  out.push(e);
  for (let i = 1; i < values.length; i++) {
    e = lam * values[i] + (1 - lam) * e;
    out.push(e);
  }
  return out;
}

/**
 * Multi-scale EMA on A(t) — short / mid / slow moving baselines (observation only; not control).
 * `emaOfA` (single λ) remains the regime quantization reference for deviationFromEma.
 */
export const EMA_MULTI_SCALES_V01 = [
  { id: /** @type {const} */ ("fast"), lambda: 0.55 },
  { id: /** @type {const} */ ("mid"), lambda: 0.28 },
  { id: /** @type {const} */ ("slow"), lambda: 0.12 }
];

/**
 * @param {number[]} values
 * @param {{ id: string; lambda: number }[]} scales
 */
export function multiScaleEmaOverA_V01(values, scales = EMA_MULTI_SCALES_V01) {
  return scales.map(({ id, lambda }) => ({
    id,
    lambda,
    series: emaOverValuesV01(values, lambda)
  }));
}

/**
 * Scale interference map: Δ_scale(t) = |μ_fast − μ_slow| at each aligned index (measurement topology only).
 * @param {{ id: string; lambda: number; series: number[] }[]} emaMultiScaleOfA
 */
export function scaleInterferenceSeriesV01(emaMultiScaleOfA) {
  const fast = emaMultiScaleOfA.find((x) => x.id === "fast")?.series ?? [];
  const slow = emaMultiScaleOfA.find((x) => x.id === "slow")?.series ?? [];
  const n = Math.min(fast.length, slow.length);
  /** @type {{ index: number; deltaScale: number }[]} */
  const series = [];
  for (let i = 0; i < n; i++) {
    series.push({ index: i, deltaScale: Math.abs(fast[i] - slow[i]) });
  }
  return {
    v: 0,
    series,
    last: series.length > 0 ? series[series.length - 1] : null
  };
}

/**
 * Regime coherence observables (non-threshold): EMA cross-scale spread + prefix rank motion.
 * coherenceScore01 ∈ (0,1] — descriptive scalar, not a control signal.
 *
 * @param {{ A: number }[]} entries
 * @param {{ id: string; series: number[] }[]} emaMultiScaleOfA
 */
export function regimeCoherenceObsV01(entries, emaMultiScaleOfA) {
  if (!entries.length) {
    return {
      v: 0,
      meanPrefixRankDrift01: 0,
      emaSpreadCoherence01: 1,
      coherenceScore01: 1,
      lastPrefixRankDrift01: 0
    };
  }
  const rankDrifts = [];
  for (let k = 1; k < entries.length; k++) {
    const prevAs = entries.slice(0, k).map((e) => e.A);
    const currAs = entries.slice(0, k + 1).map((e) => e.A);
    const pPrev = percentileRank01(prevAs, entries[k - 1].A);
    const pCurr = percentileRank01(currAs, entries[k].A);
    rankDrifts.push(Math.abs(pCurr - pPrev));
  }
  const meanPrefixRankDrift01 =
    rankDrifts.length > 0 ? rankDrifts.reduce((s, x) => s + x, 0) / rankDrifts.length : 0;
  const lastPrefixRankDrift01 = rankDrifts.length > 0 ? rankDrifts[rankDrifts.length - 1] : 0;

  const lastI = entries.length - 1;
  const muF = emaMultiScaleOfA.find((x) => x.id === "fast")?.series[lastI] ?? 0;
  const muM = emaMultiScaleOfA.find((x) => x.id === "mid")?.series[lastI] ?? 0;
  const muS = emaMultiScaleOfA.find((x) => x.id === "slow")?.series[lastI] ?? 0;
  const meanMu = (muF + muM + muS) / 3;
  const varMu =
    ((muF - meanMu) ** 2 + (muM - meanMu) ** 2 + (muS - meanMu) ** 2) / 3;
  const emaSpreadCoherence01 = 1 / (1 + 5 * varMu);

  const coherenceScore01 = emaSpreadCoherence01 * (1 - Math.min(1, meanPrefixRankDrift01));

  return {
    v: 0,
    meanPrefixRankDrift01,
    lastPrefixRankDrift01,
    emaSpreadCoherence01,
    coherenceScore01
  };
}

/** @param {number[]} values @param {number} value */
export function percentileRank01(values, value) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => a - b);
  let c = 0;
  for (const x of sorted) {
    if (x <= value) c += 1;
  }
  return c / sorted.length;
}

/**
 * Quantize continuous A(t) using **session** distribution (tertiles) + deviation from EMA( A ).
 * Not a control plane; quantization grid is on ranks / relative baseline only.
 */
export function quantizeEpistemicRegimeFromAnomalyFieldV01(entries, emaOfA) {
  if (!entries.length || !emaOfA.length) {
    return { v: 0, regime: /** @type {const} */ ("unknown"), detail: {} };
  }
  const lastI = entries.length - 1;
  const last = entries[lastI];
  const As = entries.map((e) => e.A);
  const p = percentileRank01(As, last.A);
  const emaLast = emaOfA[lastI] ?? last.A;
  const devFromEma = (last.A - emaLast) / (Math.abs(emaLast) + 1e-9);

  /** @type {"quiescent" | "typical" | "elevated" | "stressed"} */
  let regime = "typical";
  if (p >= 2 / 3) {
    regime = devFromEma > 0.4 ? "stressed" : "elevated";
  } else if (p <= 1 / 3) {
    regime = "quiescent";
  }
  return {
    v: 0,
    regime,
    detail: {
      percentile01: p,
      deviationFromEma01: devFromEma,
      A: last.A,
      muA_ema: emaLast,
      S_norm: last.S_norm,
      abs_dS_dt: last.abs_dS_dt
    }
  };
}

/**
 * Per-segment anomaly samples aligned with stability gradient indices.
 */
export function buildEpistemicAnomalyFieldBundleV01(samples, options = {}) {
  const alpha = options.alpha ?? ALPHA_ANOMALY_V01;
  const beta = options.beta ?? BETA_ANOMALY_V01;
  const emaLambda = options.emaLambda ?? EMA_LAMBDA_ANOMALY_V01;
  const grad = discreteStabilityGradientSeriesV01(samples);
  /** @type {{ endIndex: number; ts: number; A: number; S_norm: number; abs_dS_dt: number; dS_dt: number | null }[]} */
  const entries = [];
  for (const g of grad.series) {
    const k = g.endIndex;
    const prefix = samples.slice(0, k + 1);
    const st = stabilityFunctional01V0(prefix);
    const absD = g.dS_dt == null ? 0 : Math.abs(g.dS_dt);
    const A = epistemicAnomalyDensityV01(st.S_norm, absD, alpha, beta);
    entries.push({
      endIndex: k,
      ts: g.ts,
      A,
      S_norm: st.S_norm,
      abs_dS_dt: absD,
      dS_dt: g.dS_dt
    });
  }
  const As = entries.map((e) => e.A);
  const emaOfA = emaOverValuesV01(As, emaLambda);
  const emaMultiScaleOfA = multiScaleEmaOverA_V01(As);
  const regimeQuantized = quantizeEpistemicRegimeFromAnomalyFieldV01(entries, emaOfA);
  const scaleInterference01 = scaleInterferenceSeriesV01(emaMultiScaleOfA);
  const regimeCoherence01 = regimeCoherenceObsV01(entries, emaMultiScaleOfA);
  const last = entries.length > 0 ? entries[entries.length - 1] : null;
  return {
    v: 0,
    alpha,
    beta,
    emaLambda,
    entries,
    emaOfA,
    emaMultiScaleOfA,
    scaleInterference01,
    regimeCoherence01,
    regimeQuantized,
    last
  };
}

/**
 * Cross-origin / sequential channel alignment — cosine + L1 gap (not merge, not scalar truth).
 * @param {[number, number, number] | null | undefined} vecA
 * @param {[number, number, number] | null | undefined} vecB
 */
export function crossOriginChannelAlignmentOperatorV0(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== 3 || vecB.length !== 3) return null;
  const dot = vecA[0] * vecB[0] + vecA[1] * vecB[1] + vecA[2] * vecB[2];
  const na = Math.hypot(vecA[0], vecA[1], vecA[2]);
  const nb = Math.hypot(vecB[0], vecB[1], vecB[2]);
  const l1Delta = Math.abs(vecA[0] - vecB[0]) + Math.abs(vecA[1] - vecB[1]) + Math.abs(vecA[2] - vecB[2]);
  if (na === 0 && nb === 0) {
    return { v: 0, cosine01: 1, l1Delta: 0, degenerate: /** @type {const} */ ("both_zero") };
  }
  if (na === 0 || nb === 0) {
    return { v: 0, cosine01: null, l1Delta, degenerate: /** @type {const} */ ("one_zero") };
  }
  const cosine01 = dot / (na * nb);
  return { v: 0, cosine01, l1Delta, degenerate: /** @type {const} */ ("none") };
}

/**
 * Discrete bundle over drift: integral, TV, last pairwise alignment, phase from latest barycentric if any.
 * @param {{
 *   ts: number;
 *   tensorDifferenceNorm01?: number | null;
 *   channelDivergenceVector01?: [number, number, number] | null;
 *   fieldTopology?: { barycentricRL01?: [number, number, number] } | null;
 * }[]} samples
 * @param {{ barycentricRL01?: [number, number, number] } | null} currentTopology
 */
export function epistemicVectorFieldDynamicsBundleV01(samples, currentTopology) {
  const cumulativeIntegralTensorNorm01 = driftCumulativeIntegralTensorNorm01V0(samples);
  const channelTotalVariationL1 = driftChannelTotalVariationL1V0(samples);
  const stabilityFunctional01 = stabilityFunctional01V0(samples);
  const stabilityGradientSeriesV01 = discreteStabilityGradientSeriesV01(samples);
  const epistemicAnomalyFieldV01 = buildEpistemicAnomalyFieldBundleV01(samples);
  let sequentialChannelAlignment = null;
  if (samples.length >= 2) {
    sequentialChannelAlignment = crossOriginChannelAlignmentOperatorV0(
      samples[samples.length - 2].channelDivergenceVector01,
      samples[samples.length - 1].channelDivergenceVector01
    );
  }
  const bary = currentTopology?.barycentricRL01 ?? samples[samples.length - 1]?.fieldTopology?.barycentricRL01;
  const phase01 =
    bary && bary.length === 3 ? epistemicPhase01FromBarycentricV0(/** @type {[number, number, number]} */ (bary)) : null;
  return {
    v: 0,
    cumulativeIntegralTensorNorm01,
    channelTotalVariationL1,
    stabilityFunctional01,
    stabilityGradientSeriesV01,
    epistemicAnomalyFieldV01,
    sequentialChannelAlignment,
    phase01
  };
}
