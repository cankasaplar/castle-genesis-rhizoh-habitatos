import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeProductSurfaceDrawerV0,
  DRAWER_SHELL_ACTION_V0,
  getDrawerStateSnapshotV0,
  handleProductShellSelectV0
} from "../rhizohDrawerStateMachineV0.js";
import { resetDrawerAwakeningForTestV0 } from "../rhizohDrawerAwakeningV0.js";
import {
  setRhizohProductSurfacePanelExclusiveV0
} from "../rhizohProductChromePanelsV0.js";

describe("rhizohDrawerStateMachineV0", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDrawerAwakeningForTestV0();
  });

  afterEach(() => {
    localStorage.clear();
    resetDrawerAwakeningForTestV0();
  });

  it("handleProductShellSelectV0 toggles drawer in-place when awakened", () => {
    const r1 = handleProductShellSelectV0("studio", { pathname: "/world/space", inPlace: true });
    expect(r1.action).toBe(DRAWER_SHELL_ACTION_V0.TOGGLE_DRAWER);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe("studio");

    const r2 = handleProductShellSelectV0("studio", { pathname: "/world/space", inPlace: true });
    expect(r2.action).toBe(DRAWER_SHELL_ACTION_V0.TOGGLE_DRAWER);
    expect(r2.toggled?.closed).toBe(true);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
  });

  it("closeProductSurfaceDrawerV0 closes open drawer", () => {
    setRhizohProductSurfacePanelExclusiveV0("hall", true);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe("hall");
    closeProductSurfaceDrawerV0();
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
  });

  it("world selection closes all panels", () => {
    setRhizohProductSurfacePanelExclusiveV0("broadcast", true);
    const r = handleProductShellSelectV0("world", { pathname: "/world/space", inPlace: true });
    expect(r.action).toBe(DRAWER_SHELL_ACTION_V0.CLOSE_ALL);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
  });
});
