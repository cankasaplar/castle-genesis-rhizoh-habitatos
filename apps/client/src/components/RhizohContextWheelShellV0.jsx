import React, { memo, useMemo } from "react";
import { RhizohCapabilityHaloV1 } from "./RhizohCapabilityHaloV1.jsx";
import { resolveRhizohContextWheelPackV0 } from "../rhizoh/runtime/rhizohContextWheelRegistryV0.js";
import { resolveRhizohT0CapabilityHaloLayoutV0 } from "../rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * Fixed top-right contextual wheel — only when World drawer is open.
 * T0 purity: this component renders null when not visible.
 */
export const RhizohContextWheelShellV0 = memo(function RhizohContextWheelShellV0({
  visible,
  layerMode,
  uiLocale,
  onCapNodeIntent,
  onSeedIntent,
  onFocusLayer
}) {
  const locale = uiLocale || readUiLocaleV0();
  const layout = resolveRhizohT0CapabilityHaloLayoutV0();

  const pack = useMemo(
    () => resolveRhizohContextWheelPackV0(layerMode, locale),
    [layerMode, locale]
  );

  if (!visible || !pack.nodes.length) return null;

  return (
    <div
      className="pointer-events-none fixed"
      style={{
        top: layout.top,
        right: layout.right,
        left: layout.left,
        bottom: layout.bottom,
        transform: layout.transform,
        zIndex: layout.zIndex
      }}
      data-rhizoh-context-wheel-shell="1"
      data-rhizoh-context-wheel-mode={layerMode}
    >
      <RhizohCapabilityHaloV1
        anchor="corner"
        suppressWhisper={false}
        className="pointer-events-auto w-[min(220px,38vw)] scale-[0.52] origin-top-right"
        uiLocale={locale}
        nodes={pack.nodes}
        headline={pack.headline}
        intro={pack.intro}
        hideLibrary={pack.hideLibrary}
        onCapNodeIntent={onCapNodeIntent}
        onSeedIntent={onSeedIntent}
        onFocusLayer={onFocusLayer}
      />
    </div>
  );
});
