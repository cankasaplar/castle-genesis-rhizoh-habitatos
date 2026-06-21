/**
 * UI layout resolver v0 — z-index + bottom offset SSOT (T0 + World · Space).
 * RESEARCH-ONLY presentation layer; no execution authority.
 *
 * Replaces scattered calc() for product shell bar, drawer, map strip, voice/chat dock.
 */

export const RHIZOH_UI_LAYOUT_SCHEMA_V0 = "rhizoh.ui_layout_resolver.v0";

/** Product shell bar (`UnifiedProductShellBar`) fixed height. */
export const RHIZOH_UI_SHELL_BAR_H_REM_V0 = 3.35;

/** Bottom product drawer approximate height reserve when open (must match drawer max-h). */
export const RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0 = 21;

/** Map tool strip height estimate (rem above bottom stack). */
export const RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0 = 4.25;

/** Expanded map strip (marker filters + data footer). */
export const RHIZOH_UI_MAP_STRIP_EXPANDED_REM_V0 = 7.25;

/** Gap between map strip and voice dock on World · Space. */
export const RHIZOH_UI_VOICE_DOCK_GAP_REM_V0 = 0.75;

/** Gap above shell bar for map strip on World · Space. */
export const RHIZOH_UI_MAP_STRIP_GAP_REM_V0 = 0.35;

/** @deprecated toggle strip removed — kept for continuity rail callers. */
export const RHIZOH_UI_CHROME_TOGGLE_STRIP_H_REM_V0 = 0;

export const RHIZOH_UI_SURFACE_V0 = Object.freeze({
  T0_LIVE: "t0_live",
  WORLD_SPACE: "world_space"
});

/** Fixed z-index stack — higher = closer to user. */
export const RHIZOH_UI_Z_INDEX_V0 = Object.freeze({
  MAP_HOST: 1,
  WORLD_DOMAIN_SHELL: 20,
  /** @deprecated use CONVERSATION_DOCK for T0 + World · Space voice/chat shells */
  VOICE_DOCK: 24,
  MAP_HINT: 25,
  MAP_OVERLAY: 26,
  NODE_PANEL: 27,
  C2C_PANEL: 28,
  PRODUCT_DRAWER: 70,
  CONTINUITY_RAIL: 58,
  PRODUCT_SHELL_BAR: 61,
  /** T0 chat dock + World · Space voice dock — above product shell bar */
  CONVERSATION_DOCK: 64,
  CAPABILITY_TOOL_STRIP: 67,
  CAPABILITY_HALO: 68,
  MEDIA_TUBE: 315
});

const SAFE_AREA_BOTTOM_V0 = "env(safe-area-inset-bottom, 0px)";

/**
 * @param {number[]} remParts — positive rem offsets (drawer, strip, gaps)
 * @returns {string}
 */
export function buildRhizohUiBottomCalcV0(remParts = []) {
  const terms = [RHIZOH_UI_SHELL_BAR_H_REM_V0, ...remParts.filter((n) => Number(n) > 0)].map(
    (n) => `${n}rem`
  );
  terms.push(SAFE_AREA_BOTTOM_V0);
  return `calc(${terms.join(" + ")})`;
}

/**
 * @param {{
 *   surface?: string,
 *   drawerOpen?: boolean,
 *   mapStripExpanded?: boolean,
 *   publish?: boolean
 * }} [ctx]
 */
export function resolveRhizohUiLayoutV0(ctx = {}) {
  const surface =
    String(ctx.surface || "").trim() === RHIZOH_UI_SURFACE_V0.WORLD_SPACE
      ? RHIZOH_UI_SURFACE_V0.WORLD_SPACE
      : RHIZOH_UI_SURFACE_V0.T0_LIVE;
  const drawerOpen = ctx.drawerOpen === true;
  const drawerRem = drawerOpen ? RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0 : 0;
  const onWorldSpace = surface === RHIZOH_UI_SURFACE_V0.WORLD_SPACE;
  const mapStripRem = onWorldSpace ? RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0 : 0;
  const mapStripExpandedRem = onWorldSpace
    ? ctx.mapStripExpanded === true
      ? RHIZOH_UI_MAP_STRIP_EXPANDED_REM_V0
      : RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0
    : 0;

  const drawerStackRem = drawerRem;
  const mapStripStack = onWorldSpace
    ? [RHIZOH_UI_MAP_STRIP_GAP_REM_V0, drawerStackRem]
    : [drawerStackRem];
  const voiceDockStack = onWorldSpace
    ? [mapStripRem, RHIZOH_UI_VOICE_DOCK_GAP_REM_V0, drawerStackRem]
    : [drawerStackRem];
  const chatDockStack = [drawerStackRem];
  const conversationDockStack = onWorldSpace ? voiceDockStack : chatDockStack;
  const mapOverlayStack = onWorldSpace
    ? [mapStripExpandedRem, 0.5, drawerStackRem]
    : [drawerStackRem];

  const layout = Object.freeze({
    schema: RHIZOH_UI_LAYOUT_SCHEMA_V0,
    surface,
    drawerOpen,
    mapStripExpanded: ctx.mapStripExpanded === true,
    rem: Object.freeze({
      shellBar: RHIZOH_UI_SHELL_BAR_H_REM_V0,
      drawer: drawerRem,
      mapStrip: mapStripRem,
      mapStripExpanded: mapStripExpandedRem
    }),
    zIndex: RHIZOH_UI_Z_INDEX_V0,
    bottomCss: Object.freeze({
      productShellBar: buildRhizohUiBottomCalcV0([]),
      productDrawer: buildRhizohUiBottomCalcV0([]),
      continuityRail: buildRhizohUiBottomCalcV0([RHIZOH_UI_CHROME_TOGGLE_STRIP_H_REM_V0]),
      mapStrip: buildRhizohUiBottomCalcV0(mapStripStack),
      voiceDock: buildRhizohUiBottomCalcV0(voiceDockStack),
      chatDock: buildRhizohUiBottomCalcV0(chatDockStack),
      conversationDock: buildRhizohUiBottomCalcV0(conversationDockStack),
      mapOverlay: buildRhizohUiBottomCalcV0(mapOverlayStack)
    }),
    atMs: Date.now()
  });

  if (typeof window !== "undefined" && ctx.publish === true) {
    publishRhizohUiLayoutSnapshotV0(layout);
  }

  return layout;
}

