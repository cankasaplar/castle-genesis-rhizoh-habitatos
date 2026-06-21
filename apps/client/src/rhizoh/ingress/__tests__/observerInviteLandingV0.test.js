import { describe, expect, it, beforeEach } from "vitest";
import {
  buildCausalSnapshotTimelineV0,
  buildObserverInviteUrlV0,
  clearObserverInviteSkipAutoMediaV0,
  dispatchObserverInviteProceedV0,
  parseObserverInviteFromSearchV0,
  parseObserverInviteTokenV0,
  persistObserverInviteContextV0,
  readObserverInviteContextV0,
  isObserverInvitePathV0,
  reviewerIdToInviteSeedV0,
  shouldObserverInviteSkipAutoMediaV0
} from "../observerInviteLandingV0.js";
import { clearEpistemicIdentityContinuityForTestV0 } from "../../runtime/epistemicIdentityContinuityV0.js";
import { clearIdentityManifestProjectionForTestV0 } from "../../runtime/identityManifestProjectionV0.js";
import { __resetIdentityEventLogForTestV0 } from "../../runtime/rhizohIdentityEventLogV0.js";
import { __resetIdentityLifecycleForTestV0 } from "../../runtime/rhizohIdentityLifecycleV0.js";
import { clearClosedAdmissionForTestV0 } from "../closedUserAdmissionEngineV0.js";

describe("observerInviteLandingV0", () => {
  beforeEach(() => {
    clearClosedAdmissionForTestV0();
    clearEpistemicIdentityContinuityForTestV0();
    clearIdentityManifestProjectionForTestV0();
    __resetIdentityEventLogForTestV0();
    __resetIdentityLifecycleForTestV0();
    clearObserverInviteSkipAutoMediaV0();
    sessionStorage.clear();
  });

  it("parses rhizoh_inv token into role + cohort", () => {
    const ctx = parseObserverInviteTokenV0("rhizoh_inv_observer_systems_engineer_42");
    expect(ctx?.cohortId).toBe("observer");
    expect(ctx?.stressClassTarget).toBe("systems_engineer");
    expect(ctx?.role).toBe("observer");
  });

  it("parses legacy cohort=review query", () => {
    const ctx = parseObserverInviteFromSearchV0("?cohort=review&reviewer=friday");
    expect(ctx?.legacyCohort).toBe(true);
    expect(ctx?.reviewerId).toBe("friday");
    expect(ctx?.role).toBe("reviewer");
  });

  it("builds /invite URL with invite param only (no role)", () => {
    const url = buildObserverInviteUrlV0({ cohortId: "demo", seed: 7 });
    expect(url).toContain("/invite");
    expect(url).toContain("invite=rhizoh_inv_");
    expect(url).not.toContain("role=");
    expect(url).not.toContain("reviewer=");
  });

  it("builds opaque reviewer URL via deterministic seed", () => {
    const seed = reviewerIdToInviteSeedV0("friday");
    const url = buildObserverInviteUrlV0({
      cohortId: "review",
      stressClassTarget: "human_explorer",
      seed
    });
    expect(url).toContain("invite=rhizoh_inv_review_human_explorer_");
    expect(url).not.toContain("friday");
  });

  it("persists invite context in sessionStorage", () => {
    const ctx = parseObserverInviteTokenV0("rhizoh_inv_test_human_explorer_1");
    expect(persistObserverInviteContextV0(ctx)).toBe(true);
    expect(readObserverInviteContextV0()?.inviteToken).toBe(ctx.inviteToken);
  });

  it("marks skip-auto-media on proceed dispatch", () => {
    dispatchObserverInviteProceedV0({ target: "/world/space" });
    expect(shouldObserverInviteSkipAutoMediaV0()).toBe(true);
  });

  it("builds causal timeline sorted by atMs", () => {
    const timeline = buildCausalSnapshotTimelineV0({
      nodeCount: 2,
      edgeCount: 1,
      nodes: [],
      causalMapRaw: {
        nodes: [
          { id: "b", kind: "tensor_decision", atMs: 200, label: "late" },
          { id: "a", kind: "domain_transition", atMs: 100, label: "early" }
        ],
        edges: []
      }
    });
    expect(timeline.timeline[0].id).toBe("a");
    expect(timeline.timeline[1].id).toBe("b");
  });

  it("detects invite path", () => {
    expect(isObserverInvitePathV0("/invite")).toBe(true);
    expect(isObserverInvitePathV0("/invite/token")).toBe(true);
    expect(isObserverInvitePathV0("/world/space")).toBe(false);
  });
});
