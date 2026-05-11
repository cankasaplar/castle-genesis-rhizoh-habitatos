import { describe, expect, it, vi } from "vitest";
import {
  guardClosureBannerMs,
  guardTrustBondForNormal,
  guardIntroTurnsForTrust,
  guardGovernanceGateBond01,
  hashStringToBucket01,
  applyContraryPolicyRollbacks,
  createEmptyRhizohProductPolicyState,
  getRhizohPolicyPromoteBlockReason,
  promoteQuotaAllows,
  getRhizohPolicyStabilityVelocityBlockReason,
  readRhizohPolicyStabilityBudgetShortWindow,
  resolveRhizohPolicyHoldoutSubjectKey,
  isRhizohPolicyLearningHoldout
} from "../rhizohProductPolicyStoreV1.js";

describe("rhizohProductPolicyStoreV1 guards", () => {
  it("clamps closure banner ms", () => {
    expect(guardClosureBannerMs(500)).toBe(8000);
    expect(guardClosureBannerMs(14000)).toBe(14000);
    expect(guardClosureBannerMs(99000)).toBe(24000);
  });

  it("clamps trust bond", () => {
    expect(guardTrustBondForNormal(0.05)).toBe(0.22);
    expect(guardTrustBondForNormal(0.28)).toBe(0.28);
    expect(guardTrustBondForNormal(0.99)).toBe(0.42);
  });

  it("clamps intro turns", () => {
    expect(guardIntroTurnsForTrust(2)).toBe(4);
    expect(guardIntroTurnsForTrust(7)).toBe(7);
    expect(guardIntroTurnsForTrust(99)).toBe(10);
  });

  it("clamps governance gate bond", () => {
    expect(guardGovernanceGateBond01(0.2)).toBe(0.35);
    expect(guardGovernanceGateBond01(0.42)).toBe(0.42);
    expect(guardGovernanceGateBond01(0.9)).toBe(0.55);
  });
});

describe("rhizohProductPolicyStoreV1 policy guards", () => {
  it("hashStringToBucket01 is deterministic", () => {
    expect(hashStringToBucket01("sess-example")).toBe(hashStringToBucket01("sess-example"));
    expect(hashStringToBucket01("sess-example", 100)).toBeLessThan(100);
  });

  it("applyContraryPolicyRollbacks strips closure patch", () => {
    const state = createEmptyRhizohProductPolicyState();
    state.patch.ux = { closureBannerMs: 12000 };
    const rb = applyContraryPolicyRollbacks(state, [{ dimension: "closure_engagement", verdict: "contrary" }]);
    expect(rb.touched).toBe(true);
    expect(rb.dimensions).toContain("closure_engagement");
    expect(state.patch.ux.closureBannerMs).toBeUndefined();
  });

  it("promote quota blocks when window count exhausted", () => {
    const state = createEmptyRhizohProductPolicyState();
    state.promoteMeta = { windowStartMs: Date.now(), count: 3, lastPromoteAt: Date.now() - 86_400_000 };
    expect(promoteQuotaAllows(state)).toBe(false);
    expect(getRhizohPolicyPromoteBlockReason(state)).toBe("promote_quota");
  });

  it("promote cooldown blocks shortly after last promote", () => {
    const state = createEmptyRhizohProductPolicyState();
    state.promoteMeta = { windowStartMs: Date.now(), count: 0, lastPromoteAt: Date.now() };
    expect(promoteQuotaAllows(state)).toBe(false);
    expect(getRhizohPolicyPromoteBlockReason(state)).toBe("promote_cooldown");
  });

  it("stability velocity cap when LS enabled and recent promote audits", () => {
    const state = createEmptyRhizohProductPolicyState();
    const now = Date.now();
    state.audit = [
      { ts: now - 60_000, action: "promote_closure_banner_ms" },
      { ts: now - 120_000, action: "promote_trust_gate" }
    ];
    globalThis.localStorage.setItem("rhizoh.policy.stability_budget_short_window.v1", "1");
    expect(readRhizohPolicyStabilityBudgetShortWindow()).toBe(true);
    expect(getRhizohPolicyStabilityVelocityBlockReason(state, now)).toBe("stability_velocity_cap");
  });

  it("holdout subject key prefers analystStableKey over session", () => {
    vi.stubGlobal(
      "localStorage",
      {
        getItem: () =>
          JSON.stringify({
            schemaVersion: "1.0.0",
            sessionId: "sess-aaa",
            conversationPhase: "NEW_USER",
            userTurnCount: 0,
            updatedAt: Date.now()
          }),
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      }
    );
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
    const k = resolveRhizohPolicyHoldoutSubjectKey({ analystStableKey: "stable-user-99" });
    expect(k).toBe("stable-user-99");
    vi.unstubAllGlobals();
  });

  it("isRhizohPolicyLearningHoldout deterministic for same analystStableKey", () => {
    const store = {};
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, v) => {
          store[key] = String(v);
        },
        removeItem: (key) => {
          delete store[key];
        },
        clear: () => {
          for (const pk of Object.keys(store)) delete store[pk];
        }
      }
    );
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
    store["rhizoh.policy.holdout_pct.v1"] = "15";
    const meta = { analystStableKey: "deterministic-subject-xyz" };
    expect(isRhizohPolicyLearningHoldout(meta)).toBe(isRhizohPolicyLearningHoldout(meta));
    vi.unstubAllGlobals();
  });
});
