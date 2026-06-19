import React, { memo, useMemo } from "react";
import {
  RHIZOH_UI_SURFACE_V0,
  resolveRhizohConversationDockShellLayoutV0
} from "../rhizoh/runtime/rhizohUiLayoutResolverV0.js";

/**
 * Shared fixed shell for T0 chat dock + World · Space voice dock (A5 layout SSOT).
 */
export const RhizohConversationDockShellV0 = memo(function RhizohConversationDockShellV0({
  surface = RHIZOH_UI_SURFACE_V0.T0_LIVE,
  drawerOpen = false,
  mapStripExpanded = false,
  publish = false,
  className = "",
  children
}) {
  const shellLayoutV0 = useMemo(
    () =>
      resolveRhizohConversationDockShellLayoutV0({
        surface,
        drawerOpen,
        mapStripExpanded,
        publish
      }),
    [surface, drawerOpen, mapStripExpanded, publish]
  );

  const isWorldSpace = surface === RHIZOH_UI_SURFACE_V0.WORLD_SPACE;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 flex justify-center px-2 sm:px-4 ${className}`.trim()}
      style={{ bottom: shellLayoutV0.bottomCss, zIndex: shellLayoutV0.zIndex }}
      data-rhizoh-conversation-dock-shell={shellLayoutV0.surface}
      data-rhizoh-t0-chat-dock={isWorldSpace ? undefined : "1"}
      data-rhizoh-world-space-voice-dock={isWorldSpace ? "1" : undefined}
    >
      <div className="pointer-events-auto w-full max-w-3xl">{children}</div>
    </div>
  );
});

RhizohConversationDockShellV0.displayName = "RhizohConversationDockShellV0";
