import React, { memo } from "react";
import { resolveConversationContinuityStripCopyV1 } from "../rhizoh/experience/rhizohLivingConversationSurfaceV1.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * User-visible conversation session continuity — not world observation pulse.
 */
export const RhizohConversationContinuityStripV1 = memo(function RhizohConversationContinuityStripV1({
  continuitySnap = null,
  uiLocale
}) {
  if (!continuitySnap) return null;
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const line = resolveConversationContinuityStripCopyV1(tr, continuitySnap);

  return (
    <div
      className="mx-1 mb-2 rounded-lg border border-emerald-400/20 bg-emerald-950/25 px-3 py-1.5 text-[9px] text-emerald-100/90 normal-case"
      data-rhizoh-conversation-continuity="1"
      role="status"
      aria-live="polite"
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90 align-middle" />
      {line}
    </div>
  );
});
