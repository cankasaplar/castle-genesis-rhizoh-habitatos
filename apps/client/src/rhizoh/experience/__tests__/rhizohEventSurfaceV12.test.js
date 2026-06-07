import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRhizohEventSurfaceForTestV12,
  attachRhizohEventToExperienceSessionV12,
  buildRhizohEventInviteLinkV12,
  createRhizohEventV12,
  joinRhizohEventIntoExperienceSessionV12,
  loadRhizohEventRecordV12,
  mapEventTypeToLifecycleV12,
  RHIZOH_EVENT_TYPE_V12,
  RHIZOH_EVENT_VISIBILITY_V12
} from "../rhizohEventSurfaceV12.js";
import {
  __resetRhizohExperienceSessionContextForTestV0,
  applyExperienceJoinParamsV0,
  createInitialRhizohExperienceSessionContextV0
} from "../rhizohExperienceSessionContextV0.js";
import { SESSION_LIFECYCLE_V0 } from "../../../castleSocial/castleSessionLifecycleV0.js";

describe("rhizohEventSurfaceV12", () => {
  afterEach(() => {
    __resetRhizohEventSurfaceForTestV12();
    __resetRhizohExperienceSessionContextForTestV0();
  });

  it("createRhizohEventV12 produces invite link and session binding without execution keys", () => {
    const ctx = createInitialRhizohExperienceSessionContextV0();
    const out = createRhizohEventV12({
      title: "Friday live",
      type: RHIZOH_EVENT_TYPE_V12.CONCERT,
      experienceSessionId: ctx.experienceSessionId,
      productSessionId: "rs_test123"
    });
    expect(out.ok).toBe(true);
    expect(out.eventId).toMatch(/^evt_/);
    expect(out.inviteLink).toContain("event=");
    expect(out.inviteLink).toContain("invite=");
    expect(out.record.visibility).toBe(RHIZOH_EVENT_VISIBILITY_V12.INVITE_ONLY);
    expect(out.instance.ok).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/routeCesium|executionGraph|router/i);
  });

  it("maps event types to lifecycle contract values", () => {
    expect(mapEventTypeToLifecycleV12(RHIZOH_EVENT_TYPE_V12.LIVE)).toBe(SESSION_LIFECYCLE_V0.LIVE);
    expect(mapEventTypeToLifecycleV12(RHIZOH_EVENT_TYPE_V12.SCHEDULED)).toBe(
      SESSION_LIFECYCLE_V0.SCHEDULED
    );
    expect(mapEventTypeToLifecycleV12(RHIZOH_EVENT_TYPE_V12.CONCERT)).toBe(SESSION_LIFECYCLE_V0.LIVE);
  });

  it("attachRhizohEventToExperienceSessionV12 merges into same experience session", () => {
    const ctx = createInitialRhizohExperienceSessionContextV0();
    const created = createRhizohEventV12({
      title: "Visit",
      type: RHIZOH_EVENT_TYPE_V12.VISIT,
      experienceSessionId: ctx.experienceSessionId
    });
    const merged = attachRhizohEventToExperienceSessionV12(ctx, created.record);
    expect(merged.experienceSessionId).toBe(ctx.experienceSessionId);
    expect(merged.eventId).toBe(created.eventId);
    expect(merged.lastTransition).toBe("event_create");
  });

  it("joinRhizohEventIntoExperienceSessionV12 restores lifecycle from catalog", () => {
    const ctx = createInitialRhizohExperienceSessionContextV0();
    const created = createRhizohEventV12({
      title: "Scheduled poster",
      type: RHIZOH_EVENT_TYPE_V12.SCHEDULED,
      experienceSessionId: ctx.experienceSessionId
    });
    const joined = joinRhizohEventIntoExperienceSessionV12(
      ctx,
      created.eventId,
      created.inviteToken
    );
    expect(joined.eventId).toBe(created.eventId);
    expect(joined.eventLifecycle).toBe(SESSION_LIFECYCLE_V0.SCHEDULED);
    expect(joined.lastTransition).toBe("invite_join");
  });

  it("applyExperienceJoinParamsV0 uses event catalog for lifecycle", () => {
    const ctx = createInitialRhizohExperienceSessionContextV0();
    const created = createRhizohEventV12({
      title: "Live room",
      type: RHIZOH_EVENT_TYPE_V12.LIVE,
      experienceSessionId: ctx.experienceSessionId
    });
    const joined = applyExperienceJoinParamsV0(ctx, {
      eventId: created.eventId,
      inviteToken: created.inviteToken
    });
    expect(joined.eventLifecycle).toBe(SESSION_LIFECYCLE_V0.LIVE);
    expect(loadRhizohEventRecordV12(created.eventId)?.title).toBe("Live room");
  });

  it("buildRhizohEventInviteLinkV12 uses event and invite query params", () => {
    const link = buildRhizohEventInviteLinkV12("evt_abc", "tok123", "https://rhizoh.com");
    expect(link).toBe("https://rhizoh.com/?event=evt_abc&invite=tok123");
  });
});
