import React from "react";

/**
 * Next Action Anchor — non-coercive direction pull (ACL v0).
 */
export function RhizohNextActionAnchorV0({ anchor, emphasisOverride, className = "" }) {
  if (!anchor?.line) return null;
  const emphasis = emphasisOverride || anchor.emphasis;
  const high = anchor.busy || emphasis === "high";
  const quiet = emphasis === "quiet";

  return (
    <div
      className={`flex items-center gap-2 ${quiet ? "opacity-70" : ""} ${className}`}
      data-rhizoh-next-action-anchor="1"
      data-emphasis={emphasis}
    >
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          high
            ? "bg-amber-300/90 shadow-[0_0_6px_rgba(252,211,77,0.5)]"
            : quiet
              ? "bg-white/35"
              : "bg-teal-400/80"
        }`}
        aria-hidden
      />
      <p
        className={`text-[9px] font-semibold normal-case tracking-wide ${
          high ? "text-amber-100/95" : quiet ? "text-white/55" : "text-white/88"
        }`}
      >
        {anchor.line}
      </p>
      {!anchor.busy && anchor.intent_hint ? (
        <span className="hidden sm:inline text-[8px] text-white/40 normal-case">
          · {anchor.intent_hint}
        </span>
      ) : null}
    </div>
  );
}
