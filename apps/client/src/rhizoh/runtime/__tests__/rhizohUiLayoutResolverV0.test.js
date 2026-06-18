import { describe, expect, it } from "vitest";
import {
  RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0,
  RHIZOH_UI_SHELL_BAR_H_REM_V0,
  RHIZOH_UI_SURFACE_V0,
  RHIZOH_UI_Z_INDEX_V0,
  buildRhizohUiBottomCalcV0,
  resolveRhizohT0ChatBottomCssV0,
  resolveRhizohUiLayoutV0,
  resolveRhizohWorldSpaceMapStripBottomCssV0,
  resolveRhizohWorldSpaceVoiceDockBottomCssV0
} from "../rhizohUiLayoutResolverV0.js";

describe("rhizohUiLayoutResolverV0", () => {
  it("builds bottom calc with shell bar and safe area", () => {
    const css = buildRhizohUiBottomCalcV0([]);
    expect(css).toContain(`${RHIZOH_UI_SHELL_BAR_H_REM_V0}rem`);
    expect(css).toContain("safe-area-inset-bottom");
  });

  it("T0 chat dock shifts up when product drawer open", () => {
    const closed = resolveRhizohT0ChatBottomCssV0({ drawerOpen: false });
    const open = resolveRhizohT0ChatBottomCssV0({ drawerOpen: true });
    expect(open).toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
    expect(closed).not.toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
  });

  it("world space voice dock shifts up when drawer open", () => {
    const closed = resolveRhizohWorldSpaceVoiceDockBottomCssV0({ drawerOpen: false });
    const open = resolveRhizohWorldSpaceVoiceDockBottomCssV0({ drawerOpen: true });
    expect(open).toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
    expect(closed).not.toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
    expect(open.length).toBeGreaterThan(closed.length);
  });

  it("world space map strip and voice dock share drawer-aware stack", () => {
    const layout = resolveRhizohUiLayoutV0({
      surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
      drawerOpen: true
    });
    expect(layout.bottomCss.mapStrip).toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
    expect(layout.bottomCss.voiceDock).toContain(`${RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0}rem`);
    expect(resolveRhizohWorldSpaceMapStripBottomCssV0({ drawerOpen: true })).toBe(
      layout.bottomCss.mapStrip
    );
  });

  it("exposes stable z-index stack", () => {
    const layout = resolveRhizohUiLayoutV0();
    expect(layout.zIndex.PRODUCT_DRAWER).toBe(RHIZOH_UI_Z_INDEX_V0.PRODUCT_DRAWER);
    expect(layout.zIndex.CAPABILITY_HALO).toBeGreaterThan(layout.zIndex.PRODUCT_SHELL_BAR);
  });

  it("publishes layout snapshot on window", () => {
    resolveRhizohUiLayoutV0({ surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE });
    expect(window.__rhizoh?.uiLayout?.schema).toBe("rhizoh.ui_layout_resolver.v0");
  });
});
