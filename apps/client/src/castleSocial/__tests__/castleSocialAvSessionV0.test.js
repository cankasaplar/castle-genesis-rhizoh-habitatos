import { describe, expect, it, beforeEach } from "vitest";
import { SESSION_LIFECYCLE_V0 } from "../castleSessionLifecycleV0.js";
import {
  createCastleSocialAvSessionV0,
  endCastleSocialAvSessionV0,
  patchCastleSocialAvSessionV0,
  promoteCastleSocialAvSessionLiveV0,
  readCastleSocialAvSessionV0,
  resetCastleSocialAvSessionForTestsV0
} from "../castleSocialAvSessionV0.js";

describe("castleSocialAvSessionV0", () => {
  beforeEach(() => {
    resetCastleSocialAvSessionForTestsV0();
  });

  it("creates DRAFT then promotes to LIVE", () => {
    const draft = createCastleSocialAvSessionV0({ roomKey: "test-room" });
    expect(draft.lifecycle).toBe(SESSION_LIFECYCLE_V0.DRAFT);
    const live = promoteCastleSocialAvSessionLiveV0(draft);
    expect(live?.lifecycle).toBe(SESSION_LIFECYCLE_V0.LIVE);
  });

  it("blocks mic patch before LIVE", () => {
    const draft = createCastleSocialAvSessionV0();
    const blocked = patchCastleSocialAvSessionV0(draft, { micActive: true });
    expect(blocked.ok).toBe(false);
  });

  it("allows mic patch after LIVE", () => {
    const draft = createCastleSocialAvSessionV0();
    promoteCastleSocialAvSessionLiveV0(draft);
    const patched = patchCastleSocialAvSessionV0(readCastleSocialAvSessionV0(), {
      micActive: true
    });
    expect(patched.ok).toBe(true);
    expect(readCastleSocialAvSessionV0()?.micActive).toBe(true);
  });

  it("ends session", () => {
    createCastleSocialAvSessionV0();
    endCastleSocialAvSessionV0();
    expect(readCastleSocialAvSessionV0()).toBeNull();
  });
});
