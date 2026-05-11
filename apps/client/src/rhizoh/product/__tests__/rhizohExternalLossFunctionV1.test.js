import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  ingestRhizohExternalLossFromSignalDetail,
  getRhizohExternalLossSummary,
  getRhizohExternalLossPromotionGate,
  getRhizohExternalLossMergeGate,
  getRhizohExternalLossLearningRateMultiplier,
  getRhizohExternalLoopAsymmetryScale,
  flushRhizohExternalLossBatchBestEffort,
  resolveRhizohExternalLossBatchUrl,
  RHIZOH_POLICY_LEARNING_RISK_ROOT_MAP
} from "../rhizohExternalLossFunctionV1.js";

describe("rhizohExternalLossFunctionV1", () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
          store[k] = String(v);
        },
        removeItem: (k) => {
          delete store[k];
        },
        clear: () => {
          for (const k of Object.keys(store)) delete store[k];
        }
      }
    );
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (...args) => globalThis.clearTimeout(...args),
      location: { origin: "http://localhost:5173" }
    });
    globalThis.__RHIZOH_TEST_GATEWAY_HTTP__ = "http://localhost:8090/rhizoh/llm";
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    delete globalThis.__RHIZOH_TEST_GATEWAY_HTTP__;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("exports single-root risk map", () => {
    expect(RHIZOH_POLICY_LEARNING_RISK_ROOT_MAP.observable_closed_loop_without_external_loss.risks.length).toBe(4);
  });

  it("ingests explicit rating into summary", () => {
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.external_loss.explicit_rating",
      rating: -1,
      ts: Date.now()
    });
    const s = getRhizohExternalLossSummary();
    expect(s.negativeCount).toBeGreaterThanOrEqual(1);
  });

  it("promotion gate respects LS flag and penalty", () => {
    globalThis.localStorage.setItem("rhizoh.policy.block_promote_on_external_loss.v1", "1");
    for (let i = 0; i < 3; i++) {
      ingestRhizohExternalLossFromSignalDetail({
        name: "rhizoh.external_loss.explicit_rating",
        rating: -1,
        ts: Date.now()
      });
    }
    const g = getRhizohExternalLossPromotionGate();
    expect(g.blocked).toBe(true);
    expect(g.reason).toBe("external_loss_penalty");
  });

  it("merge gate respects LS flag and penalty", () => {
    globalThis.localStorage.setItem("rhizoh.policy.block_merge_on_external_loss.v1", "1");
    for (let i = 0; i < 3; i++) {
      ingestRhizohExternalLossFromSignalDetail({
        name: "rhizoh.external_loss.explicit_rating",
        rating: -1,
        ts: Date.now()
      });
    }
    const g = getRhizohExternalLossMergeGate();
    expect(g.blocked).toBe(true);
    expect(g.reason).toBe("external_loss_penalty");
  });

  it("resolves batch URL from __RHIZOH_TEST_GATEWAY_HTTP__", () => {
    expect(resolveRhizohExternalLossBatchUrl()).toContain("/rhizoh/product/external-loss/batch");
  });

  it("learning rate multiplier lowers under sustained penalty", () => {
    for (let i = 0; i < 6; i++) {
      ingestRhizohExternalLossFromSignalDetail({
        name: "rhizoh.external_loss.explicit_rating",
        rating: -1,
        ts: Date.now()
      });
    }
    const low = getRhizohExternalLossLearningRateMultiplier();
    expect(low.multiplier01).toBeLessThan(0.95);
    expect(low.gradientDisabled).toBe(false);

    globalThis.localStorage.clear();
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.session.return_7d",
      gapMs: 1,
      ts: Date.now()
    });
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.external_loss.task_proxy",
      ok: true,
      ts: Date.now()
    });
    const high = getRhizohExternalLossLearningRateMultiplier();
    expect(high.multiplier01).toBeGreaterThan(low.multiplier01);
  });

  it("disable LS forces unit learning rate multiplier", () => {
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.external_loss.explicit_rating",
      rating: -1,
      ts: Date.now()
    });
    globalThis.localStorage.setItem("rhizoh.policy.disable_external_loss_lr_gradient.v1", "1");
    globalThis.localStorage.setItem("rhizoh.policy.disable_external_loop_asymmetry.v1", "1");
    const g = getRhizohExternalLossLearningRateMultiplier();
    expect(g.multiplier01).toBe(1);
    expect(g.gradientDisabled).toBe(true);
  });

  it("external loop asymmetry bypasses when no gateway hooks", () => {
    delete globalThis.__RHIZOH_TEST_GATEWAY_HTTP__;
    vi.stubEnv("VITE_GATEWAY_HTTP", "");
    vi.stubEnv("VITE_RHIZOH_LLM_HTTP", "");
    vi.stubEnv("VITE_RHIZOH_EXTERNAL_TRUTH_HTTP", "");
    vi.stubEnv("VITE_RHIZOH_EXTERNAL_LOSS_BATCH_HTTP", "");
    const a = getRhizohExternalLoopAsymmetryScale(Date.now());
    expect(a.bypassed).toBe(true);
    expect(a.scale01).toBe(1);
  });

  it("external loop asymmetry drops when truth bundle is stale", () => {
    const now = Date.now();
    const bundle = {
      schemaVersion: "1.0.0",
      issuedAtMs: now - 400_000,
      ttlMs: 120_000,
      populationCohort: "COHORT",
      promotionEligible: true
    };
    globalThis.localStorage.setItem(
      "rhizoh.external_truth.bundle.cache.v1",
      JSON.stringify({ schemaVersion: "1.0.0", cachedAtMs: now - 50_000, bundle })
    );
    const a = getRhizohExternalLoopAsymmetryScale(now);
    expect(a.hasTruthUrl).toBe(true);
    expect(a.truthCoverage01).toBe(0.38);
    expect(a.rawScale01).toBe(0.38);
    expect(a.scale01).toBe(0.38);
  });

  it("external loop asymmetry uses gentle pending batch and unknown-truth blend", () => {
    globalThis.localStorage.removeItem("rhizoh.external_truth.bundle.cache.v1");
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.external_loss.explicit_rating",
      rating: 1,
      ts: Date.now()
    });
    globalThis.localStorage.removeItem("rhizoh.external_loss.flush_meta.v1");
    const a = getRhizohExternalLoopAsymmetryScale(Date.now());
    expect(a.hasBatchUrl).toBe(true);
    expect(a.truthCoverage01).toBe(0.52);
    expect(a.batchCoverage01).toBe(0.48);
    expect(a.rawScale01).toBe(0.48);
    expect(a.scale01).toBe(0.48);
  });

  it("external asymmetry floor prevents feedback starvation floor from raw", () => {
    const now = Date.now();
    const bundle = {
      schemaVersion: "1.0.0",
      issuedAtMs: now - 400_000,
      ttlMs: 120_000,
      populationCohort: "COHORT",
      promotionEligible: true
    };
    globalThis.localStorage.setItem(
      "rhizoh.external_truth.bundle.cache.v1",
      JSON.stringify({ schemaVersion: "1.0.0", cachedAtMs: now - 50_000, bundle })
    );
    globalThis.localStorage.setItem("rhizoh.policy.external_asymmetry_floor.v1", "0.42");
    const a = getRhizohExternalLoopAsymmetryScale(now);
    expect(a.rawScale01).toBe(0.38);
    expect(a.scaleFloor01).toBe(0.42);
    expect(a.scale01).toBe(0.42);
  });

  it("flush posts batch then throttles repeat without new events", async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.external_loss.explicit_rating",
      rating: -1,
      ts: Date.now()
    });

    const r1 = await flushRhizohExternalLossBatchBestEffort();
    expect(r1.ok).toBe(true);
    expect(r1.reason).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1];
    const payload = JSON.parse(init.body);
    expect(payload.schemaVersion).toBe("1.0.0");
    expect(Array.isArray(payload.events)).toBe(true);

    const r2 = await flushRhizohExternalLossBatchBestEffort();
    expect(r2.ok).toBe(true);
    expect(r2.reason).toBe("throttled");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ingests product grounding outcome, satisfaction, and correction", () => {
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.product.session_outcome",
      outcome: "success",
      implicit: true
    });
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.product.satisfaction_proxy",
      source: "rage_click",
      burst01: 0.8
    });
    ingestRhizohExternalLossFromSignalDetail({
      name: "rhizoh.product.correction_signal",
      kind: "retry"
    });
    const raw = globalThis.localStorage.getItem("rhizoh.external_loss.events.v1");
    expect(raw).toBeTruthy();
    const p = JSON.parse(raw);
    const kinds = (p.events || []).map((e) => e.kind);
    expect(kinds.some((k) => String(k).includes("product_session_success"))).toBe(true);
    expect(kinds.some((k) => String(k).includes("rage_click"))).toBe(true);
    expect(kinds.some((k) => String(k).includes("retry"))).toBe(true);
  });
});
