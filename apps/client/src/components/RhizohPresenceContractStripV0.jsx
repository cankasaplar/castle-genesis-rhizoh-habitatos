import { memo, useEffect, useState } from "react";
import { RENDER_AS_V0 } from "../rhizoh/runtime/rhizohOutputContractRouterV0.js";

/**
 * Contract-aware presence strip — renders presence_chip only, never chat bubble.
 */
export const RhizohPresenceContractStripV0 = memo(function RhizohPresenceContractStripV0({
  className = ""
}) {
  const [chip, setChip] = useState(null);

  useEffect(() => {
    const onContract = (ev) => {
      const d = ev?.detail;
      if (!d || d.isChatBubble || d.renderAs === RENDER_AS_V0.CHAT_MESSAGE) return;
      if (d.renderAs !== RENDER_AS_V0.PRESENCE_CHIP && d.renderAs !== RENDER_AS_V0.PRESENCE_PULSE) {
        return;
      }
      setChip({
        phrase: d.phrase,
        kind: d.signature?.kind,
        atMs: d.atMs
      });
    };
    window.addEventListener("rhizoh:output-contract-v0", onContract);
    return () => window.removeEventListener("rhizoh:output-contract-v0", onContract);
  }, []);

  if (!chip?.phrase) return null;

  return (
    <div
      className={className}
      data-rhizoh-presence-contract="1"
      data-rhizoh-render-as="presence_chip"
      role="status"
      aria-live="polite"
      style={{
        fontSize: "0.72rem",
        opacity: 0.82,
        letterSpacing: "0.02em",
        pointerEvents: "none"
      }}
    >
      <span data-rhizoh-presence-kind={chip.kind || "presence"}>{chip.phrase}</span>
    </div>
  );
});
