import { describe, it, expect } from "vitest";
import { buildRhizohAccessLayer, isPremiumEntitlement, normalizeMembershipDoc } from "../membershipCoreV1.js";

describe("membershipCoreV1", () => {
  it("normalizeMembershipDoc defaults when missing", () => {
    const m = normalizeMembershipDoc(null);
    expect(m.membershipPlan).toBe("free");
    expect(m.subscriptionStatus).toBe("none");
  });

  it("isPremiumEntitlement respects active premium", () => {
    expect(
      isPremiumEntitlement(
        normalizeMembershipDoc({ membershipPlan: "premium", subscriptionStatus: "active" })
      )
    ).toBe(true);
    expect(
      isPremiumEntitlement(
        normalizeMembershipDoc({ membershipPlan: "premium", subscriptionStatus: "canceled" })
      )
    ).toBe(false);
  });

  it("buildRhizohAccessLayer scales caps for premium", () => {
    const free = buildRhizohAccessLayer({ membershipPlan: "free", subscriptionStatus: "none" });
    const prem = buildRhizohAccessLayer({ membershipPlan: "premium", subscriptionStatus: "active" });
    expect(free.ghostEvolutionStageCap).toBeLessThan(prem.ghostEvolutionStageCap);
    expect(free.presenceInfluenceWeight).toBeLessThan(prem.presenceInfluenceWeight);
    expect(free.liveStreamParticipation).toBe("observe");
    expect(prem.liveStreamParticipation).toBe("influence");
  });
});