/** Publish authoritative layout snapshot for DevTools (does not recompute). */
export function publishRhizohUiLayoutSnapshotV0(layout) {
  if (typeof window === "undefined" || !layout) return layout;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.uiLayout = layout;
  return layout;
}

/** Read drawer-aware World · Space layout from drawer state machine SSOT. */
export function resolveRhizohWorldSpaceUiLayoutFromDrawerV0(drawerOpen = false, extra = {}) {
  return resolveRhizohUiLayoutV0({
    surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
    drawerOpen: drawerOpen === true,
    ...extra,
    publish: true
  });
}

/** T0 live chat dock bottom offset. */
export function resolveRhizohT0ChatBottomCssV0(opts = {}) {
  return resolveRhizohConversationDockBottomCssV0({
    surface: RHIZOH_UI_SURFACE_V0.T0_LIVE,
    drawerOpen: opts.drawerOpen === true
  });
}

/** World · Space map tool strip bottom. */
export function resolveRhizohWorldSpaceMapStripBottomCssV0(opts = {}) {
  return resolveRhizohUiLayoutV0({
    surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
    drawerOpen: opts.drawerOpen === true,
    mapStripExpanded: opts.mapStripExpanded === true
  }).bottomCss.mapStrip;
}

/** World · Space voice dock bottom. */
export function resolveRhizohWorldSpaceVoiceDockBottomCssV0(opts = {}) {
  return resolveRhizohConversationDockBottomCssV0({
    surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
    drawerOpen: opts.drawerOpen === true,
    mapStripExpanded: opts.mapStripExpanded === true
  });
}

/**
 * Unified conversation dock bottom — T0 chat + World · Space voice dock (A5 SSOT).
 * @param {{
 *   surface?: string,
 *   drawerOpen?: boolean,
 *   mapStripExpanded?: boolean
 * }} [ctx]
 */
export function resolveRhizohConversationDockBottomCssV0(ctx = {}) {
  const layout = resolveRhizohUiLayoutV0({
    surface:
      String(ctx.surface || "").trim() === RHIZOH_UI_SURFACE_V0.WORLD_SPACE
        ? RHIZOH_UI_SURFACE_V0.WORLD_SPACE
        : RHIZOH_UI_SURFACE_V0.T0_LIVE,
    drawerOpen: ctx.drawerOpen === true,
    mapStripExpanded: ctx.mapStripExpanded === true
  });
  return layout.bottomCss.conversationDock;
}

/**
 * Shell wrapper layout for RhizohT0ShellChromeV1 + RhizohWorldSpaceVoiceDockV0.
 * @param {{
 *   surface?: string,
 *   drawerOpen?: boolean,
 *   mapStripExpanded?: boolean,
 *   publish?: boolean
 * }} [ctx]
 */
export function resolveRhizohConversationDockShellLayoutV0(ctx = {}) {
  const layout = resolveRhizohUiLayoutV0({
    surface:
      String(ctx.surface || "").trim() === RHIZOH_UI_SURFACE_V0.WORLD_SPACE
        ? RHIZOH_UI_SURFACE_V0.WORLD_SPACE
        : RHIZOH_UI_SURFACE_V0.T0_LIVE,
    drawerOpen: ctx.drawerOpen === true,
    mapStripExpanded: ctx.mapStripExpanded === true,
    publish: ctx.publish === true
  });
  return Object.freeze({
    schema: RHIZOH_UI_LAYOUT_SCHEMA_V0,
    surface: layout.surface,
    drawerOpen: layout.drawerOpen,
    bottomCss: layout.bottomCss.conversationDock,
    zIndex: RHIZOH_UI_Z_INDEX_V0.CONVERSATION_DOCK,
    rem: layout.rem
  });
}

/** World · Space left/right map overlays (event stream). */
export function resolveRhizohWorldSpaceMapOverlayBottomCssV0(opts = {}) {
  return resolveRhizohUiLayoutV0({
    surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
    drawerOpen: opts.drawerOpen === true,
    mapStripExpanded: opts.mapStripExpanded !== false
  }).bottomCss.mapOverlay;
}

/** Product drawer panel bottom (sits on shell bar). */
export function resolveRhizohProductDrawerBottomCssV0() {
  return buildRhizohUiBottomCalcV0([]);
}

/** Capability halo fixed top-right layout (T0). */
export function resolveRhizohT0CapabilityHaloLayoutV0() {
  return Object.freeze({
    position: "fixed",
    top: "max(12px, env(safe-area-inset-top, 0px))",
    right: "max(12px, env(safe-area-inset-right, 0px))",
    left: "auto",
    bottom: "auto",
    transform: "none",
    zIndex: RHIZOH_UI_Z_INDEX_V0.CAPABILITY_HALO
  });
}
