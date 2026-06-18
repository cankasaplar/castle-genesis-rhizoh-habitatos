import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveT0DetailDrawerVisibleV0,
  runT0ProductShellSelectV0,
  bootRhizohT0DrawerShellV0
} from "../rhizohT0DrawerShellIntegrationV0.js";
import {
  __resetDrawerStateSnapshotCacheForTestV0,
  __resetDrawerTransitionQueueForTestV0
} from "../rhizohDrawerStateMachineV0.js";
import { closeAllRhizohProductSurfacePanelsV0 } from "../rhizohProductChromePanelsV0.js";

describe("rhizohT0DrawerShellIntegrationV0", () => {
  beforeEach(() => {
    __resetDrawerStateSnapshotCacheForTestV0();
    __resetDrawerTransitionQueueForTestV0();
    closeAllRhizohProductSurfacePanelsV0();
    bootRhizohT0DrawerShellV0();
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  });

  it("opens studio drawer in-place on T0 pathname", () => {
    const opened = [];
    runT0ProductShellSelectV0("studio", {
      pathname: "/",
      onDrawerOpened: (surface) => opened.push(surface)
    });
    expect(opened).toEqual(["studio"]);
  });

  it("closes studio drawer on second toggle", () => {
    runT0ProductShellSelectV0("studio", { pathname: "/" });
    const closed = [];
    runT0ProductShellSelectV0("studio", {
      pathname: "/",
      onDrawerClosed: (surface) => closed.push(surface)
    });
    expect(closed).toEqual(["studio"]);
  });

  it("routes world select through state machine close_all", () => {
    runT0ProductShellSelectV0("studio", { pathname: "/" });
    let worldPayload = null;
    runT0ProductShellSelectV0("world", {
      pathname: "/",
      resolveWorldTargetPath: () => "/world/space",
      onWorldSelect: (payload) => {
        worldPayload = payload;
      }
    });
    expect(worldPayload?.targetPath).toBe("/world/space");
    expect(worldPayload?.transition.action).toBe("close_all");
  });

  it("hides legacy detail drawer when product drawer is open", () => {
    expect(resolveT0DetailDrawerVisibleV0(true, "studio")).toBe(false);
    expect(resolveT0DetailDrawerVisibleV0(true, null)).toBe(true);
  });
});
