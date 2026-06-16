import { describe, expect, it, beforeEach } from "vitest";
import {
  isRhizohCatchUpReplayActiveV0,
  setRhizohCatchUpReplayActiveV0,
  __resetRhizohCatchUpGuardForTestV0
} from "../rhizohCatchUpGuardV0.js";

describe("rhizohCatchUpGuardV0", () => {
  beforeEach(() => {
    __resetRhizohCatchUpGuardForTestV0();
    window.__rhizoh = {};
  });

  it("returns false when no catch-up active", () => {
    expect(isRhizohCatchUpReplayActiveV0()).toBe(false);
  });

  it("returns true when depth counter is active", () => {
    setRhizohCatchUpReplayActiveV0(true);
    expect(isRhizohCatchUpReplayActiveV0()).toBe(true);
    setRhizohCatchUpReplayActiveV0(false);
    expect(isRhizohCatchUpReplayActiveV0()).toBe(false);
  });

  it("returns true when window catchUpCascade.active is set", () => {
    window.__rhizoh.catchUpCascade = Object.freeze({ active: true });
    expect(isRhizohCatchUpReplayActiveV0()).toBe(true);
  });

  it("supports nested catch-up depth", () => {
    setRhizohCatchUpReplayActiveV0(true);
    setRhizohCatchUpReplayActiveV0(true);
    setRhizohCatchUpReplayActiveV0(false);
    expect(isRhizohCatchUpReplayActiveV0()).toBe(true);
    setRhizohCatchUpReplayActiveV0(false);
    expect(isRhizohCatchUpReplayActiveV0()).toBe(false);
  });
});
