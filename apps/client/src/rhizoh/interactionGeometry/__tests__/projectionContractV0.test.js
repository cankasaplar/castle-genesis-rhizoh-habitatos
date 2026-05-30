/**
 * Pure contract logic — avoid jsdom + full Vite React graph in the worker (memory-heavy on CI-like Windows runs).
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0,
  ALLOWED_DEBUG_CAUSAL_LABELS_V0,
  ALLOWED_RESEARCH_AGGREGATE_KEYS_V0,
  isAllowedProductFormDescriptorV0,
  isAllowedDebugCausalLabelV0,
  mapBurstiness01ToProductDescriptorV0,
  mapLanguageMix01ToProductDescriptorV0,
  projectionCopyLeakageFindingsV0,
  validateResearchAggregateRowV0
} from "../projectionContractV0.js";

describe("projectionContractV0 — allowed product descriptor whitelist", () => {
  it("keeps unique snake_case ids", () => {
    expect(new Set(ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0).size).toBe(
      ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0.length
    );
    for (const d of ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0) {
      expect(d).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it("rejects ids outside the allowlist", () => {
    expect(isAllowedProductFormDescriptorV0("impulsive_user")).toBe(false);
    expect(isAllowedProductFormDescriptorV0("not_a_real_token")).toBe(false);
  });

  it("mapBurstiness01ToProductDescriptorV0 maps only to allowlisted descriptors", () => {
    for (const x of [0, 0.32, 0.5, 0.9, 1]) {
      const d = mapBurstiness01ToProductDescriptorV0(x);
      expect(d).not.toBeNull();
      expect(isAllowedProductFormDescriptorV0(d)).toBe(true);
    }
    expect(mapBurstiness01ToProductDescriptorV0(NaN)).toBeNull();
  });

  it("mapLanguageMix01ToProductDescriptorV0 maps only to allowlisted descriptors", () => {
    for (const x of [0, 0.4, 0.7, 1]) {
      const d = mapLanguageMix01ToProductDescriptorV0(x);
      expect(d).not.toBeNull();
      expect(isAllowedProductFormDescriptorV0(d)).toBe(true);
    }
    expect(mapLanguageMix01ToProductDescriptorV0(NaN)).toBeNull();
  });
});

describe("projectionContractV0 — identity leakage detector", () => {
  it("matches high-precision English / Turkish trait phrasing", () => {
    expect(
      projectionCopyLeakageFindingsV0("the user is a careful planner.").some((x) => x.ruleId === "en_user_is_a")
    ).toBe(true);
    expect(
      projectionCopyLeakageFindingsV0("Burst → impulsive user pattern.").some((x) => x.ruleId === "en_impulsive_user")
    ).toBe(true);
    expect(
      projectionCopyLeakageFindingsV0("Kullanıcının kişiliği sakin görünüyor.").some((x) => x.ruleId === "tr_kullanici_kisilik")
    ).toBe(true);
  });
});

describe("projectionContractV0 — UI-facing copy validation", () => {
  it("accepts neutral session-form copy that uses only contract descriptors", () => {
    const okCopy =
      "This session exhibits turn_pacing_dense and language_mix_moderate (non-authoritative telemetry).";
    expect(projectionCopyLeakageFindingsV0(okCopy)).toEqual([]);
  });

  it("still flags leakage inside otherwise descriptor-heavy copy", () => {
    const bad =
      "turn_pacing_calm — the user is a planner; recall_load_low.";
    expect(projectionCopyLeakageFindingsV0(bad).some((x) => x.ruleId === "en_user_is_a")).toBe(true);
  });
});

describe("projectionContractV0 — debug causal label compliance", () => {
  it("keeps unique debug labels", () => {
    expect(new Set(ALLOWED_DEBUG_CAUSAL_LABELS_V0).size).toBe(ALLOWED_DEBUG_CAUSAL_LABELS_V0.length);
  });

  it("accepts each allowlisted debug label", () => {
    for (const id of ALLOWED_DEBUG_CAUSAL_LABELS_V0) {
      expect(isAllowedDebugCausalLabelV0(id)).toBe(true);
    }
  });

  it("rejects engineering-ish strings not on the debug allowlist", () => {
    expect(isAllowedDebugCausalLabelV0("user_is_lazy")).toBe(false);
  });
});

describe("projectionContractV0 — research output aggregation", () => {
  it("accepts a well-formed aggregate row", () => {
    const good = validateResearchAggregateRowV0({
      sample_count: 12,
      turn_count: 40,
      mean_recall_proxy: 0.2,
      mean_language_mix_proxy: 0.5,
      descriptor_histogram: { turn_pacing_calm: 3, turn_pacing_dense: 1 }
    });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.row.descriptor_histogram).toEqual({ turn_pacing_calm: 3, turn_pacing_dense: 1 });
    }
  });

  it("rejects forbidden top-level research keys", () => {
    const badKey = validateResearchAggregateRowV0({ user_trait_score: 1 });
    expect(badKey.ok).toBe(false);
    if (!badKey.ok) {
      expect(badKey.errors.some((e) => e.startsWith("forbidden_research_key:"))).toBe(true);
    }
  });

  it("rejects histogram buckets outside product descriptors", () => {
    const badHist = validateResearchAggregateRowV0({
      sample_count: 1,
      descriptor_histogram: { impulsive_user: 2 }
    });
    expect(badHist.ok).toBe(false);
    if (!badHist.ok) {
      expect(badHist.errors.some((e) => e.startsWith("histogram_descriptor_not_allowed:"))).toBe(true);
    }
  });

  it("documents aggregate key allowlist includes descriptor_histogram", () => {
    expect(ALLOWED_RESEARCH_AGGREGATE_KEYS_V0).toContain("descriptor_histogram");
  });
});
