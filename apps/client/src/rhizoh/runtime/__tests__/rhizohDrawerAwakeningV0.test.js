import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bootDrawerAwakeningV0,
  isDrawerModuleAwakenedV0,
  listAwakenedDrawerModulesV0,
  resetDrawerAwakeningForTestV0,
  setDrawerModuleAwakenedV0,
  shouldOpenDrawerInPlaceV0
} from "../rhizohDrawerAwakeningV0.js";

describe("rhizohDrawerAwakeningV0", () => {
  beforeEach(() => {
    resetDrawerAwakeningForTestV0();
  });

  afterEach(() => {
    resetDrawerAwakeningForTestV0();
  });

  it("boots with all product drawers awake by default", () => {
    bootDrawerAwakeningV0();
    expect(isDrawerModuleAwakenedV0("studio")).toBe(true);
    expect(isDrawerModuleAwakenedV0("hall")).toBe(true);
    expect(listAwakenedDrawerModulesV0()).toEqual([
      "hall",
      "greenroom",
      "broadcast",
      "studio",
      "profile"
    ]);
  });

  it("shouldOpenDrawerInPlaceV0 is false for world", () => {
    bootDrawerAwakeningV0();
    expect(shouldOpenDrawerInPlaceV0("world")).toBe(false);
    expect(shouldOpenDrawerInPlaceV0("studio")).toBe(true);
  });

  it("setDrawerModuleAwakenedV0 can sleep a module", () => {
    bootDrawerAwakeningV0();
    setDrawerModuleAwakenedV0("broadcast", false);
    expect(isDrawerModuleAwakenedV0("broadcast")).toBe(false);
    expect(shouldOpenDrawerInPlaceV0("broadcast")).toBe(false);
  });
});
