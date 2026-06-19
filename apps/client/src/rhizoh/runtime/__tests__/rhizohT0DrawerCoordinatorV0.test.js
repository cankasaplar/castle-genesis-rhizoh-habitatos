import { describe, expect, it, beforeEach } from "vitest";
import {
  applyT0DetailDrawerTogglePlanV0,
  planT0DetailDrawerToggleV0,
  resolveT0DrawerCoordinatorStateV0
} from "../rhizohT0DrawerCoordinatorV0.js";
import {
  __resetDrawerStateSnapshotCacheForTestV0,
  __resetDrawerTransitionQueueForTestV0
} from "../rhizohDrawerStateMachineV0.js";
import { closeAllRhizohProductSurfacePanelsV0 } from "../rhizohProductChromePanelsV0.js";
import {
  bootRhizohT0DrawerShellV0,
  toggleT0DetailDrawerCoordinatedV0
} from "../rhizohT0DrawerShellIntegrationV0.js";
import { runT0ProductShellSelectV0 } from "../rhizohT0DrawerShellIntegrationV0.js";

describe("rhizohT0DrawerCoordinatorV0", () => {
  beforeEach(() => {
    __resetDrawerStateSnapshotCacheForTestV0();
    __resetDrawerTransitionQueueForTestV0();
    closeAllRhizohProductSurfacePanelsV0();
    bootRhizohT0DrawerShellV0();
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  });

  it("mutually excludes product and detail drawers", () => {
    expect(
      resolveT0DrawerCoordinatorStateV0({
        detailRequested: true,
        openSurfaceDrawerId: "studio"
      }).detailDrawerVisible
    ).toBe(false);
    expect(
      resolveT0DrawerCoordinatorStateV0({
        detailRequested: true,
        openSurfaceDrawerId: null
      }).detailDrawerVisible
    ).toBe(true);
  });

  it("closes product drawer before opening detail", () => {
    runT0ProductShellSelectV0("studio", { pathname: "/" });
    const plan = planT0DetailDrawerToggleV0({
      detailRequested: false,
      openSurfaceDrawerId: "studio"
    });
    expect(plan.action).toBe("close_product_then_open_detail");
    expect(applyT0DetailDrawerTogglePlanV0(plan)).toBe(true);
  });

  it("toggle helper coordinates with open product drawer", () => {
    runT0ProductShellSelectV0("studio", { pathname: "/" });
    expect(toggleT0DetailDrawerCoordinatedV0(false, "studio")).toBe(true);
  });
});
