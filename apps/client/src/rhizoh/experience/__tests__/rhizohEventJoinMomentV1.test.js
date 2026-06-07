import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetRhizohEventJoinMomentForTestV1,
  maybeEmitEventJoinMomentV1
} from "../rhizohEventJoinMomentV1.js";
import { resolveRhizohInviteWelcomeCopyV1 } from "../rhizohExperienceWelcomeV1.js";
import { __resetCohortFunnelForTestV1 } from "../rhizohCohortFunnelRingV1.js";

describe("rhizohEventJoinMomentV1", () => {
  afterEach(() => {
    __resetRhizohEventJoinMomentForTestV1();
    __resetCohortFunnelForTestV1();
  });

  it("emits join moment once per experience+event key", () => {
    const handler = vi.fn();
    window.addEventListener("rhizoh:event-join-moment-v1", handler);
    const ctx = {
      experienceSessionId: "exp_a",
      eventId: "evt_1",
      inviteToken: "tok",
      lastTransition: "invite_join",
      eventLifecycle: "LIVE"
    };
    maybeEmitEventJoinMomentV1(ctx);
    maybeEmitEventJoinMomentV1(ctx);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("rhizoh:event-join-moment-v1", handler);
  });

  it("resolveRhizohInviteWelcomeCopyV1 uses experience language framing", () => {
    const tr = resolveRhizohInviteWelcomeCopyV1(true);
    expect(tr).toContain("ortama girdin");
    expect(tr).toContain("Rhizoh");
  });
});
