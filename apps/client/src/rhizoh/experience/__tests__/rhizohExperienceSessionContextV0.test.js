import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetRhizohExperienceSessionContextForTestV0,
  applyExperienceJoinParamsV0,
  buildRhizohExperienceSessionContextV0,
  createInitialRhizohExperienceSessionContextV0,
  digestExperienceSessionSnapshotV0,
  loadRhizohExperienceSessionContextV0,
  parseExperienceJoinParamsV0,
  patchRhizohExperienceSessionContextV0,
  saveRhizohExperienceSessionContextV0
} from "../rhizohExperienceSessionContextV0.js";

describe("rhizohExperienceSessionContextV0", () => {
  afterEach(() => {
    __resetRhizohExperienceSessionContextForTestV0();
  });

  it("creates stable experience session id separate from product session", () => {
    const ctx = createInitialRhizohExperienceSessionContextV0();
    expect(ctx.experienceSessionId).toMatch(/^exp_/);
    expect(ctx.schema).toBe("castle.rhizoh_experience_session_context.v0");
    expect(ctx.readOnly).toBe(true);
  });

  it("patches without losing experienceSessionId across surface transitions", () => {
    const base = buildRhizohExperienceSessionContextV0({
      experienceSessionId: "exp_test",
      productSurface: "world",
      fieldState: "IDLE",
      voiceActive: false
    });
    const voice = patchRhizohExperienceSessionContextV0(base, {
      voiceActive: true,
      fieldState: "LISTENING"
    });
    expect(voice.experienceSessionId).toBe("exp_test");
    expect(voice.lastTransition).toBe("chat_to_voice");

    const map = patchRhizohExperienceSessionContextV0(voice, {
      mapSurfaceActive: true,
      worldMapTool: "globe"
    });
    expect(map.experienceSessionId).toBe("exp_test");
    expect(map.voiceActive).toBe(true);
    expect(map.mapSurfaceActive).toBe(true);
  });

  it("persists to localStorage and reloads", () => {
    const saved = saveRhizohExperienceSessionContextV0(
      buildRhizohExperienceSessionContextV0({
        experienceSessionId: "exp_persist",
        productSurface: "studio",
        fieldState: "GENERATING"
      })
    );
    expect(saved.productSurface).toBe("studio");
    const loaded = loadRhizohExperienceSessionContextV0();
    expect(loaded.experienceSessionId).toBe("exp_persist");
    expect(loaded.fieldState).toBe("GENERATING");
  });

  it("digestExperienceSessionSnapshotV0 is deterministic", () => {
    const snap = { productSurface: "world", fieldState: "IDLE", voiceActive: false };
    expect(digestExperienceSessionSnapshotV0(snap)).toBe(
      digestExperienceSessionSnapshotV0(snap)
    );
  });

  it("parseExperienceJoinParamsV0 reads invite and event query params", () => {
    const join = parseExperienceJoinParamsV0("?invite=abc123&event=evt_1");
    expect(join.inviteToken).toBe("abc123");
    expect(join.eventId).toBe("evt_1");
  });

  it("applyExperienceJoinParamsV0 prepares event join without execution fields", () => {
    const ctx = applyExperienceJoinParamsV0(createInitialRhizohExperienceSessionContextV0(), {
      inviteToken: "tok",
      eventId: "evt_live"
    });
    expect(ctx.eventId).toBe("evt_live");
    expect(ctx.inviteToken).toBe("tok");
    expect(ctx.lastTransition).toBe("invite_join");
    expect(JSON.stringify(ctx)).not.toMatch(/routeCesium|executorOp/i);
  });

  it("does not expose execution graph keys on context", () => {
    const ctx = patchRhizohExperienceSessionContextV0(null, {
      productSurface: "world",
      fieldState: "EXECUTING"
    });
    expect(ctx).not.toHaveProperty("executionGraph");
    expect(ctx).not.toHaveProperty("router");
  });
});
