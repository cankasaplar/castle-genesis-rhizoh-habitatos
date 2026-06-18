import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  claimRhizohEngineBootV0,
  isRhizohEngineBootedV0,
  releaseRhizohEngineBootV0
} from "../rhizohEngineBootGuardV0.js";

describe("rhizohEngineBootGuardV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
  });

  afterEach(() => {
    delete window.__rhizoh;
  });

  it("claims boot once per cycle", () => {
    expect(claimRhizohEngineBootV0()).toBe(true);
    expect(isRhizohEngineBootedV0()).toBe(true);
    expect(claimRhizohEngineBootV0()).toBe(false);
  });

  it("releases boot for remount", () => {
    claimRhizohEngineBootV0();
    releaseRhizohEngineBootV0();
    expect(isRhizohEngineBootedV0()).toBe(false);
    expect(claimRhizohEngineBootV0()).toBe(true);
  });
});
