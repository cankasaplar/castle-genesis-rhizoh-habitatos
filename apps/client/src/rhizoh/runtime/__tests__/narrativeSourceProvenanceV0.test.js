import { describe, expect, it } from "vitest";
import {
  buildDefaultDensityNarrativeSourceChainV0,
  detectOrphanNarrativeOutputsV0,
  inferNarrativeTrustClassV0,
  MAX_NARRATIVE_SOURCE_CHAIN_V0,
  NARRATIVE_CONFIDENCE_SHAPE_V0,
  NARRATIVE_TRUST_CLASS_V0,
  computeHopFamilyShannonEntropyV0,
  computeProvenanceEntropyDeltaV0,
  normalizeNarrativeSourceChainV0,
  PROVENANCE_FOLD_REASON_V0,
  wrapNarrativeOutputV0
} from "../narrativeSourceProvenanceV0.js";

describe("narrativeSourceProvenanceV0", () => {
  it("infers untrusted_external_origin for lab chain", () => {
    expect(
      inferNarrativeTrustClassV0(["lab.observation.snapshot", "computeViscosity.v2"])
    ).toBe(NARRATIVE_TRUST_CLASS_V0.MIXED);
    expect(inferNarrativeTrustClassV0(["lab.observation.snapshot"])).toBe(
      NARRATIVE_TRUST_CLASS_V0.UNTRUSTED_EXTERNAL
    );
  });

  it("wrapNarrativeOutputV0 attaches source_chain and derivation_depth", () => {
    const out = wrapNarrativeOutputV0({
      text: "Ankara düğümünde uzamsal direnç yüksek.",
      sourceChain: buildDefaultDensityNarrativeSourceChainV0({ labObservation: true }),
      register: false
    });
    expect(out.provenance.source_chain).toContain("lab.observation.snapshot");
    expect(out.provenance.source_chain).toContain("computeViscosity.v2");
    expect(out.provenance.derivation_depth).toBe(3);
    expect(out.provenance.trust_class).toBe(NARRATIVE_TRUST_CLASS_V0.MIXED);
    expect(out.provenance.provenance_summary.dominant_source).toBe("computeViscosity.v2");
    expect(out.provenance.provenance_summary.confidence_shape).toBe(
      NARRATIVE_CONFIDENCE_SHAPE_V0.DRIFTING
    );
  });

  it("normalizeNarrativeSourceChainV0 folds inflated chains with length_limit reason", () => {
    const long = Array.from({ length: 12 }, (_, i) => `sensor${i}.reading`);
    long.push("computeViscosity.v2");
    const { chain, folded, foldReason, foldCount } = normalizeNarrativeSourceChainV0(long);
    expect(folded).toBe(true);
    expect(foldReason).toBe(PROVENANCE_FOLD_REASON_V0.LENGTH_LIMIT);
    expect(foldCount).toBeGreaterThan(0);
    expect(chain.length).toBeLessThanOrEqual(MAX_NARRATIVE_SOURCE_CHAIN_V0);
    expect(chain.some((c) => String(c).startsWith("meta.provenance_folded:"))).toBe(true);
  });

  it("records dedupe fold reason without length_limit marker", () => {
    const { foldReason, chain } = normalizeNarrativeSourceChainV0([
      "weather.api",
      "weather.api",
      "computeViscosity.v2"
    ]);
    expect(foldReason).toBe(PROVENANCE_FOLD_REASON_V0.DEDUPE);
    expect(chain.some((c) => String(c).startsWith("meta.provenance_folded:"))).toBe(false);
  });

  it("records low_entropy_merge for consecutive same-family hops", () => {
    const out = wrapNarrativeOutputV0({
      text: "test",
      sourceChain: ["weather.api", "weather.cache", "weather.poll", "computeViscosity.v2"],
      register: false
    });
    expect(out.provenance.provenance_fold_reason).toBe(PROVENANCE_FOLD_REASON_V0.LOW_ENTROPY_MERGE);
    expect(out.provenance.source_chain).toContain("weather.merged");
    expect(out.provenance.provenance_entropy_delta).toBeGreaterThan(0);
  });

  it("computeProvenanceEntropyDeltaV0 is zero when chain unchanged", () => {
    const chain = ["weather.api", "computeViscosity.v2"];
    expect(computeProvenanceEntropyDeltaV0(chain, chain)).toBe(0);
  });

  it("computeProvenanceEntropyDeltaV0 rises when diversity collapses", () => {
    const before = ["weather.api", "weather.cache", "traffic.api", "lab.observation.snapshot"];
    const after = ["weather.merged", "traffic.api", "lab.observation.snapshot"];
    const hBefore = computeHopFamilyShannonEntropyV0(before);
    const hAfter = computeHopFamilyShannonEntropyV0(after);
    expect(hAfter).toBeLessThan(hBefore);
    expect(computeProvenanceEntropyDeltaV0(before, after)).toBeGreaterThan(0);
  });

  it("detectOrphanNarrativeOutputsV0 flags text without provenance", () => {
    const r = detectOrphanNarrativeOutputsV0([
      { text: "orphan", provenance: { source_chain: [], trust_class: "baseline_no_signal", derivation_depth: 0 } }
    ]);
    expect(r.ok).toBe(false);
    expect(r.orphanCount).toBeGreaterThan(0);
  });
});
