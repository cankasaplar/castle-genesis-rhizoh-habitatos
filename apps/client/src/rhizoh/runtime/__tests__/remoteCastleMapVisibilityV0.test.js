import { describe, expect, it, beforeEach } from "vitest";
import {
  readRemoteCastlesVisibleV0,
  writeRemoteCastlesVisibleV0,
  REMOTE_CASTLES_VISIBLE_LS_KEY_V0
} from "../remoteCastleMapVisibilityV0.js";

describe("remoteCastleMapVisibilityV0", () => {
  beforeEach(() => {
    window.localStorage.removeItem(REMOTE_CASTLES_VISIBLE_LS_KEY_V0);
  });

  it("defaults to hidden (opt-in)", () => {
    expect(readRemoteCastlesVisibleV0()).toBe(false);
  });

  it("persists visibility toggle", () => {
    writeRemoteCastlesVisibleV0(true);
    expect(readRemoteCastlesVisibleV0()).toBe(true);
    writeRemoteCastlesVisibleV0(false);
    expect(readRemoteCastlesVisibleV0()).toBe(false);
  });
});
