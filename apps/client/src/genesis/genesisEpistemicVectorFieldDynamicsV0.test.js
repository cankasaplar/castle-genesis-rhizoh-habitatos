import { describe, expect, it } from "vitest";
import {
  buildEpistemicAnomalyFieldBundleV01,
  crossOriginChannelAlignmentOperatorV0,
  discreteStabilityGradientSeriesV01,
  driftChannelTotalVariationL1V0,
  driftCumulativeIntegralTensorNorm01V0,
  emaOverValuesV01,
  epistemicAnomalyDensityV01,
  epistemicPhase01FromBarycentricV0,
  epistemicVectorFieldDynamicsBundleV01,
  multiScaleEmaOverA_V01,
  regimeCoherenceObsV01,
  scaleInterferenceSeriesV01,
  stabilityFunctional01V0
} from "./genesisEpistemicVectorFieldDynamicsV0.js";

describe("genesisEpistemicVectorFieldDynamicsV0", () => {
  it("phase on simplex is in [0,1)", () => {
    const p = epistemicPhase01FromBarycentricV0([1 / 3, 1 / 3, 1 / 3]);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(1);
  });

  it("cumulative integral uses dt in seconds", () => {
    const s = [
      { ts: 0, tensorDifferenceNorm01: 0.5 },
      { ts: 2000, tensorDifferenceNorm01: 0.5 }
    ];
    expect(driftCumulativeIntegralTensorNorm01V0(s)).toBeCloseTo(1.0, 6);
  });

  it("channel total variation L1", () => {
    const s = [
      { channelDivergenceVector01: [0, 0, 0] },
      { channelDivergenceVector01: [1, 0, 0] },
      { channelDivergenceVector01: [1, 1, 0] }
    ];
    expect(driftChannelTotalVariationL1V0(s)).toBe(2);
  });

  it("alignment operator cosine", () => {
    const a = crossOriginChannelAlignmentOperatorV0([1, 0, 0], [1, 0, 0]);
    expect(a?.cosine01).toBeCloseTo(1, 6);
    const o = crossOriginChannelAlignmentOperatorV0([1, 0, 0], [0, 1, 0]);
    expect(o?.cosine01).toBeCloseTo(0, 6);
  });

  it("stability functional S combines ∫T dt + ∫TV dt + ∫(1-cos) dt", () => {
    const s = [
      { ts: 0, tensorDifferenceNorm01: null, channelDivergenceVector01: [0, 0, 0] },
      { ts: 1000, tensorDifferenceNorm01: 0.5, channelDivergenceVector01: [0, 0, 0] }
    ];
    const st = stabilityFunctional01V0(s);
    expect(st.S).toBeCloseTo(0.5, 6);
    expect(st.totalElapsedSeconds).toBeCloseTo(1, 6);
    expect(st.S_norm).toBeCloseTo(0.5 / 2, 6);
    expect(st.breakdown.integralTensorNorm01).toBeCloseTo(0.5, 6);
    expect(st.breakdown.integralChannelTVL1).toBe(0);
    expect(st.breakdown.integralAlignmentDrift01).toBe(0);

    const s2 = [
      { ts: 0, tensorDifferenceNorm01: 0, channelDivergenceVector01: [1, 0, 0] },
      { ts: 1000, tensorDifferenceNorm01: 0, channelDivergenceVector01: [0, 1, 0] }
    ];
    const st2 = stabilityFunctional01V0(s2);
    expect(st2.breakdown.integralChannelTVL1).toBeCloseTo(2, 6);
    expect(st2.breakdown.integralAlignmentDrift01).toBeCloseTo(1, 6);
    expect(st2.S).toBeCloseTo(3, 6);
    expect(st2.S_norm).toBeCloseTo(3 / 2, 6);
  });

  it("discrete stability gradient dS/dt on prefix chain", () => {
    const s = [
      { ts: 0, tensorDifferenceNorm01: null, channelDivergenceVector01: [0, 0, 0] },
      { ts: 1000, tensorDifferenceNorm01: 0.5, channelDivergenceVector01: [0, 0, 0] },
      { ts: 2000, tensorDifferenceNorm01: 0.5, channelDivergenceVector01: [0, 0, 0] }
    ];
    const g = discreteStabilityGradientSeriesV01(s);
    expect(g.series).toHaveLength(2);
    expect(g.series[0].dS_dt).toBeCloseTo(0.5, 6);
    expect(g.series[1].dS_dt).toBeCloseTo(0.5, 6);
    expect(g.last?.S_prefix).toBeCloseTo(1, 6);
  });

  it("anomaly density A combines S_norm and |dS/dt|", () => {
    expect(epistemicAnomalyDensityV01(0.25, 0.5, 1, 1)).toBeCloseTo(0.75, 6);
  });

  it("anomaly field bundle uses session distribution + EMA baseline", () => {
    const s = [
      { ts: 0, tensorDifferenceNorm01: null, channelDivergenceVector01: [0, 0, 0] },
      { ts: 1000, tensorDifferenceNorm01: 0.1, channelDivergenceVector01: [0, 0, 0] },
      { ts: 2000, tensorDifferenceNorm01: 0.1, channelDivergenceVector01: [0, 0, 0] }
    ];
    const f = buildEpistemicAnomalyFieldBundleV01(s);
    expect(f.entries).toHaveLength(2);
    expect(f.emaOfA.length).toBe(2);
    expect(f.regimeQuantized.regime).toBeTruthy();
  });

  it("EMA helper", () => {
    expect(emaOverValuesV01([1, 2, 3], 0.5)).toHaveLength(3);
  });

  it("multi-scale EMA on A gives parallel baselines", () => {
    const ms = multiScaleEmaOverA_V01([0.1, 0.5, 0.9, 0.2]);
    expect(ms).toHaveLength(3);
    expect(ms[0].series).toHaveLength(4);
    expect(ms.every((m) => m.series.length === 4)).toBe(true);
  });

  it("scale interference is |mu_fast - mu_slow| per aligned index", () => {
    const si = scaleInterferenceSeriesV01([
      { id: "fast", series: [1, 2, 5] },
      { id: "mid", series: [0, 0, 0] },
      { id: "slow", series: [1, 0, 1] }
    ]);
    expect(si.series[0].deltaScale).toBe(0);
    expect(si.series[1].deltaScale).toBe(2);
    expect(si.series[2].deltaScale).toBe(4);
    expect(si.last?.deltaScale).toBe(4);
  });

  it("regime coherence is bounded descriptive scalar", () => {
    const entries = [{ A: 1 }, { A: 2 }, { A: 3 }];
    const emaMulti = multiScaleEmaOverA_V01([1, 2, 3]);
    const coh = regimeCoherenceObsV01(entries, emaMulti);
    expect(coh.v).toBe(0);
    expect(coh.coherenceScore01).toBeGreaterThan(0);
    expect(coh.coherenceScore01).toBeLessThanOrEqual(1);
  });

  it("anomaly field bundle attaches scale interference and coherence observables", () => {
    const f = buildEpistemicAnomalyFieldBundleV01([
      { ts: 0, tensorDifferenceNorm01: null, channelDivergenceVector01: [0, 0, 0] },
      { ts: 1000, tensorDifferenceNorm01: 0.1, channelDivergenceVector01: [0, 0, 0] },
      { ts: 2000, tensorDifferenceNorm01: 0.1, channelDivergenceVector01: [0, 0, 0] }
    ]);
    expect(f.scaleInterference01?.series?.length).toBeGreaterThan(0);
    expect(f.regimeCoherence01?.v).toBe(0);
  });

  it("bundle wires dynamics v0.1", () => {
    const samples = [
      { ts: 0, tensorDifferenceNorm01: 0.2, channelDivergenceVector01: [0.1, 0, 0], fieldTopology: null },
      {
        ts: 1000,
        tensorDifferenceNorm01: 0.4,
        channelDivergenceVector01: [0.2, 0.1, 0],
        fieldTopology: { barycentricRL01: [0.5, 0.25, 0.25] }
      }
    ];
    const b = epistemicVectorFieldDynamicsBundleV01(samples, null);
    expect(b.v).toBe(0);
    expect(b.cumulativeIntegralTensorNorm01).toBeCloseTo(0.4, 6);
    expect(b.epistemicAnomalyFieldV01?.entries?.length).toBe(1);
    expect(b.epistemicAnomalyFieldV01?.emaMultiScaleOfA?.length).toBe(3);
    expect(b.epistemicAnomalyFieldV01?.regimeQuantized?.regime).toBeTruthy();
    expect(b.channelTotalVariationL1).toBeGreaterThan(0);
    expect(b.sequentialChannelAlignment?.v).toBe(0);
    expect(b.phase01).not.toBeNull();
  });
});
